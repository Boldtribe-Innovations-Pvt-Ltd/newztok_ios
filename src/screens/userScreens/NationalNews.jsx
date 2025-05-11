import React, { useState, useEffect, useRef } from "react";
import { FlatList, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Share, Alert } from "react-native";
import { BLACK, BLUE, GREY, RED, WHITE } from "../../constants/color";
import { ACCOUNT, DISLIKE, LIKE, PRESSDISLIKE, PRESSLIKE, SHARE, THREEDOTS, WHATSAPP, LOGO2, VIEW } from "../../constants/imagePath";
import YoutubeIframe from "react-native-youtube-iframe";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { HEIGHT, WIDTH } from "../../constants/config";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../constants/fontPath";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { BASE_URL } from "../../constants/url";
import HTML from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { getObjByKey, getStringByKey } from "../../utils/Storage";
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

// Menu options for three dots
const MENU_OPTIONS = [
    { id: '1', name: 'Save Post' },
    { id: '2', name: 'Report Post' },
];

// Function to extract YouTube video ID from various URL formats
const getYoutubeVideoId = (url) => {
    if (!url) return null;
    
    // Regular YouTube URL (youtu.be or youtube.com)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return match[2];
    }
    
    // If it's already just the ID (11 characters)
    if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }
    
    return null;
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

export default NationalNews = ({ navigation, route }) => {
    const { newsData } = route.params;
    console.log('Received newsData in NationalNews:', newsData);
    console.log('VideoPath in NationalNews:', newsData?.videoPath);
    
    // Extract media content: video or image
    // Support both featured_image and featuredImage property names for compatibility
    const featuredImage = newsData?.featuredImage || newsData?.featured_image || '';
    const fullImageUrl = featuredImage ? 
        (featuredImage.startsWith('/uploads') ? `${BASE_URL}${featuredImage}` : featuredImage) : null;
    
    console.log('Featured Image URL:', fullImageUrl);
    
    const rawVideoLink = newsData?.video_link || '';
    const videoId = getYoutubeVideoId(rawVideoLink);
    const youtubeThumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    
    // Determine content type
    const contentType = newsData?.videoPath ? 'video' : (videoId ? 'youtube' : 'text');
    
    const title = newsData?.headline || '';
    const content = newsData?.content || '';
    const contentHasHtml = hasHtmlTags(content);
    
    const [reaction, setReaction] = useState({});
    const [menuVisible, setMenuVisible] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
    const [loading, setLoading] = useState(false);
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

    // Add new state variables for like and view functionality
    const [likeCount, setLikeCount] = useState(0);
    const [viewCount, setViewCount] = useState(0); // New state for view count
    const [liking, setLiking] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        checkLoginStatus();
    }, []);

    // Fetch comments when component mounts
    useEffect(() => {
        if (newsData?.id) {
            fetchComments();
        }
    }, [newsData]);

    // Add effect to fetch like count and view count on component mount
    useEffect(() => {
        if (newsData?.id) {
            fetchLikeCount();
            fetchViewCount(); // Add call to fetch view count
            recordView(); // Record a view when the news is opened
        }
    }, [newsData]);

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
            const targetNewsId = newsData?.id;
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
            setModalPosition({ top: py + height + 5, right: WIDTH * 0.05 });
        });
    };

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    const handleMenuOption = (optionId) => {
        setMenuVisible(false);
        
        if (optionId === '1') { // Save Post
            setToastMessage({
                visible: true,
                message: "Post saved successfully",
                type: "success"
            });
        } else if (optionId === '2') { // Report Post
            setToastMessage({
                visible: true,
                message: "Post reported successfully",
                type: "success"
            });
        }
    };

    const [liked, setLiked] = useState(false);

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
                    returnScreen: "NationalNews",
                    params: { newsData }
                });
            }, 1500);
            return;
        }
        
        // Start loading state
        setLiking(true);
        
        try {
            // Get the news ID
            const targetNewsId = newsData?.id;
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
                        returnScreen: "NationalNews",
                        params: { newsData }
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

            let shareMessage = `${removeHtmlTags(newsData.headline)}\n\n`;
            
            // Add a snippet of content (first 100 characters) with HTML tags removed
            if (newsData.content) {
                const cleanContent = removeHtmlTags(newsData.content);
                const contentPreview = cleanContent.length > 100 
                    ? cleanContent.substring(0, 100) + '...' 
                    : cleanContent;
                shareMessage += `${contentPreview}\n\n`;
            }

            // Add read more link with specific news ID for direct access
            shareMessage += `Read more at: https://newztok.in/news/${newsData.id}`;

            // Prepare share options
            const shareOptions = {
                message: shareMessage,
            };

            // Add media URL based on content type
            if (contentType === 'youtube' && videoId) {
                shareOptions.url = `https://www.youtube.com/watch?v=${videoId}`;
            } else if (contentType === 'video' && newsData.videoPath) {
                shareOptions.url = processUrl(newsData.videoPath);
            } else if (fullImageUrl) {
                shareOptions.url = fullImageUrl;
            }

            await Share.share(shareOptions, {
                dialogTitle: 'Share News',
                subject: removeHtmlTags(newsData.headline)
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
                    returnScreen: "NationalNews",
                    params: { newsData }
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
            const targetNewsId = newsData?.id;
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
                        returnScreen: "NationalNews",
                        params: { newsData }
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

    // Add fetchLikeCount function after handleAddComment
    const fetchLikeCount = async () => {
        try {
            // Get the news ID
            const targetNewsId = newsData?.id;
            if (!targetNewsId) {
                console.error("No news ID available for fetching like count");
                return;
            }
            
            console.log(`Fetching like count for news ID: ${targetNewsId}`);
            
            // First, try to get the like count from AsyncStorage
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
            
            // Then try to get the like count from the API
            try {
                // Try the endpoint for fetching likes
                const likeCountEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/like/count`;
                console.log(`Using like count endpoint: ${likeCountEndpoint}`);
                
                // Make the request
                const response = await GETNETWORK(likeCountEndpoint);
                console.log("Like count API response:", response);
                
                if (response && response.success && response.data) {
                    // Extract the count from the response
                    const count = response.data?.count || 
                                  response.data?.likes_count || 
                                  response.data?.like_count || 
                                  response.data?.likes || 0;
                              
                    console.log(`API returned like count: ${count}`);
                    setLikeCount(count);
                    
                    // Store the like count in AsyncStorage
                    try {
                        const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                        let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                        likeCounts[targetNewsId] = count;
                        await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                        console.log(`Stored like count in AsyncStorage: ${count}`);
                    } catch (storeError) {
                        console.error("Error storing like count in AsyncStorage:", storeError);
                    }
                    
                    // Check if user has liked the post
                    const userHasLiked = response.data?.user_has_liked || 
                                         response.data?.is_liked || 
                                         response.data?.liked || false;
                    
                    if (userHasLiked) {
                        console.log("User has liked this post according to API");
                        setLiked(true);
                    }
                    
                    // Return early since we got data from API
                    return;
                }
            } catch (apiError) {
                console.log("Error fetching like count from API:", apiError);
            }
            
            // If API failed or is unavailable, try to get token for authenticated request
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
            
            // Try to get like status from AsyncStorage as backup
            try {
                const likedPostsStr = await AsyncStorage.getItem('likedPosts');
                if (likedPostsStr) {
                    const likedPosts = JSON.parse(likedPostsStr);
                    if (likedPosts[targetNewsId]) {
                        console.log("Found like status in AsyncStorage");
                        setLiked(true);
                        // If we found the post is liked, ensure the count is at least 1
                        setLikeCount(prevCount => Math.max(prevCount, 1));
                    }
                }
            } catch (error) {
                console.error("Error checking liked posts in AsyncStorage:", error);
            }
            
            // Try to get count from news data if available
            if (newsData) {
                if (newsData.likes_count !== undefined) {
                    console.log("Using like count from news data:", newsData.likes_count);
                    setLikeCount(newsData.likes_count || 0);
                    
                    // Store this count in AsyncStorage
                    try {
                        const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                        let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                        likeCounts[targetNewsId] = newsData.likes_count || 0;
                        await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                    } catch (error) {
                        console.error("Error storing like count from news data:", error);
                    }
                }
                
                if (newsData.user_has_liked) {
                    console.log("User has liked this post according to news data");
                    setLiked(true);
                    // If user has liked, ensure count is at least 1
                    setLikeCount(prevCount => Math.max(prevCount, 1));
                }
            }
            
            console.log("Using local like count as fallback");
        } catch (error) {
            console.error("Error fetching like count:", error);
        }
    };

    // Add fetchViewCount function after fetchLikeCount
    const fetchViewCount = async () => {
        try {
            const targetNewsId = newsData?.id;
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
            const targetNewsId = newsData?.id;
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

    // HTML rendering options for proper styling
    const htmlStyles = {
        p: {
            fontSize: WIDTH * 0.038,
            lineHeight: HEIGHT * 0.03,
            color: BLACK,
            fontFamily: POPPINSLIGHT,
            marginBottom: HEIGHT * 0.01,
        },
        h1: {
            fontSize: WIDTH * 0.05,
            fontFamily: POPPINSMEDIUM,
            color: BLACK,
            marginVertical: HEIGHT * 0.015,
        },
        h2: {
            fontSize: WIDTH * 0.045,
            fontFamily: POPPINSMEDIUM,
            color: BLACK,
            marginVertical: HEIGHT * 0.012,
        },
        a: {
            color: BLUE,
            textDecorationLine: 'underline',
        },
        li: {
            fontSize: WIDTH * 0.038,
            lineHeight: HEIGHT * 0.03,
            color: BLACK,
            fontFamily: POPPINSLIGHT,
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

    return (
        <>
            {/* Status Bar */}
            <MyStatusBar backgroundColor={WHITE} />

            {/* Header */}
            <MyHeader showLocationDropdown={false} onPressBack={onNavigateBack} />

            {/* Main Container */}
            {loading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{fontFamily: POPPINSLIGHT}}>Loading...</Text>
                </View>
            ) : (
                <ScrollView style={styles.container}>
                    {/* Media Content - Video Player, YouTube, or Image */}
                    {contentType === 'youtube' && videoId ? (
                        <View style={styles.videoContainer}>
                            <YoutubeIframe 
                                height={HEIGHT * 0.28} 
                                videoId={videoId} 
                                allowFullscreen={true} 
                            />
                        </View>
                    ) : contentType === 'video' && newsData.videoPath ? (
                        <VideoPlayer videoPath={newsData.videoPath} />
                    ) : youtubeThumbnailUrl ? (
                        <Image
                            source={{ uri: youtubeThumbnailUrl }}
                            style={styles.featuredImage}
                            resizeMode="cover"
                        />
                    ) : fullImageUrl ? (
                        <Image
                            source={{ uri: fullImageUrl }}
                            style={styles.featuredImage}
                            resizeMode="cover"
                        />
                    ) : null}

                    {/* News Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <View style={{ flexDirection: "row" }}>
                            <View style={styles.actionButtonContainer}>
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
                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                                    <Image source={VIEW} style={styles.actionIcon} />
                                </TouchableOpacity>
                                <Text style={styles.actionCountText}>
                                    {viewCount > 999 ? (viewCount / 1000).toFixed(1) + 'k' : viewCount}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleWhatsAppShare} style={[styles.actionButton, { marginBottom: HEIGHT * 0.03 }]} activeOpacity={0.7}>
                            <Image source={WHATSAPP} style={styles.actionIcon} />
                        </TouchableOpacity>
                    </View>

                    {/* News Content - Handle HTML if present */}
                    {contentHasHtml ? (
                        <HTML 
                            source={{ html: content }} 
                            contentWidth={WIDTH * 0.9}
                            tagsStyles={htmlStyles}
                            containerStyle={styles.htmlContent}
                        />
                    ) : (
                        <Text style={styles.content}>{content}</Text>
                    )}

                    {/* Comments Section */}
                    <View style={[styles.card, { marginTop: HEIGHT * 0.02, marginBottom: HEIGHT * 0.08 }]}>
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
                </ScrollView>
            )}

            {/* Popup Menu */}
            {menuVisible && (
                <View style={[styles.menuPopup, { top: modalPosition.top, right: WIDTH * 0.05 }]}>
                    {MENU_OPTIONS.map((item) => (
                        <TouchableOpacity 
                            key={item.id}
                            onPress={() => handleMenuOption(item.id)}
                            style={styles.menuOption}
                        >
                            <Text style={[
                                styles.menuOptionText, 
                                item.id === '2' ? styles.reportText : styles.saveText
                            ]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

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
        padding: WIDTH * 0.05,
    },
    featuredImage: {
        width: '100%',
        height: HEIGHT * 0.3,
        borderRadius: WIDTH * 0.025,
        marginBottom: HEIGHT * 0.018,
    },
    title: {
        fontSize: WIDTH * 0.045,
        fontFamily: POPPINSMEDIUM,
        marginVertical: HEIGHT * 0.01,
    },
    content: {
        fontSize: WIDTH * 0.038,
        lineHeight: HEIGHT * 0.03,
        marginVertical: HEIGHT * 0.018,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    htmlContent: {
        marginVertical: HEIGHT * 0.018,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: HEIGHT * 0.012,
    },
    actionButtonContainer: {
        alignItems: 'center',
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
        fontFamily: POPPINSLIGHT,
        marginTop: 2,
    },
    card: {
        marginTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.08,
        padding: WIDTH * 0.03,
        borderRadius: WIDTH * 0.02,
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
        marginBottom: HEIGHT * 0.008,
    },
    commentsHeading: {
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSMEDIUM,
    },
    commentsCount: {
        fontSize: WIDTH * 0.035,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    commentCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: HEIGHT * 0.012,
        paddingHorizontal: WIDTH * 0.01,
    },
    initialCircle: {
        width: WIDTH * 0.05,
        height: WIDTH * 0.05,
        borderRadius: WIDTH * 0.025,
        backgroundColor: BLUE,
        justifyContent: "center",
        alignItems: "center",
        marginRight: WIDTH * 0.02,
    },
    initialText: {
        fontSize: WIDTH * 0.025,
        fontFamily: POPPINSMEDIUM,
        color: WHITE,
    },
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: HEIGHT * 0.002,
    },
    commentTime: {
        fontSize: WIDTH * 0.032,
        color: GREY,
        fontFamily: POPPINSLIGHT,
    },
    commenterName: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        marginBottom: HEIGHT * 0.002,
    },
    commentText: {
        fontSize: WIDTH * 0.032,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
        flexWrap: 'wrap',
    },
    commentInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: HEIGHT * 0.008,
    },
    commentInput: {
        flex: 1,
        borderBottomWidth: 1,
        borderColor: BLACK,
        borderBottomLeftRadius: WIDTH * 0.02,
        padding: WIDTH * 0.02,
        fontSize: WIDTH * 0.032,
        backgroundColor: WHITE,
        fontFamily: POPPINSLIGHT,
        maxHeight: HEIGHT * 0.05,
    },
    postButton: {
        backgroundColor: BLUE,
        paddingHorizontal: WIDTH * 0.025,
        paddingVertical: HEIGHT * 0.008,
        borderRadius: WIDTH * 0.01,
        marginLeft: WIDTH * 0.02,
    },
    postButtonText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.03,
    },
    noCommentsText: {
        color: GREY,
        textAlign: "center",
        marginVertical: HEIGHT * 0.01,
        fontFamily: POPPINSLIGHT,
        fontSize: WIDTH * 0.032,
    },
    menuPopup: {
        position: "absolute",
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.02,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        zIndex: 2,
        width: WIDTH * 0.3,
        overflow: 'hidden',
    },
    menuOption: {
        paddingVertical: HEIGHT * 0.012,
        paddingHorizontal: WIDTH * 0.03,
        borderBottomWidth: 0.5,
        borderBottomColor: GREY,
    },
    menuOptionText: {
        fontFamily: POPPINSLIGHT,
        fontSize: WIDTH * 0.035,
        color: BLACK,
    },
    saveText: {
        fontSize: WIDTH * 0.035,
        color: BLUE,
        fontFamily: POPPINSMEDIUM,
    },
    reportText: {
        fontSize: WIDTH * 0.035,
        color: RED,
        fontFamily: POPPINSMEDIUM,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: HEIGHT * 0.02,
    },
    loadingText: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
    },
    disabledButton: {
        backgroundColor: GREY,
    },
    videoContainer: {
        height: HEIGHT * 0.28,
        borderRadius: WIDTH * 0.025,
        overflow: 'hidden',
        marginBottom: HEIGHT * 0.018,
        width: '100%',
    },
    videoWrapper: {
        width: '100%',
        height: HEIGHT * 0.28,
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: WIDTH * 0.025,
        marginBottom: HEIGHT * 0.018,
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: WIDTH * 0.025,
    },
    videoPlaceholder: {
        backgroundColor: '#e1e1e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoErrorText: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: '#a1a1a1',
    },
    videoOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoOverlayText: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: WHITE,
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: WIDTH * 0.025,
        justifyContent: 'center',
        alignItems: 'center',
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