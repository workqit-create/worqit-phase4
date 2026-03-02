import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { C } from './theme';
import { Camera, Mic, Phone, PhoneOff } from 'lucide-react';

export default function MeetingRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [meetingDetails, setMeetingDetails] = useState({
        meetLink: location.state?.meetLink || '',
        otherUserName: location.state?.otherUserName || 'Unknown User'
    });

    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        // In a real app, if meetLink isn't in state (e.g., page refresh),
        // you would fetch the details from the backend using the meeting `id`.
        if (!meetingDetails.meetLink) {
            // Fallback for demo purposes if someone directly hits the URL
            console.warn("No meeting link found in state.");
        }
    }, [id, meetingDetails.meetLink]);

    const handleJoin = () => {
        setIsJoining(true);

        // Give a slight delay for better UX before popping open the new tab
        setTimeout(() => {
            if (meetingDetails.meetLink) {
                window.open(meetingDetails.meetLink, '_blank', 'noopener,noreferrer');
                // Optionally redirect back to dashboard after joining
                navigate('/hirer'); // or candidate, depending on user type. We'll simplify and just go back.
            }
            setIsJoining(false);
        }, 800);
    };

    const handleLeave = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: C.bg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            fontFamily: C.font,
        }}>
            <div style={{
                width: '100%',
                maxWidth: 800,
                background: C.ink,
                borderRadius: 24,
                border: `1px solid ${C.line}`,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            }}>

                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: `1px solid ${C.line}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: C.ink2
                }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 600 }}>
                        Ready to join?
                    </h2>
                    <div style={{ color: C.silver, fontSize: 14 }}>
                        Meeting ID: {id}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{
                    display: 'flex',
                    padding: 40,
                    gap: 40,
                    flexDirection: window.innerWidth < 768 ? 'column' : 'row'
                }}>

                    {/* Preview Box (Fake local video) */}
                    <div style={{
                        flex: 2,
                        background: '#000',
                        borderRadius: 16,
                        aspectRatio: '16/9',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: C.ink3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 40,
                            color: C.silver
                        }}>
                            👤
                        </div>

                        {/* Fake controls inside preview */}
                        <div style={{
                            position: 'absolute',
                            bottom: 20,
                            display: 'flex',
                            gap: 16
                        }}>
                            <button style={previewBtnStyle}><Mic size={20} color="#fff" /></button>
                            <button style={previewBtnStyle}><Camera size={20} color="#fff" /></button>
                        </div>
                    </div>

                    {/* Info & Join Panel */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 24
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: 24 }}>
                                Direct Call
                            </h3>
                            <p style={{ margin: 0, color: C.silver, fontSize: 16 }}>
                                with <strong style={{ color: '#fff' }}>{meetingDetails.otherUserName}</strong>
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button
                                onClick={handleJoin}
                                disabled={isJoining || !meetingDetails.meetLink}
                                style={{
                                    padding: '16px 24px',
                                    borderRadius: 30,
                                    background: C.grad,
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: (isJoining || !meetingDetails.meetLink) ? 'not-allowed' : 'pointer',
                                    opacity: (isJoining || !meetingDetails.meetLink) ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    boxShadow: '0 8px 24px rgba(26,111,232,0.4)',
                                    transition: 'transform 0.1s'
                                }}
                                onMouseDown={(e) => !isJoining && (e.currentTarget.style.transform = 'scale(0.98)')}
                                onMouseUp={(e) => !isJoining && (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                {isJoining ? 'Joining...' : 'Join Google Meet'}
                                <Phone size={18} />
                            </button>

                            <button
                                onClick={handleLeave}
                                style={{
                                    padding: '16px 24px',
                                    borderRadius: 30,
                                    background: 'transparent',
                                    border: `1px solid ${C.line}`,
                                    color: C.silver,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,59,48,0.1)';
                                    e.currentTarget.style.color = '#ff3b30';
                                    e.currentTarget.style.borderColor = '#ff3b30';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = C.silver;
                                    e.currentTarget.style.borderColor = C.line;
                                }}
                            >
                                Cancel
                                <PhoneOff size={18} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

const previewBtnStyle = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
};
