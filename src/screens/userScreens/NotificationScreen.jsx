import React, { useState, useRef, useCallback } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Modal,
    Pressable,
    Dimensions,
    Share,
    Alert,
    ActivityIndicator,
    Animated,
} from "react-native";
import { BLACK, WHITE, GREY, BLUE, RED } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { THREEDOTS, DOWNARROW, LOGO, LIKE, PRESSLIKE, VIEW, WHATSAPP } from "../../constants/imagePath";
// import { notificationData } from "../../assets/data/notificationData";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { WIDTH, HEIGHT } from "../../constants/config";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../constants/fontPath";
import HTML from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../../constants/url";
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const NotificationSkeleton = () => {
    const animatedValue = new Animated.Value(0);

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <View style={styles.skeletonCard}>
            <Animated.View style={[styles.skeletonImage, { opacity }]} />
            <View style={styles.skeletonContent}>
                <Animated.View style={[styles.skeletonTitle, { opacity }]} />
                <Animated.View style={[styles.skeletonDate, { opacity }]} />
                <Animated.View style={[styles.skeletonText, { opacity }]} />
                <Animated.View style={[styles.skeletonText, { opacity, width: '60%' }]} />
            </View>
        </View>
    );
};

export default NotificationScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [viewCount, setViewCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [liking, setLiking] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [todayNotifications, setTodayNotifications] = useState([]);
    const [previousNotifications, setPreviousNotifications] = useState([]);
    const navigation = useNavigation();

    const handleCardPress = (item) => {
        if (!item) return;
        setSelectedNotification(item);
        setModalVisible(true);
    };

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
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

            // If no token is found, redirect to login
            if (!userToken) {
                setToastMessage({
                    visible: true,
                    message: "Please login to view notifications",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "Notification"
                    });
                }, 1500);
                return;
            }

            console.log("Fetching notifications with token:", userToken ? "Token exists" : "No token");
            const notificationEndpoint = `${BASE_URL}api/notifications`;
            console.log("Notification endpoint:", notificationEndpoint);
            
            const response = await GETNETWORK(notificationEndpoint, true);
            console.log("API Response:", JSON.stringify(response, null, 2));
            
            if (!response) {
                throw new Error("No response received from the server");
            }
            
            if (!response.success) {
                // Check if the error is due to authentication
                if (response.message?.toLowerCase().includes("login") || 
                    response.message?.toLowerCase().includes("unauthorized") ||
                    response.message?.toLowerCase().includes("auth")) {
                    
                    // Clear invalid token
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('loginResponse');
                    
                    setToastMessage({
                        visible: true,
                        message: "Session expired. Please login again",
                        type: "error"
                    });
                    
                    setTimeout(() => {
                        navigation.navigate("LoginSignup", { 
                            returnScreen: "Notification"
                        });
                    }, 1500);
                    return;
                }
                throw new Error(`API Error: ${response.message || "Unknown error"}`);
            }
            
            // Handle both array and object response formats
            let notificationsData = [];
            if (Array.isArray(response.data)) {
                notificationsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // If data is an object, try to find the notifications array within it
                if (Array.isArray(response.data.notifications)) {
                    notificationsData = response.data.notifications;
                } else if (Array.isArray(response.data.data)) {
                    notificationsData = response.data.data;
                } else {
                    // If we can't find an array, convert the object to an array
                    notificationsData = Object.values(response.data);
                }
            }
            
            if (notificationsData.length === 0) {
                console.log("No notifications found in the response");
            }
            
            setNotifications(notificationsData);
            
        } catch (error) {
            console.error("Error fetching notifications:", {
                message: error?.message,
                stack: error?.stack,
                response: error?.response
            });

            // Check if the error is due to authentication
            if (error?.message?.toLowerCase().includes("login") || 
                error?.message?.toLowerCase().includes("unauthorized") ||
                error?.message?.toLowerCase().includes("auth")) {
                
                // Clear invalid token
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('loginResponse');
                
                setToastMessage({
                    visible: true,
                    message: "Session expired. Please login again",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "Notification"
                    });
                }, 1500);
                return;
            }

            setToastMessage({
                visible: true,
                message: error?.message || "Error loading notifications",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    }, [navigation]);

    const checkLoginStatus = useCallback(async () => {
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
    }, []);

    const fetchLikeCount = useCallback(async () => {
        if (!selectedNotification?.id) return;
        
        try {
            const targetId = selectedNotification.id;
            try {
                const likeCountsStr = await AsyncStorage.getItem('likeCounts');
                if (likeCountsStr) {
                    const likeCounts = JSON.parse(likeCountsStr);
                    if (likeCounts[targetId] !== undefined) {
                        setLikeCount(likeCounts[targetId]);
                    }
                }
            } catch (storageError) {
                console.error("Error retrieving like count from AsyncStorage:", storageError);
            }

            try {
                const likeCountEndpoint = `${BASE_URL}api/interaction/news/${targetId}/like/count`;
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
                        likeCounts[targetId] = count;
                        await AsyncStorage.setItem('likeCounts', JSON.stringify(likeCounts));
                    } catch (error) {
                        console.error("Error storing like count:", error);
                    }

                    const userHasLiked = response.data?.user_has_liked || 
                                       response.data?.is_liked || 
                                       response.data?.liked || false;
                    
                    if (userHasLiked) {
                        setLiked(true);
                    }
                }
            } catch (apiError) {
                console.log("Error fetching from API:", apiError);
            }
        } catch (error) {
            console.error("Error in fetchLikeCount:", error);
        }
    }, [selectedNotification]);

    const fetchViewCount = useCallback(async () => {
        if (!selectedNotification?.id) return;
        
        try {
            const targetId = selectedNotification.id;
            try {
                const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                if (viewCountsStr) {
                    const viewCounts = JSON.parse(viewCountsStr);
                    if (viewCounts[targetId] !== undefined) {
                        setViewCount(viewCounts[targetId]);
                    }
                }
            } catch (storageError) {
                console.error("Error retrieving view count from AsyncStorage:", storageError);
            }

            try {
                const viewCountEndpoint = `${BASE_URL}api/interaction/news/${targetId}/view/count`;
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
                        viewCounts[targetId] = count;
                        await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
                    } catch (error) {
                        console.error("Error storing view count:", error);
                    }
                }
            } catch (apiError) {
                console.log("Error fetching view count from API:", apiError);
            }
        } catch (error) {
            console.error("Error in fetchViewCount:", error);
        }
    }, [selectedNotification]);

    const recordView = async () => {
        try {
            const targetId = selectedNotification?.id;
            if (!targetId) return;

            setViewCount(prevCount => prevCount + 1);

            try {
                const viewCountsStr = await AsyncStorage.getItem('viewCounts');
                let viewCounts = viewCountsStr ? JSON.parse(viewCountsStr) : {};
                viewCounts[targetId] = (viewCounts[targetId] || 0) + 1;
                await AsyncStorage.setItem('viewCounts', JSON.stringify(viewCounts));
            } catch (error) {
                console.error("Error updating view count in AsyncStorage:", error);
            }

            const viewEndpoint = `${BASE_URL}api/interaction/news/${targetId}/view`;
            await POSTNETWORK(viewEndpoint, {}, false);
        } catch (error) {
            console.error("Error recording view:", error);
        }
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
                    returnScreen: "Notification",
                    params: { newsData: selectedNotification }
                });
            }, 1500);
            return;
        }
        
        setLiking(true);
        
        try {
            const targetNewsId = selectedNotification?.id;
            if (!targetNewsId) {
                throw new Error("No news ID available for liking");
            }
            
            const newLikedStatus = !liked;
            console.log(`${newLikedStatus ? 'Liking' : 'Unliking'} news ID: ${targetNewsId}`);
            
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
                console.log(`Updated like count in AsyncStorage: ${newLikeCount}`);
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
                console.log(`Saved like status in AsyncStorage: ${newLikedStatus}`);
            } catch (error) {
                console.error("Error saving like status in AsyncStorage:", error);
            }
            
            const likeEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/like`;
            console.log(`Using like endpoint: ${likeEndpoint}`);
            
            const response = await POSTNETWORK(likeEndpoint, {}, true);
            console.log("Like API response:", response);
            
            if (response && response.success !== false) {
                console.log(`Successfully ${newLikedStatus ? 'liked' : 'unliked'} news`);
                
                setToastMessage({
                    visible: true,
                    message: newLikedStatus ? "News liked successfully" : "News unliked successfully",
                    type: "success"
                });
            } else {
                console.log("API request had issues, but maintaining UI state");
                
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
            
            if (error && error.message && 
               (error.message.includes("unauthorized") || error.message.includes("401"))) {
                setToastMessage({
                    visible: true,
                    message: "Session expired. Please login again",
                    type: "error"
                });
                
                setTimeout(() => {
                    navigation.navigate("LoginSignup", { 
                        returnScreen: "Notification",
                        params: { newsData: selectedNotification }
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
            if (!selectedNotification) return;

            const removeHtmlTags = (text) => {
                if (!text) return '';
                return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            };

            let shareMessage = `${removeHtmlTags(selectedNotification.title || "")}\n\n`;
            
            if (selectedNotification.message) {
                const cleanContent = removeHtmlTags(selectedNotification.message);
                const contentPreview = cleanContent.length > 100 
                    ? cleanContent.substring(0, 100) + '...' 
                    : cleanContent;
                shareMessage += `${contentPreview}\n\n`;
            }

            shareMessage += `Read more at: https://newztok.in/news/${selectedNotification.id}`;

            const shareOptions = {
                message: shareMessage,
            };

            if (selectedNotification.image) {
                shareOptions.url = typeof selectedNotification.image === 'string' 
                    ? selectedNotification.image 
                    : null;
            }

            await Share.share(shareOptions, {
                dialogTitle: 'Share News',
                subject: removeHtmlTags(selectedNotification.title || "")
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

    const renderItem = ({ item }) => {
        if (!item || !item.id) return null;
        
        // Safely get text content for display
        const safeTitle = item.title || "No title";
        const safeDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown date";
        const safeNews = item.message || "No content available";
        const newsPreview = safeNews.length > 100 
            ? safeNews.substring(0, 100) + "..." 
            : safeNews;
            
        return (
            <TouchableOpacity 
                key={item.id} 
                style={styles.card}
                onPress={() => handleCardPress(item)}
            >
                <Image 
                    source={typeof item.image === 'string' && item.image 
                        ? { uri: item.image } 
                        : LOGO} 
                    style={styles.image}
                    resizeMode="cover"
                    defaultSource={LOGO}
                />
                <View style={styles.contentContainer}>
                    <Text style={styles.headline} numberOfLines={2} ellipsizeMode="tail">
                        {safeTitle}
                    </Text>
                    <Text style={styles.date}>{safeDate}</Text>
                    <Text style={styles.newsContent} numberOfLines={2}>
                        {newsPreview}
                    </Text>
                    <View style={styles.footer}>
                        <Text style={styles.readMore}>Read More</Text>
                        <Image source={DOWNARROW} style={styles.downArrow} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderNewsModal = () => (
        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <MyStatusBar backgroundColor={WHITE} />
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                
                <ScrollView style={styles.modalScrollView}>
                    {selectedNotification && (
                        <>
                            <Image 
                                source={typeof selectedNotification.image === 'string' && selectedNotification.image
                                    ? { uri: selectedNotification.image } 
                                    : LOGO} 
                                style={styles.modalImage}
                                resizeMode="cover"
                                defaultSource={LOGO}
                            />
                            
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {selectedNotification.title || "No title"}
                                </Text>
                                <Text style={styles.modalDate}>
                                    {selectedNotification.created_at ? new Date(selectedNotification.created_at).toLocaleDateString() : "Unknown date"}
                                </Text>
                            </View>
                            
                            <View style={styles.modalActionRow}>
                                <View style={{ flexDirection: "row" }}>
                                    <View style={styles.actionButtonContainer}>
                                        <TouchableOpacity 
                                            onPress={handleLike} 
                                            style={styles.actionButton}
                                            disabled={liking}
                                        >
                                            <Image source={liked ? PRESSLIKE : LIKE} style={styles.actionIcon} />
                                        </TouchableOpacity>
                                        <Text style={styles.actionCountText}>
                                            {likeCount > 999 ? (likeCount / 1000).toFixed(1) + 'k' : likeCount}
                                        </Text>
                                    </View>
                                    <View style={styles.actionButtonContainer}>
                                        <TouchableOpacity style={styles.actionButton}>
                                            <Image source={VIEW} style={styles.actionIcon} />
                                        </TouchableOpacity>
                                        <Text style={styles.actionCountText}>
                                            {viewCount > 999 ? (viewCount / 1000).toFixed(1) + 'k' : viewCount}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleWhatsAppShare} style={styles.actionButton}>
                                    <Image source={WHATSAPP} style={styles.actionIcon} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalContentContainer}>
                                <Text style={styles.modalContentHeading}>New Article</Text>
                                <Text style={styles.modalContent}>
                                    {selectedNotification.message || "No content available"}
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );

    const renderSkeletonLoader = () => {
        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {[1, 2, 3, 4, 5].map((item) => (
                    <NotificationSkeleton key={item} />
                ))}
            </ScrollView>
        );
    };

    useFocusEffect(
        useCallback(() => {
            checkLoginStatus();
            fetchNotifications();
            
            return () => {
                // Cleanup if needed
            };
        }, [checkLoginStatus, fetchNotifications])
    );

    useFocusEffect(
        useCallback(() => {
            if (selectedNotification?.id) {
                fetchLikeCount();
                fetchViewCount();
                recordView();
            }
        }, [selectedNotification, fetchLikeCount, fetchViewCount])
    );

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} showBackButton={false} />

            {loading ? (
                renderSkeletonLoader()
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {notifications.length > 0 ? (
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => (item?.id || Math.random()).toString()}
                            renderItem={renderItem}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.noNotificationsContainer}>
                            <Text style={styles.noNotificationsText}>No notifications available</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {renderNewsModal()}

            <ToastMessage
                message={toastMessage.message}
                visible={toastMessage.visible}
                setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                bacgroundColor={toastMessage.type == "success" ? "green" : "red"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
                image={LOGO}
            />
        </>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.025,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE,
    },
    loadingText: {
        marginTop: HEIGHT * 0.01,
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
    },
    noNotificationsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: HEIGHT * 0.5,
    },
    noNotificationsText: {
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSMEDIUM,
        color: GREY,
    },
    todayText: {
        fontSize: WIDTH * 0.035,
        color: BLACK,
        marginBottom: HEIGHT * 0.01,
        fontFamily: POPPINSMEDIUM,
    },
    previousText: {
        fontSize: WIDTH * 0.035,
        color: BLACK,
        marginVertical: HEIGHT * 0.01,
        fontFamily: POPPINSMEDIUM,
    },
    verticalLine: {
        width: "100%",
        height: 2,
        backgroundColor: BLACK,
        marginVertical: HEIGHT * 0.01,
    },
    card: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: WHITE,
        padding: WIDTH * 0.02,
        borderRadius: WIDTH * 0.015,
        elevation: 2,
        shadowColor: BLACK,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        marginBottom: HEIGHT * 0.012,
    },
    image: {
        width: WIDTH * 0.25,
        height: HEIGHT * 0.08,
        borderRadius: WIDTH * 0.01,
        marginRight: WIDTH * 0.02,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "flex-start",
    },
    headline: {
        fontSize: WIDTH * 0.035,
        color: BLACK,
        marginBottom: HEIGHT * 0.003,
        fontFamily: POPPINSMEDIUM,
        lineHeight: WIDTH * 0.045,
    },
    date: {
        fontSize: WIDTH * 0.025,
        color: BLACK,
        marginBottom: HEIGHT * 0.003,
        fontFamily: POPPINSLIGHT,
    },
    newsContent: {
        fontSize: WIDTH * 0.03,
        color: BLACK,
        marginBottom: HEIGHT * 0.005,
        fontFamily: POPPINSLIGHT,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: HEIGHT * 0.005,
    },
    readMore: {
        fontSize: WIDTH * 0.025,
        color: BLUE,
        marginRight: WIDTH * 0.01,
        fontFamily: POPPINSLIGHT,
    },
    downArrow: {
        width: WIDTH * 0.025,
        height: WIDTH * 0.025,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: WHITE,
    },
    backButton: {
        padding: WIDTH * 0.04,
        paddingTop: HEIGHT * 0.06,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginLeft: WIDTH * 0.02,
    },
    modalScrollView: {
        flex: 1,
        padding: WIDTH * 0.04,
    },
    modalImage: {
        width: '100%',
        height: HEIGHT * 0.3,
        borderRadius: WIDTH * 0.02,
        marginBottom: HEIGHT * 0.02,
    },
    modalHeader: {
        marginBottom: HEIGHT * 0.02,
    },
    modalTitle: {
        fontSize: WIDTH * 0.045,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginBottom: HEIGHT * 0.01,
        lineHeight: HEIGHT * 0.03,
    },
    modalDate: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSLIGHT,
        color: GREY,
    },
    modalActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.02,
    },
    actionButtonContainer: {
        alignItems: 'center',
        marginRight: WIDTH * 0.05,
    },
    actionButton: {
        padding: WIDTH * 0.02,
    },
    actionIcon: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
    },
    actionCountText: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        marginTop: HEIGHT * 0.005,
    },
    modalContentContainer: {
        marginTop: HEIGHT * 0.02,
    },
    modalContentHeading: {
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginBottom: HEIGHT * 0.015,
    },
    modalContent: {
        fontSize: WIDTH * 0.038,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        lineHeight: HEIGHT * 0.03,
    },
    skeletonCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: WHITE,
        padding: WIDTH * 0.02,
        borderRadius: WIDTH * 0.015,
        elevation: 2,
        shadowColor: BLACK,
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        marginBottom: HEIGHT * 0.012,
    },
    skeletonImage: {
        width: WIDTH * 0.25,
        height: HEIGHT * 0.08,
        borderRadius: WIDTH * 0.01,
        marginRight: WIDTH * 0.02,
        backgroundColor: GREY,
    },
    skeletonContent: {
        flex: 1,
        justifyContent: "flex-start",
    },
    skeletonTitle: {
        width: '80%',
        height: WIDTH * 0.045,
        backgroundColor: GREY,
        borderRadius: WIDTH * 0.005,
        marginBottom: HEIGHT * 0.003,
    },
    skeletonDate: {
        width: '40%',
        height: WIDTH * 0.025,
        backgroundColor: GREY,
        borderRadius: WIDTH * 0.005,
        marginBottom: HEIGHT * 0.003,
    },
    skeletonText: {
        width: '100%',
        height: WIDTH * 0.03,
        backgroundColor: GREY,
        borderRadius: WIDTH * 0.005,
        marginBottom: HEIGHT * 0.005,
    },
});