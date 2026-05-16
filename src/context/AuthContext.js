// src/context/AuthContext.js
// ═══════════════════════════════════════════════════════
//  Phase 4 Update:
//  + refreshProfile() exposed so profile pages can
//    force a re-read after saving
//  + admin userType supported
// ═══════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  async function signUpEmail(email, password, userType, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", result.user.uid), {
      email, name, userType,
      platform: "worqit", profileComplete: false,
      createdAt: serverTimestamp(),
    });
    return result;
  }

  function signInEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signInGoogle(userType = "candidate") {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const snap = await getDoc(doc(db, "users", result.user.uid));
    if (!snap.exists()) {
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email, name: result.user.displayName,
        photo: result.user.photoURL, userType,
        platform: "worqit", profileComplete: false,
        createdAt: serverTimestamp(),
      });
    }
    return result;
  }

  function logout() { return signOut(auth); }
  function resetPassword(email) { return sendPasswordResetEmail(auth, email); }

  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      // Block access for suspended accounts
      if (data.suspended === true || data.status === 'suspended') {
        setIsSuspended(true);
        await signOut(auth);
        return null;
      }
      setIsSuspended(false);
      setUserProfile(data);
      return data;
    }
    return null;
  }

  // refreshProfile — call after any profile save to update UI instantly
  async function refreshProfile() {
    const user = currentUser || auth.currentUser;
    if (user) return await fetchUserProfile(user.uid);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await fetchUserProfile(user.uid);
      else setUserProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser, userProfile, isSuspended,
      signUpEmail, signInEmail, signInGoogle,
      logout, resetPassword, refreshProfile,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
