import React, { useState, useEffect, useRef } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View, NativeEventEmitter, NativeModules } from 'react-native';
import MainScreen from '../screens/userScreens/MainScreen';
import NationalNewzScreen from '../screens/userScreens/NationalNewzScreen';
import InternationalNewzScreen from '../screens/userScreens/InternationalNewzScreen';
import DistrictNewzScreen from '../screens/userScreens/DistrictNewzScreen';
import SportsNewzScreen from '../screens/userScreens/SportsNewzScreen';
import EntertainmentNewzScreen from '../screens/userScreens/EntertainmentNewzScreen';
import { MyHeader } from '../components/commonComponents/MyHeader';
import { BLACK, BLUE, RED, WHITE } from '../constants/color';
import { JournalistTopTabNavigation } from './JournalistTopTabNavigation';
import PopoverAd from '../components/ads/PopoverAd';
import TrendingNewzScreen from '../screens/userScreens/TrendingNewzScreen';

const TopTab = createMaterialTopTabNavigator();

//=====================================================================
// USER TOP TAB NAVIGATION
//=====================================================================

// TopTab Navigation for Regular Users

// List of screens where ads should be shown
const AD_ENABLED_SCREENS = [
    'Home',
    'Trending News',
    'National',
    'International',
    'State',
    'Sports',
    'Entertainment'
];

// List of routes where ads should be completely disabled
const AD_DISABLED_ROUTES = [
    'LoginScreen',
    'SignupScreen',
    'LoginSignup',
    'Profile',
    'Setting',
    'Search',
    'EditScreen',
    'JournalistMain',
    'JournalistProfile',
    'JournalistSettingScreen'
];

export const UserTopTabNavigation = ({ navigation, route }) => {
    const isLoggedIn = route.params?.isLoggedIn || false;

    // PopoverAd state variables and refs
    const [showAd, setShowAd] = useState(false);
    const [isActiveScreen, setIsActiveScreen] = useState(true);
    const [currentScreen, setCurrentScreen] = useState('Home');
    const [currentRouteName, setCurrentRouteName] = useState(null);
    const scrollCountRef = useRef(0); // Global scroll count that persists across tabs



    // Function to check if ads should be completely disabled based on current route
    const shouldDisableAds = () => {
        if (!currentRouteName) return false;
        return AD_DISABLED_ROUTES.includes(currentRouteName);
    };

    const handleAdClose = () => {
        console.log('❌ POPOVER AD CLOSED');
        console.log('📊 Current scroll count after ad close:', scrollCountRef.current);
        setShowAd(false);
    };

    // Function to handle scroll events
    const handleScroll = () => {
        if (shouldDisableAds() || !isActiveScreen || !AD_ENABLED_SCREENS.includes(currentScreen)) {
            console.log('Scroll blocked - Screen:', currentScreen, 'IsActive:', isActiveScreen, 'AdsDisabled:', shouldDisableAds());
            return;
        }

        scrollCountRef.current += 1;
        console.log('🔥 SCROLL EVENT - Current Screen:', currentScreen);
        console.log('📊 Scroll Count:', scrollCountRef.current);
        console.log('🎯 Scrolls until next ad:', 7 - scrollCountRef.current);
        
        if (scrollCountRef.current >= 7) { // Show ad on 7th scroll (after every 7 scrolls)
            console.log('🚀 SHOWING POPOVER AD - Scroll count reached 7!');
            setShowAd(true);
            scrollCountRef.current = 0; // Reset only after showing ad
            console.log('✅ Scroll count reset to 0');
        }
    };

    // Handle tab change to track current screen - maintain scroll count
    const handleTabChange = (state) => {
        if (!state) return;

        const routes = state.routes;
        const index = state.index;
        if (routes && routes[index]) {
            setCurrentScreen(routes[index].name);
            // Don't reset scroll count when changing tabs - this maintains persistence
            console.log('🔄 TAB CHANGED');
            console.log('📍 New Tab:', routes[index].name);
            console.log('📊 Persistent Scroll Count:', scrollCountRef.current);
            console.log('🎯 Scrolls until next ad:', 7 - scrollCountRef.current);
        }
    };

    // Track route changes and handle navigation events
    useEffect(() => {
        if (!navigation) return;

        const getActiveRouteName = (state) => {
            if (!state?.routes?.[state.index]) return null;
            const route = state.routes[state.index];
            return route.state ? getActiveRouteName(route.state) : route.name;
        };

        const unsubscribe = navigation.addListener('state', (e) => {
            if (!e?.data?.state) return;

            const routeName = getActiveRouteName(e.data.state);
            if (routeName) {
                setCurrentRouteName(routeName);
                if (AD_DISABLED_ROUTES.includes(routeName) && showAd) {
                    setShowAd(false);
                }
            }
        });

        return unsubscribe;
    }, [navigation, showAd]);

    // Handle component lifecycle and screen focus
    useEffect(() => {
        if (navigation) {
            const unsubscribeFocus = navigation.addListener('focus', () => {
                setIsActiveScreen(true);
            });

            const unsubscribeBlur = navigation.addListener('blur', () => {
                setIsActiveScreen(false);
            });

            return () => {
                unsubscribeFocus();
                unsubscribeBlur();
            };
        }
    }, [navigation]);

    return (
        <View style={styles.container}>
            <MyHeader
                showBackButton={false}
                isLoggedIn={isLoggedIn}
                showSettings={isLoggedIn}
                showDistrictLocation={true}
            />
            {/* Top Tabs */}
            <TopTab.Navigator
                screenOptions={{
                    tabBarStyle: styles.tabBarStyle,
                    tabBarActiveTintColor: RED,
                    tabBarInactiveTintColor: BLACK,
                    tabBarLabelStyle: styles.tabBarLabelStyle,
                    tabBarScrollEnabled: true,
                    tabBarIndicatorStyle: styles.indicator,
                }}
                screenListeners={{
                    state: (e) => handleTabChange(e.data.state),
                }}
            >
                <TopTab.Screen
                    name="Home"
                    component={MainScreen}
                    options={{ title: 'Home' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />

                <TopTab.Screen
                    name="Trending News"
                    component={TrendingNewzScreen}
                    options={{ title: 'Trending' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />

                <TopTab.Screen
                    name="National"
                    component={NationalNewzScreen}
                    options={{ title: 'National' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />
                <TopTab.Screen
                    name="International"
                    component={InternationalNewzScreen}
                    options={{ title: 'International' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />
                <TopTab.Screen
                    name="State"
                    component={DistrictNewzScreen}
                    options={{ title: 'State' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />
                <TopTab.Screen
                    name="Sports"
                    component={SportsNewzScreen}
                    options={{ title: 'Sports' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />
                <TopTab.Screen
                    name="Entertainment"
                    component={EntertainmentNewzScreen}
                    options={{ title: 'Entertainment' }}
                    initialParams={{ 
                        isLoggedIn,
                        onScroll: handleScroll // Pass scroll handler to screen
                    }}
                />
            </TopTab.Navigator>

            {/* Ad Popover - Only show when ads are available */}
            {showAd && <PopoverAd onClose={handleAdClose} />}
        </View>
    );
};

//=====================================================================
// MAIN TOP TAB NAVIGATION SELECTOR
//=====================================================================

// Main TopTab Navigation that decides which navigation to show
export const MainScreenTopTabNavigation = ({ route }) => {
    const isJournalist = route.params?.isJournalist || false;

    return isJournalist ? <JournalistTopTabNavigation route={route} /> : <UserTopTabNavigation route={route} />;
};

//=====================================================================
// SHARED STYLES
//=====================================================================

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
        elevation: 15,
    },
    tabBarLabelStyle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    indicator: {
        height: 4,
        borderRadius: 2,
        backgroundColor: RED,
        marginHorizontal: 20,
    },
    districtTab: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    districtText: {
        fontSize: 14,
        fontWeight: '600',
        color: BLACK,
    },
    districtIcon: {
        width: 14,
        height: 14,
        marginLeft: 5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: WHITE,
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: BLACK,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    radioSelected: {
        backgroundColor: BLUE,
    },
    modalText: {
        fontSize: 16,
        fontWeight: '500',
        color: BLACK,
    },
});

export default MainScreenTopTabNavigation;