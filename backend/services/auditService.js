/**
 * auditService.js
 * 
 * Centralized logging service for the system.
 * Records significant administrative and user actions in Firestore.
 */

const admin = require("firebase-admin");

/**
 * Log a system event
 * @param {string} actorId - ID of the user/admin performing the action
 * @param {string} actionType - e.g., 'USER_SUSPENDED', 'JOB_CREATED', 'LOGIN_SUCCESS'
 * @param {string} targetId - ID of the entity affected (userId, jobId, etc.)
 * @param {Object} details - Additional contextual data
 * @param {Object} req - (Optional) Express request object to capture IP/UserAgent
 */
async function logEvent(actorId, actionType, targetId, details = {}, req = null) {
    try {
        const db = admin.firestore();
        const logEntry = {
            actorId,
            actionType,
            targetId,
            details,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ip: req ? req.ip : 'system',
            userAgent: req ? req.headers['user-agent'] : 'system'
        };

        await db.collection("auditLogs").add(logEntry);
        console.log(`[AuditLog] ${actionType} recorded for ${targetId}`);
    } catch (error) {
        console.error("Audit log failure:", error.message);
    }
}

module.exports = { logEvent };
