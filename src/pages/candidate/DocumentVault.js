// src/pages/candidate/DocumentVault.js
// ═══════════════════════════════════════════════════════
//  Document Hub — Candidate View (Phase 7)
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Clock, Eye, EyeOff, ShieldAlert, DownloadCloud } from "lucide-react";
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

export default function DocumentVault() {
    const { currentUser } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Upload form state
    const [file, setFile] = useState(null);
    const [docCategory, setDocCategory] = useState("Resume");
    const [visibility, setVisibility] = useState("private");
    const [expiryDate, setExpiryDate] = useState("");

    const categories = ["Resume", "Passport", "Visa", "Emirates ID", "Educational Certificate", "NOC", "Other"];

    useEffect(() => {
        if (currentUser) {
            loadDocuments();
        }
    }, [currentUser]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const [docs, reqs] = await Promise.all([
                getCandidateDocuments(currentUser.uid),
                getDocumentRequests(currentUser.uid, "candidate")
            ]);
            setDocuments(docs);
            setRequests(reqs.filter(r => r.status === "pending"));
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
            await uploadCandidateDocument(file, currentUser.uid, {
                docCategory,
                visibility,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
            });
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

        if (diffDays < 0) return { status: "expired", text: "Expired", color: C.red };
        if (diffDays <= 30) return { status: "expiring", text: `Expires in ${diffDays} days`, color: C.yellow };
        return { status: "valid", text: `Valid until ${expiry.toLocaleDateString()}`, color: C.green };
    };

    const S = {
        container: { padding: 30, maxWidth: 900, margin: "0 auto", color: "#fff", fontFamily: C.font },
        header: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
        sub: { color: C.silver, fontSize: 14, marginBottom: 30 },

        grid: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 30 },

        card: { background: C.ink2, borderRadius: 12, border: `1px solid ${C.line}`, padding: 24 },
        cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 },

        formGroup: { marginBottom: 16 },
        label: { display: "block", fontSize: 13, color: C.silver, marginBottom: 6, fontWeight: 600 },
        input: { width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", color: "#fff", outline: "none" },
        select: { width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", color: "#fff", outline: "none", cursor: "pointer", appearance: "none" },

        uploadBox: {
            border: `2px dashed ${C.line}`, borderRadius: 12, padding: "30px 20px",
            textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,.02)",
            marginBottom: 20, transition: "border-color 0.2s"
        },

        btn: {
            width: "100%", background: C.blue, color: "#fff", border: "none",
            padding: "12px", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        },

        docItem: {
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px", background: "rgba(255,255,255,.03)", borderRadius: 10,
            marginBottom: 12, border: `1px solid ${C.line}`
        },
        docLeft: { display: "flex", alignItems: "center", gap: 16 },
        docIcon: { width: 44, height: 44, borderRadius: 10, background: "rgba(26,111,232,.15)", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" },
        docName: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
        docMeta: { fontSize: 12, color: C.silver, display: "flex", gap: 12, alignItems: "center" },

        badge: (color) => ({ padding: "2px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${color}20`, color }),

        actions: { display: "flex", gap: 10 },
        iconBtn: { background: "none", border: "none", color: C.silver, cursor: "pointer", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" },
    };

    return (
        <div style={S.container}>
            <h1 style={S.header}>HR Document Hub <span style={S.badge(C.green)}>BETA</span></h1>
            <p style={S.sub}>Upload your compliance documents. Control who sees them. Get notified before they expire.</p>

            <div style={S.grid}>

                {/* UPLOAD PANEL */}
                <div style={S.card}>
                    <h2 style={S.cardTitle}><Upload size={18} /> Upload Document</h2>

                    <form onSubmit={handleUpload}>
                        <div style={S.formGroup}>
                            <label style={S.label}>Document Type</label>
                            <select style={S.select} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div style={{ position: "relative" }}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png,.docx"
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                            />
                            <div style={S.uploadBox}>
                                <FileText size={32} color={C.silver} style={{ marginBottom: 10 }} />
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{file ? file.name : "Click or drag file to upload"}</div>
                                <div style={{ fontSize: 12, color: C.silver, marginTop: 4 }}>PDF, JPG, PNG (Max 10MB)</div>
                            </div>
                        </div>

                        <div style={S.formGroup}>
                            <label style={S.label}>Visibility</label>
                            <select style={S.select} value={visibility} onChange={e => setVisibility(e.target.value)}>
                                <option value="private">Private (Only you & explicitly shared)</option>
                                <option value="public">Public (Visible to all Hirers on your profile)</option>
                            </select>
                        </div>

                        <div style={S.formGroup}>
                            <label style={S.label}>Expiry Date (Optional)</label>
                            <input
                                type="date"
                                style={S.input}
                                value={expiryDate}
                                onChange={e => setExpiryDate(e.target.value)}
                            />
                        </div>

                        <button type="submit" disabled={!file || uploading} style={{ ...S.btn, opacity: (!file || uploading) ? 0.5 : 1 }}>
                            {uploading ? "Uploading..." : "Save to Vault"}
                        </button>
                    </form>
                </div>

                {/* PENDING REQUESTS PANEL */}
                {requests.length > 0 && (
                    <div style={{ ...S.card, borderColor: C.yellow }}>
                        <h2 style={{ ...S.cardTitle, color: C.yellow }}><Clock size={18} /> Pending Requests</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {requests.map(req => (
                                <div key={req.id} style={{ background: "rgba(241,196,15,.1)", padding: 16, borderRadius: 8, border: `1px solid rgba(241,196,15,.3)` }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Requested: {req.documentType}</div>
                                    <div style={{ fontSize: 13, color: C.silver, marginBottom: 12 }}>{req.notes}</div>
                                    <select
                                        style={{ ...S.select, marginBottom: 0, padding: 8 }}
                                        onChange={(e) => {
                                            if (e.target.value) handleFulfillRequest(req.id, e.target.value, req.hirerId);
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select file from vault to share...</option>
                                        {documents.map(d => (
                                            <option key={d.id} value={d.id}>{d.fileName} ({d.docCategory})</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VAULT LIST */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {loading ? (
                        <div style={{ padding: 40, textAlign: "center", color: C.silver }}>Loading your documents...</div>
                    ) : documents.length === 0 ? (
                        <div style={{ ...S.card, textAlign: "center", padding: "60px 20px" }}>
                            <ShieldAlert size={48} color={C.silver} style={{ marginBottom: 16, opacity: 0.5 }} />
                            <div style={{ fontSize: 16, fontWeight: 600 }}>Your vault is empty</div>
                            <div style={{ fontSize: 13, color: C.silver, marginTop: 6 }}>Upload your resume, passport, and visas to easily share them with employers.</div>
                        </div>
                    ) : (
                        documents.map(doc => {
                            const expiryInfo = checkExpiry(doc.expiryDate);

                            return (
                                <div key={doc.id} style={S.docItem}>
                                    <div style={S.docLeft}>
                                        <div style={S.docIcon}><FileText size={20} /></div>
                                        <div>
                                            <div style={S.docName}>{doc.docCategory}</div>
                                            <div style={S.docMeta}>
                                                <span>{doc.fileName}</span>
                                                <span>•</span>
                                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>

                                                {/* Visibility Badge */}
                                                <span
                                                    onClick={() => toggleVisibility(doc)}
                                                    style={{ cursor: "pointer", ...S.badge(doc.visibility === "public" ? C.green : C.yellow) }}
                                                >
                                                    {doc.visibility === "public" ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={10} /> Public</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><EyeOff size={10} /> Private</span>}
                                                </span>

                                                {/* Expiry Alert Base */}
                                                {expiryInfo && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: expiryInfo.color, fontWeight: 600 }}>
                                                        <Clock size={12} /> {expiryInfo.text}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={S.actions}>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={S.iconBtn} title="Download/View">
                                            <DownloadCloud size={18} />
                                        </a>
                                        <button style={{ ...S.iconBtn, color: C.red }} onClick={() => handleDelete(doc.id, doc.storagePath)} title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
