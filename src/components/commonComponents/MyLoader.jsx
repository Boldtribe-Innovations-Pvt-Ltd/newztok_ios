import React, { useRef, useEffect } from "react";
import { Modal, Pressable, StatusBar, View, Animated } from "react-native";
// import { HEIGHT, MyStatusBar } from "../constants/config";
// import { EMI_LOADER } from "../constants/imagepath";
import { MyStatusBar } from "./MyStatusBar";
import { WHITE } from "../../constants/color";

// Animated Skeleton loader component
const SkeletonLoader = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Start animation when component mounts
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    startAnimation();
    
    // Clean up animation when component unmounts
    return () => {
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim]);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Circular skeleton loader */}
      <Animated.View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#e1e9ee',
          opacity: fadeAnim,
          marginBottom: 15
        }}
      />
      
      {/* Loading bars */}
      <Animated.View
        style={{
          width: 120,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#e1e9ee',
          opacity: fadeAnim,
          marginBottom: 10
        }}
      />
      
      <Animated.View
        style={{
          width: 80,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#e1e9ee',
          opacity: fadeAnim
        }}
      />
    </View>
  );
};

export const MyLoader = ({
    visible = false,
    onBackPress,
    backgroundColor = `rgba(255, 255, 255, 0.9)`,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            statusBarTranslucent
            onRequestClose={() => onBackPress != undefined && onBackPress(false)}
        >
            <Pressable
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    backgroundColor: backgroundColor,
                    alignItems: 'center'
                }}>
                <StatusBar backgroundColor={WHITE} barStyle={'dark-content'} />
                <SkeletonLoader />
            </Pressable>
        </Modal>
    )
}