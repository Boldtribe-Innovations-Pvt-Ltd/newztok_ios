import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { BLUE, WHITE, YELLOW } from "../../constants/color";
import { POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";
import { HEIGHT, WIDTH } from "../../constants/config";

export const CustomBtn = ({
    text = "",
    height = HEIGHT * 0.045,
    width = WIDTH * 0.25,
    backgroundColor = BLUE,
    fontSize = WIDTH * 0.032,
    fontWeight = "bold",
    color = WHITE,
    fontFamily = POPPINSMEDIUM,
    onPress = () => {
        console.log("onPress not set");
    }
}) => {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.btnView, {
                height: height,
                width: width,
                backgroundColor: backgroundColor,
            }]}>
            <Text 
                allowFontScaling={false} 
                numberOfLines={1} 
                style={[styles.sloganTxtView, {
                    fontFamily: fontFamily,
                    color: color,
                    fontSize: fontSize
                }]}
            >
                {text}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    btnView: {
        justifyContent: "center",
        alignItems: "center",
        borderRadius: HEIGHT * 0.015,
        elevation: 2,
    }, 
    sloganTxtView: {
        textAlign: 'center',
        paddingHorizontal: WIDTH * 0.01,
    }
})