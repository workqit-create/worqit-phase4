// src/pages/hirer/DocumentTracker.js
// ═══════════════════════════════════════════════════════
//  Document Tracker — Hirer View (Ultra-Premium White)
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getHrTrackerDocuments, verifyCandidateDocument, rejectCandidateDocument } from "../../services/documentRequestService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { C } from "../shared/theme";
import { FileText, Clock, CheckCircle, Download, Shield, Briefcase, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";

const TEMPLATES = [
    {
        id: "offer_letter",
        title: "Standard Offer Letter (UAE)",
        icon: <Briefcase size={24} />,
        description: "Strategic employment offer outlining designation, compensation, and MoHRE terms.",
        fields: [
            { id: "candidateName", label: "Candidate Full Name", type: "text" },
            { id: "designation", label: "Job Title / Designation", type: "text" },
            { id: "companyName", label: "Organization Name", type: "text" },
            { id: "basicSalary", label: "Basic Salary (AED)", type: "number" },
            { id: "housingAllowance", label: "Housing Allowance (AED)", type: "number" },
            { id: "transportAllowance", label: "Transport Allowance (AED)", type: "number" },
            { id: "startDate", label: "Engagement Start Date", type: "date" },
            { id: "probation", label: "Probation Cycle (Months)", type: "number", default: "6" },
            { id: "noticePeriod", label: "Notice Window (Days)", type: "number", default: "30" },
        ],
        generate: (data) => {
            const doc = new jsPDF();
            doc.setFontSize(18); doc.setFont("helvetica", "bold");
            doc.text("OFFER OF EMPLOYMENT", 105, 20, { align: "center" });
            doc.setFontSize(11); doc.setFont("helvetica", "normal");
            const today = new Date().toLocaleDateString("en-GB");
            doc.text(`Date: ${today}`, 20, 35);
            doc.text(`Dear ${data.candidateName || "[Candidate Name]"},`, 20, 50);
            doc.setFontSize(10);
            const bodyLines = [
                `We are pleased to offer you the position of ${data.designation || "[Designation]"} at`,
                `${data.companyName || "[Company Name]"}, subject to the terms and conditions set out below.`,
                "",
                `Strategic Package:`,
                `  - Basic Salary:             AED ${data.basicSalary || "0"} / month`,
                `  - Housing Allowance:         AED ${data.housingAllowance || "0"} / month`,
                `  - Transport Allowance:        AED ${data.transportAllowance || "0"} / month`,
                `  - Total:                     AED ${(+data.basicSalary || 0) + (+data.housingAllowance || 0) + (+data.transportAllowance || 0)} / month`,
                "",
                `Start Date: ${data.startDate || "[Start Date]"}`,
                `Probation Period: ${data.probation || "6"} months`,
                `Notice Period: ${data.noticePeriod || "30"} days`,
                "",
                `This offer is contingent upon your acceptance and successful verification.`,
                "",
                `Sincerely,`,
                `Talent Acquisition — ${data.companyName || "[Company Name]"}`,
            ];
            doc.text(bodyLines, 20, 65, { lineHeightFactor: 1.6 });
            doc.line(20, 235, 90, 235); doc.text("Authorized Signatory", 20, 242);
            doc.line(120, 235, 190, 235); doc.text("Candidate Signature", 120, 242);
            return doc;
        }
    },
    {
        id: "nda",
        title: "Non-Disclosure Agreement (NDA)",
        icon: <Shield size={24} />,
        description: "Elite confidentiality agreement to protect strategic data before formal engagement.",
        fields: [
            { id: "candidateName", label: "Recipient Full Name", type: "text" },
            { id: "companyName", label: "Disclosing Organization", type: "text" },
            { id: "effectiveDate", label: "Effective Date", type: "date" },
        ],
        generate: (data) => {
            const doc = new jsPDF();
            doc.setFontSize(18); doc.setFont("helvetica", "bold");
            doc.text("NON-DISCLOSURE AGREEMENT", 105, 20, { align: "center" });
            doc.setFontSize(10); doc.setFont("helvetica", "normal");
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
                `3. GOVERNING LAW`,
                `This Agreement shall be governed by the laws of the United Arab Emirates.`,
            ];
            doc.text(lines, 20, 40, { lineHeightFactor: 1.6 });
            doc.line(20, 220, 90, 220); doc.text("Organization Representative", 20, 227);
            doc.line(120, 220, 190, 220); doc.text("Recipient Signature", 120, 227);
            return doc;
        }
    }
];

export default function DocumentHub() {
    const { currentUser } = useAuth();
    const [tab, setTab] = useState("tracker");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Compliance state
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadRequests();
        }
    }, [currentUser]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const reqs = await getHrTrackerDocuments(currentUser.uid);
            
            const grouped = {};
            for (let r of reqs) {
                if (!grouped[r.candidateId]) {
                    const candSnap = await getDoc(doc(db, "users", r.candidateId));
                    let cname = candSnap.exists() ? candSnap.data().name : "Unknown Candidate";
                    grouped[r.candidateId] = { candidateName: cname, candidateId: r.candidateId, docs: [] };
                }
                grouped[r.candidateId].docs.push(r);
            }
            setRequests(Object.values(grouped));
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleVerify = async (docId) => {
        try {
            await verifyCandidateDocument(docId);
            loadRequests(); 
        } catch (e) {}
    }

    const handleReject = async (docId) => {
        const reason = prompt("Enter reason for rejection:");
        if (!reason) return;
        try {
            await rejectCandidateDocument(docId, reason);
            loadRequests();
        } catch (e) {}
    }

    const handleSelectTemplate = (tmpl) => {
        setSelectedTemplate(tmpl);
        setSuccess(false);
        const initialData = {};
        tmpl.fields.forEach(f => { initialData[f.id] = f.default || ""; });
        setFormData(initialData);
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const pdfDoc = selectedTemplate.generate(formData);
            pdfDoc.save(`${selectedTemplate.id}_${Date.now()}.pdf`);
            setSuccess(true);
        } catch (err) { alert("Failed to generate PDF."); }
        setGenerating(false);
    };

    const S = {
        container: { maxWidth: "1200px", margin: "0 auto", fontFamily: C.font },
        header: { marginBottom: "48px" },
        title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "16px" },
        
        tabBar: { display: "flex", gap: "12px", marginBottom: "40px", padding: "6px", background: "#F1F5F9", borderRadius: "20px", width: "fit-content" },
        tabBtn: (active) => ({
            padding: "12px 24px", borderRadius: "14px", border: "none",
            background: active ? "#fff" : "transparent",
            color: active ? "#0055FF" : "#64748B",
            fontWeight: 800, fontSize: "13px", cursor: "pointer",
            boxShadow: active ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
            transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
        }),

        card: {
            background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0",
            padding: "24px 32px", marginBottom: "16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
            transition: "all 0.3s ease"
        },
        left: { display: "flex", alignItems: "center", gap: "20px" },
        icon: (fulfilled) => ({
            width: "52px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
            background: fulfilled ? "rgba(0,180,100,0.06)" : "rgba(245,166,35,0.06)",
            color: fulfilled ? "#00B464" : "#F5A623",
            border: `1px solid ${fulfilled ? "rgba(0,180,100,0.1)" : "rgba(245,166,35,0.1)"}`
        }),
        docType: { fontSize: "16px", fontWeight: 800, color: "#1D1D1F", marginBottom: "4px" },
        meta: { fontSize: "13px", color: "#94A3B8", fontWeight: 600 },
        statusBadge: (fulfilled) => ({
            padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: 900,
            textTransform: "uppercase", letterSpacing: "1px",
            background: fulfilled ? "rgba(0,180,100,0.08)" : "rgba(245,166,35,0.08)",
            color: fulfilled ? "#00B464" : "#F5A623",
            border: `1px solid ${fulfilled ? "rgba(0,180,100,0.15)" : "rgba(245,166,35,0.15)"}`
        }),
        downloadBtn: {
            background: "#1D1D1F", color: "#fff", border: "none", padding: "10px 20px",
            borderRadius: "12px", fontSize: "12px", fontWeight: 800, cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "8px",
            transition: "all 0.2s", boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
        },
        empty: {
            textAlign: "center", padding: "120px 40px", background: "#fff", borderRadius: "32px",
            border: "1px dashed #E2E8F0"
        },

        // Compliance styles
        complianceGrid: { display: "grid", gridTemplateColumns: "400px 1fr", gap: "48px" },
        tmplCard: (active) => ({
            background: active ? "rgba(0,85,255,0.04)" : "#fff",
            border: `1px solid ${active ? "#0055FF" : "#E2E8F0"}`,
            borderRadius: "24px", padding: "24px", cursor: "pointer",
            transition: "all 0.3s", display: "flex", alignItems: "flex-start", gap: "20px",
            marginBottom: "16px", boxShadow: active ? "0 12px 24px -8px rgba(0,85,255,0.1)" : "0 4px 12px rgba(0,0,0,0.02)"
        }),
        iconWrap: (active) => ({
            width: "52px", height: "52px", borderRadius: "16px",
            background: active ? "#0055FF" : "#F1F5F9",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: active ? "#fff" : "#94A3B8", flexShrink: 0, transition: "all 0.3s"
        }),
        tmplTitle: { fontSize: "16px", fontWeight: 800, color: "#1D1D1F", marginBottom: "6px" },
        tmplDesc: { fontSize: "13px", color: "#94A3B8", lineHeight: 1.5, fontWeight: 500 },
        formPanel: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: "32px", padding: "40px", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" },
        formTitle: { fontSize: "20px", fontWeight: 900, marginBottom: "32px", color: "#1D1D1F", borderBottom: "1px solid #F1F5F9", paddingBottom: "20px" },
        input: {
            width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px",
            padding: "12px 16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s",
            boxSizing: "border-box", fontWeight: 600
        },
        label: { display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
        btn: {
            width: "100%", background: "#1D1D1F", color: "#fff", border: "none", marginTop: "32px",
            padding: "18px", borderRadius: "16px", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            fontSize: "13px", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "1.5px"
        }
    };

    return (
        <div style={S.container}>
            <div style={S.header}>
                <h1 style={S.title}>Document Hub</h1>
                <div style={S.tabBar}>
                    <button onClick={() => setTab("tracker")} style={S.tabBtn(tab === "tracker")}>
                        <FileText size={18} /> Vault Tracker
                    </button>
                    <button onClick={() => setTab("compliance")} style={S.tabBtn(tab === "compliance")}>
                        <Shield size={18} /> Compliance Templates
                    </button>
                </div>
            </div>

            {tab === "tracker" && (
                <>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ height: "100px", background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", opacity: 0.5 }} />)}
                        </div>
                    ) : requests.length === 0 ? (
                        <div style={S.empty}>
                            <FileText size={64} color="#E2E8F0" style={{ marginBottom: "24px" }} />
                            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1D1D1F", margin: "0 0 8px" }}>No active requests</h3>
                            <p style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500 }}>Request documents directly from the message interface.</p>
                        </div>
                    ) : (
                        requests.map(group => (
                            <div key={group.candidateId} style={{ ...S.card, flexDirection: "column", alignItems: "stretch", padding: "32px" }}>
                                <div style={{ fontSize: "18px", fontWeight: 800, color: "#1D1D1F", marginBottom: "20px", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px" }}>
                                    Candidate: {group.candidateName}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {group.docs.map(docItem => {
                                        const isUploaded = docItem.status === "uploaded";
                                        const isVerified = docItem.status === "verified";
                                        const isRejected = docItem.status === "rejected";
                                        
                                        return (
                                            <div key={docItem.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#F8FAFC", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                    <div style={S.icon(isVerified)}>
                                                        {isVerified ? <CheckCircle size={20} /> : (isRejected ? <Shield size={20} color="#E53E3E" /> : <Clock size={20} />)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#1D1D1F" }}>{docItem.name}</div>
                                                        <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, marginTop: "4px", textTransform: "uppercase" }}>
                                                            STATUS: <span style={{ color: isVerified ? "#00B464" : (isRejected ? "#E53E3E" : (isUploaded ? "#0055FF" : "#F5A623")) }}>{docItem.status.replace("_", " ")}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    {docItem.uploadedFileUrl && (
                                                        <a href={docItem.uploadedFileUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                                            <button style={{ ...S.downloadBtn, background: "#fff", color: "#1D1D1F", border: "1px solid #E2E8F0", boxShadow: "none" }}>View File</button>
                                                        </a>
                                                    )}
                                                    {isUploaded && (
                                                        <>
                                                            <button onClick={() => handleVerify(docItem.id)} style={{ ...S.downloadBtn, background: "rgba(0,180,100,0.1)", color: "#00B464", boxShadow: "none" }}>Verify</button>
                                                            <button onClick={() => handleReject(docItem.id)} style={{ ...S.downloadBtn, background: "rgba(229,62,62,0.1)", color: "#E53E3E", boxShadow: "none" }}>Reject</button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {tab === "compliance" && (
                <div style={S.complianceGrid}>
                    <div>
                        {TEMPLATES.map(tmpl => (
                            <div key={tmpl.id} style={S.tmplCard(selectedTemplate?.id === tmpl.id)} onClick={() => handleSelectTemplate(tmpl)}>
                                <div style={S.iconWrap(selectedTemplate?.id === tmpl.id)}>{tmpl.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={S.tmplTitle}>{tmpl.title}</div>
                                    <div style={S.tmplDesc}>{tmpl.description}</div>
                                </div>
                                <ChevronRight size={20} color={selectedTemplate?.id === tmpl.id ? "#0055FF" : "#CBD5E1"} style={{ alignSelf: "center" }} />
                            </div>
                        ))}
                    </div>

                    <div>
                        {selectedTemplate ? (
                            <div style={S.formPanel}>
                                <div style={S.formTitle}>Strategic Draft: {selectedTemplate.title}</div>
                                {success && (
                                    <div style={{ background: "rgba(0,180,100,0.05)", border: "1px solid rgba(0,180,100,0.1)", borderRadius: "12px", padding: "16px", color: "#00B464", fontSize: "14px", fontWeight: 700, marginBottom: "24px" }}>
                                        ✅ Deployment Successful: PDF generated and downloaded.
                                    </div>
                                )}
                                <form onSubmit={handleGenerate}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {selectedTemplate.fields.map(f => (
                                            <div key={f.id}>
                                                <label style={S.label}>{f.label}</label>
                                                <input type={f.type} style={S.input} value={formData[f.id]} onChange={(e) => setFormData({...formData, [f.id]: e.target.value})} required />
                                            </div>
                                        ))}
                                    </div>
                                    <button type="submit" disabled={generating} style={S.btn}>
                                        {generating ? "Deploying..." : <><Download size={18} /> Download Strategic PDF</>}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.5)", border: "2px dashed #E2E8F0", borderRadius: "32px", padding: "64px", textAlign: "center" }}>
                                <FileText size={64} color="#E2E8F0" style={{ marginBottom: "24px" }} />
                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#94A3B8" }}>Select a strategic template to begin.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

