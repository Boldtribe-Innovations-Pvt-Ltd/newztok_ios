import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { BLACK, BLUE, RED, WHITE, GRAY } from "../../constants/color";
import { FIRSTNAME, LASTNAME, LOGO, MAIL, NAME, PASWWORD, PHONE, USER } from "../../constants/imagePath";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { POPPINSMEDIUM, POPPINSLIGHT, BOLDMONTSERRAT } from "../../constants/fontPath";
import { HEIGHT, WIDTH } from "../../constants/config";
import { storeObjByKey, storeStringByKey } from "../../utils/Storage";
import { POSTNETWORK } from "../../utils/Network";
import { BASE_URL } from "../../constants/url";

export default SignupScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });
    
    const onNavigateLogin = () => {
        navigation.navigate("LoginScreen");
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Helper function to format the endpoint correctly
    const getEndpointUrl = (endpoint) => {
        // Make sure BASE_URL ends with a slash and endpoint doesn't start with one
        const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/';
        const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        return baseUrl + formattedEndpoint;
    };

    // Generate username suggestions based on the original username
    const generateUsernameSuggestions = (originalUsername) => {
        // Remove any special characters and spaces
        const cleanUsername = originalUsername.replace(/[^a-zA-Z0-9]/g, '');
        
        const suggestions = [
            cleanUsername + Math.floor(Math.random() * 1000), // Add random number
            cleanUsername + '_' + Math.floor(Math.random() * 100), // Add underscore and random number
            cleanUsername + new Date().getFullYear(), // Add current year
            cleanUsername + '_user', // Add _user suffix
            'user_' + cleanUsername, // Add user_ prefix
        ];
        
        return suggestions;
    };

    // Helper function to parse error messages
    const parseErrorMessage = (error) => {
        console.log("Parsing error:", error);
        
        // Check for duplicate username
        if (error?.name === "SequelizeUniqueConstraintError" || 
            error?.original?.sqlMessage?.includes("Duplicate entry") ||
            error?.message?.includes("duplicate") || 
            error?.message?.includes("must be unique")) {
            
            // Check which field is duplicate
            if (error?.fields?.username || 
                error?.errors?.some(e => e.path === "username") || 
                error?.original?.sqlMessage?.includes("username")) {
                
                // Get the duplicate username value
                const duplicateUsername = error?.fields?.username || 
                    error?.errors?.find(e => e.path === "username")?.value || 
                    username;
                
                // Generate suggestions
                const suggestions = generateUsernameSuggestions(duplicateUsername);
                
                // Show alert with suggestions
                setTimeout(() => {
                    Alert.alert(
                        "Username Already Exists",
                        "The username '" + duplicateUsername + "' is already taken. Try one of these instead:",
                        [
                            ...suggestions.map(suggestion => ({
                                text: suggestion,
                                onPress: () => setUsername(suggestion)
                            })),
                            { text: "Cancel", style: 'cancel' }
                        ]
                    );
                }, 100);
                
                return "Username already exists. Please choose a different username.";
            }
            
            if (error?.fields?.email || 
                error?.errors?.some(e => e.path === "email") || 
                error?.original?.sqlMessage?.includes("email")) {
                return "Email already registered. Please use a different email.";
            }
            
            if (error?.fields?.mobile || 
                error?.errors?.some(e => e.path === "mobile") || 
                error?.original?.sqlMessage?.includes("mobile")) {
                return "Phone number already registered. Please use a different number.";
            }
            
            return "Some information you provided is already registered. Please try different details.";
        }
        
        return error?.message || "Registration failed. Please try again.";
    };

    const handleSignup = async () => {
        // Validate fields
        if (!username.trim()) {
            setToastMessage({
                visible: true,
                message: "Please enter your username",
                type: "error"
            });
            return;
        }
        
        if (!email.trim()) {
            setToastMessage({
                visible: true,
                message: "Please enter your email",
                type: "error"
            });
            return;
        }
        
        if (!mobileNumber.trim()) {
            setToastMessage({
                visible: true,
                message: "Please enter your mobile number",
                type: "error"
            });
            return;
        }
        
        if (!password.trim() || password.length < 6) {
            setToastMessage({
                visible: true,
                message: "Please enter a password (min 6 characters)",
                type: "error"
            });
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setToastMessage({
                visible: true,
                message: "Please enter a valid email address",
                type: "error"
            });
            return;
        }
        
        // Username validation - no spaces, only letters, numbers, and simple symbols
        const usernameRegex = /^[a-zA-Z0-9_@.]+$/;
        if (!usernameRegex.test(username.trim())) {
            setToastMessage({
                visible: true,
                message: "Username can only contain letters, numbers, and the symbols _ @ .",
                type: "error"
            });
            return;
        }
        
        // Prepare data for API
        const registrationData = {
            username: username,
            email: email,
            password: password,
            mobile: mobileNumber
        };
        
        setLoading(true);
        
        try {
            // Call registration API
            const endpoint = getEndpointUrl("api/auth/register");
            console.log("Registering user at endpoint:", endpoint);
            console.log("Registration data:", registrationData);
            
            // First try with POSTNETWORK
            try {
                const response = await POSTNETWORK(endpoint, registrationData);
                console.log("Registration API response:", response);
                console.log("Response status:", response?.status);
                console.log("Response success:", response?.success);
                console.log("Response statusCode:", response?.statusCode);
                console.log("Response data:", response?.data);
                
                if (response && (response.status === 'success' || response.success === true || response.statusCode === 201 || response.statusCode === 200)) {
                    // Registration successful
                    setToastMessage({
                        visible: true,
                        message: "Account created successfully! Please login.",
                        type: "success"
                    });
                    
                    // Store user data in AsyncStorage for access in Profile screen
                    const userData = {
                        username: username,
                        email: email,
                        mobile: mobileNumber
                    };
                    
                    // Store the registration data for profile access
                    try {
                        await storeObjByKey('registeredUser', userData);
                        console.log("Stored registration data:", userData);
                    } catch (storageError) {
                        console.log("Error storing registration data:", storageError);
                    }
                    
                    // Clear form
                    setUsername("");
                    setEmail("");
                    setMobileNumber("");
                    setPassword("");
                    
                    // Navigate to Login screen after a short delay
                    setTimeout(() => {
                        navigation.navigate("LoginScreen", { registeredUser: userData });
                    }, 1500);
                } else if (response?.statusCode === 500 || response?.data?.status === 500) {
                    // Special handling for 500 errors - likely database conflicts
                    const errorObj = response?.data?.error || response?.error;
                    const errorMessage = parseErrorMessage(errorObj);
                    
                    setToastMessage({
                        visible: true,
                        message: errorMessage,
                        type: "error"
                    });
                } else if (response && response.success === false && response.message.includes('Network')) {
                    // If POSTNETWORK fails with network error, try direct fetch as fallback
                    console.log("Network error with POSTNETWORK, trying direct fetch...");
                    
                    // Create request headers
                    const myHeaders = new Headers();
                    myHeaders.append("Content-Type", "application/json");
                    myHeaders.append("Accept", "application/json");
                    myHeaders.append("User-Agent", "NewzTok-ReactNative-App");
                    
                    // Create request options
                    const requestOptions = {
                        method: "POST",
                        headers: myHeaders,
                        body: JSON.stringify(registrationData),
                        redirect: "follow"
                    };
                    
                    // Make direct fetch request
                    const fetchResponse = await fetch(endpoint, requestOptions);
                    const responseText = await fetchResponse.text();
                    console.log("Direct fetch response:", responseText);
                    
                    let responseData;
                    try {
                        responseData = JSON.parse(responseText);
                    } catch (e) {
                        responseData = { 
                            success: fetchResponse.ok,
                            message: responseText || `Status: ${fetchResponse.status}`
                        };
                    }
                    
                    if (fetchResponse.ok || responseData.success === true || responseData.status === 'success' || 
                        responseData.statusCode === 201 || responseData.statusCode === 200) {
                        // Registration successful
                        setToastMessage({
                            visible: true,
                            message: "Account created successfully! Please login.",
                            type: "success"
                        });
                        
                        // Store user data in AsyncStorage for access in Profile screen
                        const userData = {
                            username: username,
                            email: email,
                            mobile: mobileNumber
                        };
                        
                        // Store the registration data for profile access
                        try {
                            await storeObjByKey('registeredUser', userData);
                            console.log("Stored registration data:", userData);
                        } catch (storageError) {
                            console.log("Error storing registration data:", storageError);
                        }
                        
                        // Clear form
                        setUsername("");
                        setEmail("");
                        setMobileNumber("");
                        setPassword("");
                        
                        // Navigate to Login screen after a short delay
                        setTimeout(() => {
                            navigation.navigate("LoginScreen", { registeredUser: userData });
                        }, 1500);
                    } else if (responseData?.status === 500) {
                        // Special handling for 500 errors
                        const errorObj = responseData?.error;
                        const errorMessage = parseErrorMessage(errorObj);
                        
                        setToastMessage({
                            visible: true,
                            message: errorMessage,
                            type: "error"
                        });
                    } else {
                        // Handle API error
                        const errorMessage = responseData?.message || 
                                            responseData?.error || 
                                            `Registration failed (${fetchResponse.status}). Please try again.`;
                                            
                        setToastMessage({
                            visible: true,
                            message: errorMessage,
                            type: "error"
                        });
                    }
                } else {
                    // Handle specific API error messages from the original POSTNETWORK call
                    const errorMessage = response?.message || 
                                        response?.error || 
                                        "Registration failed. Please try again.";
                                        
                    setToastMessage({
                        visible: true,
                        message: errorMessage,
                        type: "error"
                    });
                }
            } catch (error) {
                console.error("Error during registration:", error);
                
                // Extract error message if possible
                let errorMessage = "Failed to register. Please check your connection and try again.";
                
                if (error.response && error.response.data) {
                    // Try to get specific error message from API response
                    const errorData = error.response.data;
                    if (errorData.error) {
                        errorMessage = parseErrorMessage(errorData.error);
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    }
                }
                
                setToastMessage({
                    visible: true,
                    message: errorMessage,
                    type: "error"
                });
            }
        } catch (outerError) {
            console.error("Outer error during registration:", outerError);
            setToastMessage({
                visible: true,
                message: "Registration failed. Please try again later.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // Clear toast message after 3 seconds
    useEffect(() => {
        if (toastMessage.visible) {
            const timer = setTimeout(() => {
                setToastMessage({ visible: false, message: "", type: "" });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexContainer}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        <View style={styles.imgContainer}>
                            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
                        </View>

                        {/* Registration Form */}
                        <View style={styles.formContainer}>
                            <TextInputComponent
                                placeholder="Username"
                                type="text"
                                inputdata={username}
                                setInputdata={setUsername}
                                width={WIDTH * 0.78}
                                image={NAME}
                                editable={!loading}
                                autoCapitalize={"none"}
                            />
                            
                            <View style={{ height: HEIGHT * 0.02 }} />
                            
                            <TextInputComponent
                                placeholder="Email"
                                type="email"
                                inputdata={email}
                                setInputdata={setEmail}
                                width={WIDTH * 0.78}
                                image={MAIL}
                                keyboardType="email-address"
                                editable={!loading}
                                autoCapitalize={"none"}
                            />
                            
                            <View style={{ height: HEIGHT * 0.02 }} />
                            
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
                                type="password"
                                inputdata={password}
                                setInputdata={setPassword}
                                width={WIDTH * 0.78}
                                image={PASWWORD}
                                secureTextEntry={!showPassword}
                                showToggle={true}
                                onTogglePress={togglePasswordVisibility}
                                editable={!loading}
                            />
                            
                            <View style={{ height: HEIGHT * 0.03 }} />
                            
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={RED} />
                                </View>
                            ) : (
                                <CustomBtn 
                                    text="Sign Up" 
                                    width={WIDTH * 0.35} 
                                    // height={HEIGHT * 0.06}
                                    // fontSize={WIDTH * 0.04}
                                    onPress={handleSignup}
                                />
                            )}
                        </View>

                        <Text onPress={!loading ? onNavigateLogin : null} style={[styles.registerTxt, loading && styles.disabledText]}>
                            Already have an account? <Text style={styles.loginText}>Login</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

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
        </>
    );
};

const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: WHITE,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: WIDTH * 0.05,
    },
    imgContainer: {
        marginVertical: HEIGHT * 0.04,
        alignItems: "center",
        width: WIDTH * 0.8,
    },
    logoImg: {
        width: WIDTH * 0.5,
        height: HEIGHT * 0.15,
    },
    formContainer: {
        width: "100%",
        alignItems: "center",
    },
    registerTxt: {
        color: BLACK,
        fontSize: WIDTH * 0.04,
        marginTop: HEIGHT * 0.035,
        fontFamily: POPPINSLIGHT,
    },
    loginText: {
        color: RED,
        fontFamily: BOLDMONTSERRAT,
    },
    loadingContainer: {
        height: HEIGHT * 0.06,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledText: {
        opacity: 0.5,
    }
});