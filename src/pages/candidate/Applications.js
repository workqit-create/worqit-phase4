// src/pages/candidate/Applications.js
// ═══════════════════════════════════════════════════════
//  Candidate — view all applied jobs + statuses
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C, STATUS_COLORS } from "../shared/theme";
import { getCandidateApplications } from "../../services/jobService";

export default function CandidateApplications() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const apps = await getCandidateApplications(currentUser.uid);
        setApplications(apps);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [currentUser.uid]);

  const statusLabel = {
    pending: "Under Review",
    viewed: "Viewed by Hirer",
    accepted: "Accepted 🎉",
    rejected: "Not Selected",
  };

  const S = {
    container: { maxWidth: "1000px", margin: "0 auto", fontFamily: C.font, color: "#1D1D1F" },
    header: { marginBottom: "48px" },
    title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    
    appCard: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px", padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "all 0.3s" },
    jobTitle: { fontSize: "20px", fontWeight: 800, color: "#1D1D1F", marginBottom: "4px", fontFamily: "'Outfit', sans-serif" },
    companyInfo: { fontSize: "14px", color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
    metaRow: { display: "flex", gap: "16px", flexWrap: "wrap", color: "#94A3B8", fontSize: "12px", fontWeight: 700 },
    
    statusBadge: (status) => {
      const colors = {
        pending: { bg: "rgba(0,85,255,0.06)", text: "#0055FF", border: "rgba(0,85,255,0.1)" },
        viewed: { bg: "rgba(245,158,11,0.06)", text: "#F59E0B", border: "rgba(245,158,11,0.1)" },
        accepted: { bg: "rgba(16,185,129,0.06)", text: "#10B981", border: "rgba(16,185,129,0.1)" },
        rejected: { bg: "rgba(239,68,68,0.06)", text: "#EF4444", border: "rgba(239,68,68,0.1)" }
      };
      const c = colors[status] || colors.pending;
      return { background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: "100px", padding: "8px 20px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" };
    },
    
    tag: { background: "#F1F5F9", borderRadius: "8px", padding: "4px 12px", fontSize: "11px", color: "#64748B", fontWeight: 700 },
    empty: { textAlign: "center", padding: "120px 40px", background: "#fff", borderRadius: "32px", border: "1px dashed #E2E8F0" }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>Application Studio</h1>
        <p style={S.subtitle}>Track your strategic deployments across the network.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: "140px", background: "#fff", borderRadius: "32px", border: "1px solid #E2E8F0", opacity: 0.5 }} />)}
        </div>
      ) : applications.length === 0 ? (
        <div style={S.empty}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#E2E8F0", marginBottom: "24px" }}>assignment_turned_in</span>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1D1D1F", margin: "0 0 8px" }}>No Active Missions</h3>
          <p style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 600 }}>Head to the Job Feed to initiate your first deployment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {applications.map(app => {
            const job = app.job;
            const appliedDate = app.appliedAt?.toDate?.()?.toLocaleDateString?.("en-GB", { day: "numeric", month: "short", year: "numeric" }) || "Recent Deployment";

            return (
              <div key={app.id} style={S.appCard} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                <div style={{ flex: 1 }}>
                  <h3 style={S.jobTitle}>{job?.title || "Archived Mission"}</h3>
                  <div style={S.companyInfo}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>business</span>
                    {job?.company || "Confidential Organization"}
                  </div>
                  <div style={S.metaRow}>
                    {job?.location && <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span> {job.location}</span>}
                    {job?.salary && <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0055FF" }}><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payments</span> {job.salary}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span> Applied {appliedDate}</span>
                  </div>
                  {job?.skills?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                      {job.skills.slice(0, 3).map((s, i) => <span key={i} style={S.tag}>{s}</span>)}
                    </div>
                  )}
                </div>
                <div style={S.statusBadge(app.status)}>
                  {statusLabel[app.status] || app.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function LoadingCards() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: "22px 26px", opacity: .5 }}>
          <div style={{ background: C.line, height: 16, width: "35%", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ background: C.line, height: 12, width: "20%", borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
