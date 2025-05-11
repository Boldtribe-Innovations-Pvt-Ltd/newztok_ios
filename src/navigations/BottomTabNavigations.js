import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BLACK, RED, WHITE } from '../constants/color';
import { MainScreenTopTabNavigation } from "./TopTabNavigation";
import ProfileScreen from "../screens/userScreens/ProfileScreen";
import NotificationScreen from "../screens/userScreens/NotificationScreen";
import SearchScreen from "../screens/userScreens/SearchScreen";
import JournalistBottomTabNavigation from "./JournalistBottomTabNavigation";

const Tab = createBottomTabNavigator();

//=====================================================================
// USER BOTTOM TAB NAVIGATION
//=====================================================================

// Bottom Tab Navigation For Regular Users
export const UserBottomTabNavigation = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: WHITE,
                },
                tabBarActiveTintColor: RED,
                tabBarInactiveTintColor: BLACK,
            }}
            initialRouteName="Dashboard"
        >
            <Tab.Screen
                name="Dashboard"
                component={MainScreenTopTabNavigation}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="home-variant-outline"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarLabel: "Search",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="search-web"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Notification"
                component={NotificationScreen}
                options={{
                    tabBarLabel: "Notification",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="bell-outline"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: "Profile",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="account-circle-outline"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

//=====================================================================
// MAIN BOTTOM TAB NAVIGATION SELECTOR
//=====================================================================

// Main Bottom Tab Navigation that decides which navigation to show
export const BottomTabNavigation = ({ route }) => {
    // Handle case when no route or route.params is provided (like when loaded directly after splash screen)
    if (!route || !route.params) {
        console.log("No route params provided to BottomTabNavigation, defaulting to user navigation");
        return <UserBottomTabNavigation />;
    }
    
    const isJournalist = route.params?.isJournalist || false;
    return isJournalist ? <JournalistBottomTabNavigation /> : <UserBottomTabNavigation />;
};

export default BottomTabNavigation;