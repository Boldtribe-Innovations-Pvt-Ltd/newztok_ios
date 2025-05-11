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
            console.log('Notification permissions granted, getting FCM token...');
            getFCM();
        } else {
            console.log('Notification permissions not granted');
        }
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
    }
}

const postFcmdetails = async () => {
    try {
        const url = `${BASE_URL}enterFCMTokenDetails?_format=json`
        const user = await getStringByKey('fcmtoken')
        console.log('Posting FCM token to server:', user)
        const obj = {
            "token": user
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

const getFCM = async () => {
    try {
        let fcmToken = await AsyncStorage.getItem('fcmToken');
        console.log('Stored FCM token:', fcmToken);
        if (!fcmToken) {
            const newToken = await messaging().getToken();
            console.log('New FCM token:', newToken);
            if (newToken) {
                await AsyncStorage.setItem('fcmToken', newToken);
                await storeStringByKey('fcmtoken', newToken); // Keeping this for compatibility with existing code
                postFcmdetails();
            }
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
    }
}

export const NotificationListener = () => {
    console.log("first")
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
        );
    });

    messaging()
    .getInitialNotification()
    .then(remoteMessage => {
        // Vibration.vibrate();
        if (remoteMessage) {
            console.log(
                'Notification caused app to open from quit state:',
                remoteMessage.notification,
            );
        }
    });

    messaging().onMessage(async remoteMessage=>{
        // Vibration.vibrate();
        console.log('Notification caused app to open from forground state:',remoteMessage);
    })

    messaging().setBackgroundMessageHandler(async remoteMessage => {
        // Vibration.vibrate();
        console.log('Message handled in the background!', remoteMessage);
    });
}