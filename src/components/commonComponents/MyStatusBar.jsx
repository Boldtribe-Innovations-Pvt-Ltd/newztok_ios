import React from "react";
import { StatusBar } from "react-native";

export const MyStatusBar = ({
    backgroundColor = "transparent",
    barStyle = "light-content"
}) => {
    return (
        <StatusBar 
            backgroundColor={backgroundColor} 
            barStyle={barStyle}
            translucent={true}
        />
    );
};