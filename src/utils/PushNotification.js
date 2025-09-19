import messaging, { getMessaging, getToken, onMessage, setBackgroundMessageHandler, onNotificationOpenedApp, getInitialNotification, subscribeToTopic, onTokenRefresh } from '@react-native-firebase/messaging';
import { getStringByKey, storeStringByKey } from './Storage';
import { POSTNETWORK } from './Network';
import { Vibration } from 'react-native';
import { BASE_URL } from '../constants/url';

export const requestUserPermission = async () => {
    try {
        // Add a small delay to ensure the app context is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        console.log('FCM Authorization status:', authStatus);
        
        if (enabled) {
            console.log('FCM permissions granted, getting token...');
            const fcmToken = await getFCM();
            return fcmToken !== null;
        } else {
            console.log('FCM permissions denied');
            return false;
        }
    } catch (error) {
        console.error('Error requesting FCM permissions:', error);
        return false;
    }
}

// Alternative method to setup notifications when app is ready
export const setupNotificationsWhenReady = async (navigation) => {
    try {
        console.log('Setting up notifications when app is ready...');
        
        // Wait a bit more to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to get FCM token without requesting permissions first
        let fcmToken = null;
        try {
            fcmToken = await getToken(messaging());
            if (fcmToken) {
                console.log('FCM token obtained without requesting permissions:', fcmToken);
                await storeStringByKey('fcmtoken', fcmToken);
                postFcmdetails();
            }
        } catch (tokenError) {
            console.log('Could not get FCM token without permissions, requesting permissions...');
            
            // If we can't get token without permissions, try requesting permissions
            const permissionGranted = await requestUserPermission();
            if (permissionGranted) {
                fcmToken = await getFCM();
            }
        }
        
        // Set up notification listeners regardless of token status
        NotificationListener(navigation);
        
        return fcmToken !== null;
    } catch (error) {
        console.error('Error in setupNotificationsWhenReady:', error);
        return false;
    }
}
const postFcmdetails = async () => {

    const url =`${BASE_URL}api/users/update-fcm-token`
    const user= await getStringByKey('fcmtoken')
    console.log('tokennnnnnnnn',user)
    const obj={
        "token":user
    }
    // console.log("obj",obj)


    POSTNETWORK(url,obj).then(res=>{
        console.log("responseeeeeee",res)
        // console.log("response",res)
    })
}

const getFCM = async () => {
    try {
        const fcmtoken = await getStringByKey('fcmtoken');
        if (fcmtoken) {
            console.log('Using existing FCM token:', fcmtoken);
            return fcmtoken;
        } else {
            console.log('No existing FCM token, generating new one...');
            const newFcmToken = await getToken(messaging());
            if (newFcmToken) {
                await storeStringByKey('fcmtoken', newFcmToken);
                console.log('New FCM token generated and stored:', newFcmToken);
                postFcmdetails();
                return newFcmToken;
            } else {
                console.error('Failed to generate FCM token');
                return null;
            }
        }
    } catch (err) {
        console.error("Error in getFCM:", err);
        return null;
    }
}

export const NotificationListener = (navigation) => {
    console.log("Setting up notification listeners");
    
    onNotificationOpenedApp(messaging(), remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
        
        // Handle navigation based on notification data
        if (navigation && remoteMessage.data) {
            const { screen, params } = remoteMessage.data;
            if (screen) {
                navigation.navigate(screen, params);
            }
        }
    });

    getInitialNotification(messaging())
    .then(remoteMessage => {
        // Vibration.vibrate();
        if (remoteMessage) {
            console.log(
                'Notification caused app to open from quit state:',
                remoteMessage.notification,
            );
            
            // Handle navigation based on notification data
            if (navigation && remoteMessage.data) {
                const { screen, params } = remoteMessage.data;
                if (screen) {
                    navigation.navigate(screen, params);
                }
            }
        }
    });

    onMessage(messaging(), async remoteMessage=>{
        // Vibration.vibrate();
        console.log('Notification received in foreground:', remoteMessage);
        
        // You can show a local notification here if needed
        // or update UI based on the notification
    })

    setBackgroundMessageHandler(messaging(), async remoteMessage => {
        // Vibration.vibrate();
        console.log('Message handled in the background!', remoteMessage);
    });
}

// Subscribe to FCM topics based on user preferences
export const subscribeToTopics = async (userPreferences) => {
    try {
        console.log('Subscribing to topics with preferences:', userPreferences);
        
        // Default topics for all users
        const defaultTopics = ['general', 'news'];
        
        // Add user-specific topics based on preferences
        const topicsToSubscribe = [...defaultTopics];
        
        if (userPreferences.categories && Array.isArray(userPreferences.categories)) {
            topicsToSubscribe.push(...userPreferences.categories);
        }
        
        if (userPreferences.state) {
            topicsToSubscribe.push(`state_${userPreferences.state.toLowerCase().replace(/\s+/g, '_')}`);
        }
        
        if (userPreferences.district) {
            topicsToSubscribe.push(`district_${userPreferences.district.toLowerCase().replace(/\s+/g, '_')}`);
        }
        
        // Subscribe to each topic
        for (const topic of topicsToSubscribe) {
            try {
                await subscribeToTopic(messaging(), topic);
                console.log(`Successfully subscribed to topic: ${topic}`);
            } catch (error) {
                console.error(`Failed to subscribe to topic ${topic}:`, error);
            }
        }
        
        console.log('Topic subscription completed');
    } catch (error) {
        console.error('Error subscribing to topics:', error);
    }
};

// Update FCM token on login
export const updateFCMTokenOnLogin = async (userToken) => {
    try {
        console.log('Updating FCM token on login');
        
        // Get current FCM token
        const fcmToken = await getToken(messaging());
        console.log('Current FCM token:', fcmToken);
        
        // Store the token
        await storeStringByKey('fcmtoken', fcmToken);
        
        // Post FCM details to server with user token
        const url = `${BASE_URL}api/users/update-fcm-token`;
        const obj = {
            "token": fcmToken,
            "userToken": userToken
        };
        
        console.log('Posting FCM details to server:', obj);
        
        const response = await POSTNETWORK(url, obj);
        console.log('FCM token update response:', response);
        
        return fcmToken;
    } catch (error) {
        console.error('Error updating FCM token on login:', error);
        return null;
    }
};