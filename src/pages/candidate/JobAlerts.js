// src/pages/candidate/JobAlerts.js
// ═══════════════════════════════════════════════════════
//  Candidate Job Alerts — Phase 9
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Bell, BellOff, Search, MapPin, Briefcase } from "lucide-react";

export default function JobAlerts() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertSettings, setAlertSettings] = useState({
        active: false,
        keywords: [],
        locations: [],
        minMatchScore: 70
    });

    const [keywordInput, setKeywordInput] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [toast, setToast] = useState("");

    useEffect(() => {
        async function loadSettings() {
            if (!currentUser?.uid) return;
            try {
                const docRef = doc(db, "jobAlerts", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setAlertSettings(docSnap.data());
                }
            } catch (err) {
                console.error("Failed to load job alert settings", err);
            }
            setLoading(false);
        }
        loadSettings();
    }, [currentUser]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, "jobAlerts", currentUser.uid);
            await setDoc(docRef, {
                ...alertSettings,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            showToast("Alert settings saved!");
        } catch (err) {
            console.error(err);
            showToast("Failed to save settings.");
        }
        setSaving(false);
    };

    const handleAddKeyword = (e) => {
        e.preventDefault();
        if (!keywordInput.trim() || alertSettings.keywords.includes(keywordInput.trim())) return;
        setAlertSettings(prev => ({
            ...prev,
            keywords: [...prev.keywords, keywordInput.trim()]
        }));
        setKeywordInput("");
    };

    const handleAddLocation = (e) => {
        e.preventDefault();
        if (!locationInput.trim() || alertSettings.locations.includes(locationInput.trim())) return;
        setAlertSettings(prev => ({
            ...prev,
            locations: [...prev.locations, locationInput.trim()]
        }));
        setLocationInput("");
    };

    const removeKeyword = (idx) => {
        setAlertSettings(prev => ({
            ...prev,
            keywords: prev.keywords.filter((_, i) => i !== idx)
        }));
    };

    const removeLocation = (idx) => {
        setAlertSettings(prev => ({
            ...prev,
            locations: prev.locations.filter((_, i) => i !== idx)
        }));
    };

    const toggleActive = () => {
        setAlertSettings(prev => ({ ...prev, active: !prev.active }));
    };

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }

    const S = {
        container: { padding: "40px", color: "#fff", fontFamily: C.font, maxWidth: 800, margin: "0 auto" },
        header: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
        sub: { color: C.silver, fontSize: 16, marginBottom: 40 },
        card: { background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 16, padding: 32, marginBottom: 24 },
        inputGroup: { marginBottom: 24 },
        label: { display: "block", fontSize: 13, fontWeight: 700, color: C.silver, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" },
        inputWrap: { display: "flex", gap: 8 },
        input: { flex: 1, background: "rgba(255,255,255,.05)", border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none" },
        btn: { background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "0 20px", color: "#fff", fontWeight: 600, cursor: "pointer" },
        chipList: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 },
        chip: { background: "rgba(26,111,232,.1)", border: "1px solid rgba(26,111,232,.3)", borderRadius: 100, padding: "6px 14px", fontSize: 13, color: C.blue, display: "flex", alignItems: "center", gap: 6 },
        chipRemove: { cursor: "pointer", opacity: 0.6, fontSize: 16, lineHeight: 1 },
        slider: { width: "100%", accentColor: C.blue, marginTop: 12 }
    };

    if (loading) return null;

    return (
        <div style={S.container}>
            {toast && (
                <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 22px", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                    {toast}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                <div>
                    <h1 style={S.header}>Job Alerts & Matches</h1>
                    <p style={{ color: C.silver, fontSize: 16 }}>Get notified when a highly relevant job is posted.</p>
                </div>
                <button
                    onClick={toggleActive}
                    style={{
                        background: alertSettings.active ? "rgba(46,204,113,.1)" : "rgba(255,255,255,.05)",
                        border: `1px solid ${alertSettings.active ? "rgba(46,204,113,.4)" : C.line}`,
                        color: alertSettings.active ? C.green : C.silver,
                        padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 8, transition: "all .2s"
                    }}
                >
                    {alertSettings.active ? <Bell size={18} /> : <BellOff size={18} />}
                    {alertSettings.active ? "Alerts Active" : "Alerts Paused"}
                </button>
            </div>

            <div style={{ ...S.card, opacity: alertSettings.active ? 1 : 0.5, pointerEvents: alertSettings.active ? "auto" : "none", transition: "opacity .3s" }}>

                {/* Keywords */}
                <div style={S.inputGroup}>
                    <label style={S.label}><Search size={14} style={{ display: "inline", verticalAlign: "bottom", marginRight: 6 }} /> Keywords / Job Titles</label>
                    <form onSubmit={handleAddKeyword} style={S.inputWrap}>
                        <input
                            style={S.input}
                            placeholder="e.g. React, UX Designer"
                            value={keywordInput}
                            onChange={e => setKeywordInput(e.target.value)}
                        />
                        <button type="submit" style={S.btn}>Add</button>
                    </form>
                    <div style={S.chipList}>
                        {alertSettings.keywords.map((kw, i) => (
                            <span key={i} style={S.chip}>
                                {kw} <span style={S.chipRemove} onClick={() => removeKeyword(i)}>×</span>
                            </span>
                        ))}
                        {alertSettings.keywords.length === 0 && <span style={{ color: C.silver, fontSize: 13 }}>No keywords set.</span>}
                    </div>
                </div>

                <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "32px 0" }} />

                {/* Locations */}
                <div style={S.inputGroup}>
                    <label style={S.label}><MapPin size={14} style={{ display: "inline", verticalAlign: "bottom", marginRight: 6 }} /> Locations</label>
                    <form onSubmit={handleAddLocation} style={S.inputWrap}>
                        <input
                            style={S.input}
                            placeholder="e.g. Dubai, Remote"
                            value={locationInput}
                            onChange={e => setLocationInput(e.target.value)}
                        />
                        <button type="submit" style={S.btn}>Add</button>
                    </form>
                    <div style={S.chipList}>
                        {alertSettings.locations.map((loc, i) => (
                            <span key={i} style={S.chip}>
                                {loc} <span style={S.chipRemove} onClick={() => removeLocation(i)}>×</span>
                            </span>
                        ))}
                        {alertSettings.locations.length === 0 && <span style={{ color: C.silver, fontSize: 13 }}>Any location.</span>}
                    </div>
                </div>

                <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "32px 0" }} />

                {/* Minimum Match Score */}
                <div style={S.inputGroup}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ ...S.label, marginBottom: 0 }}><Briefcase size={14} style={{ display: "inline", verticalAlign: "bottom", marginRight: 6 }} /> Minimum AI Match Score</label>
                        <span style={{ fontWeight: 800, fontSize: 18, color: C.blue }}>{alertSettings.minMatchScore}%</span>
                    </div>
                    <p style={{ color: C.silver, fontSize: 13, marginTop: 6 }}>Only notify me when a job matches my profile by at least this percentage.</p>
                    <input
                        type="range"
                        min="30" max="95" step="5"
                        value={alertSettings.minMatchScore}
                        onChange={e => setAlertSettings(p => ({ ...p, minMatchScore: parseInt(e.target.value) }))}
                        style={S.slider}
                    />
                </div>

            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    background: C.grad, border: "none", borderRadius: 10, padding: "14px 32px",
                    color: "#fff", fontWeight: 700, fontSize: 16, cursor: saving ? "default" : "pointer",
                    width: "100%", boxShadow: "0 8px 24px rgba(26,111,232,.3)"
                }}
            >
                {saving ? "Saving..." : "Save Config"}
            </button>

        </div>
    );
}
