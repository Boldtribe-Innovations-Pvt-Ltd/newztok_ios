import messaging from '@react-native-firebase/messaging';
import { getStringByKey, storeStringByKey } from './Storage';
import { POSTNETWORK } from './Network';
import { Vibration } from 'react-native';
import { BASE_URL } from '../constants/url';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const requestUserPermission = async () => {
    try {
        console.log('Requesting notification permissions...');
        const authStatus = await messaging().requestPermission();
        console.log('Authorization status:', authStatus);
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        
        if (enabled) {
            console.log('Notification permissions granted');
            return true;
        } else {
            console.log('Notification permissions not granted');
            return false;
        }
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

const postFcmdetails = async (token) => {
    try {
        const url = `${BASE_URL}enterFCMTokenDetails?_format=json`
        console.log('Posting FCM token to server:', token)
        const obj = {
            "token": token
        }

        POSTNETWORK(url, obj).then(res => {
            console.log("FCM token posted successfully:", res)
        }).catch(error => {
            console.error("Error posting FCM token:", error)
        })
    } catch (error) {
        console.error('Error in postFcmdetails:', error);
    }
}

export const getFCM = async () => {
    try {
        // First check if we already have a token stored
        let fcmToken = await AsyncStorage.getItem('fcmToken');
        console.log('Stored FCM token:', fcmToken);

        if (!fcmToken) {
            // Make sure we're registered for remote messages
            await messaging().registerDeviceForRemoteMessages();
            
            // Get a new token
            const newToken = await messaging().getToken();
            console.log('New FCM token:', newToken);
            
            if (newToken) {
                // Store the token in both places for compatibility
                await AsyncStorage.setItem('fcmToken', newToken);
                await storeStringByKey('fcmtoken', newToken);
                
                // Post the token to the server
                await postFcmdetails(newToken);
                
                return newToken;
            }
        }
        
        return fcmToken;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

export const NotificationListener = () => {
    console.log("Setting up notification listeners...");
    
    // Handle notification when app is in background
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
    });

    // Handle notification when app is closed
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {
            if (remoteMessage) {
                console.log(
                    'Notification caused app to open from quit state:',
                    remoteMessage.notification,
                );
            }
        });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
        console.log('Received foreground message:', remoteMessage);
        // You can add custom handling here, like showing a local notification
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Message handled in the background!', remoteMessage);
    });
}