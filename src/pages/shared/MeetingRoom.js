import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { C } from './theme';
import {
    Camera, CameraOff, Mic, MicOff, PhoneOff, Maximize, Minimize,
    Monitor, MessageSquare, Hand, AlertCircle, UserPlus, Sparkles, Send, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Peer from 'simple-peer';
import callService from '../../services/callService';

const API_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function MeetingRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // ── All call params from router state ──────────────────────────────
    const targetUserId = location.state?.targetUserId || new URLSearchParams(location.search).get('host') || '';
    const otherUserName = location.state?.otherUserName || 'Guest';
    const isCaller = location.state?.isCaller ?? false;

    // ── All refs — never change, never re-render ───────────────────────
    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const mainRef = useRef(null);
    const streamRef = useRef(null);
    const peerRef = useRef(null);
    const pendingRef = useRef(null);  // buffered offer from callee side
    const pendingSignalsRef = useRef([]); // buffered ICE candidates
    const readySentRef = useRef(false); // prevent duplicate ready signals
    const canvasRef = useRef(null);
    const animFrameRef = useRef(null);

    // ── UI state ───────────────────────────────────────────────────────
    const [authReady, setAuthReady] = useState(!!currentUser);
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState(isCaller ? 'Calling…' : 'Waiting for caller…');
    const [micMuted, setMicMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [bgBlur, setBgBlur] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [remoteBlur, setRemoteBlur] = useState(false);
    const [remoteHand, setRemoteHand] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMsgs, setChatMsgs] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showAi, setShowAi] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportText, setReportText] = useState('');
    const [reportSent, setReportSent] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    }, []);

    // ── Helpers ────────────────────────────────────────────────────────
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }, []);

    const destroyPeer = useCallback(() => {
        if (peerRef.current) {
            try { peerRef.current.destroy(); } catch (_) { }
            peerRef.current = null;
        }
    }, []);

    const doLeave = useCallback(() => {
        if (targetUserId) callService.endCall(targetUserId);
        destroyPeer();
        stopStream();
        navigate(-1);
    }, [targetUserId, destroyPeer, stopStream, navigate]);

    // ── Build Caller peer (initiator = true) ───────────────────────────
    const buildCallerPeer = useCallback((stream) => {
        destroyPeer();
        const p = new Peer({
            initiator: true,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            }
        });
        p.on('signal', data => {
            callService.sendSignal(targetUserId, currentUser.uid, data);
        });
        p.on('stream', remote => {
            if (userVideo.current) userVideo.current.srcObject = remote;
            setConnected(true);
            setStatus('Connected ✓');
        });
        p.on('close', () => { setConnected(false); setStatus('Call ended'); });
        p.on('error', err => { console.error('Peer error', err); });
        peerRef.current = p;

        // Flush buffered signals
        if (pendingSignalsRef.current.length > 0) {
            pendingSignalsRef.current.forEach(sig => p.signal(sig));
            pendingSignalsRef.current = [];
        }
    }, [targetUserId, currentUser, destroyPeer]);

    // ── Build Receiver peer (initiator = false) ────────────────────────
    const buildReceiverPeer = useCallback((stream, offerSignal) => {
        destroyPeer();
        const p = new Peer({
            initiator: false,
            trickle: true,
            stream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            }
        });
        p.on('signal', data => {
            callService.sendSignal(targetUserId, currentUser.uid, data);
        });
        p.on('stream', remote => {
            if (userVideo.current) userVideo.current.srcObject = remote;
            setConnected(true);
            setStatus('Connected ✓');
        });
        p.on('close', () => { setConnected(false); setStatus('Call ended'); });
        p.on('error', err => { console.error('Peer error', err); });

        p.signal(offerSignal);
        peerRef.current = p;

        // Flush buffered signals
        if (pendingSignalsRef.current.length > 0) {
            pendingSignalsRef.current.forEach(sig => p.signal(sig));
            pendingSignalsRef.current = [];
        }
    }, [targetUserId, currentUser, destroyPeer]);

    // Wait for Firebase auth to resolve before proceeding
    useEffect(() => {
        if (currentUser?.uid && !authReady) setAuthReady(true);
    }, [currentUser, authReady]);

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  MAIN EFFECT — runs once auth + targetUserId are ready       ║
    // ╚══════════════════════════════════════════════════════════════╝
    useEffect(() => {
        if (!targetUserId || !currentUser?.uid || !authReady) return;

        // Guarantee socket is alive and this user is registered before any WebRTC signals are sent
        callService.connect(currentUser.uid);

        // ── Capture stable values in closure ──────────────────────────
        const myUid = currentUser.uid;
        const theirUid = targetUserId;
        const amCaller = isCaller;
        let readyCheckInterval = null; // For caller retry loop
        let peerBuilt = false;         // Flag so we only build peer once

        // ── Signal handler ────────────────────────────────────────────
        const onSignal = (data) => {
            if (data.fromUserId !== theirUid) return;
            const sig = data.signal;

            // ── Receiver: Caller says "are you ready?" ─────────────────
            if (sig.type === 'ready-check') {
                if (!amCaller && streamRef.current && !readySentRef.current) {
                    readySentRef.current = true;
                    callService.sendSignal(theirUid, myUid, { type: 'ready' });
                }
                return;
            }

            // ── Caller: Receiver is ready, now build peer ──────────────
            if (sig.type === 'ready') {
                if (amCaller && !peerBuilt) {
                    peerBuilt = true;
                    if (readyCheckInterval) { clearInterval(readyCheckInterval); readyCheckInterval = null; }
                    if (streamRef.current) {
                        buildCallerPeer(streamRef.current);
                    } else {
                        pendingRef.current = { waitingForStream: true };
                    }
                }
                return;
            }

            // ── Receiver: got WebRTC offer ─────────────────────────────
            if (!amCaller && sig.type === 'offer') {
                if (streamRef.current) {
                    buildReceiverPeer(streamRef.current, sig);
                } else {
                    pendingRef.current = sig;
                }
                return;
            }

            // ── Both: ICE candidates / answers ────────────────────────
            if (peerRef.current && !peerRef.current.destroyed) {
                try { peerRef.current.signal(sig); } catch (_) { }
            } else {
                pendingSignalsRef.current.push(sig);
            }
        };

        // ── Call ended by other side ──────────────────────────────────
        const onCallEnded = () => {
            showToast('The other person ended the call.');
            // Don't forcibly navigate — let user click End Call
        };

        // ── Call declined by other side ───────────────────────────────
        const onCallStatusUpdate = (data) => {
            if (data.status === 'declined') {
                setStatus('Call declined.');
                showToast(`${otherUserName} declined the call.`);
                setTimeout(() => doLeave(), 3000);
            }
        };

        // ── Control events (blur, hand) ───────────────────────────────
        const onControl = (data) => {
            if (!data) return;
            if (data.type === 'bgBlur') setRemoteBlur(data.value);
            if (data.type === 'handRaised') {
                setRemoteHand(data.value);
                if (data.value) showToast(`${otherUserName} raised their hand ✋`);
            }
        };

        // ── In-call chat ──────────────────────────────────────────────
        const onChat = (data) => {
            setChatMsgs(prev => [...prev, {
                from: data.fromUserName,
                text: data.message,
                time: data.time
            }]);
            showToast(`💬 ${data.fromUserName}: ${data.message}`);
        };

        // ── Register listeners ────────────────────────────────────────
        callService.listenForSignals(onSignal);
        callService.on('call-ended', onCallEnded);
        callService.on('call-status-update', onCallStatusUpdate);
        callService.listenForControlEvents(onControl);
        callService.listenForChatMessages(onChat);

        // ── Get camera & mic ─────────────────────────────────────────
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                streamRef.current = stream;
                if (myVideo.current) myVideo.current.srcObject = stream;

                if (amCaller) {
                    // Retry ready-check every 2s until receiver responds
                    const sendCheck = () => callService.sendSignal(theirUid, myUid, { type: 'ready-check' });
                    sendCheck(); // First ping immediately
                    readyCheckInterval = setInterval(() => {
                        if (peerBuilt) { clearInterval(readyCheckInterval); return; }
                        sendCheck();
                    }, 2000);
                } else {
                    // Receiver: check if offer arrived before camera was ready
                    if (pendingRef.current && pendingRef.current.type === 'offer') {
                        const buffered = pendingRef.current;
                        pendingRef.current = null;
                        buildReceiverPeer(stream, buffered);
                    } else if (!readySentRef.current) {
                        // Send ready so caller can build peer
                        readySentRef.current = true;
                        callService.sendSignal(theirUid, myUid, { type: 'ready' });
                    }
                }
            })
            .catch(() => {
                alert('Camera or microphone access was denied. Please allow access and try again.');
                navigate(-1);
            });

        // ── Cleanup on unmount ────────────────────────────────────────
        return () => {
            if (readyCheckInterval) clearInterval(readyCheckInterval);
            callService.stopListeningForSignals(onSignal);
            callService.off('call-ended', onCallEnded);
            callService.off('call-status-update', onCallStatusUpdate);
            callService.stopListeningForControlEvents(onControl);
            callService.stopListeningForChatMessages(onChat);
            destroyPeer();
            stopStream();
        };
        // eslint-disable-next-line
    }, [authReady]); // Re-run once auth is confirmed ready


    // ── Mic toggle ────────────────────────────────────────────────────
    const toggleMic = () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getAudioTracks()[0];
        if (track) { track.enabled = !track.enabled; setMicMuted(!track.enabled); }
    };

    // ── Camera toggle ─────────────────────────────────────────────────
    const toggleCam = () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (track) { track.enabled = !track.enabled; setCamOff(!track.enabled); }
    };

    // ── Full screen ───────────────────────────────────────────────────
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) mainRef.current?.requestFullscreen().catch(() => { });
        else document.exitFullscreen();
    };

    useEffect(() => {
        const fn = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', fn);
        return () => document.removeEventListener('fullscreenchange', fn);
    }, []);

    // ── Screen share ──────────────────────────────────────────────────
    const toggleScreenShare = async () => {
        if (isSharingScreen) {
            setIsSharingScreen(false);
            if (myVideo.current) myVideo.current.srcObject = streamRef.current;
            const cam = streamRef.current?.getVideoTracks()[0];
            if (cam && peerRef.current && !peerRef.current.destroyed) {
                const s = peerRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
                if (s) s.replaceTrack(cam);
            }
            showToast('Screen sharing stopped.');
        } else {
            try {
                const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const track = ss.getVideoTracks()[0];
                if (peerRef.current && !peerRef.current.destroyed) {
                    const s = peerRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
                    if (s) s.replaceTrack(track);
                }
                if (myVideo.current) myVideo.current.srcObject = ss;
                track.onended = () => {
                    setIsSharingScreen(false);
                    if (myVideo.current) myVideo.current.srcObject = streamRef.current;
                    const cam = streamRef.current?.getVideoTracks()[0];
                    if (cam && peerRef.current && !peerRef.current.destroyed) {
                        const s = peerRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
                        if (s) s.replaceTrack(cam);
                    }
                };
                setIsSharingScreen(true);
                showToast('Screen sharing started.');
            } catch { showToast('Screen sharing cancelled.'); }
        }
    };

    // ── Background blur (CSS — simple, no TF dependency issues) ───────
    useEffect(() => {
        if (!myVideo.current) return;
        myVideo.current.style.filter = bgBlur ? 'blur(10px)' : 'none';
    }, [bgBlur]);

    const toggleBgBlur = () => {
        const v = !bgBlur;
        setBgBlur(v);
        callService.sendControlEvent(targetUserId, { type: 'bgBlur', value: v });
    };

    // ── Raise hand ────────────────────────────────────────────────────
    const toggleHand = () => {
        const v = !handRaised;
        setHandRaised(v);
        showToast(v ? '✋ Hand raised!' : 'Hand lowered.');
        callService.sendControlEvent(targetUserId, { type: 'handRaised', value: v });
    };

    // ── AI Questions ──────────────────────────────────────────────────
    const generateAI = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        setAiResult('');
        try {
            const res = await fetch(`${API_URL}/api/generate-interview-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            const data = await res.json();
            setAiResult(data.questions || 'No questions generated.');
        } catch {
            setAiResult('Network error. Make sure the backend is reachable.');
        }
        setAiLoading(false);
    };

    // ── In-call chat ──────────────────────────────────────────────────
    const sendChat = () => {
        if (!chatInput.trim()) return;
        const msg = chatInput.trim();
        setChatMsgs(prev => [...prev, { from: 'You', text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setChatInput('');
        callService.sendChatMessage(targetUserId, currentUser?.displayName || currentUser?.name || 'You', msg);
    };

    // ── Invite link ───────────────────────────────────────────────────
    const copyInvite = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('host', currentUser.uid);
        navigator.clipboard.writeText(url.toString()).then(() => showToast('Invite link copied!')).catch(() => showToast('Could not copy link.'));
        setShowInvite(false);
    };

    // ── Guard: no targetUserId ────────────────────────────────────────
    if (!targetUserId) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#040914', color: '#fff', fontFamily: C.font, gap: 16 }}>
                <div style={{ fontSize: 48 }}>📞</div>
                <h3>Invalid Call Link</h3>
                <p style={{ color: C.silver, maxWidth: 320, textAlign: 'center' }}>Please start or accept the call again from the chat.</p>
                <button onClick={() => navigate(-1)} style={{ padding: '12px 28px', borderRadius: 30, background: C.grad, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
            </div>
        );
    }

    return (
        <div ref={mainRef} style={{ height: '100vh', width: '100%', background: '#040914', display: 'flex', flexDirection: 'column', fontFamily: C.font, position: 'relative', overflow: 'hidden' }}>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', background: 'rgba(26,111,232,.92)', color: '#fff', padding: '10px 22px', borderRadius: 30, fontSize: 13, fontWeight: 600, zIndex: 9999, backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
                    {toast}
                </div>
            )}

            {/* Header */}
            {!isFullScreen && (
                <div style={{ padding: '14px 24px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10, backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: connected ? '#34c759' : '#ff9f0a', boxShadow: connected ? '0 0 8px #34c759' : '0 0 8px #ff9f0a' }} />
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Worqit Video Call</span>
                        {remoteHand && <span style={{ fontSize: 18 }} title={`${otherUserName} raised their hand`}>✋</span>}
                    </div>
                    <span style={{ color: C.silver, fontSize: 13 }}>{status}</span>
                </div>
            )}

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Video */}
                <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
                    <video playsInline ref={userVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: connected ? 'block' : 'none', filter: remoteBlur ? 'blur(14px)' : 'none' }} />
                    {!connected && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#060C1A 0%,#040914 100%)', gap: 20 }}>
                            <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, color: '#fff', fontWeight: 700, animation: 'ringPulse 2s infinite' }}>
                                {otherUserName.charAt(0).toUpperCase()}
                            </div>
                            <h3 style={{ color: '#fff', margin: 0, fontSize: 22 }}>{otherUserName}</h3>
                            <p style={{ color: C.silver, margin: 0, fontSize: 14 }}>{isCaller ? '📡 Connecting…' : '⏳ Waiting for caller…'}</p>
                        </div>
                    )}
                    {/* PIP local */}
                    <div style={{ position: 'absolute', bottom: 90, right: 20, width: 160, aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', background: '#111', zIndex: 20 }}>
                        {!camOff
                            ? <video playsInline muted ref={myVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.silver, flexDirection: 'column', gap: 6, fontSize: 12 }}><CameraOff size={20} /><span>Camera off</span></div>
                        }
                    </div>
                </div>

                {/* AI Panel */}
                {showAi && (
                    <div style={{ width: 320, background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} color={C.cyan} /> AI Questions</span>
                            <button onClick={() => setShowAi(false)} style={{ background: 'none', border: 'none', color: C.silver, cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
                            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. 5 questions for a React Developer…" rows={3} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', resize: 'none', fontFamily: C.font, fontSize: 13 }} />
                            <button onClick={generateAI} disabled={aiLoading} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                                {aiLoading ? 'Generating…' : '✨ Generate'}
                            </button>
                            {aiResult && <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: 12, color: C.silver, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiResult}</div>}
                        </div>
                    </div>
                )}

                {/* Chat Panel */}
                {showChat && (
                    <div style={{ width: 300, background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 700 }}>In-Call Chat</span>
                            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: C.silver, cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {chatMsgs.length === 0 && <div style={{ color: C.silver, fontSize: 12, textAlign: 'center', marginTop: 40 }}>No messages yet.</div>}
                            {chatMsgs.map((m, i) => (
                                <div key={i} style={{ background: 'rgba(26,111,232,.15)', borderRadius: 10, padding: '8px 12px' }}>
                                    <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{m.from} · {m.time}</div>
                                    <div style={{ color: '#fff', fontSize: 13 }}>{m.text}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8 }}>
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Type a message…" style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontFamily: C.font, outline: 'none', fontSize: 13 }} />
                            <button onClick={sendChat} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ padding: '16px 24px', background: 'rgba(10,14,28,0.95)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 30, flexWrap: 'wrap' }}>
                <Ctrl onClick={toggleMic} label={micMuted ? 'Unmute' : 'Mute'} active={micMuted}>{micMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}</Ctrl>
                <Ctrl onClick={toggleCam} label={camOff ? 'Camera On' : 'Camera Off'} active={camOff}>{camOff ? <CameraOff size={20} color="#fff" /> : <Camera size={20} color="#fff" />}</Ctrl>
                <Ctrl onClick={toggleScreenShare} label="Share Screen" active={isSharingScreen}><Monitor size={20} color="#fff" /></Ctrl>
                <Ctrl onClick={toggleBgBlur} label="Background Blur" active={bgBlur}><span style={{ fontSize: 14 }}>🌫</span></Ctrl>
                <Ctrl onClick={toggleHand} label="Raise Hand" active={handRaised} activeBg="#f59e0b"><Hand size={20} color="#fff" /></Ctrl>
                <Ctrl onClick={() => { setShowAi(p => !p); setShowChat(false); }} label="AI Questions" active={showAi}><Sparkles size={20} color="#fff" /></Ctrl>
                <Ctrl onClick={() => { setShowChat(p => !p); setShowAi(false); }} label="Chat" active={showChat}><MessageSquare size={20} color="#fff" /></Ctrl>
                <Ctrl onClick={() => setShowInvite(true)} label="Invite / Add"><UserPlus size={20} color="#fff" /></Ctrl>
                <Ctrl onClick={() => setShowReport(true)} label="Report Problem"><AlertCircle size={20} color="#fff" /></Ctrl>
                <button onClick={doLeave} title="End Call" style={{ width: 64, height: 52, borderRadius: 32, background: '#e53935', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <PhoneOff size={22} color="#fff" />
                </button>
                <Ctrl onClick={toggleFullScreen} label="Full Screen">{isFullScreen ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}</Ctrl>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <Modal title="Invite Participant" onClose={() => setShowInvite(false)}>
                    <p style={{ color: C.silver, fontSize: 13, marginBottom: 16 }}>Share this link to invite someone to this call:</p>
                    <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '10px 14px', color: C.cyan, fontSize: 12, wordBreak: 'break-all', marginBottom: 16 }}>{window.location.href.includes('?host=') ? window.location.href : `${window.location.href}?host=${currentUser?.uid}`}</div>
                    <button onClick={copyInvite} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>📋 Copy Invite Link</button>
                </Modal>
            )}

            {/* Report Modal */}
            {showReport && (
                <Modal title="Report a Problem" onClose={() => { setShowReport(false); setReportSent(false); setReportText(''); }}>
                    {reportSent ? (
                        <div style={{ color: '#00C864', textAlign: 'center', padding: '20px 0' }}>✅ Report submitted. Thank you!</div>
                    ) : (
                        <>
                            <textarea value={reportText} onChange={e => setReportText(e.target.value)} placeholder="Describe the issue…" rows={4} style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', resize: 'none', fontFamily: C.font, fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }} />
                            <button onClick={() => setReportSent(true)} disabled={!reportText.trim()} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer', width: '100%' }}>Submit Report</button>
                        </>
                    )}
                </Modal>
            )}

            <style>{`
                @keyframes ringPulse { 0%,100%{box-shadow:0 0 40px rgba(26,111,232,0.5)}50%{box-shadow:0 0 65px rgba(26,111,232,0.9)} }
            `}</style>
        </div>
    );
}

function Ctrl({ onClick, label, active = false, activeBg = '#1a6fe8', children }) {
    const bg = active ? activeBg : 'rgba(255,255,255,0.12)';
    return (
        <button onClick={onClick} title={label} style={{ width: 52, height: 52, borderRadius: '50%', background: bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            {children}
        </button>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 420 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}
