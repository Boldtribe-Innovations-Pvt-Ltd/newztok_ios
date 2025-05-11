import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Text, ActivityIndicator } from "react-native";
import { WHITE, BLUE } from "../../../constants/color";
import { APPROVEDPOST } from "../../../constants/imagePath";
import { BASE_URL } from "../../../constants/url";
import { GETNETWORK } from "../../../utils/Network";
import { getObjByKey, getStringByKey } from "../../../utils/Storage";
import { useFocusEffect } from '@react-navigation/native';
import { MyLoader } from "../../../components/commonComponents/MyLoader";
import { HEIGHT, WIDTH } from "../../../constants/config";
import { POPPINSLIGHT } from "../../../constants/fontPath";

export default ApprovedPost = () => {
    const [approvedPosts, setApprovedPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch approved posts when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchApprovedPosts();
            return () => {};
        }, [])
    );

    const fetchApprovedPosts = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Retrieve token using both methods for compatibility
            const loginResponse = await getObjByKey('loginResponse');
            let token = loginResponse?.data;
            
            // If not found as object, try string format
            if (!token) {
                token = await getStringByKey('loginResponse');
            }
            
            if (!token) {
                setError("Authentication token not found. Please login again.");
                setLoading(false);
                return;
            }
            
            // Set up the endpoint for approved news
            const url = `${BASE_URL}api/news/my-approved-news`;
            
            // Make API request using GETNETWORK
            const result = await GETNETWORK(url, true);
            
            if (result?.success) {
                // Process the received data
                const responseData = result.data || [];
                
                // Ensure we have an array to work with
                const dataArray = Array.isArray(responseData) ? responseData : 
                                responseData.news || responseData.data || [];
                
                // Set the approved posts
                setApprovedPosts(dataArray);
            } else {
                // Handle API error
                setError(result?.message || "Failed to fetch approved posts");
            }
        } catch (error) {
            console.error("Error fetching approved posts:", error);
            setError("Network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return(
        <>
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color={BLUE} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <View style={styles.contentContainer}>
                        {/* Approved Post Image */}
                        <Image 
                            source={APPROVEDPOST} 
                            style={styles.approvedImage}
                            resizeMode="contain"
                            onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
                        />
                        
                        {/* Number and Post text */}
                        <View style={styles.statsRow}>
                            <Text style={styles.numberText}>{approvedPosts.length}</Text>
                            <Text style={styles.postText}>Posts</Text>
                        </View>
                    </View>
                )}
            </View>
            <MyLoader 
            visible={loading}
            />
        </>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        padding: WIDTH * 0.04
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    approvedImage: {
        width: WIDTH * 0.5,
        height: HEIGHT * 0.25,
        marginBottom: HEIGHT * 0.05,
        alignSelf: 'center'
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: HEIGHT * 0.025
    },
    numberText: {
        fontSize: WIDTH * 0.06,
        fontWeight: 'bold',
        marginRight: WIDTH * 0.01,
        color: BLUE,
        textAlign: 'center',
        fontFamily: POPPINSLIGHT,
        includeFontPadding: false,
        textAlignVertical: 'center'
    },
    postText: {
        fontSize: WIDTH * 0.06,
        color: BLUE,
        textAlign: 'center',
        fontFamily: POPPINSLIGHT,
        includeFontPadding: false,
        textAlignVertical: 'center'
    },
    errorText: {
        color: 'red',
        fontSize: WIDTH * 0.04,
        textAlign: 'center',
        marginHorizontal: WIDTH * 0.05,
        fontFamily: POPPINSLIGHT
    }
});