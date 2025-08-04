import React, { useEffect, useRef, useState } from "react";
// import { BLACK, BRANDCOLOR, WHITE } from "../../constants/color";
// import { COMICS, COMICSBOLD } from "../../constants/fontPath";
import { Animated, Modal, Pressable, Text, View, StyleSheet, Linking, BackHandler } from "react-native";
import { IOSVersion, ForceUpdate } from "../../constants/versionControll";
import { BASE_URL } from "../../constants/url";
import { GETNETWORK } from "../../utils/Network";
import { BLACK, BLUE, WHITE } from "../../constants/color";
import { POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";

export const UpdateAlert = ({
    visible = false,
    isVisible = false, // Support both visible and isVisible props
    forceUpdate = false,
    title = "Update Available", // Title Prop
    message = "A new version of the app is available. Please update to continue.",
    forceMessage = "Alert!! You need to update, if not the app will not work....",
    textRight = "Update",
    textLeft = "Cancel",
    textMiddle = "Update",
    backgroundColor = WHITE,
    color = BLACK,
    // fontFamily = COMICSBOLD,
    fontWeight = "",
    fontSize = 16,
    borderRadius = 10,
    onRequestClose = () => { },
    onPressRight = () => {
        console.log("Updating...");
    },
    onPressLeft = () => {
        console.log("Cancel Update");
    },
    onPressMiddle = () => {
        console.log("Force Update Started.....");
    }
}) => {
    // Use either visible or isVisible prop (isVisible takes precedence)
    const shouldBeVisible = isVisible || visible;
    const [modalVisible, setModalVisible] = useState(shouldBeVisible);
    const [isForceUpdate, setIsForceUpdate] = useState(true); // Always force update
    const [apiForceUpdate, setApiForceUpdate] = useState(false); // Force update from API
    const [latestVersion, setLatestVersion] = useState("");
    const [changeLog, setChangeLog] = useState("");
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (shouldBeVisible) {
            setModalVisible(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setModalVisible(false));
        }
    }, [shouldBeVisible]);

    useEffect(() => {
        checkAppVersion();
        // checkForceUpdate(); // Commented out - using API response instead
    }, []);

    // Handle back button to prevent closing the modal when force update is active
    useEffect(() => {
        const handleBackPress = () => {
            if (modalVisible) {
                if (apiForceUpdate || isForceUpdate) {
                    // Prevent back button from closing the modal when force update is active
                    console.log("🚫 Back button pressed - FORCE UPDATE ACTIVE, modal cannot be closed");
                    return true; // Return true to prevent default back action
                } else {
                    console.log("📱 Back button pressed - force update not active, allowing back action");
                    return false; // Allow back button to work normally
                }
            }
            return false; // Allow normal back button behavior when modal is not visible
        };

        if (modalVisible) {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
            return () => backHandler.remove();
        }
    }, [modalVisible, apiForceUpdate, isForceUpdate]);

    // Handle update button press - redirect to App Store
    const handleUpdatePress = async () => {
        try {
            // Call the provided onPressMiddle callback first
            if (onPressMiddle && typeof onPressMiddle === 'function') {
                onPressMiddle();
            }
            
            const appStoreUrl = 'https://apps.apple.com/in/app/newztok/id6746141322'; // Replace with actual App Store ID
            console.log("Opening App Store URL:", appStoreUrl);
            
            const supported = await Linking.canOpenURL(appStoreUrl);
            if (supported) {
                await Linking.openURL(appStoreUrl);
                console.log("Successfully opened App Store");
            } else {
                console.error("Cannot open App Store URL");
                // Fallback - try to open in browser
                await Linking.openURL(appStoreUrl);
            }
        } catch (error) {
            console.error("Error opening App Store:", error);
        }
    };

    const checkAppVersion = async () => {
        setLoading(true);
        try {
            const url = `${BASE_URL}api/versions/ios`;
            console.log("Checking iOS version at:", url);
            
            const result = await GETNETWORK(url);
            console.log("Version check result:", result);
            
            if (result?.statusCode === 200 || result?.success) {
                const versionData = result?.data || result;
                
                // Handle nested response structure - check if data is under 'version' key
                let versionInfo = versionData;
                if (versionData?.version) {
                    versionInfo = versionData.version;
                    console.log("Found nested version data:", versionInfo);
                }
                
                // Extract latestVersion, changeLog, and forceUpdate from response - ensure they are strings
                let fetchedLatestVersion = versionInfo?.latestVersion || versionInfo?.latest_version || versionInfo?.version;
                let fetchedChangeLog = versionInfo?.changeLog || versionInfo?.change_log || versionInfo?.changelog;
                let fetchedForceUpdate = versionInfo?.forceUpdate || versionInfo?.force_update || false;
                
                // Convert to string if they are objects
                if (typeof fetchedLatestVersion === 'object') {
                    fetchedLatestVersion = fetchedLatestVersion?.version || fetchedLatestVersion?.number || "Unknown";
                }
                if (typeof fetchedChangeLog === 'object') {
                    fetchedChangeLog = fetchedChangeLog?.description || fetchedChangeLog?.text || "Update includes bug fixes and improvements.";
                }
                
                // Fallback to default strings
                fetchedLatestVersion = fetchedLatestVersion || "Unknown";
                fetchedChangeLog = fetchedChangeLog || "Update includes bug fixes and improvements.";
                
                // Ensure they are strings
                fetchedLatestVersion = String(fetchedLatestVersion);
                fetchedChangeLog = String(fetchedChangeLog);
                
                setLatestVersion(fetchedLatestVersion);
                setChangeLog(fetchedChangeLog);
                setApiForceUpdate(fetchedForceUpdate);
                
                console.log("================== VERSION UPDATE INFO ==================");
                console.log("📱 Current Version:", IOSVersion);
                console.log("🆕 Latest Version:", fetchedLatestVersion);
                console.log("📝 Change Log:", fetchedChangeLog);
                console.log("🔒 Force Update (API):", fetchedForceUpdate);
                console.log("🔍 Version comparison:", {
                    current: IOSVersion,
                    latest: fetchedLatestVersion,
                    isDifferent: fetchedLatestVersion !== IOSVersion,
                    isValidLatest: fetchedLatestVersion && fetchedLatestVersion !== "Unknown",
                    forceUpdate: fetchedForceUpdate
                });
                console.log("======================================================");
                
                // Compare with current version - only show modal if update is needed
                if (IOSVersion && 
                    fetchedLatestVersion && 
                    fetchedLatestVersion !== "Unknown" && 
                    fetchedLatestVersion !== IOSVersion) {
                    
                    setModalVisible(true);
                    setIsForceUpdate(true);
                    console.log("✅ UPDATE REQUIRED: Current version", IOSVersion, "-> Latest version", fetchedLatestVersion);
                    console.log("🔄 Setting modal visible to true");
                } else {
                    setModalVisible(false);
                    if (!IOSVersion) {
                        console.log("❌ No current version configured - hiding update modal");
                    } else if (fetchedLatestVersion === IOSVersion) {
                        console.log("✅ App is up-to-date:", IOSVersion);
                    } else if (fetchedLatestVersion === "Unknown") {
                        console.log("❌ Invalid latest version received - hiding modal");
                    } else {
                        console.log("❌ App is up-to-date or no valid version found.");
                    }
                    console.log("🔄 Setting modal visible to false");
                }
            } else {
                console.log("Failed to fetch version data - hiding modal");
                // Don't show modal if API fails - app can continue working
                setModalVisible(false);
            }
        } catch (error) {
            console.error("Failed to check iOS version:", error);
            // Don't show modal if API fails - app can continue working
            setModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    // const checkForceUpdate = () => {
    //     if (ForceUpdate) {
    //         const url = `${BASE_URL}api/versions/ios`;
    //         GETNETWORK(url)
    //             .then((result) => {
    //                 if (result?.statusCode === 200) {
    //                     setIsForceUpdate(false);
    //                 } else {
    //                     setIsForceUpdate(true);
    //                 }
    //             })
    //             .catch((error) => {
    //                 setIsForceUpdate(true);
    //                 console.error("Failed to check for force update:", error);
    //             });
    //     }
    // };

    // Debug Modal visibility conditions
    const modalShouldShow = shouldBeVisible && modalVisible && !loading;
    console.log("🔍 UpdateAlert Modal Visibility Debug:", {
        shouldBeVisible,
        modalVisible,
        loading,
        finalVisibility: modalShouldShow,
        IOSVersion,
        latestVersion,
        changeLog,
        apiForceUpdate,
        isForceUpdate
    });

    return (
        <Modal
            transparent={true}
            visible={modalShouldShow}
            onRequestClose={() => {
                // Prevent modal from closing when force update is active
                if (apiForceUpdate || isForceUpdate) {
                    console.log("🚫 Modal close attempted via back button/system - FORCE UPDATE ACTIVE, modal cannot be closed");
                    // Don't call parent onRequestClose when force update is active
                    return false;
                } else {
                    console.log("📱 Modal close attempted via back button/system - allowing close");
                    if (onRequestClose && typeof onRequestClose === 'function') {
                        onRequestClose();
                    }
                    return true;
                }
            }}
            statusBarTranslucent={true}
        >
            <Pressable 
                style={styles.centeredView}
                onPress={() => {
                    // Prevent modal from closing when touching outside if force update is active
                    if (apiForceUpdate || isForceUpdate) {
                        console.log("🚫 Outside touch detected - FORCE UPDATE ACTIVE, modal cannot be closed");
                    } else {
                        console.log("📱 Outside touch detected - force update not active, allowing interaction");
                    }
                    // Do nothing - modal behavior depends on force update status
                }}
            >
                <Pressable 
                    style={[styles.modalView, { backgroundColor }]}
                    onPress={(e) => {
                        // Prevent event bubbling to parent Pressable
                        e.stopPropagation();
                        console.log("📱 Modal content touched - interaction allowed");
                    }}
                >
                    {/* Title */}
                    <Text allowFontScaling={false} style={[styles.modalTitle, { color, fontFamily: POPPINSMEDIUM, fontSize: fontSize + 4 }]}>
                        {title}
                    </Text>

                    {/* Change Log Message - Show First */}
                    <Text allowFontScaling={false} style={[styles.modalMessage, { color, fontFamily: POPPINSLIGHT, fontSize: fontSize }]}>
                        {changeLog || (isForceUpdate ? forceMessage : message)}
                    </Text>

                    {/* Latest Version Display - Show After ChangeLog */}
                    {latestVersion && latestVersion !== "Unknown" && (
                        <Text allowFontScaling={false} style={[styles.versionText, { color: BLUE, fontFamily: POPPINSMEDIUM, fontSize: fontSize }]}>
                            Latest Update: {latestVersion}
                        </Text>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {!isForceUpdate && ForceUpdate !== "1" && !apiForceUpdate && (
                            <Pressable 
                                style={styles.buttonLeft} 
                                onPress={() => {
                                    console.log("Cancel button pressed");
                                    // Only allow cancel if force update is not active
                                    if (!apiForceUpdate && !isForceUpdate) {
                                        console.log("✅ Cancel allowed - calling parent onPressLeft");
                                        // Call the provided onPressLeft callback
                                        if (onPressLeft && typeof onPressLeft === 'function') {
                                            onPressLeft();
                                        }
                                    } else {
                                        console.log("🚫 Cancel blocked - FORCE UPDATE ACTIVE, not calling parent callback");
                                    }
                                }}
                            >
                                <Text allowFontScaling={false} style={styles.textStyle}>{textLeft}</Text>
                            </Pressable>
                        )}
                        <Pressable
                            style={styles.buttonRight}
                            onPress={handleUpdatePress}
                            disabled={loading}
                        >
                            <Text allowFontScaling={false} style={styles.textStyle}>
                                {loading ? "Checking..." : textRight}
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

// Styling for the modal
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalView: {
        width: 350,
        height: 280,
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: "center",
        color: BLACK,
    },
    modalMessage: {
        marginBottom: 15,
        textAlign: "center",
        color: BLACK,
        paddingHorizontal: 10,
        lineHeight: 22,
    },
    versionText: {
        marginBottom: 20,
        textAlign: "center",
        color: BLUE,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 60,
        marginTop: 20,
    },
    buttonLeft: {
        marginRight: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: BLUE,
        width: 90
    },
    buttonRight: {
        marginRight: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: BLUE,
        width: 90

    },
    textStyle: {
        color: "white",
        textAlign: "center",
        // fontFamily: COMICSBOLD
        fontWeight: "bold"
    },
});