// src/pages/hirer/ComplianceTemplates.js
// ═══════════════════════════════════════════════════════
//  UAE Compliance Templates (Phase 7)
// ═══════════════════════════════════════════════════════

import React, { useState } from "react";
import { C } from "../shared/theme";
import { FileText, Users, Briefcase, Send, ChevronRight, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const TEMPLATES = [
    {
        id: "offer_letter",
        title: "Standard Offer Letter (UAE)",
        icon: <Briefcase size={24} />,
        description: "Standard employment offer outlining designation, salary, benefits, and start date.",
        fields: [
            { id: "candidateName", label: "Candidate Full Name", type: "text" },
            { id: "designation", label: "Job Title / Designation", type: "text" },
            { id: "basicSalary", label: "Basic Salary (AED)", type: "number" },
            { id: "housingAllowance", label: "Housing Allowance (AED)", type: "number" },
            { id: "transportAllowance", label: "Transport Allowance (AED)", type: "number" },
            { id: "probation", label: "Probation Period (Months)", type: "number", default: "6" },
            { id: "noticePeriod", label: "Notice Period (Days)", type: "number", default: "30" },
        ]
    },
    {
        id: "nda",
        title: "Non-Disclosure Agreement (NDA)",
        icon: <Shield size={24} />,
        description: "Basic confidentiality agreement to protect company data before formal hiring.",
        fields: [
            { id: "candidateName", label: "Candidate Full Name", type: "text" },
            { id: "effectiveDate", label: "Effective Date", type: "date" },
        ]
    },
    {
        id: "jd",
        title: "Job Description (MoHRE format)",
        icon: <FileText size={24} />,
        description: "Detailed breakdown of roles and responsibilities aligned with MoHRE contract structures.",
        fields: [
            { id: "jobTitle", label: "Job Title", type: "text" },
            { id: "reportsTo", label: "Reports To (Manager Title)", type: "text" },
            { id: "workingHours", label: "Working Hours / Days", type: "text", default: "9:00 AM - 6:00 PM, Mon-Fri" },
            { id: "keyResponsibilities", label: "Key Responsibilities", type: "textarea" },
        ]
    }
];


export default function ComplianceTemplates() {
    const { currentUser } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [sending, setSending] = useState(false);

    const handleSelect = (tmpl) => {
        setSelectedTemplate(tmpl);
        const initialData = {};
        tmpl.fields.forEach(f => { initialData[f.id] = f.default || ""; });
        setFormData(initialData);
    };

    const handleChange = (e, fieldId) => {
        setFormData({ ...formData, [fieldId]: e.target.value });
    };

    const handleSend = (e) => {
        e.preventDefault();
        setSending(true);
        // In a full implementation, this would:
        // 1. Generate a PDF using a library like jspdf or html2pdf
        // 2. Upload to Firebase Storage
        // 3. Send a message to a specific candidate with the document link

        setTimeout(() => {
            alert(`The ${selectedTemplate.title} has been generated. (Note: Sending implementation requires candidate selection which connects to the messaging system).`);
            setSending(false);
            setSelectedTemplate(null);
        }, 1500);
    };

    const S = {
        container: { padding: "30px 40px", color: "#fff", fontFamily: C.font, maxWidth: 1000, margin: "0 auto" },
        header: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
        sub: { color: C.silver, fontSize: 15, marginBottom: 30 },

        grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 },
        list: { display: "flex", flexDirection: "column", gap: 16 },

        card: (active) => ({
            background: active ? "rgba(26,111,232,.1)" : C.ink2,
            border: active ? `1px solid ${C.blue}` : `1px solid ${C.line}`,
            borderRadius: 12, padding: 20, cursor: "pointer",
            transition: "all .2s", display: "flex", alignItems: "flex-start", gap: 16
        }),
        iconWrap: { width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", color: C.silver, flexShrink: 0 },
        title: { fontSize: 16, fontWeight: 600, marginBottom: 6, color: "#fff" },
        desc: { fontSize: 13, color: C.silver, lineHeight: 1.4 },

        formPanel: { background: C.ink2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 24 },
        formTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20, borderBottom: `1px solid ${C.line}`, paddingBottom: 16 },

        formGroup: { marginBottom: 16 },
        label: { display: "block", fontSize: 13, color: C.silver, marginBottom: 6, fontWeight: 600 },
        input: { width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", color: "#fff", outline: "none", fontFamily: C.font },

        btn: {
            width: "100%", background: C.blue, color: "#fff", border: "none", marginTop: 20,
            padding: "12px", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }
    };

    return (
        <div style={S.container}>
            <h1 style={S.header}>Compliance Templates</h1>
            <p style={S.sub}>Standardized forms and documents to streamline your hiring process.</p>

            <div style={S.grid}>

                {/* Template List */}
                <div style={S.list}>
                    {TEMPLATES.map(tmpl => (
                        <div key={tmpl.id} style={S.card(selectedTemplate?.id === tmpl.id)} onClick={() => handleSelect(tmpl)}>
                            <div style={{ ...S.iconWrap, color: selectedTemplate?.id === tmpl.id ? C.blue : C.silver }}>
                                {tmpl.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={S.title}>{tmpl.title}</div>
                                <div style={S.desc}>{tmpl.description}</div>
                            </div>
                            <ChevronRight size={20} color={C.silver} style={{ alignSelf: "center" }} />
                        </div>
                    ))}
                </div>

                {/* Form Panel */}
                <div>
                    {selectedTemplate ? (
                        <div style={S.formPanel}>
                            <div style={S.formTitle}>Draft: {selectedTemplate.title}</div>

                            <form onSubmit={handleSend}>
                                {selectedTemplate.fields.map(f => (
                                    <div key={f.id} style={S.formGroup}>
                                        <label style={S.label}>{f.label}</label>
                                        {f.type === "textarea" ? (
                                            <textarea
                                                style={{ ...S.input, minHeight: 100, resize: "vertical" }}
                                                value={formData[f.id]}
                                                onChange={(e) => handleChange(e, f.id)}
                                                required
                                            />
                                        ) : (
                                            <input
                                                type={f.type}
                                                style={S.input}
                                                value={formData[f.id]}
                                                onChange={(e) => handleChange(e, f.id)}
                                                required
                                            />
                                        )}
                                    </div>
                                ))}

                                <button type="submit" disabled={sending} style={{ ...S.btn, opacity: sending ? 0.7 : 1 }}>
                                    {sending ? "Generating..." : <><Send size={18} /> Generate Document</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.silver, border: `2px dashed ${C.line}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                            <div>Select a template from the left to start drafting.</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
