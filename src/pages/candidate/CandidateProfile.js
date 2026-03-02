// src/pages/candidate/CandidateProfile.js
// ═══════════════════════════════════════════════════════
//  Phase 4 — Full rebuild:
//  + Photo upload to Firebase Storage
//  + Save actually refreshes context (bug fix)
//  + View Mode: beautiful profile card after saving
//  + Edit/View toggle
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { updateProfile } from "../../services/profileService";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";

export default function CandidateProfile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [form, setForm] = useState({
    name: "", headline: "", bio: "", location: "",
    skills: "", experience: "", education: "",
    linkedin: "", portfolio: "",
  });
  const [photoURL, setPhotoURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  // Populate form from profile on load
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
      // If profile is complete go straight to view mode
      if (userProfile.profileComplete && userProfile.name) setMode("view");
      else setMode("edit");
    }
  }, [userProfile]);

  // ── Photo upload ───────────────────────────────────────
  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB."); return; }
    setUploading(true); setError("");
    try {
      const storageRef = ref(storage, `photos/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      await updateProfile(currentUser.uid, { photo: url });
      await refreshProfile();
    } catch { setError("Photo upload failed. Please try again."); }
    setUploading(false);
  }

  // ── Save profile ───────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Full name is required."); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const skillsArray = form.skills.split(",").map(s => s.trim()).filter(Boolean);
      await updateProfile(currentUser.uid, {
        name: form.name.trim(),
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        skills: skillsArray,
        experience: form.experience.trim(),
        education: form.education.trim(),
        linkedin: form.linkedin.trim(),
        portfolio: form.portfolio.trim(),
        photo: photoURL,
      });
      await refreshProfile(); // ← THE FIX: context updates immediately
      setSaved(true);
      setTimeout(() => { setSaved(false); setMode("view"); }, 1200);
    } catch { setError("Failed to save. Please try again."); }
    setSaving(false);
  }

  const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
  const initials = (form.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const completionFields = ["name", "headline", "bio", "location", "skills"];
  const filled = completionFields.filter(f => (f === "skills" ? form.skills : form[f])?.trim()).length;
  const pct = Math.round((filled / completionFields.length) * 100);

  // ────────────────────────────────────────────────────────
  // VIEW MODE — Profile card
  // ────────────────────────────────────────────────────────
  if (mode === "view") {
    // ── Shared section card style ──
    const sectionCard = {
      background: "rgba(255,255,255,.025)",
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: "22px 24px",
      backdropFilter: "blur(8px)",
    };
    const sectionLabel = {
      color: C.cyan, fontSize: 11, fontWeight: 700,
      letterSpacing: 1.8, textTransform: "uppercase",
      marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
    };

    return (
      <div style={{ padding: "32px 36px", maxWidth: 760, margin: "0 auto" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>My Profile</h1>
            <p style={{ color: C.silver, fontSize: 13, marginTop: 6 }}>This is exactly what hirers see when they find you</p>
          </div>
          <button onClick={() => setMode("edit")} style={{
            background: "rgba(26,111,232,.12)", border: "1px solid rgba(26,111,232,.35)",
            borderRadius: 10, padding: "10px 22px", color: C.cyan,
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: C.font,
            transition: "all .2s",
          }}>✏️ Edit Profile</button>
        </div>

        {/* ── Hero card (banner + identity) ── */}
        <div style={{
          background: C.ink2, border: `1px solid rgba(26,111,232,.15)`,
          borderRadius: 22, overflow: "hidden",
          boxShadow: "0 12px 48px rgba(0,0,0,.35)",
          marginBottom: 20,
        }}>
          {/* Gradient banner */}
          <div style={{
            height: 120, position: "relative",
            background: "linear-gradient(135deg, #0035CC 0%, #1A6FE8 40%, #00AAFF 70%, #00D4FF 100%)",
          }}>
            {/* Subtle pattern overlay */}
            <div style={{
              position: "absolute", inset: 0, opacity: .08,
              backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 30%, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            {/* Completion badge */}
            <div style={{
              position: "absolute", top: 16, right: 20,
              background: pct === 100 ? "rgba(0,200,100,.15)" : "rgba(0,0,0,.25)",
              border: `1px solid ${pct === 100 ? "rgba(0,200,100,.4)" : "rgba(255,255,255,.15)"}`,
              borderRadius: 12, padding: "8px 16px", textAlign: "center",
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ color: pct === 100 ? "#00C864" : "#fff", fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{pct}%</div>
              <div style={{ color: pct === 100 ? "rgba(0,200,100,.7)" : "rgba(255,255,255,.6)", fontSize: 10, fontWeight: 600, marginTop: 2 }}>Complete</div>
            </div>
          </div>

          {/* Identity row */}
          <div style={{ padding: "0 30px 28px", marginTop: -44 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 4 }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {photoURL ? (
                  <img src={photoURL} alt="Profile"
                    style={{
                      width: 96, height: 96, borderRadius: "50%", objectFit: "cover",
                      border: "4px solid " + C.ink2,
                      boxShadow: "0 4px 24px rgba(0,170,255,.25)",
                    }} />
                ) : (
                  <div style={{
                    width: 96, height: 96, borderRadius: "50%",
                    background: "linear-gradient(135deg,#00AAFF,#1A6FE8)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 32, color: "#fff",
                    border: "4px solid " + C.ink2,
                    boxShadow: "0 4px 24px rgba(0,170,255,.25)",
                  }}>{initials}</div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 28, height: 28, borderRadius: "50%",
                    background: C.royal, border: "3px solid " + C.ink2,
                    color: "#fff", fontSize: 12, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }} title="Change photo">📷</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              </div>

              <div style={{ flex: 1, paddingBottom: 6 }}>
                <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 24, margin: 0, lineHeight: 1.2 }}>
                  {form.name || "Your Name"}
                </h2>
                {form.headline && (
                  <p style={{ color: C.text, fontSize: 14, margin: "6px 0 0", lineHeight: 1.4 }}>{form.headline}</p>
                )}
                {form.location && (
                  <p style={{ color: C.silver, fontSize: 13, margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                    📍 {form.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── About section ── */}
        {form.bio && (
          <div style={{ ...sectionCard, marginBottom: 16 }}>
            <div style={sectionLabel}>
              <span style={{ fontSize: 15 }}>💡</span> About
            </div>
            <p style={{ color: C.text, fontSize: 14, lineHeight: 1.8, margin: 0 }}>{form.bio}</p>
          </div>
        )}

        {/* ── Skills section ── */}
        {skills.length > 0 && (
          <div style={{ ...sectionCard, marginBottom: 16 }}>
            <div style={sectionLabel}>
              <span style={{ fontSize: 15 }}>⚡</span> Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skills.map((s, i) => (
                <span key={i} style={{
                  background: "linear-gradient(135deg, rgba(0,170,255,.1), rgba(26,111,232,.1))",
                  border: "1px solid rgba(26,111,232,.25)",
                  borderRadius: 8, padding: "6px 14px", fontSize: 12.5,
                  fontWeight: 600, color: C.cyan,
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Experience & Education (grid) ── */}
        {(form.experience || form.education) && (
          <div style={{ display: "grid", gridTemplateColumns: form.experience && form.education ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 16 }}>
            {form.experience && (
              <div style={sectionCard}>
                <div style={sectionLabel}>
                  <span style={{ fontSize: 15 }}>💼</span> Experience
                </div>
                <p style={{ color: C.text, fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{form.experience}</p>
              </div>
            )}
            {form.education && (
              <div style={sectionCard}>
                <div style={sectionLabel}>
                  <span style={{ fontSize: 15 }}>🎓</span> Education
                </div>
                <p style={{ color: C.text, fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{form.education}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Links section ── */}
        {(form.linkedin || form.portfolio) && (
          <div style={{ ...sectionCard, marginBottom: 16 }}>
            <div style={sectionLabel}>
              <span style={{ fontSize: 15 }}>🔗</span> Links
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {form.linkedin && (
                <a href={form.linkedin} target="_blank" rel="noreferrer" style={{
                  background: "linear-gradient(135deg, rgba(0,119,181,.12), rgba(0,119,181,.06))",
                  border: "1px solid rgba(0,119,181,.25)",
                  borderRadius: 10, padding: "10px 18px", color: "#0077B5",
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all .2s",
                }}>🔗 LinkedIn</a>
              )}
              {form.portfolio && (
                <a href={form.portfolio} target="_blank" rel="noreferrer" style={{
                  background: "linear-gradient(135deg, rgba(0,170,255,.1), rgba(26,111,232,.06))",
                  border: "1px solid rgba(0,170,255,.25)",
                  borderRadius: 10, padding: "10px 18px", color: C.cyan,
                  fontSize: 13, fontWeight: 700, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all .2s",
                }}>🌐 Portfolio</a>
              )}
            </div>
          </div>
        )}

        {uploading && (
          <div style={{
            textAlign: "center", color: C.silver, fontSize: 13, marginTop: 16,
            background: "rgba(26,111,232,.06)", borderRadius: 10, padding: "12px 0",
          }}>Uploading photo…</div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // EDIT MODE — form
  // ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 36px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>Edit Profile</h1>
          <p style={{ color: C.silver, fontSize: 13, marginTop: 4 }}>Fill in your details — hirers will see this when they discover you</p>
        </div>
        {userProfile?.profileComplete && (
          <button onClick={() => setMode("view")} style={{
            background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`,
            borderRadius: 8, padding: "9px 16px", color: C.silver,
            fontSize: 13, cursor: "pointer", fontFamily: C.font, fontWeight: 600,
          }}>← View Profile</button>
        )}
      </div>

      {/* Completion bar */}
      <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Profile Completion</span>
          <span style={{ color: pct === 100 ? "#00C864" : C.cyan, fontWeight: 800 }}>{pct}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 100, height: 5 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "linear-gradient(90deg,#00C864,#00AAFF)" : C.grad, borderRadius: 100, transition: "width .4s" }} />
        </div>
      </div>

      {/* Photo upload */}
      <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
        <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Profile Photo</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {photoURL ? (
            <img src={photoURL} alt="Profile" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.line}` }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.grad, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#fff" }}>{initials}</div>
          )}
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.3)",
              borderRadius: 8, padding: "9px 18px", color: C.cyan,
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: C.font,
            }}>{uploading ? "Uploading…" : "Upload Photo"}</button>
            <p style={{ color: C.silver, fontSize: 12, margin: "6px 0 0" }}>JPG or PNG · Max 5MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>
      </div>

      {error && <div style={{ background: "rgba(220,50,50,.1)", border: "1px solid rgba(220,50,50,.3)", borderRadius: 10, padding: "12px 18px", color: "#FC8181", fontSize: 14, marginBottom: 18 }}>{error}</div>}
      {saved && <div style={{ background: "rgba(0,200,100,.1)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 10, padding: "12px 18px", color: "#00C864", fontSize: 14, marginBottom: 18 }}>Profile saved! Switching to view mode… ✓</div>}

      <form onSubmit={handleSave}>
        <Sect title="Basic Info">
          <F label="Full Name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Your full name" required />
          <F label="Headline" value={form.headline} onChange={v => setForm(p => ({ ...p, headline: v }))} placeholder="e.g. Senior Product Designer · Dubai, UAE" />
          <F label="Location" value={form.location} onChange={v => setForm(p => ({ ...p, location: v }))} placeholder="e.g. Dubai, UAE" />
        </Sect>
        <Sect title="About You">
          <F label="Bio" value={form.bio} onChange={v => setForm(p => ({ ...p, bio: v }))} placeholder="A short paragraph about yourself and what you're looking for…" multi />
        </Sect>
        <Sect title="Skills">
          <F label="Skills (comma separated)" value={form.skills} onChange={v => setForm(p => ({ ...p, skills: v }))} placeholder="e.g. React, Figma, Product Management" />
          {skills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {skills.map((s, i) => <span key={i} style={{ background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.25)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: C.cyan }}>{s}</span>)}
            </div>
          )}
        </Sect>
        <Sect title="Experience & Education">
          <F label="Experience" value={form.experience} onChange={v => setForm(p => ({ ...p, experience: v }))} placeholder="e.g. 5 years in fintech, previously at KPMG" multi />
          <F label="Education" value={form.education} onChange={v => setForm(p => ({ ...p, education: v }))} placeholder="e.g. BSc Computer Science, University of Dubai, 2020" />
        </Sect>
        <Sect title="Links">
          <F label="LinkedIn URL" value={form.linkedin} onChange={v => setForm(p => ({ ...p, linkedin: v }))} placeholder="https://linkedin.com/in/yourname" />
          <F label="Portfolio / Website" value={form.portfolio} onChange={v => setForm(p => ({ ...p, portfolio: v }))} placeholder="https://yoursite.com" />
        </Sect>

        <button type="submit" disabled={saving} style={{
          background: saving ? "rgba(26,111,232,.5)" : C.grad,
          border: "none", borderRadius: 10, padding: "13px 32px",
          color: "#fff", fontWeight: 700, fontSize: 15,
          cursor: saving ? "default" : "pointer", fontFamily: C.font,
          boxShadow: "0 4px 20px rgba(26,111,232,.3)",
        }}>{saving ? "Saving…" : "Save Profile"}</button>
      </form>
    </div>
  );
}

function Sect({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{title}</div>
      <div style={{ background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function F({ label, value, onChange, placeholder, multi, required }) {
  const s = {
    background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`,
    borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14,
    fontFamily: C.font, outline: "none", width: "100%", boxSizing: "border-box",
  };
  return (
    <div>
      <div style={{ color: C.silver, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {multi
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} required={required} style={{ ...s, resize: "vertical", lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"} onBlur={e => e.target.style.borderColor = C.line} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} style={s} onFocus={e => e.target.style.borderColor = "rgba(26,111,232,.5)"} onBlur={e => e.target.style.borderColor = C.line} />
      }
    </div>
  );
}
