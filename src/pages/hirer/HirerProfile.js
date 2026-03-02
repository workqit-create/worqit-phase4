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
      await uploadBytes(storageRef, file);
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

  // ── VIEW MODE ──────────────────────────────────────────
  if (mode === "view") {
    return (
      <div style={{ padding: "32px 36px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Company Profile</h1>
            <p style={{ color: C.silver, fontSize: 13, marginTop: 4 }}>What candidates see when you reach out to them</p>
          </div>
          <button onClick={() => setMode("edit")} style={{ background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.3)", borderRadius: 8, padding: "9px 20px", color: C.cyan, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: C.font }}>✏️ Edit Profile</button>
        </div>

        <div style={{ background: C.ink2, border: "1px solid rgba(26,111,232,.2)", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.3)" }}>
          <div style={{ height: 90, background: "linear-gradient(135deg,#0035CC,#1A6FE8,#00AAFF)" }} />
          <div style={{ padding: "0 28px 28px", marginTop: -36 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {logoURL
                  ? <img src={logoURL} alt="Logo" style={{ width: 80, height: 80, borderRadius: 14, objectFit: "cover", border: "3px solid #0A1228" }} />
                  : <div style={{ width: 80, height: 80, borderRadius: 14, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 30, color: "#fff", border: "3px solid #0A1228" }}>{initials}</div>
                }
                <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: C.royal, border: "2px solid #0A1228", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Change logo">📷</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
              </div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 22, margin: "0 0 4px" }}>{form.companyName || "Your Company"}</h2>
                <div style={{ color: C.silver, fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {form.industry && <span>🏭 {form.industry}</span>}
                  {form.companySize && <span>👥 {form.companySize} employees</span>}
                  {form.location && <span>📍 {form.location}</span>}
                </div>
              </div>
              {userProfile?.isFounding100 && (
                <div style={{ background: "rgba(255,170,0,.1)", border: "1px solid rgba(255,170,0,.3)", borderRadius: 10, padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 18 }}>🏆</div>
                  <div style={{ color: "#FFAA00", fontWeight: 800, fontSize: 11 }}>Founding 100</div>
                </div>
              )}
            </div>

            {form.companyBio && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>About</div>
                <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{form.companyBio}</p>
              </div>
            )}

            {(form.website || form.linkedin) && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {form.website && <a href={form.website} target="_blank" rel="noreferrer" style={{ background: "rgba(26,111,232,.08)", border: "1px solid rgba(26,111,232,.2)", borderRadius: 8, padding: "7px 14px", color: C.cyan, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>🌐 Website</a>}
                {form.linkedin && <a href={form.linkedin} target="_blank" rel="noreferrer" style={{ background: "rgba(26,111,232,.08)", border: "1px solid rgba(26,111,232,.2)", borderRadius: 8, padding: "7px 14px", color: C.cyan, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>🔗 LinkedIn</a>}
              </div>
            )}
          </div>
        </div>
        {uploading && <div style={{ textAlign: "center", color: C.silver, fontSize: 13, marginTop: 12 }}>Uploading…</div>}
      </div>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────
  const inp = { background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "11px 14px", color: "#fff", fontSize: 14, fontFamily: C.font, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>Edit Company Profile</h1>
        {userProfile?.profileComplete && <button onClick={() => setMode("view")} style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 16px", color: C.silver, fontSize: 13, cursor: "pointer", fontFamily: C.font, fontWeight: 600 }}>← View Profile</button>}
      </div>

      {/* Logo upload */}
      <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Company Logo</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {logoURL ? <img src={logoURL} alt="Logo" style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }} /> : <div style={{ width: 60, height: 60, borderRadius: 12, background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#fff" }}>{initials}</div>}
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.3)", borderRadius: 8, padding: "9px 18px", color: C.cyan, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: C.font }}>{uploading ? "Uploading…" : "Upload Logo"}</button>
            <p style={{ color: C.silver, fontSize: 12, margin: "6px 0 0" }}>JPG or PNG · Max 5MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
        </div>
      </div>

      {error && <div style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 10, padding: "12px 18px", color: "#FC8181", fontSize: 14, marginBottom: 18 }}>{error}</div>}
      {saved && <div style={{ background: "rgba(0,200,100,.1)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 10, padding: "12px 18px", color: "#00C864", fontSize: 14, marginBottom: 18 }}>Saved! Switching to view mode… ✓</div>}

      <form onSubmit={handleSave}>
        {[
          { title: "Contact", fields: [{ l: "Your Name *", k: "name", ph: "Your full name" }] },
          { title: "Company Details", fields: [
            { l: "Company Name *", k: "companyName", ph: "Your company name" },
            { l: "Industry", k: "industry", ph: "e.g. Fintech, Healthcare" },
            { l: "Location", k: "location", ph: "e.g. Dubai, UAE" },
          ]},
          { title: "About", fields: [{ l: "Company Bio", k: "companyBio", ph: "Tell candidates about your company and culture…", multi: true }] },
          { title: "Links", fields: [
            { l: "Website", k: "website", ph: "https://yourcompany.com" },
            { l: "LinkedIn", k: "linkedin", ph: "https://linkedin.com/company/yourcompany" },
          ]},
        ].map(({ title, fields }) => (
          <div key={title} style={{ marginBottom: 24 }}>
            <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{title}</div>
            <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Company size select in Details section */}
              {title === "Company Details" && (
                <div>
                  <div style={{ color: C.silver, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Company Size</div>
                  <select value={form.companySize} onChange={e => setForm(p => ({...p, companySize: e.target.value}))} style={{ ...inp, cursor: "pointer" }}>
                    <option value="" style={{ background: C.ink2 }}>Select size</option>
                    {["1–10","11–50","51–200","201–500","501–1000","1000+"].map(s => <option key={s} value={s} style={{ background: C.ink2 }}>{s} employees</option>)}
                  </select>
                </div>
              )}
              {fields.map(({ l, k, ph, multi }) => (
                <div key={k}>
                  <div style={{ color: C.silver, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{l}</div>
                  {multi
                    ? <textarea value={form[k]} onChange={e => setForm(p => ({...p, [k]: e.target.value}))} placeholder={ph} rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"} onBlur={e => e.target.style.borderColor = C.line} />
                    : <input type="text" value={form[k]} onChange={e => setForm(p => ({...p, [k]: e.target.value}))} placeholder={ph} style={inp} onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"} onBlur={e => e.target.style.borderColor = C.line} />
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" disabled={saving} style={{ background: saving ? "rgba(26,111,232,.5)" : C.grad, border: "none", borderRadius: 10, padding: "13px 32px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: saving ? "default" : "pointer", fontFamily: C.font, boxShadow: "0 4px 20px rgba(26,111,232,.3)" }}>{saving ? "Saving…" : "Save Profile"}</button>
      </form>
    </div>
  );
}
