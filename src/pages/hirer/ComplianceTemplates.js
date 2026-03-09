// src/pages/hirer/ComplianceTemplates.js
// ═══════════════════════════════════════════════════════
//  UAE Compliance Templates — with PDF download (UAT fixes)
// ═══════════════════════════════════════════════════════

import React, { useState } from "react";
import { C } from "../shared/theme";
import { FileText, Briefcase, Send, ChevronRight, Shield, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";

const TEMPLATES = [
    {
        id: "offer_letter",
        title: "Standard Offer Letter (UAE)",
        icon: <Briefcase size={24} />,
        description: "Standard employment offer outlining designation, salary, benefits, and start date.",
        fields: [
            { id: "candidateName", label: "Candidate Full Name", type: "text" },
            { id: "designation", label: "Job Title / Designation", type: "text" },
            { id: "companyName", label: "Company Name", type: "text" },
            { id: "basicSalary", label: "Basic Salary (AED)", type: "number" },
            { id: "housingAllowance", label: "Housing Allowance (AED)", type: "number" },
            { id: "transportAllowance", label: "Transport Allowance (AED)", type: "number" },
            { id: "startDate", label: "Start Date", type: "date" },
            { id: "probation", label: "Probation Period (Months)", type: "number", default: "6" },
            { id: "noticePeriod", label: "Notice Period (Days)", type: "number", default: "30" },
        ],
        generate: (data) => {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("OFFER OF EMPLOYMENT", 105, 20, { align: "center" });
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            const today = new Date().toLocaleDateString("en-GB");
            doc.text(`Date: ${today}`, 20, 35);
            doc.text(`Dear ${data.candidateName || "[Candidate Name]"},`, 20, 50);
            doc.setFontSize(10);
            const bodyLines = [
                `We are pleased to offer you the position of ${data.designation || "[Designation]"} at`,
                `${data.companyName || "[Company Name]"}, subject to the terms and conditions set out below.`,
                "",
                `Compensation Package:`,
                `  - Basic Salary:             AED ${data.basicSalary || "0"} / month`,
                `  - Housing Allowance:         AED ${data.housingAllowance || "0"} / month`,
                `  - Transport Allowance:        AED ${data.transportAllowance || "0"} / month`,
                `  - Total:                     AED ${(+data.basicSalary || 0) + (+data.housingAllowance || 0) + (+data.transportAllowance || 0)} / month`,
                "",
                `Start Date: ${data.startDate || "[Start Date]"}`,
                `Probation Period: ${data.probation || "6"} months`,
                `Notice Period: ${data.noticePeriod || "30"} days`,
                "",
                `This offer is contingent upon your acceptance. Please sign and return.`,
                "",
                `We look forward to welcoming you to the team.`,
                "",
                `Sincerely,`,
                `HR Department — ${data.companyName || "[Company Name]"}`,
            ];
            doc.text(bodyLines, 20, 65, { lineHeightFactor: 1.6 });
            doc.line(20, 235, 90, 235);
            doc.text("Employer Signature & Date", 20, 242);
            doc.line(120, 235, 190, 235);
            doc.text("Candidate Signature & Date", 120, 242);
            return doc;
        }
    },
    {
        id: "nda",
        title: "Non-Disclosure Agreement (NDA)",
        icon: <Shield size={24} />,
        description: "Basic confidentiality agreement to protect company data before formal hiring.",
        fields: [
            { id: "candidateName", label: "Candidate Full Name", type: "text" },
            { id: "companyName", label: "Company Name", type: "text" },
            { id: "effectiveDate", label: "Effective Date", type: "date" },
        ],
        generate: (data) => {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("NON-DISCLOSURE AGREEMENT", 105, 20, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const lines = [
                `This Non-Disclosure Agreement ("Agreement") is entered into as of`,
                `${data.effectiveDate || "[Date]"}, between ${data.companyName || "[Company]"} ("Company")`,
                `and ${data.candidateName || "[Candidate]"} ("Recipient").`,
                "",
                `1. CONFIDENTIAL INFORMATION`,
                `The Recipient agrees to keep all proprietary business information, trade secrets,`,
                `technical data, and other confidential materials strictly confidential.`,
                "",
                `2. OBLIGATIONS`,
                `The Recipient shall not disclose any Confidential Information to third parties`,
                `without prior written consent from the Company.`,
                "",
                `3. TERM`,
                `This Agreement shall remain in effect for 2 years from the effective date.`,
                "",
                `4. GOVERNING LAW`,
                `This Agreement shall be governed by the laws of the United Arab Emirates.`,
            ];
            doc.text(lines, 20, 40, { lineHeightFactor: 1.6 });
            doc.line(20, 220, 90, 220);
            doc.text("Company Representative", 20, 227);
            doc.line(120, 220, 190, 220);
            doc.text("Recipient Signature", 120, 227);
            return doc;
        }
    },
    {
        id: "jd",
        title: "Job Description (MoHRE format)",
        icon: <FileText size={24} />,
        description: "Detailed breakdown of roles and responsibilities aligned with MoHRE contract structures.",
        fields: [
            { id: "jobTitle", label: "Job Title", type: "text" },
            { id: "companyName", label: "Company Name", type: "text" },
            { id: "reportsTo", label: "Reports To (Manager Title)", type: "text" },
            { id: "workingHours", label: "Working Hours / Days", type: "text", default: "9:00 AM - 6:00 PM, Mon-Fri" },
            { id: "keyResponsibilities", label: "Key Responsibilities", type: "textarea" },
        ],
        generate: (data) => {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("JOB DESCRIPTION", 105, 20, { align: "center" });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const header = [
                `Job Title:        ${data.jobTitle || "[Title]"}`,
                `Company:          ${data.companyName || "[Company]"}`,
                `Reports To:       ${data.reportsTo || "[Manager]"}`,
                `Working Hours:    ${data.workingHours || "9:00 AM - 6:00 PM, Mon-Fri"}`,
                "",
                `KEY RESPONSIBILITIES`,
                `―――――――――――――――――――――――――――――――――――――――――――――――――――――――`,
            ];
            doc.text(header, 20, 40, { lineHeightFactor: 1.6 });
            const responsibilityLines = doc.splitTextToSize(data.keyResponsibilities || "[Responsibilities]", 170);
            doc.text(responsibilityLines, 20, 115, { lineHeightFactor: 1.5 });
            return doc;
        }
    }
];


export default function ComplianceTemplates() {
    const { currentUser } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSelect = (tmpl) => {
        setSelectedTemplate(tmpl);
        setSuccess(false);
        const initialData = {};
        tmpl.fields.forEach(f => { initialData[f.id] = f.default || ""; });
        setFormData(initialData);
    };

    const handleChange = (e, fieldId) => {
        setFormData({ ...formData, [fieldId]: e.target.value });
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const pdfDoc = selectedTemplate.generate(formData);
            pdfDoc.save(`${selectedTemplate.id}_${Date.now()}.pdf`);
            setSuccess(true);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Failed to generate PDF. Please fill all fields.");
        }
        setGenerating(false);
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
        input: { width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", color: "#fff", outline: "none", fontFamily: C.font, boxSizing: "border-box" },
        btn: {
            width: "100%", background: C.blue, color: "#fff", border: "none", marginTop: 20,
            padding: "12px", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 14, transition: "opacity .2s"
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

                            {success && (
                                <div style={{ background: "rgba(0,200,100,.1)", border: "1px solid rgba(0,200,100,.3)", borderRadius: 8, padding: "10px 14px", color: "#00C864", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                    ✅ PDF downloaded successfully!
                                </div>
                            )}

                            <form onSubmit={handleGenerate}>
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

                                <button type="submit" disabled={generating} style={{ ...S.btn, opacity: generating ? 0.7 : 1 }}>
                                    {generating ? "Generating..." : <><Download size={16} /> Download PDF</>}
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
