// src/services/profileService.js
// ═══════════════════════════════════════════════════════
//  Profile read / write for both user types
// ═══════════════════════════════════════════════════════

import {
  doc, updateDoc, getDoc, getDocs,
  collection, query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

// ── UPDATE ANY USER'S PROFILE ───────────────────────────
export async function updateProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    profileComplete: true,
    updatedAt: serverTimestamp(),
  });
}

// ── GET A USER PROFILE BY UID ───────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) return { uid: snap.id, ...snap.data() };
  return null;
}

// ── GET ALL HIRERS ──────────────────────────────────────
export async function getAllHirers() {
  const q = query(collection(db, "users"), where("userType", "==", "hirer"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}
