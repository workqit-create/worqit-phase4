// src/pages/candidate/DocumentVault.js
// ═══════════════════════════════════════════════════════
//  Document Hub — Candidate View (Phase 7) - Unified
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Clock, Eye, EyeOff, ShieldAlert, DownloadCloud, UploadCloud, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { C } from "../shared/theme";
import {
    uploadPersonalDocument,
    getCandidateUnifiedDocuments,
    deleteUnifiedDocument,
    updateDocumentMetadata,
    fulfillDocumentRequest,
} from "../../services/unifiedDocumentService";
import DocumentLearnMoreModal from "../../components/DocumentLearnMoreModal";
import { updateProfile } from "../../services/profileService";

export default function DocumentVault() {
    const { currentUser, userProfile, refreshProfile } = useAuth();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinError, setPinError] = useState("");

    const [documents, setDocuments] = useState([]); // Holding personal docs
    const [requests, setRequests] = useState([]);   // Holding requested docs
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [infoModalMasterId, setInfoModalMasterId] = useState(null);
    const [uploadModalReqId, setUploadModalReqId] = useState(null);
    const [reqFile, setReqFile] = useState(null);
    const [reqNote, setReqNote] = useState("");

    // Upload form state for personal documents
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
            console.log("Loading unified documents for:", currentUser.uid);
            const allDocs = await getCandidateUnifiedDocuments(currentUser.uid);
            
            const personalDocs = allDocs.filter(d => d.type === "personal");
            const requestedDocs = allDocs.filter(d => d.type === "requested");

            const sortedPersonalDocs = (personalDocs || []).sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setDocuments(sortedPersonalDocs);
            
            const sortedRequestedDocs = (requestedDocs || []).sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setRequests(sortedRequestedDocs);

        } catch (e) {
            console.error("Error loading documents:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFulfillRequest = async (requestId) => {
        if (!reqFile) return alert("Select a file first");
        setUploading(true);
        try {
            await fulfillDocumentRequest(requestId, reqFile, reqNote);
            setUploadModalReqId(null);
            setReqFile(null);
            setReqNote("");
            alert("Checklist document uploaded successfully!");
            loadDocuments(); // Refresh list
        } catch (e) { 
            console.error(e); 
            alert("Failed to upload document for request."); 
        } finally {
            setUploading(false);
        }
    };

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

    const handleUploadPersonal = async (e) => {
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

            await uploadPersonalDocument(file, currentUser.uid, metadata);
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
            await deleteUnifiedDocument(docId, storagePath);
            setDocuments(documents.filter(d => d.id !== docId));
            setRequests(requests.filter(r => r.id !== docId));
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
                <p style={S.subtitle}>SecureLY manage your personal documents and fulfill HR requests.</p>
            </div>

            <div style={S.grid}>
                {/* Left Column: Upload & Requests */}
                <div>
                    <div style={S.card}>
                        <h2 style={S.cardTitle}><Upload size={20} /> Upload Personal Document</h2>
                        <form onSubmit={handleUploadPersonal}>
                            <div style={S.formGroup}>
                                <label style={S.label}>Category</label>
                                <select style={S.select} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div style={{ position: "relative" }}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                />
                                <div style={S.uploadBox}>
                                    <FileText size={40} color={file ? "#0055FF" : "#CBD5E1"} />
                                    <div style={{ fontSize: "14px", fontWeight: 800 }}>{file ? file.name : "Select Document"}</div>
                                </div>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Visibility</label>
                                <select style={S.select} value={visibility} onChange={e => setVisibility(e.target.value)}>
                                    <option value="private">Private</option>
                                    <option value="shared">Shared</option>
                                    <option value="public">Public</option>
                                </select>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Expiry Date</label>
                                <input type="date" style={S.input} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                            </div>

                            <button type="submit" style={S.btn} disabled={uploading}>
                                {uploading ? "Uploading..." : "Upload"}
                            </button>
                        </form>
                    </div>

                    {/* Document Requests Injected Here */}
                    <div style={{...S.card, marginTop: "32px"}}>
                        <h2 style={S.cardTitle}><FileText size={20} /> Requested Compliance</h2>
                        {requests.length === 0 ? (
                            <p style={{color: "#94A3B8"}}>No pending requests.</p>
                        ) : (
                            requests.map(req => (
                                <div key={req.id} style={{background: "#F8FAFC", padding: "16px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #E2E8F0"}}>
                                    <div style={{fontWeight: 800}}>{req.name} {req.mandatory && "(Mandatory)"}</div>
                                    <div style={{fontSize: "12px", color: "#64748B"}}>Status: {req.status}</div>
                                    {req.status === "not_started" && (
                                        <button onClick={() => setUploadModalReqId(req.id)} style={{...S.btn, padding: "8px 12px", height: "auto", marginTop: "8px"}}>Fulfill Request</button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Vault Documents */}
                <div>
                   {documents.length === 0 ? (
                       <div style={S.empty}>No documents in vault.</div>
                   ) : (
                       documents.map(doc => {
                           const expiryInfo = checkExpiry(doc.expiryDate);
                           return (
                               <div key={doc.id} style={S.docItem}>
                                   <div style={S.docLeft}>
                                       <div style={S.docIcon}><FileText /></div>
                                       <div>
                                           <div style={S.docName}>{doc.docCategory}</div>
                                           <div style={S.docMeta}>
                                               <span>{doc.fileName}</span>
                                               {expiryInfo && <span style={{color: expiryInfo.color}}>{expiryInfo.text}</span>}
                                               <span onClick={() => toggleVisibility(doc)} style={{cursor: "pointer"}}>{doc.visibility}</span>
                                           </div>
                                       </div>
                                   </div>
                                   <div style={S.actions}>
                                       <a href={doc.url} target="_blank" rel="noreferrer"><DownloadCloud size={18} /></a>
                                       <Trash2 onClick={() => handleDelete(doc.id, doc.storagePath)} style={{cursor: "pointer"}} size={18} />
                                   </div>
                               </div>
                           )
                       })
                   )}
                </div>
            </div>

            {/* Modal for Request fulfillment */}
            {uploadModalReqId && (
                <div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000}}>
                    <div style={{...S.card, width: "100%", maxWidth: "400px"}}>
                        <h2 style={S.cardTitle}>Complete Request</h2>
                        <input type="file" onChange={e => setReqFile(e.target.files[0])} style={S.input} />
                        <textarea placeholder="Candidate note" value={reqNote} onChange={e => setReqNote(e.target.value)} style={{...S.input, marginTop: "12px"}} />
                        <button onClick={() => handleFulfillRequest(uploadModalReqId)} style={{...S.btn, marginTop: "16px"}} disabled={uploading}>Submit</button>
                        <button onClick={() => setUploadModalReqId(null)} style={{...S.btn, background: "#E2E8F0", color: "#000", marginTop: "8px"}}>Cancel</button>
                    </div>
                </div>
            )}

            <DocumentLearnMoreModal masterId={infoModalMasterId} isOpen={!!infoModalMasterId} onClose={() => setInfoModalMasterId(null)} />
        </div>
    );
}
