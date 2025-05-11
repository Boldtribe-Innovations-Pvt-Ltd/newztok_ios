import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, Animated } from "react-native";
import { BLACK } from "../../constants/color";
import { POPPINSMEDIUM, POPPINSLIGHT } from "../../constants/fontPath";

export const MyAlert = ({
  visible = false,
  textRight = "Yes",
  textLeft = "Cancel",
  title = "",
  borderRadius = 10,
  message = "",
  showRightButton = true,
  showLeftButton = true,
  backgroundColor = "#2196F3", // Default color set
  color = "white", // Default text color set
  fontWeight = "bold",
  fontSize = 14, // Reduced font size
  onRequestClose = () => {
    console.log("Modal Closed");
  },
  onPressRight = () => {
    console.log("Modal Open");
  },
  onPressLeft = () => {
    console.log("Modal Closed");
  }
}) => {
  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
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
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  return (
    <>
      {showModal && (
        <Modal
          transparent={true}
          animationType="none"
          visible={showModal}
          onRequestClose={onRequestClose}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
              <Text allowFontScaling={false} style={styles.title}>{title}</Text>
              <Text allowFontScaling={false} style={styles.message}>{message}</Text>

              <View style={styles.btnView}>
                {showLeftButton && (
                  <Pressable
                    style={[styles.button, { backgroundColor, borderRadius }]}
                    onPress={onPressLeft}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.buttonText,
                        { color, fontWeight, fontSize },
                      ]}
                    >
                      {textLeft}
                    </Text>
                  </Pressable>
                )}

                {showRightButton && (
                  <Pressable
                    style={[styles.button, { backgroundColor, borderRadius }]}
                    onPress={onPressRight}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.buttonText,
                        { color, fontWeight, fontSize },
                      ]}
                    >
                      {textRight}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "70%", // Decreased width
    backgroundColor: "white",
    padding: 15, // Decreased padding
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 16, // Decreased font size
    marginBottom: 8, // Decreased margin
    color: BLACK,
    fontFamily: POPPINSMEDIUM,
  },
  message: {
    fontSize: 14, // Decreased font size
    marginBottom: 15, // Decreased margin
    color: "black",
    fontFamily: POPPINSLIGHT,
    textAlign: "center",
  },
  btnView: {
    paddingHorizontal: 5, // Decreased padding
    paddingVertical: 8, // Smaller vertical padding
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  buttonText: {
    textAlign: "center",
    fontFamily: POPPINSMEDIUM,
  },
  button: {
    width: 80, // Decreased width
    height: 40, // Decreased height
    justifyContent: "center",
    alignItems: "center",
  },
});