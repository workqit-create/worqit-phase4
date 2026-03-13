// src/pages/candidate/CandidateProfile.js
// ═══════════════════════════════════════════════════════
//  ULTRA-PREMIUM REBUILD:
//  + Outfit & Plus Jakarta Sans typography
//  + Mesh gradients and glassmorphism
//  + Fashion-style portrait layout
//  + Premium timeline and stats
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

// ── PREMIUM CSS ───────────────────────────────────────
export default function CandidateProfile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState({
    name: "", headline: "", bio: "", location: "",
    skills: "", experience: "", education: "",
    linkedin: "", portfolio: "",
  });
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || "",
        headline: userProfile.headline || "",
        bio: userProfile.bio || "",
        location: userProfile.location || "",
        skills: (userProfile.skills || []).join(", "),
        experience: userProfile.experience || "",
        education: userProfile.education || "",
        linkedin: userProfile.linkedin || "",
        portfolio: userProfile.portfolio || "",
      });
      setPhotoURL(userProfile.photo || "");
      if (userProfile.profileComplete && userProfile.name) setMode("view");
      else setMode("edit");
    }
  }, [userProfile]);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `photos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      await updateProfile(currentUser.uid, { photo: url });
      await refreshProfile();
    } catch { setError("Photo upload failed."); }
    setUploading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      await updateProfile(currentUser.uid, {
        ...form,
        skills: skillsArray,
        photo: photoURL,
        profileComplete: true,
      });
      await refreshProfile();
      setMode("view");
    } catch { setError("Save failed."); }
    setSaving(false);
  }

  const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
  const initials = (form.name || "P").charAt(0).toUpperCase();

  const S = {
    container: { maxWidth: "1200px", margin: "0 auto", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1D1D1F" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "60px" },
    title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    
    // VIEW MODE
    profileGrid: { display: "grid", gridTemplateColumns: "400px 1fr", gap: "60px" },
    portraitWrapper: { position: "relative", borderRadius: "40px", overflow: "hidden", aspectRatio: "3/4", background: "#F1F5F9", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.12)" },
    portrait: { width: "100%", height: "100%", objectFit: "cover" },
    portraitPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px", fontWeight: 900, color: "#CBD5E1", background: "#F8FAFC" },
    
    glassCard: { background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(20px)", border: "1px solid #E2E8F0", borderRadius: "32px", padding: "32px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" },
    
    name: { fontSize: "56px", fontWeight: 900, color: "#1D1D1F", lineHeight: 1, letterSpacing: "-2px", marginBottom: "16px", fontFamily: "'Outfit', sans-serif" },
    headline: { fontSize: "20px", fontWeight: 700, color: "#0055FF", marginBottom: "8px" },
    location: { fontSize: "15px", fontWeight: 600, color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" },
    
    sectionTitle: { fontSize: "11px", fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: "20px" },
    bio: { fontSize: "18px", lineHeight: "1.7", color: "#334155", fontWeight: 500, marginBottom: "40px" },
    
    tag: { padding: "8px 20px", borderRadius: "12px", background: "rgba(0,85,255,0.06)", color: "#0055FF", fontSize: "13px", fontWeight: 800, border: "1px solid rgba(0,85,255,0.1)" },
    
    timelineItem: (active) => ({ position: "relative", paddingLeft: "32px", borderLeft: `2px solid ${active ? "#0055FF" : "#E2E8F0"}`, paddingBottom: "32px" }),
    timelineDot: (active) => ({ position: "absolute", left: "-7px", top: "0", width: "12px", height: "12px", borderRadius: "50%", background: "#fff", border: `2px solid ${active ? "#0055FF" : "#E2E8F0"}` }),
    
    editBtn: { background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "14px", padding: "12px 24px", fontWeight: 800, fontSize: "12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px", transition: "all 0.2s" },

    // EDIT MODE
    formCard: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px", padding: "48px", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" },
    label: { display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
    input: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontWeight: 600, marginBottom: "20px" },
    textarea: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "18px", padding: "16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontWeight: 600, minHeight: "120px", resize: "none", marginBottom: "20px" },
    saveBtn: { background: "#0055FF", color: "#fff", border: "none", padding: "18px 40px", borderRadius: "16px", fontWeight: 800, cursor: "pointer", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", boxShadow: "0 12px 24px rgba(0,85,255,0.2)" }
  };

  if (mode === "view") {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Professional Studio</h1>
            <p style={S.subtitle}>Your strategic profile in the elite network.</p>
          </div>
          <button onClick={() => setMode("edit")} style={S.editBtn}>✏️ Refine Profile</button>
        </div>

        <div style={S.profileGrid}>
          {/* LEFT: PORTRAIT */}
          <div>
            <div style={S.portraitWrapper}>
              {photoURL ? (
                <img src={photoURL} alt="Profile" style={S.portrait} />
              ) : (
                <div style={S.portraitPlaceholder}>{initials}</div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 40%)", pointerEvents: "none" }} />
              <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: "24px", right: "24px", width: "44px", height: "44px", borderRadius: "14px", background: "#fff", color: "#1D1D1F", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}>
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            </div>

            <div style={{ ...S.glassCard, marginTop: "32px" }}>
              <div style={S.sectionTitle}>Talent Metrics</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700 }}>
                  <span style={{ color: "#94A3B8" }}>Profile Yield</span>
                  <span style={{ color: "#0055FF" }}>Elite (98%)</span>
                </div>
                <div style={{ width: "100%", height: "4px", background: "#F1F5F9", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: "98%", height: "100%", background: "#0055FF" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 700, marginTop: "8px" }}>
                  <span style={{ color: "#94A3B8" }}>Response Velocity</span>
                  <span style={{ color: "#1D1D1F" }}>&lt; 1 Hour</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CONTENT */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "48px" }}>
              <h2 style={S.name}>{form.name || "Professional Identity"}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <span style={S.headline}>{form.headline || "Strategic Talent"}</span>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#CBD5E1" }} />
                <span style={S.location}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>location_on</span> {form.location || "UAE Network"}</span>
              </div>
            </div>

            <div style={S.glassCard}>
              <div style={S.sectionTitle}>Strategic Narrative</div>
              <p style={S.bio}>{form.bio || "Define your professional narrative to attract elite opportunities."}</p>
            </div>

            <div style={{ marginTop: "48px" }}>
              <div style={S.sectionTitle}>Core Expertise</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {skills.length > 0 ? skills.map(s => <span key={s} style={S.tag}>{s}</span>) : <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 600 }}>Define your core competencies in edit mode.</span>}
              </div>
            </div>

            <div style={{ ...S.glassCard, marginTop: "48px" }}>
              <div style={S.sectionTitle}>Professional Path</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={S.timelineItem(true)}>
                  <div style={S.timelineDot(true)} />
                  <p style={{ fontSize: "16px", fontWeight: 800, color: "#1D1D1F", marginBottom: "4px" }}>{form.experience || "Current Experience"}</p>
                  <p style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 600 }}>Latest Professional Deployment</p>
                </div>
                <div style={{ ...S.timelineItem(false), paddingBottom: 0 }}>
                  <div style={S.timelineDot(false)} />
                  <p style={{ fontSize: "16px", fontWeight: 800, color: "#1D1D1F", marginBottom: "4px" }}>{form.education || "Academic Background"}</p>
                  <p style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 600 }}>Educational Foundation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Refine Identity</h1>
          <p style={S.subtitle}>Update your professional parameters for the network.</p>
        </div>
        <button onClick={() => setMode("view")} style={{ ...S.editBtn, background: "#F1F5F9", color: "#64748B" }}>← Discard Changes</button>
      </div>

      <div style={S.formCard}>
        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <label style={S.label}>Full Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={S.input} placeholder="e.g. Alexander Sterling" required />
            </div>
            <div>
              <label style={S.label}>Strategic Headline</label>
              <input value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} style={S.input} placeholder="e.g. Senior Director of Product" />
            </div>
            <div>
              <label style={S.label}>Current Location</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} style={S.input} placeholder="e.g. Dubai, UAE" />
            </div>
            <div>
              <label style={S.label}>Core Expertise (Comma Separated)</label>
              <input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} style={S.input} placeholder="e.g. Strategy, Growth, Leadership" />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={S.label}>Professional Narrative</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} style={S.textarea} placeholder="Define your professional mission and impact..." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <label style={S.label}>Latest Experience</label>
              <input value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} style={S.input} placeholder="e.g. VP of Product at TechCorp" />
            </div>
            <div>
              <label style={S.label}>Educational Background</label>
              <input value={form.education} onChange={e => setForm({...form, education: e.target.value})} style={S.input} placeholder="e.g. MBA, Stanford University" />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
            <button type="submit" style={S.saveBtn} disabled={saving}>
              {saving ? "Deploying Updates..." : "Publish Profile Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

