import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, LogBox, Platform, Alert } from 'react-native';
import { MyStatusBar } from '../../components/commonComponents/MyStatusBar';
import { BLACK, RED, WHITE, BLUE, GREY } from '../../constants/color';
import { MyHeader } from '../../components/commonComponents/MyHeader';
import { 
    APPROVED, 
    REJECTED, 
    PENDING,
    RIGHTARROW,
    ACCOUNT,
    PERSON
} from '../../constants/imagePath';
import { GETNETWORK } from '../../utils/Network';
import { BASE_URL } from '../../constants/url';
import { getObjByKey, getStringByKey } from '../../utils/Storage';
import { useNavigation } from '@react-navigation/native';

// Sample news data - replace with your actual data source
const newsData = [
    {
        id: '1',
        title: 'Israeli attacks kill dozens in Gaza ahead of ceasefire on Sunday',
        description: 'After 15 months of war that began with a brutal attack on Israel by Hamas and ended with much of the Gaza Strip levelled by Israel, a ceasefire came into effect on Sunday that saw three women hostages released from Gaza and 90 Palestinians freed from Israeli jails in return.'
    },
    // Add more items as needed
]; 

const NewsItem = ({ item }) => (
    <View style={styles.newsItem}>
        <Image 
            source={item.featured_image ? { uri: `${BASE_URL}${item.featured_image}` } : ACCOUNT}
            style={styles.newsImage}
            resizeMode="cover"
        />
        <View style={styles.newsContent}>
            <Text style={styles.newsTitle}>{item.headline}</Text>
            <Text style={styles.newsDescription} numberOfLines={3}>{item.content}</Text>
            <View style={styles.newsMetaContainer}>
                <Text style={styles.newsCategory}>{item.category}</Text>
                <Text style={styles.newsDate}>{new Date(item.submitted_at).toLocaleDateString()}</Text>
            </View>
        </View>
    </View>
);

const StatusCard = ({ count, status, color }) => {
    return (
        <View style={[styles.statusCard, { backgroundColor: color }]}>
            <View style={styles.statusContent}>
                <View style={styles.statusLeftContent}>
                    <Image 
                        source={status === 'Approved' ? APPROVED : status === 'Rejected' ? REJECTED : PENDING}
                        style={styles.statusIcon}
                        resizeMode="contain"
                    />
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusCount}>{count}</Text>
                        <Text style={styles.statusText}>{status}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// Safe error logging function to prevent "Error.stack getter called with an invalid receiver"
const safeLogError = (message, err) => {
    if (err instanceof Error) {
        console.error(message, err.message);
    } else if (typeof err === 'object' && err !== null) {
        console.error(message, JSON.stringify(err));
    } else {
        console.error(message, String(err));
    }
};

const JournalistProfileScreen = ({ route }) => {
    const [journalistData, setJournalistData] = useState(null);
    const [newsData, setNewsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeStatus, setActiveStatus] = useState('approved');
    const [expandedItems, setExpandedItems] = useState({});
    const navigation = useNavigation();

    // Get id from route or from storage
    const getJournalistId = async () => {
        try {
            // Get the authentication token
            const token = await getStringByKey('loginResponse');
            
            if (!token) {
                console.log("No authentication token found");
                setError("Authentication token not found. Please login again.");
                return;
            }
            
            const url = `${BASE_URL}api/users/my-profile`;
            console.log("Fetching profile from:", url);
            
            // Use the token to make the authenticated request
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Profile fetch failed with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.success) {
                const profileData = data.data || {};
                console.log("Profile data fetched:", profileData);
                
                // Log all possible profile picture fields for debugging
                console.log("Profile picture fields:", {
                    profilePicture: profileData.profilePicture,
                    profile_picture: profileData.profile_picture,
                    avatar: profileData.avatar,
                    image: profileData.image,
                    photo: profileData.photo
                });
                
                setJournalistData({
                    username: profileData.username || profileData.name || "Journalist Name",
                    email: profileData.email || "journalist@example.com",
                    profilePicture: profileData.profilePicture || profileData.profile_picture || profileData.avatar || profileData.image || profileData.photo || null,
                    assignedState: profileData.assignedState || profileData.assigned_state || "",
                    assignedDistrict: profileData.assignedDistrict || profileData.assigned_district || "",
                    status: profileData.status || profileData.account_status || "active"
                });
                
                // Log final profile state for debugging
                console.log("Profile state set:", {
                    username: profileData.username || profileData.name || "Journalist Name",
                    profilePicture: profileData.profilePicture || profileData.profile_picture || profileData.avatar || profileData.image || profileData.photo || null,
                    status: profileData.status || profileData.account_status || "active"
                });
            } else {
                const errorMsg = data && data.message ? data.message : "Failed to fetch profile";
                safeLogError("API error:", errorMsg);
                setError(errorMsg);
            }
        } catch (err) {
            safeLogError("Error fetching profile:", err);
            setError("Network error loading profile. Please try again.");
        }
    };
    
    // Fetch news counts
    const fetchNewsCounts = async () => {
        try {
            // Get the authentication token
            const token = await getStringByKey('loginResponse');
            
            if (!token) {
                console.log("No authentication token found for news counts");
                setError("Authentication token not found. Please login again.");
                return;
            }
            
            // Create fetch headers with token
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            // Define state variables for counts
            let approvedCount = 0;
            let pendingCount = 0;
            let rejectedCount = 0;
            
            // Fetch pending count
            const pendingUrl = `${BASE_URL}api/news/my-pending-news`;
            console.log("Fetching pending news from:", pendingUrl);
            
            const pendingResponse = await fetch(pendingUrl, {
                method: 'GET',
                headers: headers
            });
            
            if (pendingResponse.ok) {
                const pendingData = await pendingResponse.json();
                if (pendingData && pendingData.success) {
                    const pendingItems = pendingData.data || [];
                    pendingCount = pendingItems.length;
                    console.log("Pending news count:", pendingCount);
                }
            }
            
            // Fetch approved count
            const approvedUrl = `${BASE_URL}api/news/my-approved-news`;
            console.log("Fetching approved news from:", approvedUrl);
            
            const approvedResponse = await fetch(approvedUrl, {
                method: 'GET',
                headers: headers
            });
            
            if (approvedResponse.ok) {
                const approvedData = await approvedResponse.json();
                if (approvedData && approvedData.success) {
                    const approvedItems = approvedData.data || [];
                    approvedCount = approvedItems.length;
                    console.log("Approved news count:", approvedCount);
                }
            }
            
            // Fetch rejected count
            const rejectedUrl = `${BASE_URL}api/news/my-rejected-news`;
            console.log("Fetching rejected news from:", rejectedUrl);
            
            const rejectedResponse = await fetch(rejectedUrl, {
                method: 'GET',
                headers: headers
            });
            
            if (rejectedResponse.ok) {
                const rejectedData = await rejectedResponse.json();
                if (rejectedData && rejectedData.success) {
                    const rejectedItems = rejectedData.data || [];
                    rejectedCount = rejectedItems.length;
                    console.log("Rejected news count:", rejectedCount);
                }
            }
            
            // Update state with counts only
            setNewsData({
                approved: approvedCount,
                pending: pendingCount,
                rejected: rejectedCount
            });
            
        } catch (err) {
            safeLogError("Error fetching news counts:", err);
            setError("Error fetching news counts. Please try again.");
        }
    };
    
    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([
                    getJournalistId(),
                    fetchNewsCounts()
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter news by status - just return the count
    const filterNewsByStatus = (status) => {
        status = status.toLowerCase();
        return newsData && newsData[status] ? newsData[status] : 0;
    };

    // Set the active status tab
    const handleStatusChange = (status) => {
        setActiveStatus(status);
        // Reset expanded items when changing tabs
        setExpandedItems({});
    };

    // Handle item expansion
    const toggleExpanded = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <>
            <MyHeader 
                showSettings={true}
                showLogo={true}
                showLocationDropdown={false}
                showBackButton={false}
                onPressSettings={() => navigation.navigate('JournalistSetting')}
            />
            <MyStatusBar backgroundColor={WHITE} />
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={BLUE} />
                    <Text style={styles.loadingText}>Loading news data...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                            setLoading(true);
                            setError(null);
                            fetchNewsCounts().catch(err => {
                                safeLogError("Error in retry:", err);
                                setError("Failed to fetch data. Please try again.");
                                setLoading(false);
                            });
                        }}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.container}>
                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileImageContainer}>
                            <Image
                                source={journalistData?.profilePicture ? 
                                    { 
                                        uri: BASE_URL.endsWith('/') && journalistData.profilePicture.startsWith('/') ?
                                            `${BASE_URL.slice(0, -1)}${journalistData.profilePicture}` :
                                            !journalistData.profilePicture.startsWith('/') ? 
                                                `${BASE_URL}/${journalistData.profilePicture}` : 
                                                `${BASE_URL}${journalistData.profilePicture}`
                                    } : 
                                    PERSON
                                }
                                style={styles.profileImage}
                                onError={(e) => {
                                    console.log("Profile image load error:", e.nativeEvent.error);
                                    console.log("Attempted image URL:", journalistData.profilePicture);
                                }}
                            />
                        </View>
                        <Text style={styles.name}>{journalistData?.username}</Text>
                        <Text style={styles.email}>{journalistData?.email}</Text>
                        
                        {/* Display assigned state and district below email */}
                        <View style={styles.profileLocationContainer}>
                            {journalistData?.assignedState && (
                                <Text style={styles.locationText}>
                                    <Text style={styles.locationLabel}>State: </Text>
                                    {journalistData.assignedState}
                                </Text>
                            )}
                            {journalistData?.assignedDistrict && (
                                <Text style={styles.locationText}>
                                    <Text style={styles.locationLabel}>District: </Text>
                                    {journalistData.assignedDistrict}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Status Section */}
                    <View style={styles.statusSection}>
                        <Text style={styles.statusTitle}>STATUS</Text>
                        
                        {/* Display journalist status (Active/Inactive) */}
                        <Text style={styles.statusActiveText}>
                            {journalistData?.status ? journalistData.status.charAt(0).toUpperCase() + journalistData.status.slice(1).toLowerCase() : 'Active'}
                        </Text>
                        
                        {/* Status Cards */}
                        <StatusCard 
                            count={filterNewsByStatus('approved')} 
                            status="Approved" 
                            color="#E8F5E9"
                        />
                        
                        <StatusCard 
                            count={filterNewsByStatus('rejected')} 
                            status="Rejected" 
                            color="#FFEBEE"
                        />
                        
                        <StatusCard 
                            count={filterNewsByStatus('pending')} 
                            status="Pending" 
                            color="#FFF3E0"
                        />
                    </View>

                    {/* Remove FlatList section */}
                </ScrollView>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: BLACK
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: WHITE,
        padding: 20
    },
    errorText: {
        fontSize: 16,
        color: RED,
        textAlign: 'center',
        marginBottom: 20
    },
    retryButton: {
        backgroundColor: BLUE,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8
    },
    retryButtonText: {
        color: WHITE,
        fontWeight: 'bold'
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#FFA500',
        overflow: 'hidden',
        marginBottom: 16,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: BLACK,
        marginBottom: 8,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 16,
    },
    statusSection: {
        padding: 16,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: BLACK,
        marginBottom: 8,
        textAlign: 'center',
    },
    statusActiveText: {
        fontSize: 16,
        color: '#2E8B57', // Green color
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 20,
        gap: 16,
    },
    dateInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
    },
    selectedDate: {
        fontSize: 14,
        color: BLACK,
        fontWeight: '500',
    },
    calendarIcon: {
        width: 20,
        height: 20,
    },
    statusCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusIcon: {
        width: 24,
        height: 24,
    },
    statusTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusCount: {
        fontSize: 16,
        fontWeight: '600',
        color: BLACK,
    },
    statusText: {
        fontSize: 14,
        color: BLACK,
    },
    arrowIcon: {
        width: 20,
        height: 20,
        transform: [{ rotate: '0deg' }],
    },
    dropdownContainer: {
        backgroundColor: WHITE,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        maxHeight: 300
    },
    newsItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    newsImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: GREY
    },
    newsContent: {
        flex: 1,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: BLACK,
        marginBottom: 8,
    },
    newsDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    newsMetaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        alignItems: 'center'
    },
    newsCategory: {
        fontSize: 12,
        color: BLUE,
        fontWeight: '500'
    },
    newsDate: {
        fontSize: 12,
        color: GREY
    },
    flatListContent: {
        paddingVertical: 8,
    },
    datePickerButton: {
        padding: 8,
    },
    emptyListContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyListText: {
        color: GREY,
        fontSize: 14
    },
    profileLocationContainer: {
        marginTop: 5,
        marginBottom: 10,
        alignItems: 'center',
    },
    locationText: {
        fontSize: 14,
        color: GREY,
        marginTop: 3,
    },
    locationLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
});

export default JournalistProfileScreen; 