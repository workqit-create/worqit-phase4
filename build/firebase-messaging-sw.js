// public/firebase-messaging-sw.js
// ═══════════════════════════════════════════════════════
//  Firebase Cloud Messaging - Background Service Worker
// ═══════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Must match the config from src/firebase.js
firebase.initializeApp({
    apiKey: "AIzaSyD0Y1O9Dbfl2l5s-BDdKIsenOanvoR13cs",
    authDomain: "worqit-app-1eef0.firebaseapp.com",
    projectId: "worqit-app-1eef0",
    storageBucket: "worqit-app-1eef0.firebasestorage.app",
    messagingSenderId: "458599079974",
    appId: "1:458599079974:web:09e95c13e180734f6b06e7"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
