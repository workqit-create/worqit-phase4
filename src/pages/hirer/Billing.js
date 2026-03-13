// src/pages/hirer/Billing.js
// ═══════════════════════════════════════════════════════
//  Subscription & Billing — Ultra-Premium Update
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, Zap, Shield, CreditCard } from "lucide-react";

const STRIPE_PRICE_ID = "price_1xxxxxxxxx"; 
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function Billing() {
    const { currentUser, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("freemium");

    useEffect(() => {
        if (userProfile?.subscriptionPlan === "pro") {
            setStatus("pro");
        }
    }, [userProfile]);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId: STRIPE_PRICE_ID, userId: currentUser.uid })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else throw new Error(data.error || "Failed to create session");
        } catch (err) {
            console.error(err);
            alert("Billing connection failed.");
        } finally { setLoading(false); }
    };

    const S = {
        container: { maxWidth: "1000px", margin: "0 auto", fontFamily: C.font },
        header: { fontSize: "40px", fontWeight: 900, marginBottom: "12px", textAlign: "center", fontFamily: "'Outfit', sans-serif", letterSpacing: "-1px" },
        sub: { color: "#94A3B8", fontSize: "16px", marginBottom: "64px", textAlign: "center", fontWeight: 500 },
        plansWrap: { display: "flex", gap: "40px", justifyContent: "center", alignItems: "stretch" },
        card: (isPro) => ({
            background: isPro ? "rgba(255,255,255,0.8)" : "#fff",
            border: `1px solid ${isPro ? "#0055FF" : "#E2E8F0"}`,
            borderRadius: "32px", padding: "48px", width: "380px",
            position: "relative", display: "flex", flexDirection: "column",
            boxShadow: isPro ? "0 32px 64px -12px rgba(0,85,255,0.15)" : "0 24px 48px -12px rgba(0,0,0,0.05)",
            transition: "transform 0.3s ease",
        }),
        badge: {
            position: "absolute", top: "24px", right: "24px",
            background: "#0055FF", color: "#fff", padding: "6px 14px",
            borderRadius: "100px", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px"
        },
        planName: { fontSize: "20px", fontWeight: 800, marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px", color: "#1D1D1F" },
        price: { fontSize: "48px", fontWeight: 900, marginBottom: "8px", fontFamily: "'Outfit', sans-serif", color: "#1D1D1F" },
        period: { fontSize: "16px", color: "#94A3B8", fontWeight: 600 },
        features: { marginTop: "32px", marginBottom: "48px", display: "flex", flexDirection: "column", gap: "20px", flex: 1 },
        feature: { display: "flex", alignItems: "center", gap: "14px", fontSize: "14px", color: "#475569", fontWeight: 600 },
        btn: (isPro) => ({
            width: "100%", padding: "18px", borderRadius: "16px", fontWeight: 800, fontSize: "14px",
            textTransform: "uppercase", letterSpacing: "1.5px",
            border: "none",
            background: isPro ? "#1D1D1F" : "#F1F5F9",
            color: isPro ? "#fff" : "#64748B",
            cursor: isPro ? "pointer" : "default", transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            boxShadow: isPro ? "0 12px 24px -6px rgba(0,0,0,0.2)" : "none"
        })
    };

    return (
        <div style={S.container}>
            <h1 style={S.header}>Plans & Billing</h1>
            <p style={S.sub}>Strategic hiring for elite organizations.</p>

            <div style={S.plansWrap}>
                {/* Freemium Plan */}
                <div style={S.card(false)}>
                    <div style={S.planName}>Free Starter</div>
                    <div style={S.price}>$0 <span style={S.period}>/ forever</span></div>

                    <div style={S.features}>
                        <div style={S.feature}><CheckCircle size={20} color="#00B464" /> 2 Active Listings Max</div>
                        <div style={S.feature}><CheckCircle size={20} color="#00B464" /> 20 Messages Monthly</div>
                        <div style={S.feature}><CheckCircle size={20} color="#00B464" /> Standard Sourcing</div>
                        <div style={{ ...S.feature, opacity: 0.4 }}><Shield size={20} /> Limited Discovery</div>
                        <div style={{ ...S.feature, opacity: 0.4 }}><Zap size={20} /> Basic Analytics</div>
                    </div>

                    <button style={S.btn(false)}>
                        {status === "freemium" ? "Current Plan" : "Downgrade"}
                    </button>
                </div>

                {/* Pro Plan */}
                <div style={S.card(true)}>
                    <div style={S.badge}>PRO</div>
                    <div style={S.planName}><Zap size={22} color="#0055FF" /> Pro Recruiter</div>
                    <div style={S.price}>$49 <span style={S.period}>/ month</span></div>

                    <div style={S.features}>
                        <div style={S.feature}><CheckCircle size={20} color="#0055FF" /> Unlimited Strategic Postings</div>
                        <div style={S.feature}><CheckCircle size={20} color="#0055FF" /> Direct Talent Messaging</div>
                        <div style={S.feature}><CheckCircle size={20} color="#0055FF" /> Prime Discovery Access</div>
                        <div style={S.feature}><CheckCircle size={20} color="#0055FF" /> Executive Analytics</div>
                        <div style={S.feature}><CheckCircle size={20} color="#0055FF" /> Document Vault Access</div>
                    </div>

                    {status === "pro" ? (
                        <div style={{ textAlign: "center", padding: "18px", background: "rgba(0,180,100,0.08)", color: "#00B464", borderRadius: "16px", fontWeight: 800, fontSize: "14px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                            Active Subscription
                        </div>
                    ) : (
                        <button style={S.btn(true)} onClick={handleSubscribe} disabled={loading}>
                            {loading ? "Connecting..." : <><CreditCard size={18} /> Upgrade to Pro</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
