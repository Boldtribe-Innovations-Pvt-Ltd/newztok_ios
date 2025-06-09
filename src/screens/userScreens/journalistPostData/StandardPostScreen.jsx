import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Alert } from "react-native";
import { WHITE, BLUE, GREY, BLACK } from "../../../constants/color";
import { HEIGHT, WIDTH } from "../../../constants/config";
import { BOLDMONTSERRAT, POPPINSLIGHT, POPPINSMEDIUM, LORA } from "../../../constants/fontPath";
import { MyStatusBar } from "../../../components/commonComponents/MyStatusBar";
import { MyLoader } from "../../../components/commonComponents/MyLoader";
import { POSTNETWORK } from "../../../utils/Network";
import { BASE_URL } from "../../../constants/url";
import * as ImagePicker from 'react-native-image-picker';
import { ToastMessage } from '../../../components/commonComponents/ToastMessage';
import { storeStringByKey, getStringByKey, getObjByKey } from '../../../utils/Storage';

export default StandardPostScreen = ()=>{
    const [headline, setHeadline] = useState('');
    const [featuredImage, setFeaturedImage] = useState('No file selected');
    const [imageFile, setImageFile] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [content, setContent] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('---------');
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [selectedState, setSelectedState] = useState('बिहार | Bihar');
    const [selectedStateId, setSelectedStateId] = useState('bihar');
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState('---------');
    const [selectedDistrictId, setSelectedDistrictId] = useState(null);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const [toastMessage, setToastMessage] = useState({
        type: '',
        msg: '',
        visible: false
    });
    const contentInputRef = useRef(null);
    
    // Track text selection for formatting
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    // Store the fixed Bearer token on component mount
    useEffect(() => {
        checkToken();
        // Initialize filtered districts with Bihar districts (default state)
        setFilteredDistricts(districts.bihar);
    }, []);
    
    // Function to check token
    const checkToken = async () => {
        try {
            // Check if we already have a token
            const existingToken = await getStringByKey('loginResponse');
            
            // If we have a token, use it instead of storing a new one
            if (existingToken) {
                console.log("Using existing token from storage");
                setHasToken(true);
                return true;
            }
            
            setHasToken(false);
            console.log("Please login to post content");
            setToastMessage({
                type: "error",
                msg: "Please login to post content",
                visible: true
            });
            return false;
        } catch (error) {
            console.error("Error checking/storing token:", error);
            setHasToken(false);
            return false;
        }
    };

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

    const handleChooseFile = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: true,
            maxHeight: 800,
            maxWidth: 800,
            quality: 0.5,
            compressImageQuality: 0.5,
        };

        ImagePicker.launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
                Alert.alert("Error", "An error occurred while selecting the image");
            } else {
                // Get the selected asset
                const asset = response.assets[0];
                console.log("Image selected:", asset.fileName);
                setFeaturedImage(asset.fileName || 'image.jpg');
                setImageFile(asset);
                
                // Store base64 data
                if (asset.base64) {
                    // Check size of base64 data
                    const sizeInBytes = asset.base64.length * 0.75; // Approximate size in bytes
                    const sizeInMB = sizeInBytes / (1024 * 1024);
                    console.log(`Base64 image size: ${sizeInMB.toFixed(2)} MB`);
                    
                    if (sizeInMB > 10) {
                        // If still too large, show warning
                        Alert.alert(
                            "Large Image",
                            "The selected image is very large and may cause upload issues. Consider choosing a smaller image.",
                            [{ text: "OK" }]
                        );
                    }
                    
                    setImageBase64(asset.base64);
                } else {
                    console.log("No base64 data in image response");
                    setImageBase64(null);
                }
            }
        });
    };

    const toggleCategoryDropdown = () => {
        setShowCategoryDropdown(!showCategoryDropdown);
    };

    const selectCategory = (category) => {
        setSelectedCategory(category.name);
        setSelectedCategoryId(category.value);
        setShowCategoryDropdown(false);
    };
    
    const toggleStateDropdown = () => {
        setShowStateDropdown(!showStateDropdown);
    };

    const selectState = (state) => {
        setSelectedState(`${state.hindi} | ${state.english}`);
        setSelectedStateId(state.value);
        setShowStateDropdown(false);
        
        // Update district list based on selected state
        setFilteredDistricts(districts[state.value]);
        
        // Reset district selection when state changes
        setSelectedDistrict('---------');
        setSelectedDistrictId(null);
    };
    
    const toggleDistrictDropdown = () => {
        setShowDistrictDropdown(!showDistrictDropdown);
    };
    
    const selectDistrict = (district) => {
        setSelectedDistrict(`${district.hindi} | ${district.english}`);
        setSelectedDistrictId(district.value);
        setShowDistrictDropdown(false);
    };

    // Handle toolbar item clicks
    const handleToolbarItemPress = (item) => {
        Alert.alert(`${item} Menu`, `You pressed the ${item} menu item`);
    };

    // Handle formatting button presses
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
            case 'undo':
                Alert.alert("Undo", "Undo last action");
                return;
            case 'redo':
                Alert.alert("Redo", "Redo last action");
                return;
            default:
                return;
        }

        newContent = 
            content.substring(0, selection.start) + 
            formattedText + 
            content.substring(selection.end);
        
        setContent(newContent);
    };

    const handleSelectionChange = (event) => {
        setSelection(event.nativeEvent.selection);
    };

    const handleUpgradePress = () => {
        Alert.alert("Upgrade", "Upgrade to premium editor features");
    };

    const handleSubmitPost = async () => {
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

        try {
            setLoading(true);
            
            // Get the stored token using both methods for compatibility
            const loginResponse = await getStringByKey('loginResponse');
            let token = loginResponse;
            
            console.log("Token retrieved:", token ? "Token found" : "No token");
            
            if (!token) {
                setToastMessage({
                    type: "error",
                    msg: "Please login again to post content",
                    visible: true
                });
                setLoading(false);
                return;
            }

            // Use the correct submit endpoint
            const submitUrl = `${BASE_URL}api/news/create`;

            // Create a FormData object for file upload
            const formData = new FormData();
            
            // Add all text fields to FormData
            formData.append('title', headline.trim());
            formData.append('content', content.trim());
            formData.append('category', selectedCategoryId.toString());
            formData.append('state', selectedStateId);
            formData.append('district', selectedDistrictId);
            formData.append('type', imageFile ? 'Standard Content' : 'Text Content');
            formData.append('contentType', imageFile ? 'standard' : 'text');
            
            // Only add featured image if we have a file
            if (imageFile && imageFile.uri) {
                // Create a file object from the imageFile
                const imageFileObj = {
                    uri: imageFile.uri,
                    type: imageFile.type || 'image/jpeg',
                    name: imageFile.fileName || 'image.jpg'
                };
                
                formData.append('featuredImage', imageFileObj);
                console.log("Adding featured image to formData:", imageFileObj.name);
            }

            // Log the post data for debugging
            console.log("Post Data Contents:");
            console.log("Title:", headline.trim());
            console.log("Content:", content.trim());
            console.log("Category:", selectedCategoryId);
            console.log("State:", selectedStateId);
            console.log("District:", selectedDistrictId);
            console.log("Type:", imageFile ? 'Standard Content' : 'Text Content');
            console.log("ContentType:", imageFile ? 'standard' : 'text');
            console.log("Has featured image:", !!imageFile);

            // Use fetch directly with FormData
            const response = await fetch(submitUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type header with FormData, it'll set the correct boundary
                },
                body: formData,
            });
            
            const responseData = await response.json();
            console.log("Raw response from server:", responseData);
            
            if (response.ok && (responseData.success || response.status === 201)) {
                // Success case
                console.log("Image response:", responseData.featuredImage);
                
                // The server should return the image path in a format like:
                // "/uploads/images/featuredImage-1744465108593-808374904.png"
                
                setToastMessage({
                    type: "success",
                    msg: "Your post has been submitted and is pending approval",
                    visible: true
                });
                
                // Reset form
                setHeadline('');
                setContent('');
                setSelectedCategory('---------');
                setSelectedCategoryId(null);
                // Keep selected state as Bihar (default)
                setSelectedDistrict('---------');
                setSelectedDistrictId(null);
                setFeaturedImage('No file selected');
                setImageFile(null);
                setImageBase64(null);
            } else {
                // Error case
                setToastMessage({
                    type: "error",
                    msg: responseData?.message || "Failed to submit post",
                    visible: true
                });
            }
        } catch (error) {
            console.error("Error submitting post:", error);
            setToastMessage({
                type: "error",
                msg: "An unexpected error occurred",
                visible: true
            });
        } finally {
            setLoading(false);
        }
    };

    return(
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <ScrollView>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerTitle}>Submit a Standard Post</Text>
                        <Text style={styles.headerSubtitle}>Submit your news content for approval</Text>
                    </View>

                    {/* Post Title/Headline */}
                    <Text style={styles.sectionTitle}>Post Title/Headline</Text>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Write title here..."
                        value={headline}
                        onChangeText={setHeadline}
                        placeholderTextColor={GREY}
                    />

                    {/* Featured Image */}
                    <Text style={styles.sectionTitle}>Featured Image</Text>
                    <View style={styles.fileSelectionContainer}>
                        <TouchableOpacity 
                            style={styles.chooseFileButton}
                            onPress={handleChooseFile}
                        >
                            <Text style={styles.chooseFileText}>Choose File</Text>
                        </TouchableOpacity>
                        <Text style={styles.fileSelectedText}>{featuredImage}</Text>
                    </View>

                    {/* Content Section */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.contentTitle}>Content</Text>
                        
                        {/* Basic Editor Toolbar */}
                        <View style={styles.editorToolbar}>
                            <TouchableOpacity onPress={() => handleToolbarItemPress("File")}>
                                <Text style={styles.toolbarItem}>File</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleToolbarItemPress("Edit")}>
                                <Text style={styles.toolbarItem}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleToolbarItemPress("View")}>
                                <Text style={styles.toolbarItem}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleToolbarItemPress("Insert")}>
                                <Text style={styles.toolbarItem}>Insert</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleToolbarItemPress("Format")}>
                                <Text style={styles.toolbarItem}>Format</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleToolbarItemPress("Tools")}>
                                <Text style={styles.toolbarItem}>Tools</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgradePress}>
                                <Text style={styles.upgradeText}>⚡ Upgrade</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Formatting Toolbar */}
                        <View style={styles.formattingToolbar}>
                            <TouchableOpacity onPress={() => handleFormatPress('undo')}>
                                <Text style={styles.formatIcon}>↩</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleFormatPress('redo')}>
                                <Text style={styles.formatIcon}>↪</Text>
                            </TouchableOpacity>
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
                        />
                    </View>

                    {/* Category Section */}
                    <View style={styles.categorySection}>
                        <Text style={styles.organizeSectionTitle}>Organize</Text>
                        <Text style={styles.categoryLabel}>CATEGORY</Text>
                        <TouchableOpacity 
                            style={styles.categoryDropdown}
                            onPress={toggleCategoryDropdown}
                        >
                            <Text>{selectedCategory}</Text>
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
                                        <Text style={styles.dropdownHeaderText}>---------</Text>
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
                            <Text>{selectedState}</Text>
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
                                        <Text style={styles.dropdownHeaderText}>---------</Text>
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
                            <Text>{selectedDistrict}</Text>
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
                                        <Text style={styles.dropdownHeaderText}>---------</Text>
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
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity 
                            style={styles.submitButton}
                            onPress={handleSubmitPost}
                            disabled={loading}
                        >
                            <Text style={styles.submitButtonText}>Submit Post</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <ToastMessage
                message={toastMessage.msg}
                visible={toastMessage.visible}
                setVisible={(value) => setToastMessage(prev => ({ ...prev, visible: value.visible }))}
                bacgroundColor={
                    toastMessage.type === "success" ? "green" : 
                    toastMessage.type === "warning" ? "#f59e0b" : "red"
                }
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
            />
            {/* <MyLoader 
                visible={loading}
                backgroundColor="rgba(255, 255, 255, 0.8)"
            /> */}
        </>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.03
    },
    headerContainer: {
        marginBottom: HEIGHT * 0.015
    },
    headerTitle: {
        fontSize: WIDTH * 0.048,
        fontFamily: BOLDMONTSERRAT
    },
    headerSubtitle: {
        fontSize: WIDTH * 0.03,
        color: '#666',
        fontFamily: POPPINSLIGHT
    },
    sectionTitle: {
        fontSize: WIDTH * 0.035,
        fontFamily: BOLDMONTSERRAT,
        marginTop: HEIGHT * 0.015,
        marginBottom: HEIGHT * 0.008
    },
    titleInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: WIDTH * 0.025,
        fontSize: WIDTH * 0.033,
        fontFamily: POPPINSLIGHT
    },
    fileSelectionContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        overflow: 'hidden'
    },
    chooseFileButton: {
        backgroundColor: '#f0f0f0',
        padding: WIDTH * 0.025,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#ccc'
    },
    chooseFileText: {
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSMEDIUM
    },
    fileSelectedText: {
        padding: WIDTH * 0.025,
        fontSize: WIDTH * 0.03,
        color: GREY,
        fontFamily: POPPINSLIGHT
    },
    contentContainer: {
        marginTop: HEIGHT * 0.015,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        overflow: 'hidden'
    },
    contentTitle: {
        fontSize: WIDTH * 0.035,
        fontFamily: BOLDMONTSERRAT,
        padding: WIDTH * 0.025,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc'
    },
    editorToolbar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: WIDTH * 0.015,
        backgroundColor: '#f5f5f5'
    },
    toolbarItem: {
        marginRight: WIDTH * 0.025,
        fontSize: WIDTH * 0.03,
        fontFamily: POPPINSMEDIUM
    },
    upgradeButton: {
        marginLeft: 'auto',
        backgroundColor: '#f0f9ff',
        padding: WIDTH * 0.008,
        borderRadius: 4
    },
    upgradeText: {
        color: BLUE,
        fontSize: WIDTH * 0.03,
        fontFamily: BOLDMONTSERRAT
    },
    formattingToolbar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        padding: WIDTH * 0.015,
        backgroundColor: '#f9f9f9'
    },
    formatIcon: {
        marginRight: WIDTH * 0.025,
        fontSize: WIDTH * 0.035,
        fontFamily: POPPINSMEDIUM
    },
    contentEditor: {
        padding: WIDTH * 0.025,
        minHeight: HEIGHT * 0.12,
        textAlignVertical: 'top',
        fontSize: WIDTH * 0.033,
        fontFamily: LORA
    },
    categorySection: {
        marginTop: HEIGHT * 0.02
    },
    organizeSectionTitle: {
        fontSize: WIDTH * 0.042,
        fontFamily: BOLDMONTSERRAT,
        marginBottom: HEIGHT * 0.01
    },
    categoryLabel: {
        fontSize: WIDTH * 0.03,
        color: '#666',
        fontFamily: POPPINSMEDIUM,
        marginBottom: HEIGHT * 0.006
    },
    categoryDropdown: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: WIDTH * 0.02,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontFamily: POPPINSLIGHT
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dropdownContainer: {
        width: WIDTH * 0.75,
        backgroundColor: '#464646',
        borderRadius: 4,
        overflow: 'hidden',
        maxHeight: HEIGHT * 0.5
    },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: WIDTH * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#555'
    },
    checkmark: {
        fontSize: WIDTH * 0.035,
        color: WHITE,
        marginRight: WIDTH * 0.015,
        fontFamily: POPPINSMEDIUM
    },
    dropdownHeaderText: {
        fontSize: WIDTH * 0.033,
        color: WHITE,
        fontFamily: POPPINSLIGHT
    },
    dropdownItem: {
        padding: WIDTH * 0.02,
        borderBottomWidth: 1,
        borderBottomColor: '#555'
    },
    dropdownItemText: {
        fontSize: WIDTH * 0.033,
        color: WHITE,
        fontFamily: POPPINSLIGHT
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: HEIGHT * 0.02,
        marginBottom: HEIGHT * 0.015
    },
    discardButton: {
        backgroundColor: '#1f2937',
        padding: WIDTH * 0.02,
        borderRadius: 4,
        marginRight: WIDTH * 0.015
    },
    discardButtonText: {
        color: WHITE,
        fontFamily: BOLDMONTSERRAT,
        fontSize: WIDTH * 0.03
    },
    saveDraftButton: {
        backgroundColor: WHITE,
        padding: WIDTH * 0.02,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: BLUE,
        marginRight: WIDTH * 0.015
    },
    saveDraftButtonText: {
        color: BLUE,
        fontFamily: BOLDMONTSERRAT,
        fontSize: WIDTH * 0.03
    },
    submitButton: {
        backgroundColor: BLUE,
        padding: WIDTH * 0.02,
        borderRadius: 4
    },
    submitButtonText: {
        color: WHITE,
        fontFamily: BOLDMONTSERRAT,
        fontSize: WIDTH * 0.03
    }
});