// src/pages/hirer/PostJob.js
// ═══════════════════════════════════════════════════════
//  Hirer — post a new job
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
    title: "", company: "", location: "", salary: "",
    type: "Full-time", description: "", skills: "",
  });
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState("");
  const [canPost, setCanPost] = useState(true);
  const navigate = useNavigate();

  // Check limits when component mounts
  React.useEffect(() => {
    async function checkLimits() {
      try {
        const jobs = await getHirerJobs(currentUser.uid);
        const activeJobs = jobs.filter(j => j.status === "open").length;

        const hasAccess = checkAccess(userProfile, 'post_job', { activeJobs });
        setCanPost(hasAccess);
      } catch (e) {
        console.error("Failed to check limits", e);
      }
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
        salary: form.salary.trim(),
        type: form.type,
        description: form.description.trim(),
        skills: skillsArray,
      });
      setPosted(true);
      setForm({ title: "", company: "", location: "", salary: "", type: "Full-time", description: "", skills: "" });
      setTimeout(() => setPosted(false), 4000);
    } catch { setError("Failed to post job. Please try again."); }
    setPosting(false);
  }

  const inputStyle = {
    background: "rgba(255,255,255,.05)",
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: "11px 14px",
    color: "#fff",
    fontSize: 14,
    fontFamily: C.font,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border .2s",
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>
          Post a Job
        </h1>
        <p style={{ color: C.silver, fontSize: 14 }}>
          Your job will be visible to all candidates on Worqit immediately
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 10, padding: "12px 18px", color: "#FC8181", fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}
      {posted && (
        <div style={{ background: "rgba(0,200,100,.1)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 10, padding: "12px 18px", color: "#00C864", fontSize: 14, marginBottom: 20 }}>
          🎉 Job posted successfully! Candidates can now apply.
        </div>
      )}

      {!canPost ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: C.ink2, borderRadius: 16, border: `1px solid ${C.line}`, marginTop: 20 }}>
          <Lock size={48} color={C.blue} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#fff" }}>
            Job Posting Limit Reached
          </h2>
          <p style={{ fontSize: 15, color: C.silver, marginBottom: 24, maxWidth: 450, margin: "0 auto 24px" }}>
            You've reached the limit of 2 active job postings on the Free Starter plan.
            Upgrade to Pro to post unlimited jobs and reach more candidates.
          </p>
          <button
            onClick={() => navigate("/hirer/billing")}
            style={{
              background: C.blue, color: "#fff", border: "none", padding: "14px 28px",
              borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      ) : (
        <form onSubmit={handlePost}>
          <FormSection title="Job Details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Job Title *">
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Senior Product Designer" required
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"}
                  onBlur={e => e.target.style.borderColor = C.line} />
              </FormField>
              <FormField label="Company Name">
                <input style={inputStyle} value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  placeholder={userProfile?.companyName || "Your company"}
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"}
                  onBlur={e => e.target.style.borderColor = C.line} />
              </FormField>
              <FormField label="Location">
                <input style={inputStyle} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Dubai, UAE / Remote"
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"}
                  onBlur={e => e.target.style.borderColor = C.line} />
              </FormField>
              <FormField label="Salary Range">
                <input style={inputStyle} value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))}
                  placeholder="e.g. AED 15,000 – 22,000 / month"
                  onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"}
                  onBlur={e => e.target.style.borderColor = C.line} />
              </FormField>
            </div>
            <FormField label="Job Type">
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map(t => (
                  <option key={t} value={t} style={{ background: C.ink2 }}>{t}</option>
                ))}
              </select>
            </FormField>
          </FormSection>

          <FormSection title="Description">
            <FormField label="Job Description *">
              <textarea
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                rows={6}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the role, responsibilities, what you're looking for, and what makes this a great opportunity…"
                required
                onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"}
                onBlur={e => e.target.style.borderColor = C.line}
              />
            </FormField>
          </FormSection>

          <FormSection title="Skills Required">
            <FormField label="Skills (comma separated)">
              <input style={inputStyle} value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))}
                placeholder="e.g. React, Figma, Product Management, SQL"
                onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"}
                onBlur={e => e.target.style.borderColor = C.line} />
            </FormField>
            {form.skills && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {form.skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                  <span key={i} style={{
                    background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.25)",
                    borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: C.cyan,
                  }}>{s}</span>
                ))}
              </div>
            )}
          </FormSection>

          <button
            type="submit"
            disabled={posting}
            style={{
              background: posting ? "rgba(26,111,232,.5)" : C.grad,
              border: "none", borderRadius: 10,
              padding: "13px 36px",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: posting ? "default" : "pointer",
              fontFamily: C.font,
              boxShadow: "0 4px 20px rgba(26,111,232,.3)",
            }}
          >
            {posting ? "Posting…" : "Post Job →"}
          </button>
        </form>
      )}
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ color: C.cyan, fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{
        background: C.ink2, border: `1px solid ${C.line}`,
        borderRadius: 14, padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <div style={{ color: C.silver, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
