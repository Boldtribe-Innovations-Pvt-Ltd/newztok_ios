import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabNavigation } from './BottomTabNavigations';
import JournalistBottomTabNavigation from './JournalistBottomTabNavigation';
import ProfileScreen from '../screens/userScreens/ProfileScreen';
import NotificationScreen from '../screens/userScreens/NotificationScreen';
import SettingsScreen from '../screens/userScreens/SettingsScreen';
import NationalNews from '../screens/userScreens/NationalNews';
import InternationalNews from '../screens/userScreens/InternationalNews';
import DistrictNews from '../screens/userScreens/DistrictNews';
import EntertainmentNews from '../screens/userScreens/EntertainmentNews';
import SplashScreen from '../screens/loginScreens/SplashScreen';
import SportsNews from '../screens/userScreens/SportsNews';
import LoginSignupScreen from '../screens/loginScreens/LoginSignupScreen';
import LoginScreen from '../screens/loginScreens/LoginScreen';
import SignupScreen from '../screens/loginScreens/SignupScreen';
import EditScreen from '../screens/userScreens/EditScreen';
import JournalistLoginScreen from '../screens/loginScreens/JournalistLoginScreen';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../redux/reducers';
import JournalistSettingScreen from '../screens/journalistScreens/JournalistSettingScreen';
import TrendingNews from '../screens/userScreens/TrendingNews';
import HomeNews from '../screens/userScreens/HomeNews';

const Stack = createStackNavigator();

// Configure Redux store
const store = configureStore({
    reducer: rootReducer
});

const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
            initialRouteName="Splash"
        >
            <Stack.Screen name='Splash' component={SplashScreen} />
            <Stack.Screen name='LoginSignup' component={LoginSignupScreen} />
            <Stack.Screen name='LoginScreen' component={LoginScreen} />
            <Stack.Screen name='SignupScreen' component={SignupScreen} />
            <Stack.Screen name='EditScreen' component={EditScreen} />
            <Stack.Screen name="Main" component={BottomTabNavigation} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name='HomeScreen' component={HomeNews} />
            <Stack.Screen name="Notification" component={NotificationScreen} />
            <Stack.Screen name="Trending" component={TrendingNews} />
            <Stack.Screen name='Setting' component={SettingsScreen} />
            <Stack.Screen name="Nationals" component={NationalNews} />
            <Stack.Screen name="Internationals" component={InternationalNews} />
            <Stack.Screen name="Districts" component={DistrictNews} />
            <Stack.Screen name="Entertainments" component={EntertainmentNews} />
            <Stack.Screen name='SportsNews' component={SportsNews} />
            <Stack.Screen name="JournalistLoginScreen" component={JournalistLoginScreen} />
            <Stack.Screen name="JournalistMain" component={JournalistBottomTabNavigation} />
            <Stack.Screen name='JournalistSetting' component={JournalistSettingScreen} />
        </Stack.Navigator>
    );
};

const Navigation = () => {
    return (
        <Provider store={store}>
            <NavigationContainer>
                <AppNavigator />
            </NavigationContainer>
        </Provider>
    );
};

export default Navigation;