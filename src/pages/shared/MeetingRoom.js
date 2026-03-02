import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { C } from './theme';
import { Camera, Mic, Phone, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MeetingRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const jitsiRef = React.useRef(null);

    const [meetingDetails, setMeetingDetails] = useState({
        meetLink: location.state?.meetLink || '',
        otherUserName: location.state?.otherUserName || 'Unknown User'
    });

    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);

    useEffect(() => {
        if (!meetingDetails.meetLink) {
            console.warn("No meeting link found in state.");
        }
    }, [id, meetingDetails.meetLink]);

    const handleJoin = () => {
        if (!meetingDetails.meetLink) return;
        
        setIsJoining(true);
        setHasJoined(true);
        
        // Extract room name from meetLink
        const roomName = meetingDetails.meetLink.split('/').pop();
        
        // Initialize Jitsi IFrame API
        setTimeout(() => {
            if (window.JitsiMeetExternalAPI && jitsiRef.current) {
                const domain = 'meet.jit.si';
                const options = {
                    roomName: roomName,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiRef.current,
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: false,
                        p2p: { enabled: false }, // Force JVB to avoid P2P negotiation issues
                    },
                    interfaceConfigOverwrite: {
                        // Customize the UI here if needed
                    },
                    userInfo: {
                        displayName: userProfile?.name || 'Worqit User'
                    }
                };
                const api = new window.JitsiMeetExternalAPI(domain, options);
                
                // Add event listeners for cleanup
                api.addEventListeners({
                    readyToClose: () => {
                        navigate(-1);
                    },
                    videoConferenceLeft: () => {
                        navigate(-1);
                    }
                });
            } else {
                // Fallback to old behavior if API script failed to load
                window.open(meetingDetails.meetLink, '_blank', 'noopener,noreferrer');
                navigate('/hirer');
            }
            setIsJoining(false);
        }, 500);
    };

    const handleLeave = () => {
        navigate(-1); // Go back to previous page
    };

    if (hasJoined) {
        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                background: '#000',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '12px 24px',
                    background: C.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${C.line}`
                }}>
                    <div style={{ color: '#fff', fontWeight: 600 }}>Worqit Direct Call</div>
                    <button
                        onClick={handleLeave}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            background: '#ff3b30',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        End Call
                    </button>
                </div>
                <div ref={jitsiRef} style={{ flex: 1 }} />
            </div>
        );
    }

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
                                {isJoining ? 'Joining...' : 'Join Video Call'}
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
