// src/services/notificationService.js
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";

// Notification Types:
// "message", "profile_view", "connection_request", "connection_accepted", "job_match", "application_status"

export async function createNotification(userId, type, content, link = "") {
  try {
    const notifRef = collection(db, "notifications");
    await addDoc(notifRef, {
      userId,
      type,
      content,
      link,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

// Subscribe to real-time notification updates for a user
export function subscribeToNotifications(userId, callback) {
  if (!userId) return () => {};

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(notifs);
  }, (error) => {
    console.error("Error fetching notifications:", error);
  });
}

export async function markAsRead(notificationId) {
  try {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

export async function markAllAsRead(userId) {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}
