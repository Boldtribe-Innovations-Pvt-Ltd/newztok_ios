import React, { useState, useEffect, useRef, useCallback } from "react";
import { FlatList, Image, Share, StyleSheet, Text, TouchableOpacity, View, Alert, Linking, ActivityIndicator } from "react-native";
import { BLACK, BLUE, BORDERCOLOR, GREY, RED, WHITE } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { LIKE, SHARE as SHAREICON, PRESSLIKE, ACCOUNT, VERIFIED, RAMNABAMI, LINKEDIN, YOUTUBE, FACEBOOKICON, INSTAGRAM, XICON, WHATSAPP, SHARE } from "../../constants/imagePath";
import YoutubeIframe from "react-native-youtube-iframe";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";
import { BASE_URL } from "../../constants/url";
console.log('Current BASE_URL:', BASE_URL);
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { WIDTH, HEIGHT } from "../../constants/config";
import { BOLDMONTSERRAT, LORA, POPPINSLIGHT } from "../../constants/fontPath";
import NativeAdComponent from "../../components/ads/NativeAdComponent";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getObjByKey, getStringByKey } from "../../utils/Storage";
import Video from 'react-native-video';
import { MyAlert } from "../../components/commonComponents/MyAlert";

console.log('Main Screen - Current BASE_URL:', BASE_URL);

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

export default function NMainScreenScreen({ navigation }) {
    const [reaction, setReaction] = useState({});
    const [followStatus, setFollowStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [newsData, setNewsData] = useState([]);
    const [imageErrors, setImageErrors] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginAlert, setShowLoginAlert] = useState(false); // Add state for login alert

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

    const fetchNewsData = async () => {
        try {
            setLoading(true);
            console.log('Fetching news from:', `${BASE_URL}api/news/trending`);
            
            const response = await GETNETWORK(`${BASE_URL}api/news/trending`);
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
                const transformedData = newsArray.map(newsItem => {
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
                    let journalistName = "Unknown";
                    let journalistImage = ACCOUNT;
                    
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
                        raw_date: newsItem.createdAt || newsItem.created_at || newsItem.updatedAt || newsItem.updated_at // Keep raw date for sorting
                    };
                });
                
                // Log some of the dates to debug
                console.log('Sample of news items before sorting:');
                transformedData.slice(0, 3).forEach(item => {
                    console.log(`Title: ${item.title.substring(0, 20)}..., Created: ${item.createdAt}, Updated: ${item.updatedAt}, Raw: ${item.raw_date}`);
                });

                // Sort by creation date first (newest first)
                const sortedData = transformedData.sort((a, b) => {
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
                    console.log(`${index+1}. ${item.title.substring(0, 20)}... - Date: ${date.toLocaleDateString()}`);
                });
                
                console.log('Transformed and sorted News Data ready');
                setNewsData(sortedData);
            } else {
                console.error("API Error:", response.message);
                Alert.alert(
                    "Error",
                    response.message || "Unable to fetch news. Please try again later.",
                    [{ text: "OK" }]
                );
                setNewsData([]);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            Alert.alert(
                "Error",
                "Unable to fetch news. Please check your internet connection and try again.",
                [{ text: "OK" }]
            );
            setNewsData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch news data
    useFocusEffect(
        useCallback(() => {
            fetchNewsData();
            return () => {};
        }, [])
    );

    // Add useEffect to check login status and initialize likes
    useEffect(() => {
        checkLoginStatus();
        initializeLikedPosts();
    }, []);

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
        
        // Navigate to the HomeNews screen
        navigation.navigate("HomeScreen", {
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

    const renderCard = ({ item }) => {
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
                                        // Update the imageErrors state
                                        setImageErrors(prev => ({...prev, [item.id]: true}));
                                    }}
                                />
                            ) : (
                                // Add a placeholder view for missing images
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

                    <View style={styles.actionContainer}>
                        <View style={styles.iconContainer}>
                            <View style={styles.likeDislikeContainer}>
                                <TouchableOpacity onPress={() => handleLike(item.id)}>
                                    <Image
                                        source={reaction[item.id] === "like" ? PRESSLIKE : LIKE}
                                        style={styles.icon}
                                    />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => handleShare(item)}>
                                <Image source={SHARE} style={styles.icon} />
                            </TouchableOpacity>
                        </View>

                        <CustomBtn text="Read More" width={WIDTH * 0.25} onPress={() => onNavigateNews(item)} />
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
        newsItems.forEach((item) => {
            // Add the news item
            dataWithAds.push({
                ...item,
                itemType: 'news'
            });
            
            // Add an ad after each news item
            dataWithAds.push({
                id: `ad-${Math.random().toString()}`,
                itemType: 'ad'
            });
        });
        
        return dataWithAds;
    };

    const renderSocialCard = () => {
        const handleWhatsappPress = () => {
            Linking.openURL('https://whatsapp.com/channel/0029VbA2TzqG8l5AxszzsJ0E');
        };

        const handleInstagramPress = () => {
            Linking.openURL('https://www.instagram.com/newztok.news?utm_source=qr&igsh=MW5hOGlyZW0yZDhmaA==');
        };

        const handleYoutubePress = () => {
            Linking.openURL('https://www.youtube.com/channel/UCn3IbwYbzMqebVC7AHlRD3A');
        };

        const handleLinkedinPress = () => {
            Linking.openURL('https://www.linkedin.com/company/newztok/');
        };

        const handleFacebookPress = () => {
            Linking.openURL('https://www.facebook.com/share/16BJSMtSn1/');
        };

        const handleXPress = () => {
            Linking.openURL('https://x.com/newztok_news?t=bE27w5SMkv5Hdpu9TJPCJQ&s=09');
        };

        return (
            <View style={styles.socialMediaCard}>
                {/* Black diagonal gradient from top-right */}
                <LinearGradient
                    colors={["#000000", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.3)", "transparent"]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={styles.blackGradient}
                />
                
                {/* Central white diagonal strip */}
                <LinearGradient
                    colors={["transparent", "#FFFFFF", "transparent"]}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 1, y: 0.6 }}
                    locations={[0.2, 0.5, 0.8]}
                    style={styles.whiteStrip}
                />
                
                {/* Red diagonal gradient from bottom-left */}
                <LinearGradient
                    colors={["#D21008", "rgba(210,16,8,0.8)", "rgba(210,16,8,0.3)", "transparent"]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.redGradient}
                />

                <Text style={styles.socialMediaText}>Join our community</Text>
                <View style={styles.socialIconsContainer}>
                    <TouchableOpacity onPress={handleLinkedinPress} style={styles.socialIconButton}>
                        <Image source={LINKEDIN} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <View style={styles.iconSpacer} />
                    <TouchableOpacity onPress={handleYoutubePress} style={styles.socialIconButton}>
                        <Image source={YOUTUBE} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <View style={styles.iconSpacer} />
                    <TouchableOpacity onPress={handleFacebookPress} style={styles.socialIconButton}>
                        <Image source={FACEBOOKICON} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <View style={styles.iconSpacer} />
                    <TouchableOpacity onPress={handleInstagramPress} style={styles.socialIconButton}>
                        <Image source={INSTAGRAM} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <View style={styles.iconSpacer} />
                    <TouchableOpacity onPress={handleXPress} style={styles.socialIconButton}>
                        <Image source={XICON} style={{...styles.socialIcon, tintColor: WHITE}} />
                    </TouchableOpacity>
                    <View style={styles.iconSpacer} />
                    <TouchableOpacity onPress={handleWhatsappPress} style={styles.socialIconButton}>
                        <Image source={WHATSAPP} style={styles.socialIcon} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderItem = ({ item }) => {
        // If it's an ad, render the NativeAdComponent
        if (item.itemType === 'ad') {
            return <NativeAdComponent style={styles.adContainer} />;
        }
        
        // Otherwise render a news card
        return renderCard({ item });
    };

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={BLUE} style={styles.loader} />
                        <Text style={{fontFamily: LORA, marginTop: HEIGHT * 0.01}}>Loading Home news...</Text>
                    </View>
                ) : newsData.length === 0 ? (
                    <View style={styles.noNewsContainer}>
                        <Text style={styles.noNewsText}>No Home News Available</Text>
                    </View>
                ) : (
                    <FlatList
                        ListHeaderComponent={renderSocialCard}
                        data={prepareDataWithAds(newsData)}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
            
            <MyLoader 
            visible={loading}
            />
            
            {/* Add MyAlert component for login prompt */}
            <MyAlert
                visible={showLoginAlert}
                title="Login Required"
                message="Please log in to like this news"
                textLeft="Cancel"
                textRight="Login"
                backgroundColor={BLUE}
                onPressLeft={() => setShowLoginAlert(false)}
                onPressRight={() => {
                    setShowLoginAlert(false);
                    navigation.navigate("LoginSignup", {
                        returnScreen: "MainScreen"
                    });
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
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
    time: {
        fontSize: WIDTH * 0.03,
        fontFamily: LORA,
        color: BLACK,
        flexShrink: 0,
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
    actionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: HEIGHT * 0.005,
    },
    iconContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    likeDislikeContainer: {
        flexDirection: "row",
        alignItems: "center",
        // backgroundColor: GREY,
        padding: WIDTH * 0.008,
        borderRadius: WIDTH * 0.025,
        marginRight: WIDTH * 0.015,
    },
    separator: {
        width: 1,
        height: "100%",
        // backgroundColor: GREY,
        marginHorizontal: WIDTH * 0.01,
    },
    icon: {
        width: WIDTH * 0.05,
        height: WIDTH * 0.05,
        marginHorizontal: WIDTH * 0.008,
    },
    accountImage: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
        borderRadius: WIDTH * 0.04,
        marginRight: WIDTH * 0.015,
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
    followedButton: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BLUE,
    },
    followedText: {
        color: BLUE,
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
    socialMediaCard: {
        height: HEIGHT * 0.18,
        borderRadius: WIDTH * 0.03,
        marginVertical: HEIGHT * 0.02,
        padding: WIDTH * 0.05,
        justifyContent: 'center',
        alignItems: 'center',
        width: WIDTH * 0.9,
        alignSelf: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    blackGradient: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        borderRadius: WIDTH * 0.03,
        zIndex: 1,
    },
    whiteStrip: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        borderRadius: WIDTH * 0.03,
        zIndex: 2,
    },
    redGradient: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        borderRadius: WIDTH * 0.03,
        zIndex: 3,
    },
    socialMediaText: {
        fontSize: WIDTH * 0.05,
        fontFamily: BOLDMONTSERRAT,
        color: WHITE,
        marginBottom: HEIGHT * 0.015,
        zIndex: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    socialIconsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    socialIconButton: {
        padding: WIDTH * 0.01,
    },
    iconSpacer: {
        width: WIDTH * 0.02,
    },
    socialIcon: {
        width: WIDTH * 0.08,
        height: WIDTH * 0.08,
        resizeMode: 'contain',
    },
});