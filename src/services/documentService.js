// src/services/documentService.js
// ═══════════════════════════════════════════════════════
//  Document Hub — Phase 7
// ═══════════════════════════════════════════════════════

import {
    collection, doc, addDoc, updateDoc, getDocs, getDoc,
    query, where, orderBy, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { createNotification } from "./notificationService";

// ── UPLOAD DOCUMENT ──────────────────────────────────────
export async function uploadCandidateDocument(file, candidateId, metadata) {
    // 1. Upload file to Firebase Storage
    const storageRef = ref(storage, `documents/${candidateId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 2. Save metadata to Firestore
    const docRef = await addDoc(collection(db, "documents"), {
        candidateId,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        url: downloadURL,
        storagePath: snapshot.ref.fullPath,
        visibility: metadata.visibility || "private", // "private", "shared", "public"
        sharedWith: metadata.sharedWith || [], // array of hirerIds if "shared"
        requiresAction: metadata.requiresAction || false,
        expiryDate: metadata.expiryDate || null, // Allow setting expiry dates
        docCategory: metadata.docCategory || "Other", // "Resume", "ID", "Contract"
        createdAt: serverTimestamp(),
    });

    return { id: docRef.id, url: downloadURL };
}

// ── GET CANDIDATE DOCUMENTS (For Candidate Vault) ────────
export async function getCandidateDocuments(candidateId) {
    const q = query(
        collection(db, "documents"),
        where("candidateId", "==", candidateId),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── GET DOCUMENTS ACCESSIBLE BY HIRER ─────────────────────
// Returns public docs + docs explicitly shared with this hirer
export async function getDocumentsForHirer(candidateId, hirerId) {
    // In a real sophisticated query, we'd use an 'in' clause or multiple queries.
    // For simplicity here, we fetch candidate's docs that are public OR shared with this hirer.
    const docs = await getCandidateDocuments(candidateId);
    return docs.filter(d =>
        d.visibility === "public" ||
        (d.visibility === "shared" && d.sharedWith?.includes(hirerId))
    );
}

// ── UPDATE DOCUMENT METADATA ─────────────────────────────
export async function updateDocumentMetadata(docId, updates) {
    const docRef = doc(db, "documents", docId);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
}

// ── DELETE DOCUMENT ──────────────────────────────────────
export async function deleteCandidateDocument(docId, storagePath) {
    // 1. Delete from Storage
    const storageRef = ref(storage, storagePath);
    try {
        await deleteObject(storageRef);
    } catch (e) {
        console.warn("Storage object may already be deleted or missing:", e);
    }

    // 2. Delete from Firestore
    await deleteDoc(doc(db, "documents", docId));
}

// ── CREATE DOCUMENT REQUEST (Hirer -> Candidate) ─────────
export async function createDocumentRequest(hirerId, candidateId, jobId, documentType, notes = "") {
    const reqRef = await addDoc(collection(db, "documentRequests"), {
        hirerId,
        candidateId,
        jobId,
        documentType, // "Passport", "Resume", "Offer Letter"
        notes,
        status: "pending", // "pending", "fulfilled", "rejected"
        requestedAt: serverTimestamp(),
    });

    // Notify the candidate
    await createNotification(
        candidateId,
        "document_request",
        `A hirer requested a document: ${documentType}`,
        `/candidate/documents` // Link to their vault
    );

    return reqRef.id;
}

// ── GET REQUESTS (For Candidate or Hirer) ────────────────
export async function getDocumentRequests(userId, role) {
    const fieldToMatch = role === "hirer" ? "hirerId" : "candidateId";
    const q = query(
        collection(db, "documentRequests"),
        where(fieldToMatch, "==", userId),
        orderBy("requestedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FULFILL REQUEST ──────────────────────────────────────
export async function fulfillDocumentRequest(requestId, docId, candidateId, hirerId) {
    // 1. Mark request as fulfilled
    const reqRef = doc(db, "documentRequests", requestId);
    await updateDoc(reqRef, {
        status: "fulfilled",
        fulfilledWithDocId: docId,
        fulfilledAt: serverTimestamp(),
    });

    // 2. Ensure the document is shared with the hirer
    const docSnap = await getDoc(doc(db, "documents", docId));
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.visibility === "private" || (data.visibility === "shared" && !data.sharedWith.includes(hirerId))) {
            await updateDocumentMetadata(docId, {
                visibility: "shared",
                sharedWith: [...(data.sharedWith || []), hirerId]
            });
        }
    }

    // 3. Notify Hirer
    await createNotification(
        hirerId,
        "document_fulfilled",
        `Candidate uploaded the requested document.`,
        `/hirer/documents` // Or a specific dashboard tab for docs
    );
}
