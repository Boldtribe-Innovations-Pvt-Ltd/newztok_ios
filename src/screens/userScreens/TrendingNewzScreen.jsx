import React, { useState, useEffect, useRef, useCallback } from "react";
import { FlatList, Image, Share, StyleSheet, Text, TouchableOpacity, View, Alert, Linking, ActivityIndicator, Modal, TextInput, Animated } from "react-native";
import { BLACK, BLUE, BORDERCOLOR, GREY, RED, WHITE } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { LIKE, SHARE as SHAREICON, PRESSLIKE, REPORTOR, VERIFIED, RAMNABAMI, LINKEDIN, YOUTUBE, FACEBOOKICON, INSTAGRAM, XICON, WHATSAPP, SHARE, VIEW, COMMENT, DOWNARROW } from "../../constants/imagePath";
import YoutubeIframe from "react-native-youtube-iframe";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import { BASE_URL } from "../../constants/url";
console.log('Current BASE_URL:', BASE_URL);
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { WIDTH, HEIGHT } from "../../constants/config";
import { BOLDMONTSERRAT, LORA, POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";
import NativeAdComponent from "../../components/ads/NativeAdComponent";
import PopoverAd from "../../components/ads/PopoverAd";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getObjByKey, getStringByKey } from "../../utils/Storage";
import Video from 'react-native-video';
import { MyAlert } from "../../components/commonComponents/MyAlert";

console.log('Trending News Screen - Current BASE_URL:', BASE_URL);

// Add VideoPlayer component
const VideoPlayer = ({ videoPath, size = 'default' }) => {
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
        const wrapperStyle = size === 'big' ? styles.bigCardVideoWrapper : 
                           size === 'small' ? styles.smallCardVideoWrapper : 
                           styles.videoWrapper;
        const videoStyle = size === 'big' ? styles.bigCardBackgroundVideo : 
                         size === 'small' ? styles.smallCardBackgroundVideo : 
                         styles.backgroundVideo;
        
        return (
            <View style={[wrapperStyle, styles.videoPlaceholder]}>
                <Text style={styles.videoErrorText}>No video available</Text>
            </View>
        );
    }
    
    // Log the actual video source being used
    console.log('Using video source:', JSON.stringify(videoSource));
    
    const wrapperStyle = size === 'big' ? styles.bigCardVideoWrapper : 
                       size === 'small' ? styles.smallCardVideoWrapper : 
                       styles.videoWrapper;
    const videoStyle = size === 'big' ? styles.bigCardBackgroundVideo : 
                     size === 'small' ? styles.smallCardBackgroundVideo : 
                     styles.backgroundVideo;
    
    return (
        <View style={wrapperStyle}>
            <Video
                source={videoSource}
                ref={videoRef}
                onBuffer={onBuffer}
                onLoad={onLoad}
                onError={onError}
                onLoadStart={() => console.log('Video load started')}
                style={videoStyle}
                resizeMode="contain"
                repeat={false}
                controls={!paused} // Only show controls when playing
                paused={paused} // Start paused
                fullscreen={false}
                useTextureView={true}
            />
            {(loading || error) && (
                <View style={[videoStyle, styles.videoOverlay]}>
                    <Text style={styles.videoOverlayText}>
                        {loading && !error ? 'Loading video...' : 'Video Error'}
                    </Text>
                </View>
            )}
            
            {/* Show play button overlay when paused */}
            {paused && !loading && !error && (
                <TouchableOpacity 
                    style={[videoStyle, styles.playButtonOverlay]}
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

// Helper function to process URLs (images and videos)
const processUrl = (url) => {
    if (!url) return null;
    // If it's already a full URL (starts with http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // For paths starting with '/uploads'
    else if (url.startsWith('/uploads')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        return `${baseUrlFormatted}${url}`;
    }
    // For other paths
    return url;
};

// Add NewsSkeleton component before the MainScreen component
const NewsSkeleton = () => {
    const fadeAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 0.7,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        };

        startAnimation();
        return () => fadeAnim.stopAnimation();
    }, [fadeAnim]);

    return (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonHeader}>
                <Animated.View style={[styles.skeletonAvatar, { opacity: fadeAnim }]} />
                <Animated.View style={[styles.skeletonName, { opacity: fadeAnim }]} />
            </View>
            <Animated.View style={[styles.skeletonImage, { opacity: fadeAnim }]} />
            <View style={styles.skeletonContent}>
                <Animated.View style={[styles.skeletonTitle, { opacity: fadeAnim }]} />
                <Animated.View style={[styles.skeletonDate, { opacity: fadeAnim }]} />
                <View style={styles.skeletonActions}>
                    <Animated.View style={[styles.skeletonAction, { opacity: fadeAnim }]} />
                    <Animated.View style={[styles.skeletonAction, { opacity: fadeAnim }]} />
                    <Animated.View style={[styles.skeletonAction, { opacity: fadeAnim }]} />
                </View>
            </View>
        </View>
    );
};

export default function TrendingNewzScreen({ navigation }) {
    const [reaction, setReaction] = useState({});
    const [followStatus, setFollowStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [newsData, setNewsData] = useState([]);
    const [imageErrors, setImageErrors] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginAlert, setShowLoginAlert] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [currentNewsItem, setCurrentNewsItem] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [isFetchingComments, setIsFetchingComments] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // PopoverAd states
    const [showAd, setShowAd] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [lastAdShowTime, setLastAdShowTime] = useState(0);
    const pageThreshold = 5; // Show ad after every 5th page
    const adCooldown = 30 * 1000; // 30 seconds cooldown between ads

    const extractVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const formatTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(/\s/g, ''); // Remove space between time and AM/PM
        } catch (error) {
            console.error('Error formatting time:', error);
            return '';
        }
    };
    
    // Function to format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.log('Error formatting date:', error);
            return '';
        }
    };

    const fetchNewsData = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                // setLoading(true); // Commented out as requested
            }
            console.log('Fetching news from:', `${BASE_URL}api/news/featured`);
            
            const response = await GETNETWORK(`${BASE_URL}api/news/featured`);
            console.log('API Response:', response);
            
            if (response.success && response.data) {
                // Check if response.data is an object with a news array
                const newsArray = Array.isArray(response.data) ? response.data : 
                                response.data.news || response.data.data || [];
                
                if (!Array.isArray(newsArray)) {
                    throw new Error('Invalid response format: News data is not an array');
                }

                // No need to filter as the API already returns  News
                console.log('News from API:', newsArray);
                
                // Use the updated processUrl function instead of processImageUrl
                const transformedData = newsArray.map(async newsItem => {
                    // Extract YouTube ID consistently
                    const youtubeId = newsItem.youtubeUrl ? extractVideoId(newsItem.youtubeUrl) : 
                                     newsItem.video_link ? extractVideoId(newsItem.video_link) : null;
                    
                    // Process featuredImage URL
                    let featuredImage = null;
                    if (newsItem.featured_image) {
                        featuredImage = processUrl(newsItem.featured_image);
                        console.log('Featured Image Path:', featuredImage);
                    } else if (newsItem.featuredImage) {
                        featuredImage = processUrl(newsItem.featuredImage);
                        console.log('Featured Image Path:', featuredImage);
                    } else if (newsItem.thumbnailUrl) {
                        featuredImage = processUrl(newsItem.thumbnailUrl);
                        console.log('Thumbnail URL Path:', featuredImage);
                    } else if (youtubeId) {
                        // Use YouTube thumbnail if no featured image
                        featuredImage = `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
                        console.log('YouTube Thumbnail Path:', featuredImage);
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
                    
                    // Process journalist information
                    let journalistName = "Journalist";
                    let journalistImage = REPORTOR;
                    
                    // Check if journalist data exists and extract name
                    if (newsItem.journalist) {
                        if (newsItem.journalist.name) {
                            journalistName = newsItem.journalist.name;
                        } else if (newsItem.journalist.username) {
                            journalistName = newsItem.journalist.username;
                        }
                        
                        // Extract journalist profile image if available
                        if (newsItem.journalist.profile_image || newsItem.journalist.profilePic) {
                            const profileImg = newsItem.journalist.profile_image || newsItem.journalist.profilePic;
                            journalistImage = { uri: processUrl(profileImg) };
                        }
                    } else if (newsItem.journalist_name) {
                        journalistName = newsItem.journalist_name;
                    }
                    
                    // Get the like count for this news item
                    let likeCount = 0;
                    try {
                        if (newsItem.id) {
                            // Check if we have it stored in AsyncStorage first
                            const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                            if (likeCountsStr) {
                                const likeCounts = JSON.parse(likeCountsStr);
                                if (likeCounts[newsItem.id] !== undefined) {
                                    likeCount = likeCounts[newsItem.id];
                                }
                            }
                            
                            // If not in storage, try API
                            if (likeCount === 0) {
                                const likeCountEndpoint = `${BASE_URL}api/interaction/news/${newsItem.id}/like/count`;
                                const likeResponse = await GETNETWORK(likeCountEndpoint);
                                
                                if (likeResponse?.success && likeResponse?.data) {
                                    likeCount = likeResponse.data?.count || 
                                              likeResponse.data?.likes_count || 
                                              likeResponse.data?.like_count || 
                                              likeResponse.data?.likes || 0;
                                    
                                    // Store in AsyncStorage
                                    try {
                                        const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                                        let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                                        likeCounts[newsItem.id] = likeCount;
                                        await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                                    } catch (error) {
                                        console.error("Error storing like count:", error);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching like count:", error);
                    }
                    
                    return {
                        id: newsItem.id || Math.random().toString(),
                        youtubeId: youtubeId,
                        videoId: youtubeId, // Keep videoId for backward compatibility
                        title: newsItem.headline || newsItem.title || "News",
                        posterName: journalistName,
                        time: formatTime(newsItem.updatedAt || newsItem.createdAt),
                        accountImage: journalistImage,
                        verifiedIcon: VERIFIED,
                        content: newsItem.content,
                        category: newsItem.category,
                        featuredImage: featuredImage,
                        videoPath: videoPath, // Add videoPath
                        contentType: videoPath ? 'video' : (youtubeId ? 'youtube' : 'text'), // Add contentType
                        rawImagePath: newsItem.featured_image || newsItem.featuredImage || newsItem.thumbnailUrl, // Store original path
                        youtubeUrl: newsItem.youtubeUrl, // Keep original URL for sharing
                        video_link: newsItem.video_link, // Keep original video_link for compatibility
                        createdAt: newsItem.createdAt || newsItem.updatedAt || new Date().toISOString(),
                        updatedAt: newsItem.updatedAt || newsItem.createdAt || new Date().toISOString(),
                        approvedAt: newsItem.approvedAt || newsItem.approved_at || newsItem.updatedAt || newsItem.updated_at || newsItem.createdAt || newsItem.created_at,
                        raw_date: newsItem.createdAt || newsItem.created_at || newsItem.updatedAt || newsItem.updated_at, // Keep raw date for sorting
                        likeCount: likeCount || 0 // Add like count
                    };
                });
                
                // Wait for all Promise.all to resolve the like count fetches
                const resolvedData = await Promise.all(transformedData);
                
                // Log some of the dates to debug
                console.log('Sample of news items before sorting:');
                resolvedData.slice(0, 3).forEach(item => {
                    console.log(`Title: ${item.title.substring(0, 20)}..., Created: ${item.createdAt}, Updated: ${item.updatedAt}, Raw: ${item.raw_date}, Likes: ${item.likeCount}`);
                });

                // Sort by creation date first (newest first)
                const sortedData = resolvedData.sort((a, b) => {
                    // Try parsing dates in different formats
                    let dateA, dateB;
                    
                    // First try raw_date for consistency
                    if (a.raw_date) {
                        dateA = new Date(a.raw_date);
                        // If invalid, try other date fields
                        if (isNaN(dateA.getTime())) {
                            dateA = new Date(a.createdAt || a.updatedAt);
                        }
                    } else {
                        dateA = new Date(a.createdAt || a.updatedAt);
                    }
                    
                    if (b.raw_date) {
                        dateB = new Date(b.raw_date);
                        // If invalid, try other date fields
                        if (isNaN(dateB.getTime())) {
                            dateB = new Date(b.createdAt || b.updatedAt);
                        }
                    } else {
                        dateB = new Date(b.createdAt || b.updatedAt);
                    }
                    
                    // Final fallback if dates are invalid
                    if (isNaN(dateA.getTime())) dateA = new Date();
                    if (isNaN(dateB.getTime())) dateB = new Date();
                    
                    // Sort newest first
                    return dateB - dateA;
                });

                // Count news items with videos for debugging
                const videosCount = sortedData.filter(item => item.videoPath).length;
                console.log(`Total news items with videos: ${videosCount} out of ${sortedData.length}`);

                // Log the first 3 items after sorting to verify
                console.log('News order after sorting:');
                sortedData.slice(0, 3).forEach((item, index) => {
                    const date = new Date(item.raw_date || item.createdAt);
                    console.log(`${index+1}. ${item.title.substring(0, 20)}... - Date: ${date.toLocaleDateString()}, Likes: ${item.likeCount}`);
                });
                
                console.log('Transformed and sorted News Data ready');
                setNewsData(sortedData);
            } else {
                console.error("API Error:", response.message);
                // Check for 500 status code
                if (response.status === 500) {
                    Alert.alert(
                        "System Upgrade",
                        "We are upgrading our system. Please try again after some time.",
                        [{ text: "OK" }]
                    );
                } else {
                    Alert.alert(
                        "Error",
                        response.message || "Unable to fetch news. Please try again later.",
                        [{ text: "OK" }]
                    );
                }
                setNewsData([]);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            // Check if error has status code 500
            if (error.status === 500 || (error.response && error.response.status === 500)) {
                Alert.alert(
                    "System Upgrade",
                    "We are upgrading our system. Please try again after some time.",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "Error",
                    "Unable to fetch news. Please check your internet connection and try again.",
                    [{ text: "OK" }]
                );
            }
            setNewsData([]);
        } finally {
            if (!isRefreshing) {
                // setLoading(false); // Commented out as requested
            }
            setRefreshing(false);
        }
    };

    // Replace useFocusEffect with useEffect
    useEffect(() => {
        fetchNewsData();
        checkLoginStatus();
        initializeLikedPosts();
    }, []);

    // Add onRefresh handler
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchNewsData(true);
    }, []);

    // PopoverAd handling functions
    const handleAdClose = () => {
        setShowAd(false);
        setPageCount(0); // Reset page count after ad is closed
        // Don't reset lastAdShowTime - let the cooldown continue
    };

    const handleMomentumScrollEnd = (event) => {
        // Only count page scroll if not currently showing ad
        if (!showAd) {
            const currentScrollY = event.nativeEvent.contentOffset.y;
            
            // Calculate which page we're on based on scroll position
            // Each page contains 4 items, so we can estimate page number
            const estimatedPageNumber = Math.round(currentScrollY / (HEIGHT * 0.8));
            
            if (estimatedPageNumber > pageCount) {
                const newPageCount = pageCount + 1;
                setPageCount(newPageCount);
                
                console.log("🎯 PopoverAd: Page count:", newPageCount, "of", pageThreshold, "| Estimated page:", estimatedPageNumber);
                
                // Show ad after every 5th page, but respect cooldown period
                if (newPageCount >= pageThreshold) {
                    const now = Date.now();
                    const timeSinceLastAd = now - lastAdShowTime;
                    
                    if (timeSinceLastAd > adCooldown) {
                        console.log("🎯 PopoverAd: Page threshold reached (5 pages), showing ad");
                        setShowAd(true);
                        setLastAdShowTime(now);
                    } else {
                        console.log("🎯 PopoverAd: Cooldown active, skipping ad. Time remaining:", Math.ceil((adCooldown - timeSinceLastAd) / 1000), "seconds");
                        setPageCount(0); // Reset count but don't show ad
                    }
                }
            }
        }
    };

    // Function to check login status
    const checkLoginStatus = async () => {
        try {
            // Try to get token from AsyncStorage
            let userToken = await getStoredToken();
            if (!userToken) {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    userToken = user?.token;
                }
            }
            if (!userToken) {
                userToken = await AsyncStorage.getItem('loginResponse');
            }
            
            setIsLoggedIn(!!userToken);
        } catch (error) {
            console.error("Error checking login status:", error);
            setIsLoggedIn(false);
        }
    };

    // Function to initialize liked posts
    const initializeLikedPosts = async () => {
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

    // Update handleLike function to use API
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
            const newsItem = newsData.find(item => item.id === id);
            if (!newsItem) {
                console.error("News item not found:", id);
                return;
            }
            
            // Update UI first for immediate feedback
            setReaction((prevState) => ({
                ...prevState,
                [id]: prevState[id] === "like" ? null : "like",
            }));
            
            // Toggle like status
            const isLiked = reaction[id] !== "like";
            
            // Update like count in the newsData state
            setNewsData(prevData => 
                prevData.map(item => {
                    if (item.id === id) {
                        const newLikeCount = isLiked ? (item.likeCount || 0) + 1 : Math.max(0, (item.likeCount || 0) - 1);
                        return { ...item, likeCount: newLikeCount };
                    }
                    return item;
                })
            );
            
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
                
                // Store updated like count in AsyncStorage
                const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                likeCounts[id] = isLiked ? (likeCounts[id] || 0) + 1 : Math.max(0, (likeCounts[id] || 0) - 1);
                await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                
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

    const handleDislike = (id) => {
        setReaction((prevState) => ({
            ...prevState,
            [id]: prevState[id] === "dislike" ? null : "dislike",
        }));
    };

    // Add handleViewCount function after handleShare or before onNavigateNews
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

    // Update onNavigateNews function to pass videoPath to navigation
    const onNavigateNews = (item) => {
        // Track the view
        handleViewCount(item.id);
        
        // Navigate to the Trending News screen
        navigation.navigate("Trending", {
            newsData: {
                id: item.id,
                videoId: item.youtubeId,
                videoPath: item.videoPath,
                video_link: item.video_link || item.youtubeUrl,
                featured_image: item.featuredImage,
                headline: item.title,
                content: item.content,
                time: item.time,
                contentType: item.contentType,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                approvedAt: item.approvedAt,
                category: item.category,
                additionalImage: item.additionalImage, // Add this line
                journalist: {
                    name: item.posterName,
                    profile_image: item.accountImage
                }
            }
        });
    };

    const handleShare = async (item) => {
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

    const handleFollow = (id) => {
        setFollowStatus((prevState) => ({
            ...prevState,
            [id]: prevState[id] ? false : true,
        }));
    };

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

    const renderCard = ({ item, index }) => {
        // Log video path for debugging if present
        if (item.videoPath) {
            console.log(`Rendering card for item ${item.id} with video path:`, item.videoPath);
        }
        
        // Check if YouTube ID exists
        const hasYoutubeId = item.youtubeId !== null && item.youtubeId !== undefined;
        
        // Use the imageErrors state from the component level
        const hasImageError = imageErrors[item.id] || false;
        
        // Get the date string for display
        const dateStr = formatDate(item.createdAt || item.updatedAt);
        
        // Render big card or small card based on cardType
        if (item.cardType === 'big') {
            return (
                <View style={styles.bigCardWrapper}>
                    <View style={styles.bigCard}>
                        <View style={styles.bigCardImageContainer}>
                            <TouchableOpacity 
                                style={styles.bigCardTouchable}
                                activeOpacity={0.9}
                                onPress={() => onNavigateNews(item)}
                            >
                                {item.youtubeId ? (
                                    <YoutubeIframe
                                        height={137.45}
                                        style={styles.bigCardVideo}
                                        videoId={item.youtubeId}
                                        allowFullscreen={true}
                                        autoplay={false}
                                    />
                                ) : item.videoPath ? (
                                    <VideoPlayer videoPath={item.videoPath} size="big" />
                                ) : item.featuredImage ? (
                                    <Image 
                                        source={{ uri: item.featuredImage }}
                                        style={styles.bigCardImage}
                                        resizeMode="cover"
                                        onError={(e) => {
                                            console.log('Image load error:', e.nativeEvent.error);
                                            console.log('Failed image URI:', item.featuredImage);
                                            setImageErrors(prev => ({...prev, [item.id]: true}));
                                        }}
                                    />
                                ) : (
                                    <View style={styles.bigCardPlaceholder}>
                                        <Text style={styles.bigCardPlaceholderText}>{item.title.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.bigCardContent}>
                            <View style={styles.bigCardTitleRow}>
                                <Text style={styles.bigCardTitle} numberOfLines={3} ellipsizeMode="tail">{item.title}</Text>
                                <Text style={styles.bigCardDate}>{dateStr}</Text>
                            </View>
                            <Text style={styles.bigCardTime}>{item.time}</Text>
                        </View>

                        <View style={styles.bigCardActions}>
                            <View style={styles.bigCardIconContainer}>
                                <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.bigCardActionButton}>
                                    <Image
                                        source={reaction[item.id] === "like" ? PRESSLIKE : LIKE}
                                        style={styles.bigCardActionIcon}
                                    />
                                    <Text style={styles.bigCardActionText}>
                                        {item.likeCount > 999 ? (item.likeCount / 1000).toFixed(1) + 'k' : item.likeCount || 0}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleWhatsAppShare(item)} style={styles.bigCardActionButton}>
                                    <Image source={WHATSAPP} style={styles.bigCardActionIcon} />
                                    <Text style={styles.bigCardActionText}>Share</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleCommentPress(item)} style={styles.bigCardActionButton}>
                                    <Image source={COMMENT} style={styles.bigCardActionIcon} />
                                    <Text style={styles.bigCardActionText}>Comments</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.bigCardReadMoreButton}
                                onPress={() => onNavigateNews(item)}
                            >
                                <Text style={styles.bigCardReadMoreText}>Read more</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        } else {
            // Small card layout
            return (
                <View style={styles.smallCardWrapper}>
                    <View style={styles.smallCard}>
                        <View style={styles.smallCardImageContainer}>
                            <TouchableOpacity 
                                style={styles.smallCardTouchable}
                                activeOpacity={0.9}
                                onPress={() => onNavigateNews(item)}
                            >
                                {item.youtubeId ? (
                                    <YoutubeIframe
                                        height={72}
                                        style={styles.smallCardVideo}
                                        videoId={item.youtubeId}
                                        allowFullscreen={true}
                                        autoplay={false}
                                    />
                                ) : item.videoPath ? (
                                    <VideoPlayer videoPath={item.videoPath} size="small" />
                                ) : item.featuredImage ? (
                                    <Image 
                                        source={{ uri: item.featuredImage }}
                                        style={styles.smallCardImage}
                                        resizeMode="cover"
                                        onError={(e) => {
                                            console.log('Image load error:', e.nativeEvent.error);
                                            console.log('Failed image URI:', item.featuredImage);
                                            setImageErrors(prev => ({...prev, [item.id]: true}));
                                        }}
                                    />
                                ) : (
                                    <View style={styles.smallCardPlaceholder}>
                                        <Text style={styles.smallCardPlaceholderText}>{item.title.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.smallCardContent}>
                            <Text style={styles.smallCardTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                            <Text style={styles.smallCardTime}>{item.time}</Text>
                            
                            <View style={styles.smallCardActions}>
                                <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.smallCardActionButton}>
                                    <Image
                                        source={reaction[item.id] === "like" ? PRESSLIKE : LIKE}
                                        style={styles.smallCardActionIcon}
                                    />
                                    <Text style={styles.smallCardActionText}>
                                        {item.likeCount > 999 ? (item.likeCount / 1000).toFixed(1) + 'k' : item.likeCount || 0}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleWhatsAppShare(item)} style={styles.smallCardActionButton}>
                                    <Image source={WHATSAPP} style={styles.smallCardActionIcon} />
                                    <Text style={styles.smallCardActionText}>Share</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleCommentPress(item)} style={styles.smallCardActionButton}>
                                    <Image source={COMMENT} style={styles.smallCardActionIcon} />
                                    <Text style={styles.smallCardActionText}>Comments</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.smallCardReadMoreButton}
                                    onPress={() => onNavigateNews(item)}
                                >
                                    <Text style={styles.smallCardReadMoreText}>Read more</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            );
        }
    };

    // Prepare data with specific pattern: 1 Big Card → 1 Small Card → NativeAdComponent → 1 Small Card
    const prepareDataWithAds = (newsItems) => {
        if (!newsItems || newsItems.length === 0) return [];
        
        const dataWithAds = [];
        let newsIndex = 0;
        
        while (newsIndex < newsItems.length) {
            // Add 1 big card (first item in each group)
            if (newsIndex < newsItems.length) {
                dataWithAds.push({
                    ...newsItems[newsIndex],
                    itemType: 'news',
                    cardType: 'big'
                });
                newsIndex++;
            }
            
            // Add 1 small card (second item in each group)
            if (newsIndex < newsItems.length) {
                dataWithAds.push({
                    ...newsItems[newsIndex],
                    itemType: 'news',
                    cardType: 'small'
                });
                newsIndex++;
            }
            
            // Add NativeAdComponent
            dataWithAds.push({
                id: `ad-${Math.random().toString()}`,
                itemType: 'ad'
            });
            
            // Add 1 small card (third item in each group)
            if (newsIndex < newsItems.length) {
                dataWithAds.push({
                    ...newsItems[newsIndex],
                    itemType: 'news',
                    cardType: 'small'
                });
                newsIndex++;
            }
        }
        
        return dataWithAds;
    };


    const renderItem = ({ item, index }) => {
        // If it's an ad, render the NativeAdComponent
        if (item.itemType === 'ad') {
            return <NativeAdComponent style={styles.adContainer} />;
        }
        
        // Otherwise render a news card
        return renderCard({ item, index });
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

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={BLUE} style={styles.loader} />
                        <Text style={{fontFamily: LORA, marginTop: HEIGHT * 0.01}}>Loading Trending news...</Text>
                    </View>
                ) : newsData.length === 0 ? (
                    <View style={styles.noNewsContainer}>
                        <Text style={styles.noNewsText}>No Trending News Available</Text>
                    </View>
                ) : (
                    <FlatList
                        data={prepareDataWithAds(newsData)}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 50 }}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        onMomentumScrollEnd={handleMomentumScrollEnd}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            refreshing ? (
                                <View>
                                    {[1, 2, 3].map((_, index) => (
                                        <NewsSkeleton key={index} />
                                    ))}
                                </View>
                            ) : null
                        }
                    />
                )}
            </View>
            
            {/* <MyLoader 
                visible={loading}
            /> */}
            
            {/* Comment Modal */}
            {renderCommentModal()}
            
            {/* Login Alert */}
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
                        returnScreen: "TrendingNewzScreen"
                    });
                }}
            />
            
            {/* PopoverAd - Shows after every 5th scroll */}
            {showAd && (
                <PopoverAd 
                    onClose={handleAdClose} 
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.02,
    },


    loader: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: WIDTH * 0.02,
    },
    noNewsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: HEIGHT * 0.05,
    },
    noNewsText: {
        fontSize: WIDTH * 0.04,
        color: GREY,
        fontFamily: BOLDMONTSERRAT,
        textAlign: 'center',
    },
    adContainer: {
        width: WIDTH * 0.9,
        marginTop: HEIGHT * 0.015,
        marginBottom: HEIGHT * 0.005,
        alignSelf: 'center',
        // maxHeight: HEIGHT * 0.25,
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

    // Modal styles
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

    skeletonText: {
        height: HEIGHT * 0.02,
        backgroundColor: '#e1e9ee',
        borderRadius: WIDTH * 0.01,
        width: '60%',
    },
    skeletonCard: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.015,
        padding: WIDTH * 0.015,
        marginVertical: HEIGHT * 0.01,
        width: WIDTH * 0.9,
        alignSelf: 'center',
        elevation: 2,
        borderWidth: 1,
        borderColor: BORDERCOLOR,
    },
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.01,
    },
    skeletonAvatar: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
        borderRadius: WIDTH * 0.03,
        backgroundColor: '#e1e9ee',
        marginRight: WIDTH * 0.015,
    },
    skeletonName: {
        width: WIDTH * 0.2,
        height: WIDTH * 0.035,
        backgroundColor: '#e1e9ee',
        borderRadius: WIDTH * 0.005,
    },
    skeletonImage: {
        width: '100%',
        height: HEIGHT * 0.16,
        backgroundColor: '#e1e9ee',
        borderRadius: WIDTH * 0.015,
        marginBottom: HEIGHT * 0.01,
    },
    skeletonContent: {
        padding: WIDTH * 0.01,
    },
    skeletonTitle: {
        width: '90%',
        height: WIDTH * 0.038,
        backgroundColor: '#e1e9ee',
        borderRadius: WIDTH * 0.005,
        marginBottom: HEIGHT * 0.01,
    },
    skeletonDate: {
        width: '40%',
        height: WIDTH * 0.03,
        backgroundColor: '#e1e9ee',
        borderRadius: WIDTH * 0.005,
        marginBottom: HEIGHT * 0.01,
    },
    skeletonActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: HEIGHT * 0.01,
    },
    skeletonAction: {
        width: WIDTH * 0.15,
        height: WIDTH * 0.045,
        backgroundColor: '#e1e9ee',
        borderRadius: WIDTH * 0.02,
    },
    // Big Card Styles
    bigCardWrapper: {
        marginTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.015,
        alignItems: "center",
        width: "100%",
    },
    bigCard: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.015,
        overflow: "hidden",
        padding: WIDTH * 0.015,
        paddingBottom: WIDTH * 0.02,
        elevation: 2,
        borderWidth: 1,
        borderColor: BORDERCOLOR,
        width: 360,
        height: 220,
        alignSelf: "center",
    },
    bigCardImageContainer: {
        borderRadius: WIDTH * 0.015,
        overflow: "hidden",
        marginBottom: HEIGHT * 0.01,
    },
    bigCardTouchable: {
        width: "100%",
    },
    bigCardVideo: {
        width: 331.44,
        height: 137.45,
        borderRadius: WIDTH * 0.015,
    },
    bigCardImage: {
        width: 331.44,
        height: 137.45,
        borderRadius: WIDTH * 0.015,
    },
    bigCardPlaceholder: {
        width: 331.44,
        height: 137.45,
        backgroundColor: '#e1e1e1',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: WIDTH * 0.015,
    },
    bigCardPlaceholderText: {
        fontSize: WIDTH * 0.15,
        fontFamily: BOLDMONTSERRAT,
        color: '#a1a1a1',
        opacity: 0.8
    },
    bigCardContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    bigCardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: HEIGHT * 0.005,
    },
    bigCardTitle: {
        fontSize: WIDTH * 0.04,
        fontFamily: BOLDMONTSERRAT,
        color: BLACK,
        flex: 1,
        marginRight: WIDTH * 0.02,
    },
    bigCardTime: {
        fontSize: WIDTH * 0.03,
        fontFamily: LORA,
        color: BLACK,
        marginBottom: HEIGHT * 0.003,
    },
    bigCardDate: {
        fontSize: WIDTH * 0.02,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        flexShrink: 0,
        textAlign: 'right',
    },
    bigCardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: HEIGHT * 0.01,
    },
    bigCardIconContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
    },
    bigCardActionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(240, 240, 240, 0.4)',
        paddingVertical: HEIGHT * 0.004,
        paddingHorizontal: WIDTH * 0.015,
        borderRadius: WIDTH * 0.03,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        marginRight: WIDTH * 0.015,
    },
    bigCardActionIcon: {
        width: WIDTH * 0.035,
        height: WIDTH * 0.035,
        marginRight: WIDTH * 0.008,
    },
    bigCardActionText: {
        fontSize: WIDTH * 0.02,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    bigCardReadMoreButton: {
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.006,
        paddingHorizontal: WIDTH * 0.025,
        borderRadius: WIDTH * 0.015,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigCardReadMoreText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.025,
    },
    // Small Card Styles
    smallCardWrapper: {
        marginTop: HEIGHT * 0.008,
        marginBottom: HEIGHT * 0.015,
        alignItems: "center",
        width: "100%",
    },
    smallCard: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.015,
        overflow: "hidden",
        padding: WIDTH * 0.015,
        elevation: 2,
        borderWidth: 1,
        borderColor: BORDERCOLOR,
        width: 356,
        minHeight: 95,
        alignSelf: "center",
        flexDirection: "row",
    },
    smallCardImageContainer: {
        borderRadius: WIDTH * 0.01,
        overflow: "hidden",
        marginRight: WIDTH * 0.015,
    },
    smallCardTouchable: {
        width: "100%",
    },
    smallCardVideo: {
        width: 111,
        height: 72,
        borderRadius: WIDTH * 0.01,
    },
    smallCardImage: {
        width: 111,
        height: 72,
        borderRadius: WIDTH * 0.01,
    },
    smallCardPlaceholder: {
        width: 111,
        height: 72,
        backgroundColor: '#e1e1e1',
        justifyContent: "center",
        alignItems: "center",
        borderRadius: WIDTH * 0.01,
    },
    smallCardPlaceholderText: {
        fontSize: WIDTH * 0.08,
        fontFamily: BOLDMONTSERRAT,
        color: '#a1a1a1',
        opacity: 0.8
    },
    smallCardContent: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: HEIGHT * 0.003,
    },
    smallCardTitle: {
        fontSize: WIDTH * 0.035,
        fontFamily: BOLDMONTSERRAT,
        color: BLACK,
        marginBottom: HEIGHT * 0.003,
    },
    smallCardTime: {
        fontSize: WIDTH * 0.025,
        fontFamily: LORA,
        color: BLACK,
        marginBottom: HEIGHT * 0.005,
    },
    smallCardActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
        marginTop: HEIGHT * 0.003,
    },
    smallCardActionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(240, 240, 240, 0.4)',
        paddingVertical: HEIGHT * 0.003,
        paddingHorizontal: WIDTH * 0.01,
        borderRadius: WIDTH * 0.02,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        marginRight: WIDTH * 0.01,
    },
    smallCardActionIcon: {
        width: WIDTH * 0.025,
        height: WIDTH * 0.025,
        marginRight: WIDTH * 0.005,
    },
    smallCardActionText: {
        fontSize: WIDTH * 0.018,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    smallCardReadMoreButton: {
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.003,
        paddingHorizontal: WIDTH * 0.012,
        borderRadius: WIDTH * 0.02,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: WIDTH * 0.01,
    },
    smallCardReadMoreText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.02,
    },
    // Video player styles for big card
    bigCardVideoWrapper: {
        width: 331.44,
        height: 137.45,
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: WIDTH * 0.015,
    },
    bigCardBackgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: WIDTH * 0.015,
    },
    // Video player styles for small card
    smallCardVideoWrapper: {
        width: 111,
        height: 72,
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: WIDTH * 0.01,
    },
    smallCardBackgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: WIDTH * 0.01,
    },
});