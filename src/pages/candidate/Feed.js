// src/pages/candidate/Feed.js
// ═══════════════════════════════════════════════════════
//  Candidate feed — browse open jobs, apply
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C, STATUS_COLORS } from "../shared/theme";
import { getOpenJobs, applyToJob } from "../../services/jobService";
import { getCandidateApplications } from "../../services/jobService";
import { calculateMatchScore } from "../../utils/matching";
import { useSwipeable } from "react-swipeable";

export default function CandidateFeed() {
  const { currentUser, userProfile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("match");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [allJobs, myApps] = await Promise.all([
          getOpenJobs(),
          getCandidateApplications(currentUser.uid),
        ]);

        // Calculate match scores and sort
        const jobsWithScores = allJobs.map(job => ({
          ...job,
          matchScore: calculateMatchScore(userProfile, job)
        })).sort((a, b) => b.matchScore - a.matchScore);

        setJobs(jobsWithScores);
        setAppliedJobIds(new Set(myApps.map(a => a.jobId)));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [currentUser.uid]);

  async function handleApply(job) {
    setApplying(job.id);
    try {
      const result = await applyToJob(job.id, job.hirerId, currentUser.uid);
      if (result.alreadyApplied) {
        showToast("You already applied to this job.");
      } else {
        setAppliedJobIds(prev => new Set([...prev, job.id]));
        showToast("Application sent! 🎉");
      }
    } catch {
      showToast("Something went wrong. Please try again.");
    }
    setApplying(null);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  const filtered = jobs
    .filter(j =>
      (!search ||
        j.title?.toLowerCase().includes(search.toLowerCase()) ||
        j.company?.toLowerCase().includes(search.toLowerCase()) ||
        j.location?.toLowerCase().includes(search.toLowerCase()) ||
        (j.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase())))
      && (!filterType || j.type === filterType)
      && (!filterLocation || j.location?.toLowerCase().includes(filterLocation.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "match") return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === "newest") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === "salary") return (b.salary || "").localeCompare(a.salary || "");
      return 0;
    });

  return (
    <div style={{ padding: "32px 36px", maxWidth: 860, margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: C.ink2, border: `1px solid rgba(26,111,232,.4)`,
          borderRadius: 12, padding: "14px 22px",
          color: "#fff", fontWeight: 600, fontSize: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
          Job Feed
        </h1>
        <p style={{ color: C.silver, fontSize: 14 }}>
          {jobs.length} open positions — find your next role
        </p>
      </div>

      {/* Search + Filters */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by title, company, skill, or location…"
        style={{
          width: "100%", background: "rgba(255,255,255,.05)",
          border: `1px solid ${C.line}`, borderRadius: 10,
          padding: "12px 18px", color: "#fff", fontSize: 14,
          fontFamily: C.font, outline: "none", marginBottom: 12,
          boxSizing: "border-box",
        }}
      />
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: C.font, outline: "none", fontSize: 13, cursor: "pointer" }}
        >
          <option value="">All Types</option>
          {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map(t => (
            <option key={t} value={t} style={{ background: "#0a0f1e" }}>{t}</option>
          ))}
        </select>
        <input
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          placeholder="Filter by location…"
          style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: C.font, outline: "none", fontSize: 13, flex: 1, minWidth: 140 }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: C.font, outline: "none", fontSize: 13, cursor: "pointer" }}
        >
          <option value="match">Sort: Best Match</option>
          <option value="newest">Sort: Newest</option>
          <option value="salary">Sort: Salary</option>
        </select>
      </div>

      {/* Jobs */}
      {loading ? (
        <LoadingCards />
      ) : filtered.length === 0 ? (
        <Empty text={search ? "No jobs match your search." : "No open jobs yet — check back soon!"} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(job => {
            const applied = appliedJobIds.has(job.id);
            return (
              <JobCard
                key={job.id}
                job={job}
                matchScore={job.matchScore}
                applied={applied}
                applying={applying === job.id}
                onApply={() => handleApply(job)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, matchScore, applied, applying, onApply }) {
  const skills = job.skills || [];
  const [expanded, setExpanded] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const swipeHandlers = useSwipeable({
    onSwiping: (e) => {
      // Only allow swiping right if not applied
      if (!applied && !applying && e.dir === "Right") {
        setSwipeOffset(Math.min(e.absX, 100)); // Cap the visual visual swipe length
      }
    },
    onSwipedRight: (e) => {
      if (!applied && !applying && e.absX > 80) {
        onApply();
      }
      setSwipeOffset(0);
    },
    onSwiped: () => {
      setSwipeOffset(0);
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true
  });

  return (
    <div
      {...swipeHandlers}
      style={{
        background: C.ink2, border: `1px solid ${C.line}`,
        borderRadius: 16, padding: "24px 28px",
        transition: swipeOffset ? "none" : "all .3s ease",
        transform: `translateX(${swipeOffset}px)`,
        position: "relative",
        boxShadow: swipeOffset > 50 ? "0 8px 32px rgba(46,204,113,.2)" : "none",
        borderColor: swipeOffset > 80 ? C.green : C.line
      }}
      onMouseEnter={e => { if (!swipeOffset) { e.currentTarget.style.borderColor = "rgba(26,111,232,.4)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { if (!swipeOffset) { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = "none"; } }}
    >
      {/* Swipe Indicator Background */}
      {swipeOffset > 0 && (
        <div style={{
          position: "absolute", left: -100, top: 0, bottom: 0, width: 100,
          background: "linear-gradient(90deg, transparent, rgba(46,204,113,.2))",
          display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 20,
          color: C.green, fontWeight: 800, fontSize: 14, opacity: swipeOffset / 100,
          borderRadius: "16px 0 0 16px"
        }}>
          Apply →
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", opacity: swipeOffset > 80 ? 0.5 : 1 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 17, margin: 0 }}>{job.title}</h3>
            {matchScore && (
              <span style={{
                background: "rgba(26,111,232,.15)", border: `1px solid rgba(26,111,232,.3)`,
                borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 800, color: C.blue,
              }}>{matchScore}% Match</span>
            )}
            {job.status === "open" && (
              <span style={{
                background: STATUS_COLORS.open.bg, border: `1px solid ${STATUS_COLORS.open.border}`,
                borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: STATUS_COLORS.open.text,
              }}>Open</span>
            )}
          </div>
          {job.company && (
            <div style={{ color: C.silver, fontSize: 13, marginBottom: 4 }}>🏢 {job.company}</div>
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
            {job.location && <span style={{ color: C.silver, fontSize: 13 }}>📍 {job.location}</span>}
            {job.salary && <span style={{ color: C.cyan, fontSize: 13, fontWeight: 600 }}>💰 {job.salary}</span>}
            {job.type && <span style={{ color: C.silver, fontSize: 13 }}>⏱ {job.type}</span>}
          </div>
          {job.description && (
            <div>
              <p style={{
                color: C.silver, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px",
                whiteSpace: "pre-line",
                ...(expanded ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }),
              }}>{job.description}</p>
              {job.description.length > 120 && (
                <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} style={{
                  background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.3)",
                  color: C.cyan, fontSize: 12, cursor: "pointer", padding: "6px 14px",
                  fontWeight: 700, borderRadius: 8, transition: "all .2s", marginBottom: 6,
                  fontFamily: C.font
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(26,111,232,.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(26,111,232,.1)"}
                >
                  {expanded ? "Show less ↑" : "Read full description ↓"}
                </button>
              )}
            </div>
          )}
          {skills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.slice(0, 6).map((s, i) => (
                <span key={i} style={{
                  background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.25)",
                  borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: C.cyan,
                }}>{s}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onApply}
          disabled={applied || applying}
          style={{
            background: applied ? "rgba(0,200,100,.1)" : C.grad,
            border: applied ? "1px solid rgba(0,200,100,.3)" : "none",
            borderRadius: 10, padding: "11px 22px",
            color: applied ? "#00C864" : "#fff",
            fontWeight: 700, fontSize: 13,
            cursor: (applied || applying) ? "default" : "pointer",
            fontFamily: C.font, flexShrink: 0,
            minWidth: 120, textAlign: "center",
            transition: "all .2s",
          }}
        >
          {applying ? "Applying…" : applied ? "✓ Applied" : "Apply Now"}
        </button>
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: C.ink2, border: `1px solid ${C.line}`,
          borderRadius: 16, padding: "24px 28px", opacity: .5,
        }}>
          <div style={{ background: C.line, height: 18, width: "40%", borderRadius: 6, marginBottom: 10 }} />
          <div style={{ background: C.line, height: 13, width: "25%", borderRadius: 6, marginBottom: 8 }} />
          <div style={{ background: C.line, height: 13, width: "60%", borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: C.silver }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  );
}
