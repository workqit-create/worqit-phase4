import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    const { currentUser } = useAuth();

    const targetUserId = location.state?.targetUserId || '';
    const otherUserName = location.state?.otherUserName || 'Unknown User';
    const isCaller = location.state?.isCaller ?? false;

    // ── Refs (never stale in closures) ──
    const streamRef = useRef(null);         // Always holds live MediaStream
    const connectionRef = useRef(null);     // Holds live Peer instance
    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const mainContainerRef = useRef(null);
    const pendingOfferRef = useRef(null);   // Holds offer that arrived before getUserMedia finished

    // ── State (for rendering only) ──
    const [callAccepted, setCallAccepted] = useState(false);
    const [micMuted, setMicMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [status, setStatus] = useState(isCaller ? 'Calling...' : 'Waiting to connect...');

    // ── Helper: stop all media tracks ──
    const stopAllTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
    };

    // ── Leave call: destroy peer, stop camera/mic, navigate back ──
    const leaveCall = useCallback(() => {
        if (connectionRef.current) {
            connectionRef.current.destroy();
            connectionRef.current = null;
        }
        stopAllTracks();
        navigate(-1);
    }, [navigate]);

    // ── Create peer as CALLER (initiator) ──
    const createCallerPeer = useCallback((stream) => {
        const peer = new Peer({
            initiator: true,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                ],
            },
        });

        peer.on('signal', (data) => {
            callService.sendSignal(targetUserId, currentUser.uid, data);
        });

        peer.on('stream', (remoteStream) => {
            setCallAccepted(true);
            setStatus(`Connected with ${otherUserName}`);
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('close', leaveCall);
        peer.on('error', (err) => {
            console.error('Peer error (caller):', err);
            leaveCall();
        });

        connectionRef.current = peer;
    }, [targetUserId, currentUser, otherUserName, leaveCall]);

    // ── Create peer as RECEIVER (answerer) ──
    const createReceiverPeer = useCallback((stream, offerSignal) => {
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                ],
            },
        });

        peer.on('signal', (data) => {
            callService.sendSignal(targetUserId, currentUser.uid, data);
        });

        peer.on('stream', (remoteStream) => {
            setCallAccepted(true);
            setStatus(`Connected with ${otherUserName}`);
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('close', leaveCall);
        peer.on('error', (err) => {
            console.error('Peer error (receiver):', err);
            leaveCall();
        });

        // Feed the offer into the peer to trigger the answer
        peer.signal(offerSignal);
        connectionRef.current = peer;
    }, [targetUserId, currentUser, otherUserName, leaveCall]);

    // ── Main effect: get camera/mic, then wire up signaling ──
    useEffect(() => {
        if (!targetUserId || !currentUser?.uid) return;

        // 1. Get local media
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                // Store in ref immediately so closures always see latest value
                streamRef.current = stream;
                if (myVideo.current) {
                    myVideo.current.srcObject = stream;
                }

                if (isCaller) {
                    // Start the offer immediately
                    createCallerPeer(stream);
                } else {
                    // If an offer arrived before our media was ready, answer it now
                    if (pendingOfferRef.current) {
                        createReceiverPeer(stream, pendingOfferRef.current);
                        pendingOfferRef.current = null;
                    }
                    // else: wait for the offer to arrive (handled in handleSignal below)
                }
            })
            .catch((err) => {
                console.error('getUserMedia failed:', err);
                alert('Camera/microphone permission denied. Please allow access and try again.');
                navigate(-1);
            });

        // 2. Listen for WebRTC signals from the other user
        const handleSignal = (data) => {
            if (data.fromUserId !== targetUserId) return;

            if (isCaller) {
                // Caller receives answer or ICE candidates
                if (connectionRef.current && !connectionRef.current.destroyed) {
                    connectionRef.current.signal(data.signal);
                }
            } else {
                // Receiver receives offer or ICE candidates
                if (data.signal.type === 'offer') {
                    // If we already have our stream, answer straight away
                    if (streamRef.current) {
                        createReceiverPeer(streamRef.current, data.signal);
                    } else {
                        // GetUserMedia hasn't finished — store offer and answer once ready
                        pendingOfferRef.current = data.signal;
                    }
                } else {
                    // ICE candidates for ongoing connection
                    if (connectionRef.current && !connectionRef.current.destroyed) {
                        connectionRef.current.signal(data.signal);
                    }
                }
            }
        };

        callService.listenForSignals(handleSignal);

        // 3. Cleanup on unmount — ALWAYS stop camera and mic
        return () => {
            callService.stopListeningForSignals(handleSignal);
            if (connectionRef.current) {
                connectionRef.current.destroy();
                connectionRef.current = null;
            }
            stopAllTracks();
        };
        // eslint-disable-next-line
    }, [targetUserId, currentUser?.uid]);

    // ── Toggle mic ──
    const toggleMic = () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setMicMuted(!track.enabled);
        }
    };

    // ── Toggle camera ──
    const toggleVideo = () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setCamOff(!track.enabled);
        }
    };

    // ── Full screen ──
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            mainContainerRef.current?.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const onChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // ── Guard: no targetUserId means invalid navigation ──
    if (!targetUserId) {
        return (
            <div style={{
                height: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: '#040914', color: '#fff', fontFamily: C.font, gap: 16
            }}>
                <div style={{ fontSize: 48 }}>📞</div>
                <h3>Invalid Call Link</h3>
                <p style={{ color: C.silver, maxWidth: 320, textAlign: 'center' }}>
                    This happens when you refresh the page. Please start or accept the call again.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    style={{ padding: '12px 28px', borderRadius: 30, background: C.grad, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div ref={mainContainerRef} style={{ height: '100vh', width: '100%', background: '#040914', display: 'flex', flexDirection: 'column', fontFamily: C.font, position: 'relative', overflow: 'hidden' }}>

            {/* ── Header ── */}
            {!isFullScreen && (
                <div style={{
                    padding: '14px 24px',
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 10,
                    backdropFilter: 'blur(8px)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: callAccepted ? '#34c759' : '#ff9f0a',
                            boxShadow: callAccepted ? '0 0 8px #34c759' : '0 0 8px #ff9f0a',
                            animation: callAccepted ? 'none' : 'pulse 1.5s infinite',
                        }} />
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>WebRTC Direct Call</span>
                    </div>
                    <span style={{ color: C.silver, fontSize: 13 }}>{status}</span>
                </div>
            )}

            {/* ── Remote Video (full background) ── */}
            <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
                {/* Remote video */}
                <video
                    playsInline
                    ref={userVideo}
                    autoPlay
                    style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        display: callAccepted ? 'block' : 'none',
                    }}
                />

                {/* Waiting overlay when not yet connected */}
                {!callAccepted && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(180deg, #060C1A 0%, #040914 100%)',
                        gap: 20,
                    }}>
                        <div style={{
                            width: 96, height: 96, borderRadius: '50%',
                            background: C.grad, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 38, color: '#fff', fontWeight: 700,
                            boxShadow: '0 0 40px rgba(26,111,232,0.5)',
                            animation: 'ringPulse 2s infinite',
                        }}>
                            {otherUserName.charAt(0).toUpperCase()}
                        </div>
                        <h3 style={{ color: '#fff', margin: 0, fontSize: 22 }}>{otherUserName}</h3>
                        <p style={{ color: C.silver, margin: 0, fontSize: 14 }}>
                            {isCaller ? '📡 Connecting...' : '⏳ Waiting for caller...'}
                        </p>
                    </div>
                )}

                {/* ── Local Video PIP ── */}
                <div style={{
                    position: 'absolute',
                    bottom: isFullScreen ? 100 : 90,
                    right: 20,
                    width: 160,
                    aspectRatio: '4/3',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    background: '#111',
                    zIndex: 20,
                }}>
                    <video
                        playsInline
                        muted
                        ref={myVideo}
                        autoPlay
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            transform: 'scaleX(-1)', // Mirror selfie view
                            display: camOff ? 'none' : 'block',
                        }}
                    />
                    {camOff && (
                        <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: C.silver, flexDirection: 'column', gap: 6, fontSize: 12
                        }}>
                            <CameraOff size={20} />
                            <span>Camera off</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Controls Bar ── */}
            <div style={{
                padding: '16px 24px',
                background: 'rgba(10,14,28,0.95)',
                backdropFilter: 'blur(16px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                zIndex: 30,
            }}>
                {/* Mic */}
                <button
                    onClick={toggleMic}
                    title={micMuted ? 'Unmute' : 'Mute'}
                    style={ctrlBtn(micMuted ? '#e53935' : 'rgba(255,255,255,0.12)')}
                >
                    {micMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                </button>

                {/* Camera */}
                <button
                    onClick={toggleVideo}
                    title={camOff ? 'Turn on camera' : 'Turn off camera'}
                    style={ctrlBtn(camOff ? '#e53935' : 'rgba(255,255,255,0.12)')}
                >
                    {camOff ? <CameraOff size={20} color="#fff" /> : <Camera size={20} color="#fff" />}
                </button>

                {/* End Call */}
                <button
                    onClick={leaveCall}
                    title="End Call"
                    style={{ ...ctrlBtn('#e53935'), width: 64, borderRadius: 32 }}
                >
                    <PhoneOff size={22} color="#fff" />
                </button>

                {/* Fullscreen */}
                <button
                    onClick={toggleFullScreen}
                    title="Toggle Fullscreen"
                    style={ctrlBtn('rgba(255,255,255,0.06)')}
                >
                    {isFullScreen ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}
                </button>
            </div>

            {/* ── Animations ── */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes ringPulse {
                    0%, 100% { box-shadow: 0 0 40px rgba(26,111,232,0.5); }
                    50% { box-shadow: 0 0 65px rgba(26,111,232,0.9); }
                }
            `}</style>
        </div>
    );
}

function ctrlBtn(bg) {
    return {
        width: 52, height: 52, borderRadius: '50%',
        background: bg, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background 0.2s, transform 0.1s',
        flexShrink: 0,
    };
}
