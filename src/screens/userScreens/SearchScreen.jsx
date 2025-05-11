import React, { useState, useEffect } from "react";
import { Image, Keyboard, StyleSheet, TextInput, TouchableOpacity, View, FlatList, Alert, Text, Share } from "react-native";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { BLUE, GREY, WHITE, BLACK, BORDERCOLOR } from "../../constants/color";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { SEARCH, ACCOUNT, VERIFIED, LIKE, SHARE as SHAREICON, PRESSLIKE } from "../../constants/imagePath";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { BASE_URL } from "../../constants/url";
import { GETNETWORK } from "../../utils/Network";
import { WIDTH, HEIGHT } from "../../constants/config";
import { BOLDMONTSERRAT, LORA, POPPINSLIGHT } from "../../constants/fontPath";
import { MyLoader } from "../../components/commonComponents/MyLoader";

export default SearchScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reaction, setReaction] = useState({});
    const [followStatus, setFollowStatus] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [imageErrors, setImageErrors] = useState({});

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
                        updatedAt: newsItem.updatedAt || newsItem.updated_at || new Date().toISOString()
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

    const handleLike = (id) => {
        setReaction((prevState) => ({
            ...prevState,
            [id]: prevState[id] === "like" ? null : "like",
        }));
    };

    const handleFollow = (id) => {
        setFollowStatus((prevState) => ({
            ...prevState,
            [id]: prevState[id] ? false : true,
        }));
    };

    const handleShare = async (item) => {
        try {
            await Share.share({
                message: `Check out this news: "${item.title}"`,
            });
        } catch (error) {
            console.error("Error sharing news: ", error);
        }
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
                        <TouchableOpacity onPress={() => navigation.navigate("Trending", {
                            newsId: item.id,
                            newsData: {
                                id: item.id,
                                title: item.title,
                                content: item.content,
                                featuredImage: item.featuredImage,
                                time: item.time
                            }
                        })}>
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
                        <Text style={styles.text}>{item.title}</Text>
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
                                <Image source={SHAREICON} style={styles.icon} />
                            </TouchableOpacity>
                        </View>
                        <CustomBtn 
                            text="Read More" 
                            width={WIDTH * 0.25}
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
                        />
                    </View>
                </View>
            </View>
        );
    };

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} showBackButton={false} />
            <View style={styles.container}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Image source={SEARCH} style={styles.searchIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Search..."
                            placeholderTextColor={GREY}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                        />
                    </View>
                    <CustomBtn 
                        onPress={handleSearch} 
                        text="Search" 
                        width="30%" 
                        style={styles.searchButton} 
                    />
                </View>

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
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 10,
        marginBottom: HEIGHT * 0.02,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: WHITE,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        flex: 1,
        borderWidth: 1,
        borderColor: BLUE,
    },
    searchIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    searchButton: {
        marginLeft: 8,
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
    likeDislikeContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: WIDTH * 0.008,
        borderRadius: WIDTH * 0.025,
        marginRight: WIDTH * 0.015,
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
});