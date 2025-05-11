import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BLACK, RED, WHITE } from '../constants/color';
import { JournalistTopTabNavigation } from "./JournalistTopTabNavigation";
import JournalistProfileScreen from "../screens/userScreens/JournalistProfileScreen";
import AddPostTabNavigation from "./AddPostTabNavigation";
import PostScreens from "../screens/userScreens/journalistScreens/PostScreens";
import PendingPostScreens from "../screens/userScreens/journalistScreens/PendingPostScreens";
import RejectPostScreens from "../screens/userScreens/journalistScreens/RejectPostScreens";

const Tab = createBottomTabNavigator();

//=====================================================================
// JOURNALIST BOTTOM TAB NAVIGATION
//=====================================================================

// Bottom Tab Navigation For Journalists
export const JournalistBottomTabNavigation = () => {
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
                component={JournalistTopTabNavigation} // Integrate TopTabNavigation
                options={{
                    tabBarLabel: "Overview",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="view-dashboard" // Icon name
                            color={color}  // Uses the color provided by the tab bar state
                            size={26} // Icon size
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Add Post"
                component={AddPostTabNavigation}
                initialParams={{ isJournalist: true }}
                options={{
                    tabBarLabel: "Add Post",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="folder"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Post"
                component={PostScreens}
                initialParams={{ isJournalist: true }}
                options={{
                    tabBarLabel: "Post",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="post"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Pending"
                component={PendingPostScreens}
                initialParams={{ isJournalist: true }}
                options={{
                    tabBarLabel: "Pending",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="clock-outline"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Reject"
                component={RejectPostScreens}
                initialParams={{ isJournalist: true }}
                options={{
                    tabBarLabel: "Reject",
                    tabBarIcon: ({ focused, color }) => (
                        <MaterialCommunityIcons
                            name="delete"
                            color={color}
                            size={26}
                        />
                    ),
                }}
            />

            <Tab.Screen
                name="Profile"
                component={JournalistProfileScreen}
                initialParams={{ isJournalist: true }}
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

// Ensure both named and default export are available
export default JournalistBottomTabNavigation;