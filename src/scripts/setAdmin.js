// Quick script to set an existing user as admin
const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

const ADMIN_EMAIL = "workqit@gmail.com";

async function setAdmin() {
    try {
        // Find the user by email
        const user = await auth.getUserByEmail(ADMIN_EMAIL);
        console.log(`Found user: ${user.uid} (${user.email})`);

        // Update their Firestore document to admin
        await db.collection("users").doc(user.uid).set({
            userType: "admin",
            profileComplete: true,
        }, { merge: true });

        console.log(`\n✅ ${ADMIN_EMAIL} is now an admin!`);
        console.log("   Sign in at /login and you'll be routed to /admin.\n");
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
    process.exit(0);
}

setAdmin();
