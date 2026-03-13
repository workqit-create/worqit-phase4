// src/pages/hirer/Discover.js
// ═══════════════════════════════════════════════════════
//  ULTRA-PREMIUM REBUILD (STITCH REFERENCE)
//  + PURE CSS STABILITY: No more broken Tailwind dependencies
//  + Prime Selections Header
//  + Refined Search & Filter alignment
//  + Full-width grid for elite profiles
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import ProfileCard from "../shared/ProfileCard";
import { getOrCreateConversation } from "../../services/messageService";
import { useNavigate } from "react-router-dom";
import { calculateMatchScore } from "../../utils/matching";
import { Bookmark, BookmarkCheck, Download } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getAllCandidates } from "../../services/connectionService";
import { exportToCSV } from "../../utils/csvExport";

export default function HirerDiscover() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savedSearches, setSavedSearches] = useState([]);
  const [savingSearch, setSavingSearch] = useState(false);
  const [actionUid, setActionUid] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [all, savedRef] = await Promise.all([
          getAllCandidates(currentUser.uid),
          getDoc(doc(db, "savedSearches", currentUser.uid))
        ]);
        setCandidates(all);
        if (savedRef.exists()) {
          setSavedSearches(savedRef.data().searches || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [currentUser.uid]);

  const handleExport = () => {
    const dataToExport = filtered.map(c => ({
      Name: c.name || "N/A",
      Headline: c.headline || "N/A",
      Location: c.location || "N/A",
      Skills: (c.skills || []).join(", "),
      Experience: c.experience || "N/A",
      Education: c.education || "N/A",
      Email: c.email || "N/A"
    }));
    exportToCSV(dataToExport, `worqit_talent_export_${Date.now()}`);
    showToast("Talent export initiated.");
  };

  const handleSaveSearch = async () => {
    if (!search.trim() || savedSearches.includes(search.trim())) return;
    setSavingSearch(true);
    try {
      const updated = [...savedSearches, search.trim()];
      await setDoc(doc(db, "savedSearches", currentUser.uid), {
        searches: updated,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSavedSearches(updated);
      showToast("Search parameters saved.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save search.");
    }
    setSavingSearch(false);
  };

  async function handleMessage(candidate) {
    setActionUid(candidate.uid);
    try {
      await getOrCreateConversation(
        currentUser.uid,
        candidate.uid,
        "hirer-candidate",
        currentUser.uid
      );
      navigate("/hirer/messages");
    } catch {
      showToast("Strategic connection failed.");
    }
    setActionUid(null);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const filtered = candidates.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.headline?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase()) ||
    (c.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const S = {
    toast: {
      position: "fixed", bottom: "40px", right: "40px", zIndex: 1000,
      background: "#1D1D1F", color: "#fff", padding: "16px 24px", borderRadius: "16px",
      fontSize: "14px", fontWeight: 700, boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
    },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "64px" },
    badge: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
    dot: { width: "6px", height: "6px", borderRadius: "50%", background: "#0055FF", boxShadow: "0 0 15px #0055FF" },
    badgeText: { fontSize: "10px", fontWeight: 900, color: "#0055FF", textTransform: "uppercase", letterSpacing: "3px", margin: 0 },
    title: { fontSize: "40px", fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontWeight: 500, fontSize: "18px", margin: 0 },
    searchRow: { display: "flex", gap: "16px" },
    inputWrap: { position: "relative", width: "320px" },
    input: {
      width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "16px",
      padding: "14px 16px 14px 48px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "1px", color: "#1D1D1F", outline: "none", transition: "all 0.2s"
    },
    actionBtn: (dark) => ({
      padding: "0 28px", background: dark ? "#1D1D1F" : "#fff", 
      borderRadius: "16px", color: dark ? "#fff" : "#1D1D1F",
      fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px",
      border: dark ? "none" : "1px solid #E2E8F0", cursor: "pointer", 
      display: "flex", alignItems: "center", gap: "12px",
      transition: "all 0.2s", height: "48px"
    }),
    chipRow: { display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "48px", alignItems: "center" },
    chip: (active) => ({
      padding: "8px 20px", borderRadius: "100px", fontSize: "10px", fontWeight: 900,
      textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s",
      background: active ? "#0055FF" : "#fff", color: active ? "#fff" : "#94A3B8",
      border: active ? "1px solid #0055FF" : "1px solid #F1F5F9"
    }),
    grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px" }
  };

  return (
    <div style={{ width: "100%" }}>
      {toast && <div style={S.toast}>{toast}</div>}

      {/* HEADER SECTION */}
      <div style={S.header}>
        <div>
          <div style={S.badge}>
            <div style={S.dot} />
            <p style={S.badgeText}>Elite Talent Ecosystem</p>
          </div>
          <h1 style={S.title}>Prime Selections</h1>
          <p style={S.subtitle}>Strategic candidate matches for <span style={{ color: "#0055FF", fontWeight: 800 }}>Direct Organizational Deployment</span></p>
        </div>
        
        <div style={S.searchRow}>
          <div style={S.inputWrap}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "20px" }}>tune</span>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Refine talent search..."
              style={S.input}
              onFocus={e => e.target.style.borderColor = "#0055FF"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
          </div>
          <button style={S.actionBtn(false)} onClick={handleExport} title="Export current results to CSV">
            <Download size={16} /> Export
          </button>
          <button style={S.actionBtn(true)} onClick={handleSaveSearch}>
            {savedSearches.includes(search.trim()) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {savedSearches.includes(search.trim()) ? "Saved" : "Save Search"}
          </button>
        </div>
      </div>

      {/* SEARCH CHIPS */}
      {savedSearches.length > 0 && (
        <div style={S.chipRow}>
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "2.5px", marginRight: "8px" }}>Saved Strategic Searches:</span>
          {savedSearches.map((s, i) => (
            <button key={i} onClick={() => setSearch(s)} style={S.chip(search === s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* GRID SECTION */}
      {loading ? (
        <div style={S.grid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: "320px", background: "#fff", borderRadius: "40px", border: "1px solid #F1F5F9", opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "160px 0", background: "#fff", borderRadius: "40px", border: "1px dashed #E2E8F0" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "#E2E8F0", marginBottom: "24px" }}>person_search</span>
          <p style={{ color: "#94A3B8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", fontSize: "12px" }}>No matching talent profiles identified</p>
        </div>
      ) : (
        <div style={S.grid}>
          {filtered.map(c => {
            const matchScore = calculateMatchScore(c, {
              title: "",
              location: currentUser?.location || "",
              skills: []
            });

            return (
              <ProfileCard
                key={c.uid}
                user={c}
                matchScore={matchScore}
                actionLabel={actionUid === c.uid ? "Connecting..." : "Direct Message"}
                actionDisabled={actionUid === c.uid}
                onAction={() => handleMessage(c)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

