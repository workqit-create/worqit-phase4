// src/services/jobService.js
// ═══════════════════════════════════════════════════════
//  All Firestore operations for Jobs and Applications
// ═══════════════════════════════════════════════════════

import {
  collection, doc, addDoc, updateDoc, getDocs, getDoc,
  query, where, orderBy, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationService";

// ── POST A JOB ──────────────────────────────────────────
export async function postJob(hirerId, jobData) {
  return await addDoc(collection(db, "jobs"), {
    ...jobData,
    hirerId,
    status: "open",
    applicantCount: 0,
    createdAt: serverTimestamp(),
  });
}

// ── GET ALL OPEN JOBS (candidate feed) ──────────────────
export async function getOpenJobs() {
  const q = query(
    collection(db, "jobs"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── GET HIRER'S OWN JOBS ────────────────────────────────
export async function getHirerJobs(hirerId) {
  const q = query(
    collection(db, "jobs"),
    where("hirerId", "==", hirerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── CLOSE / REOPEN A JOB ───────────────────────────────
export async function toggleJobStatus(jobId, newStatus) {
  await updateDoc(doc(db, "jobs", jobId), { status: newStatus });
}

// ── DELETE A JOB ───────────────────────────────────────
export async function deleteJob(jobId) {
  await deleteDoc(doc(db, "jobs", jobId));
}

// ── APPLY TO A JOB ─────────────────────────────────────
export async function applyToJob(jobId, hirerId, candidateId) {
  // Check not already applied
  const existing = query(
    collection(db, "applications"),
    where("jobId", "==", jobId),
    where("candidateId", "==", candidateId)
  );
  const snap = await getDocs(existing);
  if (!snap.empty) return { alreadyApplied: true };

  await addDoc(collection(db, "applications"), {
    jobId,
    hirerId,
    candidateId,
    status: "pending",
    appliedAt: serverTimestamp(),
  });

  // Increment applicant count
  const jobRef = doc(db, "jobs", jobId);
  const jobSnap = await getDoc(jobRef);
  if (jobSnap.exists()) {
    await updateDoc(jobRef, {
      applicantCount: (jobSnap.data().applicantCount || 0) + 1
    });
  }

  // Notify Hirer
  await createNotification(hirerId, "application_status", "A new candidate applied to your job!", "/hirer/jobs");

  return { alreadyApplied: false };
}

// ── GET CANDIDATE'S APPLICATIONS ───────────────────────
export async function getCandidateApplications(candidateId) {
  const q = query(
    collection(db, "applications"),
    where("candidateId", "==", candidateId),
    orderBy("appliedAt", "desc")
  );
  const snap = await getDocs(q);
  const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Enrich with job data
  const enriched = await Promise.all(apps.map(async app => {
    const jobSnap = await getDoc(doc(db, "jobs", app.jobId));
    return { ...app, job: jobSnap.exists() ? { id: jobSnap.id, ...jobSnap.data() } : null };
  }));
  return enriched;
}

// ── GET APPLICANTS FOR A JOB ───────────────────────────
export async function getJobApplicants(jobId, hirerId) {
  const q = query(
    collection(db, "applications"),
    where("jobId", "==", jobId),
    where("hirerId", "==", hirerId),
    orderBy("appliedAt", "desc")
  );
  const snap = await getDocs(q);
  const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Enrich with candidate profiles
  const enriched = await Promise.all(apps.map(async app => {
    const userSnap = await getDoc(doc(db, "users", app.candidateId));
    return { ...app, candidate: userSnap.exists() ? { uid: userSnap.id, ...userSnap.data() } : null };
  }));
  return enriched;
}

// ── UPDATE APPLICATION STATUS ──────────────────────────
export async function updateApplicationStatus(appId, status) {
  const appRef = doc(db, "applications", appId);
  const appSnap = await getDoc(appRef);

  await updateDoc(appRef, { status });

  if (appSnap.exists()) {
    const data = appSnap.data();
    await createNotification(data.candidateId, "application_status", `Your application status was updated to: ${status}.`, "/candidate/applications");
  }
}

// ── CHECK IF CANDIDATE APPLIED TO HIRER'S JOB ─────────
export async function hasAppliedToHirerJob(candidateId, hirerId) {
  const q = query(
    collection(db, "applications"),
    where("candidateId", "==", candidateId),
    where("hirerId", "==", hirerId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
