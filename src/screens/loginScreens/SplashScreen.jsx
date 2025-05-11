import React, { useEffect, useRef } from "react";
import { Animated, PermissionsAndroid, StyleSheet, View, Text } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { LOGO2 } from "../../constants/imagePath";
// import { NotificationListener, requestUserPermission } from "../../utils/PushNotification";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStringByKey, getObjByKey } from "../../utils/Storage";


export default SplashScreen = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  // const firebaseConfig = {
  //   apiKey: "AIzaSyAUUZoHD6_v8-d1I9-CsJ4q1I6ibJm_W7Q",
  //   authDomain: "newstok-686c5.firebaseapp.com",
  //   projectId: "newstok-686c5",
  //   storageBucket: "newstok-686c5.firebasestorage.app",
  //   messagingSenderId: "907742792971",
  //   appId: "1:907742792971:android:933b0ef7421f554e64260e"
  // };
  

  // useEffect(()=>{
  //   PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  //   requestUserPermission();
  //   NotificationListener();
  // },[])

  useEffect(() => {
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    Animated.timing(textOpacity, {
      toValue: 1,
      delay: 1000,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Check login status and navigate accordingly
    const checkLoginAndNavigate = async () => {
      try {
        // First check if there's a valid token
        let token = await getStringByKey('loginResponse');
        if (!token) {
          token = await AsyncStorage.getItem('loginResponse');
        }
        
        console.log("Token found:", !!token);
        
        if (token) {
          // User is logged in, check which type of user
          let isJournalist = false;
          
          // Check from multiple sources for backwards compatibility
          const isJournalistStr = await getStringByKey('isJournalist');
          if (isJournalistStr === 'true') {
            isJournalist = true;
          } else {
            const asyncIsJournalist = await AsyncStorage.getItem('isJournalist');
            isJournalist = asyncIsJournalist === 'true';
          }
          
          console.log("Is journalist account:", isJournalist);
          
          // Get user data if available
          let userData = await getObjByKey('user');
          if (!userData) {
            const userDataStr = await AsyncStorage.getItem('user');
            if (userDataStr) {
              try {
                userData = JSON.parse(userDataStr);
              } catch (e) {
                console.log("Error parsing user data:", e);
              }
            }
          }
          
          console.log("User data found:", !!userData);
          
          // Navigate to the appropriate screen
          setTimeout(() => {
            if (isJournalist) {
              console.log("Navigating to JournalistMain screen");
              navigation.reset({
                index: 0,
                routes: [{ name: 'JournalistMain', params: { userData } }],
              });
            } else {
              console.log("Navigating to Main screen");
              navigation.reset({
                index: 0,
                routes: [{ 
                  name: 'Main', 
                  params: { 
                    isJournalist: false,
                    isLoggedIn: true,
                    userData 
                  } 
                }],
              });
            }
          }, 3000);
        } else {
          // No token, user is not logged in
          setTimeout(() => {
            console.log("No auth token found, navigating to Main as guest");
            navigation.reset({
              index: 0,
              routes: [{ 
                name: 'Main', 
                params: { 
                  isJournalist: false,
                  isLoggedIn: false 
                } 
              }],
            });
          }, 3000);
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        // Fallback to Main with no auth if there's an error
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'Main', 
              params: { 
                isJournalist: false,
                isLoggedIn: false 
              } 
            }],
          });
        }, 3000);
      }
    };

    checkLoginAndNavigate();
  }, [navigation, logoScale, textOpacity]);

  return (
    <>
      <MyStatusBar backgroundColor={"#000000"} barStyle={"light-content"} />
      <View style={styles.container}>
        {/* Base white background */}
        <View style={styles.whiteBackground} />
        
        {/* Black diagonal gradient from top-right */}
        <LinearGradient
          colors={["#000000", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.1)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0.5 }}
          style={styles.blackGradient}
        />
        
        {/* Central white diagonal strip */}
        <LinearGradient
          colors={["transparent", "#FFFFFF", "transparent"]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.6 }}
          locations={[0.2, 0.5, 0.8]}
          style={styles.whiteStrip}
        />
        
        {/* Red diagonal gradient from bottom-left */}
        <LinearGradient
          colors={["#D21008", "rgba(210,16,8,0.7)", "rgba(210,16,8,0.1)", "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.redGradient}
        />
        
        <View style={styles.content}>
          <Animated.Image
            source={LOGO2}
            style={[styles.logo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <Animated.Text
            style={[styles.bottomText, { opacity: textOpacity }]}
          >
            सिर्फ सच
          </Animated.Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  whiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  blackGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  whiteStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  redGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 5,
  },
  logo: {
    width: 190,
    height: 140,
    marginBottom: 10,
  },
  bottomText: {
    position: "absolute",
    bottom: 50,
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    fontFamily: "serif",
    letterSpacing: 2,
  },
});