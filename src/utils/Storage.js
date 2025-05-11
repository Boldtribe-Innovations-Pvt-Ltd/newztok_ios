import AsyncStorage from "@react-native-async-storage/async-storage";
import { POSTNETWORK } from './Network';
import { BASE_URL } from '../constants/url';

export const storeStringByKey = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (e) {

    }
}

export const storeObjByKey = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch (e) {

    }
}

export const getStringByKey = async (keyName) => {
    try {
        const value = await AsyncStorage.getItem(keyName)
        return value != null ? value : null;
    } catch (e) {

    }
}

export const getObjByKey = async (keyName) => {
    try {
        const jsonValue = await AsyncStorage.getItem(keyName);
        return jsonValue != null ? JSON.parse(jsonValue) : null;

    } catch (e) {

    }
}

export const deleteByKeys = async (keys) => {
    // keys must be an array
    try {
        await AsyncStorage.multiRemove(keys)
    } catch (e) {

    }
}

export const clearAll = async () => {
    try {
        await AsyncStorage.clear()
    } catch (e) {
        // clear error
    }
}

// Function to check and refresh token if needed
export const checkAndRefreshToken = async () => {
    try {
        // Try both string and object storage methods for backward compatibility
        let storedToken = await getStringByKey("loginResponse");
        let refreshTokenData = await getObjByKey("refreshToken");
        
        // If refresh token is stored as string, try getting it directly
        if (!refreshTokenData) {
            refreshTokenData = await getStringByKey("refreshToken");
        }
        
        // No token found
        if (!storedToken) {
            console.log("No access token found, user needs to login");
            return false;
        }
        
        // Parse the token to check expiration
        const tokenParts = storedToken.split('.');
        if (tokenParts.length !== 3) {
            console.log("Invalid token format");
            return false;
        }
        
        try {
            // Decode the payload
            const payload = JSON.parse(atob(tokenParts[1]));
            
            // Check if token is expired or about to expire (within 10 minutes)
            const currentTime = Math.floor(Date.now() / 1000);
            const tokenExpiry = payload.exp;
            
            console.log("Token expiry time:", new Date(tokenExpiry * 1000).toLocaleString());
            console.log("Current time:", new Date(currentTime * 1000).toLocaleString());
            console.log("Time until expiry:", (tokenExpiry - currentTime) / 60, "minutes");
            
            // If token is valid for more than 10 minutes, return true
            if (tokenExpiry - currentTime > 600) {
                console.log("Token is still valid, no refresh needed");
                return true;
            }
            
            console.log("Token expires soon or is expired, attempting refresh...");
        } catch (error) {
            console.error("Error parsing token payload:", error);
            return false;
        }
        
        // If we don't have a refresh token, we can't refresh
        if (!refreshTokenData) {
            console.log("No refresh token available, user needs to login again");
            return false;
        }
        
        // Call refresh token endpoint
        const url = `${BASE_URL}token/refresh/`;
        const data = {
            refresh: refreshTokenData
        };
        
        console.log("Calling refresh token endpoint:", url);
        console.log("With refresh token:", typeof refreshTokenData === 'string' ? 
            `${refreshTokenData.substring(0, 15)}...` : 
            "Object (not string)");
        
        const result = await POSTNETWORK(url, data);
        
        console.log("Refresh token response:", JSON.stringify(result));
        
        // Check various possible success responses from different API implementations
        if (
            (result?.success && result?.data?.access) || 
            (result?.access) || 
            (result?.token) || 
            (result?.data?.token)
        ) {
            // Store the new access token based on where it's found in the response
            const newAccessToken = 
                result?.data?.access || 
                result?.access || 
                result?.token || 
                result?.data?.token;
            
            if (!newAccessToken) {
                console.log("No access token found in refresh response");
                return false;
            }
            
            console.log("Storing new access token");
            
            // Store the token consistently as a string
            await storeStringByKey("loginResponse", newAccessToken);
            
            // If we get a new refresh token too, store it
            const newRefreshToken = 
                result?.data?.refresh || 
                result?.refresh || 
                result?.refreshToken || 
                result?.data?.refreshToken || 
                result?.refresh_token || 
                result?.data?.refresh_token;
                
            if (newRefreshToken) {
                console.log("Also storing new refresh token");
                await storeStringByKey("refreshToken", newRefreshToken);
            }
            
            console.log("Token refreshed successfully");
            return true;
        } else {
            console.log("Failed to refresh token:", result?.message || "Unknown error");
            return false;
        }
    } catch (error) {
        console.error("Error in token refresh:", error);
        return false;
    }
};

// Helper function for base64 decoding (for JWT parsing)
const atob = (base64) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = '';
    let i = 0;
    
    base64 = base64.replace(/=+$/, '');
    
    while (i < base64.length) {
        const enc1 = chars.indexOf(base64.charAt(i++));
        const enc2 = chars.indexOf(base64.charAt(i++));
        const enc3 = chars.indexOf(base64.charAt(i++));
        const enc4 = chars.indexOf(base64.charAt(i++));
        
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        
        str += String.fromCharCode(chr1);
        
        if (enc3 !== 64) {
            str += String.fromCharCode(chr2);
        }
        if (enc4 !== 64) {
            str += String.fromCharCode(chr3);
        }
    }
    
    return str;
};