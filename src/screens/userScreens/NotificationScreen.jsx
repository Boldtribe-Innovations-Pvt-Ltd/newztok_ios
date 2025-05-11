import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { BLACK, WHITE, GREY, BLUE, RED } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { THREEDOTS, DOWNARROW, LOGO, LIKE, PRESSLIKE, VIEW, WHATSAPP } from "../../constants/imagePath";
import { notificationData } from "../../assets/data/notificationData";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { WIDTH, HEIGHT } from "../../constants/config";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../constants/fontPath";
import HTML from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../../constants/url";
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { useNavigation } from '@react-navigation/native';

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
    const navigation = useNavigation();

    const handleCardPress = (item) => {
        setSelectedNotification(item);
        setModalVisible(true);
    };

    useEffect(() => {
        checkLoginStatus();
    }, []);

    useEffect(() => {
        if (selectedNotification?.id) {
            fetchLikeCount();
            fetchViewCount();
            recordView();
        }
    }, [selectedNotification]);

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

    const fetchLikeCount = async () => {
        try {
            const targetId = selectedNotification?.id;
            if (!targetId) return;

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
    };

    const fetchViewCount = async () => {
        try {
            const targetId = selectedNotification?.id;
            if (!targetId) return;

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
    };

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
            
            if (error.message?.includes("unauthorized") || error.message?.includes("401")) {
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

            let shareMessage = `${removeHtmlTags(selectedNotification.title)}\n\n`;
            
            if (selectedNotification.news) {
                const cleanContent = removeHtmlTags(selectedNotification.news);
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
                shareOptions.url = selectedNotification.image;
            }

            await Share.share(shareOptions, {
                dialogTitle: 'Share News',
                subject: removeHtmlTags(selectedNotification.title)
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

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            onPress={() => handleCardPress(item)}
        >
            <Image source={item.image} style={styles.image} />
            <View style={styles.contentContainer}>
                <Text style={styles.headline} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.newsContent} numberOfLines={2}>
                    {item.news ? `${item.news.substring(0, 100)}...` : "No content available"}
                </Text>
                <View style={styles.footer}>
                    <Text style={styles.readMore}>Read More</Text>
                    <Image source={DOWNARROW} style={styles.downArrow} />
                </View>
            </View>
        </TouchableOpacity>
    );

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
                                source={selectedNotification.image} 
                                style={styles.modalImage}
                                resizeMode="cover"
                            />
                            
                            <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                            
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

                            <Text style={styles.modalDate}>{selectedNotification.date}</Text>
                            <Text style={styles.modalContent}>{selectedNotification.news}</Text>
                        </>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} showBackButton={false} />

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.todayText}>Today</Text>
                <View style={styles.verticalLine} />

                <FlatList
                    data={notificationData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    scrollEnabled={false}
                />

                <Text style={styles.previousText}>Previous</Text>
                <View style={styles.verticalLine} />

                <FlatList
                    data={notificationData}
                    keyExtractor={(item) => `prev-${item.id.toString()}`}
                    renderItem={renderItem}
                    scrollEnabled={false}
                />
            </ScrollView>

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
    modalTitle: {
        fontSize: WIDTH * 0.045,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginBottom: HEIGHT * 0.02,
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
    modalDate: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSLIGHT,
        color: GREY,
        marginBottom: HEIGHT * 0.02,
    },
    modalContent: {
        fontSize: WIDTH * 0.038,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        lineHeight: HEIGHT * 0.03,
    },
});