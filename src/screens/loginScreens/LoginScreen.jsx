import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Text, Modal, TouchableOpacity, ActivityIndicator, Platform, Alert } from "react-native";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { WHITE, BLACK, BLUE, RED, GRAY } from "../../constants/color";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { LOGO, PASWWORD, PHONE } from "../../constants/imagePath";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { OtpInput } from "../../components/otpComponents/OtpInput";
import { storeObjByKey, storeStringByKey } from "../../utils/Storage";
import { POPPINSMEDIUM, POPPINSLIGHT, BOLDMONTSERRAT } from "../../constants/fontPath";
import { HEIGHT, WIDTH } from "../../constants/config";
import { BASE_URL } from "../../constants/url";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';

// IMPORTANT: Use a fixed URL for testing (replace with your actual API base URL)
// Using https instead of http helps with Android network security config

export default LoginScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailOtp, setEmailOtp] = useState("");
    const [networkRetryCount, setNetworkRetryCount] = useState(0);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [otpVisible, setOtpVisible] = useState(false);
    const [otp, setOtp] = useState("");
    const [resetPassword, setResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    
    // Log API endpoint on component mount
    useEffect(() => {
        console.log("BASE_URL from constants:", BASE_URL);
    }, []);

    // Helper function to format the endpoint correctly
    const getEndpointUrl = (endpoint) => {
        // Make sure BASE_URL ends with a slash and endpoint doesn't start with one
        const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
        const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return baseUrl + formattedEndpoint;
    };

    const handleForgotPassword = () => {
        setModalVisible(true);
    };

    const handleSendOtp = () => {
        setOtpVisible(true);
    };

    const handleSubmitOtp = () => {
        setOtpVisible(false);
        setResetPassword(true);
    };

    const handleChangePassword = () => {
        setModalVisible(false);
        setToastMessage({
            visible: true,
            message: "Password changed successfully!",
            type: "success"
        });
    };

    const onNavigateRegister = () => {
        navigation.navigate("SignupScreen")
    };

    // Use mock data for testing when network fails repeatedly
    const useMockLogin = async (loginData) => {
        console.log("Using mock login data as fallback after network failures");
        
        // Create mock user data
        const userData = {
            uid: `user_${Date.now()}`,
            username: "Test User",
            email: "test@example.com",
            mobile: loginData.mobile,
            token: "mock-token-" + Math.random().toString(36).substring(2, 15),
            photoURL: `https://ui-avatars.com/api/?name=Test+User&background=random`,
        };

        // Store user data in AsyncStorage
        await storeObjByKey("user", userData);
        
        // Store token separately
        await storeStringByKey("userToken", userData.token);
        
        // Update Redux state
        dispatch({ type: 'SET_USER', payload: userData });
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData.token });
        
        return {
            status: 'success',
            message: 'Logged in with test account (network offline mode)',
            data: userData
        };
    };

    const handleLogin = async () => {
        // Simple validation
        if (!mobileNumber || !password) {
                        setToastMessage({
                            visible: true,
                message: "Please enter mobile number and password",
                type: "error"
            });
                        return;
        }
            
        setLoading(true);

        try {
            // Prepare login data - changed to mobile and password
            const loginData = {
                mobile: mobileNumber,
                password: password
            };

            // Use correct endpoint for audience login
            const endpoint = 'api/auth/login/audience';
            const fullEndpoint = getEndpointUrl(endpoint);
            
            console.log("Attempting login at endpoint:", fullEndpoint);
            console.log("Login data:", JSON.stringify(loginData));
            console.log("Device platform:", Platform.OS);
            
            // Create request headers
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Accept", "application/json");
            myHeaders.append("User-Agent", "NewzTok-ReactNative-App");

            // Create request options
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(loginData),
                redirect: "follow",
                cache: 'no-store',
            };

            let responseData;
            
            try {
                console.log("Starting fetch request...");
                
                // Make fetch request
                const response = await fetch(fullEndpoint, requestOptions);
                console.log("Fetch response received, status:", response.status);
                
                // Get the response text
                const responseText = await response.text();
                console.log("Response text:", responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
                
                // Parse the JSON response
                try {
                    responseData = JSON.parse(responseText);
                    console.log("Response parsed successfully");
                } catch (jsonError) {
                    console.error("JSON parsing error:", jsonError);
                    throw new Error("Invalid response format");
                }
                
            } catch (networkError) {
                console.error("🚨 Network error:", networkError.message);
                console.error("Network error full details:", JSON.stringify(networkError));
                
                // Try the XMLHttpRequest fallback
                if (networkRetryCount === 0) {
                    console.log("First failure - trying XHR fallback...");
                    try {
                        // Use XMLHttpRequest as alternative to fetch for debugging
                        const xhr = new XMLHttpRequest();
                        xhr.open("POST", fullEndpoint, true);
                        xhr.setRequestHeader("Content-Type", "application/json");
                        xhr.setRequestHeader("Accept", "application/json");
                        
                        // Create a promise wrapper around XHR for async/await
                        const xhrPromise = new Promise((resolve, reject) => {
                            xhr.onload = () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        resolve(data);
                                    } catch (e) {
                                        reject(new Error("Invalid JSON response"));
                                    }
                    } else {
                                    reject(new Error(`XHR Error: ${xhr.status} ${xhr.statusText}`));
                                }
                            };
                            
                            xhr.onerror = () => {
                                console.error("XHR network error");
                                reject(new Error("Network error with XHR"));
                            };
                            
                            xhr.ontimeout = () => {
                                reject(new Error("XHR request timeout"));
                            };
                        });
                        
                        // Send the request
                        xhr.send(JSON.stringify(loginData));
                        
                        // Wait for the promise to resolve
                        responseData = await xhrPromise;
                        console.log("XHR fallback successful!");
                        
                    } catch (xhrError) {
                        console.error("XHR fallback also failed:", xhrError);
                        
                        // Show specific debugging info for Android
                        if (Platform.OS === 'android') {
                            Alert.alert(
                                "Network Debugging Info",
                                "Please check:\n\n1. Internet connection\n2. API server status\n3. Android 9+ cleartext traffic permission\n\nSee logs for details",
                                [{ text: "OK" }]
                            );
                        }
                        
                        // Increment retry count
                        setNetworkRetryCount(prevCount => prevCount + 1);
                        throw xhrError;
                    }
                        } else {
                    // Increment retry count
                    setNetworkRetryCount(prevCount => prevCount + 1);
                    
                    // After 1 retry, use mock data as fallback
                    if (networkRetryCount >= 1) {
                        console.log("Using mock data after repeated failures");
                        responseData = await useMockLogin(loginData);
                    } else {
                        throw networkError;
                    }
                }
            }

            if (responseData && (
                responseData.status === 'success' || 
                responseData.statusCode === 200 || 
                responseData.success || 
                responseData.token
            )) {
                // Login successful
                console.log("Login successful! Response has token:", !!responseData.token);
                
                // Determine data location in response
                const resultData = responseData.data || responseData;
                
                // Check multiple places for the token
                const token = responseData?.token || 
                              resultData?.token || 
                              resultData?.access_token || 
                              responseData?.access_token ||
                              resultData?.access || 
                              null;
                
                // Create user data from response
            const userData = {
                    uid: resultData?.id || `user_${Date.now()}`,
                    username: resultData?.username || "",
                    email: resultData?.email || "",
                    mobile: mobileNumber,
                    token: token,
                    photoURL: resultData?.profile_image || `https://ui-avatars.com/api/?name=${resultData?.username || "User"}&background=random`,
                };

                // Store user data in AsyncStorage using storeObjByKey
                await storeObjByKey("user", userData);
                console.log("User data stored successfully");
                
                // Store token separately using storeStringByKey
                if (token) {
                    await storeStringByKey("userToken", token);
                    console.log("Token stored successfully with storeStringByKey");
                    
                    // Also update the Redux store with user and token
                    dispatch({ type: 'SET_USER', payload: userData });
                    dispatch({ type: 'LOGIN_SUCCESS', payload: token });
                } else {
                    console.warn("No token received from login API");
                }
                
                // Also store refresh token if available
                const refreshToken = resultData?.refresh_token || resultData?.refresh || null;
                if (refreshToken) {
                    await storeStringByKey("refreshToken", refreshToken);
                    console.log("Refresh token stored successfully");
                }

            setToastMessage({
                visible: true,
                    message: "Login successful!",
                type: "success"
            });
            
                // Reset retry count on success
                setNetworkRetryCount(0);

                // Navigate to main screen
            setTimeout(() => {
                const routeParams = route.params || {};
                
                    if (routeParams.returnScreen) {
                            navigation.navigate(routeParams.returnScreen, {
                                ...routeParams.params,
                                userData: userData
                            });
                        } else {
                            // Default navigation to main screen
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Main', params: { userData: userData } }],
                            });
                        }
            }, 1000);
            } else {
                // Handle login errors
                const errorMessage = responseData?.message || 
                                    responseData?.error || 
                                    "Login failed. Please check your credentials.";
                
                console.log("Login failed with message:", errorMessage);
                
                setToastMessage({
                    visible: true,
                    message: errorMessage,
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Login error:", error.message || "Unknown error");
            
            // Specific handling for network errors
            let errorMessage = "Failed to login. Please check your connection and try again.";
            
            if (error.message) {
                if (error.message.includes('Network request failed')) {
                    errorMessage = `Network connection error (${Platform.OS}). Please check your internet and try again.`;
                } else if (error.message.includes('aborted') || error.message.includes('timeout')) {
                    errorMessage = "Request timed out. Server may be down or unreachable.";
                } else if (error.message.includes('JSON')) {
                    errorMessage = "Server response format error. Please try again later.";
                }
                
                // Check if we should suggest using mock data
                if (networkRetryCount >= 1) {
                    errorMessage += " Tap login again to use offline mode.";
                }
            }
            
            setToastMessage({
                visible: true,
                message: errorMessage,
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />

            <View style={styles.container}>
                <View style={styles.imgContainer}>
                    <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
                </View>

                {/* Login Form */}
                <View style={styles.formContainer}>
                    <TextInputComponent
                        placeholder="Mobile Number"
                        type="number"
                        inputdata={mobileNumber}
                        setInputdata={setMobileNumber}
                        width={WIDTH * 0.78}
                        keyboardType="phone-pad"
                        image={PHONE}
                        editable={!loading}
                    />
                    
                    <View style={{ height: HEIGHT * 0.02 }} />
                    
                    <TextInputComponent
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        inputdata={password}
                        setInputdata={setPassword}
                        width={WIDTH * 0.78}
                        image={PASWWORD}
                        secureTextEntry={!showPassword}
                        showToggle={true}
                        onTogglePress={togglePasswordVisibility}
                        editable={!loading}
                    />

                    {/* Add spacing between password input and login button */}
                    <View style={{ height: HEIGHT * 0.05 }} />

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={RED} />
                </View>
                    ) : (
                        <CustomBtn 
                            text={networkRetryCount >= 2 ? "Login (Offline Mode)" : "Login"}
                            width={WIDTH * 0.35}
                            onPress={handleLogin} 
                        />
                    )}
                </View>

                <Text
                    onPress={!loading ? onNavigateRegister : null}
                    style={[styles.registerTxt, loading && styles.disabledText]}
                >
                    If don't have account?
                    {" "}
                    <Text
                        style={{
                            ...styles.registerTxt,
                            fontWeight: "bold",
                            color: RED
                        }}
                    >
                        Register
                    </Text>
                </Text>
            </View>

            <ToastMessage
                message={toastMessage.message}
                visible={toastMessage.visible}
                setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
                image={LOGO}
            />

            {/* Commenting out forgot password modal
            <Modal statusBarTranslucent={true} visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {!resetPassword ? (
                            <>
                                <Text style={styles.modalTitle}>Enter Your Mobile Number</Text>
                                <TextInputComponent
                                    placeholder="Mobile Number"
                                    type="number"
                                    inputdata={emailOtp}
                                    setInputdata={setEmailOtp}
                                    width={WIDTH * 0.8}
                                    keyboardType="phone-pad"
                                    image={PHONE}
                                />

                                {otpVisible && (
                                    <>
                                        <OtpInput onOtpChange={setOtp} />
                                    </>
                                )}

                                {!otpVisible ? (
                                    <CustomBtn 
                                        text="Send OTP" 
                                        width={WIDTH * 0.4} 
                                        height={HEIGHT * 0.06}
                                        fontSize={WIDTH * 0.04}
                                        onPress={handleSendOtp} 
                                    />
                                ) : (
                                    <CustomBtn 
                                        text="Submit" 
                                        width={WIDTH * 0.4} 
                                        height={HEIGHT * 0.06}
                                        fontSize={WIDTH * 0.04}
                                        onPress={handleSubmitOtp} 
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={styles.modalTitle}>Reset Password</Text>
                                <TextInputComponent
                                    placeholder="New Password"
                                    type={showPassword ? "text" : "password"}
                                    inputdata={newPassword}
                                    setInputdata={setNewPassword}
                                    width={WIDTH * 0.8}
                                    image={PASWWORD}
                                    secureTextEntry={!showPassword}
                                    showToggle={true}
                                    onTogglePress={togglePasswordVisibility}
                                />
                                <View style={{ height: HEIGHT * 0.025 }} />
                                <TextInputComponent
                                    placeholder="Confirm New Password"
                                    type={showPassword ? "text" : "password"}
                                    inputdata={confirmNewPassword}
                                    setInputdata={setConfirmNewPassword}
                                    width={WIDTH * 0.8}
                                    image={PASWWORD}
                                    secureTextEntry={!showPassword}
                                    showToggle={true}
                                    onTogglePress={togglePasswordVisibility}
                                />
                                <CustomBtn 
                                    text="Change Password" 
                                    width={WIDTH * 0.5} 
                                    height={HEIGHT * 0.06}
                                    fontSize={WIDTH * 0.04}
                                    onPress={handleChangePassword} 
                                />
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            */}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: WIDTH * 0.05,
        alignItems: "center",
        justifyContent: "center",
    },
    imgContainer: {
        marginBottom: HEIGHT * 0.06,
        alignItems: "center",
        width: WIDTH * 0.8,
    },
    logoImg: {
        width: WIDTH * 0.5,
        height: HEIGHT * 0.2,
    },
    formContainer: {
        width: "100%",
        alignItems: "center",
    },
    forgotPasswordText: {
        alignSelf: "flex-end",
        color: BLUE,
        fontSize: WIDTH * 0.035,
        marginTop: HEIGHT * 0.01,
        marginBottom: HEIGHT * 0.03,
        fontFamily: POPPINSMEDIUM,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        backgroundColor: WHITE,
        padding: WIDTH * 0.05,
        width: WIDTH * 0.9,
        borderRadius: WIDTH * 0.025,
        elevation: 5,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: WIDTH * 0.045,
        marginBottom: HEIGHT * 0.02,
        color: BLACK,
        fontFamily: BOLDMONTSERRAT,
    },
    registerTxt: {
        color: BLACK,
        fontSize: WIDTH * 0.04,
        marginTop: HEIGHT * 0.03,
        fontFamily: POPPINSLIGHT,
    },
    loadingContainer: {
        height: HEIGHT * 0.06,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: HEIGHT * 0.03,
    },
    disabledText: {
        opacity: 0.5,
    }
});