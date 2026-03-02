// src/pages/Login.js
// Already connected to AuthContext — no changes needed.

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LOGO_STACKED } from "../assets/logos";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { signInEmail, signInGoogle, refreshProfile, resetPassword } = useAuth();
  const navigate = useNavigate();

  function goHome(userType) {
    if (userType === "hirer") return "/hirer";
    if (userType === "admin") return "/admin";
    return "/candidate";
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setError(""); setLoading(true);
      await signInEmail(email, password);
      // Fetch the profile so we know the userType before navigating
      const profile = await refreshProfile();
      navigate(goHome(profile?.userType));
    } catch {
      setError("Incorrect email or password. Please try again.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    try {
      setError(""); setLoading(true);
      await signInGoogle();
      const profile = await refreshProfile();
      navigate(goHome(profile?.userType));
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
    setLoading(false);
  }

  async function handleReset() {
    if (!email) return setError("Enter your email address above first, then click Forgot Password.");
    try {
      await resetPassword(email);
      setResetSent(true); setError("");
    } catch {
      setError("Could not send reset email. Check your email address and try again.");
    }
  }

  return (
    <div style={S.page}>
      <div style={S.glow} />
      <div style={S.card}>

        {/* Back to Home */}
        <Link to="/" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "#7A90B8", fontSize: "13px", fontWeight: 600,
          textDecoration: "none", marginBottom: "24px",
          transition: "color .2s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#00AAFF"}
          onMouseLeave={e => e.currentTarget.style.color = "#7A90B8"}
        >← Back to Home</Link>

        {/* Real Worqit stacked logo */}
        <div style={S.logoWrap}>
          <img src={LOGO_STACKED} alt="Worqit" style={S.logo} />
        </div>

        <h1 style={S.h1}>Welcome back</h1>
        <p style={S.sub}>Sign in to your Worqit account</p>

        {error && <div style={S.error}>{error}</div>}
        {resetSent && <div style={S.success}>Reset email sent — check your inbox.</div>}

        {/* Google sign in */}
        <button style={S.googleBtn} onClick={handleGoogle} disabled={loading}>
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={S.divider}>
          <div style={S.divLine} />
          <span style={S.divText}>or sign in with email</span>
          <div style={S.divLine} />
        </div>

        <form onSubmit={handleLogin} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Email Address</label>
            <input style={S.input} type="email" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required
              onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.7)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"} />
          </div>

          <div style={S.field}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={S.label}>Password</label>
              <button type="button" onClick={handleReset} style={S.forgotBtn}>
                Forgot password?
              </button>
            </div>
            <input style={S.input} type="password" placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)} required
              onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.7)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"} />
          </div>

          <button style={S.submitBtn} type="submit" disabled={loading}
            onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {loading ? "Signing in..." : "Sign In to Worqit"}
          </button>
        </form>

        <p style={S.signupLink}>
          No account yet?{" "}
          <Link to="/signup" style={S.link}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: "#060C1A",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 24px", fontFamily: "'Plus Jakarta Sans',sans-serif",
    position: "relative", overflow: "hidden",
  },
  glow: {
    position: "absolute", top: "-200px", left: "50%", transform: "translateX(-50%)",
    width: "600px", height: "600px", borderRadius: "50%",
    background: "radial-gradient(circle,rgba(0,53,204,.35) 0%,transparent 70%)",
    filter: "blur(80px)", pointerEvents: "none",
  },
  card: {
    background: "#0A1228", border: "1px solid rgba(26,111,232,.15)",
    borderRadius: "24px", padding: "48px", width: "100%", maxWidth: "440px",
    position: "relative", zIndex: 1, boxShadow: "0 24px 80px rgba(0,53,204,.2)",
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: "32px" },
  logo: {
    height: "64px", width: "auto", objectFit: "contain",
    filter: "drop-shadow(0 4px 16px rgba(26,111,232,.3))"
  },
  h1: { fontWeight: 800, fontSize: "28px", color: "#fff", marginBottom: "8px", textAlign: "center", letterSpacing: "-1px" },
  sub: { fontSize: "14px", color: "#7A90B8", textAlign: "center", marginBottom: "32px" },
  error: {
    background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)",
    borderRadius: "10px", padding: "12px 16px", color: "#FC8181", fontSize: "13px", marginBottom: "20px",
  },
  success: {
    background: "rgba(0,170,255,.08)", border: "1px solid rgba(0,170,255,.3)",
    borderRadius: "10px", padding: "12px 16px", color: "#00AAFF", fontSize: "13px", marginBottom: "20px",
  },
  googleBtn: {
    width: "100%", background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.09)", borderRadius: "10px", padding: "13px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
    color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "20px",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  divider: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  divLine: { flex: 1, height: "1px", background: "rgba(255,255,255,.07)" },
  divText: { fontSize: "12px", color: "#4A5568", whiteSpace: "nowrap" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "11px", fontWeight: 700, color: "#7A90B8", letterSpacing: ".5px", textTransform: "uppercase" },
  input: {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px", padding: "13px 16px", fontSize: "14px", color: "#fff",
    outline: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "border-color .2s",
  },
  forgotBtn: {
    background: "none", border: "none", color: "#00AAFF", fontSize: "12px",
    cursor: "pointer", fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  submitBtn: {
    background: "linear-gradient(135deg,#00AAFF 0%,#1A6FE8 50%,#0035CC 100%)",
    color: "#fff", border: "none", borderRadius: "10px", padding: "14px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    boxShadow: "0 4px 24px rgba(26,111,232,.4)", transition: "opacity .2s",
  },
  signupLink: { textAlign: "center", fontSize: "14px", color: "#7A90B8", marginTop: "24px" },
  link: { color: "#00AAFF", textDecoration: "none", fontWeight: 600 },
};
