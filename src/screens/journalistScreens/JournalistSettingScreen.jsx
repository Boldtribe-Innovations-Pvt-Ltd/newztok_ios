import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking, ScrollView, Modal, Platform, StatusBar } from "react-native";
import { BLACK, BLUE, RED, WHITE } from "../../constants/color";
import { HEIGHT, WIDTH } from "../../constants/config";
import { BOLDMONTSERRAT, POPPINSLIGHT, POPPINSMEDIUM } from "../../constants/fontPath";
import { MyStatusBar } from "../../components/commonComponents/MyStatusBar";
import { MyHeader } from "../../components/commonComponents/MyHeader";
import { MOON, RIGHTARROW, SUN, APPLOGO, LOGO } from "../../constants/imagePath";
import { GETNETWORK } from "../../utils/Network";
import { BASE_URL } from "../../constants/url";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { storeStringByKey } from '../../utils/Storage';

export default JournalistSettingScreen = ({ navigation }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isNotificationsOn, setIsNotificationsOn] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const dispatch = useDispatch();

    const onNavigationBack = () => {
        navigation.goBack();
    };

    const handleLogout = async () => {
        try {
            // Construct the logout URL
            const url = `${BASE_URL}api/auth/logout`;
            console.log("Logging out from:", url);
            
            // Make the logout API call
            const response = await GETNETWORK(url, true);
            console.log("Logout response:", response);
        } catch (error) {
            console.log("Error during logout API call:", error.message);
            // Continue with logout process even if API call fails
        }
        
        // Clear all authentication and user data from storage
        try {
            console.log("Clearing all auth and user data...");
            
            // Clear token from both storage methods
            await AsyncStorage.removeItem('loginResponse');
            await storeStringByKey("loginResponse", "");
            
            // Clear user role and journalist flags
            await AsyncStorage.removeItem('isJournalist');
            await storeStringByKey("isJournalist", "");
            
            // Clear user data
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('userToken');
            
            // Clear refresh tokens
            await AsyncStorage.removeItem('refresh_token');
            await AsyncStorage.removeItem('refreshToken');
            await storeStringByKey("refreshToken", "");
            
            // Clear user role
            await AsyncStorage.removeItem('userRole');
            await storeStringByKey("userRole", "");
            
            console.log("✅ All auth data cleared successfully");
            
            // Update Redux state
            dispatch({ type: 'LOGOUT' });
            console.log("✅ Redux store updated with LOGOUT action");
        } catch (storageError) {
            console.log("Error clearing auth data:", storageError);
        }
        
        // Navigate to Main screen with proper params
        console.log("Navigating to Main screen as guest");
        navigation.reset({
            index: 0,
            routes: [{ 
                name: 'Main',
                params: {
                    isJournalist: false,
                    isLoggedIn: false
                }
            }],
        });
    };

    const openSupportMail = () => {
        Linking.openURL("mailto:support@newztok.com");
    };

    const TermsAndConditionsContent = () => (
        <View style={styles.modalContentContainer}>
            <View style={styles.titleLogoContainer}>
                <Image source={LOGO} style={styles.contentLogo} />
                <Text style={styles.modalTitle}>Terms & Conditions</Text>
            </View>

            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.modalText}>
                Welcome to Newztok, a digital news aggregation and social media platform powered by Newztok Media Solutions Pvt. Ltd. By using this platform, you agree to be bound by these Terms & Conditions ("Terms"). These Terms apply to all users, including general users, editors, and journalists.{'\n'}
                We operate primarily in India with a focus on content from Bihar, Uttar Pradesh, and Jharkhand.
            </Text>

            <Text style={styles.sectionTitle}>2. Platform Nature and Disclaimer</Text>
            <Text style={styles.modalText}>
                • Newztok functions as a news aggregator and social engagement platform.{'\n'}
                • We provide tools for users to post, view, comment, and share content.{'\n'}
                • Newztok is not responsible for the authenticity, accuracy, or legality of any user-generated content including posts, comments, or shared media.
            </Text>

            <Text style={styles.sectionTitle}>3. User-Generated Content</Text>
            <Text style={styles.modalText}>
                Users are solely responsible for the content they create, upload, or interact with.{'\n'}
                • Newztok does not endorse or verify user-submitted content.{'\n'}
                • We are not liable for any allegations, legal actions, or disputes arising out of user posts or comments.{'\n'}
                • Users must refrain from sharing:{'\n'}
                o Hate speech, abusive or defamatory content.{'\n'}
                o Misinformation or unverified claims.{'\n'}
                o Content that violates copyright or legal boundaries.{'\n'}
                Violation of this section may lead to content removal and account suspension.
            </Text>

            <Text style={styles.sectionTitle}>4. Content creator/Writer Specific Terms</Text>
            <Text style={styles.modalText}>
                These terms apply to individuals working as Content creator or writers on the Newztok platform.
            </Text>
            <Text style={styles.subSectionTitle}>4.1 Responsibilities</Text>
            <Text style={styles.modalText}>
                Content creators/writers:{'\n'}
                • Prepare, refine, and submit news content under assigned categories.{'\n'}
                • Ensure grammatical accuracy, relevance, and clarity.{'\n'}
                • Verify the authenticity, sources, and neutrality of submitted content.{'\n'}
                • Approve, reject, or suggest changes to content promptly.{'\n'}
                • Ensure that news items follow ethical public standards.
            </Text>
            <Text style={styles.subSectionTitle}>4.2 Ownership and Liability</Text>
            <Text style={styles.modalText}>
                • Content creators/writers retain authorship of their respective contributions.{'\n'}
                • Newztok Media Solutions Private Limited acts solely as a publishing platform and is not liable for the content produced by content creators/writers.{'\n'}
                • Individuals are personally liable for any legal disputes, fake contents, or misinformation published under their name.
            </Text>
            <Text style={styles.subSectionTitle}>4.3 Plagiarism & Misconduct</Text>
            <Text style={styles.modalText}>
                • Plagiarism or spreading misinformation is strictly prohibited.{'\n'}
                • Violation may lead to termination, blacklisting, and possible legal action under applicable laws.
            </Text>
            <Text style={styles.subSectionTitle}>4.4 Termination</Text>
            <Text style={styles.modalText}>
                Newztok may terminate access or association with any content creators/writers without notice for:{'\n'}
                • Policy violations.{'\n'}
                • Repeated rejection of contents.{'\n'}
                • Public or legal complaints.
            </Text>

            <Text style={styles.sectionTitle}>5. Copyright</Text>
            <Text style={styles.modalText}>
                All platform features, branding, and original design are protected under copyright law.{'\n'}
                ©️ Newztok Media Solutions Private Limited{'\n'}
                All Rights Reserved.{'\n'}
                Unauthorized reproduction, scraping, or duplication of platform content without prior permission is prohibited.
            </Text>

            <Text style={styles.sectionTitle}>6. Third-Party Links and Sources</Text>
            <Text style={styles.modalText}>
                Newztok may link to third-party content or sources. We are not responsible for:{'\n'}
                • The reliability or accuracy of external content.{'\n'}
                • Privacy practices of external websites.
            </Text>

            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.modalText}>
                Newztok Media Solutions Pvt. Ltd. is not liable for:{'\n'}
                • Content submitted by users, content creators, or content writers.{'\n'}
                • Indirect, incidental, or consequential damages.{'\n'}
                • Claims arising out of external sharing or misuse of content.
            </Text>

            <Text style={styles.sectionTitle}>8. Governing Law</Text>
            <Text style={styles.modalText}>
                These Terms shall be governed in accordance with Indian laws. Any disputes will fall under the jurisdiction of the courts of Patna, Bihar unless otherwise specified.
            </Text>

            <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
            <Text style={styles.modalText}>
                We may update these Terms from time to time. Continued use of the platform implies acceptance of the latest Terms.
            </Text>

            <View style={styles.copyrightContainer}>
                <Text style={styles.copyrightMainText}>©️ Newztok Media</Text>
                <Text style={styles.copyrightSubText}>Solutions Pvt. Ltd.</Text>
            </View>
        </View>
    );

    const PrivacyPolicyContent = () => (
        <View style={styles.modalContentContainer}>
            <View style={styles.titleLogoContainer}>
                <Image source={LOGO} style={styles.contentLogo} />
                <Text style={styles.modalTitle}>PRIVACY POLICY</Text>
            </View>

            <Text style={styles.sectionTitle}>1. GENERAL</Text>
            <Text style={styles.modalText}>
                1.1 Newztok Media Solutions Pvt. Ltd. ("Newztok", "We", "Our", "Us") is committed to the responsible collection, usage, and protection of your personal data in accordance with the Digital Personal Data Protection (DPDP) Act, 2023.{'\n'}
                1.2 By accessing or using the Newztok application ("App") or website ("Platform"), you ("User", "You", "Your") consent to the collection, processing, storage, and usage of your personal data as outlined in this Privacy Policy.{'\n'}
                1.3 This Privacy Policy applies to all Users, including general users, editors, and journalists, and should be read in conjunction with our Terms & Conditions. By continuing to use the platform, you confirm your agreement to this policy.{'\n'}
                1.4 Any undefined terms in this Privacy Policy will have the same meaning as defined in the Terms & Conditions.
            </Text>

            <Text style={styles.sectionTitle}>2. INFORMATION WE COLLECT</Text>
            <Text style={styles.subSectionTitle}>2.1 Traffic Data (Non-Personal Information)</Text>
            <Text style={styles.modalText}>
                We may automatically collect certain non-personal information from your device, including:{'\n'}
                • IP address{'\n'}
                • Device identifiers{'\n'}
                • Browser type and version{'\n'}
                • Time and date of your visits{'\n'}
                • Interaction data with the App (usage behaviour, logs){'\n'}
                • Device location and operating system{'\n'}
                This data helps us improve app performance, user experience, and security.
            </Text>
            <Text style={styles.subSectionTitle}>2.2 Personal Data</Text>
            <Text style={styles.modalText}>
                To provide specific services (e.g., user comments, content creators/writers logins, payment processing), we may collect:{'\n'}
                • Contact Information: such as name, email ID, phone number.{'\n'}
                • Device Data: mobile model, OS version, and unique identifiers.{'\n'}
                • Demographic Data: postal address, gender, time zone, language preference.{'\n'}
                • User-Generated Content: content posted or submitted by users, editors, or journalists.
            </Text>

            <Text style={styles.sectionTitle}>3. LAWFUL PURPOSES OF DATA USE</Text>
            <Text style={styles.modalText}>
                Under the DPDP Act 2023, we collect and process personal data for lawful purposes, such as:{'\n'}
                • Operating and improving the Newztok platform{'\n'}
                • Verifying identity and maintaining user accounts{'\n'}
                • Enabling content submission, editing, and moderation{'\n'}
                • Facilitating payments (for verified editors/journalists, where applicable){'\n'}
                • Sending important service updates or notifications{'\n'}
                • Protecting our rights and preventing misuse{'\n'}
                We do not sell or share personal data with any third party for direct marketing purposes without explicit consent.
            </Text>

            <Text style={styles.sectionTitle}>4. CONSENT</Text>
            <Text style={styles.modalText}>
                • Your continued use of the Newztok platform implies your consent to this Privacy Policy.{'\n'}
                • You may withdraw consent at any time by contacting us at support@newztok.com, subject to applicable legal obligations.{'\n'}
                • In the case of minors, data will only be processed after receiving verifiable consent from a parent or guardian, in compliance with Section 9 of the DPDP Act.
            </Text>

            <Text style={styles.sectionTitle}>5. DATA STORAGE AND SECURITY</Text>
            <Text style={styles.modalText}>
                • Personal data is stored on secure servers located in India.{'\n'}
                • We implement administrative, technical, and physical safeguards to protect your data from unauthorized access, loss, misuse, or alteration.{'\n'}
                • Access to personal data is strictly role-based and limited to authorized personnel.
            </Text>

            <Text style={styles.sectionTitle}>6. DATA RETENTION</Text>
            <Text style={styles.modalText}>
                • We retain your personal data only for as long as necessary to fulfil the purpose for which it was collected, or as required by law.{'\n'}
                • Data related to journalistic or editorial contributions may be retained longer for audit and compliance purposes.
            </Text>

            <Text style={styles.sectionTitle}>7. YOUR RIGHTS UNDER DPDP ACT 2023</Text>
            <Text style={styles.modalText}>
                As a user, you have the right to:{'\n'}
                • Access your personal data held by us{'\n'}
                • Correct inaccurate or misleading personal data{'\n'}
                • Withdraw consent at any time{'\n'}
                • Request erasure of your personal data (subject to retention laws){'\n'}
                • Nominate an individual to exercise your rights in case of incapacity or death{'\n'}
                To exercise your rights, please write to us at:{'\n'}
                support@newztok.com
            </Text>

            <Text style={styles.sectionTitle}>8. DATA SHARING & DISCLOSURE</Text>
            <Text style={styles.modalText}>
                We do not disclose your personal data to any third party without your consent, except:{'\n'}
                • To comply with applicable laws or legal processes{'\n'}
                • To enforce our terms or protect rights and safety{'\n'}
                • With verified service providers involved in platform operation (e.g., payment gateways), under strict data agreements
            </Text>

            <Text style={styles.sectionTitle}>9. CHANGES TO THIS POLICY</Text>
            <Text style={styles.modalText}>
                We reserve the right to update or modify this Privacy Policy at any time. Changes will be posted with an updated effective date. Continued use of the platform implies your acceptance of the revised policy.
            </Text>

            <Text style={styles.sectionTitle}>10. CONTACT US</Text>
            <Text style={styles.modalText}>
                For any questions or requests regarding your data or this Privacy Policy, contact:{'\n'}
                Newztok Media Solutions Pvt. Ltd.{'\n'}
                Email: support@newztok.com{'\n'}
                Address: M/5, Chandi Vyapar Bhawan, Exhibition Road, Chiraiyatand, Patna, Phulwari, Bihar, India, 800001
            </Text>

            <View style={styles.copyrightContainer}>
                <Text style={styles.copyrightMainText}>©️ Newztok Media</Text>
                <Text style={styles.copyrightSubText}>Solutions Pvt. Ltd.</Text>
            </View>
        </View>
    );

    return (
        <>
            {/* Status Bar */}
            <MyStatusBar backgroundColor={WHITE} />

            {/* Header Container */}
            <MyHeader showLocationDropdown={false} onPressBack={onNavigationBack} showLogo={false} showText={true} />

            {/* Main Container */}
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.innerContainer}>
                {/* Notification Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.text}>Notification</Text>
                    <TouchableOpacity
                        style={[styles.customSwitch, isNotificationsOn && styles.switchOn]}
                        onPress={() => setIsNotificationsOn(!isNotificationsOn)}
                    >
                        <View
                            style={[
                                styles.switchCircle,
                                isNotificationsOn ? styles.sliderRight : styles.sliderLeft,
                            ]}
                        />
                    </TouchableOpacity>
                </View>

                {/* Dark Mode Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.text}>Dark Mode</Text>
                    <TouchableOpacity
                        style={[styles.customSwitch, isDarkMode && styles.switchOn]}
                        onPress={() => setIsDarkMode(!isDarkMode)}
                    >
                        {/* Sun or Moon Icon */}
                        <View style={[styles.switchCircle, isDarkMode ? styles.sliderRight : styles.sliderLeft]}>
                            <Image source={isDarkMode ? MOON : SUN} style={styles.icon} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Horizontal Line */}
                <View style={styles.divider} />

                {/* Terms and Conditions */}
                    <TouchableOpacity style={styles.rowContainer} onPress={() => setShowTermsModal(true)}>
                    <Text style={styles.text}>Terms and Conditions</Text>
                        <Image source={RIGHTARROW} style={styles.icon} />
                </TouchableOpacity>

                {/* Privacy and Policy */}
                    <TouchableOpacity style={styles.rowContainer} onPress={() => setShowPrivacyModal(true)}>
                    <Text style={styles.text}>Privacy and Policy</Text>
                        <Image source={RIGHTARROW} style={styles.icon} />
                </TouchableOpacity>

                {/* Supporting Mail */}
                <TouchableOpacity style={styles.rowContainer} onPress={openSupportMail}>
                    <Text style={styles.text}>Supporting Mail</Text>
                        <Image source={RIGHTARROW} style={styles.icon} />
                </TouchableOpacity>

                {/* Rate This App */}
                <TouchableOpacity style={styles.rowContainer}>
                    <Text style={styles.text}>Rate This App</Text>
                        <Image source={RIGHTARROW} style={styles.icon} />
                </TouchableOpacity>

                {/* App Version */}
                <View style={styles.rowContainer}>
                    <Text style={styles.text}>App Version</Text>
                    <Text style={styles.version}>V0.1</Text>
                </View>

                    {/* Horizontal Line */}
                    <View style={styles.divider} />

                {/* Logout */}
                    <TouchableOpacity style={[styles.rowContainer, styles.logoutContainer]} onPress={handleLogout}>
                        <Text style={[styles.text, {color: RED}]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Terms and Conditions Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={showTermsModal}
                onRequestClose={() => setShowTermsModal(false)}
                statusBarTranslucent={true}
            >
                <View style={styles.modalContainer}>
                    <MyStatusBar backgroundColor={WHITE} barStyle="dark-content" />
                    <View style={styles.modalHeader}>
                        <View style={styles.logoContainer}>
                            <Image source={APPLOGO} style={styles.modalLogo} />
                        </View>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setShowTermsModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                        <TermsAndConditionsContent />
                    </ScrollView>
                </View>
            </Modal>

            {/* Privacy Policy Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={showPrivacyModal}
                onRequestClose={() => setShowPrivacyModal(false)}
                statusBarTranslucent={true}
            >
                <View style={styles.modalContainer}>
                    <MyStatusBar backgroundColor={WHITE} barStyle="dark-content" />
                    <View style={styles.modalHeader}>
                        <View style={styles.logoContainer}>
                            <Image source={APPLOGO} style={styles.modalLogo} />
                        </View>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={() => setShowPrivacyModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                        <PrivacyPolicyContent />
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    innerContainer: {
        padding: WIDTH * 0.04,
        paddingBottom: HEIGHT * 0.05,
    },
    rowContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: HEIGHT * 0.02, 
        marginVertical: HEIGHT * 0.01,
    },
    customSwitch: {
        width: WIDTH * 0.13,
        height: HEIGHT * 0.03,
        backgroundColor: "#ccc",
        borderRadius: HEIGHT * 0.015,
        justifyContent: "center",
        paddingHorizontal: WIDTH * 0.01,
        position: "relative",
    },
    switchCircle: {
        width: HEIGHT * 0.026,
        height: HEIGHT * 0.026,
        borderRadius: HEIGHT * 0.013,
        backgroundColor: BLACK,
        alignItems: "center",
        justifyContent: "center",
    },
    sliderLeft: {
        position: "absolute",
        left: WIDTH * 0.005,
    },
    sliderRight: {
        position: "absolute",
        right: WIDTH * 0.005,
    },
    switchOn: {
        backgroundColor: BLUE,
    },
    text: {
        fontSize: WIDTH * 0.038,
        color: BLACK,
        fontFamily: BOLDMONTSERRAT,
    },
    icon: {
        width: WIDTH * 0.035,
        height: WIDTH * 0.035,
    },
    email: {
        fontSize: WIDTH * 0.038,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
    },
    version: {
        fontSize: WIDTH * 0.038,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
    },
    divider: {
        height: 1,
        backgroundColor: "#ccc",
        marginVertical: HEIGHT * 0.025,
    },
    logoutContainer: {
        marginTop: HEIGHT * 0.01,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: WHITE,
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: HEIGHT * 0.1,
        backgroundColor: WHITE,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        position: 'relative',
        paddingHorizontal: WIDTH * 0.04,
        marginTop: Platform.OS === 'ios' ? HEIGHT * 0.05 : 0,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    modalLogo: {
        width: WIDTH * 0.5,
        height: HEIGHT * 0.08,
        resizeMode: 'contain',
    },
    closeButton: {
        position: 'absolute',
        right: WIDTH * 0.04,
        padding: WIDTH * 0.02,
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: WIDTH * 0.05,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
    },
    modalScrollView: {
        flex: 1,
        backgroundColor: WHITE,
    },
    modalContentContainer: {
        padding: WIDTH * 0.04,
        paddingBottom: HEIGHT * 0.05,
    },
    modalTitle: {
        fontSize: WIDTH * 0.055,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
        textAlign: 'center',
        marginVertical: HEIGHT * 0.02,
    },
    modalSubTitle: {
        fontSize: WIDTH * 0.034,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
        textAlign: 'center',
        marginBottom: HEIGHT * 0.03,
    },
    sectionTitle: {
        fontSize: WIDTH * 0.042,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
        marginTop: HEIGHT * 0.025,
        marginBottom: HEIGHT * 0.01,
    },
    subSectionTitle: {
        fontSize: WIDTH * 0.038,
        color: BLACK,
        fontFamily: POPPINSMEDIUM,
        marginTop: HEIGHT * 0.015,
        marginBottom: HEIGHT * 0.005,
    },
    modalText: {
        fontSize: WIDTH * 0.034,
        color: BLACK,
        fontFamily: POPPINSLIGHT,
        lineHeight: HEIGHT * 0.025,
    },
    copyrightContainer: {
        alignItems: 'center',
        marginTop: HEIGHT * 0.04,
        marginBottom: HEIGHT * 0.02,
    },
    copyrightMainText: {
        fontSize: WIDTH * 0.04,
        color: RED,
        fontFamily: POPPINSMEDIUM,
        textAlign: 'center',
    },
    copyrightSubText: {
        fontSize: WIDTH * 0.038,
        color: RED,
        fontFamily: POPPINSMEDIUM,
        textAlign: 'center',
        marginTop: HEIGHT * 0.005,
    },
    titleLogoContainer: {
        alignItems: 'center',
        marginBottom: HEIGHT * 0.02,
    },
    contentLogo: {
        width: WIDTH * 0.9,
        height: HEIGHT * 0.09,
        resizeMode: 'contain',
        marginBottom: HEIGHT * 0.015,
    },
}); 