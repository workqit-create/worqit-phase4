# 🚀 Worqit MVP: Fresh Project & Integration Setup Guide

Follow these exact steps to set up your new Firebase project, enable media uploads for free, and connect all AI/Payment integrations.

---

## 🏗️ Phase 1: New Firebase Project (Free Tier)

### 1. Create the Project
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add Project** and name it `worqit-mvp`.
3.  **Google Analytics**: You can disable this for now to keep it simple.
4.  **Plan**: Ensure you are on the **Spark (Free $0/mo)** plan.

### 2. Enable Firestore (Database)
1.  In the left sidebar, click **Build > Firestore Database**.
2.  Click **Create Database**.
3.  **Location**: Choose a region close to your users (e.g., `nam5` for US or `eur3` for Europe).
4.  **Mode**: Choose **Start in Test Mode** (this allows full access for 30 days while you build).

### 3. Enable Storage (Media & Photos) — ⚠️ CRITICAL STEP
1.  In the left sidebar, click **Build > Storage**.
2.  Click **Get Started**.
3.  **Step 1 (Security Rules)**: Choose **Start in Test Mode**.
    *   *This will set your rules to:* `allow read, write: if true;`
    *   *This ensures media uploads will NOT be denied.*
4.  **Step 2 (Location)**: Use the default (same as database).
5.  Click **Done**.

### 4. Enable Authentication
1.  Go to **Build > Authentication**.
2.  Click **Get Started**.
3.  Enable **Email/Password** and **Google** as Sign-in providers.

---

## 🔑 Phase 2: Generating Your Secrets

### 1. Firebase Web Config (For Frontend)
1.  Go to **Project Settings** (gear icon) > **General**.
2.  Scroll down to **Your apps** and click the `</>` (Web) icon.
3.  Name the app `Worqit-Web`.
4.  Copy the `firebaseConfig` object. You will paste this into `src/firebase.js`.

### 2. Firebase Admin SDK (For Backend)
1.  Go to **Project Settings** > **Service accounts**.
2.  Click **Generate new private key**.
3.  A `.json` file will download. 
    *   **Open this file and copy the entire content.**
    *   *Recommendation*: minify the JSON into a single line to use in your `.env` file as `FIREBASE_ADMIN_SERVICE_ACCOUNT`.

### 3. Google OAuth Redirect (Google Login)
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your Firebase project.
3.  Go to **APIs & Services > Credentials**.
4.  Click **Create Credentials > OAuth client ID** (Web application).
5.  **Authorized Redirect URIs**: Add `http://localhost:5000/auth/google/callback`.
6.  Copy the **Client ID** and **Client Secret**.

---

## ⚡ Phase 3: Fixing "Unable to Upload" (CORS)

Even in "Test Mode", browsers sometimes block uploads from `localhost` to Firebase Storage. 

1.  Open the [Google Cloud Shell](https://shell.cloud.google.com/).
2.  Run this command to create a config file:
    ```bash
    echo '[{"origin": ["*"], "method": ["GET", "POST", "PUT", "DELETE", "HEAD"], "responseHeader": ["Content-Type", "Authorization"], "maxAgeSeconds": 3600}]' > cors.json
    ```
3.  Run this command to apply it (Replace `YOUR_BUCKET_URL` with your bucket from Firebase, e.g., `worqit-mvp.firebasestorage.app`):
    ```bash
    gsutil cors set cors.json gs://YOUR_BUCKET_URL
    ```

---

## 📝 Phase 4: Environment Variables Template

Update your files with these new values.

### Backend `.env`
```env
# SERVER
PORT=5000
SESSION_SECRET=your_random_secret_here

# FIREBASE
FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type": "service_account", ...}'

# AI (GROQ)
GROQ_API_KEY=your_groq_key_here

# PAYMENTS (STRIPE)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000

# GOOGLE AUTH
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_here
```

### Frontend `.env.local`
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_STRIPE_PRICE_ID=price_...

# FIREBASE CONFIG (Found in Phase 2, Step 1)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

---

## ✅ Finalizing
After you get the config from Phase 2, Step 1, update the `firebaseConfig` object in `d:\worqit-phase7\worqit-phase4\src\firebase.js`.

**Now you are ready! Your media uploads will be free and permitted.**
