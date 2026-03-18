// src/services/messageService.js
// ═══════════════════════════════════════════════════════
//  Messaging — enforces the 3-rule permission matrix:
//  1. Hirer → Candidate: Always allowed
//  2. Candidate → Hirer: Only if applied or hirer messaged first
//  3. Candidate → Candidate: Only if connected
// ═══════════════════════════════════════════════════════

import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, where, orderBy, serverTimestamp, onSnapshot,
  setDoc, arrayUnion
} from "firebase/firestore";
import { db } from "../firebase";
import { getConnectionStatus } from "./connectionService";
import { hasAppliedToHirerJob } from "./jobService";
import { createNotification } from "./notificationService";

// ── CHECK IF MESSAGE IS ALLOWED ─────────────────────────
export async function canMessage(senderId, senderType, receiverId, receiverType) {
  // Rule 1: Hirer → Candidate always allowed
  if (senderType === "hirer" && receiverType === "candidate") return true;

  // Rule 2: Candidate → Hirer: must have applied OR hirer messaged first
  if (senderType === "candidate" && receiverType === "hirer") {
    const applied = await hasAppliedToHirerJob(senderId, receiverId);
    if (applied) return true;
    // Check if hirer already messaged this candidate
    const convId = getConvId(senderId, receiverId);
    try {
      const convSnap = await getDoc(doc(db, "conversations", convId));
      if (convSnap.exists() && convSnap.data().initiatedByHirer) return true;
    } catch { }
    return false;
  }

  // Rule 3: Candidate → Candidate: must be connected
  if (senderType === "candidate" && receiverType === "candidate") {
    const conn = await getConnectionStatus(senderId, receiverId);
    return conn?.status === "accepted";
  }

  return false;
}

// ── DETERMINISTIC CONVERSATION ID ──────────────────────
export function getConvId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// ── GET OR CREATE CONVERSATION ─────────────────────────
export async function getOrCreateConversation(uid1, uid2, type, initiatedBy) {
  const convId = getConvId(uid1, uid2);
  const convRef = doc(db, "conversations", convId);
  const snap = await getDoc(convRef);

  if (!snap.exists()) {
    await setDoc(convRef, {
      participants: [uid1, uid2],
      type, // "hirer-candidate" or "candidate-candidate"
      initiatedByHirer: initiatedBy === uid1 && type === "hirer-candidate",
      lastMessage: "",
      lastAt: serverTimestamp(),
      unread: { [uid1]: 0, [uid2]: 0 },
      createdAt: serverTimestamp(),
    });
  }
  return convId;
}

// ── SEND MESSAGE ────────────────────────────────────────
export async function sendMessage(convId, senderId, text, attachment = null) {
  // Add message
  const msgObj = {
    senderId,
    text,
    createdAt: serverTimestamp(),
    read: false,
  };
  if (attachment) {
    msgObj.attachmentUrl = attachment.url;
    msgObj.attachmentName = attachment.name;
    msgObj.attachmentType = attachment.type;
  }
  await addDoc(collection(db, "conversations", convId, "messages"), msgObj);

  // Update conversation last message
  const convRef = doc(db, "conversations", convId);
  const convSnap = await getDoc(convRef);
  if (convSnap.exists()) {
    const data = convSnap.data();
    const otherUid = data.participants.find(p => p !== senderId);
    await updateDoc(convRef, {
      lastMessage: text.length > 60 ? text.slice(0, 60) + "..." : text,
      lastAt: serverTimestamp(),
      [`unread.${otherUid}`]: (data.unread?.[otherUid] || 0) + 1,
    });

    // Notify the receiver
    await createNotification(otherUid, "message", "You have a new message.", "");
  }
}

// ── LISTEN TO MESSAGES IN REAL TIME ────────────────────
export function listenToMessages(convId, callback) {
  const q = query(
    collection(db, "conversations", convId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── GET ALL CONVERSATIONS FOR USER ─────────────────────
export async function getUserConversations(uid) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid),
    orderBy("lastAt", "desc")
  );
  const snap = await getDocs(q);
  const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Enrich with other user's profile
  const enriched = await Promise.all(convs.map(async c => {
    const otherUid = c.participants.find(p => p !== uid);
    const userSnap = await getDoc(doc(db, "users", otherUid));
    return {
      ...c,
      otherUid,
      otherUser: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : null,
      myUnread: c.unread?.[uid] || 0,
    };
  }));
  return enriched;
}

// ── MARK MESSAGES AS READ ──────────────────────────────
export async function markConversationRead(convId, uid) {
  await updateDoc(doc(db, "conversations", convId), {
    [`unread.${uid}`]: 0,
  });
}

// ── GET ALL CANDIDATES (for hirer discover) ────────────
export async function getAllCandidateProfiles(excludeUid) {
  const q = query(collection(db, "users"), where("userType", "==", "candidate"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => u.uid !== excludeUid);
}
