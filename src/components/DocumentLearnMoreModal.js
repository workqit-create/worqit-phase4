import React from "react";
import { X, ExternalLink, Clock, CreditCard, Info } from "lucide-react";
import { documentMasterData } from "../../data/documentMasterData";

export default function DocumentLearnMoreModal({ masterId, isOpen, onClose }) {
  if (!isOpen || !masterId) return null;

  const docData = documentMasterData.find(d => d.id === masterId);
  if (!docData) return null;

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
    body: { padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" },
    section: { display: "flex", flexDirection: "column", gap: "8px" },
    sectionTitle: { fontSize: "14px", fontWeight: 800, color: "#1D1D1F", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px" },
    text: { fontSize: "14px", color: "#64748B", lineHeight: 1.6, fontWeight: 500 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    card: { background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "16px", borderRadius: "16px" },
    cardLabel: { fontSize: "11px", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" },
    cardValue: { fontSize: "14px", fontWeight: 700, color: "#1D1D1F" },
    pill: { background: "rgba(0,85,255,0.08)", color: "#0055FF", padding: "4px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 800, width: "fit-content", textTransform: "uppercase" }
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={S.pill}>{docData.country_name} Compliance</div>
            <h2 style={S.title}>{docData.name}</h2>
          </div>
          <button style={S.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div style={S.body}>
          <div style={S.section}>
            <div style={S.sectionTitle}><Info size={16} color="#0055FF" /> What is it?</div>
            <div style={S.text}>{docData.what_is_it}</div>
            <div style={S.text}><strong>Purpose:</strong> {docData.purpose}</div>
          </div>

          <div style={S.grid}>
            <div style={S.card}>
              <div style={S.cardLabel}><Clock size={12} /> Processing Time</div>
              <div style={S.cardValue}>{docData.processing_time}</div>
            </div>
            <div style={S.card}>
              <div style={S.cardLabel}><CreditCard size={12} /> Expected Cost</div>
              <div style={S.cardValue}>{docData.cost}</div>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>How to Obtain It</div>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#64748B", fontSize: "14px", lineHeight: 1.6, fontWeight: 500 }}>
              {docData.how_to_apply.map((step, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>{step}</li>
              ))}
            </ul>
          </div>

          {docData.required_docs_to_apply.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Required to Apply</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {docData.required_docs_to_apply.map((req, i) => (
                  <div key={i} style={{ background: "#F1F5F9", color: "#475569", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>{req}</div>
                ))}
              </div>
            </div>
          )}

          {docData.official_link !== "N/A — home country government" && (
            <div style={{ ...S.section, marginTop: "8px" }}>
              <a href={docData.official_link} target="_blank" rel="noopener noreferrer" style={{ ...S.sectionTitle, color: "#0055FF", textDecoration: "none" }}>
                Official Government Portal <ExternalLink size={14} />
              </a>
            </div>
          )}

          <div style={{ background: "#FFFBEB", border: "1px solid #FE8D59", padding: "16px", borderRadius: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#D97706", textTransform: "uppercase", marginBottom: "4px" }}>Pro Tip</div>
            <div style={{ fontSize: "13px", color: "#B45309", lineHeight: 1.5, fontWeight: 500 }}>{docData.tip}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
