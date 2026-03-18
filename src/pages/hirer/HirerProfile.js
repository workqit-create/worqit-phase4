// src/pages/hirer/HirerProfile.js — Phase 4 full rebuild
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { updateProfile } from "../../services/profileService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

export default function HirerProfile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState({ name:"", companyName:"", industry:"", companySize:"", location:"", companyBio:"", website:"", linkedin:"" });
  const [logoURL, setLogoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    if (userProfile) {
      setForm({
        name:        userProfile.name || "",
        companyName: userProfile.companyName || "",
        industry:    userProfile.industry || "",
        companySize: userProfile.companySize || "",
        location:    userProfile.location || "",
        companyBio:  userProfile.companyBio || "",
        website:     userProfile.website || "",
        linkedin:    userProfile.linkedin || "",
      });
      setLogoURL(userProfile.photo || "");
      if (userProfile.profileComplete && userProfile.companyName) setMode("view");
      else setMode("edit");
    }
  }, [userProfile]);

  async function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Logo must be under 5MB."); return; }
    setUploading(true); setError("");
    try {
      const storageRef = ref(storage, `photos/${currentUser.uid}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      setLogoURL(url);
      await updateProfile(currentUser.uid, { photo: url });
      await refreshProfile();
    } catch { setError("Upload failed. Please try again."); }
    setUploading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.companyName.trim()) { setError("Company name is required."); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      await updateProfile(currentUser.uid, { ...form, photo: logoURL });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => { setSaved(false); setMode("view"); }, 1200);
    } catch { setError("Failed to save. Please try again."); }
    setSaving(false);
  }

  const initials = (form.companyName || form.name || "W").charAt(0).toUpperCase();

  const S = {
    container: { maxWidth: "900px", margin: "0 auto", fontFamily: C.font, color: "#1D1D1F" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" },
    title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
    subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
    
    // VIEW MODE STYLES
    profileCard: { background: "#fff", borderRadius: "40px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" },
    banner: { height: "160px", background: "linear-gradient(135deg, #0055FF, #00AAFF, #0055FF)", position: "relative" },
    content: { padding: "0 48px 48px", marginTop: "-60px", position: "relative" },
    logoWrapper: { position: "relative", width: "120px", height: "120px", marginBottom: "24px" },
    logo: { width: "120px", height: "120px", borderRadius: "32px", background: "#fff", border: "6px solid #fff", boxShadow: "0 12px 24px rgba(0,0,0,0.1)", objectFit: "cover", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", fontWeight: 900, color: "#0055FF" },
    cameraBtn: { position: "absolute", bottom: "8px", right: "8px", width: "36px", height: "36px", borderRadius: "12px", background: "#1D1D1F", color: "#fff", border: "4px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" },
    
    companyName: { fontSize: "28px", fontWeight: 900, color: "#1D1D1F", marginBottom: "8px", fontFamily: "'Outfit', sans-serif" },
    metaRow: { display: "flex", gap: "24px", color: "#64748B", fontSize: "14px", fontWeight: 600, marginBottom: "32px" },
    
    sectionTitle: { fontSize: "11px", fontWeight: 900, color: "#0055FF", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" },
    bio: { fontSize: "15px", lineHeight: "1.8", color: "#475569", marginBottom: "40px", fontWeight: 500 },
    
    linkBtn: { display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 24px", borderRadius: "16px", background: "#F1F5F9", color: "#1D1D1F", textDecoration: "none", fontSize: "13px", fontWeight: 800, transition: "all 0.2s" },
    editBtn: { background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "14px", padding: "12px 24px", fontWeight: 800, fontSize: "12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px", transition: "all 0.2s" },

    // EDIT MODE STYLES
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
    fieldCard: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "24px", padding: "32px", marginBottom: "24px" },
    label: { display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
    input: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontWeight: 600 },
    textarea: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "18px", padding: "16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontWeight: 600, minHeight: "120px", resize: "vertical" },
    saveBtn: { width: "100%", background: "#0055FF", color: "#fff", border: "none", padding: "18px", borderRadius: "16px", fontWeight: 800, cursor: "pointer", fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", boxShadow: "0 12px 24px rgba(0,85,255,0.2)" }
  };

  if (mode === "view") {
    return (
      <div style={S.container}>
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Organization Studio</h1>
            <p style={S.subtitle}>Manage your elite brand presence in the network.</p>
          </div>
          <button onClick={() => setMode("edit")} style={S.editBtn}>✏️ Refine Profile</button>
        </div>

        <div style={S.profileCard}>
          <div style={S.banner}>
            {userProfile?.isFounding100 && (
              <div style={{ position: "absolute", top: "24px", right: "24px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "100px", padding: "8px 20px", display: "flex", alignItems: "center", gap: "10px", color: "#fff" }}>
                <span style={{ fontSize: "16px" }}>🏆</span>
                <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1.5px" }}>Founding Partner</span>
              </div>
            )}
          </div>
          
          <div style={S.content}>
            <div style={S.logoWrapper}>
              {logoURL ? (
                <img src={logoURL} alt="Logo" style={S.logo} />
              ) : (
                <div style={S.logo}>{initials}</div>
              )}
              <button onClick={() => fileRef.current?.click()} style={S.cameraBtn} title="Update Brand Logo">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>photo_camera</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
            </div>

            <h2 style={S.companyName}>{form.companyName || "Organization Identity"}</h2>
            <div style={S.metaRow}>
              {form.industry && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>factory</span> {form.industry}</span>}
              {form.companySize && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>groups</span> {form.companySize} Employees</span>}
              {form.location && <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>location_on</span> {form.location}</span>}
            </div>

            <div style={S.sectionTitle}>Strategic Vision</div>
            <p style={S.bio}>{form.companyBio || "Define your company's strategic narrative to attract elite talent."}</p>

            <div style={{ display: "flex", gap: "12px" }}>
              {form.website && (
                <a href={form.website} target="_blank" rel="noreferrer" style={S.linkBtn} onMouseEnter={e => e.currentTarget.style.background = "#E2E8F0"} onMouseLeave={e => e.currentTarget.style.background = "#F1F5F9"}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>language</span> Official Website
                </a>
              )}
              {form.linkedin && (
                <a href={form.linkedin} target="_blank" rel="noreferrer" style={S.linkBtn} onMouseEnter={e => e.currentTarget.style.background = "#E2E8F0"} onMouseLeave={e => e.currentTarget.style.background = "#F1F5F9"}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>link</span> LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
        {uploading && <div style={{ textAlign: "center", color: "#0055FF", fontSize: "12px", fontWeight: 800, marginTop: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>Deploying Brand Asset...</div>}
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Refine Identity</h1>
          <p style={S.subtitle}>Update your organization's strategic parameters.</p>
        </div>
        <button onClick={() => setMode("view")} style={{ ...S.editBtn, background: "#F1F5F9", color: "#64748B" }}>← Discard Changes</button>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "16px", padding: "16px 24px", color: "#EF4444", fontSize: "14px", fontWeight: 700, marginBottom: "24px" }}>{error}</div>}
      {saved && <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)", borderRadius: "16px", padding: "16px 24px", color: "#10B981", fontSize: "14px", fontWeight: 700, marginBottom: "24px" }}>✅ Strategic update successful. Deploying...</div>}

      <form onSubmit={handleSave}>
        <div style={S.fieldCard}>
          <div style={S.sectionTitle}>Identity Assets</div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {logoURL ? <img src={logoURL} alt="Logo" style={{ width: "80px", height: "80px", borderRadius: "20px", objectFit: "cover" }} /> : <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: 900, color: "#CBD5E1" }}>{initials}</div>}
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.editBtn, padding: "10px 20px" }}>{uploading ? "Uploading..." : "Replace Logo"}</button>
              <p style={{ color: "#94A3B8", fontSize: "12px", marginTop: "8px", fontWeight: 600 }}>Recommended: 400x400px JPG or PNG</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
          </div>
        </div>

        <div style={S.fieldCard}>
          <div style={S.sectionTitle}>Primary Parameters</div>
          <div style={S.formGrid}>
            <div>
              <label style={S.label}>Organization Name</label>
              <input type="text" style={S.input} value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} required placeholder="e.g. Acme Strategic" />
            </div>
            <div>
              <label style={S.label}>Industry Sector</label>
              <input type="text" style={S.input} value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="e.g. Financial Technology" />
            </div>
            <div>
              <label style={S.label}>Organization Size</label>
              <select style={{ ...S.input, cursor: "pointer" }} value={form.companySize} onChange={e => setForm({...form, companySize: e.target.value})}>
                <option value="">Select Scale</option>
                {["1–10","11–50","51–200","201–500","501–1000","1000+"].map(s => <option key={s} value={s}>{s} Employees</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Headquarters Location</label>
              <input type="text" style={S.input} value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Dubai, UAE" />
            </div>
          </div>
        </div>

        <div style={S.fieldCard}>
          <div style={S.sectionTitle}>Brand Narrative</div>
          <label style={S.label}>Company Biography</label>
          <textarea style={S.textarea} value={form.companyBio} onChange={e => setForm({...form, companyBio: e.target.value})} placeholder="Describe your company's mission, culture, and strategic goals..." />
        </div>

        <div style={S.fieldCard}>
          <div style={S.sectionTitle}>Strategic Links</div>
          <div style={S.formGrid}>
            <div>
              <label style={S.label}>Corporate Website</label>
              <input type="text" style={S.input} value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://acme.com" />
            </div>
            <div>
              <label style={S.label}>LinkedIn Page</label>
              <input type="text" style={S.input} value={form.linkedin} onChange={e => setForm({...form, linkedin: e.target.value})} placeholder="https://linkedin.com/company/acme" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ ...S.saveBtn, opacity: saving ? 0.7 : 1 }}>
          {saving ? "Deploying Updates..." : "Publish Profile Changes"}
        </button>
      </form>
    </div>
  );
}

