import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { C } from './theme';
import { Phone, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MeetingRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const meetLink = location.state?.meetLink || '';
    const otherUserName = location.state?.otherUserName || 'Unknown User';

    const [joined, setJoined] = useState(false);

    if (!meetLink) {
        return (
            <div style={{
                minHeight: '100vh', background: '#060C1A',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                fontFamily: C.font, padding: 20, textAlign: 'center'
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📞</div>
                <h2 style={{ color: '#fff', marginBottom: 8 }}>Meeting link not found</h2>
                <p style={{ color: C.silver, marginBottom: 24, maxWidth: 360 }}>
                    This can happen if you refreshed the page. Please start or accept the call again from your messages.
                </p>
                <button onClick={() => navigate(-1)} style={{
                    padding: '12px 28px', borderRadius: 30,
                    background: C.grad, border: 'none',
                    color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15
                }}>
                    Go Back
                </button>
            </div>
        );
    }

    const handleJoin = () => {
        setJoined(true);
        window.open(meetLink, '_blank');
    };

    const handleLeave = () => {
        navigate(-1);
    };

    return (
        <div style={{
            minHeight: '100vh', background: C.bg,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 20, fontFamily: C.font,
        }}>
            <div style={{
                width: '100%', maxWidth: 480,
                background: C.ink, borderRadius: 24,
                border: `1px solid ${C.line}`,
                overflow: 'hidden',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: `1px solid ${C.line}`,
                    background: C.ink2,
                    textAlign: 'center'
                }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 600 }}>
                        Direct Call
                    </h2>
                    <p style={{ margin: '6px 0 0', color: C.silver, fontSize: 14 }}>
                        with <strong style={{ color: '#fff' }}>{otherUserName}</strong>
                    </p>
                </div>

                {/* Body */}
                <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Avatar */}
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: C.grad, margin: '0 auto',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 32, color: '#fff', fontWeight: 700
                    }}>
                        {otherUserName.charAt(0).toUpperCase()}
                    </div>

                    {joined && (
                        <div style={{
                            background: 'rgba(52,199,89,0.1)',
                            border: '1px solid rgba(52,199,89,0.3)',
                            borderRadius: 12, padding: '12px 16px',
                            color: '#34c759', fontSize: 14, textAlign: 'center'
                        }}>
                            ✅ Call opened in a new tab. Come back here when done.
                        </div>
                    )}

                    <button
                        onClick={handleJoin}
                        style={{
                            padding: '16px 24px', borderRadius: 30,
                            background: C.grad, border: 'none',
                            color: '#fff', fontSize: 16, fontWeight: 700,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 10, boxShadow: '0 8px 24px rgba(26,111,232,0.4)',
                        }}
                    >
                        {joined ? 'Rejoin Call' : 'Join Video Call'}
                        <Phone size={18} />
                    </button>

                    <button
                        onClick={handleLeave}
                        style={{
                            padding: '16px 24px', borderRadius: 30,
                            background: 'transparent',
                            border: `1px solid ${C.line}`,
                            color: C.silver, fontSize: 16, fontWeight: 600,
                            cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                    >
                        Back to Messages <PhoneOff size={18} />
                    </button>

                    <p style={{ color: C.silver, fontSize: 12, textAlign: 'center', margin: 0 }}>
                        The call will open in a new browser tab via Jitsi Meet
                    </p>
                </div>
            </div>
        </div>
    );
}
