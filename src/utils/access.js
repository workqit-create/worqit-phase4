// src/utils/access.js
// ═══════════════════════════════════════════════════════
//  Freemium Access Controls — Phase 8
// ═══════════════════════════════════════════════════════

/**
 * Checks if a user has access to a specific feature based on their subscription tier and current usage.
 * @param {Object} userProfile - The user's profile document from Firestore
 * @param {string} feature - The feature being requested (e.g., 'post_job', 'discover_feed', 'chat_message')
 * @param {Object} currentUsage - An object containing current usage stats (e.g., { activeJobs: 1, messagesSentThisMonth: 15 })
 * @returns {boolean} True if access is granted, false otherwise
 */
export const checkAccess = (userProfile, feature, currentUsage = {}) => {
    // Free accounts have basic limits
    const isFree = !userProfile?.subscriptionPlan || userProfile.subscriptionPlan === "freemium";

    if (!isFree) {
        // Pro/Premium accounts have unlimited access in this MVP
        return true;
    }

    // Freemium tier limitations
    switch (feature) {
        case 'post_job':
            // Free limit: 2 active jobs
            return (currentUsage.activeJobs || 0) < 2;

        case 'chat_message':
            // Free limit: 20 messages per month
            return (currentUsage.messagesSentThisMonth || 0) < 20;

        case 'discover_feed':
            // Free users cannot access the Discover feed
            return false;

        case 'video_interview':
            // Free users cannot initiate video calls
            return false;

        case 'request_document':
            // Free users cannot use advanced document requests
            return false;

        default:
            return true; // Unknown features default to accessible (fail-open for safety)
    }
};
