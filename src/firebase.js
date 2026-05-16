// ═══════════════════════════════════════════════════════
//  WORQIT — FIREBASE CONFIGURATION
//  ───────────────────────────────────────────────────────
//  YOUR TEAM ONLY NEEDS TO EDIT THIS ONE FILE.
//  Replace every value below with your actual Firebase
//  config keys. You saved these during the setup guide.
//
//  Where to find them:
//  Firebase Console → Your Project → ⚙️ Project Settings
//  → Scroll down → Your Apps → Web App → Config
// ═══════════════════════════════════════════════════════

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// ═══════════════════════════════════════════════════════
//  DO NOT EDIT ANYTHING BELOW THIS LINE
// ═══════════════════════════════════════════════════════

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export default app;
