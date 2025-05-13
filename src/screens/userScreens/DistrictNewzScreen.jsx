import React, { useState, useCallback, useEffect, useRef } from "react";
import { FlatList, Image, Share, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, Modal, TextInput, Platform } from "react-native";
import { BLACK, BLUE, BORDERCOLOR, GREY, RED, WHITE } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { DISLIKE, LIKE, PRESSDISLIKE, PRESSLIKE, SHARE, THREEDOTS, ACCOUNT, VERIFIED, RAMNABAMI, WHATSAPP, COMMENT, DOWNARROW } from "../../constants/imagePath";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import YoutubeIframe from "react-native-youtube-iframe";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../../constants/url";
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { WIDTH, HEIGHT } from "../../constants/config";
import { BOLDMONTSERRAT, LORA, POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";
import NativeAdComponent from "../../components/ads/NativeAdComponent";
import HTML from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getObjByKey, getStringByKey } from "../../utils/Storage";
import Video from 'react-native-video';
import { MyAlert } from "../../components/commonComponents/MyAlert";

// Add VideoPlayer component
const VideoPlayer = ({ videoPath }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(true); // Start paused
    
    // Process the video URL to ensure it's properly formatted with BASE_URL
    const getFullVideoUrl = (path) => {
        if (!path) return null;
        
        // If already a complete URL
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
        // For paths starting with '/uploads'
        if (path.startsWith('/uploads')) {
            // Make sure BASE_URL doesn't end with / if path starts with /
            const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
            return `${baseUrl}${path}`;
        }
        
        return path;
    };
    
    // Create a proper source object for the Video component
    const getVideoSource = () => {
        try {
            if (!videoPath) return null;
            
            // If already an object with uri
            if (typeof videoPath === 'object' && videoPath.uri) {
                return videoPath;
            }
            
            // If string path
            if (typeof videoPath === 'string') {
                const fullUrl = getFullVideoUrl(videoPath);
                console.log('Full video URL:', fullUrl);
                return { uri: fullUrl };
            }
            
            return null;
        } catch (err) {
            console.error('Error creating video source:', err);
            return null;
        }
    };
    
    const videoSource = getVideoSource();
    
    const onBuffer = (buffer) => {
        console.log('Video buffering:', buffer);
    };
    
    const onError = (err) => {
        console.error('Video error details:', JSON.stringify(err));
        setError(true);
        setLoading(false);
    };
    
    const onLoad = () => {
        console.log('Video loaded successfully');
        setLoading(false);
    };
    
    // Handler to toggle play/pause
    const togglePlayback = () => {
        setPaused(!paused);
    };
    
    // Check if videoSource is valid
    if (!videoSource) {
        console.log('Invalid video source for path:', videoPath);
        return (
            <View style={[styles.backgroundVideo, styles.videoPlaceholder]}>
                <Text style={styles.videoErrorText}>No video available</Text>
            </View>
        );
    }
    
    // Log the actual video source being used
    console.log('Using video source:', JSON.stringify(videoSource));
    
    return (
        <View style={styles.videoWrapper}>
            <Video
                source={videoSource}
                ref={videoRef}
                onBuffer={onBuffer}
                onLoad={onLoad}
                onError={onError}
                onLoadStart={() => console.log('Video load started')}
                style={styles.backgroundVideo}
                resizeMode="contain"
                repeat={false}
                controls={!paused} // Only show controls when playing
                paused={paused} // Start paused
                fullscreen={false}
                useTextureView={true}
            />
            {(loading || error) && (
                <View style={[styles.backgroundVideo, styles.videoOverlay]}>
                    <Text style={styles.videoOverlayText}>
                        {loading && !error ? 'Loading video...' : 'Video Error'}
                    </Text>
                </View>
            )}
            
            {/* Show play button overlay when paused */}
            {paused && !loading && !error && (
                <TouchableOpacity 
                    style={[styles.backgroundVideo, styles.playButtonOverlay]}
                    onPress={togglePlayback}
                    activeOpacity={0.7}
                >
                    <View style={styles.playButtonCircle}>
                        <Text style={styles.playButtonText}>▶</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Add debug log for BASE_URL
console.log('District Screen - Current BASE_URL:', BASE_URL);

// Helper function to process URLs (images and videos)
const processUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    else if (url.startsWith('/uploads')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        return `${baseUrlFormatted}${url}`;
    }
    return url;
};

// Function to check if content has HTML tags
const hasHtmlTags = (text) => {
    if (!text) return false;
    return /<[a-z][\s\S]*>/i.test(text);
};

// Function to remove HTML tags
const removeHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

// Function to get the stored authentication token (same as MainScreen)
const getStoredToken = async () => {
    try {
        // Try utility methods first
        let userToken = await getStringByKey('userToken');
        
        // If not found, try to get from user object
        if (!userToken) {
            const user = await getObjByKey('user');
            userToken = user?.token;
        }
        
        // If still not found, try loginResponse
        if (!userToken) {
            userToken = await getStringByKey('loginResponse');
        }
        
        // If still not found, fall back to direct AsyncStorage access
        if (!userToken) {
            userToken = await AsyncStorage.getItem('userToken');
            
            if (!userToken) {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        userToken = user?.token;
                    } catch (e) {
                        console.error("Error parsing user data:", e);
                    }
                }
            }
            
            if (!userToken) {
                userToken = await AsyncStorage.getItem('loginResponse');
            }
        }
        
        // If token was found in any location, ensure it's stored in loginResponse
        // as that's what POSTNETWORK uses
        if (userToken) {
            await AsyncStorage.setItem('loginResponse', userToken);
            console.log("Token found and stored in loginResponse");
        } else {
            console.log("No authentication token found");
        }
        
        return userToken;
    } catch (error) {
        console.error("Error retrieving authentication token:", error);
        return null;
    }
};

export default DistrictNewzScreen = ({ navigation, route }) => {
    const { isLoggedIn: routeIsLoggedIn, userData } = route?.params || {};
    const [reaction, setReaction] = useState({});
    const [followStatus, setFollowStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [districtNewsData, setDistrictNewsData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(routeIsLoggedIn || false);
    const [likeCounts, setLikeCounts] = useState({});
    const [isLiking, setIsLiking] = useState({});
    const [selectedState, setSelectedState] = useState('bihar'); // Default state
    const [selectedDistrict, setSelectedDistrict] = useState(null); // Track selected district
    const [showLoginAlert, setShowLoginAlert] = useState(false); // State for login alert
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [currentNewsItem, setCurrentNewsItem] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [isFetchingComments, setIsFetchingComments] = useState(false);

    // Fetch news for the selected state only
    const fetchStateNews = async (state = selectedState) => {
        try {
            setLoading(true);
            console.log('Fetching news for state:', state);
            
            // Get selected district from AsyncStorage
            const district = await AsyncStorage.getItem('selectedDistrict');
            console.log('Selected district from storage:', district);
            
            // Set local state for district
            if (district) {
                setSelectedDistrict(district);
            }
            
            // Fetch news from all states
            const states = ['bihar', 'jharkhand', 'up'];
            let allNewsData = [];
            
            // Fetch news from each state
            for (const currentState of states) {
                try {
                    // Determine API endpoint based on whether district is selected
                    let apiUrl;
                    if (currentState === state && district) {
                        // Use location endpoint for state+district filtering
                        // Format district name for URL (lowercase, no spaces)
                        const formattedDistrict = district.toLowerCase().replace(/\s+/g, '-');
                        apiUrl = `${BASE_URL}api/news/location/${currentState}/${formattedDistrict}`;
                        console.log(`Fetching state+district news from ${apiUrl}`);
                    } else {
                        // Use state endpoint for state-only filtering
                        apiUrl = `${BASE_URL}api/news/state/${currentState}`;
                        console.log(`Fetching state news from ${apiUrl}`);
                    }
                    
                    const response = await GETNETWORK(apiUrl);
                    console.log('API Response:', response);
                    
                    if (response?.success && response?.data) {
                        const newsArray = Array.isArray(response.data) ? response.data : 
                                        response.data?.news || response.data?.data || [];
                        
                        // Filter approved news only
                        const approvedNews = newsArray.filter(item => item.status === "approved" || item.approved === true);
                        
                        // Add state information and transform each news item
                        const transformedNews = approvedNews.map((newsItem, index) => {
                            const uniqueId = `${newsItem.id || ''}_${index}_${currentState}`;
                            
                            // Process image URL using the updated processUrl function
                            let featuredImage = null;
                            if (newsItem.featured_image) {
                                featuredImage = processUrl(newsItem.featured_image);
                            } else if (newsItem.featuredImage) {
                                featuredImage = processUrl(newsItem.featuredImage);
                            } else if (newsItem.thumbnailUrl) {
                                featuredImage = processUrl(newsItem.thumbnailUrl);
                            }

                            // Extract video path from API response
                            let videoPath = null;
                            if (newsItem.videoPath) {
                                console.log('Found videoPath field:', newsItem.videoPath);
                                videoPath = newsItem.videoPath;
                            } else if (newsItem.video_path) {
                                console.log('Found video_path field:', newsItem.video_path);
                                videoPath = newsItem.video_path;
                            } else if (newsItem.video_url) {
                                console.log('Found video_url field:', newsItem.video_url);
                                videoPath = newsItem.video_url;
                            } else if (newsItem.videoUrl) {
                                console.log('Found videoUrl field:', newsItem.videoUrl);
                                videoPath = newsItem.videoUrl;
                            } else if (newsItem.video) {
                                console.log('Found video field:', newsItem.video);
                                videoPath = newsItem.video;
                            }

                            // Process journalist profile pic
                            const journalistProfilePic = newsItem.journalist?.profile_pic ? 
                                processUrl(newsItem.journalist.profile_pic) : null;

                            // Get item district and normalize it for comparison
                            const itemDistrict = newsItem.district || 
                                (currentState === 'bihar' ? 'Patna' : 
                                 currentState === 'jharkhand' ? 'Ranchi' : 
                                 currentState === 'up' ? 'Lucknow' : '');
                                
                            // Normalize both district strings for case-insensitive comparison
                            const normalizedItemDistrict = itemDistrict.toLowerCase().trim();
                            const normalizedSelectedDistrict = district ? district.toLowerCase().trim() : '';
                            
                            // Determine if this is primary district news
                            const isPrimaryDistrict = currentState === state && 
                                normalizedItemDistrict === normalizedSelectedDistrict;

                            console.log(`News item district: "${normalizedItemDistrict}", Selected: "${normalizedSelectedDistrict}", Match: ${isPrimaryDistrict}`);

                            return {
                                ...newsItem,
                                id: uniqueId,
                                youtubeId: newsItem.youtubeUrl ? extractVideoId(newsItem.youtubeUrl) : null,
                                videoId: newsItem.youtubeUrl ? extractVideoId(newsItem.youtubeUrl) : null,
                                title: newsItem.headline || newsItem.title || "District News",
                                posterName: newsItem.journalist?.username || "Journalist",
                                time: formatTime(newsItem.updatedAt || newsItem.createdAt),
                                accountImage: journalistProfilePic ? { uri: journalistProfilePic } : ACCOUNT,
                                verifiedIcon: VERIFIED,
                                content: newsItem.content,
                                contentHasHtml: hasHtmlTags(newsItem.content),
                                category: newsItem.category,
                                featuredImage: featuredImage,
                                videoPath: videoPath, // Add videoPath
                                contentType: newsItem.contentType || null, // Add contentType
                                state: currentState,
                                createdAt: newsItem.createdAt || newsItem.created_at,
                                updatedAt: newsItem.updatedAt || newsItem.updated_at,
                                district: itemDistrict,
                                isPrimaryState: currentState === state,  // Flag for currently selected state
                                isPrimaryDistrict: isPrimaryDistrict  // Flag for primary district
                            };
                        });
                        
                        allNewsData = [...allNewsData, ...transformedNews];
                    }
                } catch (error) {
                    console.error(`Error fetching news for ${currentState}:`, error);
                }
            }

            // Sort news: Selected district first, then selected state, then by date
            const sortedNews = allNewsData.sort((a, b) => {
                // First ensure we have valid dates for comparison
                const dateA = new Date(a.createdAt || a.created_at || b.timestamp || a.updatedAt || a.updated_at || 0);
                const dateB = new Date(b.createdAt || b.created_at || b.timestamp || b.updatedAt || b.updated_at || 0);
                
                // If there's no district and state filtering or dates are invalid, just sort by date (most recent first)
                if (!a.isPrimaryDistrict && !b.isPrimaryDistrict && !a.isPrimaryState && !b.isPrimaryState || 
                    isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                    return dateB - dateA; // Default to recent first if no filtering
                }
                
                // If both are from selected district, sort by date
                if (a.isPrimaryDistrict && b.isPrimaryDistrict) {
                    return dateB - dateA; // Most recent first
                }
                
                // If only one is from selected district, prioritize it
                if (a.isPrimaryDistrict) return -1;
                if (b.isPrimaryDistrict) return 1;
                
                // If both are from selected state or both are not, sort by date
                if ((a.isPrimaryState && b.isPrimaryState) || (!a.isPrimaryState && !b.isPrimaryState)) {
                    return dateB - dateA; // Most recent first
                }
                
                // If only one is from selected state, prioritize it
                if (a.isPrimaryState) return -1;
                if (b.isPrimaryState) return 1;
                
                // If all else fails, sort by date (most recent first)
                return dateB - dateA;
            });

            // Count news items with videos for debugging
            const videosCount = sortedNews.filter(item => item.videoPath).length;
            console.log(`Total district news items with videos: ${videosCount} out of ${sortedNews.length}`);

            console.log(`Total news items: ${sortedNews.length} (${state}: ${sortedNews.filter(n => n.isPrimaryState).length})`);
            
            // If no news items found through district/state filtering, fetch recent news as fallback
            if (sortedNews.length === 0) {
                try {
                    console.log('No filtered news found, fetching recent news as fallback');
                    const recentNewsUrl = `${BASE_URL}api/news/recent`;
                    const recentResponse = await GETNETWORK(recentNewsUrl);
                    
                    if (recentResponse?.success && recentResponse?.data) {
                        const recentNewsArray = Array.isArray(recentResponse.data) ? recentResponse.data : 
                                       recentResponse.data?.news || recentResponse.data?.data || [];
                        
                        // Filter approved news only
                        const approvedRecentNews = recentNewsArray.filter(item => item.status === "approved" || item.approved === true);
                        
                        // Transform recent news items
                        const transformedRecentNews = approvedRecentNews.map((newsItem, index) => {
                            // Process and return the transformed news item (similar to main transformation)
                            const uniqueId = `recent_${newsItem.id || ''}_${index}`;
                            
                            // Process image URL
                            let featuredImage = null;
                            if (newsItem.featured_image) {
                                featuredImage = processUrl(newsItem.featured_image);
                            } else if (newsItem.featuredImage) {
                                featuredImage = processUrl(newsItem.featuredImage);
                            } else if (newsItem.thumbnailUrl) {
                                featuredImage = processUrl(newsItem.thumbnailUrl);
                            }
                            
                            // Get video path
                            let videoPath = null;
                            if (newsItem.videoPath || newsItem.video_path || newsItem.video_url || 
                                newsItem.videoUrl || newsItem.video) {
                                videoPath = newsItem.videoPath || newsItem.video_path || 
                                           newsItem.video_url || newsItem.videoUrl || newsItem.video;
                            }
                            
                            // Process journalist profile pic
                            const journalistProfilePic = newsItem.journalist?.profile_pic ? 
                                processUrl(newsItem.journalist.profile_pic) : null;
                            
                            return {
                                ...newsItem,
                                id: uniqueId,
                                youtubeId: newsItem.youtubeUrl ? extractVideoId(newsItem.youtubeUrl) : null,
                                videoId: newsItem.youtubeUrl ? extractVideoId(newsItem.youtubeUrl) : null,
                                title: newsItem.headline || newsItem.title || "Recent News",
                                posterName: newsItem.journalist?.username || "Journalist",
                                time: formatTime(newsItem.updatedAt || newsItem.createdAt),
                                accountImage: journalistProfilePic ? { uri: journalistProfilePic } : ACCOUNT,
                                verifiedIcon: VERIFIED,
                                content: newsItem.content,
                                contentHasHtml: hasHtmlTags(newsItem.content),
                                category: newsItem.category,
                                featuredImage: featuredImage,
                                videoPath: videoPath,
                                contentType: newsItem.contentType || null,
                                state: newsItem.state || "Unknown",
                                district: newsItem.district || "Unknown",
                                createdAt: newsItem.createdAt || newsItem.created_at,
                                updatedAt: newsItem.updatedAt || newsItem.updated_at,
                                isRecentFallback: true // Flag to identify these are from recent fallback
                            };
                        });
                        
                        console.log(`Fetched ${transformedRecentNews.length} recent news items as fallback`);
                        setDistrictNewsData(transformedRecentNews);
                    } else {
                        setDistrictNewsData([]);
                    }
                } catch (error) {
                    console.error("Error fetching recent news as fallback:", error);
                    setDistrictNewsData([]);
                }
            } else {
                setDistrictNewsData(sortedNews);
            }
            
        } catch (error) {
            console.error("Error fetching news:", error);
            Alert.alert(
                "Error",
                "Unable to fetch news. Please check your internet connection and try again.",
                [{ text: "OK" }]
            );
            setDistrictNewsData([]);
        } finally {
            setLoading(false);
        }
    };

    // Listen for location changes from AsyncStorage
    useEffect(() => {
        const checkSelectedLocation = async () => {
            try {
                const location = await AsyncStorage.getItem('selectedLocation');
                const district = await AsyncStorage.getItem('selectedDistrict');
                console.log('Selected location from storage:', location);
                console.log('Selected district from storage:', district);
                
                // Create a mapping object for state names to endpoints
                const stateMapping = {
                    'Bihar': 'bihar',
                    'Jharkhand': 'jharkhand',
                    'Uttar Pradesh': 'up'
                };

                let needsRefresh = false;
                let newState = selectedState;

                // Check for state changes
                if (location && stateMapping[location]) {
                    const stateEndpoint = stateMapping[location];
                    console.log('Mapped state endpoint:', stateEndpoint);
                    
                    // Check if state has changed
                    if (stateEndpoint !== selectedState) {
                        console.log('Updating selected state from', selectedState, 'to:', stateEndpoint);
                        setSelectedState(stateEndpoint);
                        newState = stateEndpoint; // Update the newState variable
                        needsRefresh = true;
                    }
                } else {
                    // If no valid location is selected, default to Bihar
                    console.log('No valid location selected, defaulting to bihar');
                    if (selectedState !== 'bihar') {
                        setSelectedState('bihar');
                        newState = 'bihar'; // Update the newState variable
                        needsRefresh = true;
                    }
                }

                // Check for district changes
                if (district !== selectedDistrict) {
                    console.log('District changed from', selectedDistrict, 'to', district);
                    setSelectedDistrict(district);
                    needsRefresh = true;
                }

                // If the district or state changed, refresh the news
                if (needsRefresh) {
                    console.log('Refreshing news due to location/district change');
                    await fetchStateNews(newState);
                }
            } catch (error) {
                console.error('Error getting selected location:', error);
            }
        };

        // Initial check
        checkSelectedLocation();
        
        // Set up interval for checking location changes
        const intervalId = setInterval(checkSelectedLocation, 2000);
        
        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [selectedState, selectedDistrict]); // Add selectedDistrict as dependency

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStateNews(selectedState).then(() => setRefreshing(false));
    }, [selectedState, selectedDistrict]); // Add selectedDistrict as dependency

    // Format time function
    const formatTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(/\s/g, ''); // Remove space between time and AM/PM
        } catch (error) {
            console.log('Error formatting time:', error);
            return '';
        }
    };

    // Format date function
    const formatDate = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.log('Error formatting date:', error);
            return '';
        }
    };

    // Helper function to extract YouTube video ID from URL
    const extractVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Add useEffect to check login status and initialize likes
    useEffect(() => {
        const initializeAuthAndLikes = async () => {
            // Get and store authentication token
            const token = await getStoredToken();
            setIsLoggedIn(!!token);
            
            // Initialize liked posts from AsyncStorage
            try {
                const likedPostsStr = await AsyncStorage.getItem('likedPosts');
                if (likedPostsStr) {
                    const likedPosts = JSON.parse(likedPostsStr);
                    
                    // Set reaction state based on liked posts
                    const initialReactions = {};
                    Object.keys(likedPosts).forEach(postId => {
                        if (likedPosts[postId]) {
                            initialReactions[postId] = "like";
                        }
                    });
                    
                    if (Object.keys(initialReactions).length > 0) {
                        setReaction(initialReactions);
                    }
                }
            } catch (error) {
                console.error("Error initializing liked posts:", error);
            }
        };
        
        initializeAuthAndLikes();
    }, []);

    // Fetch like counts when district news data is available
    useEffect(() => {
        if (!loading && districtNewsData.length > 0) {
            fetchAllLikeCounts();
        }
    }, [loading, districtNewsData]);
    
    // Fetch like counts for all news items
    const fetchAllLikeCounts = async () => {
        if (!districtNewsData || districtNewsData.length === 0) return;
        
        // Fetch like count for each news item
        districtNewsData.forEach(item => {
            fetchLikeCount(item.id);
        });
    };

    // Function to fetch like count for a news item
    const fetchLikeCount = async (newsId) => {
        try {
            // Get token using the improved function
            const token = await getStoredToken();
            
            if (!token) {
                console.log(`No auth token available for fetching likes for news ID: ${newsId}`);
                // Still proceed with the request, but without auth headers
            } else {
                console.log(`Using token for fetching likes for news ID: ${newsId}`);
            }
            
            const likeEndpoint = `${BASE_URL}api/interaction/news/${newsId}/likes`;
            console.log(`Fetching likes from: ${likeEndpoint}`);
            
            const response = await fetch(likeEndpoint, {
                method: 'GET',
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`Like data for ${newsId}:`, data);
                
                // Handle different response formats
                let count = 0;
                let isLiked = false;
                
                if (data && typeof data.count === 'number') {
                    count = data.count;
                    isLiked = data.isLiked || false;
                } else if (data && data.likes && typeof data.likes === 'number') {
                    count = data.likes;
                    isLiked = data.isLiked || false;
                } else if (Array.isArray(data)) {
                    count = data.length;
                    // Check if user's ID is in the likes array
                    if (token) {
                        const userData = await getObjByKey('userData') || await getObjByKey('user');
                        if (userData) {
                            isLiked = data.some(like => like.userId === userData.id);
                        }
                    }
                }
                
                // Update state with count and liked status
                setLikeCounts(prev => ({
                    ...prev,
                    [newsId]: count
                }));
                
                // Update isLikedByUser state (if you add this state)
                if (isLiked) {
                    setReaction(prev => ({
                        ...prev,
                        [newsId]: "like"
                    }));
                }
            } else {
                console.error(`Failed to fetch like count for ${newsId}:`, response.status);
            }
        } catch (error) {
            console.error(`Error fetching like count for ${newsId}:`, error);
        }
    };

    // Add handleViewCount function after fetchLikeCount
    const handleViewCount = async (newsId) => {
        try {
            // Create endpoint for view counting with specified format
            const viewEndpoint = `${BASE_URL}api/interaction/${newsId}/view`;
            console.log(`Recording view for news ID ${newsId} at: ${viewEndpoint}`);
            
            // Use POSTNETWORK to record the view
            const response = await POSTNETWORK(viewEndpoint, {}, false);
            console.log(`View recorded for news ID: ${newsId}`);
            console.log("View count response:", response);
        } catch (error) {
            // Log error but don't interrupt user experience
            console.error('Error recording view:', error.message);
        }
    };

    // Fetch news data on screen focus
    useFocusEffect(
        useCallback(() => {
            const refreshNews = async () => {
                try {
                    const location = await AsyncStorage.getItem('selectedLocation');
                    const district = await AsyncStorage.getItem('selectedDistrict');
                    
                    console.log(`Screen focused: Location=${location}, District=${district}`);
                    
                    // Update local state to match AsyncStorage values
                    if (district !== null && district !== selectedDistrict) {
                        setSelectedDistrict(district);
                    }
                    
                    const stateMapping = {
                        'Bihar': 'bihar',
                        'Jharkhand': 'jharkhand',
                        'Uttar Pradesh': 'up'
                    };
                    
                    let stateToUse = 'bihar';
                    if (location && stateMapping[location]) {
                        stateToUse = stateMapping[location];
                        if (stateToUse !== selectedState) {
                            setSelectedState(stateToUse);
                        }
                    }
                    
                    console.log(`Fetching news on focus: State=${stateToUse}, District=${district}`);
                    await fetchStateNews(stateToUse);
                } catch (error) {
                    console.error('Error in focus effect:', error);
                    await fetchStateNews('bihar');
                }
            };
            refreshNews();
            return () => {};
        }, [selectedState, selectedDistrict])
    );

    // Update handleLike function to use the updated token handling approach
    const handleLike = async (id) => {
        try {
            // Get token to verify login status
            const token = await getStoredToken();
            const isUserLoggedIn = !!token;
            
            // Check if user is logged in
            if (!isUserLoggedIn) {
                // Show login alert with MyAlert instead of Alert.alert
                setShowLoginAlert(true);
                return;
            }
            
            // Get news item
            const newsItem = districtNewsData.find(item => item.id === id);
            if (!newsItem) {
                console.error("News item not found:", id);
                return;
            }
            
            // Get current like status
            const isCurrentlyLiked = reaction[id] === "like";
            
            // Update UI first for immediate feedback
            setReaction((prevState) => ({
                ...prevState,
                [id]: prevState[id] === "like" ? null : "like",
            }));
            
            // Update like count for immediate feedback
            setLikeCounts(prevState => ({
                ...prevState,
                [id]: isCurrentlyLiked 
                    ? Math.max(0, (prevState[id] || 0) - 1) 
                    : (prevState[id] || 0) + 1
            }));
            
            // Toggle like status
            const isLiked = !isCurrentlyLiked;
            
            // Persist like status in AsyncStorage
            try {
                const likedPostsStr = await AsyncStorage.getItem('likedPosts');
                let likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : {};
                
                if (isLiked) {
                    // Add to liked posts
                    likedPosts[id] = true;
                } else {
                    // Remove from liked posts
                    delete likedPosts[id];
                }
                
                await AsyncStorage.setItem('likedPosts', JSON.stringify(likedPosts));
                console.log(`Saved like status in AsyncStorage: ${isLiked}`);
            } catch (error) {
                console.error("Error saving like status in AsyncStorage:", error);
            }
            
            // Use the API endpoint for liking
            const likeEndpoint = `${BASE_URL}api/interaction/news/${id}/like`;
            console.log(`Using like endpoint: ${likeEndpoint}`);
            
            // Make the API request with empty payload and auth token
            await AsyncStorage.setItem('loginResponse', token); // Ensure token is available for POSTNETWORK
            const response = await POSTNETWORK(likeEndpoint, {}, true);
            console.log("Like API response:", response);
            
            if (response && response.success !== false) {
                console.log(`Successfully ${isLiked ? 'liked' : 'unliked'} news`);
            } else {
                if (response && response.message) {
                    console.error("API error:", response.message);
                }
            }
        } catch (error) {
            console.error(`Error liking news:`, error);
            // Even if API fails, keep the local state
        }
    };

    const handleFollow = (id) => {
        setFollowStatus((prevState) => ({
            ...prevState,
            [id]: prevState[id] ? false : true,
        }));
    };

    // Update onNavigateNews function to include videoPath in params
    const onNavigateNews = (item) => {
        // Track the view
        handleViewCount(item.id);
        
        // Navigate to the news detail screen with videoPath included
        navigation.navigate("Districts", {
            newsId: item.id,
            newsData: {
                id: item.id,
                videoId: item.videoId,
                videoPath: item.videoPath, // Add videoPath to params
                title: item.title,
                content: item.content,
                featuredImage: item.featuredImage,
                time: item.time
            }
        });
    };

    // Add WhatsApp share function
    const handleWhatsAppShare = async (item) => {
        try {
            // Remove HTML tags function
            const removeHtmlTags = (text) => {
                if (!text) return '';
                return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            };

            let shareMessage = `${removeHtmlTags(item.title)}\n\n`;
            
            // Add a snippet of content (first 100 characters) with HTML tags removed
            if (item.content) {
                const cleanContent = removeHtmlTags(item.content);
                const contentPreview = cleanContent.length > 100 
                    ? cleanContent.substring(0, 100) + '...' 
                    : cleanContent;
                shareMessage += `${contentPreview}\n\n`;
            }

            // Add read more link with specific news ID for direct access
            shareMessage += `Read more at: https://newztok.in/news/${item.id}`;

            // Prepare share options
            const shareOptions = {
                message: shareMessage,
            };

            // Add media URL based on content type
            if (item.youtubeId) {
                shareOptions.url = `https://www.youtube.com/watch?v=${item.youtubeId}`;
            } else if (item.featuredImage) {
                shareOptions.url = item.featuredImage;
            }

            await Share.share(shareOptions, {
                dialogTitle: 'Share News',
                subject: removeHtmlTags(item.title)
            });
        } catch (error) {
            console.error("Error sharing news: ", error);
            Alert.alert(
                "Error",
                "Unable to share the news. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    // HTML rendering styles
    const htmlStyles = {
        p: {
            fontSize: WIDTH * 0.035,
            lineHeight: HEIGHT * 0.028,
            color: BLACK,
            fontFamily: LORA,
            marginBottom: HEIGHT * 0.01,
        },
        h1: {
            fontSize: WIDTH * 0.045,
            fontFamily: BOLDMONTSERRAT,
            color: BLACK,
            marginVertical: HEIGHT * 0.012,
        },
        h2: {
            fontSize: WIDTH * 0.04,
            fontFamily: BOLDMONTSERRAT,
            color: BLACK,
            marginVertical: HEIGHT * 0.01,
        },
        a: {
            color: BLUE,
            textDecorationLine: 'underline',
        },
        li: {
            fontSize: WIDTH * 0.035,
            lineHeight: HEIGHT * 0.028,
            color: BLACK,
            fontFamily: LORA,
        },
        ul: {
            marginLeft: WIDTH * 0.03,
            marginVertical: HEIGHT * 0.01,
        },
        ol: {
            marginLeft: WIDTH * 0.03,
            marginVertical: HEIGHT * 0.01,
        }
    };

    const renderCard = ({ item }) => {
        // Check if item has video path
        if (item.videoPath) {
            console.log(`Rendering card for item ${item.id} with video path:`, item.videoPath);
        }
        
        // Get the date string for display
        const dateStr = formatDate(item.createdAt || item.updatedAt);
        
        return (
            <View style={styles.cardWrapper}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Image source={item.accountImage} style={styles.accountImage} />
                        <Text style={styles.headerText}>{item.posterName}</Text>
                        <Image source={item.verifiedIcon} style={styles.verifiedIcon} />
                    </View>
                    <TouchableOpacity
                        style={[styles.followButton, followStatus[item.id] && styles.followedButton]}
                        onPress={() => handleFollow(item.id)}
                    >
                        <Text style={[styles.followButtonText, followStatus[item.id] && styles.followedText]}>
                            {followStatus[item.id] ? '✓' : '+'}
                        </Text>
                        <Text style={[styles.followButtonText, followStatus[item.id] && styles.followedText]}>
                            {followStatus[item.id] ? 'Followed' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <View style={styles.videoContainer}>
                        <TouchableOpacity 
                            style={styles.videoTouchable}
                            activeOpacity={0.9}
                            onPress={() => onNavigateNews(item)}
                        >
                            {item.youtubeId ? (
                                <YoutubeIframe
                                    height={HEIGHT * 0.16}
                                    style={styles.video}
                                    videoId={item.youtubeId}
                                    allowFullscreen={true}
                                    autoplay={false}
                                />
                            ) : item.videoPath ? (
                                // Add VideoPlayer component for video playback
                                <>
                                    <VideoPlayer videoPath={item.videoPath} />
                                    {__DEV__ && (
                                        <Text style={styles.debugText}>
                                            Video path: {item.videoPath && item.videoPath.substring(0, 30)}...
                                        </Text>
                                    )}
                                </>
                            ) : item.featuredImage ? (
                                <Image 
                                    source={{ uri: item.featuredImage }}
                                    style={styles.featuredImage}
                                    resizeMode="cover"
                                    onError={(e) => {
                                        console.log('Image load error:', e.nativeEvent.error);
                                        console.log('Failed image URI:', item.featuredImage);
                                        // If the image fails to load, try an alternative URL format
                                        if (item.featuredImage.includes('/uploads/')) {
                                            e.currentTarget.setNativeProps({
                                                source: [{ uri: `https://api.newztok.com${item.featuredImage.split('/uploads/')[1]}` }]
                                            });
                                        }
                                    }}
                                />
                            ) : (
                                // Add a placeholder just like other screens
                                <View style={styles.placeholderImage}>
                                    <Text style={styles.placeholderText}>{item.title.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.text} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                        <Text style={styles.time}>{item.time}</Text>
                    </View>
                    
                    <View style={styles.dateContainer}>
                        <Text style={styles.dateText}>{dateStr}</Text>
                    </View>

                    <View style={styles.locationContainer}>
                        <Text style={[
                            styles.locationText,
                            item.isPrimaryDistrict && styles.primaryLocationText
                        ]}>
                            {item.state.charAt(0).toUpperCase() + item.state.slice(1)}, {item.district.charAt(0).toUpperCase() + item.district.slice(1)}
                        </Text>
                    </View>

                    <View style={styles.actionContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.actionButton}>
                                    <Image
                                        source={reaction[item.id] === "like" ? PRESSLIKE : LIKE}
                                        style={styles.actionIcon}
                                    />
                                    <Text style={styles.actionCountText}>
                                        {likeCounts[item.id] > 999 ? (likeCounts[item.id] / 1000).toFixed(1) + 'k' : likeCounts[item.id] || 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity onPress={() => handleWhatsAppShare(item)} style={styles.actionButton}>
                                    <Image source={WHATSAPP} style={styles.actionIcon} />
                                    <Text style={styles.actionCountText}>Share</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity onPress={() => handleCommentPress(item)} style={styles.actionButton}>
                                    <Image source={COMMENT} style={styles.actionIcon} />
                                    <Text style={styles.actionCountText}>Comments</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.readMoreButton}
                            onPress={() => onNavigateNews(item)}
                        >
                            <Text style={styles.readMoreText}>Read more</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // Prepare data with ads interspersed between news items
    const prepareDataWithAds = (newsItems) => {
        if (!newsItems || newsItems.length === 0) return [];
        
        const dataWithAds = [];
        
        // Insert ads after every news item
        newsItems.forEach((item, index) => {
            // Add the news item
            dataWithAds.push({
                ...item,
                itemType: 'news'
            });
            
            // Add an ad after each news item
            dataWithAds.push({
                id: `ad-${index}-${Math.random().toString()}`,  // Ensure unique ad IDs
                itemType: 'ad'
            });
        });
        
        return dataWithAds;
    };

    const renderItem = ({ item }) => {
        // If it's an ad, render the NativeAdComponent
        if (item.itemType === 'ad') {
            return <NativeAdComponent style={styles.adContainer} />;
        }
        
        // Otherwise render a news card
        return renderCard({ item });
    };

    // Initialize selected district from AsyncStorage
    useEffect(() => {
        const initializeDistrict = async () => {
            try {
                const district = await AsyncStorage.getItem('selectedDistrict');
                if (district) {
                    console.log('Retrieved stored district:', district);
                    setSelectedDistrict(district);
                }
            } catch (error) {
                console.error('Error retrieving stored district:', error);
            }
        };
        
        initializeDistrict();
    }, []);

    // Store selectedDistrict when it changes
    useEffect(() => {
        const storeDistrict = async () => {
            try {
                if (selectedDistrict) {
                    await AsyncStorage.setItem('selectedDistrict', selectedDistrict);
                    console.log('Stored district in AsyncStorage:', selectedDistrict);
                }
            } catch (error) {
                console.error('Error storing district:', error);
            }
        };
        
        storeDistrict();
    }, [selectedDistrict]);

    // Function to handle opening the comment modal
    const handleCommentPress = async (item) => {
        setCurrentNewsItem(item);
        setCommentModalVisible(true);
        await fetchComments(item.id);
    };
    
    // Function to fetch comments for a news item
    const fetchComments = async (newsId) => {
        if (!newsId) return;
        
        setIsFetchingComments(true);
        try {
            // Get the news ID
            const targetNewsId = newsId;
            console.log(`Fetching comments for news ID: ${targetNewsId}`);
            
            // Try to get token for authenticated request
            let userToken = await getStoredToken();
            
            // Set auth flag based on token availability
            const isAuthenticated = !!userToken;
            if (isAuthenticated) {
                console.log("Fetching comments with authentication");
                await AsyncStorage.setItem('loginResponse', userToken);
            } else {
                console.log("Fetching comments without authentication");
            }
            
            // Make API request to get comments
            const commentsEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/comments`;
            console.log(`Comments endpoint: ${commentsEndpoint}`);
            
            const response = await GETNETWORK(commentsEndpoint, isAuthenticated);
            console.log("Comments API response:", response);
            
            // Extract comments from potentially nested response structure
            let commentsData = [];
            
            // Handle different response formats
            if (response) {
                if (Array.isArray(response.data)) {
                    commentsData = response.data;
                    console.log(`Found ${commentsData.length} comments in direct array`);
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    commentsData = response.data.data;
                    console.log(`Found ${commentsData.length} comments in nested data.data array`);
                } else if (response.data?.comments && Array.isArray(response.data.comments)) {
                    commentsData = response.data.comments;
                    console.log(`Found ${commentsData.length} comments in data.comments array`);
                } else if (response.data) {
                    console.log("Response format not recognized, attempting to extract comments", response.data);
                    // Try to extract any array that might contain comments
                    for (const key in response.data) {
                        if (Array.isArray(response.data[key])) {
                            commentsData = response.data[key];
                            console.log(`Found possible comments array in key: ${key} with ${commentsData.length} items`);
                            break;
                        }
                    }
                }
            }
            
            if (commentsData && commentsData.length > 0) {
                console.log(`Processing ${commentsData.length} comments`);
                console.log("Sample comment data:", commentsData[0]);
                
                // Transform API response to our comment format
                const formattedComments = commentsData.map(item => ({
                    id: item.id || Math.random().toString(),
                    name: item.user?.username || item.username || item.user_name || "Anonymous",
                    comment: item.text || item.comment || item.content || item.message || "",
                    timestamp: new Date(item.createdAt || item.created_at || item.timestamp || Date.now())
                }));
                
                // Sort comments by timestamp (newest first)
                formattedComments.sort((a, b) => b.timestamp - a.timestamp);
                
                setComments(formattedComments);
            } else {
                console.log("No comments found in response");
                setComments([]);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            setComments([]);
        } finally {
            setIsFetchingComments(false);
        }
    };
    
    // Function to post a comment
    const postComment = async () => {
        if (!commentText.trim() || !currentNewsItem?.id) return;
        
        if (!isLoggedIn) {
            setCommentModalVisible(false);
            setShowLoginAlert(true);
            return;
        }
        
        try {
            // Get the news ID
            const targetNewsId = currentNewsItem.id;
            console.log(`Posting comment for news ID: ${targetNewsId}`);
            
            // Get token for authenticated request
            let userToken = await getStoredToken();
            
            // Validate token
            if (!userToken) {
                throw new Error("No authentication token found");
            }
            
            // Store token in AsyncStorage for POSTNETWORK
            await AsyncStorage.setItem('loginResponse', userToken);
            console.log("Using token for comment POST");
            
            // Create comment payload - try text field first (most common API format)
            const commentPayload = { text: commentText.trim() };
            
            // Make API request to post comment
            const commentEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/comment`;
            console.log(`Comment POST endpoint: ${commentEndpoint}`);
            console.log("Comment payload:", commentPayload);
            
            const response = await POSTNETWORK(commentEndpoint, commentPayload, true);
            console.log("Comment POST response:", response);
            
            if (response && (response.success || response.data?.success)) {
                // Comment posted successfully
                console.log("Comment posted successfully");
                
                // Add to local state first for immediate feedback
                const newCommentObj = {
                    id: response.data?.id || response.data?.data?.id || Math.random().toString(),
                    name: "You",
                    comment: commentText.trim(),
                    timestamp: new Date()
                };
                
                // Add to the beginning of the list (newest first)
                setComments(prevComments => [newCommentObj, ...prevComments]);
                
                // Clear the input
                setCommentText("");
                
                // Fetch all comments to get the updated list
                setTimeout(() => {
                    fetchComments(currentNewsItem.id);
                }, 500);
            } else {
                // If default payload format failed, try alternative formats
                console.log("First attempt failed, trying alternative payload formats");
                
                const alternativePayloads = [
                    { comment: commentText.trim() },
                    { content: commentText.trim() },
                    { message: commentText.trim() }
                ];
                
                let success = false;
                
                for (const payload of alternativePayloads) {
                    console.log("Trying payload format:", payload);
                    const retryResponse = await POSTNETWORK(commentEndpoint, payload, true);
                    
                    if (retryResponse && (retryResponse.success || retryResponse.data?.success)) {
                        // Comment posted successfully with alternative payload
                        console.log("Comment posted successfully with alternative payload");
                        
                        // Add to local state
                        const newCommentObj = {
                            id: retryResponse.data?.id || retryResponse.data?.data?.id || Math.random().toString(),
                            name: "You",
                            comment: commentText.trim(),
                            timestamp: new Date()
                        };
                        
                        setComments(prevComments => [newCommentObj, ...prevComments]);
                        setCommentText("");
                        
                        setTimeout(() => {
                            fetchComments(currentNewsItem.id);
                        }, 500);
                        
                        success = true;
                        break;
                    }
                }
                
                if (!success) {
                    throw new Error(response?.message || response?.data?.message || "Failed to post comment");
                }
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            
            // Handle unauthorized error (401)
            if (error.message?.includes("unauthorized") || error.message?.includes("401")) {
                setCommentModalVisible(false);
                setShowLoginAlert(true);
            } else {
                // General error
                Alert.alert(
                    "Error",
                    error.message || "Failed to post comment",
                    [{ text: "OK" }]
                );
            }
        }
    };
    
    // Comment modal component
    const renderCommentModal = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={commentModalVisible}
                onRequestClose={() => setCommentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Comments</Text>
                            <TouchableOpacity 
                                style={styles.closeButton} 
                                onPress={() => setCommentModalVisible(false)}
                            >
                                <Image source={DOWNARROW} style={styles.downArrowIcon} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.commentsList}>
                            {isFetchingComments ? (
                                <View style={styles.loadingComments}>
                                    <ActivityIndicator size="small" color={BLUE} />
                                    <Text style={styles.loadingCommentsText}>Loading comments...</Text>
                                </View>
                            ) : comments.length === 0 ? (
                                <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                            ) : (
                                <FlatList
                                    data={comments}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <View style={styles.commentItem}>
                                            <View style={styles.commentHeader}>
                                                <View style={styles.profileInitial}>
                                                    <Text style={styles.initialText}>
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={styles.commentDetails}>
                                                    <Text style={styles.commenterName}>{item.name}</Text>
                                                    <Text style={styles.commentTime}>
                                                        {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.commentContent}>{item.comment}</Text>
                                        </View>
                                    )}
                                />
                            )}
                        </View>
                        
                        <View style={styles.commentInputContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Add a comment..."
                                value={commentText}
                                onChangeText={setCommentText}
                                placeholderTextColor={GREY}
                            />
                            <TouchableOpacity 
                                style={[
                                    styles.postButton, 
                                    !commentText.trim() && styles.disabledButton
                                ]}
                                onPress={postComment}
                                disabled={!commentText.trim()}
                            >
                                <Text style={styles.postButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={BLUE} style={styles.loader} />
                        <Text style={{fontFamily: LORA, marginTop: HEIGHT * 0.01}}>Loading news...</Text>
                    </View>
                ) : districtNewsData.length === 0 ? (
                    <View style={styles.noNewsContainer}>
                        <Text style={styles.noNewsText}>No News Available</Text>
                        <Text style={styles.noNewsSubText}>Pull down to refresh</Text>
                    </View>
                ) : (
                    <FlatList
                        data={prepareDataWithAds(districtNewsData)}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        onRefresh={onRefresh}
                        refreshing={refreshing}
                    />
                )}
            </View>
            
            <MyLoader visible={loading} />
            
            {/* Add MyAlert component for login prompt */}
            <MyAlert
                visible={showLoginAlert}
                title="Login Required"
                message="Please log in to like or comment on this news"
                textLeft="Cancel"
                textRight="Login"
                backgroundColor={BLUE}
                onPressLeft={() => setShowLoginAlert(false)}
                onPressRight={() => {
                    setShowLoginAlert(false);
                    navigation.navigate("LoginSignup", {
                        returnScreen: "DistrictNewzScreen"
                    });
                }}
            />
            
            {renderCommentModal()}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.02,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: WIDTH * 0.02,
    },
    cardWrapper: {
        marginTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.015,
        alignItems: "center",
        width: "100%",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: WIDTH * 0.02,
        paddingBottom: HEIGHT * 0.004,
        width: WIDTH * 0.9,
        alignSelf: "center",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerText: {
        fontSize: WIDTH * 0.035,
        fontFamily: LORA,
        color: BLACK,
        marginRight: WIDTH * 0.01,
    },
    verifiedIcon: {
        width: WIDTH * 0.04,
        height: WIDTH * 0.04,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    primaryDistrictTag: {
        backgroundColor: BLUE,
        paddingHorizontal: WIDTH * 0.02,
        paddingVertical: HEIGHT * 0.002,
        borderRadius: WIDTH * 0.01,
        marginRight: WIDTH * 0.02,
    },
    primaryDistrictTagText: {
        color: WHITE,
        fontSize: WIDTH * 0.025,
        fontFamily: POPPINSLIGHT,
    },
    followButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.003,
        paddingHorizontal: WIDTH * 0.015,
        borderRadius: WIDTH * 0.01,
        height: HEIGHT * 0.03,
        width: WIDTH * 0.18,
        gap: WIDTH * 0.01
    },
    followButtonText: {
        fontSize: WIDTH * 0.025,
        fontFamily: BOLDMONTSERRAT,
        color: WHITE,
        textAlign: "center",
    },
    followedButton: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BLUE,
    },
    followedText: {
        color: BLUE,
    },
    card: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.015,
        overflow: "hidden",
        padding: WIDTH * 0.015,
        paddingBottom: WIDTH * 0.02,
        elevation: 2,
        borderWidth: 1,
        borderColor: BORDERCOLOR,
        width: WIDTH * 0.9,
        alignSelf: "center",
    },
    videoContainer: {
        borderRadius: WIDTH * 0.015,
        overflow: "hidden",
    },
    videoTouchable: {
        width: "100%",
    },
    video: {
        width: "100%",
        height: HEIGHT * 0.16,
    },
    featuredImage: {
        width: '100%',
        height: HEIGHT * 0.16,
        borderRadius: WIDTH * 0.015,
    },
    textContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: HEIGHT * 0.012,
    },
    text: {
        fontSize: WIDTH * 0.038,
        fontFamily: BOLDMONTSERRAT,
        flex: 1,
        marginRight: WIDTH * 0.02,
    },
    dateContainer: {
        paddingHorizontal: WIDTH * 0.02,
        marginTop: HEIGHT * 0.01,
    },
    dateText: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
    },
    time: {
        fontSize: WIDTH * 0.03,
        fontFamily: LORA,
        color: BLACK,
        flexShrink: 0,
    },
    locationContainer: {
        paddingHorizontal: WIDTH * 0.02,
        marginTop: HEIGHT * 0.005,
    },
    locationText: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
    },
    actionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.005,
        width: '100%',
    },
    iconContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
    },
    actionButtonContainer: {
        marginRight: WIDTH * 0.02,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(240, 240, 240, 0.4)',
        paddingVertical: HEIGHT * 0.006,
        paddingHorizontal: WIDTH * 0.02,
        borderRadius: WIDTH * 0.04,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    actionIcon: {
        width: WIDTH * 0.045,
        height: WIDTH * 0.045,
        marginRight: WIDTH * 0.01,
    },
    actionCountText: {
        fontSize: WIDTH * 0.025,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    readMoreButton: {
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.008,
        paddingHorizontal: WIDTH * 0.03,
        borderRadius: WIDTH * 0.02,
        alignItems: 'center',
        justifyContent: 'center',
    },
    readMoreText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.03,
    },
    accountImage: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
        borderRadius: WIDTH * 0.04,
        marginRight: WIDTH * 0.015,
    },
    noNewsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: HEIGHT * 0.05,
    },
    noNewsText: {
        fontSize: WIDTH * 0.04,
        color: GREY,
        fontFamily: BOLDMONTSERRAT,
        textAlign: 'center',
    },
    noNewsSubText: {
        fontSize: WIDTH * 0.03,
        fontFamily: LORA,
        color: GREY,
        textAlign: 'center',
    },
    loader: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    adContainer: {
        width: WIDTH * 0.9,
        marginVertical: HEIGHT * 0.02,
        alignSelf: 'center',
        maxHeight: HEIGHT * 0.25,
        borderWidth: 1.5,
        borderColor: RED,
        borderRadius: WIDTH * 0.02,
    },
    placeholderImage: {
        width: '100%',
        height: HEIGHT * 0.16,
        backgroundColor: '#e1e1e1',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: WIDTH * 0.015,
    },
    placeholderText: {
        fontSize: WIDTH * 0.15,
        fontFamily: BOLDMONTSERRAT,
        color: '#a1a1a1',
        opacity: 0.8
    },
    videoWrapper: {
        width: '100%',
        height: HEIGHT * 0.16,
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: WIDTH * 0.015,
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: WIDTH * 0.015,
    },
    videoPlaceholder: {
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoErrorText: {
        fontSize: WIDTH * 0.035,
        fontFamily: BOLDMONTSERRAT,
        color: '#a1a1a1',
    },
    videoOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoOverlayText: {
        fontSize: WIDTH * 0.035,
        fontFamily: LORA,
        color: WHITE,
    },
    debugText: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: WHITE,
        fontSize: 8,
        padding: 2,
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: WIDTH * 0.015,
    },
    playButtonCircle: {
        width: WIDTH * 0.15,
        height: WIDTH * 0.15,
        borderRadius: WIDTH * 0.075,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: BLACK,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    playButtonText: {
        fontSize: WIDTH * 0.05,
        fontFamily: BOLDMONTSERRAT,
        color: BLACK,
        marginLeft: WIDTH * 0.01, // Slight offset for the play icon
    },
    primaryLocationText: {
        color: BLUE,
        fontWeight: 'bold',
        fontSize: WIDTH * 0.032,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: WHITE,
        borderTopLeftRadius: WIDTH * 0.05,
        borderTopRightRadius: WIDTH * 0.05,
        paddingBottom: Platform.OS === 'ios' ? HEIGHT * 0.05 : HEIGHT * 0.02,
        maxHeight: HEIGHT * 0.7,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingHorizontal: WIDTH * 0.05,
        paddingVertical: HEIGHT * 0.02,
    },
    modalTitle: {
        fontSize: WIDTH * 0.045,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
    },
    closeButton: {
        padding: WIDTH * 0.02,
    },
    downArrowIcon: {
        width: WIDTH * 0.05,
        height: WIDTH * 0.05,
    },
    commentsList: {
        maxHeight: HEIGHT * 0.5,
        paddingHorizontal: WIDTH * 0.05,
    },
    commentItem: {
        marginVertical: HEIGHT * 0.01,
        paddingBottom: HEIGHT * 0.01,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.01,
    },
    profileInitial: {
        width: WIDTH * 0.08,
        height: WIDTH * 0.08,
        borderRadius: WIDTH * 0.04,
        backgroundColor: BLUE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: WIDTH * 0.02,
    },
    initialText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.04,
    },
    commentDetails: {
        flex: 1,
    },
    commenterName: {
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        fontSize: WIDTH * 0.035,
    },
    commentTime: {
        fontFamily: POPPINSLIGHT,
        color: GREY,
        fontSize: WIDTH * 0.03,
    },
    commentContent: {
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        fontSize: WIDTH * 0.035,
        paddingLeft: WIDTH * 0.1,
    },
    loadingComments: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: HEIGHT * 0.03,
    },
    loadingCommentsText: {
        fontFamily: POPPINSLIGHT,
        color: GREY,
        marginTop: HEIGHT * 0.01,
    },
    noCommentsText: {
        fontFamily: POPPINSLIGHT,
        color: GREY,
        textAlign: 'center',
        marginVertical: HEIGHT * 0.03,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        padding: WIDTH * 0.05,
    },
    commentInput: {
        flex: 1,
        height: HEIGHT * 0.05,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: WIDTH * 0.02,
        paddingHorizontal: WIDTH * 0.03,
        marginRight: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT,
    },
    postButton: {
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.01,
        paddingHorizontal: WIDTH * 0.03,
        borderRadius: WIDTH * 0.02,
    },
    postButtonText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.035,
    },
    disabledButton: {
        backgroundColor: GREY,
    },
});