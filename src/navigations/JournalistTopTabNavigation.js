import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StatusBar, StyleSheet, View } from 'react-native';
import { BLACK, RED, WHITE } from '../constants/color';
import { MyHeader } from '../components/commonComponents/MyHeader';
import ApprovedPost from '../screens/userScreens/journalistPostData/ApprovedPost';
import PendingApproved from '../screens/userScreens/journalistPostData/PendingApproved';
import RejectPost from '../screens/userScreens/journalistPostData/RejectPost';
import { MyStatusBar } from '../components/commonComponents/MyStatusBar';

const TopTab = createMaterialTopTabNavigator();

// TopTab Navigation for Journalists
export const JournalistTopTabNavigation = ({ route }) => {
    const isLoggedIn = route.params?.isLoggedIn || false;

    return (
        <View style={styles.container}>
            <MyStatusBar backgroundColor={WHITE} barStyle="dark-content" />
            <MyHeader
                showBackButton={false}
                isLoggedIn={true}
                showSettings={false}
                isJournalist={true}
                showLocationDropdown={false}
            />
            <TopTab.Navigator
                screenOptions={{
                    tabBarStyle: styles.tabBarStyle,
                    tabBarActiveTintColor: RED,
                    tabBarInactiveTintColor: BLACK,
                    tabBarLabelStyle: styles.tabBarLabelStyle,
                    tabBarScrollEnabled: true,
                    tabBarIndicatorStyle: styles.indicator,
                }}
            >
                <TopTab.Screen
                    name="Approve Post"
                    component={ApprovedPost}
                    options={{ title: 'Approve Post' }}
                    initialParams={{ isJournalist: true }}
                />
                <TopTab.Screen
                    name="Pending Approve Post"
                    component={PendingApproved}
                    options={{ title: 'Pending Approve Post' }}
                    initialParams={{ isJournalist: true }}
                />
                <TopTab.Screen
                    name="Reject Post"
                    component={RejectPost}
                    options={{ title: 'Reject Post' }}
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
    },
    tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    indicator: {
        height: 3,
        borderRadius: 1.5,
        backgroundColor: RED,
        marginHorizontal: 20,
    },
});

export default JournalistTopTabNavigation;