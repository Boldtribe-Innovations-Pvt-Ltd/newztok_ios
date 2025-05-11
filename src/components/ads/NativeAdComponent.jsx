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
      console.log(`Fetching ad data (attempt ${retryCount + 1}/${maxRetries + 1}) from:`, `${BASE_URL}api/ads/public/mobile/card`);
      
      let response;
      
      try {
        // First try with GETNETWORK utility
        // Set a timeout for the fetch operation
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API request timeout')), 10000)
        );
        
        // Create the fetch promise
        const fetchPromise = GETNETWORK(`${BASE_URL}api/ads/public/mobile/card`);
        
        // Race the fetch against the timeout
        response = await Promise.race([fetchPromise, timeoutPromise]);
        
        console.log('Ad API response from GETNETWORK:', JSON.stringify(response));
      } catch (networkError) {
        console.warn('GETNETWORK failed, trying direct fetch:', networkError);
        
        // If GETNETWORK fails, try with direct fetch
        try {
          const directResponse = await fetch(`${BASE_URL}api/ads/public/mobile/card`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (directResponse.ok) {
            response = await directResponse.json();
            console.log('Ad API response from direct fetch:', JSON.stringify(response));
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
          console.log('Found ads array in nested data structure, total ads:', response.data.data.length);
          
          // Get active ads for mobile platform with type card
          const eligibleAds = response.data.data.filter(ad => 
            ad.isActive && ad.platform === 'mobile' && ad.type === 'card' && ad.imageUrl
          );
          
          if (eligibleAds.length > 0) {
            console.log('Found eligible ads:', eligibleAds.length);
            
            // Sort ads by createdAt date (newest first)
            const sortedAds = eligibleAds.sort((a, b) => {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB - dateA; // Descending order (newest first)
            });
            
            // Take the most recent ad
            const mostRecentAd = sortedAds[0];
            
            console.log('Selected most recent ad:', JSON.stringify(mostRecentAd));
            console.log('Ad created at:', new Date(mostRecentAd.createdAt).toLocaleString());
            
            // Process the image URL (handle relative paths)
            let imageUrl = mostRecentAd.imageUrl;
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `${BASE_URL}${imageUrl.substring(1)}`;
            }
            
            console.log('Processed image URL:', imageUrl);
            
            setAdData({
              imageUrl: imageUrl,
              redirectUrl: mostRecentAd.redirectUrl
            });
            
            // Reset retry count on success
            setRetryCount(0);
            return;
          } else {
            console.log('No eligible ads found that match criteria');
          }
        } else {
          console.log('Response does not contain the expected nested data structure');
        }
      }
      
      // If we reach here, we couldn't process the data in the expected format
      // Try the previous approach as fallback
      
      // Try to extract image and redirect URLs from different possible response structures
      let imageUrl = null;
      let redirectUrl = null;
      
      if (response) {
        // Check standard structure
        if (response.success && response.data) {
          if (typeof response.data === 'object') {
            imageUrl = response.data.imageUrl || response.data.image_url || response.data.image;
            redirectUrl = response.data.redirectUrl || response.data.redirect_url || response.data.url;
            console.log('Found ad data in response.data:', { imageUrl, redirectUrl });
          }
        } 
        
        // If we couldn't find the data in the expected location, try alternatives
        if (!imageUrl && !redirectUrl) {
          // Try direct properties
          imageUrl = response.imageUrl || response.image_url || response.image;
          redirectUrl = response.redirectUrl || response.redirect_url || response.url;
          
          // Try in ad/ads property
          if (response.ad && typeof response.ad === 'object') {
            imageUrl = imageUrl || response.ad.imageUrl || response.ad.image_url || response.ad.image;
            redirectUrl = redirectUrl || response.ad.redirectUrl || response.ad.redirect_url || response.ad.url;
          }
          
          // Try first item if response is array
          if (!imageUrl && !redirectUrl && Array.isArray(response)) {
            const firstItem = response[0];
            if (firstItem && typeof firstItem === 'object') {
              imageUrl = firstItem.imageUrl || firstItem.image_url || firstItem.image;
              redirectUrl = firstItem.redirectUrl || firstItem.redirect_url || firstItem.url;
            }
          }
          
          // Try if response.ads is array
          if (!imageUrl && !redirectUrl && Array.isArray(response.ads)) {
            const firstItem = response.ads[0];
            if (firstItem && typeof firstItem === 'object') {
              imageUrl = firstItem.imageUrl || firstItem.image_url || firstItem.image;
              redirectUrl = firstItem.redirectUrl || firstItem.redirect_url || firstItem.url;
            }
          }
          
          console.log('Found ad data in alternative location:', { imageUrl, redirectUrl });
        }
        
        // If we found any data, use it
        if (imageUrl || redirectUrl) {
          // Process the image URL (handle relative paths)
          if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `${BASE_URL}${imageUrl.substring(1)}`;
          }
          
          setAdData({
            imageUrl: imageUrl,
            redirectUrl: redirectUrl
          });
          // Reset retry count on success
          setRetryCount(0);
        } else {
          console.error('Could not find image or redirect URLs in response');
          retryFetchIfNeeded();
        }
      } else {
        console.error('No valid response from ad API');
        retryFetchIfNeeded();
      }
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
      console.log('Max retries reached, giving up on ad fetch');
    }
  };

  const handleAdPress = async () => {
    console.log('Ad pressed, redirectUrl:', adData?.redirectUrl);
    
    if (adData && adData.redirectUrl) {
      try {
        // Check if the URL can be opened
        const canOpen = await Linking.canOpenURL(adData.redirectUrl);
        
        if (canOpen) {
          console.log('Opening URL:', adData.redirectUrl);
          await Linking.openURL(adData.redirectUrl);
        } else {
          console.error('Cannot open URL:', adData.redirectUrl);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    } else {
      console.log('No redirect URL available in ad data');
    }
  };
  
  // Only use the image from API, no fallback
  const hasValidAdImage = adData && adData.imageUrl;
  
  // Log what image we're using
  useEffect(() => {
    if (hasValidAdImage) {
      console.log('Using ad image:', adData.imageUrl);
    } else {
      console.log('No valid ad image available');
    }
  }, [adData, hasValidAdImage]);
  
  // If no ad image is available, don't render anything
  if (!hasValidAdImage) {
    return null;
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
            onError={(e) => console.error('Error loading ad image:', e.nativeEvent.error)}
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
    width: WIDTH * 0.05,
    marginVertical: HEIGHT * 0.01,
    borderWidth: 2,
    borderColor: RED,
    borderRadius: WIDTH * 0.02,
    overflow: 'hidden',
    backgroundColor: WHITE,
    alignSelf: 'center',
  },
  adLabel: {
    fontSize: WIDTH * 0.022,
    fontWeight: 'bold',
    color: RED,
    textAlign: 'center',
    marginVertical: HEIGHT * 0.003,
    fontFamily: POPPINSLIGHT,
  },
  nativeAd: {
    width: '100%',
    padding: WIDTH * 0.01,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: HEIGHT * 0.09,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: HEIGHT * 0.008,
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
});

export default NativeAdComponent; 