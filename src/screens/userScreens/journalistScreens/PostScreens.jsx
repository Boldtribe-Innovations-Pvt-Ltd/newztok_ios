import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image, RefreshControl, ActivityIndicator, useWindowDimensions } from "react-native";
import { WHITE, BLUE, BLACK, GREY } from "../../../constants/color";
import { BASE_URL } from "../../../constants/url";
import { GETNETWORK } from "../../../utils/Network";
import { useFocusEffect } from '@react-navigation/native';
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getObjByKey, getStringByKey } from "../../../utils/Storage";
import RenderHtml from 'react-native-render-html';
import { HEIGHT, WIDTH } from "../../../constants/config";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../../constants/fontPath";
import Video from 'react-native-video';

// VideoPlayer component for handling video playback
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
            
            {/* Show loading or error overlay */}
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

export default PostScreens = ({ navigation }) => {
     // State for posts data and loading
     const [posts, setPosts] = useState([]);
     const [loading, setLoading] = useState(false);
     const [totalPosts, setTotalPosts] = useState(0);
     const [currentPage, setCurrentPage] = useState(1);
     const [totalPages, setTotalPages] = useState(1);
     const [refreshing, setRefreshing] = useState(false);
     const [toastMessage, setToastMessage] = useState({
         type: "",
         msg: "",
         visible: false
     });
 
     // Get window dimensions for HTML rendering
     const { width } = useWindowDimensions();
 
     // Fetch posts when the screen focuses
     useFocusEffect(
         React.useCallback(() => {
             fetchPostsData();
             return () => {};
         }, [])
     );
 
     const fetchPostsData = async () => {
         const url = `${BASE_URL}api/news/my-approved-news`;
         setLoading(true);
         
         // Debug log for BASE_URL
         console.log("BASE_URL value:", BASE_URL);

         try {
             // Properly retrieve the token using both methods for compatibility
             const loginResponse = await getObjByKey('loginResponse');
             let token = loginResponse?.data;
             
             // If not found as object, try string format
             if (!token) {
                 token = await getStringByKey('loginResponse');
             }
             
             console.log("Retrieved token:", token ? "Token found" : "No token"); 

             // Use the GETNETWORK utility with the token (providing true for authenticated request)
             const result = await GETNETWORK(url, true);
             console.log("API Response structure:", JSON.stringify(result));
             setLoading(false);
 
             if (result?.success) {
                 // Safely access the data property with fallbacks
                 const responseData = result.data || [];
                 
                 // Ensure we have an array to map over (handle both array and object responses)
                 const dataArray = Array.isArray(responseData) ? responseData : 
                                 responseData.news || responseData.data || [];
                 
                 if (Array.isArray(dataArray) && dataArray.length > 0) {
                     // Helper function to process URLs (images and videos)
                     const processUrl = (url) => {
                         if (!url) return null;
                         
                         console.log('Processing URL:', url);
                         
                         // If it's already a full URL (starts with http:// or https://)
                         if (url.startsWith('http://') || url.startsWith('https://')) {
                             return url;
                         }
                         
                         // For paths starting with '/uploads'
                         else if (url.startsWith('/uploads')) {
                             // Create the complete URL by joining BASE_URL with the path
                             // Remove any trailing slash from BASE_URL and leading slash from path
                             const baseUrlFormatted = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
                             return `${baseUrlFormatted}${url}`;
                         }
                         
                         // For other paths
                         return url;
                     };

                     // Map the API data to the format expected by our UI
                     const formattedPosts = dataArray.map(item => {
                         // Check for and extract videoPath from multiple possible fields
                         console.log('Checking video sources for item:', item.id);
                         if (item.videoPath) console.log('- videoPath found:', item.videoPath);
                         if (item.video_path) console.log('- video_path found:', item.video_path);
                         if (item.videoUrl) console.log('- videoUrl found:', item.videoUrl);
                         if (item.video_url) console.log('- video_url found:', item.video_url);
                         if (item.video) console.log('- video found:', item.video);
                         if (item.video_file) console.log('- video_file found:', item.video_file);
                         
                         // Extract and process videoPath
                         let videoPath = null;
                         if (item.videoPath) {
                             console.log('Found videoPath field:', item.videoPath);
                             videoPath = item.videoPath;
                         } else if (item.video_path) {
                             console.log('Found video_path field:', item.video_path);
                             videoPath = item.video_path;
                         } else if (item.video_url) {
                             console.log('Found video_url field:', item.video_url);
                             videoPath = item.video_url;
                         } else if (item.videoUrl) {
                             console.log('Found videoUrl field:', item.videoUrl);
                             videoPath = item.videoUrl;
                         } else if (item.video) {
                             console.log('Found video field:', item.video);
                             videoPath = item.video;
                         } else if (item.video_file) {
                             console.log('Found video_file field:', item.video_file);
                             videoPath = item.video_file;
                         }
                         
                         // If we found a video path, process it
                         if (videoPath) {
                             console.log(`Item ${item.id} has video path:`, videoPath);
                             videoPath = processUrl(videoPath);
                             console.log(`Processed video path:`, videoPath);
                         }
                         
                         // Process featured image
                         let featuredImage = null;
                         if (item.featured_image) {
                             featuredImage = processUrl(item.featured_image);
                         } else if (item.featuredImage) {
                             featuredImage = processUrl(item.featuredImage);
                         }
                         
                         // Determine content type based on available media
                         const isVideo = Boolean(videoPath || item.video_link || item.videoLink);
                         const contentType = isVideo ? "video" : "standard";
                         
                         return {
                             id: item.id || Math.random().toString(),
                             headline: item.title || item.headline || "Untitled",
                             content: item.content || item.description || "",
                             category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Uncategorized", 
                             submittedBy: "Journalist",
                             submittedAt: item.submitted_at || item.createdAt || item.created_at,
                             submittedDate: formatDate(item.submitted_at || item.createdAt || item.created_at).date,
                             submittedTime: formatDate(item.submitted_at || item.createdAt || item.created_at).time,
                             approvedAt: item.approved_at ? formatDate(item.approved_at).date : '',
                             featured: item.featured || false,
                             approved: item.approved || false,
                             status: item.status || (item.approved ? "approved" : "pending"),
                             featured_image: featuredImage,
                             video_link: item.video_link || item.videoLink,
                             post_type: item.post_type || item.postType || contentType,
                             videoPath: videoPath,
                             contentType: contentType
                         };
                     });
                     
                     // Count posts with videos
                     const videosCount = formattedPosts.filter(item => item.videoPath).length;
                     console.log(`Total posts with videos: ${videosCount} out of ${formattedPosts.length}`);
                     
                     // Filter to show only approved posts
                     const approvedPosts = formattedPosts.filter(post => post.status === "approved");
                     
                     // Sort posts with newest first based on submission timestamp
                     const sortedPosts = approvedPosts.sort((a, b) => {
                         const dateA = new Date(a.submittedAt);
                         const dateB = new Date(b.submittedAt);
                         return dateB - dateA; // Newest first
                     });
                     
                     setPosts(sortedPosts);
                     setTotalPosts(sortedPosts.length);
                 } else {
                     // Handle empty data case
                     setPosts([]);
                     setTotalPosts(0);
                     console.log("No posts data found in response");
                 }
             } else {
                 // Handle API error
                 setPosts([]);
                 setTotalPosts(0);
                 setToastMessage({
                     type: "error",
                     msg: result?.message || "Failed to fetch posts",
                     visible: true
                 });
             }
         } catch (error) {
             console.error("API Error:", error);
             setLoading(false);
             setPosts([]);
             setTotalPosts(0);
             setToastMessage({
                 type: "error",
                 msg: "Network error occurred",
                 visible: true
             });
         }
     };
 
     // Helper function to format API date strings
     const formatDate = (dateString) => {
         try {
             const date = new Date(dateString);
             const now = new Date();
             
             // Check if the date is valid
             if (isNaN(date.getTime())) {
                 return { date: 'Unknown date', time: '' };
             }
             
             // Format time in 12-hour format with AM/PM
             const hours = date.getHours();
             const minutes = String(date.getMinutes()).padStart(2, '0');
             const ampm = hours >= 12 ? 'PM' : 'AM';
             const formattedHours = hours % 12 || 12; // Convert 24h to 12h format
             const formattedTime = `${formattedHours}:${minutes} ${ampm}`;
             
             // Calculate days difference
             const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
             
             let formattedDate;
             
             // Use relative dates for the last 3 days
             if (daysDiff === 0 && 
                 date.getDate() === now.getDate() && 
                 date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear()) {
                 formattedDate = 'Today';
             } else if (daysDiff === 1 || 
                       (daysDiff === 0 && 
                        (date.getDate() !== now.getDate() || 
                         date.getMonth() !== now.getMonth() || 
                         date.getFullYear() !== now.getFullYear()))) {
                 formattedDate = 'Yesterday';
             } else if (daysDiff === 2) {
                 formattedDate = '2 days ago';
             } else if (daysDiff === 3) {
                 formattedDate = '3 days ago';
             } else {
                 // Format as regular date for older posts
                 formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
             }
             
             return { date: formattedDate, time: formattedTime };
         } catch (e) {
             return { date: dateString || 'Unknown date', time: '' };
         }
     };
 
     // Helper function to get video thumbnail from YouTube links
     const getYouTubeThumbnail = (videoLink) => {
         const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
         const match = videoLink.match(youtubeRegex);
         
         if (match && match[1]) {
             // Return YouTube thumbnail URL using the video ID
             return `https://img.youtube.com/vi/${match[1]}/0.jpg`;
         }
         
         return null;
     };
 
     const onRefresh = () => {
         setRefreshing(true);
         fetchPostsData();
         setRefreshing(false);
     };
 
     const handleAddNewPost = () => {
         try {
             // Navigate to the Add Post screen defined in JournalistBottomTabNavigation
             if (navigation) {
                 navigation.navigate("Add Post");
                 // Show success message when navigation is triggered
                 setToastMessage({
                     type: "success",
                     msg: "Opening post editor...",
                     visible: true
                 });
             } else {
                 console.error("Navigation prop is not available");
                 setToastMessage({
                     type: "error",
                     msg: "Cannot open post editor at this time",
                     visible: true
                 });
             }
         } catch (error) {
             console.error("Navigation error:", error);
             setToastMessage({
                 type: "error",
                 msg: "Error opening post editor",
                 visible: true
             });
         }
     };
 
     const renderPostItem = ({ item }) => {
         // Determine image source for card header
         let hasMedia = false;
         let imageSource = null;
         let resizeMode = "cover";
         
         // Log full item for debugging
         console.log(`Post ${item.id} media data:`, { 
             featured_image: item.featured_image,
             featuredImage: item.featuredImage,
             videoPath: item.videoPath,
             video_link: item.video_link
         });
         
         // Check if item has a direct video path to use with VideoPlayer
         const hasVideoPath = Boolean(item.videoPath);
         
         // Handle standard image content
         if (item.featured_image && !hasVideoPath) {
             // We only use the image if there's no video - video takes precedence
             const imagePath = item.featured_image;
             imageSource = { uri: imagePath };
             hasMedia = true;
         } else if (item.featuredImage && !hasVideoPath) {
             // Alternative property name for featured image
             const imagePath = item.featuredImage;
             imageSource = { uri: imagePath };
             hasMedia = true;
         } else if (item.video_link && !hasVideoPath) {
             // Use video thumbnail if available and no direct video path
             const thumbnailUrl = getYouTubeThumbnail(item.video_link);
             if (thumbnailUrl) {
                 imageSource = { uri: thumbnailUrl };
                 hasMedia = true;
             }
         }
         
         // Determine card border color based on status
         let cardStyle = [styles.card];
         
         if (item.featured) {
             cardStyle.push(styles.featuredCard);
         } else {
             // Apply status-based border color if not featured
             if (item.status === "approved") {
                 cardStyle.push(styles.approvedCard);
             }
         }
         
         return (
             <View style={cardStyle}>
                 {/* Card Header with Media */}
                 <View style={styles.cardHeader}>
                     {hasVideoPath ? (
                         // Render video player for direct video paths
                         <VideoPlayer videoPath={item.videoPath} />
                     ) : hasMedia ? (
                         <Image 
                             source={imageSource} 
                             style={styles.mediaImage}
                             resizeMode={resizeMode}
                             onError={(error) => {
                                 console.error("Image loading error:", error.nativeEvent.error);
                                 console.log("Failed image source:", imageSource);
                             }}
                         />
                     ) : (
                         <View style={styles.placeholderContainer}>
                             <Text style={styles.placeholderText}>{item.headline.charAt(0).toUpperCase()}</Text>
                         </View>
                     )}
                     
                     {item.video_link && !hasVideoPath && (
                         <View style={styles.videoIndicator}>
                             <Text style={styles.videoIndicatorText}>▶</Text>
                         </View>
                     )}
                 </View>
                 
                 {/* Card Body */}
                 <View style={styles.cardBody}>
                     <View style={styles.headlineContainer}>
                         <Text style={styles.headlineText} numberOfLines={2}>{item.headline}</Text>
                     </View>
                     <View style={styles.categoryContainer}>
                         <Text style={styles.categoryText}>{item.category}</Text>
                         {hasVideoPath && (
                             <View style={styles.videoTypeBadge}>
                                 <Text style={styles.videoTypeText}>Video</Text>
                             </View>
                         )}
                     </View>
                 </View>
                 
                 {/* Card Footer */}
                 <View style={styles.cardFooter}>
                     <View style={styles.submittedByContainer}>
                         <View>
                             <View style={styles.submitterRow}>
                                 <Text style={styles.submittedByLabel}>Submitted by: </Text>
                                 <Text style={styles.submittedByValue}>{item.submittedBy}</Text>
                             </View>
                             <View style={styles.dateTimeRow}>
                                 <Text style={styles.submittedDateText}>{item.submittedDate} {item.submittedTime}</Text>
                             </View>
                         </View>
                     </View>
                 </View>
             </View>
         );
     };
 
     return(
         <>
             <MyHeader
                 showBackButton={false}
                 showSettings={false}
                 showLocationDropdown={false}
                 showText={false}
             />
             <View style={styles.container}>
                 {/* Add New Post Button */}
                 <View style={styles.topButtonContainer}>
                     <TouchableOpacity 
                         style={styles.addButton}
                         onPress={handleAddNewPost}
                         activeOpacity={0.7}
                     >
                         <Text style={styles.addButtonText}>+ Add new Post</Text>
                     </TouchableOpacity>
                     <Text style={styles.postCountText}>({totalPosts})</Text>
                 </View>
 
                 {/* Post List */}
                 {loading ? (
                     <View style={styles.loaderContainer}>
                         <ActivityIndicator size="large" color={BLUE} />
                     </View>
                 ) : (
                     <FlatList
                         data={posts}
                         renderItem={renderPostItem}
                         keyExtractor={item => item.id?.toString() || Math.random().toString()}
                         contentContainerStyle={styles.listContainer}
                         refreshControl={
                             <RefreshControl
                                 refreshing={refreshing}
                                 onRefresh={onRefresh}
                             />
                         }
                         ListEmptyComponent={() => (
                             <View style={styles.emptyContainer}>
                                 <Text style={styles.emptyText}>No approved posts found</Text>
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
     topButtonContainer: {
         flexDirection: 'row',
         alignItems: 'center',
         marginBottom: HEIGHT * 0.02
     },
     addButton: {
         backgroundColor: BLUE,
         paddingVertical: HEIGHT * 0.008,
         paddingHorizontal: WIDTH * 0.04,
         borderRadius: WIDTH * 0.01
     },
     addButtonText: {
         color: WHITE,
         fontWeight: '500',
         fontSize: WIDTH * 0.035,
         fontFamily: POPPINSMEDIUM
     },
     postCountText: {
         fontSize: WIDTH * 0.04,
         color: BLACK,
         marginLeft: WIDTH * 0.02,
         fontFamily: POPPINSMEDIUM
     },
     listContainer: {
         paddingBottom: HEIGHT * 0.02
     },
     loaderContainer: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center'
     },
     card: {
         backgroundColor: WHITE,
         borderRadius: WIDTH * 0.025,
         marginVertical: HEIGHT * 0.01,
         shadowColor: BLACK,
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.1,
         shadowRadius: 4,
         elevation: 2,
         borderWidth: 1,
         borderColor: GREY,
         width: '92%',
         alignSelf: 'center'
     },
     featuredCard: {
         borderColor: 'gold',
         borderWidth: 1,
     },
     approvedCard: {
         borderColor: 'green',
         borderWidth: 1,
     },
     cardHeader: {
         position: 'relative',
         width: '100%',
         height: HEIGHT * 0.15,
         borderBottomWidth: 1,
         borderBottomColor: '#eee',
         overflow: 'hidden',
         borderTopLeftRadius: WIDTH * 0.02,
         borderTopRightRadius: WIDTH * 0.02
     },
     mediaImage: {
         width: '100%',
         height: '100%',
     },
     placeholderContainer: {
         width: '100%',
         height: '100%',
         backgroundColor: '#e0e0e0',
         justifyContent: 'center',
         alignItems: 'center'
     },
     placeholderText: {
         fontSize: WIDTH * 0.08,
         color: GREY,
         fontFamily: POPPINSMEDIUM
     },
     videoIndicator: {
         position: 'absolute',
         left: '50%',
         top: '50%',
         marginLeft: -WIDTH * 0.04,
         marginTop: -WIDTH * 0.04,
         backgroundColor: 'rgba(0,0,0,0.5)',
         width: WIDTH * 0.08,
         height: WIDTH * 0.08,
         borderRadius: WIDTH * 0.04,
         justifyContent: 'center',
         alignItems: 'center'
     },
     videoIndicatorText: {
         fontSize: WIDTH * 0.035,
         color: WHITE,
         marginLeft: WIDTH * 0.005 // Slight offset for the play triangle
     },
     cardBody: {
         flexDirection: 'row',
         padding: WIDTH * 0.03,
         borderBottomWidth: 1,
         borderBottomColor: '#eee'
     },
     headlineContainer: {
         flex: 2,
         paddingRight: WIDTH * 0.03
     },
     headlineText: {
         fontSize: WIDTH * 0.035,
         color: BLACK,
         fontFamily: POPPINSMEDIUM
     },
     categoryContainer: {
         flex: 1,
         alignItems: 'flex-end',
         justifyContent: 'center'
     },
     categoryText: {
         fontSize: WIDTH * 0.028,
         color: BLACK,
         fontFamily: POPPINSMEDIUM
     },
     cardFooter: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         alignItems: 'center',
         padding: WIDTH * 0.03
     },
     submittedByContainer: {
         flex: 1,
     },
     submitterRow: {
         flexDirection: 'row',
         alignItems: 'center',
     },
     submittedByLabel: {
         fontSize: WIDTH * 0.03,
         color: BLACK,
         fontFamily: POPPINSLIGHT
     },
     submittedByValue: {
         fontSize: WIDTH * 0.03,
         color: BLACK,
         fontFamily: POPPINSLIGHT
     },
     dateTimeRow: {
         flexDirection: 'row',
         alignItems: 'center',
         marginTop: HEIGHT * 0.004
     },
     submittedDateText: {
         fontSize: WIDTH * 0.03,
         color: BLACK,
         fontFamily: POPPINSLIGHT
     },
     emptyContainer: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center',
         paddingVertical: HEIGHT * 0.05
     },
     emptyText: {
         fontSize: WIDTH * 0.035,
         color: GREY,
         fontFamily: POPPINSMEDIUM
     },
     contentContainer: {
         marginTop: HEIGHT * 0.01,
         marginBottom: HEIGHT * 0.01
     },
     videoTypeBadge: {
         backgroundColor: BLUE,
         paddingHorizontal: WIDTH * 0.01,
         paddingVertical: HEIGHT * 0.004,
         borderRadius: WIDTH * 0.005,
         marginTop: HEIGHT * 0.005
     },
     videoTypeText: {
         fontSize: WIDTH * 0.02,
         color: WHITE,
         fontFamily: POPPINSMEDIUM
     },
     
     // VideoPlayer styles
     videoWrapper: {
         width: '100%',
         height: '100%',
         position: 'relative',
         backgroundColor: '#000',
         borderRadius: WIDTH * 0.01,
     },
     backgroundVideo: {
         position: 'absolute',
         top: 0,
         left: 0,
         bottom: 0,
         right: 0,
         backgroundColor: '#000',
     },
     videoPlaceholder: {
         backgroundColor: '#e1e1e1',
         justifyContent: 'center',
         alignItems: 'center',
     },
     videoErrorText: {
         fontSize: WIDTH * 0.04,
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
         fontFamily: POPPINSLIGHT,
         color: WHITE,
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
     },
     playButtonCircle: {
         width: WIDTH * 0.13,
         height: WIDTH * 0.13,
         borderRadius: WIDTH * 0.065,
         backgroundColor: 'rgba(255,255,255,0.7)',
         justifyContent: 'center',
         alignItems: 'center',
     },
     playButtonText: {
         fontSize: WIDTH * 0.06,
         color: BLACK,
         marginLeft: WIDTH * 0.01, // Slight offset for the play triangle
     },
 });