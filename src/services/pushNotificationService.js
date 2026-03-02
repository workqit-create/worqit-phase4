// src/services/pushNotificationService.js
// ═══════════════════════════════════════════════════════
//  Firebase Cloud Messaging - Push Notification Service
// ═══════════════════════════════════════════════════════

import { messaging, db } from "../firebase";
import { getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";

// You would replace this with your actual VAPID key from Firebase Project Settings -> Cloud Messaging
const VAPID_KEY = process.env.REACT_APP_VAPID_KEY || "BDEi31uK6uVlZxuj9WYWE1tC51fu32f1PHtzH6fA1TnHQoq3SZ2wl68aNBNjaNidzMIqL_9uVESzRjPePyGVyKk";

export const requestPushPermission = async (userId) => {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            // ONLY try to get token if VAPID_KEY is present and valid
            if (!VAPID_KEY || VAPID_KEY.length < 20) {
                console.warn("Push Notification skipped: No valid VAPID_KEY provided.");
                return false;
            }

            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
                await saveTokenToFirestore(userId, currentToken);
                return true;
            }
        }
        return false;
    } catch (err) {
        // CRITICAL: We catch the error but don't let it crash the app!
        console.error("Push Notification Error (Ignored to prevent crash):", err.message);
        return false;
    }
};

const saveTokenToFirestore = async (userId, token) => {
    try {
        const userRef = doc(db, "users", userId);
        // Setting merge true to only add/update the token without overwriting the user profile
        await setDoc(userRef, { fcmToken: token }, { merge: true });
        console.log("FCM Token saved successfully.");
    } catch (error) {
        console.error("Error saving FCM token: ", error);
    }
};
