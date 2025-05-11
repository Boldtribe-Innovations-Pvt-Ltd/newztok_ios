import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    FlatList,
    ScrollView,
    Linking,
    Alert,
    Share,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubeIframe from "react-native-youtube-iframe";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { GREY, WHITE, BLUE, RED, BLACK } from "../../constants/color";
import { ACCOUNT, LIKE, LOGO2, PRESSLIKE, THREEDOTS, WHATSAPP, VIEW } from "../../constants/imagePath";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { BASE_URL } from "../../constants/url";
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { HEIGHT, WIDTH } from "../../constants/config";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../constants/fontPath";
import HTML from 'react-native-render-html';
import { getObjByKey, getStringByKey } from "../../utils/Storage";
import Video from 'react-native-video';

// Helper function to process URLs (images and videos)
const processUrl = (url) => {
    if (!url) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    if (url.startsWith('/uploads')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
        return `${baseUrlFormatted}${url}`;
    }
    
    if (url.startsWith('uploads/')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
        return `${baseUrlFormatted}${url}`;
    }
    
    if (!url.includes('/')) {
        const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
        return `${baseUrlFormatted}uploads/${url}`;
    }
    
    return url;
};

// VideoPlayer component
const VideoPlayer = ({ videoPath }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(true);
    
    console.log('[VideoPlayer] Received videoPath:', videoPath);
    
    const getFullVideoUrl = (path) => {
        return processUrl(path);
    };
    
    const getVideoSource = () => {
        try {
            if (!videoPath) {
                console.log('[VideoPlayer] getVideoSource: No videoPath provided');
                return null;
            }
            
            if (typeof videoPath === 'object' && videoPath.uri) {
                console.log('[VideoPlayer] getVideoSource: Using object with uri:', videoPath.uri);
                return videoPath;
            }
            
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
    
    const togglePlayback = () => {
        setPaused(!paused);
    };
    
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
                controls={!paused}
                paused={paused}
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

export default HomeNews = ({ route, navigation }) => {
    const { newsData } = route.params;
    console.log('Received newsData in HomeNews:', newsData);
    console.log('Featured Image URL:', newsData?.featured_image ? `${BASE_URL}${newsData.featured_image}` : null);
    console.log('VideoPath in HomeNews:', newsData?.videoPath);

    const [reaction, setReaction] = useState({});
    const [menuVisible, setMenuVisible] = useState(false);
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });
    
    const [userData, setUserData] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [fetchingComments, setFetchingComments] = useState(false);
    const [posting, setPosting] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [viewCount, setViewCount] = useState(0);
    const [liking, setLiking] = useState(false);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    useEffect(() => {
        if (newsData?.id) {
            fetchComments();
        }
    }, [newsData]);

    useEffect(() => {
        if (newsData?.id) {
            fetchLikeCount();
            fetchViewCount();
            recordView();
        }
    }, [newsData]);

    const checkLoginStatus = async () => {
        try {
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
            
            let userData;
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    userData = JSON.parse(userStr);
                }
            } catch (error) {
                console.error("Error getting user data:", error);
            }
            
            if (userToken && userData) {
                await AsyncStorage.setItem('loginResponse', userToken);
                setIsLoggedIn(true);
                setUserData(userData);
            } else {
                setIsLoggedIn(false);
                setUserData(null);
            }
        } catch (error) {
            console.error("Error checking login status:", error);
            setIsLoggedIn(false);
        }
    };

    const fetchComments = async () => {
        setFetchingComments(true);
        try {
            const targetNewsId = newsData?.id;
            if (!targetNewsId) {
                console.error("No news ID available for fetching comments");
                setFetchingComments(false);
                return;
            }
            
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
            
            const isAuthenticated = !!userToken;
            if (isAuthenticated) {
                await AsyncStorage.setItem('loginResponse', userToken);
            }
            
            const commentsEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/comments`;
            const response = await GETNETWORK(commentsEndpoint, isAuthenticated);
            
            let commentsData = [];
            
            if (response) {
                if (Array.isArray(response.data)) {
                    commentsData = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    commentsData = response.data.data;
                } else if (response.data?.comments && Array.isArray(response.data.comments)) {
                    commentsData = response.data.comments;
                } else if (response.data) {
                    for (const key in response.data) {
                        if (Array.isArray(response.data[key])) {
                            commentsData = response.data[key];
                            break;
                        }
                    }
                }
            }
            
            if (commentsData && commentsData.length > 0) {
                const formattedComments = commentsData.map(item => ({
                    id: item.id || Math.random().toString(),
                    name: item.user?.username || item.username || item.user_name || "Anonymous",
                    comment: item.text || item.comment || item.content || item.message || "",
                    timestamp: new Date(item.createdAt || item.created_at || item.timestamp || Date.now())
                }));
                
                formattedComments.sort((a, b) => b.timestamp - a.timestamp);
                setComments(formattedComments);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setFetchingComments(false);
        }
    };

    const getYoutubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = newsData?.video_link ? getYoutubeVideoId(newsData.video_link) : null;
    const fullImageUrl = newsData?.featured_image ? 
        (newsData.featured_image.startsWith('http') ? 
            newsData.featured_image : 
            `${BASE_URL}${newsData.featured_image.replace(/^\/+/, '')}`) : 
        null;
    
    const contentType = newsData?.videoPath ? 'video' : (videoId ? 'youtube' : 'text');
    const content = newsData?.content || '';
    const contentHasHtml = hasHtmlTags(content);

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
        
        if (optionId === '1') {
            setToastMessage({
                visible: true,
                message: "Post saved successfully",
                type: "success"
            });
        } else if (optionId === '2') {
            setToastMessage({
                visible: true,
                message: "Post reported successfully",
                type: "success"
            });
        }
    };

    const onNavigateBack = () => {
        navigation.goBack();
    };

    const handleLike = async () => {
        if (!isLoggedIn) {
            setToastMessage({
                visible: true,
                message: "Please log in to like this post",
                type: "error"
            });
            
            setTimeout(() => {
                navigation.navigate("LoginSignup", { 
                    returnScreen: "Home",
                    params: { newsData }
                });
            }, 1500);
            return;
        }
        
        setLiking(true);
        
        try {
            const targetNewsId = newsData?.id;
            if (!targetNewsId) {
                throw new Error("No news ID available for liking");
            }
            
            const newLikedStatus = !liked;
            
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
            
            if (!userToken) {
                throw new Error("No authentication token found");
            }
            
            await AsyncStorage.setItem('loginResponse', userToken);
            
            const newLikeCount = newLikedStatus ? likeCount + 1 : Math.max(0, likeCount - 1);
            
            setLiked(newLikedStatus);
            setLikeCount(newLikeCount);
            
            try {
                const likeCountKey = `likeCount_${targetNewsId}`;
                await AsyncStorage.setItem(likeCountKey, newLikeCount.toString());
            } catch (error) {
                console.error("Error updating like count in AsyncStorage:", error);
            }
            
            try {
                const likedPostsStr = await AsyncStorage.getItem('likedPosts');
                let likedPosts = likedPostsStr ? JSON.parse(likedPostsStr) : {};
                
                if (newLikedStatus) {
                    likedPosts[targetNewsId] = true;
                } else {
                    delete likedPosts[targetNewsId];
                }
                
                await AsyncStorage.setItem('likedPosts', JSON.stringify(likedPosts));
            } catch (error) {
                console.error("Error saving like status in AsyncStorage:", error);
            }
            
            const likeEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/like`;
            const response = await POSTNETWORK(likeEndpoint, {}, true);
            
            if (response && response.success !== false) {
                setToastMessage({
                    visible: true,
                    message: newLikedStatus ? "News liked successfully" : "News unliked successfully",
                    type: "success"
                });
            } else {
                setToastMessage({
                    visible: true,
                    message: "Like recorded locally. Will sync when connection improves.",
                    type: "info"
                });
            }
        } catch (error) {
            console.error(`Error ${liked ? 'unliking' : 'liking'} news:`, error);
            
            if (error.message?.includes("unauthorized") || error.message?.includes("401")) {
                setToastMessage({
                    visible: true,
                    message: "Session expired. Please login again",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "Home",
                        params: { newsData }
                    });
                }, 1500);
            } else {
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
            let shareMessage = `${removeHtmlTags(newsData.headline)}\n\n`;
            
            if (newsData.content) {
                const cleanContent = removeHtmlTags(newsData.content);
                const contentPreview = cleanContent.length > 100 
                    ? cleanContent.substring(0, 100) + '...' 
                    : cleanContent;
                shareMessage += `${contentPreview}\n\n`;
            }

            shareMessage += `Read more at: https://newztok.in/news/${newsData.id}`;

            const shareOptions = {
                message: shareMessage,
            };

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
        if (!isLoggedIn) {
            setToastMessage({
                visible: true,
                message: "Please log in to comment",
                type: "error"
            });
            
            setTimeout(() => {
                navigation.navigate("LoginSignup", { 
                    returnScreen: "Home",
                    params: { newsData }
                });
            }, 1500);
            return;
        }
        
        if (!newComment.trim()) {
            setToastMessage({
                visible: true,
                message: "Please enter a comment",
                type: "error"
            });
            return;
        }
        
        setPosting(true);
        
        try {
            const targetNewsId = newsData?.id;
            if (!targetNewsId) {
                throw new Error("No news ID available for posting comment");
            }
            
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
            
            if (!userToken) {
                throw new Error("No authentication token found");
            }
            
            await AsyncStorage.setItem('loginResponse', userToken);
            
            const commentPayload = { text: newComment.trim() };
            const commentEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/comment`;
            
            const response = await POSTNETWORK(commentEndpoint, commentPayload, true);
            
            if (response && (response.success || response.data?.success)) {
                const newCommentObj = {
                    id: response.data?.id || response.data?.data?.id || Math.random().toString(),
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
            } else {
                const alternativePayloads = [
                    { comment: newComment.trim() },
                    { content: newComment.trim() },
                    { message: newComment.trim() }
                ];
                
                let success = false;
                
                for (const payload of alternativePayloads) {
                    const retryResponse = await POSTNETWORK(commentEndpoint, payload, true);
                    
                    if (retryResponse && (retryResponse.success || retryResponse.data?.success)) {
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
            
            if (error.message?.includes("unauthorized") || error.message?.includes("401")) {
                setToastMessage({
                    visible: true,
                    message: "Session expired. Please login again",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "Home",
                        params: { newsData }
                    });
                }, 1500);
            } else {
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

    const fetchLikeCount = async () => {
        try {
            const targetNewsId = newsData?.id;
            if (!targetNewsId) return;
            
            try {
                const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                if (likeCountsStr) {
                    const likeCounts = JSON.parse(likeCountsStr);
                    if (likeCounts[targetNewsId] !== undefined) {
                        setLikeCount(likeCounts[targetNewsId]);
                    }
                }
            } catch (storageError) {
                console.error("Error retrieving like count from AsyncStorage:", storageError);
            }
            
            try {
                const likeCountEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/like/count`;
                const response = await GETNETWORK(likeCountEndpoint);
                
                if (response?.success && response?.data) {
                    const count = response.data?.count || 
                                 response.data?.likes_count || 
                                 response.data?.like_count || 
                                 response.data?.likes || 0;
                    
                    setLikeCount(count);
                    
                    try {
                        const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                        let likeCounts = likeCountsStr ? JSON.parse(likeCountsStr) : {};
                        likeCounts[targetNewsId] = count;
                        await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                    } catch (error) {
                        console.error("Error storing like count:", error);
                    }
                    
                    const userHasLiked = response.data?.user_has_liked || 
                                       response.data?.is_liked || 
                                       response.data?.liked || false;
                    
                    if (userHasLiked) {
                        setLiked(true);
                        setLikeCount(prevCount => Math.max(prevCount, 1));
                    }
                }
            } catch (apiError) {
                console.log("Error fetching from API:", apiError);
            }
            
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
            
            if (newsData?.likes_count !== undefined) {
                setLikeCount(newsData.likes_count || 0);
            }
            
            if (newsData?.user_has_liked) {
                setLiked(true);
                setLikeCount(prevCount => Math.max(prevCount, 1));
            }
            
        } catch (error) {
            console.error("Error in fetchLikeCount:", error);
        }
    };

    const fetchViewCount = async () => {
        try {
            const targetNewsId = newsData?.id;
            if (!targetNewsId) return;
            
            try {
                const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                if (viewCountsStr) {
                    const viewCounts = JSON.parse(viewCountsStr);
                    if (viewCounts[targetNewsId] !== undefined) {
                        setViewCount(viewCounts[targetNewsId]);
                    }
                }
            } catch (storageError) {
                console.error("Error retrieving view count from AsyncStorage:", storageError);
            }
            
            try {
                const viewCountEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/view/count`;
                const response = await GETNETWORK(viewCountEndpoint, false);
                
                if (response?.success && response?.data) {
                    const count = response.data?.count || 
                                response.data?.views_count || 
                                response.data?.view_count || 
                                response.data?.views || 0;
                    
                    setViewCount(count);
                    
                    try {
                        const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                        let viewCounts = viewCountsStr ? JSON.parse(viewCountsStr) : {};
                        viewCounts[targetNewsId] = count;
                        await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
                    } catch (error) {
                        console.error("Error storing view count:", error);
                    }
                }
            } catch (apiError) {
                console.log("Error fetching view count from API:", apiError);
            }
            
            if (newsData?.views_count !== undefined) {
                setViewCount(newsData.views_count || 0);
            }
            
        } catch (error) {
            console.error("Error in fetchViewCount:", error);
        }
    };
    
    const recordView = async () => {
        try {
            const targetNewsId = newsData?.id;
            if (!targetNewsId) return;
            
            setViewCount(prevCount => prevCount + 1);
            
            try {
                const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                let viewCounts = viewCountsStr ? JSON.parse(viewCountsStr) : {};
                viewCounts[targetNewsId] = (viewCounts[targetNewsId] || 0) + 1;
                await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
            } catch (error) {
                console.error("Error updating view count in AsyncStorage:", error);
            }
            
            const viewEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/view`;
            await POSTNETWORK(viewEndpoint, {}, false);
            
        } catch (error) {
            console.error("Error recording view:", error);
        }
    };

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
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} onPressBack={onNavigateBack} />

            {loading ? (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{fontFamily: POPPINSLIGHT}}>Loading...</Text>
                </View>
            ) : (
                <ScrollView style={styles.container}>
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
                    ) : fullImageUrl ? (
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: fullImageUrl }} 
                                style={styles.featuredImage}
                                resizeMode="cover"
                                onError={(e) => {
                                    console.log('Image load error:', e.nativeEvent.error);
                                    if (fullImageUrl) {
                                        let fixedUri = fullImageUrl;
                                        if (fullImageUrl.includes('/uploads/')) {
                                            fixedUri = `${BASE_URL}${fullImageUrl.split('/uploads/')[1]}`;
                                        } 
                                        else if (fullImageUrl.includes('/images/featuredImage-')) {
                                            fixedUri = `${BASE_URL}uploads/images/${fullImageUrl.split('/images/featuredImage-')[1]}`;
                                        }
                                        else if (fullImageUrl.endsWith('.jpg') || fullImageUrl.endsWith('.png') || fullImageUrl.endsWith('.jpeg')) {
                                            const filename = fullImageUrl.split('/').pop();
                                            fixedUri = `${BASE_URL}uploads/images/${filename}`;
                                        }
                                        fixedUri = fixedUri.replace(/([^:])\/\//g, '$1/');
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
                                {(newsData?.headline || "News").charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.title}>{newsData?.headline || ''}</Text>

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
                                <TouchableOpacity style={[styles.actionButton, { marginRight: WIDTH * 0.02 }]} activeOpacity={0.7}>
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

            <MyLoader visible={loading} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.05,
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
        marginRight: WIDTH * 0.05,
    },
    actionButton: {
        marginRight: WIDTH * 0.05,
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
    featuredImage: {
        width: '100%',
        height: HEIGHT * 0.3,
        borderRadius: WIDTH * 0.025,
        marginBottom: HEIGHT * 0.018,
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
    commenterName: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
    },
    commentTime: {
        fontSize: WIDTH * 0.032,
        color: GREY,
        fontFamily: POPPINSLIGHT,
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
    imageContainer: {
        height: HEIGHT * 0.28,
        borderRadius: WIDTH * 0.025,
        overflow: 'hidden',
        marginBottom: HEIGHT * 0.018,
        width: '100%',
    },
    placeholderImage: {
        height: HEIGHT * 0.28,
        borderRadius: WIDTH * 0.025,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.018,
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