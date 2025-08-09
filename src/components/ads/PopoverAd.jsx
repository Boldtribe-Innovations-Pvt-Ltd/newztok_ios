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
  const [noAdsAvailable, setNoAdsAvailable] = useState(false);

  useEffect(() => {
    fetchAdData();
  }, []);

  const fetchAdData = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoAdsAvailable(false);
      
      const response = await GETNETWORK(`${BASE_URL}api/ads/public/mobile/popover`);
      console.log('PopoverAd API Response:', response);
      
      if (!response || !response.success) {
        console.log('PopoverAd API failed or returned unsuccessful response');
        // If API fails, immediately show "No Advertisement" instead of retrying
        setNoAdsAvailable(true);
        setLoading(false);
        return;
      }

      // Simple check: If API has data, show PopoverAd
      let ads = [];
      if (Array.isArray(response.data)) {
        ads = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        ads = response.data.data;
      } else if (response.data) {
        ads = [response.data];
      }

      console.log('API returned ads:', ads);

      // If no data in API, don't show PopoverAd
      if (!ads || ads.length === 0) {
        console.log('No ads in API - PopoverAd will not show');
        setNoAdsAvailable(true);
        setLoading(false);
        return;
      }

      // If API has data, use the first ad
      console.log('API has ads - PopoverAd will show');
      const adToShow = ads[0];

      // Process image URL
      let imageUrl = adToShow.imageUrl;
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

      console.log('Setting PopoverAd data:', { imageUrl, redirectUrl: adToShow.redirectUrl });
      setAdData({
        imageUrl,
        redirectUrl: adToShow.redirectUrl
      });
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching ad:', error);
      
      // For any error, immediately show "No Advertisement" instead of retrying
      setNoAdsAvailable(true);
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
    // If image fails to load, close the ad
    setNoAdsAvailable(true);
    setAdData(null);
    setLoading(false);
    // Close the modal when image fails
    setTimeout(() => {
      handleClose();
    }, 100);
  };

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  // Simple condition: Show PopoverAd only if API has data and we have adData
  if (loading || noAdsAvailable || error || !adData) {
    console.log('PopoverAd: Not showing - loading:', loading, 'noAds:', noAdsAvailable, 'error:', error, 'hasAdData:', !!adData);
    return null;
  }
  
  console.log('PopoverAd: API has data - showing PopoverAd with imageUrl:', adData.imageUrl);

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