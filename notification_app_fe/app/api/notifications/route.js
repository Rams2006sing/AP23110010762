import axios from 'axios';

const AUTH_URL = 'http://20.207.122.201/evaluation-service/auth';
const API_URL = 'http://20.207.122.201/evaluation-service/notifications';

const AUTH_CREDENTIALS = {
    email: "sriramsai_muvva@srmap.edu.in",
    name: "muvva sriram sai",
    rollNo: "ap23110010762",
    accessCode: "QkbpxH",
    clientID: "00bd6e41-08f8-4742-9b70-314291d26d41",
    clientSecret: "ZcrGkrgEPXzGhPXb"
};

// In-memory token cache
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
    const now = Math.floor(Date.now() / 1000);

    // Refresh if token is expired or will expire within 60 seconds
    if (cachedToken && tokenExpiresAt > now + 60) {
        return cachedToken;
    }

    console.log('[AUTH] Fetching new access token...');
    const response = await axios.post(AUTH_URL, AUTH_CREDENTIALS, {
        headers: { 'Content-Type': 'application/json' }
    });

    cachedToken = response.data.access_token;
    tokenExpiresAt = response.data.expires_in;
    console.log('[AUTH] New token obtained, expires at:', new Date(tokenExpiresAt * 1000).toISOString());

    return cachedToken;
}

export async function GET() {
    try {
        const token = await getAccessToken();

        const response = await axios.get(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return Response.json(response.data);
    } catch (error) {
        console.error('Notification API error:', error.message);

        // If we get a 401, clear the cached token and retry once
        if (error.response?.status === 401 && cachedToken) {
            console.log('[AUTH] Token expired, retrying with fresh token...');
            cachedToken = null;
            tokenExpiresAt = 0;

            try {
                const token = await getAccessToken();
                const response = await axios.get(API_URL, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                return Response.json(response.data);
            } catch (retryError) {
                console.error('Retry also failed:', retryError.message);
                return Response.json(
                    { notifications: [], error: retryError.message },
                    { status: retryError.response?.status || 500 }
                );
            }
        }

        return Response.json(
            { notifications: [], error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}
