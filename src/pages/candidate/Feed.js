// src/pages/candidate/Feed.js
// ═══════════════════════════════════════════════════════
//  ULTRA-PREMIUM REBUILD (STITCH REFERENCE)
//  + PURE CSS STABILITY: No more broken Tailwind dependencies
//  + Luxe Opportunity Feed Header
//  + Refined Search & Filter alignment
//  + Full-width grid for open positions
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C, STATUS_COLORS } from "../shared/theme";
import { getOpenJobs, applyToJob, getCandidateApplications } from "../../services/jobService";
import { calculateMatchScore } from "../../utils/matching";

export default function CandidateFeed() {
  const { currentUser, userProfile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("match");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [allJobs, myApps] = await Promise.all([
          getOpenJobs(),
          getCandidateApplications(currentUser.uid),
        ]);

        const jobsWithScores = allJobs.map(job => ({
          ...job,
          matchScore: calculateMatchScore(userProfile, job)
        })).sort((a, b) => b.matchScore - a.matchScore);

        setJobs(jobsWithScores);
        setAppliedJobIds(new Set(myApps.map(a => a.jobId)));
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [currentUser.uid, userProfile]);

  async function handleApply(job) {
    setApplying(job.id);
    try {
      const result = await applyToJob(job.id, job.hirerId, currentUser.uid);
      if (result.alreadyApplied) {
        showToast("Already applied.");
      } else {
        setAppliedJobIds(prev => new Set([...prev, job.id]));
        showToast("Application sent! 🎉");
      }
    } catch { showToast("Error sending application."); }
    setApplying(null);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  const filtered = jobs
    .filter(j =>
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase()) ||
      (j.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "match") return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      return 0;
    });

  const S = {
    toast: {
      position: "fixed", bottom: "40px", right: "40px", zIndex: 1000,
      background: "#fff", padding: "16px 24px", borderRadius: "16px",
      fontSize: "14px", fontWeight: 700, boxShadow: "0 24px 80px rgba(0,0,0,0.1)",
      border: "1px solid rgba(0,85,255,0.1)", color: "#0055FF"
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "64px" },
    badge: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
    dot: { width: "6px", height: "6px", borderRadius: "50%", background: "#0055FF", boxShadow: "0 0 15px rgba(0, 85, 255, 0.4)" },
    badgeText: { fontSize: "10px", fontWeight: 900, color: "#0055FF", textTransform: "uppercase", letterSpacing: "3px", margin: 0 },
    title: { fontSize: "40px", fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontWeight: 500, fontSize: "18px", margin: 0 },
    searchRow: { display: "flex", gap: "16px" },
    inputWrap: { position: "relative", width: "320px" },
    input: {
      width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "16px",
      padding: "14px 16px 14px 48px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "1px", color: "#334155", outline: "none", transition: "all 0.2s"
    },
    sortSelect: {
      padding: "0 28px", background: "#1D1D1F", borderRadius: "16px", color: "#fff",
      fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px",
      border: "none", cursor: "pointer", outline: "none", appearance: "none"
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }
  };

  return (
    <div style={{ width: "100%" }}>
      {toast && <div style={S.toast}>{toast}</div>}

      {/* HEADER SECTION */}
      <div style={S.header}>
        <div>
          <div style={S.badge}>
            <div style={S.dot} />
            <p style={S.badgeText}>Global Discovery</p>
          </div>
          <h1 style={S.title}>Luxe Opportunity Feed</h1>
          <p style={S.subtitle}>
            Curated roles for <span style={{ color: "#1D1D1F", fontWeight: 700, position: "relative" }}>Elite Professionals</span>
          </p>
        </div>
        
        <div style={S.searchRow}>
          <div style={S.inputWrap}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "20px" }}>search</span>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Refine job search..."
              style={S.input}
              onFocus={e => e.target.style.borderColor = "#0055FF"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={S.sortSelect}
          >
            <option value="match">Rank by Fit</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      </div>

      {/* GRID SECTION */}
      {loading ? (
        <div style={S.grid}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: "256px", background: "rgba(255,255,255,0.5)", borderRadius: "40px", border: "1px solid #F1F5F9" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "160px 0" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#E2E8F0", marginBottom: "24px" }}>explore</span>
          <p style={{ color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", fontSize: "12px" }}>No opportunities found</p>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              applied={appliedJobIds.has(job.id)}
              applying={applying === job.id}
              onApply={() => handleApply(job)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, applied, applying, onApply }) {
  const [hover, setHover] = useState(false);

  const cardStyle = {
    background: "#fff", borderRadius: "40px", border: "1px solid #F1F5F9",
    padding: "32px", display: "flex", flexDirection: "column",
    transition: "all 0.5s ease", position: "relative", overflow: "hidden",
    boxShadow: hover ? "0 40px 80px -20px rgba(0,0,0,0.1)" : "0 30px 60px -15px rgba(0,0,0,0.05)",
    transform: hover ? "translateY(-8px)" : "none", cursor: "default"
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div style={{ width: "56px", height: "56px", background: "#F8FAFC", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #F1F5F9" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "#1D1D1F" }}>work</span>
        </div>
        {job.matchScore && (
          <div style={{ background: "#0055FF", color: "#fff", padding: "8px 16px", borderRadius: "12px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>
            {job.matchScore}% Fit
          </div>
        )}
      </div>
      
      <h3 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 4px", color: hover ? "#0055FF" : "#1D1D1F", transition: "colors 0.3s", letterSpacing: "-0.5px" }}>
        {job.title}
      </h3>
      <p style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "32px" }}>
        {job.company} • {job.location || 'Remote'}
      </p>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "32px" }}>
        {(job.skills || []).slice(0, 3).map((s, i) => (
          <span key={i} style={{ fontSize: "9px", fontWeight: 900, background: "#F8FAFC", border: "1px solid #F1F5F9", color: "#64748B", padding: "8px 16px", borderRadius: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
            {s}
          </span>
        ))}
      </div>

      <button 
        onClick={onApply}
        disabled={applied || applying}
        style={{
          width: "100%", padding: "16px", borderRadius: "16px", fontSize: "11px", fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "2px", transition: "all 0.3s",
          background: applied ? "#F1F5F9" : "#1D1D1F",
          color: applied ? "#94A3B8" : "#fff",
          border: "none", cursor: applied ? "default" : "pointer",
          boxShadow: applied ? "none" : "0 10px 30px rgba(0,0,0,0.1)"
        }}
      >
        {applying ? 'Submitting...' : applied ? 'Application Sent' : 'Express Interest'}
      </button>
    </div>
  );
}
