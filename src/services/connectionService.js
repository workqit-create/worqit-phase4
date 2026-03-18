// src/services/connectionService.js
// ═══════════════════════════════════════════════════════
//  Candidate ↔ Candidate connection requests
// ═══════════════════════════════════════════════════════

import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, serverTimestamp, getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationService";

// ── SEND CONNECT REQUEST ────────────────────────────────
export async function sendConnectRequest(requesterId, receiverId) {
  // Check no existing connection
  const existing = await getConnectionStatus(requesterId, receiverId);
  if (existing) return { exists: true, status: existing.status };

  await addDoc(collection(db, "connections"), {
    requesterId,
    receiverId,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await createNotification(receiverId, "connection", "Someone sent you a new connection request.", "/candidate/network");

  return { exists: false };
}

// ── GET CONNECTION STATUS BETWEEN TWO USERS ────────────
export async function getConnectionStatus(uid1, uid2) {
  const q1 = query(
    collection(db, "connections"),
    where("requesterId", "==", uid1),
    where("receiverId", "==", uid2)
  );
  const q2 = query(
    collection(db, "connections"),
    where("requesterId", "==", uid2),
    where("receiverId", "==", uid1)
  );
  const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  if (!s1.empty) return { id: s1.docs[0].id, ...s1.docs[0].data() };
  if (!s2.empty) return { id: s2.docs[0].id, ...s2.docs[0].data() };
  return null;
}

// ── ACCEPT / DECLINE REQUEST ───────────────────────────
export async function respondToConnection(connectionId, action) {
  const connRef = doc(db, "connections", connectionId);
  const connSnap = await getDoc(connRef);

  if (action === "accepted" && connSnap.exists()) {
    const data = connSnap.data();
    await createNotification(data.requesterId, "connection", "Your connection request was accepted.", "/candidate/network");
  }

  await updateDoc(connRef, {
    status: action, // "accepted" or "declined"
    respondedAt: serverTimestamp(),
  });
}

// ── GET ALL ACCEPTED CONNECTIONS FOR A USER ────────────
export async function getConnections(uid) {
  const q1 = query(collection(db, "connections"), where("requesterId", "==", uid), where("status", "==", "accepted"));
  const q2 = query(collection(db, "connections"), where("receiverId", "==", uid), where("status", "==", "accepted"));
  const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const connections = [
    ...s1.docs.map(d => ({ id: d.id, ...d.data(), otherUid: d.data().receiverId })),
    ...s2.docs.map(d => ({ id: d.id, ...d.data(), otherUid: d.data().requesterId })),
  ];

  // Enrich with user profiles
  const enriched = await Promise.all(connections.map(async c => {
    const snap = await getDoc(doc(db, "users", c.otherUid));
    return { ...c, user: snap.exists() ? { uid: snap.id, ...snap.data() } : null };
  }));
  return enriched;
}

// ── GET PENDING REQUESTS RECEIVED BY USER ──────────────
export async function getPendingRequests(uid) {
  const q = query(
    collection(db, "connections"),
    where("receiverId", "==", uid),
    where("status", "==", "pending")
  );
  const snap = await getDocs(q);
  const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const enriched = await Promise.all(requests.map(async r => {
    const userSnap = await getDoc(doc(db, "users", r.requesterId));
    return { ...r, user: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : null };
  }));
  return enriched;
}

// ── GET ALL CANDIDATES (for discovery — exclude self) ──
// ── GET ALL CANDIDATES (for discovery — exclude self) ──
export async function getAllCandidates(excludeUid) {
  const q = query(collection(db, "users"), where("userType", "==", "candidate"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.uid !== excludeUid);
}
