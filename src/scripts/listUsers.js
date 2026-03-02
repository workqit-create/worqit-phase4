// List all Firebase Auth users and find admin candidate
const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db = admin.firestore();

async function listUsers() {
    console.log("📋 All Firebase Auth users:\n");
    const result = await auth.listUsers(100);
    result.users.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.email || "(no email)"}`);
        console.log(`     UID: ${u.uid}`);
        console.log(`     Provider: ${u.providerData.map(p => p.providerId).join(", ")}`);
        console.log("");
    });

    console.log("\n📋 All Firestore user documents:\n");
    const snap = await db.collection("users").get();
    snap.forEach(doc => {
        const d = doc.data();
        console.log(`  - ${d.email || doc.id} | userType: ${d.userType || "not set"} | name: ${d.name || "—"}`);
    });

    process.exit(0);
}

listUsers();
