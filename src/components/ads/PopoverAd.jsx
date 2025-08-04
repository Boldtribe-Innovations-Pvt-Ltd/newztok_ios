import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Image, Dimensions, Text, Platform, StatusBar, Linking } from 'react-native';
import { BLACK, WHITE } from '../../constants/color';
import { GETNETWORK } from '../../utils/Network';
import { BASE_URL } from '../../constants/url';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PopoverAd = ({ onClose }) => {
  const [visible, setVisible] = useState(true);
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    fetchAdData();
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [retryCount]);

  const fetchAdData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await GETNETWORK(`${BASE_URL}api/ads/public/mobile/popover`);
      
      if (!response || !response.success) {
        throw new Error('Invalid API response');
      }

      let ads = [];
      
      // Handle different response structures
      if (response.data?.data) {
        ads = response.data.data;
      } else if (Array.isArray(response.data)) {
        ads = response.data;
      } else if (response.data) {
        ads = [response.data];
      }

      // Filter active popover ads
      const eligibleAds = ads.filter(ad => 
        ad?.isActive && 
        ad?.platform?.toLowerCase() === 'mobile' && 
        ad?.type?.toLowerCase() === 'popover' && 
        ad?.imageUrl
      );

      if (eligibleAds.length === 0) {
        throw new Error('No eligible ads found');
      }

      // Sort by date and get most recent
      const mostRecentAd = eligibleAds.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )[0];

      // Process image URL
      let imageUrl = mostRecentAd.imageUrl;
      if (imageUrl) {
        // Handle relative paths
        if (imageUrl.startsWith('/')) {
          imageUrl = `${BASE_URL}${imageUrl.substring(1)}`;
        }
        // Ensure HTTPS
        if (imageUrl.startsWith('http://')) {
          imageUrl = imageUrl.replace('http://', 'https://');
        }
      }

      setAdData({
        imageUrl,
        redirectUrl: mostRecentAd.redirectUrl
      });
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching ad:', error);
      setError(error.message);
      
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);
      } else {
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = async () => {
    if (adData?.redirectUrl) {
      try {
        const url = adData.redirectUrl;
        const canOpen = await Linking.canOpenURL(url);
        
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          console.warn('Cannot open URL:', url);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const handleImageError = (error) => {
    console.error('Image loading error:', error);
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar translucent backgroundColor="rgba(0, 0, 0, 0.8)" />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Advertisement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Advertisement Unavailable</Text>
          </View>
        ) : adData?.imageUrl ? (
          <TouchableOpacity 
            style={styles.imageContainer} 
            activeOpacity={0.9}
            onPress={handleRedirect}
          >
            <Image 
              source={{ uri: adData.imageUrl }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
              onError={({ nativeEvent: { error } }) => handleImageError(error)}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.adTextContainer}>
            <Text style={styles.adText}>ADVERTISEMENT</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: WHITE,
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: WHITE,
    fontWeight: 'bold',
  },
  adTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: {
    color: WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PopoverAd; 