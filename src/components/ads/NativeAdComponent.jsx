import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { BLACK, BLUE, WHITE, GREY, RED, GREEN } from '../../constants/color';
import { BOLDMONTSERRAT, POPPINSLIGHT } from '../../constants/fontPath';
import { WIDTH, HEIGHT } from '../../constants/config';
import { GETNETWORK } from '../../utils/Network';
import { BASE_URL } from '../../constants/url';

const NativeAdComponent = ({ style }) => {
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const fetchAdData = async () => {
    try {
      setLoading(true);
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

            // Handle relative URLs
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `${BASE_URL}${imageUrl.substring(1)}`;
            }

            setAdData({
              imageUrl: imageUrl,
              redirectUrl: selectedAd.redirectUrl
            });
            setRetryCount(0);
            return;
          }
        }
      }

      // If no valid ad found, retry
      retryFetchIfNeeded();
    } catch (error) {
      console.error('Error fetching ad data:', error);
      retryFetchIfNeeded();
    } finally {
      setLoading(false);
    }
  };

  const retryFetchIfNeeded = () => {
    if (retryCount < maxRetries) {
      console.log(`Scheduling retry ${retryCount + 1}/${maxRetries}...`);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchAdData();
      }, delay);
    }
  };

  const handleAdPress = async () => {
    if (adData?.redirectUrl) {
      try {
        const canOpen = await Linking.canOpenURL(adData.redirectUrl);
        if (canOpen) {
          await Linking.openURL(adData.redirectUrl);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.adLabel}>ADVERTISEMENT</Text>
        <View style={[styles.nativeAd, styles.placeholderAd]}>
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>Loading...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!adData?.imageUrl) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.adLabel}>ADVERTISEMENT</Text>
        <View style={[styles.nativeAd, styles.placeholderAd]}>
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>Advertisement</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.adLabel}>ADVERTISEMENT</Text>
      <TouchableOpacity 
        style={styles.nativeAd}
        onPress={handleAdPress}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: adData.imageUrl }}
            style={styles.adImage}
            resizeMode="cover"
            onError={(e) => {
              console.error('Error loading ad image:', e.nativeEvent.error);
              retryFetchIfNeeded();
            }}
          />
        </View>
        
        <View style={styles.bottomRow}>
          <Text style={styles.advertiser} numberOfLines={1}>NewzTok Media</Text>
          <View style={styles.callToAction}>
            <Text style={styles.callToActionText}>Learn More</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: WIDTH * 0.4,
    height: HEIGHT * 0.18,
    marginVertical: HEIGHT * 0.006,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: WIDTH * 0.015,
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
    padding: WIDTH * 0.006,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: HEIGHT * 0.12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: HEIGHT * 0.004,
  },
  adImage: {
    width: '100%',
    height: '100%',
    borderRadius: WIDTH * 0.01,
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
    height: HEIGHT * 0.14,
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: WIDTH * 0.03,
    color: BLACK,
    fontFamily: POPPINSLIGHT,
    textAlign: 'center',
  },
});

export default NativeAdComponent; 