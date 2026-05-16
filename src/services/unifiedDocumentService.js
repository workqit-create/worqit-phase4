// src/services/unifiedDocumentService.js
// ═══════════════════════════════════════════════════════
//  Unified Document Service (P2 Improvement)
//  Consolidates personal document management and HR document requests.
// ═══════════════════════════════════════════════════════

import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, where, orderBy, serverTimestamp, deleteDoc, setDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { createNotification } from "./notificationService";
import { documentMasterData } from "../data/documentMasterData";

// ── HELPER: GENERATE RECOMMENDED CHECKLIST (from documentMasterData) ──
export function generateRecommendedChecklist(jobCountryCode, candidateNationality, companyInfo) {
  let docs = documentMasterData.filter(d => d.country_code === jobCountryCode);

  const isCitizen = candidateNationality === jobCountryCode;
  docs = docs.filter(d => {
    if (d.applies_to === "citizen" && !isCitizen) return false;
    if (d.applies_to === "foreign_national" && isCitizen) return false;
    return true;
  });

  const currentMonth = new Date().getMonth() + 1;
  const checklist = [];

  docs.forEach(docItem => {
    let include = true;
    let smartNote = null;

    if (docItem.id === "IN_FORM16") {
      if (currentMonth === 4) include = false;
    }
    if (docItem.id === "IN_UAN") {
      if (companyInfo?.headcount < 20) {
        smartNote = "Company headcount < 20. EPF may be optional for your entity.";
      }
      smartNote = (smartNote ? smartNote + " " : "") + "CRITICAL: Ask for existing UAN. Do not create duplicates.";
    }
    if (docItem.id === "PH_TIN") {
      smartNote = "Ask for existing TIN before registering a new one.";
    }
    if (docItem.id === "CA_SIN" && !isCitizen) {
      smartNote = "SIN starting with 9 expires with work permit. Set expiry alert.";
    }
    if (docItem.id === "AU_SUPER") {
      smartNote = "Run ATO stapled fund lookup before defaulting to company super.";
    }

    if (include) {
      checklist.push({
        documentMasterId: docItem.id,
        name: docItem.name,
        category: docItem.category,
        mandatory: docItem.mandatory,
        status: "not_started",
        smartNote: smartNote
      });
    }
  });

  checklist.sort((a, b) => b.mandatory - a.mandatory);
  return checklist;
}

// ── UPLOAD PERSONAL DOCUMENT ──────────────────────────────────────
export async function uploadPersonalDocument(file, candidateId, metadata) {
  const storageRef = ref(storage, `documents/${candidateId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  const docRef = await addDoc(collection(db, "candidateDocuments"), {
    candidateId,
    type: "personal", // New field to distinguish personal vs. requested
    fileName: file.name,
    fileType: file.type,
    size: file.size,
    url: downloadURL,
    storagePath: snapshot.ref.fullPath,
    visibility: metadata.visibility || "private",
    sharedWith: metadata.sharedWith || [],
    expiryDate: metadata.expiryDate || null,
    docCategory: metadata.docCategory || "Other",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: docRef.id, url: downloadURL };
}

// ── SEND DOCUMENT REQUEST (HR -> Candidate) ─────────────────────────
export async function sendDocumentRequest(jobId, candidateUid, hrUid, checklistItems, hrMessage, deadlineDays = 7) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);

  const requestBatchId = `req_${Date.now()}`; // Grouping

  const promises = checklistItems.map(item => {
    const docRef = doc(collection(db, "candidateDocuments")); // Use same collection
    return setDoc(docRef, {
      requestId: requestBatchId,
      candidateId: candidateUid,
      hrId: hrUid,
      jobId: jobId,
      type: "requested", // New field to distinguish personal vs. requested
      documentMasterId: item.documentMasterId,
      name: item.name,
      category: item.category,
      mandatory: item.mandatory,
      status: "not_started", // not_started, in_progress, uploaded, verified, rejected
      hrNote: hrMessage || "",
      candidateNote: "",
      smartNote: item.smartNote || null,
      deadline: deadline,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await Promise.all(promises);

  await createNotification(candidateUid, "doc_request", "You have a new document request checklist.", `/candidate/documents`);
  
  return requestBatchId;
}

// ── GET CANDIDATE DOCUMENTS (Unified Fetch) ────────────────
export async function getCandidateUnifiedDocuments(candidateId) {
  const q = query(
    collection(db, "candidateDocuments"),
    where("candidateId", "==", candidateId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── GET HR TRACKER DOCUMENTS (Unified Fetch) ────────────────
export async function getHrTrackerUnifiedDocuments(hrUid) {
  const q = query(
    collection(db, "candidateDocuments"),
    where("hrId", "==", hrUid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── FULFILL REQUEST (Candidate uploads for a request) ──────────────────────
export async function fulfillDocumentRequest(docId, file, candidateNote = "") {
  const docRef = doc(db, "candidateDocuments", docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error("Document request not found.");

  const data = docSnap.data();
  const storageRef = ref(storage, `documents/${data.candidateId}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  await updateDoc(docRef, {
    status: "uploaded",
    uploadedFileUrl: downloadURL,
    storagePath: snapshot.ref.fullPath, // Store storage path for deletion
    candidateNote: candidateNote,
    updatedAt: serverTimestamp()
  });

  await createNotification(data.hrId, "doc_uploaded", `Candidate uploaded ${data.name} for a request.`, `/hirer/documents`);
}

// ── UPDATE DOCUMENT METADATA (for personal docs) ─────────────────────────────
export async function updateDocumentMetadata(docId, updates) {
  const docRef = doc(db, "candidateDocuments", docId);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
}

// ── DELETE DOCUMENT (Personal or Requested) ──────────────────────────────────────
export async function deleteUnifiedDocument(docId, storagePath) {
  if (storagePath) {
    const storageRef = ref(storage, storagePath);
    try {
      await deleteObject(storageRef);
    } catch (e) {
      console.warn("Storage object may already be deleted or missing:", e);
    }
  }
  await deleteDoc(doc(db, "candidateDocuments", docId));
}

// ── HR VERIFY DOC ──────────────────────────────────────
export async function verifyUnifiedDocument(docId) {
  const docRef = doc(db, "candidateDocuments", docId);
  await updateDoc(docRef, {
    status: "verified",
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    await createNotification(data.candidateId, "doc_verified", `Your ${data.name} was verified!`, `/candidate/documents`);
  }
}

// ── HR REJECT DOC ──────────────────────────────────────
export async function rejectUnifiedDocument(docId, reason) {
  const docRef = doc(db, "candidateDocuments", docId);
  await updateDoc(docRef, {
    status: "rejected",
    hrRejectionReason: reason,
    updatedAt: serverTimestamp()
  });

  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    await createNotification(data.candidateId, "doc_rejected", `Your ${data.name} was rejected. Reason: ${reason}`, `/candidate/documents`);
  }
}

// ── UPDATE STATUS (eg setting to "in_progress") ──────────────────────────────
export async function updateUnifiedDocumentStatus(docId, newStatus) {
  const docRef = doc(db, "candidateDocuments", docId);
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
}

// ── GET DOCUMENTS ACCESSIBLE BY HIRER ─────────────────────
// Returns public docs + docs explicitly shared with this hirer
export async function getDocumentsForHirer(candidateId, hirerId) {
  const q = query(
    collection(db, "candidateDocuments"),
    where("candidateId", "==", candidateId),
    where("type", "==", "personal"), // Only personal docs can be public/shared
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const personalDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  return personalDocs.filter(d =>
    d.visibility === "public" ||
    (d.visibility === "shared" && d.sharedWith?.includes(hirerId))
  );
}
