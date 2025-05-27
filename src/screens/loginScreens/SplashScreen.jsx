import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Platform, Alert } from "react-native";
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
      console.log('🔔 [SplashScreen] Starting permission request...');
      
      const authStatus = await messaging().requestPermission();
      console.log('🔔 [SplashScreen] Authorization status:', authStatus);
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (enabled) {
        console.log('✅ [SplashScreen] Notification permissions granted');
        return true;
      } else {
        console.log('❌ [SplashScreen] Notification permissions not granted');
        return false;
      }
    } catch (error) {
      console.error('❌ [SplashScreen] Error requesting notification permissions:', error);
      return false;
    }
  };

  const initializeNotifications = async () => {
    try {
      console.log('🚀 [SplashScreen] Starting notification initialization...');
      
      // Request notification permissions
      const hasPermission = await requestUserPermission();
      console.log('🔑 [SplashScreen] Permission status:', hasPermission);
      
      if (hasPermission) {
        console.log('✅ [SplashScreen] Setting up notification listeners...');
        
        // Get and store FCM token
        console.log('🔑 [SplashScreen] Getting FCM token...');
        const fcmToken = await messaging().getToken();
        console.log('🔑 [SplashScreen] FCM token:', fcmToken);
        
        if (fcmToken) {
          console.log('✅ [SplashScreen] FCM token obtained:', fcmToken);
          await AsyncStorage.setItem('fcmToken', fcmToken);
          await AsyncStorage.setItem('fcmtoken', fcmToken); // For compatibility
          
          // Log stored token for verification
          const storedToken = await AsyncStorage.getItem('fcmToken');
          console.log('🔍 [SplashScreen] Stored FCM token:', storedToken);

          // Set up token refresh listener
          messaging().onTokenRefresh(async newToken => {
            console.log('🔄 [SplashScreen] FCM token refreshed:', newToken);
            await AsyncStorage.setItem('fcmToken', newToken);
            await AsyncStorage.setItem('fcmtoken', newToken);
          });

          // Set up notification opened handler
          messaging().onNotificationOpenedApp(remoteMessage => {
            try {
              console.log('📬 [SplashScreen] App opened from notification:', JSON.stringify(remoteMessage, null, 2));
              if (remoteMessage.from === '/topics/news_updates') {
                console.log('📬 [SplashScreen] App opened from news update notification');
              }
            } catch (error) {
              console.error('❌ [SplashScreen] Error handling opened notification:', error);
            }
          });

          // Check if app was opened from a notification
          messaging()
            .getInitialNotification()
            .then(remoteMessage => {
              if (remoteMessage) {
                console.log('📬 [SplashScreen] App opened from quit state with notification:', JSON.stringify(remoteMessage, null, 2));
              }
            })
            .catch(error => {
              console.error('❌ [SplashScreen] Error getting initial notification:', error);
            });
        } else {
          console.error('❌ [SplashScreen] Failed to get FCM token');
        }

        // Handle foreground messages with enhanced logging
        const unsubscribe = messaging().onMessage(async remoteMessage => {
          try {
            console.log('📲 [SplashScreen] Foreground FCM received:', JSON.stringify(remoteMessage, null, 2));
            console.log('📲 [SplashScreen] Message topic:', remoteMessage.from);
            console.log('📲 [SplashScreen] Message data:', remoteMessage.data);
            console.log('📲 [SplashScreen] Message notification:', remoteMessage.notification);
            
            // Check if the notification is from news_updates topic
            if (remoteMessage.from === '/topics/news_updates') {
              console.log('📰 [SplashScreen] News Update notification received');
              
              // Log raw message first with the same structure as Android
              const notificationData = {
                notification: remoteMessage.notification || {},
                originalPriority: remoteMessage.originalPriority || 2,
                priority: remoteMessage.priority || 2,
                sentTime: remoteMessage.sentTime || Date.now(),
                data: remoteMessage.data || {},
                from: remoteMessage.from,
                messageId: remoteMessage.messageId,
                ttl: remoteMessage.ttl || 2419200,
                authKey: 'LA3YFLZ4Z5'  // iOS auth key
              };

              // Log each part of the notification data separately
              console.log('📬 [SplashScreen] Notification object:', notificationData.notification);
              console.log('📬 [SplashScreen] Data object:', notificationData.data);
              console.log('📬 [SplashScreen] Message details:', {
                from: notificationData.from,
                messageId: notificationData.messageId,
                sentTime: notificationData.sentTime,
                ttl: notificationData.ttl,
                authKey: notificationData.authKey
              });

              // Show alert instead of using messaging().ios.showNotification
              Alert.alert(
                remoteMessage.notification?.title ?? 'News Update',
                remoteMessage.notification?.body ?? '',
                [
                  {
                    text: 'OK',
                    onPress: () => console.log('✅ [SplashScreen] Alert acknowledged')
                  }
                ]
              );
              
              console.log('✅ [SplashScreen] News update notification shown successfully');
            } else {
              console.log('⚠️ [SplashScreen] Received notification from different topic:', remoteMessage.from);
            }
          } catch (error) {
            console.error('❌ [SplashScreen] Error handling news update notification:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Failed remoteMessage:', JSON.stringify(remoteMessage, null, 2));
          }
        });

        // Set up background message handler with enhanced logging
        messaging().setBackgroundMessageHandler(async remoteMessage => {
          try {
            console.log('📬 [SplashScreen] Background message received:', JSON.stringify(remoteMessage, null, 2));
            if (remoteMessage.from === '/topics/news_updates') {
              console.log('📬 [SplashScreen] Background news update notification received:', {
                notification: remoteMessage.notification,
                data: remoteMessage.data,
                from: remoteMessage.from,
                messageId: remoteMessage.messageId
              });
            }
          } catch (error) {
            console.error('❌ [SplashScreen] Error handling background news update:', error);
          }
        });

        // Get user preferences for topic subscription
        console.log('📢 [SplashScreen] Setting up topic subscriptions...');
        const userData = await getObjByKey('user');
        console.log('👤 [SplashScreen] User data for topic subscription:', userData);
        
        try {
          // Always subscribe to news_updates topic first
          console.log('📢 [SplashScreen] Subscribing to default topic: news_updates');
          await messaging().subscribeToTopic('news_updates');
          console.log('✅ [SplashScreen] Successfully subscribed to news_updates topic');

          // Subscribe to news_approvals topic
          console.log('📢 [SplashScreen] Subscribing to news approval topic');
          await messaging().subscribeToTopic('news_approvals');
          console.log('✅ [SplashScreen] Successfully subscribed to news_approvals topic');

          if (userData) {
            // Subscribe to topics based on user preferences
            if (userData.state) {
              const stateTopic = `state_${userData.state.toLowerCase().replace(/\s+/g, '_')}`;
              console.log('📢 [SplashScreen] Subscribing to state topic:', stateTopic);
              await messaging().subscribeToTopic(stateTopic);
              console.log('✅ [SplashScreen] Successfully subscribed to state topic:', stateTopic);
            }
            
            if (userData.district) {
              const districtTopic = `district_${userData.district.toLowerCase().replace(/\s+/g, '_')}`;
              console.log('📢 [SplashScreen] Subscribing to district topic:', districtTopic);
              await messaging().subscribeToTopic(districtTopic);
              console.log('✅ [SplashScreen] Successfully subscribed to district topic:', districtTopic);
            }
            
            if (userData.categories?.length) {
              for (const category of userData.categories) {
                const categoryTopic = `category_${category.toLowerCase().replace(/\s+/g, '_')}`;
                console.log('📢 [SplashScreen] Subscribing to category topic:', categoryTopic);
                await messaging().subscribeToTopic(categoryTopic);
                console.log('✅ [SplashScreen] Successfully subscribed to category topic:', categoryTopic);
              }
            }
          }

          // Verify topic subscriptions
          console.log('🔍 [SplashScreen] Verifying topic subscriptions...');
          const topics = ['news_updates', 'news_approvals'];
          
          if (userData?.state) {
            const stateTopic = `state_${userData.state.toLowerCase().replace(/\s+/g, '_')}`;
            topics.push(stateTopic);
          }
          
          if (userData?.district) {
            const districtTopic = `district_${userData.district.toLowerCase().replace(/\s+/g, '_')}`;
            topics.push(districtTopic);
          }
          
          if (userData?.categories?.length) {
            userData.categories.forEach(category => {
              const categoryTopic = `category_${category.toLowerCase().replace(/\s+/g, '_')}`;
              topics.push(categoryTopic);
            });
          }

          console.log('📋 [SplashScreen] Subscribed topics:', topics);
          
          // Log FCM token for verification
          console.log('🔑 [SplashScreen] Current FCM token:', fcmToken);
          
        } catch (error) {
          console.error('❌ [SplashScreen] Error during topic subscription:', error);
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
        }
        
        console.log('✅ [SplashScreen] Notification setup completed');

        // Cleanup function
        return unsubscribe;
      }
    } catch (error) {
      console.error('❌ [SplashScreen] Error initializing notifications:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
  };

  useEffect(() => {
    console.log('🔄 [SplashScreen] Component mounted, initializing notifications...');
    
    let unsubscribe = null;
    
    // Initialize notifications
    const initNotifications = async () => {
      try {
        unsubscribe = await initializeNotifications();
      } catch (error) {
        console.error('❌ [SplashScreen] Error during notification initialization:', error);
      }
    };
    
    initNotifications();
    
    // Cleanup function
    return () => {
      if (typeof unsubscribe === 'function') {
        console.log('🧹 [SplashScreen] Cleaning up notification listeners...');
        unsubscribe();
      }
    };
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