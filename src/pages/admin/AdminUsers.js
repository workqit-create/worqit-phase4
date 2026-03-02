// src/pages/admin/AdminUsers.js
import React, { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSuspend(uid, suspended) {
    try {
      await updateDoc(doc(db, "users", uid), { suspended: !suspended });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, suspended: !suspended } : u));
      showToast(!suspended ? "User suspended." : "User reinstated.");
    } catch { showToast("Action failed."); }
  }

  function showToast(m) { setToast(m); setTimeout(() => setToast(""), 3000); }

  const filtered = users.filter(u => {
    if (filter !== "all" && u.userType !== filter) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeColors = { candidate: { bg: "rgba(0,170,255,.1)", border: "rgba(0,170,255,.3)", text: C.cyan }, hirer: { bg: "rgba(26,111,232,.1)", border: "rgba(26,111,232,.3)", text: "#6EA8FF" }, admin: { bg: "rgba(220,50,50,.1)", border: "rgba(220,50,50,.3)", text: "#FC8181" } };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 980, margin: "0 auto" }}>
      {toast && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: C.ink2, border: "1px solid rgba(26,111,232,.4)", borderRadius: 12, padding: "14px 22px", color: "#fff", fontWeight: 600, fontSize: 14 }}>{toast}</div>}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>All Users</h1>
        <p style={{ color: C.silver, fontSize: 14, margin: 0 }}>{users.length} total registered users</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {["all","candidate","hirer","admin"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? "rgba(26,111,232,.2)" : "rgba(255,255,255,.04)", border: filter === f ? "1px solid rgba(26,111,232,.4)" : `1px solid ${C.line}`, borderRadius: 8, padding: "7px 16px", color: filter === f ? "#fff" : C.silver, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === "all" ? `(${users.length})` : `(${users.filter(u => u.userType === f).length})`}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
          style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 13, fontFamily: C.font, outline: "none" }} />
      </div>

      {loading ? <div style={{ color: C.silver, textAlign: "center", padding: 40 }}>Loading users…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(u => {
            const tc = typeColors[u.userType] || typeColors.candidate;
            return (
              <div key={u.id} style={{ background: C.ink2, border: `1px solid ${u.suspended ? "rgba(220,50,50,.3)" : C.line}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 }}>
                  {(u.name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{u.name || "No name"}</span>
                    <span style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 5, padding: "1px 8px", fontSize: 10, fontWeight: 700, color: tc.text }}>{u.userType}</span>
                    {u.suspended && <span style={{ background: "rgba(220,50,50,.15)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 5, padding: "1px 8px", fontSize: 10, fontWeight: 700, color: "#FC8181" }}>Suspended</span>}
                    {u.isFounding100 && <span style={{ background: "rgba(255,170,0,.1)", border: "1px solid rgba(255,170,0,.3)", borderRadius: 5, padding: "1px 8px", fontSize: 10, fontWeight: 700, color: "#FFAA00" }}>🏆 Founding</span>}
                  </div>
                  <div style={{ color: C.silver, fontSize: 12, marginTop: 2 }}>{u.email}</div>
                </div>
                {u.userType !== "admin" && (
                  <button onClick={() => handleSuspend(u.id, u.suspended)} style={{ background: u.suspended ? "rgba(0,200,100,.1)" : "rgba(220,50,50,.1)", border: `1px solid ${u.suspended ? "rgba(0,200,100,.3)" : "rgba(220,50,50,.3)"}`, borderRadius: 8, padding: "6px 14px", color: u.suspended ? "#00C864" : "#FC8181", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font, flexShrink: 0 }}>
                    {u.suspended ? "Reinstate" : "Suspend"}
                  </button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: "center", color: C.silver, padding: 40 }}>No users found.</div>}
        </div>
      )}
    </div>
  );
}
