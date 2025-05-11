import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking } from "react-native";
import { BLACK, BLUE, RED, WHITE } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { MOON, RIGHTARROW, SUN } from "../../constants/imagePath";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { storeStringByKey, getStringByKey, getObjByKey } from '../../utils/Storage';
import { BASE_URL } from "../../constants/url";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";
import { LOGO } from "../../constants/imagePath";

export default SettingsScreen = ({ navigation }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isNotificationsOn, setIsNotificationsOn] = useState(false);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: "success"
    });
    const dispatch = useDispatch();

    const onNavigationBack = () => {
        navigation.goBack();
    };

    const showToast = (message, type = "success") => {
        setToastMessage({
            visible: true,
            message,
            type
        });
    };

    const handleLogout = async () => {
        try {
            // Get the auth token
            const userToken = 
                await getStringByKey('userToken') || 
                (await getObjByKey('user'))?.token ||
                await getStringByKey('loginResponse');
            
            if (userToken) {
                try {
                    // Call the logout API
                    const response = await fetch(`${BASE_URL}api/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userToken}`
                        }
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        showToast("Logged out successfully", "success");
                    }
                } catch (error) {
                    console.error("Error calling logout API:", error);
                    // Continue with logout process even if API fails
                }
            }

            // Clear the stored tokens/credentials
            await AsyncStorage.removeItem('loginResponse');
            await AsyncStorage.removeItem('refresh_token');
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('user');

            // Clear from local storage too
            await storeStringByKey("loginResponse", "");
            await storeStringByKey("refresh_token", "");
            await storeStringByKey("userToken", "");

            // Dispatch to redux to update auth state
            dispatch({ type: 'LOGOUT' });

            // Navigate to the Main screen with BottomTabNavigation
            navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }], // Navigate to Main screen with BottomTabNavigation
            });
        } catch (error) {
            console.error("Error during logout:", error);
            showToast("Error during logout", "error");
        }
    };

    const openSupportMail = () => {
        Linking.openURL("mailto:support@boldtribe.in");
    };

    return (
        <>
            {/* Status Bar */}
            <MyStatusBar backgroundColor={WHITE} />

            {/* Header Container */}
            <MyHeader showLocationDropdown={false} onPressBack={onNavigationBack} showLogo={false} showText={true} />

            {/* Main Container */}
            <View style={styles.container}>
                {/* Notification Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.text}>Notification</Text>
                    <TouchableOpacity
                        style={[styles.customSwitch, isNotificationsOn && styles.switchOn]}
                        onPress={() => setIsNotificationsOn(!isNotificationsOn)}
                    >
                        <View
                            style={[
                                styles.switchCircle,
                                isNotificationsOn ? styles.sliderRight : styles.sliderLeft,
                            ]}
                        />
                    </TouchableOpacity>
                </View>

                {/* Dark Mode Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.text}>Dark Mode</Text>
                    <TouchableOpacity
                        style={[styles.customSwitch, isDarkMode && styles.switchOn]}
                        onPress={() => setIsDarkMode(!isDarkMode)}
                    >
                        {/* Sun or Moon Icon */}
                        <View style={[styles.switchCircle, isDarkMode ? styles.sliderRight : styles.sliderLeft]}>
                            <Image source={isDarkMode ? MOON : SUN} style={styles.icon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Block Account Row */}
                <TouchableOpacity style={styles.rowContainer}>
                    <Text style={styles.text}>Block Account</Text>
                    <Image source={RIGHTARROW} style={styles.icon} />
                </TouchableOpacity>

                {/* Horizontal Line */}
                <View style={styles.divider} />

                {/* Terms and Conditions */}
                <TouchableOpacity style={styles.rowContainer}>
                    <Text style={styles.text}>Terms and Conditions</Text>
                </TouchableOpacity>

                {/* Privacy and Policy */}
                <TouchableOpacity style={styles.rowContainer}>
                    <Text style={styles.text}>Privacy and Policy</Text>
                </TouchableOpacity>

                {/* Supporting Mail */}
                <TouchableOpacity style={styles.rowContainer} onPress={openSupportMail}>
                    <Text style={styles.text}>Supporting Mail</Text>
                </TouchableOpacity>

                {/* Rate This App */}
                <TouchableOpacity style={styles.rowContainer}>
                    <Text style={styles.text}>Rate This App</Text>
                </TouchableOpacity>

                {/* Deactivate Account */}
                <TouchableOpacity style={styles.rowContainer}>
                    <Text style={styles.text}>Deactivate Account</Text>
                </TouchableOpacity>

                {/* App Version */}
                <View style={styles.rowContainer}>
                    <Text style={styles.text}>App Version</Text>
                    <Text style={styles.version}>V0.1</Text>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.rowContainer} onPress={handleLogout}>
                    <Text style={styles.text}>Logout</Text>
                </TouchableOpacity>
            </View>
            
            {/* Toast Message */}
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
    container: {
        flex: 1,
        backgroundColor: WHITE,
        padding: 16,
    },
    rowContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16, // Increased gap between rows
    },
    customSwitch: {
        width: 60,
        height: 26,
        backgroundColor: "#ccc",
        borderRadius: 12,
        justifyContent: "center",
        paddingHorizontal: 4,
        position: "relative",
    },
    switchCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: BLACK,
        alignItems: "center",
        justifyContent: "center",
    },
    sliderLeft: {
        position: "absolute",
        left: 2,
    },
    sliderRight: {
        position: "absolute",
        right: 2,
    },
    switchOn: {
        backgroundColor: BLUE,
    },
    text: {
        fontSize: 18, // Increased font size for better readability
        color: BLACK,
    },
    icon: {
        width: 16,
        height: 16,
    },
    email: {
        fontSize: 18,
        color: BLACK,
    },
    version: {
        fontSize: 18,
        color: BLACK,
    },
    divider: {
        height: 1,
        backgroundColor: "#ccc",
        marginVertical: 16, // Increased gap for better separation
    },
});