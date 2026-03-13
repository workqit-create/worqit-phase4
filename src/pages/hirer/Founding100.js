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

  const S = {
    container: { maxWidth: "1000px", margin: "0 auto", fontFamily: C.font, color: "#1D1D1F" },
    header: { marginBottom: "48px" },
    title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    
    perkGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "48px" },
    perkCard: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px", padding: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "all 0.3s" },
    perkValue: { fontSize: "48px", fontWeight: 900, color: "#0055FF", fontFamily: "'Outfit', sans-serif", letterSpacing: "-2px", marginBottom: "12px", display: "block" },
    perkLabel: { fontSize: "16px", fontWeight: 800, color: "#1D1D1F", marginBottom: "8px", display: "block" },
    perkDesc: { fontSize: "13px", color: "#64748B", lineHeight: 1.6, fontWeight: 500 },
    
    trackerCard: { background: "#1D1D1F", borderRadius: "32px", padding: "40px", color: "#fff", marginBottom: "48px", position: "relative", overflow: "hidden" },
    trackerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    trackerTitle: { fontSize: "18px", fontWeight: 800, letterSpacing: "-0.5px" },
    trackerStats: { fontSize: "18px", fontWeight: 900, color: "#F5A623" },
    progressBar: { height: "12px", background: "rgba(255,255,255,0.1)", borderRadius: "100px", overflow: "hidden" },
    progressFill: { height: "100%", background: "linear-gradient(90deg, #0055FF, #00AAFF)", borderRadius: "100px", boxShadow: "0 0 20px rgba(0, 85, 255, 0.5)" },
    
    claimCard: { background: "#fff", border: "1px solid #0055FF", borderRadius: "32px", padding: "48px", boxShadow: "0 24px 48px -12px rgba(0,85,255,0.1)", textAlign: "center" },
    claimTitle: { fontSize: "24px", fontWeight: 900, color: "#1D1D1F", marginBottom: "12px", fontFamily: "'Outfit', sans-serif" },
    claimDesc: { fontSize: "15px", color: "#64748B", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px", lineHeight: 1.6 },
    
    form: { display: "flex", gap: "12px", maxWidth: "500px", margin: "0 auto" },
    input: { flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "16px 20px", fontSize: "14px", fontWeight: 600, outline: "none", transition: "all 0.2s" },
    btn: { background: "#0055FF", color: "#fff", border: "none", borderRadius: "16px", padding: "16px 32px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "1px", fontSize: "12px" },
    
    successCard: { textAlign: "center", padding: "48px", background: "rgba(16,185,129,0.05)", borderRadius: "32px", border: "1px solid rgba(16,185,129,0.1)" }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>Founding Partner Programme</h1>
        <p style={S.subtitle}>Exclusive strategic incentives for the first 100 visionary organizations.</p>
      </div>

      {isFounder && (
        <div style={{ ...S.trackerCard, background: "linear-gradient(135deg, #F5A623, #D97706)", marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span style={{ fontSize: "48px" }}>🏆</span>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#fff", margin: 0 }}>Confirmed Founding Partner</h2>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: 600, marginTop: "4px" }}>Your company has secured elite status. All perks are permanently active.</p>
            </div>
          </div>
        </div>
      )}

      <div style={S.perkGrid}>
        {perks.map(p => (
          <div key={p.n} style={S.perkCard} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <span style={S.perkValue}>{p.n}</span>
            <span style={S.perkLabel}>{p.label}</span>
            <p style={S.perkDesc}>{p.desc}</p>
          </div>
        ))}
      </div>

      <div style={S.trackerCard}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: "rgba(0,85,255,0.1)", borderRadius: "50%", marginRight: "-100px", marginTop: "-100px" }} />
        <div style={S.trackerHeader}>
          <span style={S.trackerTitle}>Programme Maturity</span>
          <span style={S.trackerStats}>23 / 100 Spots Claimed</span>
        </div>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: "23%" }} />
        </div>
        <p style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700, marginTop: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>77 Strategic Openings Remaining</p>
      </div>

      {!isFounder && !submitted && (
        <div style={S.claimCard}>
          <h2 style={S.claimTitle}>Claim Your Founding Spot</h2>
          <p style={S.claimDesc}>Submit your organization's interest to lock in lifetime benefits and strategic priority access.</p>
          
          {err && <div style={{ color: "#EF4444", fontSize: "13px", fontWeight: 700, marginBottom: "16px" }}>{err}</div>}
          
          <form onSubmit={handleClaim} style={S.form}>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Corporate Email Address" 
              required 
              style={S.input}
              onFocus={e => e.target.style.borderColor = "#0055FF"}
              onBlur={e => e.target.style.borderColor = "#E2E8F0"}
            />
            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? "Processing..." : "Secure Spot"}
            </button>
          </form>
        </div>
      )}

      {submitted && (
        <div style={S.successCard}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🎉</span>
          <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#10B981", marginBottom: "8px" }}>Interest Registered</h2>
          <p style={{ color: "#64748B", fontWeight: 600 }}>Our strategic team will verify your organization within 24 hours.</p>
        </div>
      )}
    </div>
  );
}

