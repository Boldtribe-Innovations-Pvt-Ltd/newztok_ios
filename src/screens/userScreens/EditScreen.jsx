import React, { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { WHITE, BLACK } from "../../constants/color";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { TextInputComponent } from "../../components/commonComponents/TextInputComponent";
import { NAME, MAIL, PHONE } from "../../constants/imagePath";
import { getStringByKey } from "../../utils/Storage";
import { GETNETWORK, PUTNETWORK } from "../../utils/Network";
import { BASE_URL } from "../../constants/url";
import { ToastMessage } from "../../components/commonComponents/ToastMessage";

export default EditScreen = ({ navigation, route }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState({
        visible: false,
        message: "",
        type: ""
    });

    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        mobile: "",
        createdAt: ""
    });

    const fetchProfileData = async () => {
        try {
            setIsLoading(true);
            const url = `${BASE_URL}api/auth/profile`;
            const token = await getStringByKey('loginResponse');

            if (!token) {
                setToastMessage({
                    visible: true,
                    message: "Please login to view profile",
                    type: "error"
                });
                navigation.goBack();
                return;
            }

            const response = await GETNETWORK(url, true);
            
            if (response?.success && response?.data?.data) {
                setProfileData({
                    username: response.data.data.username,
                    email: response.data.data.email,
                    mobile: response.data.data.mobile,
                    createdAt: response.data.data.createdAt
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            setToastMessage({
                visible: true,
                message: "Failed to fetch profile data",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleUpdate = async () => {
        try {
            setIsLoading(true);
            const url = `${BASE_URL}api/auth/profile`;
            
            const updateData = {
                mobile: profileData.mobile
            };

            const response = await PUTNETWORK(url, updateData, true);
            
            if (response?.success) {
                setToastMessage({
                    visible: true,
                    message: "Profile updated successfully",
                    type: "success"
                });
                // Update the profile in the previous screen
                if (route.params?.updateProfile) {
                    route.params.updateProfile({
                        username: profileData.username,
                        email: profileData.email,
                        mobile: profileData.mobile,
                        createdAt: profileData.createdAt
                    });
                }
                navigation.goBack();
            } else {
                setToastMessage({
                    visible: true,
                    message: response?.message || "Failed to update profile",
                    type: "error"
                });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setToastMessage({
                visible: true,
                message: "Network error occurred",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D31409" />
            </View>
        );
    }

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <MyHeader showLocationDropdown={false} onPressBack={() => navigation.goBack()} />

            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <TextInputComponent
                        placeholder="Username"
                        type="other"
                        inputdata={profileData.username}
                        setInputdata={() => {}}
                        width="100%"
                        keyboardType="default"
                        image={NAME}
                        editable={false}
                    />

                    <View style={{ height: 20 }} />

                    <TextInputComponent
                        placeholder="Email"
                        type="email"
                        inputdata={profileData.email}
                        setInputdata={() => {}}
                        width="100%"
                        keyboardType="email"
                        autoCapitalize="none"
                        image={MAIL}
                        editable={false}
                    />

                    <View style={{ height: 20 }} />

                    <TextInputComponent
                        placeholder="Mobile Number"
                        type="phone"
                        inputdata={profileData.mobile}
                        setInputdata={(value) => setProfileData(prev => ({ ...prev, mobile: value }))}
                        width="100%"
                        keyboardType="phone-pad"
                        image={PHONE}
                        editable={true}
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <CustomBtn 
                        text="Save and Continue" 
                        width="100%" 
                        onPress={handleUpdate}
                        color={WHITE}
                    />
                </View>

                <ToastMessage
                    message={toastMessage.message}
                    visible={toastMessage.visible}
                    setVisible={({ visible }) => setToastMessage(prev => ({ ...prev, visible }))}
                    bacgroundColor={toastMessage.type === "success" ? "green" : "red"}
                    textColor={WHITE}
                    type={toastMessage.type}
                    duration={3000}
                />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: WHITE,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE,
    },
    inputContainer: {
        width: "100%",
        alignItems: "center",
        marginTop: 40,
    },
    buttonContainer: {
        width: "100%",
        alignItems: "center",
        marginTop: 30,
    },
});