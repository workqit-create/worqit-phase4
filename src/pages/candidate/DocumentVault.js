// src/pages/candidate/DocumentVault.js
// ═══════════════════════════════════════════════════════
//  Document Hub — Candidate View (Phase 7)
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Clock, Eye, EyeOff, ShieldAlert, DownloadCloud, UploadCloud, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import {
    uploadCandidateDocument,
    getCandidateDocuments,
    deleteCandidateDocument,
    updateDocumentMetadata,
    getDocumentRequests,
    fulfillDocumentRequest
} from "../../services/documentService";
import { getCandidateDocuments as getChecklistDocuments, uploadCandidateDocument as uploadChecklistDocument } from "../../services/documentRequestService";
import DocumentLearnMoreModal from "../../components/DocumentLearnMoreModal";
import { updateProfile } from "../../services/profileService";

export default function DocumentVault() {
    const { currentUser, userProfile, refreshProfile } = useAuth();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");

    const [documents, setDocuments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [infoModalMasterId, setInfoModalMasterId] = useState(null);
    const [uploadModalReqId, setUploadModalReqId] = useState(null);
    const [reqFile, setReqFile] = useState(null);
    const [reqNote, setReqNote] = useState("");

    // Upload form state
    const [file, setFile] = useState(null);
    const [docCategory, setDocCategory] = useState("Resume");
    const [visibility, setVisibility] = useState("private");
    const [expiryDate, setExpiryDate] = useState("");

    const categories = ["Resume", "Passport", "Visa", "Emirates ID", "Educational Certificate", "NOC", "Other"];

    useEffect(() => {
        if (currentUser && isUnlocked) {
            loadDocuments();
        }
    }, [currentUser, isUnlocked]);

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (!userProfile?.vaultPin) {
            if (pinInput.length < 4) { setPinError("PIN must be at least 4 chars"); return; }
            try {
                await updateProfile(currentUser.uid, { vaultPin: pinInput });
                await refreshProfile();
                setIsUnlocked(true);
            } catch {
                setPinError("Failed to set PIN");
            }
        } else {
            if (pinInput === userProfile.vaultPin) {
                setIsUnlocked(true);
                setPinError("");
            } else {
                setPinError("Incorrect PIN");
            }
        }
    };

    const loadDocuments = async () => {
        setLoading(true);
        try {
            console.log("Loading documents for:", currentUser.uid);
            const [docs, checklistItems] = await Promise.all([
                getCandidateDocuments(currentUser.uid),
                getChecklistDocuments(currentUser.uid)
            ]);
            
            console.log("Personal Vault Docs:", docs.length);
            console.log("Checklist Items found:", checklistItems.length);

            setDocuments(docs || []);
            
            // Safe sort: handle Firestore timestamps or nulls
            const sortedRequests = (checklistItems || []).sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            
            setRequests(sortedRequests);
        } catch (e) {
            console.error("Error loading documents:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFulfillRequest = async (requestId, docId, hirerId) => {
        try {
            await fulfillDocumentRequest(requestId, docId, currentUser.uid, hirerId);
            setRequests(requests.filter(r => r.id !== requestId));
            alert("Document shared successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to fulfill request.");
        }
    };

    const handleChecklistUploadSubmit = async (reqId) => {
        if (!reqFile) return alert("Select a file first");
        setUploading(true);
        try {
            await uploadChecklistDocument(reqId, reqFile, reqNote);
            setUploadModalReqId(null);
            setReqFile(null);
            setReqNote("");
            alert("Checklist document uploaded successfully!");
            loadDocuments();
        } catch (e) { console.error(e); alert("Failed to upload document."); }
        setUploading(false);
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            if (selected.size > 10 * 1024 * 1024) { // 10MB limit
                alert("File size must be under 10MB");
                return;
            }
            setFile(selected);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            const metadata = {
                docCategory: docCategory || "Other",
                visibility: visibility || "private"
            };
            if (expiryDate) {
                metadata.expiryDate = new Date(expiryDate).toISOString();
            }

            await uploadCandidateDocument(file, currentUser.uid, metadata);
            setFile(null);
            setExpiryDate("");
            await loadDocuments(); // Refresh list
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Make sure Firebase Storage is enabled in your Firebase Console and rules are correct.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId, storagePath) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await deleteCandidateDocument(docId, storagePath);
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (e) {
            console.error("Delete failed:", e);
            alert("Failed to delete document.");
        }
    };

    const toggleVisibility = async (doc) => {
        const newVis = doc.visibility === "private" ? "public" : "private";
        try {
            await updateDocumentMetadata(doc.id, { visibility: newVis });
            setDocuments(documents.map(d => d.id === doc.id ? { ...d, visibility: newVis } : d));
        } catch (e) {
            console.error("Failed to update visibility", e);
        }
    };

    const checkExpiry = (dateString) => {
        if (!dateString) return null;
        const expiry = new Date(dateString);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: "expired", text: "Expired", color: "#EF4444" };
        if (diffDays <= 30) return { status: "expiring", text: `Expires in ${diffDays} days`, color: "#F59E0B" };
        return { status: "valid", text: `Valid until ${expiry.toLocaleDateString()}`, color: "#10B981" };
    };

    const S = {
        container: { maxWidth: "1200px", margin: "0 auto", fontFamily: C.font, color: "#1D1D1F" },
        header: { marginBottom: "48px" },
        title: { fontSize: "32px", fontWeight: 900, color: "#1D1D1F", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px", marginBottom: "8px" },
        subtitle: { color: "#94A3B8", fontSize: "16px", fontWeight: 500 },

        grid: { display: "grid", gridTemplateColumns: "400px 1fr", gap: "48px" },

        card: { background: "#fff", borderRadius: "32px", border: "1px solid #E2E8F0", padding: "32px", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.05)" },
        cardTitle: { fontSize: "20px", fontWeight: 900, marginBottom: "32px", color: "#1D1D1F", borderBottom: "1px solid #F1F5F9", paddingBottom: "20px", display: "flex", alignItems: "center", gap: "12px" },

        formGroup: { marginBottom: "20px" },
        label: { display: "block", fontSize: "11px", color: "#94A3B8", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
        input: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", color: "#1D1D1F", outline: "none", transition: "all 0.2s", boxSizing: "border-box", fontWeight: 600 },
        select: { width: "100%", background: "#fff", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "12px 16px", fontSize: "14px", color: "#1D1D1F", outline: "none", cursor: "pointer", appearance: "none", boxSizing: "border-box", fontWeight: 600 },

        uploadBox: {
            border: "2px dashed #E2E8F0", borderRadius: "20px", padding: "40px 20px",
            textAlign: "center", cursor: "pointer", background: "rgba(248, 250, 252, 0.5)",
            marginBottom: "20px", transition: "all 0.2s"
        },

        btn: {
            width: "100%", background: "#1D1D1F", color: "#fff", border: "none",
            padding: "18px", borderRadius: "16px", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            fontSize: "13px", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "1.5px"
        },

        docItem: {
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "24px 32px", background: "#fff", borderRadius: "24px",
            marginBottom: "16px", border: "1px solid #E2E8F0", transition: "all 0.3s",
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
        },
        docLeft: { display: "flex", alignItems: "center", gap: "20px" },
        docIcon: { 
            width: "52px", height: "52px", borderRadius: "16px", 
            background: "rgba(0,85,255,0.06)", color: "#0055FF", 
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(0,85,255,0.1)"
        },
        docName: { fontSize: "16px", fontWeight: 800, color: "#1D1D1F", marginBottom: "4px" },
        docMeta: { fontSize: "13px", color: "#94A3B8", display: "flex", gap: "12px", alignItems: "center", fontWeight: 600 },

        badge: (color) => ({ padding: "4px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", background: `${color}10`, color, border: `1px solid ${color}20` }),

        actions: { display: "flex", gap: "12px" },
        iconBtn: { 
            width: "40px", height: "40px", background: "#fff", border: "1px solid #E2E8F0", 
            color: "#64748B", cursor: "pointer", borderRadius: "12px", 
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" 
        },
        empty: {
            textAlign: "center", padding: "120px 40px", background: "#fff", borderRadius: "32px",
            border: "1px dashed #E2E8F0"
        }
    };

    if (!isUnlocked) {
        return (
            <div style={S.container}>
                <div style={{...S.card, maxWidth: "400px", margin: "100px auto", textAlign: "center"}}>
                    <ShieldAlert size={48} color="#1D1D1F" style={{marginBottom: 20}} />
                    <h2 style={{...S.cardTitle, justifyContent: "center", borderBottom: "none", marginBottom: "8px"}}>
                        {!userProfile?.vaultPin ? "Set Vault PIN" : "Unlock Document Vault"}
                    </h2>
                    <form onSubmit={handlePinSubmit}>
                        <input 
                            type="password" 
                            maxLength="6" 
                            value={pinInput} 
                            onChange={e => setPinInput(e.target.value)} 
                            style={{...S.input, textAlign: "center", letterSpacing: "8px", fontSize: "24px", marginBottom: "16px"}} 
                            placeholder="••••" 
                            required 
                        />
                        {pinError && <div style={{color: "#EF4444", fontSize: "14px", marginBottom: "16px", fontWeight: 700}}>{pinError}</div>}
                        <button type="submit" style={S.btn}>{!userProfile?.vaultPin ? "Secure Vault" : "Unlock Vault"}</button>
                    </form>
                    {!userProfile?.vaultPin ? (
                        <p style={{color: "#94A3B8", fontSize: "13px", marginTop: "16px", fontWeight: 600}}>Create a PIN to protect your sensitive documents.</p>
                    ) : (
                        <p style={{color: "#94A3B8", fontSize: "13px", marginTop: "16px", fontWeight: 600}}>Enter your PIN to access your restricted assets.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={S.container}>
            <div style={S.header}>
                <h1 style={S.title}>Document Vault</h1>
                <p style={S.subtitle}>Secure, strategic storage for your professional compliance assets.</p>
            </div>

            <div style={S.grid}>

                {/* UPLOAD PANEL */}
                <div>
                    <div style={S.card}>
                        <h2 style={S.cardTitle}><Upload size={20} /> Upload Asset</h2>

                        <form onSubmit={handleUpload}>
                            <div style={S.formGroup}>
                                <label style={S.label}>Category</label>
                                <div style={{ position: "relative" }}>
                                    <select style={S.select} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <span className="material-symbols-outlined" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>expand_more</span>
                                </div>
                            </div>

                            <div style={{ position: "relative" }}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                />
                                <div style={S.uploadBox} onMouseEnter={e => e.currentTarget.style.borderColor = "#0055FF"} onMouseLeave={e => e.currentTarget.style.borderColor = "#E2E8F0"}>
                                    <FileText size={40} color={file ? "#0055FF" : "#CBD5E1"} style={{ marginBottom: "16px" }} />
                                    <div style={{ fontSize: "14px", fontWeight: 800, color: file ? "#1D1D1F" : "#94A3B8" }}>{file ? file.name : "Select Document"}</div>
                                    <div style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "4px", fontWeight: 600 }}>PDF, JPG, PNG (Max 10MB)</div>
                                </div>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Visibility Protocol</label>
                                <div style={{ position: "relative" }}>
                                    <select style={S.select} value={visibility} onChange={e => setVisibility(e.target.value)}>
                                        <option value="private">Private (Shared manually)</option>
                                        <option value="public">Public (Visible to Hirers)</option>
                                    </select>
                                    <span className="material-symbols-outlined" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }}>expand_more</span>
                                </div>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Expiry Window (Optional)</label>
                                <input
                                    type="date"
                                    style={S.input}
                                    value={expiryDate}
                                    onChange={e => setExpiryDate(e.target.value)}
                                />
                            </div>

                            <button type="submit" disabled={!file || uploading} style={{ ...S.btn, opacity: (!file || uploading) ? 0.5 : 1 }}>
                                {uploading ? "Uploading..." : "Secure to Vault"}
                            </button>
                        </form>
                    </div>

                    {/* COMPLIANCE CHECKLIST PANEL */}
                    {requests.length > 0 && (
                        <div style={{ ...S.card, marginTop: "32px", border: "1px solid #1D1D1F", background: "#F8FAFC" }}>
                            <h2 style={{ ...S.cardTitle, color: "#1D1D1F", borderBottom: "1px solid #E2E8F0" }}><FileText size={20} /> Requested Compliance Checks</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {requests.map(req => {
                                    const isNotStarted = req.status === "not_started" || req.status === "rejected";
                                    const isUploaded = req.status === "uploaded";
                                    const isVerified = req.status === "verified";
                                    const activeTarget = uploadModalReqId === req.id;

                                    return (
                                        <div key={req.id} style={{ background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "#1D1D1F", fontSize: "16px" }}>
                                                        {req.name}
                                                        {req.mandatory && <span style={{ background: "rgba(220,50,50,0.1)", color: "#E53E3E", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", textTransform: "uppercase" }}>Mandatory</span>}
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", fontWeight: 700, textTransform: "uppercase" }}>STATUS: 
                                                        <span style={{ color: isVerified ? "#00B464" : (req.status==="rejected" ? "#E53E3E" : (isUploaded ? "#0055FF" : "#F5A623")), marginLeft: "4px" }}>
                                                            {req.status.replace("_", " ")}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => setInfoModalMasterId(req.documentMasterId)} style={{ background: "none", border: "none", color: "#0055FF", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}><Info size={14}/> Learn More</button>
                                            </div>

                                            {req.hrNote && (
                                                <div style={{ fontSize: "13px", color: "#1D1D1F", background: "#F1F5F9", padding: "12px", borderRadius: "12px", marginBottom: "16px", borderLeft: "4px solid #0055FF" }}>
                                                    <strong>HR Note:</strong> {req.hrNote}
                                                </div>
                                            )}

                                            {req.status === "rejected" && req.hrRejectionReason && (
                                                <div style={{ fontSize: "13px", color: "#E53E3E", background: "rgba(229,62,62,0.1)", padding: "12px", borderRadius: "12px", marginBottom: "16px", fontWeight: 600 }}>
                                                    <strong>Rejected:</strong> {req.hrRejectionReason}
                                                </div>
                                            )}

                                            {(!isVerified && !isUploaded && !activeTarget) && (
                                                <button onClick={() => setUploadModalReqId(req.id)} style={{ background: "#1D1D1F", color: "#fff", border: "none", borderRadius: "12px", padding: "10px 16px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <UploadCloud size={16} /> Upload Document Now
                                                </button>
                                            )}

                                            {activeTarget && (
                                                <div style={{ background: "#F8FAFC", border: "1px dashed #0055FF", padding: "16px", borderRadius: "12px", marginTop: "12px" }}>
                                                    <input type="file" onChange={e => setReqFile(e.target.files[0])} style={{ marginBottom: "12px", width: "100%" }} />
                                                    <textarea placeholder="Add a note (optional)" value={reqNote} onChange={e => setReqNote(e.target.value)} style={{ ...S.input, minHeight: "60px", marginBottom: "12px" }} />
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <button onClick={() => handleChecklistUploadSubmit(req.id)} disabled={uploading} style={{ background: "#0055FF", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>{uploading ? "Uploading..." : "Submit File"}</button>
                                                        <button onClick={() => setUploadModalReqId(null)} style={{ background: "transparent", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 16px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* VAULT LIST */}
                <div>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ height: "100px", background: "#fff", borderRadius: "24px", border: "1px solid #E2E8F0", opacity: 0.5 }} />)}
                        </div>
                    ) : documents.length === 0 ? (
                        <div style={S.empty}>
                            <ShieldAlert size={64} color="#E2E8F0" style={{ marginBottom: "24px" }} />
                            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1D1D1F", margin: "0 0 8px" }}>Vault is empty</h3>
                            <p style={{ fontSize: "14px", color: "#94A3B8", fontWeight: 500 }}>Upload your resume, passport, and visas to streamline applications.</p>
                        </div>
                    ) : (
                        documents.map(doc => {
                            const expiryInfo = checkExpiry(doc.expiryDate);

                            return (
                                <div key={doc.id} style={S.docItem} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                                    <div style={S.docLeft}>
                                        <div style={S.docIcon}><FileText size={24} /></div>
                                        <div>
                                            <div style={S.docName}>{doc.docCategory}</div>
                                            <div style={S.docMeta}>
                                                <span style={{ color: "#1D1D1F" }}>{doc.fileName.length > 20 ? doc.fileName.slice(0, 20) + "..." : doc.fileName}</span>
                                                <span>•</span>
                                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>

                                                {/* Visibility Badge */}
                                                <span
                                                    onClick={() => toggleVisibility(doc)}
                                                    style={{ cursor: "pointer", ...S.badge(doc.visibility === "public" ? "#10B981" : "#F59E0B") }}
                                                >
                                                    {doc.visibility === "public" ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={10} /> Public</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EyeOff size={10} /> Private</span>}
                                                </span>

                                                {/* Expiry Alert Base */}
                                                {expiryInfo && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: expiryInfo.color, fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                        <Clock size={12} /> {expiryInfo.text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={S.actions}>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                            <button style={S.iconBtn} title="Download/View" onMouseEnter={e => e.currentTarget.style.color = "#0055FF"} onMouseLeave={e => e.currentTarget.style.color = "#64748B"}>
                                                <DownloadCloud size={18} />
                                            </button>
                                        </a>
                                        <button 
                                            style={S.iconBtn} 
                                            onClick={() => handleDelete(doc.id, doc.storagePath)} 
                                            title="Delete"
                                            onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>

            <DocumentLearnMoreModal masterId={infoModalMasterId} isOpen={!!infoModalMasterId} onClose={() => setInfoModalMasterId(null)} />
        </div>
    );
}

