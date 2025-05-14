import React, { useState, useRef } from "react";
import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView, TextInput, Platform, KeyboardAvoidingView, Linking, Alert, SafeAreaView, StatusBar } from "react-native";
import { WHITE, BLUE, BLACK, GREY, RED } from "../../../constants/color";
import { MyHeader } from "../../../components/commonComponents/MyHeader";
import { LOGO, EDIT, CROSS } from "../../../constants/imagePath";
import { BASE_URL } from "../../../constants/url";
import { useFocusEffect } from '@react-navigation/native';
import { ToastMessage } from "../../../components/commonComponents/ToastMessage";
import { GETNETWORK, PUTNETWORK } from "../../../utils/Network";
import { getStringByKey, getObjByKey } from "../../../utils/Storage";
import { HEIGHT, WIDTH } from "../../../constants/config";
import { POPPINSLIGHT, POPPINSMEDIUM, POPPINSBOLD } from "../../../constants/fontPath";
import { CustomBtn } from "../../../components/commonComponents/CustomBtn";
import { launchImageLibrary } from 'react-native-image-picker';
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

// Safe error logging function to prevent "Error.stack getter called with an invalid receiver"
const safeLogError = (message, err) => {
    if (err instanceof Error) {
        console.error(message, err.message);
    } else if (typeof err === 'object' && err !== null) {
        console.error(message, JSON.stringify(err));
    } else {
        console.error(message, String(err));
    }
};

export default PendingPostScreens = ({ navigation }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [totalPosts, setTotalPosts] = useState(0);
    const [toastMessage, setToastMessage] = useState({
        type: "",
        msg: "",
        visible: false
    });
    
    // New states for edit modal
    const [modalVisible, setModalVisible] = useState(false);
    const [editablePost, setEditablePost] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    
    // States for form inputs
    const [headline, setHeadline] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [state, setState] = useState("");
    const [district, setDistrict] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");

    // Add the necessary state variables for dropdowns and content editing
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const contentInputRef = useRef(null);

    // Add the categories, states, and districts data arrays
    const categories = [
        { id: '2', name: 'राष्ट्रीय | National', value: 'national' },
        { id: '3', name: 'अंतरराष्ट्रीय | International', value: 'international' },
        { id: '4', name: 'खेल | Sports', value: 'sports' },
        { id: '5', name: 'मनोरंजन | Entertainment', value: 'entertainment' },
    ];

    const states = [
        { id: '1', hindi: "बिहार", english: "Bihar", value: 'bihar' },
        { id: '2', hindi: "झारखंड", english: "Jharkhand", value: 'jharkhand' },
        { id: '3', hindi: "उत्तर प्रदेश", english: "Uttar Pradesh", value: 'up' },
    ];

    const districts = {
        bihar: [
            { id: '1', hindi: "पटना", english: "Patna", value: 'patna' },
            { id: '2', hindi: "गया", english: "Gaya", value: 'gaya' },
            { id: '3', hindi: "मुंगेर", english: "Munger", value: 'munger' },
            { id: '4', hindi: "भागलपुर", english: "Bhagalpur", value: 'bhagalpur' },
            { id: '5', hindi: "पूर्णिया", english: "Purnia", value: 'purnia' },
            { id: '6', hindi: "दरभंगा", english: "Darbhanga", value: 'darbhanga' },
            { id: '7', hindi: "मुजफ्फरपुर", english: "Muzaffarpur", value: 'muzaffarpur' },
            { id: '8', hindi: "सहरसा", english: "Saharsa", value: 'saharsa' },
            { id: '9', hindi: "सीतामढ़ी", english: "Sitamarhi", value: 'sitamarhi' },
            { id: '10', hindi: "वैशाली", english: "Vaishali", value: 'vaishali' },
            { id: '11', hindi: "सिवान", english: "Siwan", value: 'siwan' },
            { id: '12', hindi: "सारण", english: "Saran", value: 'saran' },
            { id: '13', hindi: "गोपालगंज", english: "Gopalganj", value: 'gopalganj' },
            { id: '14', hindi: "बेगूसराय", english: "Begusarai", value: 'begusarai' },
            { id: '15', hindi: "समस्तीपुर", english: "Samastipur", value: 'samastipur' },
            { id: '16', hindi: "अरवल", english: "Arwal", value: 'arwal' },
            { id: '17', hindi: "औरंगाबाद", english: "Aurangabad", value: 'aurangabad' },
            { id: '18', hindi: "बांका", english: "Banka", value: 'banka' },
            { id: '19', hindi: "भोजपुर", english: "Bhojpur", value: 'bhojpur' },
            { id: '20', hindi: "बक्सर", english: "Buxar", value: 'buxar' },
            { id: '21', hindi: "जमुई", english: "Jamui", value: 'jamui' },
            { id: '22', hindi: "जहानाबाद", english: "Jehanabad", value: 'jehanabad' },
            { id: '23', hindi: "कैमूर", english: "Kaimur", value: 'kaimur' },
            { id: '24', hindi: "खगड़िया", english: "Khagaria", value: 'khagaria' },
            { id: '25', hindi: "लखीसराय", english: "Lakhisarai", value: 'lakhisarai' },
            { id: '26', hindi: "नालंदा", english: "Nalanda", value: 'nalanda' },
            { id: '27', hindi: "नवादा", english: "Nawada", value: 'nawada' },
            { id: '28', hindi: "रोहतास", english: "Rohtas", value: 'rohtas' },
            { id: '29', hindi: "शेखपुरा", english: "Sheikhpura", value: 'sheikhpura' }
        ],
        jharkhand: [
            { id: '1', hindi: "रांची", english: "Ranchi", value: 'ranchi' },
            { id: '2', hindi: "जमशेदपुर", english: "Jamshedpur", value: 'jamshedpur' },
            { id: '3', hindi: "धनबाद", english: "Dhanbad", value: 'dhanbad' },
            { id: '4', hindi: "बोकारो", english: "Bokaro", value: 'bokaro' },
            { id: '5', hindi: "देवघर", english: "Deoghar", value: 'deoghar' },
            { id: '6', hindi: "हजारीबाग", english: "Hazaribagh", value: 'hazaribagh' },
            { id: '7', hindi: "गिरिडीह", english: "Giridih", value: 'giridih' },
            { id: '8', hindi: "कोडरमा", english: "Koderma", value: 'koderma' },
            { id: '9', hindi: "चतरा", english: "Chatra", value: 'chatra' },
            { id: '10', hindi: "गुमला", english: "Gumla", value: 'gumla' },
            { id: '11', hindi: "लातेहार", english: "Latehar", value: 'latehar' },
            { id: '12', hindi: "लोहरदगा", english: "Lohardaga", value: 'lohardaga' },
            { id: '13', hindi: "पाकुड़", english: "Pakur", value: 'pakur' },
            { id: '14', hindi: "पलामू", english: "Palamu", value: 'palamu' },
            { id: '15', hindi: "रामगढ़", english: "Ramgarh", value: 'ramgarh' },
            { id: '16', hindi: "दुमका", english: "Dumka", value: 'dumka' },
            { id: '17', hindi: "गढ़वा", english: "Garhwa", value: 'garhwa' },
            { id: '18', hindi: "गोड्डा", english: "Godda", value: 'godda' }
        ],
        up: [
            { id: '1', hindi: "लखनऊ", english: "Lucknow", value: 'lucknow' },
            { id: '2', hindi: "कानपुर", english: "Kanpur", value: 'kanpur' },
            { id: '3', hindi: "आगरा", english: "Agra", value: 'agra' },
            { id: '4', hindi: "वाराणसी", english: "Varanasi", value: 'varanasi' },
            { id: '5', hindi: "प्रयागराज", english: "Prayagraj", value: 'prayagraj' },
            { id: '6', hindi: "मेरठ", english: "Meerut", value: 'meerut' },
            { id: '7', hindi: "नोएडा", english: "Noida", value: 'noida' },
            { id: '8', hindi: "गाजियाबाद", english: "Ghaziabad", value: 'ghaziabad' },
            { id: '9', hindi: "बरेली", english: "Bareilly", value: 'bareilly' },
            { id: '10', hindi: "अलीगढ़", english: "Aligarh", value: 'aligarh' },
            { id: '11', hindi: "मुरादाबाद", english: "Moradabad", value: 'moradabad' },
            { id: '12', hindi: "सहारनपुर", english: "Saharanpur", value: 'saharanpur' },
            { id: '13', hindi: "गोरखपुर", english: "Gorakhpur", value: 'gorakhpur' },
            { id: '14', hindi: "फैजाबाद", english: "Faizabad", value: 'faizabad' },
            { id: '15', hindi: "जौनपुर", english: "Jaunpur", value: 'jaunpur' },
            { id: '16', hindi: "अम्बेडकर नगर", english: "Ambedkar Nagar", value: 'ambedkar_nagar' },
            { id: '17', hindi: "अमेठी", english: "Amethi", value: 'amethi' },
            { id: '18', hindi: "अमरोहा", english: "Amroha", value: 'amroha' },
            { id: '19', hindi: "औरैया", english: "Auraiya", value: 'auraiya' },
            { id: '20', hindi: "अयोध्या", english: "Ayodhya", value: 'ayodhya' },
            { id: '21', hindi: "आजमगढ़", english: "Azamgarh", value: 'azamgarh' },
            { id: '22', hindi: "बागपत", english: "Baghpat", value: 'baghpat' },
            { id: '23', hindi: "बहराइच", english: "Bahraich", value: 'bahraich' },
            { id: '24', hindi: "बलरामपुर", english: "Balrampur", value: 'balrampur' },
            { id: '25', hindi: "बांदा", english: "Banda", value: 'banda' },
            { id: '26', hindi: "बाराबंकी", english: "Barabanki", value: 'barabanki' },
            { id: '27', hindi: "बस्ती", english: "Basti", value: 'basti' },
            { id: '28', hindi: "भदोही", english: "Bhadohi", value: 'bhadohi' },
            { id: '29', hindi: "बिजनौर", english: "Bijnor", value: 'bijnor' },
            { id: '30', hindi: "बदायूं", english: "Budaun", value: 'budaun' },
            { id: '31', hindi: "बुलंदशहर", english: "Bulandshahr", value: 'bulandshahr' },
            { id: '32', hindi: "चंदौली", english: "Chandauli", value: 'chandauli' },
            { id: '33', hindi: "चित्रकूट", english: "Chitrakoot", value: 'chitrakoot' },
            { id: '34', hindi: "देवरिया", english: "Deoria", value: 'deoria' },
            { id: '35', hindi: "एटा", english: "Etah", value: 'etah' },
            { id: '36', hindi: "इटावा", english: "Etawah", value: 'etawah' },
            { id: '37', hindi: "फर्रुखाबाद", english: "Farrukhabad", value: 'farrukhabad' },
            { id: '38', hindi: "फिरोजाबाद", english: "Firozabad", value: 'firozabad' },
            { id: '39', hindi: "गौतम बुद्ध नगर", english: "Gautam Buddha Nagar", value: 'gautam_buddha_nagar' },
            { id: '40', hindi: "गाजीपुर", english: "Ghazipur", value: 'ghazipur' },
            { id: '41', hindi: "गोंडा", english: "Gonda", value: 'gonda' },
            { id: '42', hindi: "हमीरपुर", english: "Hamirpur", value: 'hamirpur' },
            { id: '43', hindi: "हापुड़", english: "Hapur", value: 'hapur' },
            { id: '44', hindi: "हरदोई", english: "Hardoi", value: 'hardoi' },
            { id: '45', hindi: "हाथरस", english: "Hathras", value: 'hathras' },
            { id: '46', hindi: "जालौन", english: "Jalaun", value: 'jalaun' },
            { id: '47', hindi: "कन्नौज", english: "Kannauj", value: 'kannauj' },
            { id: '48', hindi: "कानपुर देहात", english: "Kanpur Dehat", value: 'kanpur_dehat' },
            { id: '49', hindi: "कानपुर नगर", english: "Kanpur Nagar", value: 'kanpur_nagar' },
            { id: '50', hindi: "कासगंज", english: "Kasganj", value: 'kasganj' },
            { id: '51', hindi: "खीरी", english: "Kheri", value: 'kheri' },
            { id: '52', hindi: "कुशीनगर", english: "Kushinagar", value: 'kushinagar' },
            { id: '53', hindi: "महोबा", english: "Mahoba", value: 'mahoba' },
            { id: '54', hindi: "महराजगंज", english: "Mahrajganj", value: 'mahrajganj' },
            { id: '55', hindi: "मैनपुरी", english: "Mainpuri", value: 'mainpuri' },
            { id: '56', hindi: "मऊ", english: "Mau", value: 'mau' },
            { id: '57', hindi: "मिर्जापुर", english: "Mirzapur", value: 'mirzapur' },
            { id: '58', hindi: "मुजफ्फरनगर", english: "Muzaffarnagar", value: 'muzaffarnagar' },
            { id: '59', hindi: "पीलीभीत", english: "Pilibhit", value: 'pilibhit' },
            { id: '60', hindi: "रामपुर", english: "Rampur", value: 'rampur' },
            { id: '61', hindi: "संभल", english: "Sambhal", value: 'sambhal' },
            { id: '62', hindi: "संत कबीर नगर", english: "Sant Kabir Nagar", value: 'sant_kabir_nagar' },
            { id: '63', hindi: "शाहजहांपुर", english: "Shahjahanpur", value: 'shahjahanpur' },
            { id: '64', hindi: "शामली", english: "Shamli", value: 'shamli' },
            { id: '65', hindi: "श्रावस्ती", english: "Shrawasti", value: 'shrawasti' },
            { id: '66', hindi: "सिद्धार्थनगर", english: "Siddharthnagar", value: 'siddharthnagar' },
            { id: '67', hindi: "सीतापुर", english: "Sitapur", value: 'sitapur' },
            { id: '68', hindi: "सोनभद्र", english: "Sonbhadra", value: 'sonbhadra' },
            { id: '69', hindi: "उन्नाव", english: "Unnao", value: 'unnao' }
        ]
    };

    // Add the missing state variables after the other form input states
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedStateId, setSelectedStateId] = useState("bihar"); // Default to Bihar
    const [selectedDistrictId, setSelectedDistrictId] = useState(null);

    // Add a new state variable for video file selection
    const [selectedVideoFile, setSelectedVideoFile] = useState(null);

    // Fetch posts when the screen focuses
    useFocusEffect(
        React.useCallback(() => {
            fetchPostsData();
            return () => {};
        }, [])
    );

    const fetchPostsData = async () => {
        try {
            setLoading(true);
            // Update to use the correct endpoint for pending news
            const url = `${BASE_URL}api/news/my-pending-news`;
            console.log("Fetching pending posts from:", url);
            
            // Get the stored token using both methods for compatibility
            const loginResponse = await getObjByKey('loginResponse');
            let token = loginResponse?.data;
            
            // If not found as object, try string format
            if (!token) {
                token = await getStringByKey('loginResponse');
            }
            
            console.log("Token retrieved:", token ? "Token found" : "No token");
            
            if (!token) {
                setToastMessage({
                    type: "error",
                    msg: "Please login again",
                    visible: true
                });
                setLoading(false);
                return;
            }

            // Using GETNETWORK with authentication
            const result = await GETNETWORK(url, true);
            console.log("Pending posts response:", result);
            
            if (result?.success) {
                // Safely access the data property with fallbacks
                const responseData = result.data || [];
                
                // Ensure we have an array to map over (handle both array and object responses)
                const dataArray = Array.isArray(responseData) ? responseData : 
                                responseData.news || responseData.data || [];
                
                console.log("Raw data array:", dataArray);
                
                if (dataArray.length > 0) {
                    // Map the API data to the format expected by our UI
                    const formattedPosts = dataArray.map(item => {
                        console.log("Processing item:", item);
                        
                        // First, determine if this is a video post
                        const isYouTubeVideo = Boolean(item.youtubeUrl);
                        const isVideoFile = Boolean(item.video_file || item.video || item.videoPath);
                        const isVideoType = item.type === "Video Content" || item.post_type === "video" || item.contentType === "video";
                        
                        // Set post_type based on content type
                        const post_type = (isYouTubeVideo || isVideoFile || isVideoType) ? "video" : "standard";
                        
                        console.log("Content type detection:", { 
                            isYouTubeVideo, 
                            isVideoFile, 
                            isVideoType,
                            post_type 
                        });
                        
                        // Helper function to process URL consistently
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
                        
                        // Extract video path from any of the possible properties and process it
                        let videoPath = null;
                        // Check all possible video path fields and log them for debugging
                        console.log('Checking video sources for item:', item.id);
                        if (item.videoPath) console.log('- videoPath found:', item.videoPath);
                        if (item.video_path) console.log('- video_path found:', item.video_path);
                        if (item.videoUrl) console.log('- videoUrl found:', item.videoUrl);
                        if (item.video_url) console.log('- video_url found:', item.video_url);
                        if (item.video) console.log('- video found:', item.video);
                        if (item.video_file) console.log('- video_file found:', item.video_file);
                        
                        // Try to get video path from various properties
                        if (item.videoPath) {
                            console.log('Found videoPath field:', item.videoPath);
                            videoPath = item.videoPath;
                        } else if (item.video_path) {
                            console.log('Found video_path field:', item.video_path);
                            videoPath = item.video_path;
                        } else if (item.video_file) {
                            console.log('Found video_file field:', item.video_file);
                            videoPath = item.video_file;
                        } else if (item.video_url) {
                            console.log('Found video_url field:', item.video_url);
                            videoPath = item.video_url;
                        } else if (item.videoUrl) {
                            console.log('Found videoUrl field:', item.videoUrl);
                            videoPath = item.videoUrl;
                        } else if (item.video) {
                            console.log('Found video field:', item.video);
                            videoPath = item.video;
                        }
                        
                        // If we found a video path, log it and process it
                        if (videoPath) {
                            console.log(`Item ${item.id} has video path:`, videoPath);
                            videoPath = processUrl(videoPath);
                            console.log(`Processed video path:`, videoPath);
                        }

                        // Process featured image URL
                        let featuredImage = null;
                        if (item.featured_image) {
                            featuredImage = processUrl(item.featured_image);
                        } else if (item.featuredImage) {
                            featuredImage = processUrl(item.featuredImage);
                        }

                        const formattedItem = {
                            id: item.id || Math.random().toString(),
                            headline: item.title || item.headline || "Untitled",
                            content: item.content || item.description || "",
                            category: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Uncategorized",
                            category_id: item.category || "uncategorized", // Store the raw category ID
                            journalist_name: item.journalist_name || "Journalist",
                            submitted_at: item.submitted_at || item.createdAt || item.created_at,
                            featured: item.featured || false,
                            approved: item.approved || false,
                            rejected: item.rejected || false,
                            featured_image: featuredImage || item.featured_image || item.featuredImage,
                            state: item.state || "bihar",
                            district: item.district || "patna",
                            youtubeUrl: item.youtubeUrl,
                            video_file: item.video_file,
                            videoPath: videoPath, // Use processed videoPath
                            thumbnailUrl: item.thumbnailUrl,
                            post_type: post_type,
                            contentType: post_type // Add contentType field for consistency
                        };
                        
                        console.log("Formatted item:", formattedItem);
                        return formattedItem;
                    });
                    
                    console.log("Final formatted posts:", formattedPosts);
                    
                    // Count posts with videos
                    const videosCount = formattedPosts.filter(item => item.videoPath).length;
                    console.log(`Total posts with videos: ${videosCount} out of ${formattedPosts.length}`);
                    
                    // Set the posts data
                    setPosts(formattedPosts);
                    setTotalPosts(formattedPosts.length);
                } else {
                    // Handle empty data case
                    setPosts([]);
                    setTotalPosts(0);
                }
            } else {
                // Handle API error
                setPosts([]);
                setTotalPosts(0);
                setToastMessage({
                    type: "error",
                    msg: result?.message || "Failed to fetch pending posts",
                    visible: true
                });
            }
        } catch (error) {
            safeLogError("API Error:", error);
            setPosts([]);
            setTotalPosts(0);
            setToastMessage({
                type: "error",
                msg: "Network error occurred",
                visible: true
            });
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPostsData();
        setRefreshing(false);
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

    // Add a function to open videos in external player
    const openVideoPlayer = (videoUrl) => {
        if (!videoUrl) return;
        
        console.log("Opening video in external player:", videoUrl);
        
        Linking.canOpenURL(videoUrl)
            .then(supported => {
                if (supported) {
                    return Linking.openURL(videoUrl);
                } else {
                    console.log("Cannot open URL:", videoUrl);
                    return Linking.openURL(`https://www.youtube.com/`);
                }
            })
            .catch(err => {
                console.error("Error opening video URL:", err);
                alert("Could not open the video. Please try again later.");
            });
    };

    // Update the renderMediaContent function to use a thumbnail with play button approach
    const renderMediaContent = (item) => {
        console.log("Rendering media for item:", {
            post_type: item?.post_type,
            youtubeUrl: item?.youtubeUrl,
            video_file: item?.video_file,
            videoPath: item?.videoPath,
            featured_image: item?.featured_image
        });

        if (!item) {
            return (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>No Content</Text>
                </View>
            );
        }
        
        // Handle video content
        if (item.post_type === "video") {
            // For YouTube videos
            if (item.youtubeUrl) {
                // Get YouTube thumbnail
                const thumbnailUrl = item.thumbnailUrl || getYouTubeThumbnail(item.youtubeUrl);
                
                console.log("YouTube video:", { youtubeUrl: item.youtubeUrl, thumbnailUrl });
                
                if (thumbnailUrl) {
                    return (
                        <TouchableOpacity 
                            style={styles.videoContainer}
                            onPress={() => openVideoPlayer(item.youtubeUrl)}
                            activeOpacity={0.9}
                        >
                            <Image
                                source={{ uri: thumbnailUrl }}
                                style={styles.mediaImage}
                                resizeMode="cover"
                                onError={(error) => {
                                    console.log("Error loading YouTube thumbnail:", error);
                                    // Try using standard quality thumbnail
                                    const videoId = item.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                                    if (videoId) {
                                        return (
                                            <Image
                                                source={{ uri: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` }}
                                                style={styles.mediaImage}
                                                resizeMode="cover"
                                            />
                                        );
                                    }
                                    return (
                                        <View style={styles.videoPlaceholder}>
                                            <Text style={styles.videoText}>YouTube Video</Text>
                                        </View>
                                    );
                                }}
                            />
                            <View style={styles.videoInfoBadge}>
                                <Text style={styles.videoInfoText}>YouTube</Text>
                            </View>
                            <View style={styles.videoIconOverlay}>
                                <View style={styles.playButtonCircle}>
                                    <Text style={styles.videoIconText}>▶</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }
            }
            
            // For uploaded video files (check for multiple possible property names)
            const videoPath = item.videoPath || item.video_file || item.video;
            if (videoPath) {
                // Use the VideoPlayer component for uploaded videos
                return <VideoPlayer videoPath={videoPath} />;
            }
            
            // Generic video content (fallback)
            return (
                <View style={styles.videoContainer}>
                    <View style={styles.videoPlaceholder}>
                        <Text style={styles.videoText}>Video Content</Text>
                    </View>
                    <View style={styles.videoIconOverlay}>
                        <View style={styles.playButtonCircle}>
                            <Text style={styles.videoIconText}>▶</Text>
                        </View>
                    </View>
                </View>
            );
        }
        
        // Handle standard content with images
        if (item.featured_image) {
            let imageUri;
            try {
                // Handle different image path formats
                if (item.featured_image.includes('http')) {
                    // Already a full URL
                    imageUri = item.featured_image;
                } else if (item.featured_image.startsWith('data:')) {
                    // Data URI
                    imageUri = item.featured_image;
                } else {
                    // Relative path - ensure it works with paths like "/uploads/images/..."
                    imageUri = item.featured_image.startsWith('/') 
                        ? `${BASE_URL}${item.featured_image.substring(1)}` 
                        : `${BASE_URL}${item.featured_image}`;
                }
                
                console.log("Standard content with image:", imageUri);
                    
                return (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.mediaImage}
                        resizeMode="cover"
                        onError={(error) => {
                            console.log("Error loading image:", imageUri, error);
                            return (
                                <View style={styles.placeholderContainer}>
                                    <Text style={styles.placeholderText}>Image Error</Text>
                                </View>
                            );
                        }}
                    />
                );
            } catch (error) {
                safeLogError("Error processing image URI:", error);
            }
        }
        
        // Fallback for posts without media
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>
                    {item.headline ? item.headline.charAt(0).toUpperCase() : 'No Image'}
                </Text>
            </View>
        );
    };

    // Extract YouTube video ID from URL - handles multiple URL formats
    const extractYoutubeId = (url) => {
        if (!url) return null;
        
        try {
            // Clean the URL
            url = url.trim();
            
            // Standard YouTube URL patterns
            const standardRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const standardMatch = url.match(standardRegExp);
            
            if (standardMatch && standardMatch[7] && standardMatch[7].length === 11) {
                return standardMatch[7];
            }
        
            // Mobile YouTube URL pattern
            const mobileRegExp = /^https?:\/\/m\.youtube\.com\/watch\?v=([^&]*)/;
            const mobileMatch = url.match(mobileRegExp);
            
            if (mobileMatch && mobileMatch[1] && mobileMatch[1].length === 11) {
                return mobileMatch[1];
            }
            
            // Short URL pattern (youtu.be)
            const shortRegExp = /^https?:\/\/youtu\.be\/([^?#&]*)/;
            const shortMatch = url.match(shortRegExp);
            
            if (shortMatch && shortMatch[1] && shortMatch[1].length === 11) {
                return shortMatch[1];
            }
            
            // Embedded URL pattern
            const embedRegExp = /^https?:\/\/www\.youtube\.com\/embed\/([^?#&]*)/;
            const embedMatch = url.match(embedRegExp);
            
            if (embedMatch && embedMatch[1] && embedMatch[1].length === 11) {
                return embedMatch[1];
            }
            
            return null;
        } catch (error) {
            safeLogError("Error extracting YouTube ID:", error);
            return null;
        }
    };

    // Add these methods to handle dropdown toggles
    const toggleCategoryDropdown = () => {
        setShowCategoryDropdown(!showCategoryDropdown);
        setShowStateDropdown(false);
        setShowDistrictDropdown(false);
    };

    const toggleStateDropdown = () => {
        setShowStateDropdown(!showStateDropdown);
        setShowCategoryDropdown(false);
        setShowDistrictDropdown(false);
    };

    const toggleDistrictDropdown = () => {
        setShowDistrictDropdown(!showDistrictDropdown);
        setShowCategoryDropdown(false);
        setShowStateDropdown(false);
    };

    // Add these methods to handle selection
    const selectCategory = (category) => {
        setCategory(category.name);
        setSelectedCategoryId(category.value);
        setShowCategoryDropdown(false);
    };

    const selectState = (state) => {
        setState(`${state.hindi} | ${state.english}`);
        setSelectedStateId(state.value);
        setShowStateDropdown(false);
        
        // Update district list based on selected state
        setFilteredDistricts(districts[state.value] || []);
        
        // Reset district selection when state changes
        setDistrict('---------');
        setSelectedDistrictId(null);
    };

    const selectDistrict = (district) => {
        setDistrict(`${district.hindi} | ${district.english}`);
        setSelectedDistrictId(district.value);
        setShowDistrictDropdown(false);
    };

    // Add a method to handle formatting
    const handleSelectionChange = (event) => {
        setSelection(event.nativeEvent.selection);
    };

    const handleFormatPress = (format) => {
        if (!contentInputRef.current) return;
        
        let newContent = content;
        const selectedText = content.substring(selection.start, selection.end);
        let formattedText = '';

        switch(format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'bulletList':
                formattedText = `• ${selectedText}`;
                break;
            case 'numberedList':
                formattedText = `1. ${selectedText}`;
                break;
            case 'indent':
                formattedText = `    ${selectedText}`;
                break;
            case 'code':
                formattedText = `\`${selectedText}\``;
                break;
            default:
                return;
        }

        newContent = 
            content.substring(0, selection.start) + 
            formattedText + 
            content.substring(selection.end);
        
        setContent(newContent);
    };

    // Update the fetchPostDetails function to use direct fetch instead of GETNETWORK and fix the API endpoint to use my-pending-news/id
    const fetchPostDetails = async (postId) => {
        try {
            setEditLoading(true);
            console.log("Fetching post details for ID:", postId);
            
            // First try to find the post in our local data
            const localPost = posts.find(post => post.id === postId || post.id === parseInt(postId));
            
            if (localPost) {
                console.log("Found post in local data, using it:", localPost);
                
                // Set post details to the form
                setHeadline(localPost.title || localPost.headline || "");
                setContent(localPost.content || localPost.description || "");
                
                // Set category
                const categoryValue = localPost.category || "";
                console.log("Category from local post:", categoryValue);
                const categoryObj = categories.find(cat => 
                    cat.value === categoryValue.toLowerCase() || 
                    cat.name.toLowerCase().includes(categoryValue.toLowerCase())
                );
                
                if (categoryObj) {
                    console.log("Found matching category:", categoryObj.name);
                    setCategory(categoryObj.name);
                    setSelectedCategoryId(categoryObj.value);
                } else {
                    console.log("No category match found");
                    setCategory('---------');
                    setSelectedCategoryId(null);
                }
                
                // Set state
                const stateValue = localPost.state || "";
                console.log("State from local post:", stateValue);
                let stateId = 'bihar'; // Default state
                
                if (stateValue) {
                    // Try to match state by inclusion
                    if (stateValue.toLowerCase().includes('bihar')) {
                        stateId = 'bihar';
                    } else if (stateValue.toLowerCase().includes('jharkhand')) {
                        stateId = 'jharkhand';
                    } else if (stateValue.toLowerCase().includes('uttar') || stateValue.toLowerCase().includes('pradesh')) {
                        stateId = 'up';
                    }
                }
                
                const stateObj = states.find(s => s.value === stateId);
                if (stateObj) {
                    console.log("Found matching state:", stateObj.english);
                    setState(`${stateObj.hindi} | ${stateObj.english}`);
                    setSelectedStateId(stateObj.value);
                    
                    // Update districts based on selected state
                    setFilteredDistricts(districts[stateObj.value] || []);
                }
                
                // Set district if available
                const districtValue = localPost.district || "";
                console.log("District from local post:", districtValue);
                
                if (districtValue && districts[stateId]) {
                    // Try to find a matching district by partial name
                    const districtName = districtValue.split('|').pop().trim().toLowerCase();
                    const districtObj = districts[stateId].find(d => 
                        d.english.toLowerCase() === districtName || 
                        d.english.toLowerCase().includes(districtName) ||
                        d.hindi.toLowerCase() === districtName ||
                        d.hindi.toLowerCase().includes(districtName)
                    );
                    
                    if (districtObj) {
                        console.log("Found matching district:", districtObj.english);
                        setDistrict(`${districtObj.hindi} | ${districtObj.english}`);
                        setSelectedDistrictId(districtObj.value);
                    } else {
                        console.log("No district match found");
                        setDistrict('---------');
                        setSelectedDistrictId(null);
                    }
                }
                
                // Handle featured image
                if (localPost.featuredImage || localPost.featured_image) {
                    const imagePath = localPost.featuredImage || localPost.featured_image;
                    console.log("Found featured image in local post:", imagePath);
                    
                    // Create a proper URI for the image
                    let imageUri;
                    if (imagePath.startsWith('http')) {
                        // Already a full URL
                        imageUri = imagePath;
                    } else if (imagePath.startsWith('/')) {
                        // Path starts with slash, prepend base URL without trailing slash
                        const baseUrlWithoutTrailingSlash = BASE_URL.endsWith('/') 
                            ? BASE_URL.slice(0, -1) 
                            : BASE_URL;
                        imageUri = `${baseUrlWithoutTrailingSlash}${imagePath}`;
                    } else {
                        // Path doesn't start with slash, prepend base URL with slash
                        const baseUrlWithTrailingSlash = BASE_URL.endsWith('/') 
                            ? BASE_URL 
                            : `${BASE_URL}/`;
                        imageUri = `${baseUrlWithTrailingSlash}${imagePath}`;
                    }
                    
                    console.log("Setting image URI for local post:", imageUri);
                    
                    // Set the selected image with the proper URI
                    setSelectedImage({
                        uri: imageUri,
                        type: 'image/jpeg',
                        name: imagePath.split('/').pop() || 'image.jpg',
                        isExisting: true  // Flag to indicate this is an existing image
                    });
                }
                
                // Set YouTube URL if it exists
                if (localPost.youtubeUrl) {
                    setYoutubeUrl(localPost.youtubeUrl);
                }
                
                // Set the entire post object to editablePost for reference
                setEditablePost(localPost);
                setEditLoading(false);
                return; // Skip API call since we have the data
            }
            
            // If we don't have local data, try the API
            const token = await getStringByKey('loginResponse');
            if (!token) {
                console.error("No authentication token found");
                Alert.alert("Error", "Please login again to edit posts");
                setEditLoading(false);
                return;
            }
            
            // Try multiple possible endpoints
            const possibleEndpoints = [
                `${BASE_URL}api/news/my-pending-news/${postId}`,
                `${BASE_URL}api/news/${postId}`,
                `${BASE_URL}api/news/pending/${postId}`
            ];
            
            let fetchResult = null;
            let fetchError = null;
            
            // Try each endpoint until one works
            for (const endpoint of possibleEndpoints) {
                try {
                    console.log("Trying endpoint:", endpoint);
                    
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) {
                        console.log(`Endpoint ${endpoint} returned status ${response.status}`);
                        continue; // Try next endpoint
                    }
                    
                    const responseText = await response.text();
                    console.log("Got response from", endpoint, ":", responseText.substring(0, 100) + "...");
                    
                    try {
                        const resultData = JSON.parse(responseText);
                        if (resultData.success) {
                            fetchResult = resultData;
                            console.log("Found working endpoint:", endpoint);
                            break; // Use this result
                        }
                    } catch (parseError) {
                        console.error("Error parsing response:", parseError);
                    }
                } catch (endpointError) {
                    fetchError = endpointError;
                    console.error("Error with endpoint", endpoint, ":", endpointError);
                }
            }
            
            if (fetchResult && fetchResult.success) {
                console.log("Successfully fetched post details");
                const postData = fetchResult.data;
                
                // Set post details to the form
                setHeadline(postData.title || postData.headline || "");
                setContent(postData.content || postData.description || "");
                
                // Set category
                const categoryValue = postData.category || "";
                console.log("Category from API:", categoryValue);
                const categoryObj = categories.find(cat => 
                    cat.value === categoryValue.toLowerCase() || 
                    cat.name.toLowerCase().includes(categoryValue.toLowerCase())
                );
                
                if (categoryObj) {
                    console.log("Found matching category:", categoryObj.name);
                    setCategory(categoryObj.name);
                    setSelectedCategoryId(categoryObj.value);
                } else {
                    console.log("No category match found");
                    setCategory('---------');
                    setSelectedCategoryId(null);
                }
                
                // Set state
                const stateValue = postData.state || "";
                console.log("State from API:", stateValue);
                let stateId = 'bihar'; // Default state
                
                if (stateValue) {
                    // Try to match state by inclusion
                    if (stateValue.toLowerCase().includes('bihar')) {
                        stateId = 'bihar';
                    } else if (stateValue.toLowerCase().includes('jharkhand')) {
                        stateId = 'jharkhand';
                    } else if (stateValue.toLowerCase().includes('uttar') || stateValue.toLowerCase().includes('pradesh')) {
                        stateId = 'uttar_pradesh';
                    }
                }
                
                const stateObj = states.find(s => s.value === stateId);
                if (stateObj) {
                    console.log("Found matching state:", stateObj.english);
                    setState(`${stateObj.hindi} | ${stateObj.english}`);
                    setSelectedStateId(stateObj.value);
                    
                    // Update districts based on selected state
                    setFilteredDistricts(districts[stateObj.value] || []);
                }
                
                // Set district if available
                const districtValue = postData.district || "";
                console.log("District from API:", districtValue);
                
                if (districtValue && districts[stateId]) {
                    // Try to find a matching district by partial name
                    const districtName = districtValue.split('|').pop().trim().toLowerCase();
                    const districtObj = districts[stateId].find(d => 
                        d.english.toLowerCase() === districtName || 
                        d.english.toLowerCase().includes(districtName) ||
                        d.hindi.toLowerCase() === districtName ||
                        d.hindi.toLowerCase().includes(districtName)
                    );
                    
                    if (districtObj) {
                        console.log("Found matching district:", districtObj.english);
                        setDistrict(`${districtObj.hindi} | ${districtObj.english}`);
                        setSelectedDistrictId(districtObj.value);
                    } else {
                        console.log("No district match found");
                        setDistrict('---------');
                        setSelectedDistrictId(null);
                    }
                }
                
                // Handle featured image
                if (postData.featuredImage || postData.featured_image) {
                    const imagePath = postData.featuredImage || postData.featured_image;
                    console.log("Found featured image:", imagePath);
                    
                    // Create a proper URI for the image
                    let imageUri;
                    if (imagePath.startsWith('http')) {
                        // Already a full URL
                        imageUri = imagePath;
                    } else if (imagePath.startsWith('/')) {
                        // Path starts with slash, prepend base URL without trailing slash
                        const baseUrlWithoutTrailingSlash = BASE_URL.endsWith('/') 
                            ? BASE_URL.slice(0, -1) 
                            : BASE_URL;
                        imageUri = `${baseUrlWithoutTrailingSlash}${imagePath}`;
                    } else {
                        // Path doesn't start with slash, prepend base URL with slash
                        const baseUrlWithTrailingSlash = BASE_URL.endsWith('/') 
                            ? BASE_URL 
                            : `${BASE_URL}/`;
                        imageUri = `${baseUrlWithTrailingSlash}${imagePath}`;
                    }
                    
                    console.log("Setting image URI:", imageUri);
                    
                    // Set the selected image with the proper URI
                    setSelectedImage({
                        uri: imageUri,
                        type: 'image/jpeg',
                        name: imagePath.split('/').pop() || 'image.jpg',
                        isExisting: true  // Flag to indicate this is an existing image
                    });
                }
                
                // Set YouTube URL if it exists
                if (postData.youtubeUrl) {
                    setYoutubeUrl(postData.youtubeUrl);
                }
                
                // Set the entire post object to editablePost for reference
                setEditablePost(postData);
            } else {
                console.error("Failed to fetch post details from any endpoint");
                console.log("Using local post data as fallback");
                
                // If we reach here, we use whatever local data we have from the posts list
                const fallbackPost = posts.find(post => post.id === postId || post.id === parseInt(postId));
                if (fallbackPost) {
                    console.log("Using fallback data:", fallbackPost);
                    setEditablePost(fallbackPost);
                } else {
                    Alert.alert("Error", "Could not find post details");
                    setModalVisible(false);
                }
            }
        } catch (error) {
            console.error("Error in fetchPostDetails:", error);
            Alert.alert("Error", "An error occurred while fetching post details");
        } finally {
            setEditLoading(false);
        }
    };
    
    // Function to handle image selection
    const handleChooseImage = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };
        
        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
                setToastMessage({
                    type: "error",
                    msg: "Error picking image: " + response.error,
                    visible: true
                });
            } else {
                console.log('Image selected:', response.assets[0]);
                setSelectedImage(response.assets[0]);
            }
        });
    };
    
    // Add this function to handle video file selection
    const handleChooseVideo = () => {
        const options = {
            mediaType: 'video',
            includeBase64: false,
            videoQuality: 'medium',
        };
        
        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled video picker');
            } else if (response.error) {
                console.log('VideoPicker Error: ', response.error);
                setToastMessage({
                    type: "error",
                    msg: "Error picking video: " + response.error,
                    visible: true
                });
            } else {
                console.log('Video selected:', response.assets[0]);
                setSelectedVideoFile(response.assets[0]);
            }
        });
    };
    
    // Update the handleUpdatePost function to use direct fetch instead of PUTNETWORK
    const handleUpdatePost = async () => {
        try {
            if (!editablePost || !editablePost.id) {
                setToastMessage({
                    type: "error",
                    msg: "Invalid post data",
                    visible: true
                });
                return;
            }
            
            // Validate required fields
            if (!headline.trim()) {
                setToastMessage({
                    type: "error",
                    msg: "Please enter a headline for your post",
                    visible: true
                });
                return;
            }

            if (!content.trim()) {
                setToastMessage({
                    type: "error",
                    msg: "Please enter content for your post",
                    visible: true
                });
                return;
            }

            if (!selectedCategoryId) {
                setToastMessage({
                    type: "error",
                    msg: "Please select a category for your post",
                    visible: true
                });
                return;
            }
            
            if (!selectedStateId) {
                setToastMessage({
                    type: "error",
                    msg: "Please select a state for your post",
                    visible: true
                });
                return;
            }
            
            if (!selectedDistrictId) {
                setToastMessage({
                    type: "error",
                    msg: "Please select a district for your post",
                    visible: true
                });
                return;
            }
            
            setEditLoading(true);
            
            // Prepare form data
            const formData = new FormData();
            formData.append("title", headline.trim());
            formData.append("content", content.trim());
            formData.append("category", selectedCategoryId);
            formData.append("state", selectedStateId);
            formData.append("district", selectedDistrictId);
            
            // Handle different content types
            if (editablePost.post_type === "video") {
                // Check if it's a YouTube video or a video file
                if (editablePost.video_file || editablePost.videoPath) {
                    formData.append("type", "Video Content");
                    formData.append("contentType", "video");
                    
                    // If a new video file is selected, use it
                    if (selectedVideoFile) {
                        console.log("Updating with new video file:", selectedVideoFile.fileName);
                        
                        // Use the correct field name - try different common field names
                        // The server expects 'video' as the field name, not 'video_file'
                        formData.append("video", {
                            uri: selectedVideoFile.uri,
                            type: selectedVideoFile.type || 'video/mp4',
                            name: selectedVideoFile.fileName || 'video.mp4'
                        });
                        
                        // Log the form data for debugging
                        console.log("Form data entries for video:", Object.fromEntries(formData._parts));
                    } else {
                        // Otherwise preserve the existing reference
                        if (typeof editablePost.video_file === 'string') {
                            formData.append("videoPath", editablePost.video_file);
                        } else if (editablePost.videoPath) {
                            formData.append("videoPath", editablePost.videoPath);
                        }
                    }
                } else {
                    // YouTube video
                    formData.append("youtubeUrl", youtubeUrl);
                    formData.append("type", "Video Content");
                    formData.append("contentType", "video");
                }
            } else {
                formData.append("type", "Standard Content");
                formData.append("contentType", "standard");
                
                // If there's a new image selected
                if (selectedImage && !selectedImage.isExisting) {
                    formData.append("featuredImage", {
                        uri: selectedImage.uri,
                        type: selectedImage.type || 'image/jpeg',
                        name: selectedImage.fileName || 'featured_image.jpg'
                    });
                }
            }
            
            console.log("Updating post with data:", JSON.stringify({
                id: editablePost.id,
                title: headline.trim(),
                content: content.trim(),
                category: selectedCategoryId,
                state: selectedStateId,
                district: selectedDistrictId,
                type: editablePost.post_type === "video" ? "Video Content" : "Standard Content",
                hasNewImage: selectedImage && !selectedImage.isExisting
            }));
            
            // Get token for authorization
            const loginResponse = await getStringByKey('loginResponse');
            let token = loginResponse;
            
            if (!token) {
                // Try to get token from object format
                const loginResponseObj = await getObjByKey('loginResponse');
                token = loginResponseObj?.data;
            }
            
            if (!token) {
                setToastMessage({
                    type: "error",
                    msg: "Please login again to update your post",
                    visible: true
                });
                setEditLoading(false);
                return;
            }
            
            // Use the correct endpoint format: api/news/id (NOT my-pending-news)
            const url = `${BASE_URL}api/news/${editablePost.id}`;
            console.log("Update API URL:", url);
            
            // Set up request headers
            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);
            myHeaders.append("Accept", "application/json");
            
            // Set up request options using the user's provided approach
            const requestOptions = {
                method: "PUT",
                headers: myHeaders,
                body: formData,
                redirect: "follow"
            };
            
            // Also update the actual fetch call to include better logging for debugging
            // After setting up request options
            console.log("Making request to:", url);
            console.log("With headers:", Array.from(myHeaders.entries()));
            console.log("Form data fields:", formData._parts.map(part => part[0]));
            
            // Add detailed error logging to the fetch call
            try {
                const response = await fetch(url, requestOptions);
                const resultText = await response.text();
                console.log("Raw API response:", resultText);
                
                let result;
                try {
                    // Try to parse response as JSON
                    result = JSON.parse(resultText);
                } catch (e) {
                    console.log("Response is not JSON:", e);
                    result = { success: false, message: "Invalid response from server" };
                }
                
                console.log("Parsed API response:", result);
                
                if (response.ok && (result?.success || response.status === 200 || response.status === 201)) {
                    console.log("Post updated successfully:", result);
                    setToastMessage({
                        type: "success",
                        msg: "Post updated successfully",
                        visible: true
                    });
                    
                    // Close modal and fetch fresh data to display updated content
                    setModalVisible(false);
                    
                    // Force immediate refresh of posts data to show updated content
                    setTimeout(() => {
                        fetchPostsData();
                    }, 300);
                } else {
                    console.error("Error updating post:", result?.message || response.statusText);
                    console.error("Response status:", response.status);
                    console.error("Response headers:", Array.from(response.headers.entries()));
                    
                    setToastMessage({
                        type: "error",
                        msg: result?.message || "Failed to update post",
                        visible: true
                    });
                }
            } catch (error) {
                safeLogError("Error updating post:", error);
                setToastMessage({
                    type: "error",
                    msg: "Error updating post: " + (error.message || error),
                    visible: true
                });
            }
        } catch (error) {
            safeLogError("Error updating post:", error);
            setToastMessage({
                type: "error",
                msg: "Error updating post",
                visible: true
            });
        } finally {
            setEditLoading(false);
        }
    };

    // Update the handleEditPress function to also reset the selection IDs
    const handleEditPress = (item) => {
        console.log("Edit post:", item.id);
        
        // Reset form states
        setHeadline("");
        setContent("");
        setCategory("---------");
        setSelectedCategoryId(null);
        setState("");
        setSelectedStateId("bihar"); // Default to Bihar
        setDistrict("---------");
        setSelectedDistrictId(null);
        setYoutubeUrl("");
        setSelectedImage(null);
        setSelectedVideoFile(null);
        setEditablePost(null);
        
        // Show modal
        setModalVisible(true);
        
        // Fetch post details
        fetchPostDetails(item.id);
    };
    
    // Replace the entire renderEditModal function with this new implementation
    const renderEditModal = () => (
        <Modal
            animationType="slide"
            transparent={false}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            statusBarTranslucent={true}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor={BLUE}
            />
            <SafeAreaView style={styles.modalSafeArea}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Edit Post</Text>
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => {
                                setModalVisible(false);
                                // Reset all form states
                                setHeadline("");
                                setContent("");
                                setCategory("---------");
                                setSelectedCategoryId(null);
                                setState("");
                                setSelectedStateId("bihar");
                                setDistrict("---------");
                                setSelectedDistrictId(null);
                                setYoutubeUrl("");
                                setSelectedImage(null);
                                setSelectedVideoFile(null);
                                setEditablePost(null);
                                setShowCategoryDropdown(false);
                                setShowStateDropdown(false);
                                setShowDistrictDropdown(false);
                            }}
                        >
                            <Image source={CROSS} style={styles.closeIcon} />
                        </TouchableOpacity>
                    </View>
                    
                    {editLoading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={BLUE} />
                            <Text style={styles.loadingText}>Loading post details...</Text>
                        </View>
                    ) : (
                        <ScrollView 
                            contentContainerStyle={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Post Type Badge */}
                            {editablePost && (
                                <View style={styles.postTypeBadgeContainer}>
                                    <Text style={[
                                        styles.contentTypeText,
                                        editablePost.post_type === "video" ? styles.videoContentBadge : styles.standardContentBadge
                                    ]}>
                                        {editablePost.post_type === "video" ? "Video Content" : "Standard Content"}
                                    </Text>
                                </View>
                            )}
                            
                            {/* Headline/Title */}
                            <Text style={styles.sectionTitle}>Post Title/Headline</Text>
                            <TextInput
                                style={styles.titleInput}
                                value={headline}
                                onChangeText={setHeadline}
                                placeholder="Write title here..."
                                placeholderTextColor={GREY}
                            />
                            
                            {/* Content Type Specific Fields */}
                            {editablePost && editablePost.post_type === "video" ? (
                                <View style={styles.formGroup}>
                                    {/* Check if we have a video file or YouTube URL */}
                                    {editablePost.video_file || editablePost.videoPath ? (
                                        <>
                                            <Text style={styles.sectionTitle}>Video File</Text>
                                            <View style={styles.compactVideoContainer}>
                                                <Text style={styles.currentVideoText} numberOfLines={1} ellipsizeMode="middle">
                                                    Current: {typeof editablePost.video_file === 'string' 
                                                        ? editablePost.video_file.split('/').pop() 
                                                        : (editablePost.videoPath 
                                                            ? editablePost.videoPath.split('/').pop() 
                                                            : 'Video File')}
                                                </Text>
                                                <TouchableOpacity 
                                                    style={styles.changeVideoButton}
                                                    onPress={handleChooseVideo}
                                                >
                                                    <Text style={styles.changeVideoButtonText}>Change</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {selectedVideoFile && (
                                                <Text style={styles.newVideoText} numberOfLines={1} ellipsizeMode="middle">
                                                    New: {selectedVideoFile.fileName || 'video.mp4'}
                                                </Text>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.sectionTitle}>YouTube URL</Text>
                                            <TextInput
                                                style={styles.formInput}
                                                value={youtubeUrl}
                                                onChangeText={setYoutubeUrl}
                                                placeholder="Enter YouTube URL"
                                                placeholderTextColor={GREY}
                                            />
                                            {youtubeUrl && (
                                                <View style={styles.videoPreviewContainer}>
                                                    <Text style={styles.previewText}>Video Preview:</Text>
                                                    <Image 
                                                        source={{ 
                                                            uri: `https://img.youtube.com/vi/${extractYoutubeId(youtubeUrl) || 'invalid'}/0.jpg` 
                                                        }}
                                                        style={styles.videoThumbnail}
                                                        resizeMode="cover"
                                                    />
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.formGroup}>
                                    <Text style={styles.sectionTitle}>Featured Image</Text>
                                    <View style={styles.fileSelectionContainer}>
                                        <TouchableOpacity 
                                            style={styles.chooseFileButton}
                                            onPress={handleChooseImage}
                                        >
                                            <Text style={styles.chooseFileText}>Choose File</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.fileSelectedText}>
                                            {selectedImage ? selectedImage.name || 'image.jpg' : 'No file selected'}
                                        </Text>
                                    </View>
                                    
                                    {selectedImage && (
                                        <View style={styles.selectedImageContainer}>
                                            <Image 
                                                source={{ uri: selectedImage.uri }}
                                                style={styles.selectedImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            {/* Content Section */}
                            <View style={styles.contentContainer}>
                                <Text style={styles.contentTitle}>Content</Text>
                                
                                {/* Formatting Toolbar */}
                                <View style={styles.formattingToolbar}>
                                    <TouchableOpacity onPress={() => handleFormatPress('bold')}>
                                        <Text style={styles.formatIcon}>B</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormatPress('italic')}>
                                        <Text style={styles.formatIcon}>I</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormatPress('bulletList')}>
                                        <Text style={styles.formatIcon}>≡</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormatPress('numberedList')}>
                                        <Text style={styles.formatIcon}>⋮</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormatPress('indent')}>
                                        <Text style={styles.formatIcon}>⫶</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFormatPress('code')}>
                                        <Text style={styles.formatIcon}>&lt;&gt;</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                {/* Content Editor */}
                                <TextInput
                                    ref={contentInputRef}
                                    style={styles.contentEditor}
                                    placeholder="Write your content here..."
                                    multiline={true}
                                    numberOfLines={10}
                                    value={content}
                                    onChangeText={setContent}
                                    onSelectionChange={handleSelectionChange}
                                    textAlignVertical="top"
                                />
                            </View>
                            
                            {/* Category Section */}
                            <View style={styles.categorySection}>
                                <Text style={styles.organizeSectionTitle}>Organize</Text>
                                
                                {/* Category Dropdown */}
                                <Text style={styles.categoryLabel}>CATEGORY</Text>
                                <TouchableOpacity 
                                    style={styles.categoryDropdown}
                                    onPress={toggleCategoryDropdown}
                                >
                                    <Text>{category}</Text>
                                    <Text>▼</Text>
                                </TouchableOpacity>
                                
                                {/* Category Dropdown Modal */}
                                <Modal
                                    statusBarTranslucent={true}
                                    visible={showCategoryDropdown}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setShowCategoryDropdown(false)}
                                >
                                    <TouchableOpacity 
                                        style={styles.modalOverlay} 
                                        activeOpacity={1} 
                                        onPress={() => setShowCategoryDropdown(false)}
                                    >
                                        <View style={styles.dropdownContainer}>
                                            <View style={styles.dropdownHeader}>
                                                <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                                                    <Text style={styles.checkmark}>✓</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.dropdownHeaderText}>Select Category</Text>
                                            </View>
                                            <FlatList
                                                data={categories}
                                                keyExtractor={(item) => item.id}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity 
                                                        style={styles.dropdownItem}
                                                        onPress={() => selectCategory(item)}
                                                    >
                                                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </Modal>
                                
                                {/* State Dropdown */}
                                <Text style={[styles.categoryLabel, {marginTop: HEIGHT * 0.015}]}>STATE</Text>
                                <TouchableOpacity 
                                    style={styles.categoryDropdown}
                                    onPress={toggleStateDropdown}
                                >
                                    <Text>{state}</Text>
                                    <Text>▼</Text>
                                </TouchableOpacity>
                                
                                {/* State Dropdown Modal */}
                                <Modal
                                    statusBarTranslucent={true}
                                    visible={showStateDropdown}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setShowStateDropdown(false)}
                                >
                                    <TouchableOpacity 
                                        style={styles.modalOverlay} 
                                        activeOpacity={1} 
                                        onPress={() => setShowStateDropdown(false)}
                                    >
                                        <View style={styles.dropdownContainer}>
                                            <View style={styles.dropdownHeader}>
                                                <TouchableOpacity onPress={() => setShowStateDropdown(false)}>
                                                    <Text style={styles.checkmark}>✓</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.dropdownHeaderText}>Select State</Text>
                                            </View>
                                            <FlatList
                                                data={states}
                                                keyExtractor={(item) => item.id}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity 
                                                        style={styles.dropdownItem}
                                                        onPress={() => selectState(item)}
                                                    >
                                                        <Text style={styles.dropdownItemText}>{item.hindi} | {item.english}</Text>
                                                    </TouchableOpacity>
                                                )}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </Modal>
                                
                                {/* District Dropdown */}
                                <Text style={[styles.categoryLabel, {marginTop: HEIGHT * 0.015}]}>DISTRICT</Text>
                                <TouchableOpacity 
                                    style={styles.categoryDropdown}
                                    onPress={toggleDistrictDropdown}
                                >
                                    <Text>{district}</Text>
                                    <Text>▼</Text>
                                </TouchableOpacity>
                                
                                {/* District Dropdown Modal */}
                                <Modal
                                    statusBarTranslucent={true}
                                    visible={showDistrictDropdown}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setShowDistrictDropdown(false)}
                                >
                                    <TouchableOpacity 
                                        style={styles.modalOverlay} 
                                        activeOpacity={1} 
                                        onPress={() => setShowDistrictDropdown(false)}
                                    >
                                        <View style={styles.dropdownContainer}>
                                            <View style={styles.dropdownHeader}>
                                                <TouchableOpacity onPress={() => setShowDistrictDropdown(false)}>
                                                    <Text style={styles.checkmark}>✓</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.dropdownHeaderText}>Select District</Text>
                                            </View>
                                            <FlatList
                                                data={filteredDistricts}
                                                keyExtractor={(item) => item.id}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity 
                                                        style={styles.dropdownItem}
                                                        onPress={() => selectDistrict(item)}
                                                    >
                                                        <Text style={styles.dropdownItemText}>{item.hindi} | {item.english}</Text>
                                                    </TouchableOpacity>
                                                )}
                                                ListEmptyComponent={() => (
                                                    <View style={styles.emptyListContainer}>
                                                        <Text style={styles.emptyListText}>Please select a state first</Text>
                                                    </View>
                                                )}
                                            />
                                        </View>
                                    </TouchableOpacity>
                                </Modal>
                            </View>
                            
                            {/* Submit Button */}
                            <View style={styles.submitButtonContainer}>
                                <CustomBtn 
                                    text="Update Post"
                                    width={WIDTH * 0.85}
                                    onPress={handleUpdatePost}
                                    disabled={editLoading}
                                    loading={editLoading}
                                />
                            </View>
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );

    const renderPendingPostItem = ({ item }) => {
        if (!item) {
            return null;
        }
        
        const { date, time } = formatDateTime(item.submitted_at);
        const contentPreview = getContentPreview(item.content);
        const isVideoContent = item.post_type === "video";
        
        return (
            <View style={[styles.card, item.featured ? styles.featuredCard : null]}>
                {/* Logo Header */}
                <View style={styles.logoHeader}>
                    <Image 
                        source={LOGO} 
                        style={styles.logoImage} 
                        resizeMode="contain"
                    />
                </View>

                {/* Media Content */}
                <View style={styles.mediaContainer}>
                    {renderMediaContent(item)}
                </View>
                
                {/* Content Section */}
                <View style={styles.contentSection}>
                    {/* Title */}
                    <Text style={styles.headlineText} numberOfLines={2}>{item.headline}</Text>
                    
                    {/* Content Preview */}
                    <Text style={styles.contentPreview} numberOfLines={3}>{contentPreview}</Text>
                    
                    {/* Journalist Name */}
                    <Text style={styles.journalistText}>
                        {item.journalist_name || "Journalist"}
                    </Text>
                    
                    {/* Submitted At with Time on the right */}
                    <View style={styles.submittedRow}>
                        <Text style={styles.submittedAtText}>Submitted at: {date}</Text>
                        <Text style={styles.timeText}>{time}</Text>
                    </View>
                    
                    {/* Footer with Content Type and Edit Button */}
                    <View style={styles.cardFooter}>
                        <Text style={[
                            styles.contentTypeText,
                            isVideoContent ? styles.videoContentBadge : styles.standardContentBadge
                        ]}>
                            {isVideoContent ? "Video Content" : "Standard Content"}
                        </Text>
                        <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => handleEditPress(item)}
                        >
                            <Image source={EDIT} style={styles.editIcon} />
                        </TouchableOpacity>
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
                    <Text style={styles.countText}>Pending Posts ({totalPosts})</Text>
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
                        renderItem={renderPendingPostItem}
                        keyExtractor={(item) => {
                            if (!item) return Math.random().toString();
                            return (item.id || Math.random()).toString();
                        }}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No pending posts found</Text>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Edit Modal */}
            {renderEditModal()}

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
        borderColor: '#FDB62D' // Yellow border
    },
    featuredCard: {
        borderColor: 'gold',
        borderWidth: 2,
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
    mediaContainer: {
        width: '100%',
        height: HEIGHT * 0.15
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
    journalistText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSMEDIUM,
        color: BLUE,
        marginBottom: HEIGHT * 0.002
    },
    submittedAtText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        marginBottom: HEIGHT * 0.008
    },
    timeText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginBottom: HEIGHT * 0.008
    },
    submittedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.008,
        width: '100%'
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: HEIGHT * 0.005
    },
    contentTypeText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: WHITE,
        paddingHorizontal: WIDTH * 0.02,
        paddingVertical: HEIGHT * 0.003,
        borderRadius: WIDTH * 0.01
    },
    editButton: {
        padding: WIDTH * 0.005
    },
    editIcon: {
        width: WIDTH * 0.05,
        height: WIDTH * 0.05,
        resizeMode: 'contain'
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
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d0d0d0'
    },
    videoPlaceholderText: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: BLACK
    },
    videoPlaceholderSubtext: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT,
        color: GREY
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
        width: WIDTH * 0.15,
        height: WIDTH * 0.15,
        borderRadius: WIDTH * 0.075,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: WHITE,
    },
    videoContentBadge: {
        backgroundColor: '#9C27B0', // Purple color for video content
    },
    standardContentBadge: {
        backgroundColor: BLUE, // Blue for standard content
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e1e1e1'
    },
    placeholderText: {
        fontSize: WIDTH * 0.08,
        fontFamily: POPPINSMEDIUM,
        color: '#a1a1a1'
    },
    mediaImage: {
        width: '100%',
        height: '100%'
    },
    videoText: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSLIGHT,
        color: BLACK
    },
    modalSafeArea: {
        flex: 1,
        backgroundColor: BLUE,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: WHITE,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: WIDTH * 0.05,
        paddingVertical: HEIGHT * 0.02,
        backgroundColor: BLUE,
    },
    modalTitle: {
        fontSize: WIDTH * 0.045,
        fontFamily: POPPINSMEDIUM,
        color: WHITE,
    },
    closeButton: {
        padding: WIDTH * 0.01,
    },
    closeIcon: {
        width: WIDTH * 0.06,
        height: WIDTH * 0.06,
        resizeMode: 'contain',
        tintColor: WHITE,
    },
    modalContent: {
        padding: WIDTH * 0.05,
        paddingBottom: HEIGHT * 0.1,
    },
    postTypeBadgeContainer: {
        alignItems: 'flex-start',
        marginBottom: HEIGHT * 0.02,
    },
    formGroup: {
        marginBottom: HEIGHT * 0.025,
    },
    sectionTitle: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginVertical: HEIGHT * 0.01,
    },
    titleInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        padding: WIDTH * 0.025,
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        marginBottom: HEIGHT * 0.02,
    },
    fileSelectionContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        overflow: 'hidden',
        marginBottom: HEIGHT * 0.015,
    },
    chooseFileButton: {
        backgroundColor: '#f0f0f0',
        padding: WIDTH * 0.025,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#ccc',
    },
    chooseFileText: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
    },
    fileSelectedText: {
        padding: WIDTH * 0.025,
        fontSize: WIDTH * 0.03,
        color: GREY,
        fontFamily: POPPINSLIGHT,
        flex: 1,
    },
    contentContainer: {
        marginVertical: HEIGHT * 0.02,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        overflow: 'hidden',
    },
    contentTitle: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        padding: WIDTH * 0.025,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#f9f9f9',
    },
    formattingToolbar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: WIDTH * 0.015,
        backgroundColor: '#f9f9f9',
    },
    formatIcon: {
        marginRight: WIDTH * 0.025,
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
    },
    contentEditor: {
        padding: WIDTH * 0.025,
        minHeight: HEIGHT * 0.15,
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        textAlignVertical: 'top',
    },
    categorySection: {
        marginVertical: HEIGHT * 0.02,
    },
    organizeSectionTitle: {
        fontSize: WIDTH * 0.042,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        marginBottom: HEIGHT * 0.01,
    },
    categoryLabel: {
        fontSize: WIDTH * 0.03,
        color: '#666',
        fontFamily: POPPINSMEDIUM,
        marginBottom: HEIGHT * 0.006,
    },
    categoryDropdown: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        padding: WIDTH * 0.02,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontFamily: POPPINSLIGHT,
        marginBottom: HEIGHT * 0.01,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        width: WIDTH * 0.75,
        backgroundColor: '#464646',
        borderRadius: WIDTH * 0.02,
        overflow: 'hidden',
        maxHeight: HEIGHT * 0.5,
    },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: WIDTH * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
    },
    checkmark: {
        fontSize: WIDTH * 0.035,
        color: WHITE,
        marginRight: WIDTH * 0.015,
        fontFamily: POPPINSMEDIUM,
    },
    dropdownHeaderText: {
        fontSize: WIDTH * 0.033,
        color: WHITE,
        fontFamily: POPPINSLIGHT,
    },
    dropdownItem: {
        padding: WIDTH * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
    },
    dropdownItemText: {
        fontSize: WIDTH * 0.033,
        color: WHITE,
        fontFamily: POPPINSLIGHT,
    },
    emptyListContainer: {
        padding: WIDTH * 0.04,
        alignItems: 'center',
    },
    emptyListText: {
        fontSize: WIDTH * 0.033,
        color: WHITE,
        fontFamily: POPPINSLIGHT,
    },
    submitButtonContainer: {
        marginTop: HEIGHT * 0.03,
        marginBottom: HEIGHT * 0.05,
        alignItems: 'center',
    },
    videoPreviewContainer: {
        marginTop: HEIGHT * 0.015,
    },
    previewText: {
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        marginBottom: HEIGHT * 0.01,
    },
    videoThumbnail: {
        width: '100%',
        height: HEIGHT * 0.2,
        borderRadius: WIDTH * 0.02,
    },
    selectedImageContainer: {
        width: '100%',
        height: HEIGHT * 0.2,
        borderRadius: WIDTH * 0.02,
        overflow: 'hidden',
        marginBottom: HEIGHT * 0.015,
    },
    selectedImage: {
        width: '100%',
        height: '100%',
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        padding: WIDTH * 0.025,
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK
    },
    videoFileContainer: {
        marginTop: HEIGHT * 0.01,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        overflow: 'hidden',
        padding: WIDTH * 0.02
    },
    videoFileHelp: {
        marginTop: HEIGHT * 0.01,
        fontSize: WIDTH * 0.03,
        color: GREY,
        fontFamily: POPPINSLIGHT,
        fontStyle: 'italic'
    },
    compactVideoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: WIDTH * 0.02,
        padding: WIDTH * 0.02,
        marginBottom: HEIGHT * 0.01
    },
    currentVideoText: {
        flex: 1,
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: BLACK,
        marginRight: WIDTH * 0.02
    },
    changeVideoButton: {
        backgroundColor: BLUE,
        paddingVertical: HEIGHT * 0.008,
        paddingHorizontal: WIDTH * 0.03,
        borderRadius: WIDTH * 0.01
    },
    changeVideoButtonText: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSMEDIUM,
        color: WHITE
    },
    newVideoText: {
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT,
        color: '#3a9e3a', // green color for new file
        marginBottom: HEIGHT * 0.01
    },
    videoFilename: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSLIGHT,
        color: '#cccccc',
        marginTop: HEIGHT * 0.005,
        maxWidth: WIDTH * 0.7
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
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
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    playButtonText: {
        color: WHITE,
        fontSize: WIDTH * 0.05,
        fontFamily: POPPINSMEDIUM,
    },
});