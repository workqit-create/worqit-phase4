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
  apiKey: "AIzaSyD0Y1O9Dbfl2l5s-BDdKIsenOanvoR13cs",
  authDomain: "worqit-app-1eef0.firebaseapp.com",
  projectId: "worqit-app-1eef0",
  storageBucket: "worqit-app-1eef0.firebasestorage.app",
  messagingSenderId: "458599079974",
  appId: "1:458599079974:web:09e95c13e180734f6b06e7"
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
