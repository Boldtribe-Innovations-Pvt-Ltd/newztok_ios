import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View } from 'react-native';
import { BLACK, RED, WHITE } from '../constants/color';
import { MyHeader } from '../components/commonComponents/MyHeader';
import StandardPostScreen from '../screens/userScreens/journalistPostData/StandardPostScreen';
import VideoPostScreen from '../screens/userScreens/journalistPostData/VideoPostScreen';

const TopTab = createMaterialTopTabNavigator();

// TopTab Navigation for Add Post screens (Standard and Video content)
export const AddPostTabNavigation = ({ route }) => {
    const isJournalist = true; // This is for the journalist section

    return (
        <View style={styles.container}>
            <MyHeader
                showBackButton={false}
                isLoggedIn={true}
                showSettings={false}
                isJournalist={true}
                showLocationDropdown={false}
                title="Add New Post"
            />
            <TopTab.Navigator
                screenOptions={{
                    tabBarStyle: styles.tabBarStyle,
                    tabBarActiveTintColor: RED,
                    tabBarInactiveTintColor: BLACK,
                    tabBarLabelStyle: styles.tabBarLabelStyle,
                    tabBarItemStyle: styles.tabBarItemStyle,
                    tabBarScrollEnabled: true,
                    tabBarIndicatorStyle: styles.indicator,
                }}
            >
                <TopTab.Screen
                    name="Standard Content"
                    component={StandardPostScreen}
                    options={{ title: 'Standard Content' }}
                    initialParams={{ isJournalist: true }}
                />
                <TopTab.Screen
                    name="Video Content"
                    component={VideoPostScreen}
                    options={{ title: 'Video Content' }}
                    initialParams={{ isJournalist: true }}
                />
            </TopTab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    tabBarStyle: {
        backgroundColor: WHITE,
        shadowColor: BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        paddingHorizontal: 15,
    },
    tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    tabBarItemStyle: {
        width: 'auto',
        marginHorizontal: 20,
    },
    indicator: {
        height: 3,
        borderRadius: 1.5,
        backgroundColor: RED,
        marginHorizontal: 20,
    },
});

export default AddPostTabNavigation; 