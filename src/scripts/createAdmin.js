// src/scripts/createAdmin.js
// ═══════════════════════════════════════════════════════
//  Run this ONCE to create your admin account.
//  Usage: node src/scripts/createAdmin.js
//
//  Before running:
//  1. npm install firebase-admin (in this folder)
//  2. Download your Firebase service account key from:
//     Firebase Console → Project Settings → Service Accounts
//     → Generate New Private Key → save as serviceAccountKey.json
//     in the ROOT of this project folder
//  3. Set your desired admin email + password below
// ═══════════════════════════════════════════════════════

const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db   = admin.firestore();
const auth = admin.auth();

// ── SET YOUR ADMIN CREDENTIALS HERE ─────────────────────
const ADMIN_EMAIL    = "admin@worqit.com";   // change this
const ADMIN_PASSWORD = "Worqit@Admin2026";   // change this
const ADMIN_NAME     = "Worqit Admin";
// ────────────────────────────────────────────────────────

async function createAdmin() {
  console.log("\n🔐 Worqit Admin Setup\n");

  try {
    // Create Firebase Auth user
    const user = await auth.createUser({
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
    });

    // Create Firestore user document with userType: admin
    await db.collection("users").doc(user.uid).set({
      email:           ADMIN_EMAIL,
      name:            ADMIN_NAME,
      userType:        "admin",
      platform:        "worqit",
      profileComplete: true,
      createdAt:       admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin account created successfully!\n");
    console.log("   Email:    " + ADMIN_EMAIL);
    console.log("   Password: " + ADMIN_PASSWORD);
    console.log("\n   Go to /login and sign in with these credentials.");
    console.log("   You will be routed to /admin automatically.\n");

  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      console.log("⚠️  This email already exists in Firebase Auth.");
      console.log("   If this is your admin, find their UID in Firebase Console");
      console.log("   and manually set userType: 'admin' in Firestore → users.\n");
    } else {
      console.error("❌ Error:", err.message);
    }
  }

  process.exit(0);
}

createAdmin();
