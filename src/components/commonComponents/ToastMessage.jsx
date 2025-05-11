import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text } from "react-native";

export const ToastMessage = ({
    image = "",
    message = "",
    bacgroundColor = "#e0e0e0",
    visible = false,
    setVisible,
    type = "",
    position = "bottom",
    textColor = "#000000",
    duration = 3000
}) => {
    const initialPosition = position == "top" ? -300 : 300;

    // Initial Value for sliding
    const slideAnim = useRef(new Animated.Value(initialPosition)).current;

    const slideIn = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const slideOut = () => {
        Animated.timing(slideAnim, {
            toValue: initialPosition,
            duration: 500,
            useNativeDriver: true
        }).start();
    };

    useEffect(() => {
        if (visible) {
            slideIn();
            const timer = setTimeout(() => {
                slideOut();
                setTimeout(() => {
                    setVisible({ visible: false, message: "" });
                }, 500); //Waiting for the slide out animation to finish before setting visible to false
            }, duration)

            return () => clearTimeout(timer); //Clearining Timeout if component unmount or visible change
        }
    }, [visible]);
    return (
        <>
            {visible && (
                <Animated.View style={{
                    ...styles.toastContainer,
                    backgroundColor: bacgroundColor,
                    borderColor: (type == "success" ? "green" : (type == "error" ? "red" : "")),
                    borderBottomWidth: (((type != "") && (type == "success" || type == "error")) ? 3 : 0),
                    ...(position == "top" ? { top: 50 } : { bottom: 30 }),
                    transform: [{ translateY: slideAnim }],
                }}
                >

                    {image != "" && <Image source={image} style={styles.tostIcon} />}

                    <Text allowFontScaling={false} style={{ ...styles.toastText, color: textColor }}>{message}</Text>

                </Animated.View>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    toastContainer: {
        minHeight: 30,
        maxHeight: "80%",
        position: "absolute",
        padding: 10,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        elevation: 1
    }, tostIcon: {
        width: 30,
        height: 30,
        resizeMode: "contain"
    }, toastText: {
        marginHorizontal: 10,
        fontSize: 14
    }
})