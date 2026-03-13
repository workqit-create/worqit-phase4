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
            showToast("Strategic parameters updated.");
        } catch (err) {
            console.error(err);
            showToast("Failed to sync parameters.");
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
        container: { maxWidth: "900px", margin: "0 auto", fontFamily: C.font, color: "#1D1D1F" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "48px" },
        title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
        subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },
        
        card: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px", padding: "40px", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)", marginBottom: "32px" },
        sectionTitle: { fontSize: "11px", fontWeight: 900, color: "#64748B", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" },
        
        inputRow: { display: "flex", gap: "12px", marginBottom: "16px" },
        input: { flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "16px 20px", fontSize: "14px", fontWeight: 600, color: "#1D1D1F", outline: "none", transition: "all 0.2s" },
        addBtn: { background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "14px", padding: "0 24px", fontWeight: 800, fontSize: "12px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" },
        
        chipList: { display: "flex", flexWrap: "wrap", gap: "10px" },
        chip: { background: "rgba(0,85,255,0.06)", border: "1px solid rgba(0,85,255,0.1)", borderRadius: "12px", padding: "8px 16px", fontSize: "13px", color: "#0055FF", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" },
        chipRemove: { cursor: "pointer", opacity: 0.5, fontSize: "18px", lineHeight: 1, "&:hover": { opacity: 1 } },
        
        sliderContainer: { marginTop: "40px" },
        sliderHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" },
        scoreDisplay: { fontSize: "32px", fontWeight: 900, color: "#0055FF", fontFamily: "'Outfit', sans-serif" },
        slider: { width: "100%", height: "6px", background: "#F1F5F9", borderRadius: "3px", appearance: "none", outline: "none", cursor: "pointer", accentColor: "#0055FF" },
        
        toggleBtn: (active) => ({
            background: active ? "#0055FF" : "#F1F5F9",
            color: active ? "#fff" : "#64748B",
            border: "none", borderRadius: "16px", padding: "12px 24px",
            fontWeight: 800, fontSize: "13px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "10px",
            transition: "all 0.2s", boxShadow: active ? "0 12px 24px rgba(0,85,255,0.2)" : "none"
        }),
        
        saveBtn: { width: "100%", background: "#1D1D1F", color: "#fff", border: "none", padding: "20px", borderRadius: "20px", fontWeight: 800, fontSize: "14px", cursor: "pointer", textTransform: "uppercase", letterSpacing: "2px", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.1)" },
        
        toast: { position: "fixed", bottom: "40px", right: "40px", zIndex: 1000, background: "#1D1D1F", color: "#fff", padding: "16px 32px", borderRadius: "16px", fontWeight: 800, fontSize: "14px", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }
    };

    if (loading) return null;

    return (
        <div style={S.container}>
            {toast && <div style={S.toast}>{toast}</div>}

            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Strategic Alerts</h1>
                    <p style={S.subtitle}>Define your mission parameters for autonomous job matching.</p>
                </div>
                <button onClick={toggleActive} style={S.toggleBtn(alertSettings.active)}>
                    {alertSettings.active ? <Bell size={18} /> : <BellOff size={18} />}
                    {alertSettings.active ? "Monitoring Active" : "Monitoring Paused"}
                </button>
            </div>

            <div style={{ ...S.card, opacity: alertSettings.active ? 1 : 0.6, transition: "all 0.3s" }}>
                <div style={S.sectionTitle}><Search size={14} /> Strategic Keywords</div>
                <form onSubmit={handleAddKeyword} style={S.inputRow}>
                    <input
                        style={S.input}
                        placeholder="e.g. Lead Designer, Strategy Consultant..."
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                    />
                    <button type="submit" style={S.addBtn}>Add Parameter</button>
                </form>
                <div style={S.chipList}>
                    {alertSettings.keywords.map((kw, i) => (
                        <span key={i} style={S.chip}>
                            {kw} <span style={S.chipRemove} onClick={() => removeKeyword(i)}>×</span>
                        </span>
                    ))}
                </div>

                <div style={{ height: "1px", background: "#F1F5F9", margin: "40px 0" }} />

                <div style={S.sectionTitle}><MapPin size={14} /> Target Jurisdictions</div>
                <form onSubmit={handleAddLocation} style={S.inputRow}>
                    <input
                        style={S.input}
                        placeholder="e.g. Dubai, Abu Dhabi, Remote..."
                        value={locationInput}
                        onChange={e => setLocationInput(e.target.value)}
                    />
                    <button type="submit" style={S.addBtn}>Add Location</button>
                </form>
                <div style={S.chipList}>
                    {alertSettings.locations.map((loc, i) => (
                        <span key={i} style={S.chip}>
                            {loc} <span style={S.chipRemove} onClick={() => removeLocation(i)}>×</span>
                        </span>
                    ))}
                </div>

                <div style={{ height: "1px", background: "#F1F5F9", margin: "40px 0" }} />

                <div style={S.sliderContainer}>
                    <div style={S.sliderHeader}>
                        <div>
                            <div style={S.sectionTitle}><Briefcase size={14} /> AI Match Sensitivity</div>
                            <p style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 500, margin: 0 }}>Minimum profile relevance score for alerts.</p>
                        </div>
                        <div style={S.scoreDisplay}>{alertSettings.minMatchScore}%</div>
                    </div>
                    <input
                        type="range"
                        min="30" max="95" step="5"
                        value={alertSettings.minMatchScore}
                        onChange={e => setAlertSettings(p => ({ ...p, minMatchScore: parseInt(e.target.value) }))}
                        style={S.slider}
                    />
                </div>
            </div>

            <button onClick={handleSave} disabled={saving} style={S.saveBtn}>
                {saving ? "Deploying Parameters..." : "Publish Match Config"}
            </button>
        </div>
    );
}
