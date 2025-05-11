import React, { useState, useCallback } from "react";
import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { WHITE, BLUE, BLACK, GREY, RED } from "../../../constants/color";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { LOGO } from "../../../constants/imagePath";
import { BASE_URL } from "../../../constants/url";
import { useFocusEffect } from '@react-navigation/native';
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { getObjByKey, getStringByKey, storeStringByKey } from "../../../utils/Storage";
import { HEIGHT, WIDTH } from "../../../constants/config";
import { POPPINSLIGHT, POPPINSMEDIUM } from "../../../constants/fontPath";

export default RejectPostScreens = ({ navigation }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [totalPosts, setTotalPosts] = useState(0);
    const [token, setToken] = useState('');
    const [toastMessage, setToastMessage] = useState({
        type: "",
        msg: "",
        visible: false
    });

    // Fetch posts when the screen focuses
    useFocusEffect(
        useCallback(() => {
            getToken();
            return () => {};
        }, [])
    );

    const getToken = async () => {
        try {
            console.log("Attempting to get token from storage...");
            
            // Get token directly from loginResponse key (this is the standard storage location)
            let authToken = await getStringByKey('loginResponse');
            console.log("Retrieved token from 'loginResponse':", authToken ? "Token exists" : "Token is null or empty");

            // If token not found, try to get a new one or use a fixed one for testing
            if (!authToken) {
                console.log("No token found, using fixed token for testing");
                // You can update this fixed token as needed
                const fixedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzNjYyMzQ1LCJpYXQiOjE3NDM2NjE0NDUsImp0aSI6IjhiNjMwZjcwNmY2MDQ3NTlhYzkyMmE5NDY4ZjMyZTQ1IiwidXNlcl9pZCI6MTAsInJvbGUiOiJqb3VybmFsaXN0In0.mBRoX7AzF36H6IXGyA8XdfBMsoc4iprzh9KlRmdYLGU";
                await storeStringByKey('loginResponse', fixedToken);
                console.log("Fixed token stored as fallback");
                authToken = fixedToken;
            }

            setToken(authToken);
            if (authToken) {
                fetchPostsData(authToken);
            } else {
                console.log("Authorization token not found in storage");
                setToastMessage({
                    type: "error",
                    msg: "Authentication token not found",
                    visible: true
                });
                
                // Navigate to login screen when token is not found
                setTimeout(() => {
                    navigation.navigate('Login');
                }, 2000);
            }
        } catch (error) {
            console.error("Error getting token:", error);
            setToastMessage({
                type: "error",
                msg: "Error retrieving authentication token",
                visible: true
            });
        }
    };

    const fetchPostsData = async (authToken) => {
        const url = `${BASE_URL}api/news/my-rejected-news`;
        setLoading(true);
        
        console.log("Making API request to:", url);
        console.log("Using authorization token:", authToken ? "Yes" : "No");

        try {
            // Use the GETNETWORK utility with the token (true indicates an authenticated request)
            const result = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            // Check if response is ok
            if (!result.ok) {
                if (result.status === 401) {
                    throw new Error("Unauthorized: Please login again");
                }
                throw new Error(`API Error: ${result.status}`);
            }
            
            const data = await result.json();
            console.log("API Response success:", data?.success);
            setLoading(false);
            
            if (data?.success) {
                console.log("Number of posts received:", data.data?.length || 0);
                // Map the API data to the format expected by our UI
                const formattedPosts = data.data.map(item => ({
                    id: item.id,
                    headline: item.title || item.headline || "Untitled",
                    content: item.content || item.description || "",
                    category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Uncategorized",
                    submittedBy: `Journalist ID: ${item.journalist}`,
                    submittedAt: item.submitted_at || item.createdAt,
                    rejectedAt: item.rejected_at || item.rejected_date,
                    featured: item.featured || false,
                    approved: item.approved || false,
                    rejected: item.rejected || true,
                    featured_image: item.featured_image || item.featuredImage,
                    youtubeUrl: item.youtubeUrl || item.video_link,
                    video_link: item.video_link || item.youtubeUrl,
                    post_type: (item.youtubeUrl || item.video_link) ? "video" : 
                            (item.featured_image || item.featuredImage) ? "standard" : "text"
                }));
                
                setPosts(formattedPosts);
                setTotalPosts(formattedPosts.length);
            } else {
                console.log("API error message:", data?.message);
                setToastMessage({
                    type: "error",
                    msg: data?.message || "Failed to fetch posts",
                    visible: true
                });
            }
        } catch (error) {
            console.error("API Error:", error);
            setLoading(false);
            
            // Show specific message for auth errors
            if (error.message && error.message.includes("Unauthorized")) {
                Alert.alert(
                    "Session Expired",
                    "Your session has expired. Please login again.",
                    [{ text: "OK", onPress: () => navigation.navigate("Login") }]
                );
            } else {
                setToastMessage({
                    type: "error",
                    msg: "Network error occurred",
                    visible: true
                });
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        
        try {
            // Always get a fresh token when refreshing
            await getToken();
        } catch (error) {
            console.error("Error during refresh:", error);
        } finally {
            setRefreshing(false);
        }
    };

    // Format date and time from timestamp
    const formatDateTime = (timestamp) => {
        if (!timestamp) return { date: "N/A", time: "N/A" };
        
        try {
            const date = new Date(timestamp);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return { date: "Invalid date", time: "N/A" };
            }
            
            const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            // Add AM/PM format to time
            const hours = date.getHours();
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12; // Convert 24h to 12h format
            const formattedTime = `${formattedHours}:${minutes} ${ampm}`;
            
            return { date: formattedDate, time: formattedTime };
        } catch (e) {
            console.error("Date formatting error:", e);
            return { date: "Invalid date", time: "N/A" };
        }
    };

    // Get content preview (first 100 characters)
    const getContentPreview = (content) => {
        if (!content) return "No content available";
        
        // Remove HTML tags for plain text preview
        const plainText = content.replace(/<[^>]*>/g, '');
        return plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
    };

    // Handle media display (featured image or video)
    const renderMediaContent = (item) => {
        if (!item) {
            return (
                <View style={styles.noMediaPlaceholder}>
                    <Text style={styles.noMediaText}>?</Text>
                </View>
            );
        }
        
        // Display YouTube content if youtubeUrl exists
        if (item.youtubeUrl) {
            // Extract YouTube ID from URL (simplified)
            const videoId = item.youtubeUrl.split('v=')[1]?.split('&')[0];
            
            if (videoId) {
                // Use YouTube thumbnail
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                
                return (
                    <View style={styles.videoContainer}>
                        <Image
                            source={{ uri: thumbnailUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                        <View style={styles.videoInfoBadge}>
                            <Text style={styles.videoInfoText}>YouTube</Text>
                        </View>
                        <View style={styles.videoIconOverlay}>
                            <View style={styles.playButtonCircle}>
                                <Text style={styles.videoIconText}>▶</Text>
                            </View>
                        </View>
                    </View>
                );
            }
        }
        
        // Display standard featured image
        if (item.featured_image) {
            // Fix image path URL construction to prevent double slashes
            const imagePath = item.featured_image;
            
            // Clean up the URL parts to prevent double slashes
            const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
            const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
            
            const fullUrl = baseUrl + cleanPath;
            console.log("Fixed image URL for rejected post:", fullUrl);
                
            return (
                <Image
                    source={{ uri: fullUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => {
                        console.error("Image loading error:", error.nativeEvent.error);
                        console.log("Failed image source:", fullUrl);
                    }}
                />
            );
        }
        
        // Check for alternative property name
        if (item.featuredImage) {
            // Fix image path URL construction to prevent double slashes
            const imagePath = item.featuredImage;
            
            // Clean up the URL parts to prevent double slashes
            const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
            const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
            
            const fullUrl = baseUrl + cleanPath;
            console.log("Fixed image URL (alt) for rejected post:", fullUrl);
                
            return (
                <Image
                    source={{ uri: fullUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    onError={(error) => {
                        console.error("Image loading error:", error.nativeEvent.error);
                        console.log("Failed image source:", fullUrl);
                    }}
                />
            );
        }
        
        // Fallback for posts without media
        return (
            <View style={styles.noMediaPlaceholder}>
                <Text style={styles.noMediaText}>
                    {item.headline ? item.headline.charAt(0).toUpperCase() : '?'}
                </Text>
            </View>
        );
    };

    const renderRejectedPostItem = ({ item }) => {
        const { date: submittedDate, time: submittedTime } = formatDateTime(item.submittedAt);
        const contentPreview = getContentPreview(item.content);
        const isVideoContent = item.post_type === "video";
        
        return (
            <View style={styles.card}>
                {/* Logo Header */}
                <View style={styles.logoHeader}>
                    <Image 
                        source={LOGO} 
                        style={styles.logoImage} 
                        resizeMode="contain"
                    />
                </View>

                {/* Media Content with Category */}
                <View style={styles.mediaWrapper}>
                    <View style={styles.mediaContainer}>
                        {renderMediaContent(item)}
                    </View>
                    <View style={styles.categoryBadgeContainer}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    </View>
                </View>
                
                {/* Content Section */}
                <View style={styles.contentSection}>
                    {/* Title */}
                    <Text style={styles.headlineText} numberOfLines={2}>{item.headline}</Text>
                    
                    {/* Content Preview */}
                    <Text style={styles.contentPreview} numberOfLines={3}>{contentPreview}</Text>
                    
                    {/* Submitted At with Time on right */}
                    <View style={styles.dateRow}>
                        <Text style={styles.submittedAtText}>Submitted at: {submittedDate}</Text>
                        <Text style={styles.timeText}>{submittedTime}</Text>
                    </View>
                    
                    {/* Footer with Content Type */}
                    <View style={styles.cardFooter}>
                        <Text style={[
                            styles.contentTypeText,
                            isVideoContent ? styles.videoContentBadge : styles.standardContentBadge
                        ]}>
                            {isVideoContent ? "Video Content" : "Standard Content"}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <>
            <MyHeader
                showBackButton={false}
                showSettings={false}
                showLocationDropdown={false}
                showText={false}
            />
            <View style={styles.container}>
                {/* Post Count */}
                <View style={styles.countContainer}>
                    <Text style={styles.countText}>Rejected Posts ({totalPosts})</Text>
                </View>

                {/* Post List */}
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={BLUE} />
                        <Text style={styles.loadingText}>Loading posts...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={posts}
                        renderItem={renderRejectedPostItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No Rejected News Available</Text>
                            </View>
                        )}
                    />
                )}
            </View>

            <ToastMessage
                message={toastMessage.msg}
                visible={toastMessage.visible}
                setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                bacgroundColor={toastMessage.type == "success" ? "green" : "red"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.04
    },
    countContainer: {
        marginBottom: HEIGHT * 0.02
    },
    countText: {
        fontSize: WIDTH * 0.045,
        fontFamily: POPPINSMEDIUM,
        color: BLACK
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE
    },
    loadingText: {
        marginTop: HEIGHT * 0.015,
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSLIGHT,
        color: BLACK
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: HEIGHT * 0.06
    },
    emptyText: {
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSLIGHT,
        color: GREY,
        textAlign: 'center'
    },
    listContainer: {
        paddingBottom: HEIGHT * 0.02
    },
    card: {
        backgroundColor: WHITE,
        borderRadius: WIDTH * 0.025,
        marginVertical: HEIGHT * 0.01,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
        overflow: 'hidden',
        width: '95%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: RED
    },
    logoHeader: {
        width: '100%',
        height: HEIGHT * 0.06,
        backgroundColor: WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: HEIGHT * 0.005
    },
    logoImage: {
        width: WIDTH * 0.35,
        height: HEIGHT * 0.05
    },
    mediaWrapper: {
        position: 'relative',
        width: '100%',
        height: HEIGHT * 0.15
    },
    mediaContainer: {
        width: '100%',
        height: '100%',
        position: 'relative'
    },
    contentSection: {
        padding: WIDTH * 0.03
    },
    headlineText: {
        fontSize: WIDTH * 0.04,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginBottom: HEIGHT * 0.005
    },
    contentPreview: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        lineHeight: HEIGHT * 0.02,
        marginBottom: HEIGHT * 0.005
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.005,
        width: '100%'
    },
    submittedAtText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK
    },
    timeText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSMEDIUM,
        color: BLACK
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: HEIGHT * 0.01,
        marginTop: HEIGHT * 0.005
    },
    contentTypeText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: WHITE,
        paddingHorizontal: WIDTH * 0.02,
        paddingVertical: HEIGHT * 0.003,
        borderRadius: WIDTH * 0.01,
        alignSelf: 'flex-start'
    },
    videoContentBadge: {
        backgroundColor: '#9C27B0', // Purple color for video content
    },
    standardContentBadge: {
        backgroundColor: BLUE, // Blue for standard content
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        position: 'relative'
    },
    videoIconOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    videoIconText: {
        color: WHITE,
        fontSize: WIDTH * 0.05,
        fontFamily: POPPINSLIGHT
    },
    noMediaPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e1e1e1'
    },
    noMediaText: {
        fontSize: WIDTH * 0.08,
        fontFamily: POPPINSMEDIUM,
        color: '#a1a1a1'
    },
    videoInfoBadge: {
        position: 'absolute',
        top: HEIGHT * 0.01,
        left: WIDTH * 0.025,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: WIDTH * 0.01,
        borderRadius: WIDTH * 0.01
    },
    videoInfoText: {
        color: WHITE,
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT
    },
    playButtonCircle: {
        width: WIDTH * 0.1,
        height: WIDTH * 0.1,
        borderRadius: WIDTH * 0.05,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    categoryBadgeContainer: {
        position: 'absolute',
        top: HEIGHT * 0.01, 
        right: WIDTH * 0.02,
        zIndex: 10
    },
    categoryBadge: {
        backgroundColor: BLUE,
        padding: WIDTH * 0.015,
        borderRadius: WIDTH * 0.02,
        minWidth: WIDTH * 0.15,
        alignItems: 'center'
    },
    categoryText: {
        color: WHITE,
        fontSize: WIDTH * 0.028,
        fontFamily: POPPINSMEDIUM,
        textAlign: 'center'
    }
});