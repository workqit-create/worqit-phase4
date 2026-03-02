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
    pending: "Pending Review",
    viewed: "Viewed",
    accepted: "Accepted 🎉",
    rejected: "Not Selected",
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
          My Applications
        </h1>
        <p style={{ color: C.silver, fontSize: 14 }}>
          {applications.length} application{applications.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      {loading ? (
        <LoadingCards />
      ) : applications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.silver }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No applications yet</div>
          <div style={{ fontSize: 13, opacity: .7 }}>Head to the Feed to apply to jobs</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {applications.map(app => {
            const job = app.job;
            const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
            const appliedDate = app.appliedAt?.toDate?.()?.toLocaleDateString?.() || "Recently";

            return (
              <div key={app.id} style={{
                background: C.ink2, border: `1px solid ${C.line}`,
                borderRadius: 16, padding: "22px 26px",
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: 0 }}>
                      {job?.title || "Job no longer available"}
                    </h3>
                  </div>
                  {job?.company && (
                    <div style={{ color: C.silver, fontSize: 13, marginBottom: 4 }}>🏢 {job.company}</div>
                  )}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {job?.location && <span style={{ color: C.silver, fontSize: 13 }}>📍 {job.location}</span>}
                    {job?.salary && <span style={{ color: C.cyan, fontSize: 13, fontWeight: 600 }}>💰 {job.salary}</span>}
                    <span style={{ color: C.silver, fontSize: 12, opacity: .6 }}>Applied {appliedDate}</span>
                  </div>
                  {/* Skills */}
                  {job?.skills?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {job.skills.slice(0, 4).map((s, i) => (
                        <span key={i} style={{
                          background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.25)",
                          borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: C.cyan,
                        }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  borderRadius: 8, padding: "6px 14px",
                  fontSize: 12, fontWeight: 700, color: sc.text,
                  flexShrink: 0, whiteSpace: "nowrap",
                }}>
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
