// src/pages/admin/AdminFounding100.js
import React, { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

export default function AdminFounding100() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "founding100"));
      setClaims(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(claim) {
    try {
      // Mark claim as approved
      await updateDoc(doc(db, "founding100", claim.id), { approved: true, approvedAt: new Date() });
      // If we have their uid, mark their user profile
      if (claim.uid) {
        await updateDoc(doc(db, "users", claim.uid), { isFounding100: true });
      }
      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, approved: true } : c));
      showToast(`${claim.companyName || claim.email} approved as Founding Partner! 🏆`);
    } catch { showToast("Approval failed."); }
  }

  async function handleReject(claim) {
    try {
      await updateDoc(doc(db, "founding100", claim.id), { approved: false, rejected: true });
      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, rejected: true } : c));
      showToast("Claim rejected.");
    } catch { showToast("Action failed."); }
  }

  function showToast(m) { setToast(m); setTimeout(() => setToast(""), 3500); }

  const approved = claims.filter(c => c.approved).length;
  const pending  = claims.filter(c => !c.approved && !c.rejected).length;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 860, margin: "0 auto" }}>
      {toast && <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: C.ink2, border: "1px solid rgba(255,170,0,.4)", borderRadius: 12, padding: "14px 22px", color: "#fff", fontWeight: 600, fontSize: 14 }}>{toast}</div>}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Founding 100 Management</h1>
        <p style={{ color: C.silver, fontSize: 14, margin: 0 }}>Review and approve company Founding Partner claims</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Claims", value: claims.length, color: C.cyan },
          { label: "Approved", value: approved, color: "#00C864" },
          { label: "Pending Review", value: pending, color: "#FFAA00" },
        ].map(s => (
          <div key={s.label} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 28, letterSpacing: -1 }}>{s.value}</div>
            <div style={{ color: C.silver, fontSize: 13, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Spot bar */}
      <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Spots Used</span>
          <span style={{ color: approved >= 80 ? "#FC8181" : C.cyan, fontWeight: 800 }}>{approved}/100</span>
        </div>
        <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 100, height: 8 }}>
          <div style={{ width: `${approved}%`, height: "100%", background: approved >= 80 ? "linear-gradient(90deg,#FFAA00,#FC8181)" : C.grad, borderRadius: 100, transition: "width .4s" }} />
        </div>
      </div>

      {loading ? <div style={{ color: C.silver, textAlign: "center", padding: 40 }}>Loading claims…</div> : claims.length === 0 ? (
        <div style={{ textAlign: "center", color: C.silver, padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <div>No Founding 100 claims yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {claims.map(c => (
            <div key={c.id} style={{ background: C.ink2, border: `1px solid ${c.approved ? "rgba(0,200,100,.3)" : c.rejected ? "rgba(220,50,50,.2)" : C.line}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{c.companyName || "Company not set"}</div>
                <div style={{ color: C.silver, fontSize: 13 }}>{c.email}</div>
                {c.timestamp?.toDate && <div style={{ color: C.silver, fontSize: 11, marginTop: 2, opacity: .6 }}>Claimed {c.timestamp.toDate().toLocaleDateString()}</div>}
              </div>
              {c.approved ? (
                <span style={{ background: "rgba(0,200,100,.1)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 8, padding: "6px 14px", color: "#00C864", fontSize: 12, fontWeight: 700 }}>✓ Approved</span>
              ) : c.rejected ? (
                <span style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 8, padding: "6px 14px", color: "#FC8181", fontSize: 12, fontWeight: 700 }}>Rejected</span>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleApprove(c)} style={{ background: "rgba(0,200,100,.1)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 8, padding: "7px 16px", color: "#00C864", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>Approve 🏆</button>
                  <button onClick={() => handleReject(c)} style={{ background: "rgba(220,50,50,.08)", border: "1px solid rgba(220,50,50,.2)", borderRadius: 8, padding: "7px 14px", color: "#FC8181", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
