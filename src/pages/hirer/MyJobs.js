// src/pages/hirer/MyJobs.js
// ═══════════════════════════════════════════════════════
//  Hirer — manage posted jobs + view applicants (Ultra-Premium White)
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C, STATUS_COLORS } from "../shared/theme";
import {
  getHirerJobs, toggleJobStatus, deleteJob,
  getJobApplicants, updateApplicationStatus
} from "../../services/jobService";
import {
  getOrCreateConversation
} from "../../services/messageService";
import { useNavigate } from "react-router-dom";
import { Download, Users, Trash2, Pause, Play, ChevronDown, ChevronUp } from "lucide-react";
import { exportToCSV } from "../../utils/csvExport";
import RequestDocumentModal from "../../components/RequestDocumentModal";

export default function HirerMyJobs() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [applicants, setApplicants] = useState({});
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [loadingApp, setLoadingApp] = useState(null);
  const [toast, setToast] = useState("");
  const [docRequestModal, setDocRequestModal] = useState({ isOpen: false, candidate: null, job: null });

  async function loadJobs() {
    setLoading(true);
    try {
      const j = await getHirerJobs(currentUser.uid);
      setJobs(j);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { loadJobs(); }, [currentUser.uid]);

  const handleExportApplicants = (jobId, jobTitle) => {
    const apps = applicants[jobId];
    if (!apps || !apps.length) {
      showToast("No applicant data to export.");
      return;
    }
    const dataToExport = apps.map(a => ({
      Candidate: a.candidate?.name || "N/A",
      Headline: a.candidate?.headline || "N/A",
      Status: a.status || "N/A",
      AppliedAt: a.appliedAt?.toDate()?.toLocaleDateString() || "N/A",
      Email: a.candidate?.email || "N/A"
    }));
    exportToCSV(dataToExport, `applicants_${jobTitle.replace(/\s+/g, '_')}_${Date.now()}`);
    showToast("Applicant export successful.");
  };

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
      showToast(newStatus === "open" ? "Listing reactivated." : "Listing paused.");
    } catch { showToast("Action failed."); }
  }

  async function handleDelete(jobId) {
    if (!window.confirm("Delete this strategic listing? This cannot be undone.")) return;
    try {
      await deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      showToast("Listing deleted.");
    } catch { showToast("Action failed."); }
  }

  async function handleStatusChange(appId, jobId, status) {
    try {
      await updateApplicationStatus(appId, status);
      setApplicants(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a => a.id === appId ? { ...a, status } : a)
      }));
      showToast(`Talent status: ${status}.`);
    } catch { showToast("Action failed."); }
  }

  async function handleBulkReject(jobId) {
    const appsToReject = selectedApplicants.filter(id => applicants[jobId]?.find(a => a.id === id));
    if (!appsToReject.length) return;
    if (!window.confirm(`Reject ${appsToReject.length} candidates?`)) return;

    try {
      await Promise.all(appsToReject.map(id => updateApplicationStatus(id, "rejected")));
      setApplicants(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a => appsToReject.includes(a.id) ? { ...a, status: "rejected" } : a)
      }));
      setSelectedApplicants(prev => prev.filter(id => !appsToReject.includes(id)));
      showToast(`Bulk rejection complete.`);
    } catch { showToast("Action failed."); }
  }

  async function handleMessageCandidate(candidate) {
    try {
      await getOrCreateConversation(
        currentUser.uid, candidate.uid,
        "hirer-candidate", currentUser.uid
      );
      navigate("/hirer/messages");
    } catch { showToast("Connection failed."); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const S = {
    container: { maxWidth: "1000px", margin: "0 auto", fontFamily: C.font },
    toast: {
      position: "fixed", bottom: "40px", right: "40px", zIndex: 1000,
      background: "#1D1D1F", color: "#fff", padding: "16px 24px", borderRadius: "16px",
      fontSize: "14px", fontWeight: 700, boxShadow: "0 24px 80px rgba(0,0,0,0.2)"
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" },
    title: { color: "#1D1D1F", fontSize: "32px", fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    newBtn: {
      background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "14px",
      padding: "14px 24px", fontWeight: 800, fontSize: "12px", cursor: "pointer",
      textTransform: "uppercase", letterSpacing: "1px", transition: "all 0.2s"
    },
    jobCard: {
      background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px",
      marginBottom: "20px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
    },
    row: { padding: "32px", display: "flex", alignItems: "center", gap: "24px" },
    statusBadge: (sc) => ({
      background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: "8px",
      padding: "4px 12px", fontSize: "10px", fontWeight: 900, color: sc.text,
      textTransform: "uppercase", letterSpacing: "1px"
    }),
    actionBtn: (active, danger) => ({
      background: active ? (danger ? "rgba(220,50,50,0.05)" : "rgba(0,85,255,0.05)") : "#fff",
      border: `1px solid ${active ? (danger ? "rgba(220,50,50,0.1)" : "rgba(0,85,255,0.1)") : "#E2E8F0"}`,
      borderRadius: "12px", padding: "10px 20px", fontSize: "11px", fontWeight: 800,
      color: danger ? "#E53E3E" : (active ? "#0055FF" : "#64748B"),
      cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px", transition: "all 0.2s",
      display: "flex", alignItems: "center", gap: "8px"
    })
  };

  return (
    <div style={S.container}>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.header}>
        <div>
          <h1 style={S.title}>Strategic Postings</h1>
          <p style={S.subtitle}>{jobs.length} active deployment{jobs.length !== 1 ? "s" : ""} in the network.</p>
        </div>
        <button onClick={() => navigate("/hirer/")} style={S.newBtn}>+ Post New Listing</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: "100px", background: "#fff", borderRadius: "32px", opacity: 0.5, border: "1px solid #E2E8F0" }} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "120px 0", background: "#fff", borderRadius: "32px", border: "1px dashed #E2E8F0" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#E2E8F0", marginBottom: "24px" }}>work</span>
          <p style={{ color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", fontSize: "12px" }}>No active postings found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {jobs.map(job => {
            const sc = STATUS_COLORS[job.status] || STATUS_COLORS.open;
            const isExpanded = expanded === job.id;
            const jobApplicants = applicants[job.id] || [];

            return (
              <div key={job.id} style={S.jobCard}>
                <div style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                      <span style={{ color: "#1D1D1F", fontWeight: 800, fontSize: "20px", letterSpacing: "-0.5px", fontFamily: "'Outfit', sans-serif" }}>{job.title}</span>
                      <span style={S.statusBadge(sc)}>{job.status}</span>
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "13px", display: "flex", gap: "20px", fontWeight: 600 }}>
                      {job.location && <span>📍 {job.location}</span>}
                      {job.salary && <span>💰 {job.salary}</span>}
                      <span>👥 {job.applicantCount || 0} applicant{(job.applicantCount || 0) !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => handleExpand(job.id)} style={S.actionBtn(isExpanded)}>
                      <Users size={14} /> {isExpanded ? "Collapse" : "Applicants"}
                    </button>
                    <button onClick={() => handleToggle(job)} style={S.actionBtn(false)}>
                      {job.status === "open" ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Reactivate</>}
                    </button>
                    <button onClick={() => handleDelete(job.id)} style={S.actionBtn(false, true)}><Trash2 size={14} /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ background: "#F8FAFC", borderTop: "1px solid #E2E8F0", padding: "40px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "2.5px" }}>Strategic Shortlist</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {selectedApplicants.some(id => jobApplicants.find(a => a.id === id)) && (
                          <button onClick={() => handleBulkReject(job.id)} style={{ ...S.actionBtn(true, true), background: "#fff" }}>
                            Reject Selected
                          </button>
                        )}
                        {jobApplicants.length > 0 && (
                          <button onClick={() => handleExportApplicants(job.id, job.title)} style={{ ...S.actionBtn(false), background: "#fff" }}>
                            <Download size={14} /> Export CSV
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {loadingApp === job.id ? (
                      <div style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600 }}>Syncing elite talent profiles...</div>
                    ) : jobApplicants.length === 0 ? (
                      <div style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600 }}>No applicants for this cycle yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {jobApplicants.map(app => {
                          const cand = app.candidate;
                          const sc2 = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                          const initial = (cand?.name || "?").charAt(0).toUpperCase();
                          return (
                            <div key={app.id} style={{ display: "flex", alignItems: "center", gap: "16px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "20px 24px" }}>
                              <input 
                                type="checkbox"
                                checked={selectedApplicants.includes(app.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedApplicants(prev => [...prev, app.id]);
                                  else setSelectedApplicants(prev => prev.filter(id => id !== app.id));
                                }}
                                style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#0055FF" }}
                              />
                              <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "linear-gradient(135deg, #0055FF, #00AAFF)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px" }}>{initial}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "#1D1D1F", fontWeight: 800, fontSize: "16px" }}>{cand?.name || "Unknown Talent"}</div>
                                <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 600 }}>{cand?.headline || "Elite Professional"}</div>
                              </div>
                              <div style={{ display: "flex", gap: "12px" }}>
                                <select value={app.status} onChange={e => handleStatusChange(app.id, job.id, e.target.value)} style={{ background: sc2.bg, border: `1px solid ${sc2.border}`, borderRadius: "100px", padding: "8px 16px", color: sc2.text, fontSize: "11px", fontWeight: 900, cursor: "pointer", outline: "none", textTransform: "uppercase" }}>
                                  {["pending", "viewed", "accepted", "rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button onClick={() => setDocRequestModal({ isOpen: true, candidate: cand, job })} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "10px 16px", fontSize: "11px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>Docs</button>
                                <button onClick={() => handleMessageCandidate(cand)} style={{ background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "11px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>Connect</button>
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

      <RequestDocumentModal 
        isOpen={docRequestModal.isOpen} 
        candidate={docRequestModal.candidate} 
        job={docRequestModal.job} 
        hrUid={currentUser.uid}
        onClose={(success) => {
          setDocRequestModal({ isOpen: false, candidate: null, job: null });
          if (success) showToast("Document Request sent successfully!");
        }} 
      />
    </div>
  );
}

