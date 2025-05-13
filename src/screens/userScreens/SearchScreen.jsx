import React, { useState, useEffect } from "react";
import { Image, Keyboard, StyleSheet, TextInput, TouchableOpacity, View, FlatList, Alert, Text, Share, Modal, ActivityIndicator } from "react-native";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { BLUE, GREY, WHITE, BLACK, BORDERCOLOR } from "../../constants/color";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { SEARCH, ACCOUNT, VERIFIED, LIKE, WHATSAPP, PRESSLIKE, COMMENT, DOWNARROW } from "../../constants/imagePath";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { BASE_URL } from "../../constants/url";
import { GETNETWORK, POSTNETWORK } from "../../utils/Network";
import { WIDTH, HEIGHT } from "../../constants/config";
import { BOLDMONTSERRAT, LORA, POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";
import { MyLoader } from "../../components/commonComponents/MyLoader";
import { MyAlert } from "../../components/commonComponents/MyAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reaction, setReaction] = useState({});
    const [followStatus, setFollowStatus] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [imageErrors, setImageErrors] = useState({});
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginAlert, setShowLoginAlert] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [currentNewsItem, setCurrentNewsItem] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [isFetchingComments, setIsFetchingComments] = useState(false);

    // Predefined suggestions based on categories
    const categorySuggestions = [
        { id: '1', text: 'Sports News', category: 'sports' },
        { id: '2', text: 'International News', category: 'international' },
        { id: '3', text: 'Entertainment News', category: 'entertainment' },
        { id: '4', text: 'Trending News', category: 'trending' },
        { id: '5', text: 'National News', category: 'national' },
        { id: '6', text: 'State News', category: 'state' },
    ];

    // Update suggestions as user types
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            // Check if the search query matches any category
            const isCategorySearch = categorySuggestions.some(suggestion => 
                suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
            
            if (!isCategorySearch) {
                const filtered = categorySuggestions.filter(suggestion =>
                    suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

    // Add useEffect to check login status
    useEffect(() => {
        checkLoginStatus();
    }, []);

    // Function to check login status
    const checkLoginStatus = async () => {
        try {
            // Try to get token from AsyncStorage
            const userToken = await AsyncStorage.getItem('loginResponse');
            setIsLoggedIn(!!userToken);
        } catch (error) {
            console.error("Error checking login status:", error);
            setIsLoggedIn(false);
        }
    };

    const handleSuggestionPress = (suggestion) => {
        setSearchQuery(suggestion.text);
        setShowSuggestions(false);
        handleSearch();
    };

    // Format time function
    const formatTime = (dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(/\s/g, '');
        } catch (error) {
            console.log('Error formatting time:', error);
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

    // Process image URLs helper
    const processImageUrl = (url) => {
        if (!url) return null;
        // If it's already a full URL (starts with http:// or https://)
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        // For paths starting with '/uploads'
        else if (url.startsWith('/uploads')) {
            return `${BASE_URL}${url.replace(/^\/+/, '')}`;
        }
        // For other paths
        return `${BASE_URL}${url}`;
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            Alert.alert("Error", "Please enter a search term");
            return;
        }

        Keyboard.dismiss();
        setLoading(true);
        setShowSuggestions(false);

        try {
            let apiUrl = `${BASE_URL}api/news/trending`;
            
            // Determine which API to call based on search query
            const query = searchQuery.toLowerCase();
            
            // Check if the search query matches any category suggestion
            const matchedSuggestion = categorySuggestions.find(suggestion => 
                suggestion.text.toLowerCase() === query.toLowerCase() ||
                suggestion.text.toLowerCase().includes(query.toLowerCase())
            );

            if (matchedSuggestion) {
                // If it's a category suggestion, use the category API
                if (matchedSuggestion.category === 'trending') {
                    apiUrl = `${BASE_URL}api/news/trending`;
                } else if (matchedSuggestion.category === 'state') {
                    // For state news, use the location API with Bihar as default state 
                    // and Patna as default district
                    apiUrl = `${BASE_URL}api/news/location/bihar/patna`;
                } else if (matchedSuggestion.category === 'national') {
                    // For national news
                    apiUrl = `${BASE_URL}api/news/category/national`;
                } else {
                    apiUrl = `${BASE_URL}api/news/category/${matchedSuggestion.category}`;
                }
            } else if (query.includes('sports')) {
                apiUrl = `${BASE_URL}api/news/category/sports`;
            } else if (query.includes('international')) {
                apiUrl = `${BASE_URL}api/news/category/international`;
            } else if (query.includes('entertainment')) {
                apiUrl = `${BASE_URL}api/news/category/entertainment`;
            } else if (query.includes('trending')) {
                apiUrl = `${BASE_URL}api/news/trending`;
            } else if (query.includes('national')) {
                apiUrl = `${BASE_URL}api/news/category/national`;
            } else if (query.includes('state')) {
                // For state news search
                apiUrl = `${BASE_URL}api/news/location/bihar/patna`;
            }

            const response = await GETNETWORK(apiUrl);
            
            if (response?.success && response?.data) {
                const newsArray = Array.isArray(response.data) ? response.data : 
                                response.data.news || response.data.data || [];
                
                // If it's a category search, show all approved news in that category
                const filteredNews = matchedSuggestion ? 
                    newsArray.filter(item => 
                        (item.status === "approved" || item.approved === true)
                    ) :
                    newsArray.filter(item => 
                        (item.status === "approved" || item.approved === true) &&
                        (item.title?.toLowerCase().includes(query) || 
                         item.content?.toLowerCase().includes(query))
                    );

                const transformedData = filteredNews.map(newsItem => {
                    // Process image URL
                    let featuredImage = null;
                    if (newsItem.featured_image) {
                        featuredImage = processImageUrl(newsItem.featured_image);
                    } else if (newsItem.featuredImage) {
                        featuredImage = processImageUrl(newsItem.featuredImage);
                    } else if (newsItem.thumbnailUrl) {
                        featuredImage = processImageUrl(newsItem.thumbnailUrl);
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
                            journalistImage = { uri: processImageUrl(profileImg) };
                        }
                    } else if (newsItem.journalist_name) {
                        journalistName = newsItem.journalist_name;
                    }
                    
                    // Get like count if available or default to 0
                    const likeCount = newsItem.likes_count || newsItem.like_count || newsItem.likeCount || 0;
                    
                    return {
                        id: newsItem.id || Math.random().toString(),
                        title: newsItem.title || newsItem.headline || "Untitled",
                        content: newsItem.content || newsItem.description || "",
                        posterName: journalistName,
                        time: formatTime(newsItem.updatedAt || newsItem.createdAt || newsItem.submitted_at || newsItem.created_at) || "Now",
                        accountImage: journalistImage,
                        verifiedIcon: VERIFIED,
                        category: newsItem.category,
                        status: newsItem.status || "approved",
                        featuredImage: featuredImage,
                        createdAt: newsItem.createdAt || newsItem.created_at || new Date().toISOString(),
                        updatedAt: newsItem.updatedAt || newsItem.updated_at || new Date().toISOString(),
                        likeCount: likeCount
                    };
                });

                setSearchResults(transformedData);
            } else {
                setSearchResults([]);
                throw new Error(response?.message || "API error");
            }
        } catch (error) {
            console.error("Search error:", error);
            Alert.alert(
                "Error",
                "Failed to fetch search results. Please try again.",
                [{ text: "OK" }]
            );
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Update handleLike function to use API
    const handleLike = async (id) => {
        try {
            // Get token to verify login status
            const token = await AsyncStorage.getItem('loginResponse');
            const isUserLoggedIn = !!token;
            
            // Check if user is logged in
            if (!isUserLoggedIn) {
                // Show login alert
                setShowLoginAlert(true);
                return;
            }
            
            // Get news item
            const newsItem = searchResults.find(item => item.id === id);
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

    const handleFollow = (id) => {
        setFollowStatus((prevState) => ({
            ...prevState,
            [id]: prevState[id] ? false : true,
        }));
    };

    // Updated handleShare function specifically for WhatsApp
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

            // Add media URL if available
            if (item.featuredImage) {
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
            console.log(`Fetching comments for news ID: ${newsId}`);
            
            // Try to get token for authenticated request
            let userToken = await AsyncStorage.getItem('loginResponse');
            
            // Set auth flag based on token availability
            const isAuthenticated = !!userToken;
            
            // Make API request to get comments
            const commentsEndpoint = `${BASE_URL}api/interaction/news/${newsId}/comments`;
            console.log(`Comments endpoint: ${commentsEndpoint}`);
            
            const response = await GETNETWORK(commentsEndpoint, isAuthenticated);
            console.log("Comments API response:", response);
            
            // Extract comments from potentially nested response structure
            let commentsData = [];
            
            // Handle different response formats
            if (response) {
                if (Array.isArray(response.data)) {
                    commentsData = response.data;
                } else if (response.data?.data && Array.isArray(response.data.data)) {
                    commentsData = response.data.data;
                } else if (response.data?.comments && Array.isArray(response.data.comments)) {
                    commentsData = response.data.comments;
                } else if (response.data) {
                    // Try to extract any array that might contain comments
                    for (const key in response.data) {
                        if (Array.isArray(response.data[key])) {
                            commentsData = response.data[key];
                            break;
                        }
                    }
                }
            }
            
            if (commentsData && commentsData.length > 0) {
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
            setShowLoginAlert(true);
            return;
        }
        
        try {
            // Get the news ID
            const targetNewsId = currentNewsItem.id;
            console.log(`Posting comment for news ID: ${targetNewsId}`);
            
            // Get token for authenticated request
            let userToken = await AsyncStorage.getItem('loginResponse');
            
            // Validate token
            if (!userToken) {
                throw new Error("No authentication token found");
            }
            
            // Create comment payload
            const commentPayload = { text: commentText.trim() };
            
            // Make API request to post comment
            const commentEndpoint = `${BASE_URL}api/interaction/news/${targetNewsId}/comment`;
            console.log(`Comment POST endpoint: ${commentEndpoint}`);
            
            const response = await POSTNETWORK(commentEndpoint, commentPayload, true);
            console.log("Comment POST response:", response);
            
            if (response && (response.success || response.data?.success)) {
                // Comment posted successfully
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
                const alternativePayloads = [
                    { comment: commentText.trim() },
                    { content: commentText.trim() },
                    { message: commentText.trim() }
                ];
                
                let success = false;
                
                for (const payload of alternativePayloads) {
                    const retryResponse = await POSTNETWORK(commentEndpoint, payload, true);
                    
                    if (retryResponse && (retryResponse.success || retryResponse.data?.success)) {
                        // Comment posted successfully with alternative payload
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

    const renderSuggestionItem = ({ item }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSuggestionPress(item)}
        >
            <Text style={styles.suggestionText}>{item.text}</Text>
        </TouchableOpacity>
    );

    const renderNewsItem = ({ item }) => {
        // Get the date string for display
        const dateStr = formatDate(item.createdAt || item.updatedAt);
        
        // Use the imageErrors state from the component level
        const hasImageError = imageErrors[item.id] || false;
        
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
                            onPress={() => navigation.navigate("Trending", {
                                newsId: item.id,
                                newsData: {
                                    id: item.id,
                                    title: item.title,
                                    content: item.content,
                                    featuredImage: item.featuredImage,
                                    time: item.time
                                }
                            })}
                        >
                            {item.featuredImage ? (
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
                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.actionButton}>
                                    <Image
                                        source={reaction[item.id] === "like" ? PRESSLIKE : LIKE}
                                        style={styles.actionIcon}
                                    />
                                    <Text style={styles.actionCountText}>
                                        {item.likeCount > 999 ? (item.likeCount / 1000).toFixed(1) + 'k' : item.likeCount || 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionButton}>
                                    <Image source={WHATSAPP} style={styles.actionIcon} />
                                    <Text style={styles.actionCountText}>Share</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.actionButtonContainer}>
                                <TouchableOpacity onPress={() => handleCommentPress(item)} style={styles.actionButton}>
                                    <Image source={COMMENT} style={styles.actionIcon} />
                                    <Text style={styles.actionCountText}>Comment</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.readMoreButton}
                            onPress={() => navigation.navigate("Trending", {
                                newsId: item.id,
                                newsData: {
                                    id: item.id,
                                    title: item.title,
                                    content: item.content,
                                    featuredImage: item.featuredImage,
                                    time: item.time
                                }
                            })}
                        >
                            <Text style={styles.readMoreText}>Read more</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // Update the search container and related elements
    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="SEARCH"
                    placeholderTextColor={GREY}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity onPress={handleSearch}>
                    <Image source={SEARCH} style={styles.searchIcon} />
                </TouchableOpacity>
                {searchQuery.length > 0 && (
                    <TouchableOpacity 
                        style={styles.clearButton} 
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} showBackButton={false} />
            <View style={styles.container}>
                {renderSearchBar()}

                {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <FlatList
                            data={suggestions}
                            renderItem={renderSuggestionItem}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                )}

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={{fontFamily: LORA}}>Searching...</Text>
                    </View>
                ) : searchResults.length === 0 ? (
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                            {searchQuery ? `No results found for "${searchQuery}"` : "Enter a search term"}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={searchResults}
                        renderItem={renderNewsItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </View>
            
            {/* Comment Modal */}
            {renderCommentModal()}
            
            {/* Login Alert */}
            {showLoginAlert && (
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
                            returnScreen: "SearchScreen"
                        });
                    }}
                />
            )}
            
            <MyLoader visible={loading} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.02,
    },
    searchContainer: {
        width: '100%',
        marginBottom: HEIGHT * 0.02,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WHITE,
        borderRadius: 8,
        paddingHorizontal: WIDTH * 0.04,
        height: HEIGHT * 0.06,
        borderWidth: 1,
        borderColor: GREY,
        position: 'relative',
    },
    searchIcon: {
        width: WIDTH * 0.05,
        height: WIDTH * 0.05,
        marginLeft: WIDTH * 0.02,
    },
    clearButton: {
        marginLeft: WIDTH * 0.02,
        width: WIDTH * 0.05,
        height: WIDTH * 0.05,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: WIDTH * 0.04,
        color: GREY,
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        fontSize: WIDTH * 0.04,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    listContainer: {
        paddingBottom: 20,
    },
    cardWrapper: {
        marginTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.005,
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
    actionButtonContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: WIDTH * 0.008,
        borderRadius: WIDTH * 0.025,
        marginRight: WIDTH * 0.02,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(240, 240, 240, 0.4)',
        paddingVertical: HEIGHT * 0.006,
        paddingHorizontal: WIDTH * 0.02,
        borderRadius: WIDTH * 0.04,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    actionIcon: {
        width: WIDTH * 0.045,
        height: WIDTH * 0.045,
        marginRight: WIDTH * 0.01,
    },
    actionCountText: {
        fontSize: WIDTH * 0.025,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
    },
    readMoreButton: {
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.008,
        paddingHorizontal: WIDTH * 0.03,
        borderRadius: WIDTH * 0.02,
        alignItems: 'center',
        justifyContent: 'center',
    },
    readMoreText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
        fontSize: WIDTH * 0.03,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noResultsText: {
        fontSize: WIDTH * 0.04,
        fontFamily: BOLDMONTSERRAT,
        color: BLACK,
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
    followedButton: {
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: BLUE,
    },
    followedText: {
        color: BLUE,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: HEIGHT * 0.08,
        left: WIDTH * 0.02,
        right: WIDTH * 0.02,
        backgroundColor: WHITE,
        borderRadius: 8,
        elevation: 5,
        zIndex: 1000,
        maxHeight: HEIGHT * 0.3,
        borderWidth: 1,
        borderColor: BORDERCOLOR,
    },
    suggestionItem: {
        padding: WIDTH * 0.03,
        borderBottomWidth: 1,
        borderBottomColor: BORDERCOLOR,
    },
    suggestionText: {
        fontSize: WIDTH * 0.035,
        fontFamily: LORA,
        color: BLACK,
    },
    accountImage: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
        borderRadius: WIDTH * 0.04,
        marginRight: WIDTH * 0.015,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: WHITE,
        borderTopLeftRadius: WIDTH * 0.05,
        borderTopRightRadius: WIDTH * 0.05,
        paddingBottom: HEIGHT * 0.02,
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
});