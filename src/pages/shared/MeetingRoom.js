import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { C } from './theme';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Maximize, Minimize } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Peer from 'simple-peer';
import callService from '../../services/callService';

export default function MeetingRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile, currentUser } = useAuth();

    // We expect location.state to have:
    // { targetUserId, otherUserName, isCaller (true/false) }
    const targetUserId = location.state?.targetUserId || '';
    const otherUserName = location.state?.otherUserName || 'Unknown User';
    const isCaller = location.state?.isCaller || false;

    // Media & Peer State
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    // Controls State
    const [micMuted, setMicMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Video Refs
    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const connectionRef = useRef(null);
    const mainContainerRef = useRef(null);

    // 1. Initialize local media
    useEffect(() => {
        // Only run if we actually have a target
        if (!targetUserId || !currentUser?.uid) return;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }

                // If this person initiated the call, start signaling immediately once media is ready
                if (isCaller) {
                    initiatePeerConnection(currentStream);
                }
            })
            .catch((err) => {
                console.error("Failed to get media devices:", err);
                alert("Please allow camera and microphone access to join the room.");
            });

        // Listen for incoming webrtc signals (answers/candidates)
        const handleSignal = (data) => {
            // Only process signals from the user we are talking to
            if (data.fromUserId === targetUserId) {
                if (data.signal.type === 'answer') {
                    // We are the caller receiving the answer to establish connection
                    if (connectionRef.current && !connectionRef.current.destroyed) {
                        connectionRef.current.signal(data.signal);
                    }
                } else if (!isCaller && data.signal.type === 'offer') {
                    // We are the receiver, getting the initial offer
                    // Wait for stream to be ready before answering (could be immediate if stream already loaded)
                    answerCall(data.signal);
                } else {
                    // ICE Candidates
                    if (connectionRef.current && !connectionRef.current.destroyed) {
                        connectionRef.current.signal(data.signal);
                    }
                }
            }
        };

        callService.listenForSignals(handleSignal);

        return () => {
            callService.stopListeningForSignals(handleSignal);
            cleanupCall();
        };
        // eslint-disable-next-line
    }, [targetUserId, currentUser?.uid]);

    // Cleanup resources
    const cleanupCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
    };

    // Caller function
    const initiatePeerConnection = (currentStream) => {
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream: currentStream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        // 1. Peer generates an 'offer' signal. Send to the other user.
        peer.on('signal', (data) => {
            callService.sendSignal(targetUserId, currentUser.uid, data);
        });

        // 3. When the connection completes and we start getting their video
        peer.on('stream', (userStream) => {
            setCallAccepted(true);
            if (userVideo.current) {
                userVideo.current.srcObject = userStream;
            }
        });

        peer.on('close', leaveCall);
        peer.on('error', (err) => {
            console.error("Peer Error:", err);
            leaveCall();
        });

        connectionRef.current = peer;
    };

    // Receiver function
    const answerCall = (offerSignal) => {
        // Use existing stream, or attempt to grab a new one quickly
        const currentStream = stream || myVideo.current?.srcObject;

        if (!currentStream) {
            console.error("Waiting for media stream to answer...");
            // If they click answer before permissions are granted, it runs again via state logic, 
            // but for now simple-peer expects a stream instantly or we can add it later.
            // We'll trust the useEffect sequence gets the stream fast enough.
            setTimeout(() => answerCall(offerSignal), 500);
            return;
        }

        setCallAccepted(true);

        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream: currentStream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        // 2. We generated an 'answer' signal, send it back
        peer.on('signal', (data) => {
            callService.sendSignal(targetUserId, currentUser.uid, data);
        });

        // Accept the initial offer
        peer.signal(offerSignal);

        // Receive their video
        peer.on('stream', (userStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = userStream;
            }
        });

        peer.on('close', leaveCall);
        peer.on('error', (err) => {
            console.error("Peer Error:", err);
            leaveCall();
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        cleanupCall();
        navigate(-1);
    };

    // Toggles
    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCamOff(!videoTrack.enabled);
            }
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            mainContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Safety checks
    if (!targetUserId) {
        return (
            <div style={{
                height: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: C.bg,
                color: '#fff', fontFamily: C.font
            }}>
                <h3>Invalid Call Link</h3>
                <button onClick={() => navigate(-1)} style={btnStyle(C.grad)}>Go Back</button>
            </div>
        );
    }

    return (
        <div ref={mainContainerRef} style={{
            minHeight: '100vh',
            width: '100%',
            background: '#040914',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: C.font,
            position: 'relative'
        }}>
            {/* Header */}
            {!isFullScreen && (
                <div style={{
                    padding: '16px 24px',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34c759', boxShadow: '0 0 8px #34c759' }} />
                        <span style={{ color: '#fff', fontWeight: 600 }}>WebRTC Direct Call</span>
                    </div>
                    <div style={{ color: C.silver, fontSize: 14 }}>
                        {callAccepted ? `Connected with ${otherUserName}` : `Waiting for ${otherUserName}...`}
                    </div>
                </div>
            )}

            {/* Video Area */}
            <div style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* Remote Video (Main) */}
                {callAccepted && !callEnded ? (
                    <video
                        playsInline
                        ref={userVideo}
                        autoPlay
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            background: '#000'
                        }}
                    />
                ) : (
                    <div style={{ textAlign: 'center', color: C.silver, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                            👤
                        </div>
                        <h3>{isCaller ? 'Calling...' : 'Connecting...'}</h3>
                    </div>
                )}

                {/* Local Video (PIP) */}
                <div style={{
                    position: 'absolute',
                    bottom: isFullScreen ? 40 : 100,
                    right: 40,
                    width: isFullScreen ? 240 : 200,
                    aspectRatio: '16/9',
                    background: '#000',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    zIndex: 20,
                    transition: 'all 0.3s ease'
                }}>
                    <video
                        playsInline
                        muted
                        ref={myVideo}
                        autoPlay
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'rotateY(180deg)' // Mirror local video
                        }}
                    />
                    {camOff && (
                        <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CameraOff size={24} color={C.silver} />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div style={{
                position: 'absolute',
                bottom: 30,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(20,24,35,0.8)',
                backdropFilter: 'blur(16px)',
                padding: '12px 24px',
                borderRadius: 40,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                zIndex: 30,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <button onClick={toggleMic} style={controlBtnStyle(micMuted ? '#ff5555' : 'rgba(255,255,255,0.1)')}>
                    {micMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                </button>

                <button onClick={toggleVideo} style={controlBtnStyle(camOff ? '#ff5555' : 'rgba(255,255,255,0.1)')}>
                    {camOff ? <CameraOff size={20} color="#fff" /> : <Camera size={20} color="#fff" />}
                </button>

                <button onClick={leaveCall} style={{
                    ...controlBtnStyle('#ff3b30'),
                    padding: '0 32px',
                    borderRadius: 30
                }}>
                    <PhoneOff size={20} color="#fff" />
                </button>

                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />

                <button onClick={toggleFullScreen} style={controlBtnStyle('transparent')}>
                    {isFullScreen ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}
                </button>
            </div>
        </div>
    );
}

const btnStyle = (bg) => ({
    padding: '12px 24px', borderRadius: 30,
    background: bg, border: 'none',
    color: '#fff', fontWeight: 600, cursor: 'pointer'
});

const controlBtnStyle = (bg) => ({
    width: 48, height: 48, borderRadius: '50%',
    background: bg, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background 0.2s'
});
