import React, { useState, useEffect } from "react";
import { generateRecommendedChecklist, sendDocumentRequest } from "../../services/documentRequestService";
import { X, Send, AlertTriangle } from "lucide-react";

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "PH", name: "Philippines" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "UAE" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "BR", name: "Brazil" },
  { code: "AU", name: "Australia" }
];

export default function RequestDocumentModal({ isOpen, onClose, candidate, job, hrUid }) {
  const [jobCountry, setJobCountry] = useState("IN");
  const [candidateNationality, setCandidateNationality] = useState("IN");
  const [checklist, setChecklist] = useState([]);
  const [hrNote, setHrNote] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-generate based on default or selected
      const list = generateRecommendedChecklist(jobCountry, candidateNationality, { headcount: 50 });
      setChecklist(list.map(item => ({ ...item, selected: true })));
    }
  }, [isOpen, jobCountry, candidateNationality]);

  if (!isOpen) return null;

  const handleToggle = (id) => {
    setChecklist(prev => prev.map(item => item.documentMasterId === id ? { ...item, selected: !item.selected } : item));
  };

  const handleSend = async () => {
    const selectedItems = checklist.filter(c => c.selected);
    if (selectedItems.length === 0) return alert("Select at least one document to request.");
    setLoading(true);
    try {
      await sendDocumentRequest(job.id, candidate.uid, hrUid, selectedItems, hrNote, deadlineDays);
      onClose(true); // true indicates success
    } catch (e) {
      console.error(e);
      alert("Failed to send request.");
    }
    setLoading(false);
  };

  const S = {
    overlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
    },
    modal: {
      background: "#fff", width: "600px", maxWidth: "90%", maxHeight: "90vh",
      borderRadius: "24px", display: "flex", flexDirection: "column", overflow: "hidden",
      boxShadow: "0 24px 80px rgba(0,0,0,0.2)"
    },
    header: {
      padding: "24px", borderBottom: "1px solid #E2E8F0", display: "flex",
      justifyContent: "space-between", alignItems: "center"
    },
    title: { margin: 0, fontSize: "20px", fontWeight: 800, color: "#1D1D1F" },
    closeBtn: { background: "none", border: "none", cursor: "pointer", color: "#94A3B8" },
    body: { padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" },
    row: { display: "flex", gap: "16px" },
    field: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
    label: { fontSize: "12px", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" },
    select: { padding: "12px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none", fontWeight: 600, fontSize: "14px" },
    textarea: { padding: "12px", borderRadius: "12px", border: "1px solid #E2E8F0", outline: "none", minHeight: "80px", fontFamily: "inherit" },
    docCard: { border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px", display: "flex", gap: "16px" },
    smartNote: { background: "#FFFBEB", color: "#D97706", padding: "8px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, marginTop: "8px", display: "flex", alignItems: "flex-start", gap: "6px" },
    footer: { padding: "24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: "12px", background: "#F8FAFC" },
    cancelBtn: { padding: "12px 24px", borderRadius: "12px", fontWeight: 700, background: "#fff", border: "1px solid #E2E8F0", color: "#64748B", cursor: "pointer" },
    sendBtn: { padding: "12px 24px", borderRadius: "12px", fontWeight: 800, background: "#0055FF", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <h2 style={S.title}>Request Documents from {candidate?.name?.split(" ")[0]}</h2>
          <button style={S.closeBtn} onClick={() => onClose(false)}><X size={20} /></button>
        </div>

        <div style={S.body}>
          <div style={S.row}>
            <div style={S.field}>
              <label style={S.label}>Job Location (Country)</label>
              <select style={S.select} value={jobCountry} onChange={e => setJobCountry(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Candidate Nationality</label>
              <select style={S.select} value={candidateNationality} onChange={e => setCandidateNationality(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Recommended Checklist</label>
            {checklist.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "14px", fontWeight: 600, border: "1px dashed #E2E8F0", borderRadius: "12px" }}>
                No standard documents found for this combination.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {checklist.map(item => (
                  <div key={item.documentMasterId} style={{ ...S.docCard, borderColor: item.selected ? "#0055FF" : "#E2E8F0", background: item.selected ? "rgba(0,85,255,0.02)" : "#fff" }}>
                    <input 
                      type="checkbox" 
                      checked={item.selected} 
                      onChange={() => handleToggle(item.documentMasterId)}
                      style={{ width: "18px", height: "18px", accentColor: "#0055FF", marginTop: "4px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "#1D1D1F", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        {item.name}
                        {item.mandatory && <span style={{ background: "rgba(220,50,50,0.1)", color: "#E53E3E", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", textTransform: "uppercase" }}>Mandatory</span>}
                      </div>
                      <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 500, marginTop: "4px" }}>
                        Category: {item.category.replace("_", " ")}
                      </div>
                      {item.smartNote && (
                        <div style={S.smartNote}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          <span>{item.smartNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={S.row}>
            <div style={S.field}>
              <label style={S.label}>Deadline (Days)</label>
              <input type="number" min="1" max="90" style={S.select} value={deadlineDays} onChange={e => setDeadlineDays(Number(e.target.value))} />
            </div>
            <div style={{...S.field, flex: 2}}>
              <label style={S.label}>Personal Note to Candidate</label>
              <textarea 
                style={S.textarea} 
                placeholder="E.g., Welcome to the team! Please submit these for background verification."
                value={hrNote} onChange={e => setHrNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={S.footer}>
          <button style={S.cancelBtn} onClick={() => onClose(false)}>Cancel</button>
          <button style={{ ...S.sendBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : <><Send size={16} /> Send Request</>}
          </button>
        </div>
      </div>
    </div>
  );
}
