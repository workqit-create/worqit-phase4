/**
 * adminService.js
 * 
 * Provides administrative operations for the Worqit platform.
 */

const admin = require("firebase-admin");
const { logEvent } = require("./auditService");

/**
 * Suspend or Unsuspend a user account
 */
async function setUserStatus(uid, adminUid, status, reason, req) {
    try {
        const db = admin.firestore();
        
        // 1. Update Firestore Profile
        await db.collection("users").doc(uid).update({
            status: status, // 'active' or 'suspended'
            suspendedReason: status === 'suspended' ? reason : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Perform Firebase Auth action (optional but recommended for hard lock)
        // If suspended, we could potentially revoke tokens, but Firestore-based checks
        // in AuthContext/Middleware are usually more reactive.
        
        // 3. Log Event
        await logEvent(adminUid, status === 'suspended' ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED', uid, { reason }, req);
        
        return { success: true };
    } catch (error) {
        console.error("SetUserStatus error:", error.message);
        throw error;
    }
}

/**
 * Delete a user and associated data (Strict)
 */
async function deleteUser(uid, adminUid, req) {
    try {
        const db = admin.firestore();
        
        // In a real MVP, we'd delete sub-collections too.
        await db.collection("users").doc(uid).delete();
        await admin.auth().deleteUser(uid);
        
        await logEvent(adminUid, 'USER_DELETED', uid, {}, req);
        return { success: true };
    } catch (error) {
        console.error("DeleteUser error:", error.message);
        throw error;
    }
}

/**
 * Moderate a Job Posting
 */
async function moderateJob(jobId, adminUid, action, reason, req) {
    try {
        const db = admin.firestore();
        const status = action === 'approve' ? 'open' : 'flagged';
        
        await db.collection("jobs").doc(jobId).update({
            status,
            moderationNote: reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await logEvent(adminUid, action === 'approve' ? 'JOB_APPROVED' : 'JOB_FLAGGED', jobId, { reason }, req);
        return { success: true };
    } catch (error) {
        console.error("ModerateJob error:", error.message);
        throw error;
    }
}

module.exports = {
    setUserStatus,
    deleteUser,
    moderateJob
};
