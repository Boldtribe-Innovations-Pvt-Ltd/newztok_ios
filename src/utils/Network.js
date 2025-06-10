import { getObjByKey } from "./Storage";
export const POSTNETWORK = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
        console.log(loginRes)
        headers = { ...headers, Authorization: "Bearer " + loginRes.data }
    }
    return await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    }).then((response) => response.json())
        .then((response) => {
            return response
        }).catch(error => {
            console.error('error' + error);
        });

}

export const POSTNETWORKFORM = async (url, payload, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
    };
    if (token) {
        let loginRes = await getObjByKey('loginResponse');
       
        headers = { ...headers, Authorization: "Bearer " + loginRes.data }
    }
    try {
        return Promise.all([await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload,
            redirect: 'follow'
        }).then((response) => response.json())
            .then((response) => {
                return response
            }).catch(error => {
                console.error('error' + error);
            })])
    } catch (err) {
        console.log(err);
    }

}
export const GETNETWORK = async (url, token = false) => {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    if (token) {
        
        let loginRes = await getObjByKey('loginResponse');
        headers = { ...headers, Authorization: "Bearer " + loginRes.token }
        // console.log(loginRes);
    }
    return fetch(url, {
        method: 'GET',
        headers: headers
    })
        .then((response) => response.json())
        .then(response => {
            return response
        }).catch(error => {
            console.error(error);
        });
}