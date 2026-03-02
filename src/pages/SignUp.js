// src/pages/SignUp.js
// Already connected to AuthContext — no changes needed.

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LOGO_STACKED } from "../assets/logos";

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUpEmail, signInGoogle } = useAuth();
  const navigate = useNavigate();

  function goHome(type) {
    if (type === "hirer") return "/hirer";
    if (type === "admin") return "/admin";
    return "/candidate";
  }

  function chooseType(type) {
    setUserType(type);
    setStep(2);
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    try {
      setError(""); setLoading(true);
      await signUpEmail(email, password, userType, name);
      navigate(goHome(userType));
    } catch (err) {
      setError(err.code === "auth/email-already-in-use"
        ? "An account with this email already exists. Sign in instead."
        : "Failed to create account. Please try again.");
    }
    setLoading(false);
  }

  async function handleGoogle() {
    try {
      setError(""); setLoading(true);
      await signInGoogle(userType);
      navigate(goHome(userType));
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={S.page}>
      <div style={S.glow} />
      <div style={S.card}>

        {/* Real Worqit stacked logo */}
        <div style={S.logoWrap}>
          <img src={LOGO_STACKED} alt="Worqit" style={S.logo} />
        </div>

        {/* ── STEP 1 — Choose account type ── */}
        {step === 1 && (
          <>
            <h1 style={S.h1}>Join Worqit</h1>
            <p style={S.sub}>First, tell us who you are</p>

            <div style={S.typeGrid}>
              {/* Hirer */}
              <button style={S.typeBtn} onClick={() => chooseType("hirer")}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(26,111,232,.7)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(26,111,232,.2)"}>
                <div style={S.typeIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#1A6FE8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <div style={S.typeName}>I am Hiring</div>
                <div style={S.typeSub}>Browse talent and build your team</div>
                <div style={S.typeArrow}>→</div>
              </button>

              {/* Candidate */}
              <button style={S.typeBtn} onClick={() => chooseType("candidate")}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,170,255,.6)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(26,111,232,.2)"}>
                <div style={S.typeIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#00AAFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div style={S.typeName}>I am Job Seeking</div>
                <div style={S.typeSub}>Get discovered by the right companies</div>
                <div style={S.typeArrow}>→</div>
              </button>
            </div>

            <p style={S.loginLink}>
              Already have an account?{" "}
              <Link to="/login" style={S.link}>Sign in here</Link>
            </p>
          </>
        )}

        {/* ── STEP 2 — Fill in details ── */}
        {step === 2 && (
          <>
            <button style={S.back} onClick={() => { setStep(1); setError(""); }}>← Back</button>

            <div style={S.pill}>
              {userType === "hirer" ? "Hiring Account" : "Job Seeker Account"}
            </div>

            <h1 style={S.h1}>Create your account</h1>
            <p style={S.sub}>
              {userType === "hirer"
                ? "Join companies discovering real talent"
                : "Join professionals being discovered"}
            </p>

            {error && <div style={S.error}>{error}</div>}

            {/* Google sign up */}
            <button style={S.googleBtn} onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div style={S.divider}>
              <div style={S.divLine} />
              <span style={S.divText}>or continue with email</span>
              <div style={S.divLine} />
            </div>

            <form onSubmit={handleEmailSignUp} style={S.form}>
              <Field label="Full Name">
                <input style={S.input} type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)} required
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.7)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"} />
              </Field>
              <Field label="Email Address">
                <input style={S.input} type="email" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.7)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"} />
              </Field>
              <Field label="Password">
                <input style={S.input} type="password" placeholder="Minimum 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.7)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"} />
              </Field>
              <button style={S.submitBtn} type="submit" disabled={loading}
                onMouseEnter={e => e.currentTarget.style.opacity = ".88"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                {loading ? "Creating your account..." : "Create Account"}
              </button>
            </form>

            <p style={S.loginLink}>
              Already have an account?{" "}
              <Link to="/login" style={S.link}>Sign in here</Link>
            </p>
            <p style={S.terms}>
              By creating an account you agree to our{" "}
              <a href="#" style={S.link}>Terms of Service</a> and{" "}
              <a href="#" style={S.link}>Privacy Policy</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Small reusable field wrapper ──
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "11px", fontWeight: 700, color: "#7A90B8", letterSpacing: ".5px", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Google icon ──
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

// ── Styles ──
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
    borderRadius: "24px", padding: "48px", width: "100%", maxWidth: "500px",
    position: "relative", zIndex: 1, boxShadow: "0 24px 80px rgba(0,53,204,.2)",
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: "32px" },
  logo: {
    height: "64px", width: "auto", objectFit: "contain",
    filter: "drop-shadow(0 4px 16px rgba(26,111,232,.3))"
  },
  h1: {
    fontWeight: 800, fontSize: "28px", color: "#fff",
    marginBottom: "8px", textAlign: "center", letterSpacing: "-1px"
  },
  sub: { fontSize: "14px", color: "#7A90B8", textAlign: "center", marginBottom: "32px" },

  typeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" },
  typeBtn: {
    background: "rgba(26,111,232,.07)", border: "1px solid rgba(26,111,232,.2)",
    borderRadius: "16px", padding: "24px 16px", cursor: "pointer", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
    transition: "border-color .2s",
  },
  typeIcon: {
    width: "54px", height: "54px", borderRadius: "50%",
    background: "rgba(26,111,232,.12)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typeName: { fontSize: "14px", fontWeight: 700, color: "#fff" },
  typeSub: { fontSize: "12px", color: "#7A90B8", lineHeight: 1.5 },
  typeArrow: { fontSize: "16px", color: "#1A6FE8", fontWeight: 700 },

  pill: {
    display: "inline-block",
    background: "linear-gradient(135deg,rgba(0,170,255,.12),rgba(0,53,204,.12))",
    border: "1px solid rgba(26,111,232,.35)", borderRadius: "100px",
    padding: "5px 16px", fontSize: "11px", fontWeight: 700,
    letterSpacing: "1.5px", textTransform: "uppercase", color: "#00AAFF", marginBottom: "20px",
  },
  back: {
    background: "none", border: "none", color: "#7A90B8", fontSize: "14px",
    cursor: "pointer", padding: "0 0 16px 0", display: "block",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
  },
  error: {
    background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)",
    borderRadius: "10px", padding: "12px 16px",
    color: "#FC8181", fontSize: "13px", marginBottom: "20px",
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
  input: {
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "10px", padding: "13px 16px", fontSize: "14px", color: "#fff",
    outline: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "border-color .2s",
  },
  submitBtn: {
    background: "linear-gradient(135deg,#00AAFF 0%,#1A6FE8 50%,#0035CC 100%)",
    color: "#fff", border: "none", borderRadius: "10px", padding: "14px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "8px",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    boxShadow: "0 4px 24px rgba(26,111,232,.4)", transition: "opacity .2s",
  },
  loginLink: { textAlign: "center", fontSize: "14px", color: "#7A90B8", marginTop: "20px" },
  link: { color: "#00AAFF", textDecoration: "none", fontWeight: 600 },
  terms: { textAlign: "center", fontSize: "12px", color: "#4A5568", marginTop: "12px", lineHeight: 1.6 },
};
