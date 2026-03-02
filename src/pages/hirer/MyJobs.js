// src/pages/hirer/MyJobs.js
// ═══════════════════════════════════════════════════════
//  Hirer — manage posted jobs + view applicants
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C, STATUS_COLORS } from "../shared/theme";
import {
  getHirerJobs, toggleJobStatus, deleteJob,
  getJobApplicants, updateApplicationStatus
} from "../../services/jobService";
import {
  getOrCreateConversation, sendMessage
} from "../../services/messageService";
import { useNavigate } from "react-router-dom";

export default function HirerMyJobs() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [applicants, setApplicants] = useState({});
  const [loadingApp, setLoadingApp] = useState(null);
  const [toast, setToast] = useState("");

  async function loadJobs() {
    setLoading(true);
    try {
      const j = await getHirerJobs(currentUser.uid);
      setJobs(j);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { loadJobs(); }, [currentUser.uid]);

  async function handleExpand(jobId) {
    if (expanded === jobId) { setExpanded(null); return; }
    setExpanded(jobId);
    if (!applicants[jobId]) {
      setLoadingApp(jobId);
      try {
        const apps = await getJobApplicants(jobId, currentUser.uid);
        setApplicants(prev => ({ ...prev, [jobId]: apps }));
      } catch (e) { console.error(e); }
      setLoadingApp(null);
    }
  }

  async function handleToggle(job) {
    try {
      const newStatus = job.status === "open" ? "closed" : "open";
      await toggleJobStatus(job.id, newStatus);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
      showToast(newStatus === "open" ? "Job reopened." : "Job closed.");
    } catch { showToast("Something went wrong."); }
  }

  async function handleDelete(jobId) {
    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    try {
      await deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      showToast("Job deleted.");
    } catch { showToast("Something went wrong."); }
  }

  async function handleStatusChange(appId, jobId, status) {
    try {
      await updateApplicationStatus(appId, status);
      setApplicants(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a => a.id === appId ? { ...a, status } : a)
      }));
      showToast(`Status updated to ${status}.`);
    } catch { showToast("Something went wrong."); }
  }

  async function handleMessageCandidate(candidate) {
    try {
      const convId = await getOrCreateConversation(
        currentUser.uid, candidate.uid,
        "hirer-candidate", currentUser.uid
      );
      navigate("/hirer/messages");
    } catch { showToast("Could not open conversation."); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 860, margin: "0 auto" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: C.ink2, border: "1px solid rgba(26,111,232,.4)",
          borderRadius: 12, padding: "14px 22px",
          color: "#fff", fontWeight: 600, fontSize: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>My Jobs</h1>
          <p style={{ color: C.silver, fontSize: 14 }}>{jobs.length} job{jobs.length !== 1 ? "s" : ""} posted</p>
        </div>
        <button
          onClick={() => navigate("/hirer/")}
          style={{
            background: C.grad, border: "none", borderRadius: 10,
            padding: "10px 20px", color: "#fff", fontWeight: 700,
            fontSize: 13, cursor: "pointer", fontFamily: C.font,
          }}
        >+ Post New Job</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 80, background: C.ink2, borderRadius: 14, opacity: .5 }} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.silver }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No jobs posted yet</div>
          <div style={{ fontSize: 13, opacity: .7 }}>Post your first job to start receiving applications</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map(job => {
            const sc = STATUS_COLORS[job.status];
            const isExpanded = expanded === job.id;
            const jobApplicants = applicants[job.id] || [];

            return (
              <div key={job.id} style={{
                background: C.ink2, border: `1px solid ${C.line}`,
                borderRadius: 16, overflow: "hidden",
              }}>
                {/* Job row */}
                <div style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{job.title}</span>
                        <span style={{
                          background: sc.bg, border: `1px solid ${sc.border}`,
                          borderRadius: 6, padding: "2px 8px",
                          fontSize: 11, fontWeight: 700, color: sc.text,
                        }}>{job.status}</span>
                      </div>
                      <div style={{ color: C.silver, fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {job.location && <span>📍 {job.location}</span>}
                        {job.salary && <span>💰 {job.salary}</span>}
                        {job.type && <span>⏱ {job.type}</span>}
                        <span>👥 {job.applicantCount || 0} applicant{(job.applicantCount || 0) !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleExpand(job.id)}
                        style={{
                          background: isExpanded ? "rgba(26,111,232,.2)" : "rgba(255,255,255,.05)",
                          border: isExpanded ? "1px solid rgba(26,111,232,.4)" : `1px solid ${C.line}`,
                          borderRadius: 8, padding: "7px 14px",
                          color: isExpanded ? C.cyan : C.silver,
                          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font,
                        }}
                      >
                        {isExpanded ? "Hide" : "Applicants"} {job.applicantCount > 0 ? `(${job.applicantCount})` : ""}
                      </button>
                      <button
                        onClick={() => handleToggle(job)}
                        style={{
                          background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`,
                          borderRadius: 8, padding: "7px 14px",
                          color: C.silver, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", fontFamily: C.font,
                        }}
                      >{job.status === "open" ? "Close" : "Reopen"}</button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        style={{
                          background: "rgba(220,50,50,.08)", border: "1px solid rgba(220,50,50,.2)",
                          borderRadius: 8, padding: "7px 12px",
                          color: "#FC8181", fontSize: 12, cursor: "pointer", fontFamily: C.font,
                        }}
                      >Delete</button>
                    </div>
                  </div>
                </div>

                {/* Applicants panel */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.line}`, padding: "16px 22px", background: "rgba(255,255,255,.02)" }}>
                    <div style={{ color: C.silver, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
                      Applicants
                    </div>
                    {loadingApp === job.id ? (
                      <div style={{ color: C.silver, fontSize: 13 }}>Loading applicants…</div>
                    ) : jobApplicants.length === 0 ? (
                      <div style={{ color: C.silver, fontSize: 13, opacity: .7 }}>No applicants yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {jobApplicants.map(app => {
                          const cand = app.candidate;
                          const sc2 = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                          const initial = (cand?.name || "?").charAt(0).toUpperCase();
                          return (
                            <div key={app.id} style={{
                              display: "flex", alignItems: "center", gap: 12,
                              background: C.ink2, border: `1px solid ${C.line}`,
                              borderRadius: 10, padding: "12px 16px", flexWrap: "wrap",
                            }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: C.grad, display: "flex", alignItems: "center",
                                justifyContent: "center", fontWeight: 800, fontSize: 13,
                                color: "#fff", flexShrink: 0,
                              }}>{initial}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{cand?.name || "Unknown"}</div>
                                <div style={{ color: C.silver, fontSize: 12 }}>{cand?.headline || "Candidate"}</div>
                                {cand?.skills?.length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                                    {cand.skills.slice(0, 3).map((s, i) => (
                                      <span key={i} style={{
                                        background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.2)",
                                        borderRadius: 4, padding: "1px 7px", fontSize: 10, color: C.cyan, fontWeight: 600,
                                      }}>{s}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                <select
                                  value={app.status}
                                  onChange={e => handleStatusChange(app.id, job.id, e.target.value)}
                                  style={{
                                    background: sc2.bg, border: `1px solid ${sc2.border}`,
                                    borderRadius: 6, padding: "4px 10px",
                                    color: sc2.text, fontSize: 11, fontWeight: 700,
                                    cursor: "pointer", fontFamily: C.font,
                                  }}
                                >
                                  {["pending", "viewed", "accepted", "rejected"].map(s => (
                                    <option key={s} value={s} style={{ background: C.ink2, color: "#fff" }}>
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleMessageCandidate(cand)}
                                  style={{
                                    background: C.grad, border: "none",
                                    borderRadius: 6, padding: "5px 12px",
                                    color: "#fff", fontSize: 11, fontWeight: 700,
                                    cursor: "pointer", fontFamily: C.font,
                                  }}
                                >Message</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
