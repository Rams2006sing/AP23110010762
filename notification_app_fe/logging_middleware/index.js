'use server';
import axios from 'axios';

const AUTH_URL = 'http://20.207.122.201/evaluation-service/auth';
const LOG_URL = 'http://20.207.122.201/evaluation-service/logs';

const AUTH_CREDENTIALS = {
    email: "sriramsai_muvva@srmap.edu.in",
    name: "muvva sriram sai",
    rollNo: "ap23110010762",
    accessCode: "QkbpxH",
    clientID: "00bd6e41-08f8-4742-9b70-314291d26d41",
    clientSecret: "ZcrGkrgEPXzGhPXb"
};

// In-memory token cache for logging
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);

    if (cachedToken && tokenExpiresAt > now + 60) {
        return cachedToken;
    }

    console.log('[LOG-AUTH] Fetching new access token for logging...');
    const response = await axios.post(AUTH_URL, AUTH_CREDENTIALS, {
        headers: { 'Content-Type': 'application/json' }
    });

    cachedToken = response.data.access_token;
    tokenExpiresAt = response.data.expires_in;

    return cachedToken;
}

export async function sendLogToServer(stack, level, pkg, message) {
    try {
        const token = await getAccessToken();

        const response = await axios.post(LOG_URL, {
            stack: stack.toLowerCase(),
            level: level.toLowerCase(),
            package: pkg.toLowerCase(),
            message: message,
            timestamp: new Date().toISOString()
        }, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return { success: true, logID: response.data.logID };
    } catch (error) {
        console.error("Logging failed on server:", error.message);
        return { success: false, error: error.message };
    }
}

// Alias for convenience - this is the named export that page.js imports
export const Log = sendLogToServer;