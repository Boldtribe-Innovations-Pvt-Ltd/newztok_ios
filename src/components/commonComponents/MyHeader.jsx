import React, { useState, useEffect } from "react";
import { Image, StyleSheet, View, Pressable, Text, Modal, TouchableOpacity, PermissionsAndroid, Platform, StatusBar, ActivityIndicator, ScrollView } from "react-native";
import { BLACK, BLUE, WHITE } from "../../constants/color";
import { LOGO, BACK, SETTINGS, LOGO1, LOGO2 } from "../../constants/imagePath";
import Geolocation from 'react-native-geolocation-service';
import LinearGradient from 'react-native-linear-gradient';
import { POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MyHeader = ({
    backgroundColor = WHITE,
    height = 80,
    showLogo = true,
    showBackButton = true,
    showSettings = false,
    showText = false,
    isLoggedIn = false,
    showLocationDropdown = true,
    showDistrictLocation = false,
    onPressBack = () => {},
    onPressSettings = () => {},
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [districtModalVisible, setDistrictModalVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
    const [districts, setDistricts] = useState([]);
    const [locations, setLocations] = useState([
        { hindi: "बिहार", english: "Bihar" },
        { hindi: "झारखंड", english: "Jharkhand" },
        { hindi: "उत्तर प्रदेश", english: "Uttar Pradesh" }
    ]);
    const [allStates, setAllStates] = useState([]);

    // Define districts with Hindi and English names
    const districtData = {
        odisha: [
            { hindi: "अंगुल", english: "Angul" },
            { hindi: "बलांगीर", english: "Balangir" },
            { hindi: "बालासोर", english: "Balasore" },
            { hindi: "बरगढ़", english: "Bargarh" },
            { hindi: "भद्रक", english: "Bhadrak" },
            { hindi: "बौध", english: "Boudh" },
            { hindi: "कटक", english: "Cuttack" },
            { hindi: "देवगढ़", english: "Deogarh" },
            { hindi: "ढेंकानाल", english: "Dhenkanal" },
            { hindi: "गजपति", english: "Gajapati" },
            { hindi: "गंजाम", english: "Ganjam" },
            { hindi: "जगतसिंहपुर", english: "Jagatsinghpur" },
            { hindi: "जाजपुर", english: "Jajpur" },
            { hindi: "झारसुगुड़ा", english: "Jharsuguda" },
            { hindi: "कलाहांडी", english: "Kalahandi" },
            { hindi: "कंधमाल", english: "Kandhamal" },
            { hindi: "केंद्रपाड़ा", english: "Kendrapara" },
            { hindi: "केंदुझर", english: "Kendujhar" },
            { hindi: "खोर्धा", english: "Khordha" },
            { hindi: "कोरापुट", english: "Koraput" },
            { hindi: "मलकानगिरी", english: "Malkangiri" },
            { hindi: "मयूरभंज", english: "Mayurbhanj" },
            { hindi: "नबरंगपुर", english: "Nabarangpur" },
            { hindi: "नयागढ़", english: "Nayagarh" },
            { hindi: "नुआपाड़ा", english: "Nuapada" },
            { hindi: "पुरी", english: "Puri" },
            { hindi: "रायगड़ा", english: "Rayagada" },
            { hindi: "संबलपुर", english: "Sambalpur" },
            { hindi: "सुबर्णपुर", english: "Subarnapur" },
            { hindi: "सुंदरगढ़", english: "Sundargarh" }
        ],
        jharkhand: [
            { hindi: "रांची", english: "Ranchi" },
            { hindi: "जमशेदपुर", english: "Jamshedpur" },
            { hindi: "धनबाद", english: "Dhanbad" },
            { hindi: "बोकारो", english: "Bokaro" },
            { hindi: "देवघर", english: "Deoghar" },
            { hindi: "हजारीबाग", english: "Hazaribagh" },
            { hindi: "गिरिडीह", english: "Giridih" },
            { hindi: "कोडरमा", english: "Koderma" },
            { hindi: "चतरा", english: "Chatra" },
            { hindi: "गुमला", english: "Gumla" },
            { hindi: "लातेहार", english: "Latehar" },
            { hindi: "लोहरदगा", english: "Lohardaga" },
            { hindi: "पाकुड़", english: "Pakur" },
            { hindi: "पलामू", english: "Palamu" },
            { hindi: "रामगढ़", english: "Ramgarh" },
            { hindi: "साहिबगंज", english: "Sahibganj" },
            { hindi: "सिमडेगा", english: "Simdega" },
            { hindi: "सिंहभूम", english: "Singhbhum" },
            { hindi: "सरायकेला खरसावां", english: "Seraikela Kharsawan" },
            { hindi: "पूर्वी सिंहभूम", english: "East Singhbhum" },
            { hindi: "पश्चिमी सिंहभूम", english: "West Singhbhum" },
            { hindi: "दुमका", english: "Dumka" },
            { hindi: "गढ़वा", english: "Garhwa" },
            { hindi: "गोड्डा", english: "Godda" }
        ],
        bihar: [
            { hindi: "पटना", english: "Patna" },
            { hindi: "गया", english: "Gaya" },
            { hindi: "मुंगेर", english: "Munger" },
            { hindi: "भागलपुर", english: "Bhagalpur" },
            { hindi: "पूर्णिया", english: "Purnia" },
            { hindi: "दरभंगा", english: "Darbhanga" },
            { hindi: "मुजफ्फरपुर", english: "Muzaffarpur" },
            { hindi: "सहरसा", english: "Saharsa" },
            { hindi: "सीतामढ़ी", english: "Sitamarhi" },
            { hindi: "वैशाली", english: "Vaishali" },
            { hindi: "सिवान", english: "Siwan" },
            { hindi: "सारण", english: "Saran" },
            { hindi: "गोपालगंज", english: "Gopalganj" },
            { hindi: "बेगूसराय", english: "Begusarai" },
            { hindi: "समस्तीपुर", english: "Samastipur" },
            { hindi: "मधुबनी", english: "Madhubani" },
            { hindi: "सुपौल", english: "Supaul" },
            { hindi: "अररिया", english: "Araria" },
            { hindi: "किशनगंज", english: "Kishanganj" },
            { hindi: "कटिहार", english: "Katihar" },
            { hindi: "पूर्वी चंपारण", english: "East Champaran" },
            { hindi: "पश्चिमी चंपारण", english: "West Champaran" },
            { hindi: "शिवहर", english: "Sheohar" },
            { hindi: "मधेपुरा", english: "Madhepura" },
            { hindi: "अरवल", english: "Arwal" },
            { hindi: "औरंगाबाद", english: "Aurangabad" },
            { hindi: "बांका", english: "Banka" },
            { hindi: "भोजपुर", english: "Bhojpur" },
            { hindi: "बक्सर", english: "Buxar" },
            { hindi: "जमुई", english: "Jamui" },
            { hindi: "जहानाबाद", english: "Jehanabad" },
            { hindi: "कैमूर", english: "Kaimur" },
            { hindi: "खगड़िया", english: "Khagaria" },
            { hindi: "लखीसराय", english: "Lakhisarai" },
            { hindi: "नालंदा", english: "Nalanda" },
            { hindi: "नवादा", english: "Nawada" },
            { hindi: "रोहतास", english: "Rohtas" },
            { hindi: "शेखपुरा", english: "Sheikhpura" }
        ],
        "uttar pradesh": [
            { hindi: "लखनऊ", english: "Lucknow" },
            { hindi: "कानपुर", english: "Kanpur" },
            { hindi: "आगरा", english: "Agra" },
            { hindi: "वाराणसी", english: "Varanasi" },
            { hindi: "प्रयागराज", english: "Prayagraj" },
            { hindi: "मेरठ", english: "Meerut" },
            { hindi: "नोएडा", english: "Noida" },
            { hindi: "गाजियाबाद", english: "Ghaziabad" },
            { hindi: "बरेली", english: "Bareilly" },
            { hindi: "अलीगढ़", english: "Aligarh" },
            { hindi: "मुरादाबाद", english: "Moradabad" },
            { hindi: "सहारनपुर", english: "Saharanpur" },
            { hindi: "गोरखपुर", english: "Gorakhpur" },
            { hindi: "फैजाबाद", english: "Faizabad" },
            { hindi: "जौनपुर", english: "Jaunpur" },
            { hindi: "मथुरा", english: "Mathura" },
            { hindi: "बलिया", english: "Ballia" },
            { hindi: "रायबरेली", english: "Rae Bareli" },
            { hindi: "सुल्तानपुर", english: "Sultanpur" },
            { hindi: "फतेहपुर", english: "Fatehpur" },
            { hindi: "प्रतापगढ़", english: "Pratapgarh" },
            { hindi: "कौशाम्बी", english: "Kaushambi" },
            { hindi: "झांसी", english: "Jhansi" },
            { hindi: "ललितपुर", english: "Lalitpur" },
            { hindi: "अम्बेडकर नगर", english: "Ambedkar Nagar" },
            { hindi: "अमेठी", english: "Amethi" },
            { hindi: "अमरोहा", english: "Amroha" },
            { hindi: "औरैया", english: "Auraiya" },
            { hindi: "अयोध्या", english: "Ayodhya" },
            { hindi: "आजमगढ़", english: "Azamgarh" },
            { hindi: "बागपत", english: "Baghpat" },
            { hindi: "बहराइच", english: "Bahraich" },
            { hindi: "बलरामपुर", english: "Balrampur" },
            { hindi: "बांदा", english: "Banda" },
            { hindi: "बाराबंकी", english: "Barabanki" },
            { hindi: "बस्ती", english: "Basti" },
            { hindi: "भदोही", english: "Bhadohi" },
            { hindi: "बिजनौर", english: "Bijnor" },
            { hindi: "बदायूं", english: "Budaun" },
            { hindi: "बुलंदशहर", english: "Bulandshahr" },
            { hindi: "चंदौली", english: "Chandauli" },
            { hindi: "चित्रकूट", english: "Chitrakoot" },
            { hindi: "देवरिया", english: "Deoria" },
            { hindi: "एटा", english: "Etah" },
            { hindi: "इटावा", english: "Etawah" },
            { hindi: "फर्रुखाबाद", english: "Farrukhabad" },
            { hindi: "फिरोजाबाद", english: "Firozabad" },
            { hindi: "गौतम बुद्ध नगर", english: "Gautam Buddha Nagar" },
            { hindi: "गाजीपुर", english: "Ghazipur" },
            { hindi: "गोंडा", english: "Gonda" },
            { hindi: "हमीरपुर", english: "Hamirpur" },
            { hindi: "हापुड़", english: "Hapur" },
            { hindi: "हरदोई", english: "Hardoi" },
            { hindi: "हाथरस", english: "Hathras" },
            { hindi: "जालौन", english: "Jalaun" },
            { hindi: "कन्नौज", english: "Kannauj" },
            { hindi: "कानपुर देहात", english: "Kanpur Dehat" },
            { hindi: "कानपुर नगर", english: "Kanpur Nagar" },
            { hindi: "कासगंज", english: "Kasganj" },
            { hindi: "खीरी", english: "Kheri" },
            { hindi: "कुशीनगर", english: "Kushinagar" },
            { hindi: "महोबा", english: "Mahoba" },
            { hindi: "महराजगंज", english: "Mahrajganj" },
            { hindi: "मैनपुरी", english: "Mainpuri" },
            { hindi: "मऊ", english: "Mau" },
            { hindi: "मिर्जापुर", english: "Mirzapur" },
            { hindi: "मुजफ्फरनगर", english: "Muzaffarnagar" },
            { hindi: "पीलीभीत", english: "Pilibhit" },
            { hindi: "रामपुर", english: "Rampur" },
            { hindi: "संभल", english: "Sambhal" },
            { hindi: "संत कबीर नगर", english: "Sant Kabir Nagar" },
            { hindi: "शाहजहांपुर", english: "Shahjahanpur" },
            { hindi: "शामली", english: "Shamli" },
            { hindi: "श्रावस्ती", english: "Shrawasti" },
            { hindi: "सिद्धार्थनगर", english: "Siddharthnagar" },
            { hindi: "सीतापुर", english: "Sitapur" },
            { hindi: "सोनभद्र", english: "Sonbhadra" },
            { hindi: "उन्नाव", english: "Unnao" }
        ]
    };

    const fetchStates = async () => {
        try {
            // Define the three states we want to show
            const priorityStates = [
                { hindi: "बिहार", english: "Bihar" },
                { hindi: "झारखंड", english: "Jharkhand" },
                { hindi: "उत्तर प्रदेश", english: "Uttar Pradesh" }
            ];

            // Set the locations directly to our priority states
            setLocations(priorityStates);
            
            // Add timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(
                'https://nominatim.openstreetmap.org/search?format=json&country=india&featuretype=state&limit=100',
                {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'NewzTok/1.0'
                    }
                }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('Failed to fetch states');
            }
            
            const data = await response.json();
            
            // Map all states from API for geolocation matching
            const allStates = data.map(state => ({
                hindi: state.display_name.split(',')[0].trim(),
                english: state.display_name.split(',')[0].trim()
            }));

            // Store all states in a separate state variable for geolocation
            setAllStates(allStates);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('States request timed out');
            } else {
                console.warn('Error fetching states:', {
                    message: error.message,
                    type: error.name
                });
            }
            // Keep only priority states if API fails
            setLocations([
                { hindi: "बिहार", english: "Bihar" },
                { hindi: "झारखंड", english: "Jharkhand" },
                { hindi: "उत्तर प्रदेश", english: "Uttar Pradesh" }
            ]);
        }
    };

    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'ios') {
                const auth = await Geolocation.requestAuthorization('whenInUse');
                if (auth === 'granted') {
                    setLocationPermissionGranted(true);
                    getCurrentLocation();
                } else {
                    setIsLoading(false);
                    setSelectedLocation('Location access denied');
                }
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'This app needs access to your location.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setLocationPermissionGranted(true);
                    getCurrentLocation();
                } else {
                    setIsLoading(false);
                    setSelectedLocation('Location access denied');
                }
            }
        } catch (err) {
            console.warn(err);
            setIsLoading(false);
            setSelectedLocation('Error getting location');
        }
    };

    const getCurrentLocation = () => {
        setIsLoading(true);
        Geolocation.getCurrentPosition(
            async (position) => {
                try {
                    // Add timeout to the fetch request
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=en&zoom=8`,
                        {
                            headers: {
                                'User-Agent': 'NewzTok/1.0'
                            },
                            signal: controller.signal
                        }
                    );
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data && data.address) {
                        let stateName = data.address.state;
                        let districtName = data.address.county || data.address.city_district || data.address.district;
                        
                        if (stateName) {
                            stateName = stateName.trim();
                            const stateObj = locations.find(loc => 
                                loc.english.toLowerCase() === stateName.toLowerCase() ||
                                loc.hindi === stateName
                            );
                            if (stateObj) {
                                setSelectedLocation(stateObj.english);
                            } else {
                                setSelectedLocation(stateName);
                            }
                            
                            if (districtName) {
                                districtName = districtName.trim();
                                setSelectedDistrict(districtName);
                            }
                            
                            await fetchDistricts(stateName);
                        } else {
                            setSelectedLocation('State not found');
                        }
                    } else {
                        setSelectedLocation('Location not found');
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.warn('Location request timed out');
                        setSelectedLocation('Location request timed out');
                    } else {
                        console.warn('Error getting location:', {
                            message: error.message,
                            type: error.name
                        });
                        setSelectedLocation('Location not available');
                    }
                } finally {
                    setIsLoading(false);
                }
            },
            (error) => {
                console.warn('Geolocation error:', {
                    code: error.code,
                    message: error.message
                });
                setSelectedLocation('Location not available');
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const fetchDistricts = async (state) => {
        try {
            console.log('Starting to fetch districts for state:', state);
            setIsLoading(true);

            // Check for predefined districts
            const stateKey = state.toLowerCase();
            if (districtData[stateKey]) {
                console.log(`Using predefined districts for ${state}`);
                setDistricts(districtData[stateKey]);
                setIsLoading(false);
                return;
            }

            // For other states, use the API
            const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&country=india&state=${encodeURIComponent(state)}&featuretype=city&limit=100`;
            console.log('Fetching from URL:', apiUrl);

            const response = await fetch(
                apiUrl,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'NewzTok/1.0'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && Array.isArray(data)) {
                const uniqueDistricts = [...new Set(data.map(item => {
                    if (item.address) {
                        return {
                            hindi: item.address.county || item.address.city_district || item.address.district || item.address.city,
                            english: item.address.county || item.address.city_district || item.address.district || item.address.city
                        };
                    }
                    return null;
                }).filter(Boolean))];
                
                uniqueDistricts.sort((a, b) => a.english.localeCompare(b.english));
                
                if (uniqueDistricts.length > 0) {
                    setDistricts(uniqueDistricts);
                    
                    if (selectedDistrict && !uniqueDistricts.some(d => d.english === selectedDistrict)) {
                        setSelectedDistrict(null);
                    }
                } else {
                    console.warn('No districts found for state:', state);
                    setDistricts([]);
                }
            } else {
                console.warn('Invalid response format for state:', state);
                setDistricts([]);
            }
        } catch (error) {
            console.warn('Error fetching districts:', {
                state,
                message: error.message,
                type: error.name
            });
            setDistricts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationSelect = async (location) => {
        setSelectedLocation(location.english);
        setModalVisible(false);
        
        // Store selected location in AsyncStorage
        try {
            await AsyncStorage.setItem('selectedLocation', location.english);
            console.log('Stored location in AsyncStorage:', location.english);
        } catch (error) {
            console.error('Error storing location:', error);
        }
        
        // Reset selected district when state changes
        setSelectedDistrict(null);
        
        // Fetch districts for selected state
        fetchDistricts(location.english);
        
        // Set default district based on state
        const stateKey = location.english.toLowerCase();
        if (stateKey === 'jharkhand') {
            setSelectedDistrict('Ranchi');
        } else if (stateKey === 'bihar') {
            setSelectedDistrict('Patna');
        } else if (stateKey === 'uttar pradesh') {
            setSelectedDistrict('Lucknow');
        }
        
        // Show district modal after state selection
        if (showDistrictLocation) {
            setDistrictModalVisible(true);
        }
    };

    const handleDistrictSelect = (district) => {
        setSelectedDistrict(district.english);
        setDistrictModalVisible(false);
        console.log('Selected district:', district);
        
        // Store selected district in AsyncStorage
        try {
            AsyncStorage.setItem('selectedDistrict', district.english);
            console.log('Stored district in AsyncStorage:', district.english);
        } catch (error) {
            console.error('Error storing district:', error);
        }
    };

    const renderLocationContent = () => {
        if (isLoading) {
            return (
                <View style={styles.locationLoadingContainer}>
                    <ActivityIndicator size="small" color={BLACK} />
                </View>
            );
        }
        return (
            <View style={styles.locationContainer}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.locationText}>
                    {selectedLocation}
                </Text>
            </View>
        );
    };

    const renderRightSection = () => {
        if (!showSettings && !showDistrictLocation) return null;

        return (
            <View style={styles.rightSection}>
                {showDistrictLocation && selectedLocation && (
                    <Pressable 
                        style={styles.districtBox}
                        onPress={() => {
                            // Ensure districts are fetched before showing modal
                            if (districts.length === 0) {
                                fetchDistricts(selectedLocation);
                            }
                            setDistrictModalVisible(true);
                        }}
                    >
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.districtText}>
                            {selectedDistrict || 'Select District'}
                        </Text>
                    </Pressable>
                )}
                {showSettings && (
                    <Pressable style={styles.settingsButton} onPress={onPressSettings}>
                        <Image style={styles.settingsIcon} source={SETTINGS} />
                    </Pressable>
                )}
            </View>
        );
    };

    // Add useEffect to initialize selected location from AsyncStorage
    useEffect(() => {
        const initializeLocation = async () => {
            try {
                const storedLocation = await AsyncStorage.getItem('selectedLocation');
                if (storedLocation) {
                    console.log('Retrieved stored location:', storedLocation);
                    setSelectedLocation(storedLocation);
                    fetchDistricts(storedLocation);
                }
            } catch (error) {
                console.error('Error retrieving stored location:', error);
            }
        };

        initializeLocation();
    }, []);

    useEffect(() => {
        fetchStates(); // Fetch states when component mounts
        requestLocationPermission();
    }, []);

    return (
        <View style={[
            styles.container, 
            { 
                height: height + (Platform.OS === 'ios' ? 47 : StatusBar.currentHeight || 0),
                paddingTop: Platform.OS === 'ios' ? 47 : StatusBar.currentHeight || 0
            }
        ]}>
            {/* Black diagonal gradient from top-right */}
            <LinearGradient
                colors={["#000000", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.3)", "transparent"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0.5 }}
                style={styles.blackGradient}
            />
            
            {/* Central white diagonal strip */}
            <LinearGradient
                colors={["transparent", "#FFFFFF", "transparent"]}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.6 }}
                locations={[0.2, 0.5, 0.8]}
                style={styles.whiteStrip}
            />
            
            {/* Red diagonal gradient from bottom-left */}
            <LinearGradient
                colors={["#D21008", "rgba(210,16,8,0.8)", "rgba(210,16,8,0.3)", "transparent"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.redGradient}
            />

            <View style={styles.innerContainer}>
                {/* Left Section */}
                <View style={styles.leftSection}>
                    {/* Back Button */}
                    {showBackButton && (
                        <Pressable style={styles.backButton} onPress={onPressBack}>
                            <Image style={styles.backIcon} source={BACK} />
                        </Pressable>
                    )}

                    {/* Location Dropdown */}
                    {showLocationDropdown && (
                        <Pressable 
                            style={[styles.locationBox, isLoading && styles.locationBoxLoading]} 
                            onPress={() => !isLoading && setModalVisible(true)}
                        >
                            {renderLocationContent()}
                        </Pressable>
                    )}
                </View>

                {/* Middle Section - Logo */}
                <View style={styles.middleSection}>
                    {showText ? (
                        <Text style={styles.settingsText}>Settings</Text>
                    ) : (
                        showLogo && <Image style={styles.logoImg} source={LOGO2} />
                    )}
                </View>

                {/* Right Section with District and Settings */}
                <View style={styles.rightSection}>
                    {showDistrictLocation && selectedLocation && (
                        <Pressable 
                            style={styles.districtBox}
                            onPress={() => {
                                // Ensure districts are fetched before showing modal
                                if (districts.length === 0) {
                                    fetchDistricts(selectedLocation);
                                }
                                setDistrictModalVisible(true);
                            }}
                        >
                            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.districtText}>
                                {selectedDistrict || 'Select District'}
                            </Text>
                        </Pressable>
                    )}
                    {showSettings && (
                        <Pressable style={styles.settingsButton} onPress={onPressSettings}>
                            <Image style={styles.settingsIcon} source={SETTINGS} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* State Selection Modal */}
            <Modal statusBarTranslucent={true} onRequestClose={()=>setModalVisible(false)} visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        {locations.map((location, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[
                                    styles.option,
                                    selectedLocation === location.english && styles.selectedOption
                                ]} 
                                onPress={() => handleLocationSelect(location)}
                            >
                                <View style={styles.locationOptionContainer}>
                                    <Text style={[
                                        styles.optionText,
                                        selectedLocation === location.english && styles.selectedOptionText
                                    ]}>{location.hindi}</Text>
                                    <Text style={[
                                        styles.optionSubText,
                                        selectedLocation === location.english && styles.selectedOptionText
                                    ]}>{location.english}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* District Selection Modal */}
            <Modal statusBarTranslucent={true} onRequestClose={()=>setDistrictModalVisible(false)} visible={districtModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select District</Text>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={BLUE} />
                                <Text style={styles.loadingText}>Loading districts...</Text>
                            </View>
                        ) : districts.length > 0 ? (
                            <ScrollView style={styles.districtsList}>
                                {districts.map((district, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[
                                            styles.option,
                                            selectedDistrict === district.english && styles.selectedOption
                                        ]} 
                                        onPress={() => handleDistrictSelect(district)}
                                    >
                                        <View style={styles.locationOptionContainer}>
                                            <Text style={[
                                                styles.optionText,
                                                selectedDistrict === district.english && styles.selectedOptionText
                                            ]}>{district.hindi}</Text>
                                            <Text style={[
                                                styles.optionSubText,
                                                selectedDistrict === district.english && styles.selectedOptionText
                                            ]}>{district.english}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.noDistrictsText}>No districts available</Text>
                        )}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setDistrictModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        elevation: 3,
        position: 'relative',
        overflow: 'hidden',
    },
    blackGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.8,
    },
    whiteStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
    },
    redGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.8,
    },
    innerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        paddingHorizontal: 15,
        position: 'relative',
        zIndex: 1,
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    backButton: {
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    backIcon: {
        height: 24,
        width: 24,
        resizeMode: "contain",
    },
    locationBox: {
        padding: 4,
        paddingHorizontal: 8,
        backgroundColor: WHITE,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 5,
        maxWidth: 100,
    },
    locationText: {
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
        fontSize: 11,
        numberOfLines: 1,
        ellipsizeMode: 'tail',
    },
    middleSection: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        zIndex: -1,
    },
    logoImg: {
        height: 80,
        width: 80,
        resizeMode: "contain",
    },
    settingsText: {
        fontSize: 20,
        fontFamily: POPPINSMEDIUM,
        color: BLACK,
        textAlign: "center",
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
    },
    districtBox: {
        padding: 3,
        paddingHorizontal: 6,
        backgroundColor: WHITE,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: BLUE,
        maxWidth: 80,
    },
    districtText: {
        color: BLUE,
        fontFamily: POPPINSMEDIUM,
        fontSize: 10,
        numberOfLines: 1,
        ellipsizeMode: 'tail',
    },
    settingsButton: {
        justifyContent: "center",
        alignItems: "center",
        height: 40,
        width: 40,
        padding: 8,
    },
    settingsIcon: {
        height: 24,
        width: 24,
        resizeMode: "contain",
        tintColor: WHITE,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalBox: {
        backgroundColor: WHITE,
        padding: 20,
        borderRadius: 10,
        width: 250,
        alignItems: "center",
    },
    option: {
        padding: 10,
        width: "100%",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
    },
    locationOptionContainer: {
        alignItems: 'center',
        width: '100%',
    },
    optionText: {
        fontSize: 18,
        fontFamily: POPPINSMEDIUM,
    },
    optionSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
        fontFamily: POPPINSLIGHT,
    },
    closeButton: {
        marginTop: 10,
        backgroundColor: BLUE,
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: WHITE,
        fontFamily: POPPINSMEDIUM,
    },
    locationLoadingContainer: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 30,
    },
    locationBoxLoading: {
        opacity: 0.7,
    },
    selectedOption: {
        backgroundColor: '#f0f0f0',
    },
    selectedOptionText: {
        color: BLUE,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: POPPINSMEDIUM,
        marginBottom: 15,
        color: BLACK,
    },
    noDistrictsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginVertical: 20,
        fontFamily: POPPINSLIGHT,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        fontFamily: POPPINSLIGHT,
    },
    districtsList: {
        width: '100%',
        maxHeight: 300,
    },
});