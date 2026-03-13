// src/pages/hirer/PostJob.js
// ═══════════════════════════════════════════════════════
//  Hirer — post a new job (Ultra-Premium White Update)
// ═══════════════════════════════════════════════════════

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { postJob, getHirerJobs } from "../../services/jobService";
import { checkAccess } from "../../utils/access";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

export default function PostJob() {
  const { currentUser, userProfile } = useAuth();
  const [form, setForm] = useState({
    title: "", company: "", location: "", salaryAmount: "", currency: "AED",
    type: "Full-time", description: "", skills: "",
  });
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const [canPost, setCanPost] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function checkLimits() {
      try {
        const jobs = await getHirerJobs(currentUser.uid);
        const activeJobs = jobs.filter(j => j.status === "open").length;
        const hasAccess = checkAccess(userProfile, 'post_job', { activeJobs });
        setCanPost(hasAccess);
      } catch (e) { console.error(e); }
    }
    if (currentUser) checkLimits();
  }, [currentUser, userProfile]);

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Job title and description are required.");
      return;
    }
    setPosting(true); setError("");
    try {
      const skillsArray = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      await postJob(currentUser.uid, {
        title: form.title.trim(),
        company: form.company.trim() || userProfile?.companyName || "",
        location: form.location.trim(),
        salary: form.salaryAmount ? `${form.currency} ${form.salaryAmount}` : "",
        type: form.type,
        description: form.description.trim(),
        skills: skillsArray,
      });
      setPosted(true);
      setForm({ title: "", company: "", location: "", salaryAmount: "", currency: "AED", type: "Full-time", description: "", skills: "" });
      setTimeout(() => setPosted(false), 4000);
    } catch { setError("Failed to post job."); }
    setPosting(false);
  }

  const S = {
    container: { maxWidth: "800px", margin: "0 auto", fontFamily: C.font },
    header: { marginBottom: "48px" },
    title: { color: "#1D1D1F", fontSize: "32px", fontWeight: 900, fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    input: {
      width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px",
      padding: "14px 16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s",
      boxSizing: "border-box", fontWeight: 600,
    },
    submitBtn: {
      background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "16px",
      padding: "18px 48px", fontWeight: 800, fontSize: "14px", cursor: "pointer",
      textTransform: "uppercase", letterSpacing: "1.5px", transition: "all 0.2s",
      boxShadow: "0 12px 24px -6px rgba(0,0,0,0.2)", marginTop: "24px"
    },
    lockBox: {
      textAlign: "center", padding: "80px 40px", background: "#fff", borderRadius: "32px",
      border: "1px solid #E2E8F0", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)"
    }
  };

  if (!canPost) return (
    <div style={S.container}>
      <div style={S.lockBox}>
        <Lock size={64} color="#0055FF" style={{ marginBottom: "32px", opacity: 0.2 }} />
        <h2 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>Posting Limit Reached</h2>
        <p style={{ fontSize: "16px", color: "#94A3B8", marginBottom: "40px", maxWidth: "400px", margin: "0 auto 40px", fontWeight: 500 }}>
          You've reached the limit of 2 active job postings. Upgrade to Pro for unlimited strategic access.
        </p>
        <button onClick={() => navigate("/hirer/billing")} style={S.submitBtn}>Upgrade to Pro</button>
      </div>
    </div>
  );

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>Publish Opportunity</h1>
        <p style={S.subtitle}>Strategic deployment to the Worqit elite network.</p>
      </div>

      {error && <div style={{ background: "rgba(220,50,50,0.05)", border: "1px solid rgba(220,50,50,0.1)", borderRadius: "12px", padding: "16px", color: "#E53E3E", fontWeight: 700, fontSize: "14px", marginBottom: "24px" }}>{error}</div>}
      {posted && <div style={{ background: "rgba(0,180,100,0.05)", border: "1px solid rgba(0,180,100,0.1)", borderRadius: "12px", padding: "16px", color: "#00B464", fontWeight: 700, fontSize: "14px", marginBottom: "24px" }}>🎉 Strategic listing successfully deployed.</div>}

      <form onSubmit={handlePost}>
        <FormSection title="Engagement Details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <FormField label="Strategic Title">
              <input style={S.input} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Lead Systems Architect" required />
            </FormField>
            <FormField label="Organization">
              <input style={S.input} value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder={userProfile?.companyName || "Your Studio"} />
            </FormField>
            <FormField label="Location / Nexus">
              <input style={S.input} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Dubai, UAE / Global Remote" />
            </FormField>
            <FormField label="Compensation Range">
              <div style={{ display: "flex", gap: "12px" }}>
                <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={{ ...S.input, width: "100px", flexShrink: 0 }}>
                  {["AED", "USD", "GBP", "EUR", "SAR", "INR", "PKR", "PHP", "MYR", "SGD"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ ...S.input, flex: 1 }} value={form.salaryAmount} onChange={e => setForm(p => ({ ...p, salaryAmount: e.target.value }))} placeholder="e.g. 25,000 / mo" />
              </div>
            </FormField>
          </div>
          <FormField label="Listing Type">
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={S.input}>
              {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </FormSection>

        <FormSection title="Strategic Brief">
          <FormField label="Role Overview">
            <textarea style={{ ...S.input, height: "160px", resize: "none", lineHeight: 1.6, padding: "20px" }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the mission, responsibilities, and the elite talent you seek..." required />
          </FormField>
        </FormSection>

        <FormSection title="Core Capabilities">
          <FormField label="Required Skills (Comma Separated)">
            <input style={S.input} value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="e.g. React, TypeScript, AI Engineering" />
          </FormField>
          {form.skills && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
              {form.skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                <span key={i} style={{ background: "rgba(0,85,255,0.06)", border: "1px solid rgba(0,85,255,0.1)", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", fontWeight: 800, color: "#0055FF", textTransform: "uppercase", letterSpacing: "1px" }}>{s}</span>
              ))}
            </div>
          )}
        </FormSection>

        <button type="submit" disabled={posting} style={S.submitBtn}>{posting ? "Deploying..." : "Publish Listing →"}</button>
      </form>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ color: "#0055FF", fontWeight: 900, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        {title}
        <div style={{ flex: 1, height: "1px", background: "rgba(0,85,255,0.1)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>{children}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</div>
      {children}
    </div>
  );
}
