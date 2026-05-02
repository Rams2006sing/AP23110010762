import axios from 'axios';

// Weightage mapping
const WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
};

export const getPriorityNotifications = async (n = 10) => {
    try {
        console.log(`[INFO] Fetching notifications for top ${n} priority`);

        // Call our own Next.js API route (avoids CORS issues)
        const response = await axios.get('/api/notifications');

        const notifications = response.data.notifications || [];

        // Sorting logic: Weight first, then Recency
        const sortedNotifications = notifications.sort((a, b) => {
            const weightA = WEIGHTS[a.Type] || 0;
            const weightB = WEIGHTS[b.Type] || 0;

            if (weightA !== weightB) {
                return weightB - weightA; // Higher weight first
            }
            // Secondary sort: Recency (Timestamp)
            return new Date(b.Timestamp) - new Date(a.Timestamp);
        });

        console.log(`[INFO] Successfully sorted ${notifications.length} notifications`);
        return sortedNotifications.slice(0, n);
    } catch (error) {
        console.error(`[ERROR] Fetch failed: ${error.message}`);
        return [];
    }
};