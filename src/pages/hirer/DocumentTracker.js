// src/pages/hirer/DocumentTracker.js
// ═══════════════════════════════════════════════════════
//  Document Tracker — Hirer View (Ultra-Premium White) - Unified
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getHrTrackerUnifiedDocuments,
    verifyUnifiedDocument,
    rejectUnifiedDocument,
    sendDocumentRequest,
    generateRecommendedChecklist
} from "../../services/unifiedDocumentService";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { C } from "../shared/theme";
import { FileText, Clock, CheckCircle, Download, Shield, Briefcase, ChevronRight, UserPlus, FilePlus, Info } from "lucide-react";
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

export default function DocumentTracker() {
    const { currentUser } = useAuth();
    const [tab, setTab] = useState("tracker");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Compliance state
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(false);

    // New state for document request form
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [hrMessage, setHrMessage] = useState("");
    const [recommendedChecklist, setRecommendedChecklist] = useState([]);
    const [customDocName, setCustomDocName] = useState("");
    const [customDocMandatory, setCustomDocMandatory] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadRequests();
        }
    }, [currentUser]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const reqs = await getHrTrackerUnifiedDocuments(currentUser.uid);
            
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
            await verifyUnifiedDocument(docId);
            loadRequests(); 
        } catch (e) { console.error("Failed to verify document:", e); }
    }

    const handleReject = async (docId) => {
        const reason = prompt("Enter reason for rejection:");
        if (!reason) return;
        try {
            await rejectUnifiedDocument(docId, reason);
            loadRequests();
        } catch (e) { console.error("Failed to reject document:", e); }
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

    const handleRequestDocuments = async (candidateId, jobId) => {
        setSelectedCandidateId(candidateId);
        setSelectedJobId(jobId || "");
        // Defaulting to India for demonstration in recommended checklist
        setRecommendedChecklist(generateRecommendedChecklist("IN", "IN", {})); 
        setShowRequestForm(true);
    };

    const handleSendRequest = async () => {
        if (!selectedCandidateId || (recommendedChecklist.length === 0 && !customDocName)) {
            alert("Please select a candidate and at least one document.");
            return;
        }

        const documentsToRequest = [...recommendedChecklist];
        if (customDocName) {
            documentsToRequest.push({
                documentMasterId: `custom_${Date.now()}`,
                name: customDocName,
                category: "Custom",
                mandatory: customDocMandatory,
                status: "not_started",
                smartNote: null
            });
        }

        try {
            await sendDocumentRequest(selectedJobId, selectedCandidateId, currentUser.uid, documentsToRequest, hrMessage);
            alert("Document request sent successfully!");
            setShowRequestForm(false);
            setCustomDocName("");
            setCustomDocMandatory(false);
            setHrMessage("");
            loadRequests();
        } catch (e) {
            console.error("Failed to send document request:", e);
            alert("Failed to send document request.");
        }
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
            transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
        }),

        card: {
            background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0",
            padding: "24px 32px", marginBottom: "16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
        },
        left: { display: "flex", alignItems: "center", gap: "20px" },
        icon: (fulfilled) => ({
            width: "52px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
            background: fulfilled ? "rgba(0,180,100,0.06)" : "rgba(245,166,35,0.06)",
            color: fulfilled ? "#00B464" : "#F5A623",
            border: `1px solid ${fulfilled ? "rgba(0,180,100,0.1)" : "rgba(245,166,35,0.1)"}`
        }),
        downloadBtn: {
            background: "#1D1D1F", color: "#fff", border: "none", padding: "10px 20px",
            borderRadius: "12px", fontSize: "12px", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px"
        },
        tmplCard: (active) => ({
            background: active ? "rgba(0,85,255,0.04)" : "#fff",
            border: `1px solid ${active ? "#0055FF" : "#E2E8F0"}`,
            borderRadius: "24px", padding: "24px", cursor: "pointer",
            transition: "all 0.3s", display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "16px"
        }),
        formGroup: { marginBottom: "20px" },
        label: { display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase" },
        input: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", fontWeight: 600 },
        btn: {
            background: "#1D1D1F", color: "#fff", border: "none",
            padding: "14px 24px", borderRadius: "12px", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            fontSize: "13px", textTransform: "uppercase"
        },
        modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
        modalContent: { background: "#fff", borderRadius: "32px", padding: "40px", width: "500px", maxHeight: "90vh", overflowY: "auto" }
    };

    return (
        <div style={S.container}>
            <div style={S.header}>
                <h1 style={S.title}>Document Hub</h1>
                <div style={S.tabBar}>
                    <button style={S.tabBtn(tab === "tracker")} onClick={() => setTab("tracker")}>
                        <FileText size={20} /> Document Tracker
                    </button>
                    <button style={S.tabBtn(tab === "compliance")} onClick={() => setTab("compliance")}>
                        <Shield size={20} /> Compliance Templates
                    </button>
                </div>
            </div>

            {tab === "tracker" && (
                <div>
                    {loading ? (
                        <p>Loading document requests...</p>
                    ) : requests.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "100px" }}>
                            <FileText size={48} color="#E2E8F0" />
                            <p style={{ marginTop: "20px", color: "#94A3B8", fontWeight: 700 }}>No document requests yet.</p>
                        </div>
                    ) : (
                        <div>
                            {requests.map(group => (
                                <div key={group.candidateId} style={{ marginBottom: "40px" }}>
                                    <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <UserPlus size={24} /> {group.candidateName}
                                        <button 
                                            onClick={() => handleRequestDocuments(group.candidateId, "")}
                                            style={{ ...S.btn, width: "auto", padding: "8px 16px", fontSize: "11px", borderRadius: "10px", marginLeft: "20px" }}
                                        >
                                            <FilePlus size={16} /> Request More Docs
                                        </button>
                                    </h2>
                                    {group.docs.map(req => (
                                        <div key={req.id} style={S.card}>
                                            <div style={S.left}>
                                                <div style={S.icon(req.status === "verified" || req.status === "uploaded")}>
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{req.name}</div>
                                                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>Status: {req.status}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                                {req.uploadedFileUrl && (
                                                    <a href={req.uploadedFileUrl} target="_blank" rel="noopener noreferrer" style={S.downloadBtn}>
                                                        <Download size={18} /> View File
                                                    </a>
                                                )}
                                                {req.status === "uploaded" && (
                                                    <>
                                                        <button onClick={() => handleVerify(req.id)} style={{ ...S.btn, background: "#00B464" }}>Verify</button>
                                                        <button onClick={() => handleReject(req.id)} style={{ ...S.btn, background: "#EF4444" }}>Reject</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === "compliance" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                    <div>
                        {TEMPLATES.map(tmpl => (
                            <div key={tmpl.id} style={S.tmplCard(selectedTemplate?.id === tmpl.id)} onClick={() => handleSelectTemplate(tmpl)}>
                                <div style={{ background: "#F1F5F9", padding: "12px", borderRadius: "12px" }}>{tmpl.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 800 }}>{tmpl.title}</div>
                                    <div style={{ fontSize: "12px", color: "#94A3B8" }}>{tmpl.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {selectedTemplate && (
                        <div style={S.card}>
                            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>Generate {selectedTemplate.title}</h2>
                            <form onSubmit={handleGenerate}>
                                {selectedTemplate.fields.map(field => (
                                    <div key={field.id} style={S.formGroup}>
                                        <label style={S.label}>{field.label}</label>
                                        <input type={field.type} style={S.input} value={formData[field.id] || ""} onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })} required />
                                    </div>
                                ))}
                                <button type="submit" style={S.btn} disabled={generating}>
                                    {generating ? "Generating..." : "Download PDF"}
                                </button>
                                {success && <p style={{ color: "#00B464", marginTop: "10px" }}>Generated successfully!</p>}
                            </form>
                        </div>
                    )}
                </div>
            )}

            {showRequestForm && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <h2 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "24px" }}>Request Documents</h2>
                        <div style={S.formGroup}>
                            <label style={S.label}>Job ID (Optional)</label>
                            <input type="text" style={S.input} value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} />
                        </div>
                        
                        <h3 style={{ fontSize: "16px", fontWeight: 800, marginTop: "20px" }}>Checklist</h3>
                        {recommendedChecklist.map((item, index) => (
                            <div key={index} style={{ display: "flex", alignItems: "center", margin: "8px 0" }}>
                                <input type="checkbox" checked readOnly style={{ marginRight: "10px" }} />
                                <label>{item.name} {item.mandatory && "(Required)"}</label>
                            </div>
                        ))}

                        <div style={{ marginTop: "20px" }}>
                            <label style={S.label}>Custom Document</label>
                            <input type="text" style={S.input} value={customDocName} onChange={e => setCustomDocName(e.target.value)} placeholder="e.g. Health Certificate" />
                            <div style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
                                <input type="checkbox" checked={customDocMandatory} onChange={e => setCustomDocMandatory(e.target.checked)} style={{ marginRight: "8px" }} />
                                <label style={{ fontSize: "12px" }}>Mark as Mandatory</label>
                            </div>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                            <label style={S.label}>HR Message</label>
                            <textarea style={{ ...S.input, minHeight: "80px" }} value={hrMessage} onChange={e => setHrMessage(e.target.value)} />
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
                            <button onClick={handleSendRequest} style={{ ...S.btn, flex: 1 }}>Send Request</button>
                            <button onClick={() => setShowRequestForm(false)} style={{ ...S.btn, background: "#E2E8F0", color: "#000", flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
