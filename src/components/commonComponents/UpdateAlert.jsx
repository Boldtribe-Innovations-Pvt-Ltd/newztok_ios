import React, { useEffect, useRef, useState } from "react";
import { BLACK, BRANDCOLOR, WHITE } from "../../constant/color";
// import { COMICS, COMICSBOLD } from "../../constant/fontPath";
import { Animated, Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { AndroidVersion, ForceUpdate } from "../../constant/versionControll";
import { BASE_URL } from "../../constant/url";
import { GETNETWORK } from "../../utils/Network";
import { BLUE } from "../../constants/color";

export const UpdateAlert = ({
    visible = false,
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
    const [modalVisible, setModalVisible] = useState(visible);
    const [isForceUpdate, setIsForceUpdate] = useState(forceUpdate);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
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
    }, [visible]);

    useEffect(() => {
        checkAppVersion();
        checkForceUpdate();
    }, []);

    const checkAppVersion = () => {
        if (AndroidVersion) {
            const url = `${BASE_URL}versions/get`;
            GETNETWORK(url)
                .then((result) => {
                    if (result?.statusCode === 200 && result?.data?.version?.android_version == AndroidVersion) {
                        setModalVisible(false);
                        console.log("App is up-to-date.");
                    } else {
                        setModalVisible(true);
                        console.log("Update available.");
                    }
                })
                .catch((error) => {
                    console.error("Failed to check for new version:", error);
                });
        }
    };

    const checkForceUpdate = () => {
        if (ForceUpdate) {
            const url = `${BASE_URL}versions/get`;
            GETNETWORK(url)
                .then((result) => {
                    if (result?.statusCode === 200) {
                        setIsForceUpdate(false);
                    } else {
                        setIsForceUpdate(true);
                    }
                })
                .catch((error) => {
                    setIsForceUpdate(true);
                    console.error("Failed to check for force update:", error);
                });
        }
    };

    return (
        <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={isForceUpdate ? null : onRequestClose}
            statusBarTranslucent={true}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, { backgroundColor }]}>
                    {/* Title */}
                    <Text allowFontScaling={false} style={[styles.modalTitle, { color, fontWeight, fontSize: fontSize + 4 }]}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text allowFontScaling={false} style={[styles.modalMessage, { color, fontWeight, fontSize }]}>
                        {isForceUpdate ? forceMessage : message}
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {!isForceUpdate && (
                            <Pressable style={styles.buttonLeft} onPress={onPressLeft}>
                                <Text allowFontScaling={false} style={styles.textStyle}>{textLeft}</Text>
                            </Pressable>
                        )}
                        <Pressable
                            style={styles.buttonRight}
                            onPress={isForceUpdate ? onPressMiddle : onPressRight}
                        >
                            <Text allowFontScaling={false} style={styles.textStyle}>{textRight}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
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
        height: 230,
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        marginBottom: 30,
        textAlign: "center",
        // fontFamily: COMICS,
        color: BLACK,
    },
    modalMessage: {
        marginBottom: 20,
        textAlign: "center",
        color: BLACK,
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