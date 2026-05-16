# 🛡️ Worqit MVP: Security Lockdown & Secret Rotation Guide

Following recent platform-level security alerts, you must **immediately rotate** all credentials stored in your Vercel Environment Variables. This ensures that any compromised keys are revoked and replaced with fresh, secure ones.

---

## 🛠️ Step 1: Rotate Firebase Credentials (CRITICAL)

### 1. Revoke the Backend Service Account
1.  Go to [Firebase Console](https://console.firebase.google.com/) > **Project Settings** > **Service accounts**.
2.  Find the service account you previously generated.
3.  Click the **Manage service account permissions** link (opens Google Cloud Console).
4.  Find the key in the list, click the three dots, and select **Delete** to revoke it.
5.  Go back to Firebase Console and click **Generate new private key** to get a fresh JSON file.
6.  Update your `FIREBASE_ADMIN_SERVICE_ACCOUNT` in Vercel.

### 2. Rotate Web API Key (Frontend)
1.  In **Project Settings** > **General**, check your Web App config.
2.  If you suspect the API key itself is leaked, you can restrict it in [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
3.  Add **HTTP Referrer** restrictions so the key *only* works on your specific domains (e.g., `worqit.app`).

---

## 💳 Step 2: Rotate Stripe Keys

### 1. Secret Key
1.  Go to [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys).
2.  Click **Roll key** next to your "Secret key".
3.  Choose the "Now" or "In 24 hours" option for expiration. 
4.  Copy the new `sk_test_...` (or `sk_live_...`) and update Vercel.

### 2. Webhook Secret
1.  Go to **Developers > Webhooks**.
2.  Click on your endpoint.
3.  Find the **Signing secret** section and click **Roll secret**.
4.  Update your `STRIPE_WEBHOOK_SECRET` in Vercel.

---

## 🤖 Step 3: Rotate Groq (AI) Key

1.  Go to [Groq Console > API Keys](https://console.groq.com/keys).
2.  Click **Delete** on your current key.
3.  Click **Create API Key**.
4.  Update `GROQ_API_KEY` in Vercel.

---

## 📧 Step 4: Rotate Google OAuth Secrets

1.  Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2.  Click on your **OAuth 2.0 Client ID**.
3.  Click **Reset Secret**.
4.  Update `GOOGLE_CLIENT_SECRET` in Vercel.

---

## 🔐 Step 5: Vercel Cleanup & Lockdown

1.  **Delete Variables**: Go to your Vercel Project > **Settings** > **Environment Variables**. Delete the old ones and add the new ones.
2.  **Redeploy**: Go to the **Deployments** tab, find your latest deployment, and select **Redeploy**. Ensure you "Clear Cache" during redeploy.
3.  **IP Whitelisting**: For your Firebase Firestore/Storage, ensure you have **Security Rules** applied (see [Firestore Composite Indexes](file:///d:/worqit-phase7/worqit-phase4/docs/Firestore%20Composite%20Indexes%20for%20Worqit%20MVP.md)).

---

> [!CAUTION]
> **DO NOT** share the new keys via email, Slack, or any insecure channel. Input them directly into the Vercel dashboard.
