// src/pages/hirer/Billing.js
// ═══════════════════════════════════════════════════════
//  Subscription & Billing — Phase 8
// ═══════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle, Zap, Shield, CreditCard } from "lucide-react";

const STRIPE_PRICE_ID = "price_1xxxxxxxxx"; // Replace with real price ID from Stripe Dashboard
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function Billing() {
    const { currentUser, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("freemium"); // 'freemium' | 'pro'

    // Note: in a real app, you'd fetch the user's subscription status from Firestore
    // which is updated via Stripe Webhooks
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
                body: JSON.stringify({
                    priceId: STRIPE_PRICE_ID,
                    userId: currentUser.uid
                })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe
            } else {
                throw new Error(data.error || "Failed to create session");
            }
        } catch (err) {
            console.error(err);
            alert("Billing connection failed. Make sure your server is running and Stripe key is configured.");
        } finally {
            setLoading(false);
        }
    };

    const S = {
        container: { padding: "40px", color: "#fff", fontFamily: C.font, maxWidth: 900, margin: "0 auto" },
        header: { fontSize: 32, fontWeight: 800, marginBottom: 8, textAlign: "center" },
        sub: { color: C.silver, fontSize: 16, marginBottom: 40, textAlign: "center" },

        plansWrap: { display: "flex", gap: 30, justifyContent: "center" },

        card: (isPro) => ({
            background: isPro ? "rgba(26,111,232,.05)" : C.ink2,
            border: isPro ? `2px solid ${C.blue}` : `1px solid ${C.line}`,
            borderRadius: 16, padding: 32, width: 340,
            position: "relative", display: "flex", flexDirection: "column"
        }),

        badge: {
            position: "absolute", top: -12, right: 32,
            background: C.grad, color: "#fff", padding: "4px 12px",
            borderRadius: 100, fontSize: 12, fontWeight: 700
        },

        planName: { fontSize: 20, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
        price: { fontSize: 36, fontWeight: 800, marginBottom: 8 },
        period: { fontSize: 14, color: C.silver, fontWeight: 500 },

        features: { marginTop: 24, marginBottom: 32, display: "flex", flexDirection: "column", gap: 16, flex: 1 },
        feature: { display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "#cbd5e1", lineHeight: 1.4 },

        btn: (isPro) => ({
            width: "100%", padding: 14, borderRadius: 10, fontWeight: 700, fontSize: 15,
            border: isPro ? "none" : `1px solid ${C.line}`,
            background: isPro ? C.blue : "rgba(255,255,255,.05)",
            color: "#fff", cursor: "pointer", transition: "all .2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        })
    };

    return (
        <div style={S.container}>
            <h1 style={S.header}>Plans & Billing</h1>
            <p style={S.sub}>Upgrade to Pro to unlock unlimited hiring and advanced features.</p>

            <div style={S.plansWrap}>

                {/* Freemium Plan */}
                <div style={S.card(false)}>
                    <div style={S.planName}>Free Starter</div>
                    <div style={S.price}>$0 <span style={S.period}>/ forever</span></div>

                    <div style={S.features}>
                        <div style={S.feature}><CheckCircle size={18} color={C.silver} /> 2 Active Job Postings Max</div>
                        <div style={S.feature}><CheckCircle size={18} color={C.silver} /> 20 Chat Messages per month</div>
                        <div style={S.feature}><CheckCircle size={18} color={C.silver} /> Basic Profile searching</div>
                        <div style={{ ...S.feature, opacity: 0.5 }}><Shield size={18} /> No access to Discover feed</div>
                        <div style={{ ...S.feature, opacity: 0.5 }}><Zap size={18} /> No Video Interviews</div>
                    </div>

                    <button style={S.btn(false)} disabled>
                        {status === "freemium" ? "Current Plan" : "Downgrade"}
                    </button>
                </div>

                {/* Pro Plan */}
                <div style={S.card(true)}>
                    <div style={S.badge}>MOST POPULAR</div>
                    <div style={S.planName}><Zap size={20} color={C.blue} /> Pro Recruiter</div>
                    <div style={S.price}>$49 <span style={S.period}>/ month</span></div>

                    <div style={S.features}>
                        <div style={S.feature}><CheckCircle size={18} color={C.blue} /> Unlimited Job Postings</div>
                        <div style={S.feature}><CheckCircle size={18} color={C.blue} /> Unlimited Messaging</div>
                        <div style={S.feature}><CheckCircle size={18} color={C.blue} /> Full access to Connect / Discover feed</div>
                        <div style={S.feature}><CheckCircle size={18} color={C.blue} /> Video / Audio Interviews</div>
                        <div style={S.feature}><CheckCircle size={18} color={C.blue} /> Document Tracking & Requests</div>
                    </div>

                    {status === "pro" ? (
                        <div style={{ textAlign: "center", padding: 14, background: "rgba(46,204,113,.1)", color: C.green, borderRadius: 10, fontWeight: 700 }}>
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
