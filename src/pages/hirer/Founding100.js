// src/pages/hirer/Founding100.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

export default function Founding100() {
  const { userProfile, currentUser } = useAuth();
  const isFounder = userProfile?.isFounding100;
  const [email, setEmail] = useState(userProfile?.email || "");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleClaim(e) {
    e.preventDefault();
    if (!email.includes("@")) { setErr("Enter a valid email."); return; }
    setLoading(true); setErr("");
    try {
      await addDoc(collection(db, "founding100"), {
        email, companyName: userProfile?.companyName || "",
        uid: currentUser.uid, timestamp: serverTimestamp(),
      });
      setSubmitted(true);
    } catch { setErr("Something went wrong. Please try again."); }
    setLoading(false);
  }

  const perks = [
    { n: "6", label: "Months Free", desc: "Full platform access — unlimited jobs, messaging, and all features." },
    { n: "50%", label: "Lifetime Discount", desc: "Half the standard rate permanently, regardless of future pricing." },
    { n: "100", label: "Companies Max", desc: "Once all 100 spots are filled, this offer closes permanently." },
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Founding Partner Programme</h1>
        <p style={{ color: C.silver, fontSize: 14, margin: 0 }}>Exclusive access for the first 100 companies on Worqit</p>
      </div>

      {/* Status badge if already a founder */}
      {isFounder && (
        <div style={{ background: "rgba(255,170,0,.1)", border: "1px solid rgba(255,170,0,.3)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 36 }}>🏆</div>
          <div>
            <div style={{ color: "#FFAA00", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>You are a Founding Partner</div>
            <div style={{ color: C.silver, fontSize: 14 }}>Your company has been confirmed as one of the Founding 100. All perks are active on your account.</div>
          </div>
        </div>
      )}

      {/* Perks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {perks.map(p => (
          <div key={p.n} style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px 20px" }}>
            <div style={{ fontSize: 36, fontWeight: 800, background: C.gtext, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>{p.n}</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{p.label}</div>
            <div style={{ color: C.silver, fontSize: 13, lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Spot tracker */}
      <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ color: "#fff", fontWeight: 700 }}>Spots Claimed</span>
          <span style={{ color: C.cyan, fontWeight: 800 }}>23 of 100</span>
        </div>
        <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 100, height: 8, overflow: "hidden" }}>
          <div style={{ width: "23%", height: "100%", background: C.grad, borderRadius: 100 }} />
        </div>
        <div style={{ color: C.silver, fontSize: 12, marginTop: 8 }}>77 spots remaining — closes permanently when full</div>
      </div>

      {/* Claim form */}
      {!isFounder && !submitted && (
        <div style={{ background: "linear-gradient(135deg,rgba(0,53,204,.15),rgba(0,170,255,.05))", border: "1px solid rgba(26,111,232,.25)", borderRadius: 18, padding: "28px 28px" }}>
          <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: "0 0 8px" }}>Claim Your Founding Spot</h2>
          <p style={{ color: C.silver, fontSize: 14, margin: "0 0 20px", lineHeight: 1.6 }}>Submit your company email and our team will confirm your Founding Partner status within 24 hours.</p>
          {err && <div style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 8, padding: "10px 14px", color: "#FC8181", fontSize: 13, marginBottom: 14 }}>{err}</div>}
          <form onSubmit={handleClaim} style={{ display: "flex", gap: 10 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your company email" required
              style={{ flex: 1, background: "rgba(255,255,255,.06)", border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, fontFamily: C.font, outline: "none" }} />
            <button type="submit" disabled={loading} style={{ background: C.grad, border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer", fontFamily: C.font, whiteSpace: "nowrap" }}>
              {loading ? "Submitting…" : "Claim Spot"}
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <div style={{ background: "rgba(0,200,100,.08)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 14, padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
          <div style={{ color: "#00C864", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Spot Claimed!</div>
          <div style={{ color: C.silver, fontSize: 14 }}>Our team will confirm your Founding Partner status within 24 hours.</div>
        </div>
      )}
    </div>
  );
}
