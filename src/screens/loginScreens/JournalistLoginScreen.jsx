import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { BLACK, WHITE } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { JOURNALIST, LOGO, PASWWORD } from "../../constants/imagePath";
import { BASE_URL } from "../../constants/url";
import { POSTNETWORK } from "../../utils/Network";
import { useFocusEffect } from "@react-navigation/native";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { getStringByKey, storeStringByKey, storeObjByKey } from "../../utils/Storage";
import { useDispatch } from "react-redux";
import { WIDTH } from "../../constants/config";
// import { checkuserToken } from "../../redux/actions/auth";

export default JournalistLoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [toastMessage, setToastMessage] = useState({
        type: "",     // success, error, or any other type
        msg: "",      // The message to display
        visible: false // Visibility of the toast
    });
    const [loading, setLoading] = useState(false);

    // Check token expiration on component mount
    useEffect(() => {
        checkTokenExpiration();
    }, []);

    // Function to check if token is expired and refresh if needed
    const checkTokenExpiration = async () => {
        try {
            const storedToken = await getStringByKey('loginResponse');
            
            if (!storedToken) {
                console.log("No token found in storage");
                return false;
            }

            try {
                // Try to parse as JSON first
                const tokenData = JSON.parse(storedToken);
                if (tokenData && tokenData.exp) {
                    const currentTime = Math.floor(Date.now() / 1000);
                    if (tokenData.exp - currentTime < 300) {
                        console.log("Token is expired or about to expire");
                        await storeStringByKey("loginResponse", "");
                        return false;
                    }
                    return true;
                }
            } catch (parseError) {
                // If JSON parsing fails, try to decode as JWT
                try {
                    const tokenParts = storedToken.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        const currentTime = Math.floor(Date.now() / 1000);
                        
                        if (payload.exp && payload.exp - currentTime < 300) {
                            console.log("JWT token is expired or about to expire");
                            await storeStringByKey("loginResponse", "");
                            return false;
                        }
                        return true;
                    }
                } catch (jwtError) {
                    console.log("Invalid token format");
                    await storeStringByKey("loginResponse", "");
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.log("Error checking token expiration:", error.message);
            await storeStringByKey("loginResponse", "");
            return false;
        }
    };

    const onNavigateJournalistMain = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'JournalistMain' }],
        });
    }

    const handlelogin = async () => {
        try {
            setLoading(true);
            const url = `${BASE_URL}api/auth/login`;  // Updated API endpoint
            console.log("Login API URL:", url);
            
            const obj = {
                username: email,
                password: password
            };
            
            console.log("Login attempt with:", email);
            console.log("Request payload:", obj);
            
            const result = await POSTNETWORK(url, obj);
            console.log("Login result status:", result?.success);
            console.log("Login response has token:", !!result?.data?.token);
            
            if (result?.success === true && result?.data) {
                console.log("🔐 AUTH TOKEN RECEIVED:", result.data.token?.substring(0, 15) + "...");
                
                // Store the token in AsyncStorage for app-wide access
                await storeStringByKey("loginResponse", result.data.token);
                console.log("✅ Token stored successfully with key 'loginResponse'");
                
                // Store user role to identify user type
                await storeStringByKey("userRole", result.data.role || "journalist");
                console.log("✅ User role stored as:", result.data.role || "journalist");
                
                // Check for and store refresh token if available
                const refreshToken = result.data.refresh_token || result.data.refresh || null;
                if (refreshToken) {
                    await storeStringByKey("refreshToken", refreshToken);
                    console.log("✅ Refresh token stored successfully");
                }
                
                // Mark user as journalist if role matches
                if (result.data.role === "journalist") {
                    await storeStringByKey("isJournalist", "true");
                    console.log("✅ User marked as journalist: true");
                    
                    // Create complete user data object
                    const userData = {
                        uid: result.data.id || result.data._id || `journalist_${Date.now()}`,
                        username: result.data.username || "",
                        name: result.data.name || "",
                        email: result.data.email || "",
                        mobile: result.data.mobile || "",
                        role: result.data.role || "journalist",
                        token: result.data.token,
                        photoURL: result.data.profile_image || 
                                  `https://ui-avatars.com/api/?name=${result.data.username || "Journalist"}&background=random`,
                    };
                    
                    console.log("📝 User data created:", JSON.stringify({
                        uid: userData.uid.substring(0, 10) + "...",
                        username: userData.username,
                        role: userData.role
                    }));
                    
                    // Store user data in AsyncStorage using storeObjByKey
                    await storeObjByKey("user", userData);
                    console.log("✅ User data stored successfully");
                    
                    // Update Redux store with user data using dispatch
                    dispatch({ type: 'SET_USER', payload: userData });
                    console.log("✅ Redux store updated with SET_USER action");
                    
                    // Update login status in Redux
                    dispatch({ type: 'LOGIN_SUCCESS', payload: result.data.token });
                    console.log("✅ Redux store updated with LOGIN_SUCCESS action");
                    
                    setToastMessage({
                        type: "success",
                        msg: "Login successful",
                        visible: true
                    });
                    
                    // Navigate after a short delay to show toast
                    setTimeout(() => {
                        onNavigateJournalistMain();
                    }, 1000);
                } else {
                    await storeStringByKey("isJournalist", "false");
                    console.log("⚠️ Not a journalist account. Access denied.");
                    
                    setToastMessage({
                        type: "error",
                        msg: "Access denied. Only journalists can access this area.",
                        visible: true
                    });
                }
            } else {
                console.log("❌ Login failed:", result?.message || "Invalid credentials");
                setToastMessage({
                    type: "error",
                    msg: result?.message || "Invalid credentials",
                    visible: true
                });
            }
        } catch (error) {
            console.log("🔴 Login error:", error.message);
            setToastMessage({
                type: "error",
                msg: error.response?.data?.message || "Invalid credentials",
                visible: true
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Helper function for base64 decoding (for JWT parsing)
    const atob = (base64) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = '';
        let i = 0;
        
        base64 = base64.replace(/=+$/, '');
        
        while (i < base64.length) {
            const enc1 = chars.indexOf(base64.charAt(i++));
            const enc2 = chars.indexOf(base64.charAt(i++));
            const enc3 = chars.indexOf(base64.charAt(i++));
            const enc4 = chars.indexOf(base64.charAt(i++));
            
            const chr1 = (enc1 << 2) | (enc2 >> 4);
            const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            const chr3 = ((enc3 & 3) << 6) | enc4;
            
            str += String.fromCharCode(chr1);
            
            if (enc3 !== 64) {
                str += String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                str += String.fromCharCode(chr3);
            }
        }
        
        return str;
    };

    useFocusEffect(
        useCallback(()=>{
            setEmail("");
            setPassword("");
        },[])
    );

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{
                    flex: 1,
                    backgroundColor: WHITE,
                }}
            >
                <ScrollView 
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 20,
                        paddingTop: 0,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={LOGO}
                            style={styles.logo}
                        />
                    </View>

                    <TextInputComponent
                        placeholder="Journalist UserID"
                        inputdata={email}
                        setInputdata={setEmail}
                        width="80%"
                        image={JOURNALIST}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        fontSize={WIDTH * 0.03}
                    />

                    <View style={styles.spacing} />

                    <TextInputComponent
                        placeholder="Journalist Password"
                        inputdata={password}
                        setInputdata={setPassword}
                        width="80%"
                        image={PASWWORD}
                        type="password"
                        fontSize={WIDTH * 0.03}
                    />

                    <View style={styles.spacing} />

                    <CustomBtn
                        text="Login"
                        onPress={handlelogin}
                        width={WIDTH * 0.3}
                        fontSize={WIDTH * 0.03}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
            <ToastMessage
                message={toastMessage.msg}
                visible={toastMessage.visible}
                setVisible={({ visible }) => setToastMessage((prev) => ({ ...prev, visible }))}
                bacgroundColor={toastMessage.type === "success" ? "#4CAF50" : "#F44336"}
                textColor={WHITE}
                type={toastMessage.type}
                duration={3000}
                image={LOGO}
            />
        </>
    );
};

const styles = StyleSheet.create({
    logoContainer: {
        marginBottom: 20,
        marginTop: -30,
    },
    logo: {
        height: 160,
        width: 160,
        marginBottom: 25
    },
    spacing: {
        height: 25,
    },
});