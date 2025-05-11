import { getObjByKey, getStringByKey } from "./Storage";

export const POSTNETWORK = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    if (token) {
        // Try to get token both as object and string (for backward compatibility)
        let loginRes = await getObjByKey('loginResponse');
        let tokenValue;
        
        if (loginRes && loginRes.data) {
            // Token is stored as an object with data field
            tokenValue = loginRes.data;
        } else {
            // Try to get token stored as string
            tokenValue = await getStringByKey('loginResponse');
        }
        
        if (!tokenValue) {
            console.error('No valid login token found');
            return {
                success: false,
                message: 'Please login again to submit posts',
                statusCode: 401
            };
        }
        
        headers = { ...headers, Authorization: "Bearer " + tokenValue };
    }

    try {
        console.log('Making request to:', url);
        console.log('With payload:', payload);
        console.log('With headers:', JSON.stringify({
            ...headers,
            Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 15)}...` : undefined
        }));
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            // Clear the timeout since the request completed
            clearTimeout(timeoutId);

            // Get response data - try JSON first, fallback to text
            let responseData;
            let responseText;
            
            try {
                responseText = await response.text();
                responseData = JSON.parse(responseText);
            } catch (e) {
                // If JSON parsing fails, use text response
                responseData = { 
                    success: response.ok,
                    message: responseText || `Status: ${response.status}`
                };
            }
            
            // For 401 errors (authentication issues), provide more details
            if (response.status === 401) {
                console.error('Authentication error (401):', responseText);
                
                // Extract more detailed error information if available
                const errorDetail = responseData?.error || 
                                responseData?.detail || 
                                responseData?.message ||
                                'Authentication failed. Please login again.';
                
                return {
                    success: false,
                    message: errorDetail,
                    statusCode: 401,
                    detail: errorDetail
                };
            }
            
            if (!response.ok) {
                console.error('Server error:', response.status, responseText);
                
                // Handle specific error codes
                if (response.status === 502) {
                    return {
                        success: false,
                        message: 'Server is temporarily unavailable. Please try again later.',
                        statusCode: 502
                    };
                }
                
                return {
                    success: false,
                    message: responseData?.message || responseData?.detail || `Server error: ${response.status}`,
                    statusCode: response.status,
                    data: responseData
                };
            }

            // If we have a successful response, ensure it has the success flag
            return {
                ...responseData,
                success: responseData.success !== undefined ? responseData.success : true,
                statusCode: response.status
            };
        } catch (fetchError) {
            // Clear the timeout in case of error
            clearTimeout(timeoutId);
            
            // Check if this was an abort error (timeout)
            if (fetchError.name === 'AbortError') {
                console.error('Request timeout:', url);
                return {
                    success: false,
                    message: 'Request timed out. Please check your connection and try again.',
                    statusCode: 0,
                    error: 'Request timeout'
                };
            }
            
            // Re-throw other fetch errors
            throw fetchError;
        }
    } catch (error) {
        console.error('Network error:', error);
        return {
            success: false,
            message: 'Network error occurred. Please check your internet connection and try again.',
            statusCode: 0,
            error: error.toString()
        };
    }
}

export const POSTNETWORKFORM = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
    };
    
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
        if (!loginRes || !loginRes.data) {
            console.error('No valid login token found');
            return [{
                success: false,
                message: 'Please login again to submit posts'
            }];
        }
        headers = { ...headers, Authorization: "Bearer " + loginRes.data };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload,
            redirect: 'follow'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', response.status, errorText);
            return [{
                success: false,
                message: `Server error: ${response.status}`
            }];
        }

        const data = await response.json();
        return [data];
    } catch (error) {
        console.error('Network error:', error);
        return [{
            success: false,
            message: 'Network error occurred. Please try again.'
        }];
    }
}

export const GETNETWORK = async (url, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    if (token) {
        const loginRes = await getObjByKey('loginResponse');
        const tokenValue = loginRes?.data || await getStringByKey('loginResponse');
        
        if (!tokenValue) {
            return {
                success: false,
                message: 'Please login again',
                statusCode: 401
            };
        }
        
        headers = { ...headers, Authorization: "Bearer " + tokenValue };
    }

    try {
        console.log('Making GET request to:', url);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                signal: controller.signal
            });

            // Clear the timeout since the request completed
            clearTimeout(timeoutId);
            
            let responseData;
            let responseText;
            
            try {
                responseText = await response.text();
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = { 
                    success: response.ok,
                    message: responseText || `Status: ${response.status}`
                };
            }

            if (!response.ok) {
                console.error('Server error:', response.status, responseText);
                return {
                    success: false,
                    message: responseData?.message || responseData?.detail || `Server error: ${response.status}`,
                    statusCode: response.status,
                    data: responseData
                };
            }

            return {
                success: true,
                data: responseData,
                statusCode: response.status
            };
        } catch (fetchError) {
            // Clear the timeout in case of error
            clearTimeout(timeoutId);
            
            // Check if this was an abort error (timeout)
            if (fetchError.name === 'AbortError') {
                console.error('Request timeout:', url);
                throw new Error('Request timed out. Please check your connection and try again.');
            }
            
            // Re-throw other fetch errors
            throw fetchError;
        }
    } catch (error) {
        console.error('Network error:', error);
        return {
            success: false,
            message: 'Network error occurred. Please check your internet connection and try again.',
            statusCode: 0,
            error: error.message
        };
    }
};

export const PUTNETWORK = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    if (token) {
        // Try to get token both as object and string (for backward compatibility)
        let loginRes = await getObjByKey('loginResponse');
        let tokenValue;
        
        if (loginRes && loginRes.data) {
            // Token is stored as an object with data field
            tokenValue = loginRes.data;
        } else {
            // Try to get token stored as string
            tokenValue = await getStringByKey('loginResponse');
        }
        
        if (!tokenValue) {
            console.error('No valid login token found');
            return {
                success: false,
                message: 'Please login again to update profile',
                statusCode: 401
            };
        }
        
        headers = { ...headers, Authorization: "Bearer " + tokenValue };
    }

    try {
        console.log('Making PUT request to:', url);
        console.log('With payload:', payload);
        console.log('With headers:', JSON.stringify({
            ...headers,
            Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 15)}...` : undefined
        }));
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            // Clear the timeout since the request completed
            clearTimeout(timeoutId);

            // Get response data - try JSON first, fallback to text
            let responseData;
            let responseText;
            
            try {
                responseText = await response.text();
                responseData = JSON.parse(responseText);
            } catch (e) {
                // If JSON parsing fails, use text response
                responseData = { 
                    success: response.ok,
                    message: responseText || `Status: ${response.status}`
                };
            }
            
            // For 401 errors (authentication issues), provide more details
            if (response.status === 401) {
                console.error('Authentication error (401):', responseText);
                
                // Extract more detailed error information if available
                const errorDetail = responseData?.error || 
                                responseData?.detail || 
                                responseData?.message ||
                                'Authentication failed. Please login again.';
                
                return {
                    success: false,
                    message: errorDetail,
                    statusCode: 401,
                    detail: errorDetail
                };
            }
            
            if (!response.ok) {
                console.error('Server error:', response.status, responseText);
                
                // Handle specific error codes
                if (response.status === 502) {
                    return {
                        success: false,
                        message: 'Server is temporarily unavailable. Please try again later.',
                        statusCode: 502
                    };
                }
                
                return {
                    success: false,
                    message: responseData?.message || responseData?.detail || `Server error: ${response.status}`,
                    statusCode: response.status,
                    data: responseData
                };
            }

            // If we have a successful response, ensure it has the success flag
            return {
                ...responseData,
                success: responseData.success !== undefined ? responseData.success : true,
                statusCode: response.status
            };
        } catch (fetchError) {
            // Clear the timeout in case of error
            clearTimeout(timeoutId);
            
            // Check if this was an abort error (timeout)
            if (fetchError.name === 'AbortError') {
                console.error('Request timeout:', url);
                return {
                    success: false,
                    message: 'Request timed out. Please check your connection and try again.',
                    statusCode: 0,
                    error: 'Request timeout'
                };
            }
            
            // Re-throw other fetch errors
            throw fetchError;
        }
    } catch (error) {
        console.error('Network error:', error);
        return {
            success: false,
            message: 'Network error occurred. Please check your internet connection and try again.',
            statusCode: 0,
            error: error.toString()
        };
    }
};