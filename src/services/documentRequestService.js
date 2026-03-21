// src/services/documentRequestService.js
import { collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc, serverTimestamp, orderBy, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { documentMasterData } from "../data/documentMasterData";
import { createNotification } from "./notificationService";

// Helper: Get base required docs and apply SMART LOGIC
export function generateRecommendedChecklist(jobCountryCode, candidateNationality, companyInfo) {
  let docs = documentMasterData.filter(d => d.country_code === jobCountryCode);

  // Rule 1: Citizen vs Foreign National
  const isCitizen = candidateNationality === jobCountryCode;
  docs = docs.filter(d => {
    if (d.applies_to === "citizen" && !isCitizen) return false;
    if (d.applies_to === "foreign_national" && isCitizen) return false;
    return true;
  });

  // Apply Smart Rules (Feature 4)
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const checklist = [];

  docs.forEach(doc => {
    let include = true;
    let smartNote = null;

    // Rule 2 & 3 & 4 ...
    if (doc.id === "IN_FORM16") {
      // India: mid-year joiner
      if (currentMonth === 4) include = false; // April joiners don't need Form 12B usually
    }
    if (doc.id === "IN_UAN") {
      if (companyInfo?.headcount < 20) {
        // Technically EPF is mandatory for 20+ headcount
        smartNote = "Company headcount < 20. EPF may be optional for your entity.";
      }
      smartNote = (smartNote ? smartNote + " " : "") + "CRITICAL: Ask for existing UAN. Do not create duplicates.";
    }
    if (doc.id === "PH_TIN") {
      smartNote = "Ask for existing TIN before registering a new one.";
    }
    if (doc.id === "CA_SIN" && !isCitizen) {
      smartNote = "SIN starting with 9 expires with work permit. Set expiry alert.";
    }
    if (doc.id === "AU_SUPER") {
      smartNote = "Run ATO stapled fund lookup before defaulting to company super.";
    }

    if (include) {
      checklist.push({
        documentMasterId: doc.id,
        name: doc.name,
        category: doc.category,
        mandatory: doc.mandatory,
        status: "not_started",
        smartNote: smartNote
      });
    }
  });

  // Sorting: mandatory first
  checklist.sort((a, b) => b.mandatory - a.mandatory);
  return checklist;
}

// Ensure CandidateDocument schema is populated
export async function sendDocumentRequest(jobId, candidateUid, hrUid, checklistItems, hrMessage, deadlineDays = 7) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);

  const requestBatchId = `req_${Date.now()}`; // Grouping

  const promises = checklistItems.map(item => {
    const docRef = doc(collection(db, "candidateDocuments"));
    return setDoc(docRef, {
      requestId: requestBatchId,
      candidateId: candidateUid,
      hrId: hrUid,
      jobId: jobId,
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

  // Notify Candidate
  await createNotification(candidateUid, "doc_request", "You have a new document request checklist.", `/candidate/documents`);
  
  return requestBatchId;
}

// Fetch for Candidate
export async function getCandidateDocuments(candidateUid) {
  const q = query(collection(db, "candidateDocuments"), where("candidateId", "==", candidateUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Fetch for HR Tracker
export async function getHrTrackerDocuments(hrUid) {
  const q = query(collection(db, "candidateDocuments"), where("hrId", "==", hrUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Candidate Upload Doc
export async function uploadCandidateDocument(docId, file, candidateNote = "") {
  const storageRef = ref(storage, `documents/${docId}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  const docRef = doc(db, "candidateDocuments", docId);
  await updateDoc(docRef, {
    status: "uploaded",
    uploadedFileUrl: downloadURL,
    candidateNote: candidateNote,
    updatedAt: serverTimestamp()
  });

  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    await createNotification(data.hrId, "doc_uploaded", `Candidate uploaded ${data.name}`, `/hirer/documents`);
  }
}

// HR Verify Doc
export async function verifyCandidateDocument(docId) {
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

// HR Reject Doc
export async function rejectCandidateDocument(docId, reason) {
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

// Update Status (eg setting to "in_progress")
export async function updateCandidateDocumentStatus(docId, newStatus) {
  const docRef = doc(db, "candidateDocuments", docId);
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
}
