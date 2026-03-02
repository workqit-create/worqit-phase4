// src/pages/admin/AdminJobs.js
import React, { useState, useEffect } from "react";
import { C, STATUS_COLORS } from "../shared/theme";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "jobs"));
      const j = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      j.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setJobs(j);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!window.confirm("Delete this job? Cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "jobs", id));
      setJobs(prev => prev.filter(j => j.id !== id));
      showToast("Job deleted.");
    } catch { showToast("Delete failed."); }
  }

  function showToast(m) { setToast(m); setTimeout(() => setToast(""), 3000); }

  const filtered = jobs.filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.company?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      {toast && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: C.ink2, border: "1px solid rgba(26,111,232,.4)", borderRadius: 12, padding: "14px 22px", color: "#fff", fontWeight: 600, fontSize: 14 }}>{toast}</div>}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>All Jobs</h1>
        <p style={{ color: C.silver, fontSize: 14, margin: 0 }}>{jobs.length} total jobs posted on the platform</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or company…"
        style={{ width: "100%", background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 16px", color: "#fff", fontSize: 14, fontFamily: C.font, outline: "none", marginBottom: 18, boxSizing: "border-box" }} />

      {loading ? <div style={{ color: C.silver, textAlign: "center", padding: 40 }}>Loading jobs…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(j => {
            const sc = STATUS_COLORS[j.status] || STATUS_COLORS.open;
            return (
              <div key={j.id} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{j.title}</span>
                    <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 5, padding: "1px 8px", fontSize: 10, fontWeight: 700, color: sc.text }}>{j.status}</span>
                  </div>
                  <div style={{ color: C.silver, fontSize: 12, display: "flex", gap: 14 }}>
                    {j.company && <span>🏢 {j.company}</span>}
                    {j.location && <span>📍 {j.location}</span>}
                    <span>👥 {j.applicantCount || 0} applicants</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(j.id)} style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 8, padding: "6px 14px", color: "#FC8181", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font, flexShrink: 0 }}>Delete</button>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: "center", color: C.silver, padding: 40 }}>No jobs found.</div>}
        </div>
      )}
    </div>
  );
}
