// import React, { useState, useEffect } from 'react';
// import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
// import { WHITE, BLUE, GREY, BLACK, RED } from "../../../constants/color";
// import { MyStatusBar } from "../../../components/commonComponents/MyStatusBar";
// import { GETNETWORK } from "../../../utils/Network";
// import { BASE_URL } from "../../../constants/url";
// import { getObjByKey, getStringByKey } from "../../../utils/Storage";
// import YoutubeIframe from "react-native-youtube-iframe";
// import { EDIT } from "../../../constants/imagePath";
// import { HEIGHT, WIDTH } from "../../../constants/config";
// import { POPPINSLIGHT, POPPINSMEDIUM } from "../../../constants/fontPath";
// import { MyLoader } from "../../../components/commonComponents/MyLoader";
// import * as ImagePicker from 'react-native-image-picker';

// export default PendingPostScreen = () => {
//     const [pendingPosts, setPendingPosts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [selectedVideoId, setSelectedVideoId] = useState(null);
    
//     // State for edit modal
//     const [editModalVisible, setEditModalVisible] = useState(false);
//     const [selectedPost, setSelectedPost] = useState(null);
//     const [editTitle, setEditTitle] = useState('');
//     const [editContent, setEditContent] = useState('');
//     const [editCategory, setEditCategory] = useState('');
//     const [editCategoryId, setEditCategoryId] = useState(null);
//     const [editFeaturedImage, setEditFeaturedImage] = useState('No file selected');
//     const [editImageBase64, setEditImageBase64] = useState(null);
//     const [editLoading, setEditLoading] = useState(false);
//     const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

//     const categories = [
//         { id: '1', name: 'ट्रेंडिंग | Trending', value: 'trending' },
//         { id: '2', name: 'राष्ट्रीय | National', value: 'national' },
//         { id: '3', name: 'अंतरराष्ट्रीय | International', value: 'international' },
//         { id: '4', name: 'खेल | Sports', value: 'sports' },
//         { id: '5', name: 'मनोरंजन | Entertainment', value: 'entertainment' },
//     ];

//     useEffect(() => {
//         fetchPendingPosts();
//     }, []);

//     const fetchPendingPosts = async () => {
//         try {
//             setLoading(true);
//             // Retrieve token using both methods for compatibility
//             const loginResponse = await getObjByKey('loginResponse');
//             let token = loginResponse?.data;
            
//             // If not found as object, try string format
//             if (!token) {
//                 token = await getStringByKey('loginResponse');
//             }
            
//             if (!token) {
//                 setError("Authentication token not found. Please login again.");
//                 setLoading(false);
//                 return;
//             }
            
//             // Make authenticated request to fetch pending posts
//             const response = await GETNETWORK(`${BASE_URL}news/my-pending-news`, true);
            
//             if (response.success) {
//                 setPendingPosts(response.data);
//             } else {
//                 setError(response.message || "Failed to fetch pending posts");
//             }
//         } catch (error) {
//             console.error("Error fetching pending posts:", error);
//             setError("An unexpected error occurred");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Extract YouTube video ID from URL
//     const extractYoutubeId = (url) => {
//         if (!url) return null;
        
//         try {
//             // Clean the URL
//             url = url.trim();
            
//             // Standard YouTube URL patterns
//             const standardRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
//             const standardMatch = url.match(standardRegExp);
            
//             if (standardMatch && standardMatch[7] && standardMatch[7].length === 11) {
//                 return standardMatch[7];
//             }
        
//             // Short URL pattern (youtu.be)
//             const shortRegExp = /^https?:\/\/youtu\.be\/([^?#&]*)/;
//             const shortMatch = url.match(shortRegExp);
            
//             if (shortMatch && shortMatch[1] && shortMatch[1].length === 11) {
//                 return shortMatch[1];
//             }
            
//             return null;
//         } catch (error) {
//             console.error("Error extracting YouTube ID:", error);
//             return null;
//         }
//     };

//     const renderMediaContent = (item) => {
//         // Determine content type
//         const hasImage = !!item.featuredImage;
//         const youtubeId = item.youtubeUrl ? extractYoutubeId(item.youtubeUrl) : null;
//         const hasVideo = !!(youtubeId || item.videoUrl);
//         const isPlayingYoutube = selectedVideoId === youtubeId;
        
//         if (youtubeId && isPlayingYoutube) {
//             return (
//                 <View style={styles.videoPlayerContainer}>
//                     <YoutubeIframe
//                         height={HEIGHT * 0.2}
//                         videoId={youtubeId}
//                         allowFullscreen={true}
//                         onChangeState={(event) => {
//                             if (event === "ended") {
//                                 setSelectedVideoId(null);
//                             }
//                         }}
//                     />
//                 </View>
//             );
//         } else if (youtubeId) {
//             // YouTube thumbnail with play button
//             const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
//             return (
//                 <TouchableOpacity 
//                     style={styles.thumbnailContainer} 
//                     onPress={() => setSelectedVideoId(youtubeId)}
//                 >
//                     <Image 
//                         source={{ uri: thumbnailUrl }} 
//                         style={styles.featuredImage}
//                         resizeMode="cover"
//                     />
//                     <View style={styles.videoInfoBadge}>
//                         <Text style={styles.videoInfoText}>YouTube</Text>
//                     </View>
//                     <View style={styles.videoIconOverlay}>
//                         <View style={styles.playButtonCircle}>
//                             <Text style={styles.videoIconText}>▶</Text>
//                         </View>
//                     </View>
//                 </TouchableOpacity>
//             );
//         } else if (item.videoUrl) {
//             // Video file placeholder with play button
//             return (
//                 <View style={[styles.featuredImage, styles.videoPlaceholder]}>
//                     <Text style={[styles.videoPlaceholderText, {fontFamily: POPPINSLIGHT}]}>📹 Video Content</Text>
//                     <View style={styles.playButtonCircle}>
//                         <Text style={styles.videoIconText}>▶</Text>
//                     </View>
//                 </View>
//             );
//         } else if (hasImage) {
//             // Standard image content
//             return (
//                 <Image 
//                     source={{ uri: item.featuredImage }} 
//                     style={styles.featuredImage}
//                     resizeMode="cover"
//                 />
//             );
//         } else {
//             // Text content placeholder
//             return (
//                 <View style={[styles.featuredImage, styles.textPlaceholder]}>
//                     <Text style={[styles.textPlaceholderText, {fontFamily: POPPINSLIGHT}]}>📝 Text Content</Text>
//                 </View>
//             );
//         }
//     };

//     const handleChooseFile = () => {
//         const options = {
//             mediaType: 'photo',
//             includeBase64: true,
//             maxHeight: 800,
//             maxWidth: 800,
//             quality: 0.5,
//             compressImageQuality: 0.5,
//         };

//         ImagePicker.launchImageLibrary(options, (response) => {
//             if (response.didCancel) {
//                 console.log('User cancelled image picker');
//             } else if (response.error) {
//                 console.log('ImagePicker Error: ', response.error);
//             } else {
//                 // Get the selected asset
//                 const asset = response.assets[0];
//                 setEditFeaturedImage(asset.fileName || 'image.jpg');
                
//                 // Store base64 data
//                 if (asset.base64) {
//                     setEditImageBase64(asset.base64);
//                 } else {
//                     setEditImageBase64(null);
//                 }
//             }
//         });
//     };

//     const toggleCategoryDropdown = () => {
//         setShowCategoryDropdown(!showCategoryDropdown);
//     };

//     const selectCategory = (category) => {
//         setEditCategory(category.name);
//         setEditCategoryId(category.value);
//         setShowCategoryDropdown(false);
//     };

//     const handleEditPress = (item) => {
//         setSelectedPost(item);
//         setEditTitle(item.title);
//         setEditContent(item.content);
        
//         // Find the category from our list
//         const foundCategory = categories.find(cat => cat.value === item.category);
//         setEditCategory(foundCategory ? foundCategory.name : '---------');
//         setEditCategoryId(item.category);
        
//         // Set image data if available
//         if (item.featuredImage) {
//             setEditFeaturedImage('Current image');
//         } else {
//             setEditFeaturedImage('No file selected');
//         }
        
//         setEditModalVisible(true);
//     };

//     const handleUpdatePost = () => {
//         // Implement your update logic here
//         console.log("Update post:", selectedPost.id);
//         console.log("New title:", editTitle);
//         console.log("New content:", editContent);
//         console.log("New category:", editCategoryId);
        
//         // Close modal
//         setEditModalVisible(false);
//     };

//     const renderPost = ({ item }) => {
//         // Only render if required fields are present
//         if (!item.title || !item.content || !item.category) {
//             return null;
//         }

//         // Determine content type
//         const youtubeId = item.youtubeUrl ? extractYoutubeId(item.youtubeUrl) : null;
//         const hasImage = !!item.featuredImage;
//         const hasVideo = !!(youtubeId || item.videoUrl);
        
//         let contentType;
//         if (youtubeId) {
//             contentType = 'YouTube Content';
//         } else if (item.videoUrl) {
//             contentType = 'Video Content';
//         } else if (hasImage) {
//             contentType = 'Standard Content';
//         } else {
//             contentType = 'Text Content';
//         }

//         return (
//             <View style={styles.postCard}>
//                 {renderMediaContent(item)}
//                 <View style={styles.postContent}>
//                     <Text style={styles.postTitle}>{item.title}</Text>
//                     <Text style={styles.postExcerpt} numberOfLines={3}>
//                         {item.content}
//                     </Text>
//                     <Text style={styles.submittedByText}>Submitted at: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}</Text>
                    
//                     <View style={styles.cardFooter}>
//                         <Text style={styles.contentTypeLabel}>{contentType}</Text>
//                         <TouchableOpacity 
//                             style={styles.editButton}
//                             onPress={() => handleEditPress(item)}
//                         >
//                             <Image source={EDIT} style={styles.editIcon} />
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </View>
//         );
//     };

//     if (loading) {
//         return (
//             <View style={styles.centerContainer}>
//                 <MyLoader visible={loading} />
//             </View>
//         );
//     }

//     if (error) {
//         return (
//             <View style={styles.centerContainer}>
//                 <Text style={styles.errorText}>{error}</Text>
//             </View>
//         );
//     }

//     return (
//         <>
//             <MyStatusBar backgroundColor={WHITE} />
//             <View style={styles.container}>
//                 <Text style={styles.headerTitle}>Pending Posts</Text>
//                 <FlatList
//                     data={pendingPosts}
//                     renderItem={renderPost}
//                     keyExtractor={(item) => item.id.toString()}
//                     contentContainerStyle={styles.listContainer}
//                     ListEmptyComponent={
//                         <Text style={styles.emptyText}>No pending posts found</Text>
//                     }
//                 />
//             </View>

//             {/* Edit Post Modal */}
//             <Modal
//                 visible={editModalVisible}
//                 animationType="slide"
//                 transparent={false}
//                 onRequestClose={() => setEditModalVisible(false)}
//             >
//                 <ScrollView>
//                     <View style={styles.modalContainer}>
//                         <Text style={styles.modalTitle}>Edit Post</Text>
                        
//                         {/* Post Title/Headline */}
//                         <Text style={styles.sectionTitle}>Post Title/Headline</Text>
//                         <TextInput
//                             style={styles.titleInput}
//                             placeholder="Write title here..."
//                             value={editTitle}
//                             onChangeText={setEditTitle}
//                             placeholderTextColor={GREY}
//                         />

//                         {/* Featured Image */}
//                         <Text style={styles.sectionTitle}>Featured Image</Text>
//                         <View style={styles.fileSelectionContainer}>
//                             <TouchableOpacity 
//                                 style={styles.chooseFileButton}
//                                 onPress={handleChooseFile}
//                             >
//                                 <Text style={styles.chooseFileText}>Choose File</Text>
//                             </TouchableOpacity>
//                             <Text style={styles.fileSelectedText}>{editFeaturedImage}</Text>
//                         </View>

//                         {/* Content */}
//                         <Text style={styles.sectionTitle}>Content</Text>
//                         <TextInput
//                             style={styles.contentEditor}
//                             placeholder="Write your content here..."
//                             multiline={true}
//                             numberOfLines={10}
//                             value={editContent}
//                             onChangeText={setEditContent}
//                         />

//                         {/* Category Section */}
//                         <Text style={styles.sectionTitle}>Category</Text>
//                         <TouchableOpacity 
//                             style={styles.categoryDropdown}
//                             onPress={toggleCategoryDropdown}
//                         >
//                             <Text style={styles.categoryText}>{editCategory}</Text>
//                             <Text>▼</Text>
//                         </TouchableOpacity>
                        
//                         {/* Category Dropdown Modal */}
//                         <Modal
//                             visible={showCategoryDropdown}
//                             transparent={true}
//                             animationType="fade"
//                             onRequestClose={() => setShowCategoryDropdown(false)}
//                         >
//                             <TouchableOpacity 
//                                 style={styles.modalOverlay} 
//                                 activeOpacity={1} 
//                                 onPress={() => setShowCategoryDropdown(false)}
//                             >
//                                 <View style={styles.dropdownContainer}>
//                                     <View style={styles.dropdownHeader}>
//                                         <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
//                                             <Text style={styles.checkmark}>✓</Text>
//                                         </TouchableOpacity>
//                                         <Text style={styles.dropdownHeaderText}>Select a category</Text>
//                                     </View>
//                                     <FlatList
//                                         data={categories}
//                                         keyExtractor={(item) => item.id}
//                                         renderItem={({ item }) => (
//                                             <TouchableOpacity 
//                                                 style={styles.dropdownItem}
//                                                 onPress={() => selectCategory(item)}
//                                             >
//                                                 <Text style={styles.dropdownItemText}>{item.name}</Text>
//                                             </TouchableOpacity>
//                                         )}
//                                     />
//                                 </View>
//                             </TouchableOpacity>
//                         </Modal>

//                         {/* Action Buttons */}
//                         <View style={styles.actionButtonsContainer}>
//                             <TouchableOpacity 
//                                 style={styles.cancelButton}
//                                 onPress={() => setEditModalVisible(false)}
//                             >
//                                 <Text style={styles.cancelButtonText}>Cancel</Text>
//                             </TouchableOpacity>
                            
//                             <TouchableOpacity 
//                                 style={styles.updateButton}
//                                 onPress={handleUpdatePost}
//                                 disabled={editLoading}
//                             >
//                                 {editLoading ? (
//                                     <ActivityIndicator size="small" color={WHITE} />
//                                 ) : (
//                                     <Text style={styles.updateButtonText}>Update Post</Text>
//                                 )}
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </ScrollView>
//             </Modal>
//         </>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: WHITE,
//         padding: WIDTH * 0.04
//     },
//     centerContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: WHITE
//     },
//     headerTitle: {
//         fontSize: WIDTH * 0.06,
//         fontFamily: POPPINSMEDIUM,
//         marginBottom: HEIGHT * 0.025,
//         color: BLACK
//     },
//     listContainer: {
//         flexGrow: 1
//     },
//     postCard: {
//         backgroundColor: WHITE,
//         borderRadius: WIDTH * 0.02,
//         marginBottom: HEIGHT * 0.02,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//         width: '100%'
//     },
//     featuredImage: {
//         width: '100%',
//         height: HEIGHT * 0.2,
//         borderTopLeftRadius: WIDTH * 0.02,
//         borderTopRightRadius: WIDTH * 0.02
//     },
//     thumbnailContainer: {
//         position: 'relative',
//         width: '100%',
//         height: HEIGHT * 0.2
//     },
//     videoPlayerContainer: {
//         width: '100%',
//         height: HEIGHT * 0.2,
//         borderTopLeftRadius: WIDTH * 0.02,
//         borderTopRightRadius: WIDTH * 0.02,
//         backgroundColor: '#000'
//     },
//     videoIconOverlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     playButtonCircle: {
//         width: WIDTH * 0.12,
//         height: WIDTH * 0.12,
//         borderRadius: WIDTH * 0.06,
//         backgroundColor: 'rgba(0, 0, 0, 0.7)',
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     videoIconText: {
//         color: WHITE,
//         fontSize: WIDTH * 0.05,
//         marginLeft: WIDTH * 0.01
//     },
//     videoInfoBadge: {
//         position: 'absolute',
//         top: HEIGHT * 0.012,
//         right: WIDTH * 0.025,
//         backgroundColor: 'rgba(255, 0, 0, 0.8)',
//         paddingHorizontal: WIDTH * 0.02,
//         paddingVertical: HEIGHT * 0.005,
//         borderRadius: WIDTH * 0.01
//     },
//     videoInfoText: {
//         color: WHITE,
//         fontSize: WIDTH * 0.03,
//         fontFamily: POPPINSLIGHT
//     },
//     postContent: {
//         padding: WIDTH * 0.04
//     },
//     postTitle: {
//         fontSize: WIDTH * 0.045,
//         fontFamily: POPPINSMEDIUM,
//         marginBottom: HEIGHT * 0.01,
//         color: BLACK
//     },
//     postExcerpt: {
//         fontSize: WIDTH * 0.035,
//         color: BLACK,
//         marginBottom: HEIGHT * 0.01,
//         fontFamily: POPPINSLIGHT
//     },
//     submittedByText: {
//         color: GREY,
//         fontSize: WIDTH * 0.035,
//         fontFamily: POPPINSLIGHT,
//         marginBottom: HEIGHT * 0.01
//     },
//     cardFooter: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginTop: HEIGHT * 0.01
//     },
//     contentTypeLabel: {
//         color: BLUE,
//         fontSize: WIDTH * 0.035,
//         fontFamily: POPPINSLIGHT
//     },
//     editButton: {
//         padding: WIDTH * 0.01
//     },
//     editIcon: {
//         width: WIDTH * 0.06,
//         height: WIDTH * 0.06,
//         resizeMode: 'contain'
//     },
//     emptyText: {
//         textAlign: 'center',
//         color: GREY,
//         fontSize: WIDTH * 0.04,
//         marginTop: HEIGHT * 0.025,
//         fontFamily: POPPINSLIGHT
//     },
//     errorText: {
//         color: RED,
//         fontSize: WIDTH * 0.04,
//         textAlign: 'center',
//         fontFamily: POPPINSLIGHT
//     },
//     videoPlaceholder: {
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#3a3a3a',
//         borderTopLeftRadius: WIDTH * 0.02,
//         borderTopRightRadius: WIDTH * 0.02
//     },
//     videoPlaceholderText: {
//         color: WHITE,
//         fontSize: WIDTH * 0.045,
//         textAlign: 'center',
//         padding: WIDTH * 0.05
//     },
//     textPlaceholder: {
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#4a639b',
//         borderTopLeftRadius: WIDTH * 0.02,
//         borderTopRightRadius: WIDTH * 0.02
//     },
//     textPlaceholderText: {
//         color: WHITE,
//         fontSize: WIDTH * 0.045,
//         textAlign: 'center',
//         padding: WIDTH * 0.05
//     },
    
//     // Modal styles
//     modalContainer: {
//         padding: WIDTH * 0.04,
//         backgroundColor: WHITE
//     },
//     modalTitle: {
//         fontSize: WIDTH * 0.06,
//         fontFamily: POPPINSMEDIUM,
//         marginBottom: HEIGHT * 0.025,
//         color: BLACK
//     },
//     sectionTitle: {
//         fontSize: WIDTH * 0.045,
//         fontFamily: POPPINSMEDIUM,
//         marginTop: HEIGHT * 0.02,
//         marginBottom: HEIGHT * 0.01,
//         color: BLACK
//     },
//     titleInput: {
//         borderWidth: 1,
//         borderColor: GREY,
//         borderRadius: WIDTH * 0.01,
//         padding: WIDTH * 0.03,
//         fontSize: WIDTH * 0.04,
//         fontFamily: POPPINSLIGHT
//     },
//     fileSelectionContainer: {
//         flexDirection: 'row',
//         borderWidth: 1,
//         borderColor: GREY,
//         borderRadius: WIDTH * 0.01,
//         overflow: 'hidden'
//     },
//     chooseFileButton: {
//         backgroundColor: '#f0f0f0',
//         padding: WIDTH * 0.03,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderRightWidth: 1,
//         borderRightColor: GREY
//     },
//     chooseFileText: {
//         fontSize: WIDTH * 0.04,
//         fontFamily: POPPINSLIGHT
//     },
//     fileSelectedText: {
//         padding: WIDTH * 0.03,
//         fontSize: WIDTH * 0.04,
//         color: GREY,
//         fontFamily: POPPINSLIGHT
//     },
//     contentEditor: {
//         borderWidth: 1,
//         borderColor: GREY,
//         borderRadius: WIDTH * 0.01,
//         padding: WIDTH * 0.03,
//         minHeight: HEIGHT * 0.2,
//         textAlignVertical: 'top',
//         fontSize: WIDTH * 0.04,
//         fontFamily: POPPINSLIGHT
//     },
//     categoryDropdown: {
//         borderWidth: 1,
//         borderColor: GREY,
//         borderRadius: WIDTH * 0.01,
//         padding: WIDTH * 0.03,
//         flexDirection: 'row',
//         justifyContent: 'space-between'
//     },
//     categoryText: {
//         fontSize: WIDTH * 0.04,
//         fontFamily: POPPINSLIGHT
//     },
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     dropdownContainer: {
//         width: '80%',
//         backgroundColor: '#464646',
//         borderRadius: WIDTH * 0.01,
//         overflow: 'hidden'
//     },
//     dropdownHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: WIDTH * 0.04,
//         borderBottomWidth: 1,
//         borderBottomColor: '#555'
//     },
//     checkmark: {
//         fontSize: WIDTH * 0.045,
//         color: WHITE,
//         marginRight: WIDTH * 0.02
//     },
//     dropdownHeaderText: {
//         fontSize: WIDTH * 0.04,
//         color: WHITE,
//         fontFamily: POPPINSLIGHT
//     },
//     dropdownItem: {
//         padding: WIDTH * 0.04,
//         borderBottomWidth: 1,
//         borderBottomColor: '#555'
//     },
//     dropdownItemText: {
//         fontSize: WIDTH * 0.04,
//         color: WHITE,
//         fontFamily: POPPINSLIGHT
//     },
//     actionButtonsContainer: {
//         flexDirection: 'row',
//         justifyContent: 'flex-end',
//         marginTop: HEIGHT * 0.04,
//         marginBottom: HEIGHT * 0.02
//     },
//     cancelButton: {
//         backgroundColor: '#1f2937',
//         padding: WIDTH * 0.03,
//         borderRadius: WIDTH * 0.01,
//         marginRight: WIDTH * 0.03
//     },
//     cancelButtonText: {
//         color: WHITE,
//         fontFamily: POPPINSMEDIUM
//     },
//     updateButton: {
//         backgroundColor: BLUE,
//         padding: WIDTH * 0.03,
//         borderRadius: WIDTH * 0.01
//     },
//     updateButtonText: {
//         color: WHITE,
//         fontFamily: POPPINSMEDIUM
//     }
// }); 