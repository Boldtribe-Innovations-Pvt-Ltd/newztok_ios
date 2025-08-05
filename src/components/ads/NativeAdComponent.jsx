import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native';
import { BLACK, BLUE, WHITE, GREY, RED, GREEN } from '../../constants/color';
import { BOLDMONTSERRAT, POPPINSLIGHT } from '../../constants/fontPath';
import { WIDTH, HEIGHT } from '../../constants/config';
import { GETNETWORK } from '../../utils/Network';
import { BASE_URL } from '../../constants/url';

const NativeAdComponent = ({ style }) => {
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef(null);
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes cache

  // Fallback image - you can replace this with your app's default ad image
  // const fallbackImage = require('../../assets/images/Launchposter.png');

  useEffect(() => {
    // Check if we need to fetch new data (no cache or cache expired)
    const now = Date.now();
    const shouldFetch = !adData || (now - lastFetchTime) > cacheTimeout;
    
    if (shouldFetch) {
      fetchAdData();
    } else {
      setLoading(false); // Use cached data
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const fetchAdData = async () => {
    try {
      setLoading(true);
      setImageError(false);
      console.log('Fetching ad data from:', `${BASE_URL}api/ads/public/mobile/card`);
      
      const response = await GETNETWORK(`${BASE_URL}api/ads/public/mobile/card`);
      console.log('Ad API response:', JSON.stringify(response));

      if (response && response.success && response.data) {
        // Handle nested data structure
        const adsData = response.data.data || response.data;
        
        if (Array.isArray(adsData) && adsData.length > 0) {
          // Filter active ads for mobile platform
          const eligibleAds = adsData.filter(ad => 
            ad.isActive && 
            ad.platform === 'mobile' && 
            ad.type === 'card' && 
            ad.imageUrl
          );

          if (eligibleAds.length > 0) {
            // Sort by createdAt (newest first)
            const sortedAds = eligibleAds.sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            );

            const selectedAd = sortedAds[0];
            let imageUrl = selectedAd.imageUrl;
            let redirectUrl = selectedAd.redirectUrl;

            // Process image URL
            if (imageUrl) {
              if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                imageUrl = `${BASE_URL.replace(/\/$/, '')}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
              }
              console.log('Constructed image URL:', imageUrl);
            }

            // Process redirect URL
            if (redirectUrl) {
              if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
                redirectUrl = `https://${redirectUrl.replace(/^\/+/, '')}`;
              }
              console.log('Processed redirect URL:', redirectUrl);
            }

            setAdData({
              imageUrl: imageUrl,
              redirectUrl: redirectUrl,
              title: selectedAd.title || 'Advertisement',
              description: selectedAd.description || 'Learn More'
            });
            
            console.log('Ad data set with redirect URL:', redirectUrl);
            setRetryCount(0);
            setLastFetchTime(Date.now()); // Update cache timestamp
            
            if (imageUrl) {
              setImageLoading(true);
            }
            return;
          }
        }
      }

      // No ad data available
      setAdData(null);
      
    } catch (error) {
      console.error('Error fetching ad data:', error);
      setAdData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoadStart = () => {
    console.log('Image loading started...');
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageError = (error) => {
    // Silently handle image errors without console logging
    // console.error('Error loading ad image:', error.nativeEvent?.error || 'Unknown error');
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('Ad image loaded successfully');
    setImageError(false);
    setImageLoading(false);
  };

  const handleAdPress = async () => {
    try {
      if (!adData?.redirectUrl) {
        console.log('No redirect URL available');
        return;
      }

      let urlToOpen = adData.redirectUrl.trim();
      console.log('Original URL to open:', urlToOpen);

      // Handle WhatsApp URLs
      if (urlToOpen.includes('wa.me') || urlToOpen.includes('whatsapp')) {
        // Ensure proper WhatsApp URL format
        if (urlToOpen.startsWith('whatsapp://')) {
          // URL is already in proper format
        } else if (urlToOpen.startsWith('https://wa.me/')) {
          // URL is in web format, keep as is
        } else {
          // Convert to proper WhatsApp URL format
          const phoneNumber = urlToOpen.replace(/[^\d+]/g, '');
          urlToOpen = `https://wa.me/${phoneNumber}`;
        }
      } else {
        // For non-WhatsApp URLs, ensure proper protocol
        if (!urlToOpen.startsWith('http://') && !urlToOpen.startsWith('https://')) {
          urlToOpen = 'https://' + urlToOpen.replace(/^\/+/, '');
        }
      }

      console.log('Attempting to open URL:', urlToOpen);

      const canOpen = await Linking.canOpenURL(urlToOpen);
      
      if (canOpen) {
        await Linking.openURL(urlToOpen);
        console.log('Successfully opened URL:', urlToOpen);
      } else {
        console.log('Cannot open URL:', urlToOpen);
        
        // For WhatsApp, try alternative format
        if (urlToOpen.includes('wa.me')) {
          const phoneNumber = urlToOpen.replace(/[^\d+]/g, '');
          const whatsappAlternative = `whatsapp://send?phone=${phoneNumber}`;
          
          try {
            const canOpenWhatsapp = await Linking.canOpenURL(whatsappAlternative);
            if (canOpenWhatsapp) {
              await Linking.openURL(whatsappAlternative);
              console.log('Opened alternative WhatsApp URL:', whatsappAlternative);
              return;
            }
          } catch (whatsappError) {
            console.error('Error opening WhatsApp alternative:', whatsappError);
          }
        }

        // Try web browser as fallback for non-WhatsApp URLs
        const browserUrl = urlToOpen.replace(/^.*:\/\//, 'https://');
        try {
          await Linking.openURL(browserUrl);
          console.log('Opened in browser:', browserUrl);
        } catch (browserError) {
          console.error('Failed to open in browser:', browserError);
        }
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
};

  const getImageSource = () => {
    // Return remote image source only
    if (adData?.imageUrl && !imageError) {
      return { uri: adData.imageUrl };
    }
    return null;
  };

  const shouldShowRemoteImage = () => {
    return adData?.imageUrl && !imageError;
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.nativeAd, styles.placeholderAd]}>
          <ActivityIndicator size="small" color={RED} />
          <Text style={styles.placeholderText}>Loading Ad...</Text>
        </View>
      </View>
    );
  }

  // If no ad data is available, return null to hide the component
  if (!adData || !adData.imageUrl) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.nativeAd}
        onPress={handleAdPress}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {/* Show remote image */}
          {shouldShowRemoteImage() && (
            <Image 
              source={{ uri: adData.imageUrl }}
              style={styles.adImage}
              resizeMode="cover"
              onLoadStart={handleImageLoadStart}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )}
          
          {/* Loading indicator while image buffers */}
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={WHITE} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
          
          {/* Ad label overlay on the image */}
          <View style={styles.adLabelOverlay}>
            <Text style={styles.adLabelText}>AD</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: WIDTH * 0.95,
    height: HEIGHT * 0.135,
    marginVertical: HEIGHT * 0.002,
    borderWidth: 1.5,
    borderColor: RED,
    borderRadius: WIDTH * 0.02,
    overflow: 'hidden',
    backgroundColor: WHITE,
    alignSelf: 'center',
  },
  adLabel: {
    fontSize: WIDTH * 0.016,
    fontWeight: 'bold',
    color: RED,
    textAlign: 'center',
    marginVertical: HEIGHT * 0.001,
    fontFamily: POPPINSLIGHT,
  },
  nativeAd: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
    borderRadius: WIDTH * 0.02,
  },
  adLabelOverlay: {
    position: 'absolute',
    bottom: WIDTH * 0.02,
    right: WIDTH * 0.02,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: WIDTH * 0.015,
    paddingVertical: HEIGHT * 0.003,
    borderRadius: WIDTH * 0.01,
  },
  adLabelText: {
    color: WHITE,
    fontSize: WIDTH * 0.025,
    fontWeight: 'bold',
    fontFamily: BOLDMONTSERRAT,
  },
  backgroundImage: {
    opacity: 0.3,
  },
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: WIDTH * 0.01,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: WIDTH * 0.01,
  },
  loadingText: {
    color: WHITE,
    fontSize: WIDTH * 0.02,
    fontFamily: POPPINSLIGHT,
    marginTop: 5,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(255,0,0,0.8)',
    padding: 3,
    borderRadius: 3,
  },
  errorText: {
    color: WHITE,
    fontSize: WIDTH * 0.018,
    fontFamily: POPPINSLIGHT,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  advertiser: {
    fontSize: WIDTH * 0.018,
    color: GREY,
    fontFamily: POPPINSLIGHT,
    flex: 1,
  },
  callToAction: {
    backgroundColor: GREEN,
    padding: HEIGHT * 0.004,
    borderRadius: WIDTH * 0.01,
    width: WIDTH * 0.18,
  },
  callToActionText: {
    color: WHITE,
    textAlign: 'center',
    fontSize: WIDTH * 0.018,
    fontWeight: 'bold',
    fontFamily: BOLDMONTSERRAT,
  },
  placeholderAd: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: WIDTH * 0.025,
    color: BLACK,
    fontFamily: POPPINSLIGHT,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default NativeAdComponent; 