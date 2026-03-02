// Create admin account with specific credentials
const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

async function createAdmin() {
    try {
        const user = await auth.createUser({
            email: "workqit@gmail.com",
            password: "Prisham@2026",
            displayName: "Worqit Admin",
        });

        await db.collection("users").doc(user.uid).set({
            email: "workqit@gmail.com",
            name: "Worqit Admin",
            userType: "admin",
            platform: "worqit",
            profileComplete: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log("✅ Admin account created!");
        console.log("   Email:    workqit@gmail.com");
        console.log("   Password: Prisham@2026");
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
    process.exit(0);
}

createAdmin();
