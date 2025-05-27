import React, { useEffect, useRef } from "react";
import { Animated, PermissionsAndroid, StyleSheet, View, Text, Platform, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { LOGO2 } from "../../constants/imagePath";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStringByKey, getObjByKey } from "../../utils/Storage";
import messaging from '@react-native-firebase/messaging';

export default SplashScreen = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const requestUserPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (enabled) {
        console.log('✅ Notification permissions granted');
        return true;
      } else {
        console.log('❌ Notification permissions not granted');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const initializeNotifications = async () => {
    try {
      // Request notification permissions
      const hasPermission = await requestUserPermission();
      
      if (hasPermission) {
        // Get and store FCM token
        const fcmToken = await messaging().getToken();
        
        if (fcmToken) {
          await AsyncStorage.setItem('fcmToken', fcmToken);
          await AsyncStorage.setItem('fcmtoken', fcmToken);

          // Set up token refresh listener
          messaging().onTokenRefresh(async newToken => {
            await AsyncStorage.setItem('fcmToken', newToken);
            await AsyncStorage.setItem('fcmtoken', newToken);
          });

          // Handle foreground messages
          const unsubscribe = messaging().onMessage(async remoteMessage => {
            try {
              console.log('📱 [Topic Notification] Received foreground message:', {
                topic: remoteMessage.from,
                title: remoteMessage.notification?.title,
                body: remoteMessage.notification?.body,
                data: remoteMessage.data
              });

              // Create notification data with proper structure
              const notificationData = {
                ...remoteMessage,
                notification: {
                  ...remoteMessage.notification,
                  android: {
                    ...remoteMessage.notification?.android,
                    channelId: 'newztok-channel-important',
                    priority: 'high',
                    sound: 'default',
                    importance: 4,
                    smallIcon: '@mipmap/ic_launcher',
                    largeIcon: '@mipmap/ic_launcher',
                    color: '#D21008',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    tag: 'com.newztok.newztok2025'
                  },
                  ios: {
                    ...remoteMessage.notification?.ios,
                    sound: 'default',
                    badge: 1,
                    threadId: 'com.newztok.newztok2025'
                  }
                },
                data: {
                  ...remoteMessage.data,
                  click_action: 'FLUTTER_NOTIFICATION_CLICK',
                  collapse_key: 'com.newztok.newztok2025'
                }
              };

              // Show notification using Alert for foreground
              Alert.alert(
                notificationData.notification?.title ?? 'News Update',
                notificationData.notification?.body ?? '',
                [
                  {
                    text: 'View',
                    onPress: () => {
                      console.log('📱 [Topic Notification] Notification viewed');
                      // Handle notification click
                    }
                  },
                  {
                    text: 'OK',
                    style: 'cancel'
                  }
                ]
              );
            } catch (error) {
              console.error('❌ [Topic Notification] Error handling notification:', error);
            }
          });

          // Set up background message handler
          messaging().setBackgroundMessageHandler(async remoteMessage => {
            try {
              console.log('📱 [Topic Notification] Received background message:', {
                topic: remoteMessage.from,
                title: remoteMessage.notification?.title,
                body: remoteMessage.notification?.body,
                data: remoteMessage.data
              });

              // Create notification data with proper structure for background
              const notificationData = {
                ...remoteMessage,
                notification: {
                  ...remoteMessage.notification,
                  android: {
                    ...remoteMessage.notification?.android,
                    channelId: 'newztok-channel-important',
                    priority: 'high',
                    sound: 'default',
                    importance: 4,
                    smallIcon: '@mipmap/ic_launcher',
                    largeIcon: '@mipmap/ic_launcher',
                    color: '#D21008',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    tag: 'com.newztok.newztok2025'
                  },
                  ios: {
                    ...remoteMessage.notification?.ios,
                    sound: 'default',
                    badge: 1,
                    threadId: 'com.newztok.newztok2025'
                  }
                },
                data: {
                  ...remoteMessage.data,
                  click_action: 'FLUTTER_NOTIFICATION_CLICK',
                  collapse_key: 'com.newztok.newztok2025'
                }
              };

              // Return the notification data for background processing
              return Promise.resolve(notificationData);
            } catch (error) {
              console.error('❌ [Topic Notification] Error handling background notification:', error);
              return Promise.reject(error);
            }
          });

          // Initialize notification channel for Android
          if (Platform.OS === 'android') {
            await messaging().android.createChannel({
              id: 'newztok-channel-important',
              name: 'NewzTok Important Alerts',
              importance: 4,
              vibration: true,
              sound: 'default',
              enableVibration: true,
              enableLights: true,
              lightColor: '#D21008',
              showBadge: true,
              description: 'Important news updates and notifications',
              badge: true
            });
          }

          // Subscribe to default topics with error handling
          try {
            console.log('📢 [Topic Subscription] Subscribing to default topics...');
            await messaging().subscribeToTopic('news_updates');
            console.log('✅ [Topic Subscription] Subscribed to news_updates');
            await messaging().subscribeToTopic('news_approvals');
            console.log('✅ [Topic Subscription] Subscribed to news_approvals');

            // Get user data for topic subscription
            const userData = await getObjByKey('user');
            
            if (userData) {
              console.log('👤 [Topic Subscription] User preferences found:', {
                state: userData.state,
                district: userData.district,
                categories: userData.categories
              });

              // Subscribe to topics based on user preferences
              if (userData.state) {
                const stateTopic = `state_${userData.state.toLowerCase().replace(/\s+/g, '_')}`;
                await messaging().subscribeToTopic(stateTopic);
                console.log('✅ [Topic Subscription] Subscribed to state topic:', stateTopic);
              }
              
              if (userData.district) {
                const districtTopic = `district_${userData.district.toLowerCase().replace(/\s+/g, '_')}`;
                await messaging().subscribeToTopic(districtTopic);
                console.log('✅ [Topic Subscription] Subscribed to district topic:', districtTopic);
              }
              
              if (userData.categories?.length) {
                for (const category of userData.categories) {
                  const categoryTopic = `category_${category.toLowerCase().replace(/\s+/g, '_')}`;
                  await messaging().subscribeToTopic(categoryTopic);
                  console.log('✅ [Topic Subscription] Subscribed to category topic:', categoryTopic);
                }
              }
            }
          } catch (error) {
            console.error('❌ [Topic Subscription] Error subscribing to topics:', error);
          }

          // Add notification opened handler with navigation
          messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('📱 [Topic Notification] App opened from notification:', {
              topic: remoteMessage.from,
              title: remoteMessage.notification?.title,
              body: remoteMessage.notification?.body,
              data: remoteMessage.data
            });

            // Handle navigation based on notification data
            if (remoteMessage.data?.screen) {
              navigation.navigate(remoteMessage.data.screen, remoteMessage.data.params);
            }
          });

          // Check if app was opened from a notification
          messaging()
            .getInitialNotification()
            .then(remoteMessage => {
              if (remoteMessage) {
                console.log('📱 [Topic Notification] App opened from quit state with notification:', {
                  topic: remoteMessage.from,
                  title: remoteMessage.notification?.title,
                  body: remoteMessage.notification?.body,
                  data: remoteMessage.data
                });

                // Handle navigation based on notification data
                if (remoteMessage.data?.screen) {
                  navigation.navigate(remoteMessage.data.screen, remoteMessage.data.params);
                }
              }
            });

          return unsubscribe;
        }
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Request Android permissions for notifications
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: "Notification Permission",
              message: "NewzTok needs notification permission to keep you updated with latest news",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission denied');
            return;
          }
        }
        
        // Initialize notifications
        await initializeNotifications();
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };
    
    setupNotifications();
  }, [navigation]);

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
            आपकी खबर, हमारी जिम्मेदारी
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