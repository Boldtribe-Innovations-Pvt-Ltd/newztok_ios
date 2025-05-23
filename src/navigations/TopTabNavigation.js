import React, { useState, useEffect, useRef } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View } from 'react-native';
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
import { RAMNABAMI } from '../constants/imagePath';
import TrendingNewzScreen from '../screens/userScreens/TrendingNewzScreen';

const TopTab = createMaterialTopTabNavigator();

//=====================================================================
// USER TOP TAB NAVIGATION
//=====================================================================

// TopTab Navigation for Regular Users

// List of screens where ads should be shown
const AD_ENABLED_SCREENS = [
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

    const [showAd, setShowAd] = useState(false);
    const adTimerRef = useRef(null);
    const [isActiveScreen, setIsActiveScreen] = useState(true);
    const [currentScreen, setCurrentScreen] = useState('Trending News'); // Default to first tab
    const [currentRouteName, setCurrentRouteName] = useState(null);

    // Try both methods for ad image source - use RAMNABAMI as fallback
    const adImageSource = RAMNABAMI || require('../assets/images/Launchposter.png');

    console.log('Ad image source:', adImageSource);

    // Function to check if ads should be completely disabled based on current route
    const shouldDisableAds = () => {
        if (!currentRouteName) return false;
        return AD_DISABLED_ROUTES.includes(currentRouteName);
    };

    const handleAdClose = () => {
        setShowAd(false);
        // Restart timer after ad is closed
        startAdTimer();
    };

    // Function to start the ad timer
    const startAdTimer = () => {
        // Clear any existing timer first
        if (adTimerRef.current) {
            clearInterval(adTimerRef.current);
            adTimerRef.current = null;
        }

        // Only set timer if not in a disabled route
        if (shouldDisableAds()) {
            console.log('Ad timer not started: currently in ad-disabled route:', currentRouteName);
            return;
        }

        // Set a new timer to show ad every 220 seconds
        adTimerRef.current = setInterval(() => {
            // Check again if ads should be disabled before showing
            if (shouldDisableAds()) {
                console.log('Ad blocked: currently in ad-disabled route:', currentRouteName);
                return;
            }

            // Only show ads if the current screen is in the AD_ENABLED_SCREENS list and the app is in foreground
            if (isActiveScreen && AD_ENABLED_SCREENS.includes(currentScreen)) {
                console.log('Ad timer triggered, showing PopoverAd on screen:', currentScreen);
                setShowAd(true);
            } else {
                console.log('Ad timer triggered, but ads disabled for screen:', currentScreen);
            }
        }, 210000); // 210 seconds
    };

    // Handle tab change to track current screen
    const handleTabChange = (state) => {
        if (!state) return;

        const routes = state.routes;
        const index = state.index;
        if (routes && routes[index]) {
            setCurrentScreen(routes[index].name);
            console.log('Current screen changed to:', routes[index].name);
        }
    };

    // Track route changes across the app - only if navigation object exists
    useEffect(() => {
        // If navigation is undefined, skip this effect
        if (!navigation) {
            console.log('Navigation object is undefined, skipping route tracking');
            return;
        }

        try {
            // Function to get current route name
            const getActiveRouteName = (state) => {
                if (!state || !state.routes || !state.routes[state.index]) {
                    return null;
                }

                const route = state.routes[state.index];
                if (route.state) {
                    // Dive into nested navigators
                    return getActiveRouteName(route.state);
                }
                return route.name;
            };

            // Subscribe to navigation state changes
            const unsubscribe = navigation.addListener('state', (e) => {
                if (!e || !e.data || !e.data.state) return;

                const routeName = getActiveRouteName(e.data.state);
                if (routeName) {
                    setCurrentRouteName(routeName);
                    console.log('Current route changed to:', routeName);

                    // If route changes to one that should disable ads, hide any showing ad
                    if (AD_DISABLED_ROUTES.includes(routeName) && showAd) {
                        console.log('Hiding ad because route changed to ad-disabled route:', routeName);
                        setShowAd(false);
                    }

                    // Restart timer when route changes
                    startAdTimer();
                }
            });

            return unsubscribe;
        } catch (error) {
            console.log('Error setting up navigation listener:', error);
            return () => { };
        }
    }, [navigation, showAd]);

    // Clear the timer when unmounting
    useEffect(() => {
        // Start the timer when component mounts
        startAdTimer();

        // Handle screen focus changes - only if navigation exists
        if (navigation) {
            const unsubscribeFocus = navigation.addListener?.('focus', () => {
                setIsActiveScreen(true);
                console.log('TopTabNavigation is now focused');
                // Start ad timer when screen is focused
                startAdTimer();
            });

            const unsubscribeBlur = navigation.addListener?.('blur', () => {
                setIsActiveScreen(false);
                console.log('TopTabNavigation is now blurred');
                // Clear ad timer when screen loses focus
                if (adTimerRef.current) {
                    clearInterval(adTimerRef.current);
                    adTimerRef.current = null;
                }
            });

            return () => {
                // Cleanup when unmounting
                if (adTimerRef.current) {
                    clearInterval(adTimerRef.current);
                    adTimerRef.current = null;
                }

                if (unsubscribeFocus) unsubscribeFocus();
                if (unsubscribeBlur) unsubscribeBlur();
            };
        } else {
            // If no navigation object, just clean up the timer
            return () => {
                if (adTimerRef.current) {
                    clearInterval(adTimerRef.current);
                    adTimerRef.current = null;
                }
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
                    state: (e) => handleTabChange(e.data.state)
                }}
            >
                <TopTab.Screen
                    name="Home"
                    component={MainScreen}
                    options={{ title: 'Home' }}
                    initialParams={{ isLoggedIn }}
                />

                <TopTab.Screen
                    name="Trending News"
                    component={TrendingNewzScreen}
                    options={{ title: 'Trending' }}
                    initialParams={{ isLoggedIn }}
                />

                <TopTab.Screen
                    name="National"
                    component={NationalNewzScreen}
                    options={{ title: 'National' }}
                    initialParams={{ isLoggedIn }}
                />
                <TopTab.Screen
                    name="International"
                    component={InternationalNewzScreen}
                    options={{ title: 'International' }}
                    initialParams={{ isLoggedIn }}
                />
                <TopTab.Screen
                    name="State"
                    component={DistrictNewzScreen}
                    options={{ title: 'State' }}
                    initialParams={{ isLoggedIn }}
                />
                <TopTab.Screen
                    name="Sports"
                    component={SportsNewzScreen}
                    options={{ title: 'Sports' }}
                    initialParams={{ isLoggedIn }}
                />
                <TopTab.Screen
                    name="Entertainment"
                    component={EntertainmentNewzScreen}
                    options={{ title: 'Entertainment' }}
                    initialParams={{ isLoggedIn }}
                />
            </TopTab.Navigator>

            {/* Ad Popover */}
            {showAd && <PopoverAd onClose={handleAdClose} imageSource={adImageSource} />}
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