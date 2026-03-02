// src/pages/hirer/Discover.js
// ═══════════════════════════════════════════════════════
//  Hirer — browse all candidates + message directly
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import ProfileCard from "../shared/ProfileCard";
import { getOrCreateConversation } from "../../services/messageService";
import { useNavigate } from "react-router-dom";
import { checkAccess } from "../../utils/access";
import { calculateMatchScore } from "../../utils/matching";
import { Lock, Bookmark, BookmarkCheck } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getAllCandidates } from "../../services/connectionService";

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
      // Pro plan check disabled temporarily per user request
      // if (!checkAccess(currentUser, 'discover_feed')) {
      //   setLoading(false);
      //   return;
      // }
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
      showToast("Search saved!");
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
        currentUser.uid  // hirer initiates
      );
      navigate("/hirer/messages");
    } catch {
      showToast("Could not open conversation.");
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

  return (
    <div style={{ padding: "32px 36px", maxWidth: 980, margin: "0 auto" }}>
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: C.ink2, border: "1px solid rgba(26,111,232,.4)",
          borderRadius: 12, padding: "14px 22px",
          color: "#fff", fontWeight: 600, fontSize: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,.4)",
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
          Discover Candidates
        </h1>
        <p style={{ color: C.silver, fontSize: 14 }}>
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} on Worqit — message anyone directly
        </p>
      </div>

      {/* Hirer privilege badge */}
      <div style={{
        background: "rgba(26,111,232,.08)",
        border: "1px solid rgba(26,111,232,.2)",
        borderRadius: 10, padding: "10px 16px",
        fontSize: 13, color: C.silver, marginBottom: 20,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: C.cyan }}>⚡</span>
        As a hirer, you can message any candidate directly — no connection needed.
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, skill, location, or headline…"
          style={{
            flex: 1, background: "rgba(255,255,255,.05)",
            border: `1px solid ${C.line}`, borderRadius: 10,
            padding: "11px 16px", color: "#fff", fontSize: 14,
            fontFamily: C.font, outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSaveSearch}
          disabled={!search.trim() || savedSearches.includes(search.trim()) || savingSearch}
          style={{
            background: savedSearches.includes(search.trim()) ? "rgba(46,204,113,.1)" : "rgba(255,255,255,.05)",
            border: `1px solid ${savedSearches.includes(search.trim()) ? "rgba(46,204,113,.3)" : C.line}`,
            color: savedSearches.includes(search.trim()) ? C.green : "#fff",
            borderRadius: 10, padding: "0 18px", display: "flex", alignItems: "center", gap: 8,
            fontWeight: 600, fontSize: 13, cursor: (!search.trim() || savedSearches.includes(search.trim())) ? "default" : "pointer",
            transition: "all .2s"
          }}
        >
          {savedSearches.includes(search.trim()) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          Save
        </button>
      </div>

      {/* Saved Search Chips */}
      {savedSearches.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.silver, fontWeight: 600, marginRight: 4, letterSpacing: 1, textTransform: "uppercase" }}>Saved:</span>
          {savedSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => setSearch(s)}
              style={{
                background: search === s ? "rgba(26,111,232,.15)" : "rgba(255,255,255,.05)",
                border: `1px solid ${search === s ? "rgba(26,111,232,.3)" : C.line}`,
                color: search === s ? C.blue : C.silver,
                borderRadius: 100, padding: "4px 12px", fontSize: 12,
                cursor: "pointer", transition: "all .2s"
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 180, background: C.ink2, borderRadius: 16, opacity: .5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.silver }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15 }}>
            {search ? "No candidates match your search." : "No candidates on the platform yet."}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {filtered.map(c => {
            // Calculate a baseline Match Score against the Hirer's general company profile
            // In a real app, this would be against a specific Job ID
            const matchScore = calculateMatchScore(c, {
              title: "", // generic
              location: currentUser?.location || "",
              skills: []
            });

            return (
              <ProfileCard
                key={c.uid}
                user={c}
                matchScore={matchScore}
                actionLabel={actionUid === c.uid ? "Opening…" : "Message"}
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
