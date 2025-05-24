import messaging from '@react-native-firebase/messaging';
import { getStringByKey, storeStringByKey } from './Storage';
import { POSTNETWORK } from './Network';
import { Vibration, Platform, AppState } from 'react-native';
import { BASE_URL } from '../constants/url';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure default notification settings
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📬 [PushNotification] Message handled in background:', remoteMessage);
    storeNotificationInHistory(remoteMessage);
    return Promise.resolve();
});

// Enable foreground notifications
messaging().onMessage(async remoteMessage => {
    console.log('📬 [PushNotification] Foreground message received:', remoteMessage);
});

// Set special delivery for foreground notifications
messaging().setDeliveryMetricsExportToBigQuery(true);

// Configure iOS specific settings
if (Platform.OS === 'ios') {
    messaging().setAutoInitEnabled(true);
    messaging().ios.registerForRemoteNotifications();
}

export const requestUserPermission = async () => {
    try {
        console.log('🔔 [PushNotification] Requesting notification permissions...');
        const authStatus = await messaging().requestPermission();
        console.log('🔔 [PushNotification] Authorization status:', authStatus);
        
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
            console.log('✅ [PushNotification] Notification permissions granted');
            await getFCM();
            return true;
        } else {
            console.log('❌ [PushNotification] Notification permissions not granted');
            return false;
        }
    } catch (error) {
        console.error('❌ [PushNotification] Error requesting notification permissions:', error);
        return false;
    }
}

const sendTokenToBackend = async (token) => {
    try {
        const url = `${BASE_URL}api/users/update-fcm-token`;
        console.log('📤 [PushNotification] Sending FCM token to server:', token);
        
        const userToken = await AsyncStorage.getItem('loginResponse');
        const payload = { fcmToken: token };
        const isAuthenticated = !!userToken;
        
        const response = await POSTNETWORK(url, payload, isAuthenticated);
        console.log("✅ [PushNotification] FCM token update response:", response);
        
        return response?.success || false;
    } catch (error) {
        console.error('❌ [PushNotification] Error sending FCM token to backend:', error);
        return false;
    }
}

export const getFCM = async () => {
    try {
        console.log('🔑 [PushNotification] Checking for existing FCM token...');
        let fcmToken = await AsyncStorage.getItem('fcmToken');
        
        if (!fcmToken) {
            console.log('🔄 [PushNotification] Generating new FCM token...');
            await messaging().registerDeviceForRemoteMessages();
            const newToken = await messaging().getToken();
            
            if (newToken) {
                console.log('💾 [PushNotification] Storing new FCM token...');
                await AsyncStorage.setItem('fcmToken', newToken);
                await storeStringByKey('fcmtoken', newToken);
                await sendTokenToBackend(newToken);
                fcmToken = newToken;
            }
        } else {
            await sendTokenToBackend(fcmToken);
        }
        
        // Set up token refresh listener
        messaging().onTokenRefresh(async newToken => {
            console.log('🔄 [PushNotification] FCM token refreshed:', newToken);
            await AsyncStorage.setItem('fcmToken', newToken);
            await storeStringByKey('fcmtoken', newToken);
            await sendTokenToBackend(newToken);
        });
        
        return fcmToken;
    } catch (error) {
        console.error('❌ [PushNotification] Error getting FCM token:', error);
        return null;
    }
}

export const subscribeToTopics = async (userPreferences = {}) => {
    try {
        if (!userPreferences || Object.keys(userPreferences).length === 0) {
            const userPrefsStr = await AsyncStorage.getItem('userPreferences');
            userPreferences = userPrefsStr ? JSON.parse(userPrefsStr) : { categories: ['general'] };
        }
        
        console.log('📢 [PushNotification] Subscribing to topics:', userPreferences);
        
        await messaging().subscribeToTopic('news_updates');
        
        if (userPreferences.state) {
            const stateTopic = `state_${userPreferences.state.toLowerCase().replace(/\s+/g, '_')}`;
            await messaging().subscribeToTopic(stateTopic);
        }
        
        if (userPreferences.district) {
            const districtTopic = `district_${userPreferences.district.toLowerCase().replace(/\s+/g, '_')}`;
            await messaging().subscribeToTopic(districtTopic);
        }
        
        if (userPreferences.categories?.length) {
            for (const category of userPreferences.categories) {
                const categoryTopic = `category_${category.toLowerCase().replace(/\s+/g, '_')}`;
                await messaging().subscribeToTopic(categoryTopic);
            }
        }
        
        await AsyncStorage.setItem('userPreferences', JSON.stringify(userPreferences));
        console.log('✅ [PushNotification] Topics subscription completed');
        return true;
    } catch (error) {
        console.error('❌ [PushNotification] Error subscribing to topics:', error);
        return false;
    }
}

export const unsubscribeFromTopics = async () => {
    try {
        const userPrefsStr = await AsyncStorage.getItem('userPreferences');
        if (!userPrefsStr) return;
        
        const userPreferences = JSON.parse(userPrefsStr);
        console.log('📢 [PushNotification] Unsubscribing from topics:', userPreferences);
        
        await messaging().unsubscribeFromTopic('news_updates');
        
        if (userPreferences.state) {
            const stateTopic = `state_${userPreferences.state.toLowerCase().replace(/\s+/g, '_')}`;
            await messaging().unsubscribeFromTopic(stateTopic);
        }
        
        if (userPreferences.district) {
            const districtTopic = `district_${userPreferences.district.toLowerCase().replace(/\s+/g, '_')}`;
            await messaging().unsubscribeFromTopic(districtTopic);
        }
        
        if (userPreferences.categories?.length) {
            for (const category of userPreferences.categories) {
                const categoryTopic = `category_${category.toLowerCase().replace(/\s+/g, '_')}`;
                await messaging().unsubscribeFromTopic(categoryTopic);
            }
        }
        
        await AsyncStorage.removeItem('userPreferences');
        console.log('✅ [PushNotification] Successfully unsubscribed from all topics');
        return true;
    } catch (error) {
        console.error('❌ [PushNotification] Error unsubscribing from topics:', error);
        return false;
    }
}

export const NotificationListener = (navigation) => {
    console.log("🔔 [PushNotification] Setting up notification listeners...");
    
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('📱 [PushNotification] App opened from background:', remoteMessage);
        handleNotificationNavigation(remoteMessage, navigation);
    });

    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log('📱 [PushNotification] App opened from quit state:', remoteMessage);
                handleNotificationNavigation(remoteMessage, navigation);
            }
        });

    messaging().onMessage(async remoteMessage => {
        console.log('📬 [PushNotification] Foreground notification received:', remoteMessage);
        
        try {
            const notif = remoteMessage.notification;
            if (notif) {
                if (Platform.OS === 'android') {
                    const channelId = 'newztok-channel-important';
                    await messaging().android.createChannel({
                        id: channelId,
                        name: 'NewzTok Important Alerts',
                        importance: 4,
                        vibration: true,
                        sound: 'default',
                        enableVibration: true,
                        enableLights: true,
                        lightColor: '#D21008',
                    });
                    
                    await messaging().android.showNotification({
                        channelId,
                        id: remoteMessage.messageId || new Date().getTime().toString(),
                        title: notif.title,
                        body: notif.body,
                        priority: 'high',
                        importance: 'high',
                        sound: 'default',
                        vibrate: true,
                        color: '#D21008',
                        data: remoteMessage.data,
                        smallIcon: '@drawable/ic_notification',
                        largeIcon: '@mipmap/ic_launcher',
                        autoCancel: true,
                        showWhen: true,
                        visibility: 'public',
                    });
                } else if (Platform.OS === 'ios') {
                    await messaging().ios.showNotification({
                        title: notif.title,
                        body: notif.body,
                        sound: 'default',
                        badge: 1,
                        data: remoteMessage.data,
                    });
                }
            }
            
            storeNotificationInHistory(remoteMessage);
        } catch (error) {
            console.error('❌ [PushNotification] Error handling foreground notification:', error);
        }
    });
}

const handleNotificationNavigation = (remoteMessage, navigation) => {
    if (!navigation || !remoteMessage.data) return;
    
    try {
        const { type, newsId, state, district, category } = remoteMessage.data;
        
        switch(type) {
            case 'article_approved':
            case 'new_published_article':
                if (newsId) {
                    navigation.navigate('HomeScreen', { newsData: { id: newsId } });
                }
                break;
            case 'state_news':
                navigation.navigate('CategoryScreen', { category: 'state', filter: state });
                break;
            case 'district_news':
                navigation.navigate('CategoryScreen', { category: 'district', filter: district });
                break;
            case 'category_news':
                if (category) {
                    navigation.navigate('CategoryScreen', { category });
                }
                break;
            default:
                navigation.navigate('MainScreen');
        }
    } catch (error) {
        console.error('❌ [PushNotification] Error handling notification navigation:', error);
    }
}

const storeNotificationInHistory = async (remoteMessage) => {
    try {
        const notification = {
            id: remoteMessage.messageId || new Date().getTime().toString(),
            title: remoteMessage.notification?.title || 'NewzTok Update',
            body: remoteMessage.notification?.body || '',
            data: remoteMessage.data || {},
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const notificationsStr = await AsyncStorage.getItem('notifications');
        let notifications = notificationsStr ? JSON.parse(notificationsStr) : [];
        
        notifications.unshift(notification);
        if (notifications.length > 50) {
            notifications = notifications.slice(0, 50);
        }
        
        await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('❌ [PushNotification] Error storing notification in history:', error);
    }
}