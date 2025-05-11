import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { CustomBtn } from "../../components/commonComponents/CustomBtn";
import { LOGO } from "../../constants/imagePath";
import { BLACK, RED, WHITE } from "../../constants/color";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";

export default LoginSignupScreen = ({ navigation }) => {

    const onNavigateLogin = () => {
        try {
            navigation.navigate("LoginScreen");
        } catch (error) {
            console.error("Navigation error:", error);
            Alert.alert(
                "Navigation Error",
                "Unable to navigate to login screen. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    const onNavigateJournalistLogin = () => {
        try {
            navigation.navigate("JournalistLoginScreen");
        } catch (error) {
            console.error("Navigation error:", error);
            Alert.alert(
                "Navigation Error",
                "Unable to navigate to journalist login screen. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <>
            <MyStatusBar backgroundColor={WHITE} />
            <View style={styles.container}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={LOGO}
                        style={styles.logo}
                    />

                </View>

                {/* Login Button */}
                <CustomBtn
                    text="Login"
                    onPress={onNavigateLogin}
                />

                {/* OR Separator */}
                <Text style={styles.orText}>or</Text>

                <View style={{ height: 20 }} />

                {/* Signup Button */}
                <CustomBtn
                    text="Journalist"
                    onPress={onNavigateJournalistLogin}
                />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: WHITE,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logo: {
        height: 200,
        width: 200,
        marginBottom: 30
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "500",
        color: BLACK,
        marginBottom: 40,
        textAlign: "center"
    },
    linkText: {
        fontSize: 14,
        color: BLACK,
        marginBottom: 20,
    },
    orText: {
        fontSize: 20,
        color: BLACK,
        marginVertical: 10,
    },
});