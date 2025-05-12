import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Alert,
    PermissionsAndroid,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    AsyncStorage,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { BLACK, BLUE, WHITE, RED } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { NOTSAVE, PERSON, SAVE, EDIT, LOGO } from "../../constants/imagePath";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { MyAlert } from "../../components/commonComponents/MyAlert";
import { HEIGHT, WIDTH } from "../../constants/config";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { getObjByKey, getStringByKey, storeObjByKey, getGoogleAuthData, decodeJWT } from "../../utils/Storage";
import { GETNETWORK } from "../../utils/Network";
import { BASE_URL } from "../../constants/url";

export default ProfileScreen = ({ route, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profileImage, setProfileImage] = useState(PERSON);
    const [alertVisible, setAlertVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });

    const fetchProfileData = async () => {
        try {
            setIsLoading(true);
            const url = `${BASE_URL}api/auth/profile`;
            console.log("1. Starting profile fetch from URL:", url);

            // Get the stored token
            const token = await getStringByKey('loginResponse');
            console.log("2. Retrieved token:", token ? "Token exists" : "No token found");
            
            if (!token) {
                console.log("3. Error: No authentication token found");
                setIsLoading(false);
                return;
            }

            console.log("4. Making API call with GETNETWORK...");
            // Make the API call with GETNETWORK
            const response = await GETNETWORK(url, true);
            console.log("5. API Response:", JSON.stringify(response, null, 2));

            if (response?.success && response?.data?.data) {
                console.log("6. Success response received");
                // Format the data from the API response, accessing the nested data structure
                const formattedData = {
                    username: response.data.data.username,
                    email: response.data.data.email,
                    mobile: response.data.data.mobile,
                    createdAt: response.data.data.createdAt
                };
                
                console.log("7. Formatted profile data:", JSON.stringify(formattedData, null, 2));
                
                setUserData(formattedData);
                // Store the updated user data
                await storeObjByKey('user', formattedData);
                console.log("8. Data stored in AsyncStorage");
            } else {
                console.log("9. Error in API response:", {
                    success: response?.success,
                    message: response?.message,
                    data: response?.data
                });
                setToastMessage({
                    visible: true,
                    message: response?.message || "Failed to fetch profile data",
                    type: "error"
                });
            }
        } catch (error) {
            console.log("10. Error caught in fetchProfileData:", {
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            setToastMessage({
                visible: true,
                message: "Network error occurred",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleEditProfile = () => {
        try {
            if (userData) {
                navigation.navigate("EditScreen", {
                    username: userData.username,
                    email: userData.email,
                    mobile: userData.mobile,
                    token: userData.token,
                    updateProfile: (updatedData) => {
                        setUserData(prev => ({ ...prev, ...updatedData }));
                    }
                });
            } else {
                navigateToLogin();
            }
        } catch (error) {
            console.error("Navigation error:", error);
            setToastMessage({
                visible: true,
                message: "Unable to navigate to edit screen. Please try again.",
                type: "error"
            });
        }
    };

    const requestPermissions = async () => {
        try {
            const cameraPermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA
            );
            const storagePermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            return cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
                   storagePermission === PermissionsAndroid.RESULTS.GRANTED;
        } catch (error) {
            console.error("Permission request error:", error);
            return false;
        }
    };

    const handleOpenCamera = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            setAlertVisible(false);
            return;
        }

        launchCamera(
            { mediaType: "photo", saveToPhotos: true },
            (response) => {
                if (!response.didCancel && !response.errorCode) {
                    const uri = response.assets[0].uri;
                    setProfileImage({ uri });
                }
            }
        );
    };

    const handleChooseFromFile = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
            setAlertVisible(false);
            return;
        }

        launchImageLibrary({ mediaType: "photo" }, (response) => {
            if (!response.didCancel && !response.errorCode) {
                const uri = response.assets[0].uri;
                setProfileImage({ uri });
            }
        });
    };

    const handleImagePress = () => {
        if (userData) {
            setAlertVisible(true);
        } else {
            navigation.navigate("LoginSignup");
        }
    };

    const navigateToLogin = () => {
        try {
            navigation.navigate("LoginSignup");
        } catch (error) {
            console.error("Navigation error:", error);
            setToastMessage({
                visible: true,
                message: "Unable to navigate to login screen. Please try again.",
                type: "error"
            });
        }
    };

    const showToast = (message, type = "success") => {
        setToastMessage({
            visible: true,
            message,
            type
        });
    };

    const renderGuestProfile = () => {
        return (
            <View style={styles.guestContainer}>
                <Image source={PERSON} style={styles.guestImage} />
                <Text style={styles.guestTitle}>Welcome to NewzTok</Text>
                <Text style={styles.guestSubtitle}>
                    Sign in to access your profile, save articles, and personalize your news experience
                </Text>
                <TouchableOpacity 
                    style={styles.loginButton}
                    onPress={navigateToLogin}
                >
                    <Text style={styles.loginButtonText}>Login / Sign up</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderUserProfile = () => {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity onPress={handleImagePress}>
                            <Image source={profileImage} style={styles.profileImage} />
                        </TouchableOpacity>
                    </View>
                    <CustomBtn
                        text="Edit Profile"
                        onPress={handleEditProfile}
                        style={styles.editButton}
                        textStyle={styles.editButtonText}
                        color={WHITE}
                    />
                    <View style={styles.userInfoContainer}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>User Name:</Text>
                            <Text style={styles.infoValue}>{userData?.username || "Not set"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>{userData?.email || "Not set"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mobile Number:</Text>
                            <Text style={styles.infoValue}>{userData?.mobile || "Not set"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Registered At:</Text>
                            <Text style={styles.infoValue}>
                                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Not available"}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    if (isLoading) {
        return (
            <>
                <MyStatusBar backgroundColor={WHITE} />
                <MyHeader showLocationDropdown={false} showBackButton={false} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#D31409" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} showBackButton={false} />
            
            {userData ? renderUserProfile() : renderGuestProfile()}

            <ToastMessage
                message={toastMessage.message}
                visible={toastMessage.visible}
                setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                bacgroundColor={toastMessage.type == "success" ? "green" : "red"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
            />

            <MyAlert
                visible={alertVisible}
                title="Choose an option"
                message="How would you like to update your profile picture?"
                textLeft="Open Camera"
                textRight="Choose from File"
                backgroundColor={BLUE}
                color={WHITE}
                borderRadius={WIDTH * 0.025}
                onPressLeft={handleOpenCamera}
                onPressRight={handleChooseFromFile}
                onRequestClose={() => setAlertVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: WHITE
    },
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE,
    },
    loadingText: {
        marginTop: HEIGHT * 0.02,
        fontSize: WIDTH * 0.035,
        color: BLACK,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: HEIGHT * 0.05,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: HEIGHT * 0.02,
    },
    profileImage: {
        width: WIDTH * 0.3,
        height: WIDTH * 0.3,
        borderRadius: WIDTH * 0.15,
        borderWidth: 2,
        borderColor: '#FFA500',
    },
    userInfoContainer: {
        width: '100%',
        paddingHorizontal: WIDTH * 0.05,
        marginTop: HEIGHT * 0.03,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: HEIGHT * 0.015,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    infoLabel: {
        fontSize: WIDTH * 0.04,
        fontWeight: '500',
        color: BLACK,
        fontFamily: 'POPPINSMEDIUM',
    },
    infoValue: {
        fontSize: WIDTH * 0.04,
        color: '#666',
        fontFamily: 'POPPINSLIGHT',
    },
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: WIDTH * 0.06,
    },
    guestImage: {
        width: WIDTH * 0.35,
        height: WIDTH * 0.35,
        borderRadius: WIDTH * 0.175,
        marginBottom: HEIGHT * 0.03,
        backgroundColor: '#F5F5F5',
    },
    guestTitle: {
        fontSize: WIDTH * 0.055,
        fontWeight: 'bold',
        color: BLACK,
        marginBottom: HEIGHT * 0.02,
        textAlign: 'center',
    },
    guestSubtitle: {
        fontSize: WIDTH * 0.035,
        color: BLACK,
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: HEIGHT * 0.05,
        lineHeight: HEIGHT * 0.028,
    },
    loginButton: {
        backgroundColor: '#D31409',
        paddingVertical: HEIGHT * 0.015,
        paddingHorizontal: WIDTH * 0.1,
        borderRadius: WIDTH * 0.02,
    },
    loginButtonText: {
        color: WHITE,
        fontSize: WIDTH * 0.04,
        fontWeight: '500',
    },
    editButton: {
        marginTop: HEIGHT * 0.02,
        marginBottom: HEIGHT * 0.03,
        width: WIDTH * 0.4,
        height: HEIGHT * 0.06,
        backgroundColor: '#D31409',
        borderRadius: WIDTH * 0.02,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButtonText: {
        color: WHITE,
        fontSize: WIDTH * 0.04,
        fontWeight: '500',
    },
});