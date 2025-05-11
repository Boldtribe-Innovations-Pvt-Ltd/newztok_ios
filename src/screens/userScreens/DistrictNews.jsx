import React, { useState, useEffect, useRef } from "react";
import { Image, Linking, Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { BLACK, BLUE, GREY, RED, WHITE } from "../../constants/color";
import { FlatList } from "react-native-gesture-handler";
import { ACCOUNT, DISLIKE, LIKE, PRESSDISLIKE, PRESSLIKE, SHARE, THREEDOTS, WHATSAPP, LOGO2, VIEW } from "../../constants/imagePath";
import YoutubeIframe from "react-native-youtube-iframe";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { getObjByKey, getStringByKey } from "../../utils/Storage";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { BASE_URL } from "../../constants/url";
import { HEIGHT, WIDTH } from "../../constants/config";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../constants/fontPath";
import HTML from "react-native-render-html";
import Video from 'react-native-video';

// Helper function to process URLs (images and videos)
const processUrl = (url) => {
    if (!url) return null;
    
    // If it's already a full URL (starts with http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // For paths starting with '/uploads'
    if (url.startsWith('/uploads')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        return `${baseUrlFormatted}${url}`;
    }
    
    // For paths starting with 'uploads/' without leading slash
    if (url.startsWith('uploads/')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
        return `${baseUrlFormatted}${url}`;
    }
    
    // If it's just a filename, assume it's in uploads folder
    if (!url.includes('/')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
        return `${baseUrlFormatted}uploads/${url}`;
    }
    
    // For other paths
    return url;
};

// VideoPlayer component
const VideoPlayer = ({ videoPath }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(true); // Start paused
    
    console.log('[VideoPlayer] Received videoPath:', videoPath);
    
    // Process the video URL to ensure it's properly formatted with BASE_URL
    const getFullVideoUrl = (path) => {
        return processUrl(path);
    };
    
    // Create a proper source object for the Video component
    const getVideoSource = () => {
        try {
            if (!videoPath) {
                console.log('[VideoPlayer] getVideoSource: No videoPath provided');
                return null;
            }
            
            // If already an object with uri
            if (typeof videoPath === 'object' && videoPath.uri) {
                console.log('[VideoPlayer] getVideoSource: Using object with uri:', videoPath.uri);
                return videoPath;
            }
            
            // If string path
            if (typeof videoPath === 'string') {
                const fullUrl = getFullVideoUrl(videoPath);
                console.log('[VideoPlayer] getVideoSource: Full video URL:', fullUrl);
                return { uri: fullUrl };
            }
            
            console.log('[VideoPlayer] getVideoSource: Unsupported videoPath type:', typeof videoPath);
            return null;
        } catch (err) {
            console.error('[VideoPlayer] Error creating video source:', err);
            return null;
        }
    };
    
    const videoSource = getVideoSource();
    console.log('[VideoPlayer] Final video source:', JSON.stringify(videoSource));
    
    const onBuffer = (buffer) => {
        console.log('[VideoPlayer] Video buffering:', buffer);
    };
    
    const onError = (err) => {
        console.error('[VideoPlayer] Video error details:', JSON.stringify(err));
        setError(true);
        setLoading(false);
    };
    
    const onLoad = () => {
        console.log('[VideoPlayer] Video loaded successfully');
        setLoading(false);
    };
    
    // Handler to toggle play/pause
    const togglePlayback = () => {
        setPaused(!paused);
    };
    
    // Check if videoSource is valid
    if (!videoSource) {
        console.log('[VideoPlayer] Invalid video source for path:', videoPath);
        return (
            <View style={[styles.backgroundVideo, styles.videoPlaceholder]}>
                <Text style={styles.videoErrorText}>No video available</Text>
                {__DEV__ && videoPath && (
                    <Text style={styles.videoErrorText}>Path: {videoPath.substring(0, 50)}</Text>
                )}
            </View>
        );
    }
    
    return (
        <View style={styles.videoWrapper}>
            <Video
                source={videoSource}
                ref={videoRef}
                onBuffer={onBuffer}
                onLoad={onLoad}
                onError={onError}
                onLoadStart={() => console.log('[VideoPlayer] Video load started')}
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

export default DistrictNews = ({ route, navigation }) => {
    const { videoId, title, news, newsId, featuredImage: routeFeaturedImage } = route.params;
    const [reaction, setReaction] = useState({});
    const [newsData, setNewsData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });
    
    // Login and comment states
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [fetchingComments, setFetchingComments] = useState(false);
    const [posting, setPosting] = useState(false);

    // Add new state variables for like functionality 
    const [likeCount, setLikeCount] = useState(0);
    const [viewCount, setViewCount] = useState(0);
    const [liking, setLiking] = useState(false);
    const [videoSrc, setVideoSrc] = useState(videoId);
    const [contentHasHtml, setContentHasHtml] = useState(false);
    
    // Determine content type (video file, YouTube video, or image)
    const [contentType, setContentType] = useState('text');

    // Process the featuredImage url properly
    const processImageUrl = (url) => {
        return processUrl(url);
    };
    
    // Process featured image from route params like SportsNews.jsx
    const fullImageUrl = routeFeaturedImage ? 
        (routeFeaturedImage.startsWith('http') ? routeFeaturedImage : `${BASE_URL}${routeFeaturedImage.replace(/^\/+/, '')}`) : 
        null;

    // Log for debugging
    console.log('Processing featured image:', routeFeaturedImage);
    console.log('Full image URL:', fullImageUrl);

    // Check if content has HTML tags
    const hasHtmlTags = (text) => {
        if (!text) return false;
        return /<[a-z][\s\S]*>/i.test(text);
    };

    // Function to remove HTML tags
    const removeHtmlTags = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    };

    // Helper function to extract YouTube video ID from URL
    const extractVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Check if user is logged in
    useEffect(() => {
        checkLoginStatus();
    }, []);

    // Fetch news data and comments when component mounts
    useEffect(() => {
        if (newsId || route.params?.newsId) {
            fetchNewsData();
            fetchComments();
            fetchLikeCount();
            fetchViewCount();
            recordView();
        }
    }, [newsId, route.params?.newsId]);

    const fetchNewsData = async () => {
        try {
            setLoading(true);
            console.log('Route params:', route.params);
            
            // Get the actual newsId (from props or route params)
            const targetNewsId = newsId || route.params?.newsId;
            const routeNewsData = route.params?.newsData || {};
            
            // Log what we're working with
            console.log('Target NewsID:', targetNewsId);
            console.log('Route featuredImage:', routeFeaturedImage);
            console.log('Route videoId:', videoId);
            console.log('Route newsData:', routeNewsData);
            
            // If we already have the data from route params, use it
            if (title || routeNewsData.title) {
                // Set content HTML status
                if (news || routeNewsData.content) {
                    const contentToUse = news || routeNewsData.content || "";
                    setContentHasHtml(hasHtmlTags(contentToUse));
                    console.log('Content has HTML:', hasHtmlTags(contentToUse));
                }
                
                // Extract video ID from youtubeUrl if not directly provided
                let videoIdToUse = videoId || routeNewsData.videoId;
                if (!videoIdToUse) {
                    const youtubeUrl = route.params?.youtubeUrl || routeNewsData.youtubeUrl || routeNewsData.video_link;
                    if (youtubeUrl) {
                        console.log('Extracting video ID from:', youtubeUrl);
                        const extractedId = extractVideoId(youtubeUrl);
                        if (extractedId) {
                            videoIdToUse = extractedId;
                            console.log('Extracted video ID:', videoIdToUse);
                        }
                    }
                }
                setVideoSrc(videoIdToUse);
                
                // Check for videoPath (direct video file)
                const videoPath = routeNewsData.videoPath || route.params?.videoPath;
                if (videoPath) {
                    console.log('Video path found:', videoPath);
                    setContentType('video');
                } else if (videoIdToUse) {
                    console.log('YouTube video ID found:', videoIdToUse);
                    setContentType('youtube');
                } else {
                    setContentType('text');
                }
                
                // Process featured image
                const imageToUse = routeFeaturedImage || routeNewsData.featuredImage || routeNewsData.featured_image;
                if (imageToUse) {
                    console.log('Image to use:', imageToUse);
                    
                    // Set news data with what we know
                    setNewsData({
                        id: targetNewsId || 'unknown',
                        title: title || routeNewsData.title || routeNewsData.headline || "District News",
                        content: news || routeNewsData.content || "",
                        videoId: videoIdToUse,
                        videoPath: videoPath,
                        featuredImage: imageToUse.startsWith('http') ? imageToUse : `${BASE_URL}${imageToUse.replace(/^\/+/, '')}`,
                        youtubeUrl: route.params?.youtubeUrl || routeNewsData.youtubeUrl || routeNewsData.video_link
                    });
                    
                    setLoading(false);
                    return;
                }
            }
            
            // Otherwise, fetch from API
            if (!targetNewsId) {
                console.error("No news ID available for fetching news data");
                setLoading(false);
                return;
            }
            
            console.log(`Fetching news data for ID: ${targetNewsId}`);
            const newsEndpoint = `${BASE_URL}api/news/${targetNewsId}`;
            console.log('News endpoint:', newsEndpoint);
            
            const response = await GETNETWORK(newsEndpoint);
            console.log("News API response:", response);
            
            if (response && (response.success || response.data)) {
                // Extract news data
                const data = response.data || response;
                console.log('News data from API:', data);
                
                // Process fetched data
                const content = data.content || news || routeNewsData.content || "";
                setContentHasHtml(hasHtmlTags(content));
                
                // Extract video ID
                let videoIdFromData = videoId || routeNewsData.videoId;
                if (!videoIdFromData) {
                    const videoUrl = data.video_link || data.videoLink || data.youtubeUrl || route.params?.youtubeUrl;
                    if (videoUrl) {
                        console.log('Extracting video ID from API URL:', videoUrl);
                        videoIdFromData = extractVideoId(videoUrl);
                        console.log('Extracted video ID from API:', videoIdFromData);
                    }
                }
                setVideoSrc(videoIdFromData);
                
                // Check for videoPath (direct video file)
                const videoPath = data.videoPath || data.video_path || data.media?.video || routeNewsData.videoPath;
                if (videoPath) {
                    console.log('Video path found in API data:', videoPath);
                    setContentType('video');
                } else if (videoIdFromData) {
                    console.log('YouTube video ID found in API data:', videoIdFromData);
                    setContentType('youtube');
                } else {
                    setContentType('text');
                }
                
                // Extract featured image
                let imageUrl = null;
                
                // Try all possible sources for featured image
                const possibleImageSources = [
                    routeFeaturedImage,
                    routeNewsData.featuredImage,
                    data.featured_image,
                    data.featuredImage,
                    data.thumbnailUrl
                ];
                
                for (const source of possibleImageSources) {
                    if (source) {
                        console.log('Found image source:', source);
                        imageUrl = processImageUrl(source);
                        console.log('Processed image URL:', imageUrl);
                        break;
                    }
                }
                
                // If no image found but we have a video ID, use YouTube thumbnail
                if (!imageUrl && videoIdFromData) {
                    imageUrl = `https://img.youtube.com/vi/${videoIdFromData}/0.jpg`;
                    console.log('Using YouTube thumbnail:', imageUrl);
                }
                
                // Set news data
                const newsDataObj = {
                    id: data.id || targetNewsId,
                    title: data.headline || data.title || title || routeNewsData.title || "District News",
                    content: content,
                    videoId: videoIdFromData,
                    videoPath: videoPath,
                    featuredImage: imageUrl,
                    youtubeUrl: data.video_link || data.videoLink || data.youtubeUrl || route.params?.youtubeUrl || routeNewsData.video_link
                };
                
                console.log('Setting news data:', newsDataObj);
                setNewsData(newsDataObj);
            } else {
                console.error("Failed to fetch news data:", response?.message);
                // If API fails, use the route params as fallback
                const contentToUse = news || routeNewsData.content || "";
                setContentHasHtml(hasHtmlTags(contentToUse));
                
                // Check for videoPath (direct video file)
                const videoPath = routeNewsData.videoPath || route.params?.videoPath;
                if (videoPath) {
                    console.log('Video path found in route params (fallback):', videoPath);
                    setContentType('video');
                } else if (videoId || routeNewsData.videoId) {
                    console.log('YouTube video ID found in route params (fallback):', videoId || routeNewsData.videoId);
                    setContentType('youtube');
                } else {
                    setContentType('text');
                }
                
                // Use whatever we have from route params
                setNewsData({
                    id: targetNewsId || 'unknown',
                    title: title || routeNewsData.title || "District News",
                    content: contentToUse,
                    videoId: videoId || routeNewsData.videoId,
                    videoPath: videoPath,
                    featuredImage: fullImageUrl || routeNewsData.featuredImage,
                    youtubeUrl: route.params?.youtubeUrl || routeNewsData.youtubeUrl || routeNewsData.video_link
                });
            }
        } catch (error) {
            console.error("Error fetching news data:", error);
            // Try to recover with route params
            try {
                const routeNewsData = route.params?.newsData || {};
                
                // Check for videoPath (direct video file)
                const videoPath = routeNewsData.videoPath || route.params?.videoPath;
                if (videoPath) {
                    console.log('Video path found in route params (recovery):', videoPath);
                    setContentType('video');
                } else if (videoId || routeNewsData.videoId) {
                    console.log('YouTube video ID found in route params (recovery):', videoId || routeNewsData.videoId);
                    setContentType('youtube');
                } else {
                    setContentType('text');
                }
                
                setNewsData({
                    id: newsId || route.params?.newsId || 'unknown',
                    title: title || routeNewsData.title || "District News",
                    content: news || routeNewsData.content || "",
                    videoId: videoId || routeNewsData.videoId,
                    videoPath: videoPath,
                    featuredImage: fullImageUrl || routeNewsData.featuredImage,
                    youtubeUrl: route.params?.youtubeUrl || routeNewsData.youtubeUrl || routeNewsData.video_link
                });
            } catch (recoveryError) {
                console.error("Failed to recover with route params:", recoveryError);
            }
        } finally {
            setLoading(false);
        }
    };

    const checkLoginStatus = async () => {
        try {
            // Try to get token from AsyncStorage
            let userToken = await AsyncStorage.getItem('userToken');
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
            
            // Get user data
            let userData;
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    userData = JSON.parse(userStr);
                }
            } catch (error) {
                console.error("Error getting user data:", error);
            }
            
            console.log("Login check - Token found:", !!userToken);
            console.log("Login check - User data found:", !!userData);
            
            if (userToken && userData) {
                // Make sure token is stored in the expected location
                await AsyncStorage.setItem('loginResponse', userToken);
                setIsLoggedIn(true);
                setUserData(userData);
                console.log("User logged in as:", userData?.username || "Unknown");
            } else {
                setIsLoggedIn(false);
                setUserData(null);
                console.log("User not logged in");
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setIsLoggedIn(false);
        }
    };

    const fetchComments = async () => {
        setFetchingComments(true);
        try {
            // Get the news ID
            const targetNewsId = newsId || route.params?.newsId;
            if (!targetNewsId) {
                console.error("No news ID available for fetching comments");
                setFetchingComments(false);
                return;
            }
            
            console.log(`Fetching comments for news ID: ${targetNewsId}`);
            
            // Try to get token for authenticated request
            let userToken = await AsyncStorage.getItem('userToken');
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
        } finally {
            setFetchingComments(false);
        }
    };

    const handleThreeDotsLayout = (event) => {
        event.target.measure((fx, fy, width, height, px, py) => {
            setModalPosition({ top: py + height + 5, left: px - 100 });
        });
    };

    const toggleModal = () => setModalVisible(!modalVisible);

    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);

    const onNavigateBack = () => {
        navigation.goBack();
    };

    const handleLike = async () => {
        // Check if user is logged in
        if (!isLoggedIn) {
            // If not logged in, redirect to login screen
            setToastMessage({
                visible: true,
                message: "Please log in to like this news",
                type: "error"
            });
            
            setTimeout(() => {
                navigation.navigate("LoginSignup", { 
                    returnScreen: "DistrictNews",
                    params: { videoId, title, news, newsId }
                });
            }, 1500);
            return;
        }
        
        // Start loading state
        setLiking(true);
        
        try {
            // Get the news ID
            const targetNewsId = newsId || route.params?.newsId;
            if (!targetNewsId) {
                throw new Error("No news ID available for liking");
            }
            
            // Toggle like status
            const newLikedStatus = !liked;
            console.log(`${newLikedStatus ? 'Liking' : 'Unliking'} news ID: ${targetNewsId}`);
            
            // Get token for authenticated request
            let userToken = await AsyncStorage.getItem('userToken');
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
            
            // Validate token
            if (!userToken) {
                throw new Error("No authentication token found");
            }
            
            // Store token in AsyncStorage for POSTNETWORK
            await AsyncStorage.setItem('loginResponse', userToken);
            
            // Calculate new like count
            const newLikeCount = newLikedStatus ? likeCount + 1 : Math.max(0, likeCount - 1);
            
            // Update UI first for immediate feedback
            setLiked(newLikedStatus);
            setLikeCount(newLikeCount);
            
            // Store the new like count in AsyncStorage
            try {
                const likeCountKey = `likeCount_${targetNewsId}`;
                await AsyncStorage.setItem(likeCountKey, newLikeCount.toString());
                console.log(`Updated like count in AsyncStorage: ${newLikeCount}`);
            } catch (error) {
                console.error("Error updating like count in AsyncStorage:", error);
            }
            
            // Persist like status in AsyncStorage
            try {
                const likedPostsStr = await AsyncStorage.getItem('likedPosts');
                let likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : {};
                
                if (newLikedStatus) {
                    // Add to liked posts
                    likedPosts[targetNewsId] = true;
                } else {
                    // Remove from liked posts
                    delete likedPosts[targetNewsId];
                }
                
                await AsyncStorage.setItem('likedPosts', JSON.stringify(likedPosts));
                console.log(`Saved like status in AsyncStorage: ${newLikedStatus}`);
            } catch (error) {
                console.error("Error saving like status in AsyncStorage:", error);
            }
            
            // Use the correct API endpoint as provided
            const likeEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/like`;
            console.log(`Using like endpoint: ${likeEndpoint}`);
            
            // Make the API request with empty payload and auth token
            const response = await POSTNETWORK(likeEndpoint, {}, true);
            console.log("Like API response:", response);
            
            // Even if the API call fails, maintain the like state based on local storage
            // This ensures the like persists until explicitly unliked
            if (response && response.success !== false) {
                console.log(`Successfully ${newLikedStatus ? 'liked' : 'unliked'} news`);
                
                // Show success message
                setToastMessage({
                    visible: true,
                    message: newLikedStatus ? "News liked successfully" : "News unliked successfully",
                    type: "success"
                });
            } else {
                // Only show error message, don't revert UI changes
                console.log("API request had issues, but maintaining UI state");
                
                // Show error message but keep the UI updated
                setToastMessage({
                    visible: true,
                    message: "Like recorded locally. Will sync when connection improves.",
                    type: "info"
                });
                
                if (response && response.message) {
                    console.error("API error:", response.message);
                }
            }
        } catch (error) {
            console.error(`Error ${liked ? 'unliking' : 'liking'} news:`, error);
            
            // Handle unauthorized error (401)
            if (error.message?.includes("unauthorized") || error.message?.includes("401")) {
                setToastMessage({
                    visible: true,
                    message: "Session expired. Please login again",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "DistrictNews",
                        params: { videoId, title, news, newsId }
                    });
                }, 1500);
            } else {
                // For other errors, still maintain the like state
                setToastMessage({
                    visible: true,
                    message: "Like status saved locally",
                    type: "info"
                });
            }
        } finally {
            setLiking(false);
        }
    };

    const handleWhatsAppShare = async () => {
        try {
            // Remove HTML tags function
            const removeHtmlTags = (text) => {
                if (!text) return '';
                return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            };

            let shareMessage = `${removeHtmlTags(newsData?.title || title)}\n\n`;
            
            // Add a snippet of content (first 100 characters) with HTML tags removed
            if (newsData?.content || news) {
                const cleanContent = removeHtmlTags(newsData?.content || news);
                const contentPreview = cleanContent.length > 100 
                    ? cleanContent.substring(0, 100) + '...' 
                    : cleanContent;
                shareMessage += `${contentPreview}\n\n`;
            }

            // Add read more link with specific news ID for direct access
            const targetNewsId = newsId || route.params?.newsId;
            shareMessage += `Read more at: https://newztok.in/news/${targetNewsId}`;

            // Prepare share options
            const shareOptions = {
                message: shareMessage,
            };

            // Add media URL based on content type
            if (contentType === 'youtube' && videoSrc) {
                shareOptions.url = `https://www.youtube.com/watch?v=${videoSrc}`;
            } else if (contentType === 'video' && newsData?.videoPath) {
                shareOptions.url = processUrl(newsData.videoPath);
            } else if (fullImageUrl || newsData?.featuredImage) {
                shareOptions.url = fullImageUrl || newsData?.featuredImage;
            }

            await Share.share(shareOptions, {
                dialogTitle: 'Share News',
                subject: removeHtmlTags(newsData?.title || title)
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

    const handleAddComment = async () => {
        // Check if user is logged in
        if (!isLoggedIn) {
            // If not logged in, redirect to login screen
            setToastMessage({
                visible: true,
                message: "Please log in to comment",
                type: "error"
            });
            
            setTimeout(() => {
                navigation.navigate("LoginSignup", { 
                    returnScreen: "DistrictNews",
                    params: { videoId, title, news, newsId }
                });
            }, 1500);
            return;
        }
        
        // Validate comment content
        if (!newComment.trim()) {
            setToastMessage({
                visible: true,
                message: "Please enter a comment",
                type: "error"
            });
            return;
        }
        
        // Start loading state
        setPosting(true);
        
        try {
            // Get the news ID
            const targetNewsId = newsId || route.params?.newsId;
            if (!targetNewsId) {
                throw new Error("No news ID available for posting comment");
            }
            
            console.log(`Posting comment for news ID: ${targetNewsId}`);
            
            // Get token for authenticated request
            let userToken = await AsyncStorage.getItem('userToken');
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
            
            // Validate token
            if (!userToken) {
                throw new Error("No authentication token found");
            }
            
            // Store token in AsyncStorage for POSTNETWORK
            await AsyncStorage.setItem('loginResponse', userToken);
            console.log("Using token for comment POST");
            
            // Create comment payload - try text field first (most common API format)
            const commentPayload = { text: newComment.trim() };
            
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
                    name: userData?.username || "Me",
                    comment: newComment.trim(),
                    timestamp: new Date()
                };
                
                // Add to the beginning of the list (newest first)
                setComments(prevComments => [newCommentObj, ...prevComments]);
                
                // Clear the input
                setNewComment("");
                
                // Show success message
                setToastMessage({
                    visible: true,
                    message: "Comment posted successfully",
                    type: "success"
                });
                
                // Fetch all comments to get the updated list
                setTimeout(() => {
                    fetchComments();
                }, 500);
            } else {
                // If default payload format failed, try alternative formats
                console.log("First attempt failed, trying alternative payload formats");
                
                const alternativePayloads = [
                    { comment: newComment.trim() },
                    { content: newComment.trim() },
                    { message: newComment.trim() }
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
                            name: userData?.username || "Me",
                            comment: newComment.trim(),
                            timestamp: new Date()
                        };
                        
                        setComments(prevComments => [newCommentObj, ...prevComments]);
                        setNewComment("");
                        
                        setToastMessage({
                            visible: true,
                            message: "Comment posted successfully",
                            type: "success"
                        });
                        
                        setTimeout(() => {
                            fetchComments();
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
                setToastMessage({
                    visible: true,
                    message: "Session expired. Please login again",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "DistrictNews",
                        params: { videoId, title, news, newsId }
                    });
                }, 1500);
            } else {
                // General error
                setToastMessage({
                    visible: true,
                    message: error.message || "Failed to post comment",
                    type: "error"
                });
            }
        } finally {
            setPosting(false);
        }
    };

    // Add fetchLikeCount function
    const fetchLikeCount = async () => {
        try {
            const targetNewsId = newsId || route.params?.newsId;
            if (!targetNewsId) {
                console.error("No news ID available for fetching like count");
                return;
            }
            
            console.log(`Fetching like count for news ID: ${targetNewsId}`);
            
            // First check AsyncStorage for cached like counts
            try {
                const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                if (likeCountsStr) {
                    const likeCounts = JSON.parse(likeCountsStr);
                    if (likeCounts[targetNewsId] !== undefined) {
                        console.log(`Found stored like count: ${likeCounts[targetNewsId]}`);
                        setLikeCount(likeCounts[targetNewsId]);
                    }
                }
            } catch (storageError) {
                console.error("Error retrieving like count from AsyncStorage:", storageError);
            }
            
            // Then try API
            try {
                const likeCountEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/like/count`;
                const response = await GETNETWORK(likeCountEndpoint);
                
                if (response?.success && response?.data) {
                    const count = response.data?.count || 
                                response.data?.likes_count || 
                                response.data?.like_count || 
                                response.data?.likes || 0;
                    
                    setLikeCount(count);
                    
                    // Store in AsyncStorage
                    try {
                        const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                        let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                        likeCounts[targetNewsId] = count;
                        await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                    } catch (error) {
                        console.error("Error storing like count:", error);
                    }
                    
                    // Check if user has liked
                    const userHasLiked = response.data?.user_has_liked || 
                                       response.data?.is_liked || 
                                       response.data?.liked || false;
                    
                    if (userHasLiked) {
                        setLiked(true);
                        setLikeCount(prevCount => Math.max(prevCount, 1));
                    }
                    
                    return;
                }
            } catch (apiError) {
                console.log("Error fetching from API:", apiError);
            }
            
            // Check liked status in AsyncStorage
            try {
                const likedPostsStr = await AsyncStorage.getItem('likedPosts');
                if (likedPostsStr) {
                    const likedPosts = JSON.parse(likedPostsStr);
                    if (likedPosts[targetNewsId]) {
                        setLiked(true);
                        setLikeCount(prevCount => Math.max(prevCount, 1));
                    }
                }
            } catch (error) {
                console.error("Error checking liked status:", error);
            }
            
            // Fallback to news data
            if (newsData?.likes_count !== undefined) {
                setLikeCount(newsData.likes_count || 0);
                
                try {
                    const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                    let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                    likeCounts[targetNewsId] = newsData.likes_count || 0;
                    await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                } catch (error) {
                    console.error("Error storing like count from news data:", error);
                }
            }
            
            if (newsData?.user_has_liked) {
                setLiked(true);
                setLikeCount(prevCount => Math.max(prevCount, 1));
            }
            
        } catch (error) {
            console.error("Error in fetchLikeCount:", error);
        }
    };

    // Add fetchViewCount function after fetchLikeCount
    const fetchViewCount = async () => {
        try {
            const targetNewsId = newsId || route.params?.newsId;
            if (!targetNewsId) {
                console.error("No news ID available for fetching view count");
                return;
            }
            
            console.log(`Fetching view count for news ID: ${targetNewsId}`);
            
            // First check AsyncStorage for cached view counts
            try {
                const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                if (viewCountsStr) {
                    const viewCounts = JSON.parse(viewCountsStr);
                    if (viewCounts[targetNewsId] !== undefined) {
                        console.log(`Found stored view count: ${viewCounts[targetNewsId]}`);
                        setViewCount(viewCounts[targetNewsId]);
                    }
                }
            } catch (storageError) {
                console.error("Error retrieving view count from AsyncStorage:", storageError);
            }
            
            // Try API - don't need authentication for view count
            try {
                const viewCountEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/view/count`;
                const response = await GETNETWORK(viewCountEndpoint, false); // false means no auth required
                
                if (response?.success && response?.data) {
                    const count = response.data?.count || 
                                response.data?.views_count || 
                                response.data?.view_count || 
                                response.data?.views || 0;
                    
                    setViewCount(count);
                    
                    // Store in AsyncStorage
                    try {
                        const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                        let viewCounts = viewCountsStr ? JSON.parse(viewCountsStr) : {};
                        viewCounts[targetNewsId] = count;
                        await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
                    } catch (error) {
                        console.error("Error storing view count:", error);
                    }
                    
                    return;
                }
            } catch (apiError) {
                console.log("Error fetching view count from API:", apiError);
            }
            
            // Fallback to news data
            if (newsData?.views_count !== undefined) {
                setViewCount(newsData.views_count || 0);
                
                try {
                    const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                    let viewCounts = viewCountsStr ? JSON.parse(viewCountsStr) : {};
                    viewCounts[targetNewsId] = newsData.views_count || 0;
                    await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
                } catch (error) {
                    console.error("Error storing view count from news data:", error);
                }
            }
            
        } catch (error) {
            console.error("Error in fetchViewCount:", error);
        }
    };

    // Add function to record a view
    const recordView = async () => {
        try {
            const targetNewsId = newsId || route.params?.newsId;
            if (!targetNewsId) {
                console.error("No news ID available for recording view");
                return;
            }
            
            console.log(`Recording view for news ID: ${targetNewsId}`);
            
            // Increment local view count immediately for better UX
            setViewCount(prevCount => prevCount + 1);
            
            // Try to update AsyncStorage
            try {
                const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                let viewCounts = viewCountsStr ? JSON.parse(viewCountsStr) : {};
                viewCounts[targetNewsId] = (viewCounts[targetNewsId] || 0) + 1;
                await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
            } catch (error) {
                console.error("Error updating view count in AsyncStorage:", error);
            }
            
            // Send view to API without requiring authentication
            const viewEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/view`;
            await POSTNETWORK(viewEndpoint, {}, false); // false means no auth token required
            
            console.log(`View recorded for news ID: ${targetNewsId}`);
        } catch (error) {
            console.error("Error recording view:", error);
            // Don't revert the UI update even if API call fails
            // This provides better user experience
        }
    };

    return (
        <>
            {/* Status Bar */}
            <MyStatusBar backgroundColor={WHITE} />

            {/* Header */}
            <MyHeader showLocationDropdown={false} onPressBack={onNavigateBack} />

            {/* Main Container */}
            <ScrollView style={styles.container}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading news content...</Text>
                    </View>
                ) : (
                    <>
                        {/* Media Content (Video, YouTube Video, or Image) */}
                        {contentType === 'youtube' && videoSrc ? (
                            <View style={styles.videoContainer}>
                                <YoutubeIframe height={250} videoId={videoSrc} allowFullscreen={true} />
                            </View>
                        ) : contentType === 'video' && newsData?.videoPath ? (
                            <VideoPlayer videoPath={newsData.videoPath} />
                        ) : fullImageUrl || (newsData && newsData.featuredImage) ? (
                            <View style={styles.imageContainer}>
                                <Image 
                                    source={{ uri: fullImageUrl || newsData.featuredImage }} 
                                    style={styles.featuredImage}
                                    resizeMode="cover"
                                    onError={(e) => {
                                        console.log('Image load error:', e.nativeEvent.error);
                                        console.log('Failed image URI:', fullImageUrl || newsData?.featuredImage);
                                        
                                        // Try multiple alternative formats if loading fails
                                        const failedUri = fullImageUrl || newsData?.featuredImage;
                                        if (failedUri) {
                                            let fixedUri = failedUri;
                                            
                                            // Try different URL patterns
                                            if (failedUri.includes('/uploads/')) {
                                                fixedUri = `${BASE_URL}${failedUri.split('/uploads/')[1]}`;
                                            } 
                                            else if (failedUri.includes('/images/featuredImage-')) {
                                                fixedUri = `${BASE_URL}uploads/images/${failedUri.split('/images/featuredImage-')[1]}`;
                                            }
                                            else if (failedUri.endsWith('.jpg') || failedUri.endsWith('.png') || failedUri.endsWith('.jpeg')) {
                                                // Try direct URL with base
                                                const filename = failedUri.split('/').pop();
                                                fixedUri = `${BASE_URL}uploads/images/${filename}`;
                                            }
                                            
                                            // Try removing any double slashes
                                            fixedUri = fixedUri.replace(/([^:])\/\//g, '$1/');
                                            
                                            console.log('Attempting with fixed URI:', fixedUri);
                                            e.currentTarget.setNativeProps({
                                                source: [{ uri: fixedUri }]
                                            });
                                        }
                                    }}
                                />
                            </View>
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Text style={styles.placeholderText}>
                                    {(newsData?.title || title || "News").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}

                        {/* News Title */}
                        <Text style={styles.title}>{newsData?.title || title}</Text>

                        {/* Action Buttons */}
                        <View style={styles.actionRow}>
                            <View style={styles.actionButtonsContainer}>
                                <View style={styles.likeContainer}>
                                    <TouchableOpacity 
                                        onPress={handleLike} 
                                        style={styles.actionButton} 
                                        activeOpacity={0.7}
                                        disabled={liking}
                                    >
                                        <Image source={liked ? PRESSLIKE : LIKE} style={styles.actionIcon} />
                                    </TouchableOpacity>
                                    <Text style={styles.actionCountText}>
                                        {likeCount > 999 ? (likeCount / 1000).toFixed(1) + 'k' : likeCount}
                                    </Text>
                                </View>
                                <View style={styles.viewContainer}>
                                    <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                                        <Image source={VIEW} style={styles.actionIcon} />
                                    </TouchableOpacity>
                                    <Text style={styles.actionCountText}>
                                        {viewCount > 999 ? (viewCount / 1000).toFixed(1) + 'k' : viewCount}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleWhatsAppShare} style={styles.actionButton} activeOpacity={0.7}>
                                <Image source={WHATSAPP} style={styles.actionIcon} />
                            </TouchableOpacity>
                        </View>

                        {/* News Content */}
                        {contentHasHtml ? (
                            <View style={{ marginBottom: 20 }}>
                                <HTML 
                                    source={{ html: newsData?.content || news || "" }} 
                                    contentWidth={WIDTH - 40}
                                    tagsStyles={{
                                        p: { fontSize: 16, lineHeight: 24, marginBottom: 10, fontFamily: POPPINSLIGHT },
                                        h1: { fontSize: 20, fontWeight: "bold", marginVertical: 10, fontFamily: POPPINSMEDIUM },
                                        h2: { fontSize: 18, fontWeight: "bold", marginVertical: 8, fontFamily: POPPINSMEDIUM },
                                        a: { color: BLUE, textDecorationLine: 'underline' },
                                        img: { maxWidth: WIDTH - 40, height: 'auto', marginVertical: 10 }
                                    }}
                                />
                            </View>
                        ) : (
                            <Text style={{ ...styles.title, fontWeight: "normal", marginBottom: 20 }}>
                                {newsData?.content || news || ""}
                            </Text>
                        )}

                        {/* Comments Section */}
                        <View style={[styles.card, { marginTop: 30 }]}>
                            <View style={styles.commentsHeader}>
                                <Text style={styles.commentsHeading}>Comments</Text>
                                <Text style={styles.commentsCount}>{comments.length}</Text>
                            </View>

                            {fetchingComments ? (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Loading comments...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={comments}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <View style={styles.commentCard}>
                                            <View style={styles.initialCircle}>
                                                <Text style={styles.initialText}>
                                                    {(item.name?.charAt(0) || "A").toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.commentHeader}>
                                                    <Text style={styles.commenterName}>
                                                        {item.name || "Anonymous"}
                                                    </Text>
                                                    <Text style={styles.commentTime}>
                                                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                                    </Text>
                                                </View>
                                                <Text style={styles.commentText}>{item.comment}</Text>
                                            </View>
                                        </View>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                                    }
                                    showsVerticalScrollIndicator={false}
                                    style={{ maxHeight: HEIGHT * 0.3 }}
                                />
                            )}

                            <View style={styles.commentInputContainer}>
                                <TextInput
                                    style={styles.commentInput}
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    placeholder="Write a comment..."
                                    placeholderTextColor={GREY}
                                    editable={!posting}
                                />
                                <TouchableOpacity 
                                    onPress={handleAddComment} 
                                    style={[styles.postButton, posting && styles.disabledButton]}
                                    disabled={posting}
                                >
                                    <Text style={styles.postButtonText}>{posting ? "Posting..." : "Post"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Modal */}
            <Modal
                statusBarTranslucent={true}
                transparent={true}
                animationType="fade"
                visible={modalVisible}
                onRequestClose={toggleModal}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={toggleModal} />
                <View style={[styles.modalContainer, { top: modalPosition.top, left: modalPosition.left }]}>
                    <TouchableOpacity 
                        style={styles.option} 
                        onPress={() => { 
                            toggleModal(); 
                            setToastMessage({
                                visible: true,
                                message: "Post saved successfully",
                                type: "success"
                            });
                        }}
                    >
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.option} 
                        onPress={() => { 
                            toggleModal(); 
                            setToastMessage({
                                visible: true,
                                message: "Post reported successfully",
                                type: "success"
                            });
                        }}
                    >
                        <Text style={styles.reportText}>Report</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* Toast Message */}
            <ToastMessage
                message={toastMessage.message}
                visible={toastMessage.visible}
                setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
                image={LOGO2}
            />

            <MyLoader visible={loading || posting} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
        fontFamily: POPPINSMEDIUM,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginVertical: HEIGHT * 0.012,
    },
    actionButtonsContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    likeContainer: {
        alignItems: "center",
        marginRight: WIDTH * 0.03,
    },
    viewContainer: {
        alignItems: "center",
        marginRight: WIDTH * 0.03,
    },
    actionButton: {
        marginRight: WIDTH * 0.02,
    },
    actionIcon: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
    },
    actionCountText: {
        fontSize: WIDTH * 0.03,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
        marginTop: 2,
    },
    card: {
        marginTop: 10,
        marginBottom: 100,
        padding: 15,
        borderRadius: 10,
        backgroundColor: WHITE,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        borderWidth: 1,
        borderColor: RED,
    },
    commentsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    commentsHeading: {
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: POPPINSMEDIUM,
    },
    commentsCount: {
        fontSize: 16,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    commentCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    initialCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: BLUE,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    initialText: {
        fontSize: 18,
        fontWeight: "bold",
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
    },
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    commentTime: {
        fontSize: 12,
        color: GREY,
        fontFamily: POPPINSLIGHT,
    },
    commenterName: {
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: POPPINSMEDIUM,
    },
    commentText: {
        fontSize: 14,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
        flexWrap: 'wrap',
    },
    commentInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    commentInput: {
        flex: 1,
        borderBottomWidth: 1,
        borderColor: BLACK,
        borderBottomLeftRadius: 10,
        padding: 10,
        fontSize: 14,
        backgroundColor: WHITE,
        fontFamily: POPPINSLIGHT,
        maxHeight: 80,
    },
    postButton: {
        backgroundColor: BLUE,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginLeft: 10,
    },
    disabledButton: {
        backgroundColor: GREY,
    },
    postButtonText: {
        color: WHITE,
        fontWeight: "bold",
        fontFamily: POPPINSMEDIUM,
    },
    noCommentsText: {
        color: GREY,
        textAlign: "center",
        marginVertical: 10,
        fontSize: 14,
        fontFamily: POPPINSLIGHT,
    },
    loadingContainer: {
        padding: 30,
        justifyContent: "center",
        alignItems: "center",
        height: 250,
    },
    loadingText: {
        fontSize: 16,
        color: GREY,
        fontFamily: POPPINSMEDIUM,
    },
    icon: {
        width: 24,
        height: 24,
        marginHorizontal: 5,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    modalContainer: {
        position: "absolute",
        backgroundColor: WHITE,
        padding: 5,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        // Added width and alignItems for square shape
        width: 90, // Adjust as needed
        alignItems: 'center', // Center content horizontally
        marginTop: 40,
        marginLeft: -60
    },
    option: {
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    saveText: {
        fontSize: 16,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
    },
    reportText: {
        fontSize: 16,
        color: RED,
        fontFamily: POPPINSMEDIUM,
    },
    featuredImage: {
        width: WIDTH,
        height: 250,
        borderRadius: 10,
        marginBottom: 20,
    },
    videoContainer: {
        height: 250,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
        width: '100%',
    },
    imageContainer: {
        height: 250,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
        width: '100%',
    },
    placeholderImage: {
        height: 250,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    placeholderText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: GREY,
        fontFamily: POPPINSMEDIUM,
        opacity: 0.5,
    },
    videoWrapper: {
        position: 'relative',
        width: '100%',
        height: 250,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    videoOverlayText: {
        fontSize: 18,
        color: WHITE,
        fontWeight: 'bold',
        fontFamily: POPPINSMEDIUM,
    },
    videoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
    },
    videoErrorText: {
        color: RED,
        fontSize: 14,
        fontFamily: POPPINSLIGHT,
        textAlign: 'center',
        padding: 10,
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: WIDTH * 0.025,
    },
    playButtonCircle: {
        width: WIDTH * 0.15,
        height: WIDTH * 0.15,
        borderRadius: WIDTH * 0.075,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    playButtonText: {
        fontSize: WIDTH * 0.05,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginLeft: 3,
    },
});