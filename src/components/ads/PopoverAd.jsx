import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Image, Dimensions, Text, Platform, StatusBar, Linking } from 'react-native';
import { BLACK, WHITE } from '../../constants/color';
import { GETNETWORK } from '../../utils/Network';
import { BASE_URL } from '../../constants/url';
import { HEIGHT, WIDTH } from '../../constants/config';

const { width, height } = Dimensions.get('window');

const PopoverAd = ({ onClose }) => {
  const [visible, setVisible] = useState(true);
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    fetchAdData();
    
    // Clean up any pending timeouts when component unmounts
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCount]);

  const fetchAdData = async () => {
    try {
      setLoading(true);
      console.log(`Fetching popover ad data (attempt ${retryCount + 1}/${maxRetries + 1}) from:`, `${BASE_URL}api/ads/public/mobile/popover`);
      
      let response;
      
      try {
        // First try with GETNETWORK utility
        response = await GETNETWORK(`${BASE_URL}api/ads/public/mobile/popover`);
        console.log('Popover ad API response:', JSON.stringify(response));
      } catch (networkError) {
        console.warn('GETNETWORK failed, trying direct fetch:', networkError);
        
        // If GETNETWORK fails, try with direct fetch
        try {
          const directResponse = await fetch(`${BASE_URL}api/ads/public/mobile/popover`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (directResponse.ok) {
            response = await directResponse.json();
            console.log('Popover ad API response from direct fetch:', JSON.stringify(response));
          } else {
            console.error('Direct fetch failed with status:', directResponse.status);
          }
        } catch (fetchError) {
          console.error('Direct fetch also failed:', fetchError);
        }
      }
      
      if (response && response.success) {
        // Check for nested data structure: data.data[]
        if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          console.log('Found popover ads array, total ads:', response.data.data.length);
          
          // Get active ads for mobile platform with type popover
          const eligibleAds = response.data.data.filter(ad => 
            ad.isActive && ad.platform === 'mobile' && ad.type === 'popover' && ad.imageUrl
          );
          
          if (eligibleAds.length > 0) {
            console.log('Found eligible popover ads:', eligibleAds.length);
            
            // Log all eligible ads dates for debugging
            eligibleAds.forEach((ad, index) => {
              console.log(`Popover Ad ${index + 1}: ID=${ad.id}, Created=${new Date(ad.createdAt).toLocaleString()}`);
            });
            
            // Sort ads by createdAt date (newest first)
            const sortedAds = eligibleAds.sort((a, b) => {
              // Ensure we have valid dates
              const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
              const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
              
              // Check if dates are valid
              const validA = !isNaN(dateA.getTime());
              const validB = !isNaN(dateB.getTime());
              
              // Handle invalid dates
              if (!validA && !validB) return 0;
              if (!validA) return 1;
              if (!validB) return -1;
              
              // Compare valid dates (newest first)
              return dateB.getTime() - dateA.getTime();
            });
            
            // Take the most recent ad
            const mostRecentAd = sortedAds[0];
            
            console.log('Selected most recent popover ad:', JSON.stringify(mostRecentAd));
            console.log('Most recent ad created at:', new Date(mostRecentAd.createdAt).toLocaleString());
            
            // If multiple ads are available, log the second most recent for comparison
            if (sortedAds.length > 1) {
              const secondMostRecent = sortedAds[1];
              console.log('Second most recent ad created at:', new Date(secondMostRecent.createdAt).toLocaleString());
              console.log(`Time difference: ${(new Date(mostRecentAd.createdAt) - new Date(secondMostRecent.createdAt)) / (1000 * 60)} minutes`);
            }
            
            // Process the image URL (handle relative paths)
            let imageUrl = mostRecentAd.imageUrl;
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `${BASE_URL}${imageUrl.substring(1)}`;
            }
            
            console.log('Processed popover image URL:', imageUrl);
            
            setAdData({
              imageUrl: imageUrl,
              redirectUrl: mostRecentAd.redirectUrl
            });
            
            // Reset retry count on success
            setRetryCount(0);
          } else {
            console.log('No eligible popover ads found');
            handleClose(); // Close the modal if no ads are found
          }
        } else {
          console.error('Response does not contain the expected data structure');
          handleClose(); // Close the modal if data structure is unexpected
        }
      } else {
        console.error('Failed to fetch popover ad data');
        handleClose(); // Close the modal on fetch error
      }
    } catch (error) {
      console.error('Error fetching popover ad data:', error);
      handleClose(); // Close the modal on general error
    } finally {
      setLoading(false);
    }
  };

  const retryFetchIfNeeded = () => {
    if (retryCount < maxRetries) {
      console.log(`Scheduling retry ${retryCount + 1}/${maxRetries}...`);
      // Clear any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Set a new timeout with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, delay);
    } else {
      console.log('Max retries reached, giving up on popover ad fetch');
      handleClose(); // Close the modal if max retries reached
    }
  };

  const handleRedirect = async () => {
    if (adData && adData.redirectUrl) {
      try {
        console.log('Opening URL from popover ad:', adData.redirectUrl);
        const canOpen = await Linking.canOpenURL(adData.redirectUrl);
        
        if (canOpen) {
          await Linking.openURL(adData.redirectUrl);
        } else {
          console.error('Cannot open URL:', adData.redirectUrl);
        }
      } catch (error) {
        console.error('Error opening URL from popover ad:', error);
      }
    }
    handleClose(); // Close the modal after redirect attempt
  };

  const handleClose = () => {
    console.log('PopoverAd closing');
    setVisible(false);
    if (onClose) onClose();
  };

  // If no ad data is available or we're still loading, don't show anything
  if (!adData && !loading) {
    return null;
  }

  return (
    <Modal statusBarTranslucent={true} transparent={true} visible={visible} animationType="fade">
      <StatusBar translucent backgroundColor="rgba(0, 0, 0, 0.8)" />
      <View style={styles.container}>
        {adData && adData.imageUrl ? (
          <TouchableOpacity 
            style={styles.imageContainer} 
            activeOpacity={0.9}
            onPress={handleRedirect}
          >
            <Image 
              source={{ uri: adData.imageUrl }} 
              style={styles.fullScreenImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('Error loading popover ad image:', e.nativeEvent.error);
                handleClose(); // Close the modal if image fails to load
              }}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'relative',
    width: WIDTH,
    height: HEIGHT,
  },
  imageContainer: {
    flex: 1,
    width: WIDTH,
    height: HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: WIDTH,
    height: HEIGHT,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: WHITE,
    fontSize: 18,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 40,
    width: 40, 
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: WHITE,
    fontWeight: 'bold',
  }
});

export default PopoverAd; 