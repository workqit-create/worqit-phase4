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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function MeetingRoom() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const targetUserId = location.state?.targetUserId || '';
    const otherUserName = location.state?.otherUserName || 'Unknown User';
    const isCaller = location.state?.isCaller ?? false;

    const streamRef = useRef(null);
    const connectionRef = useRef(null);
    const myVideo = useRef(null);
    const userVideo = useRef(null);
    const mainContainerRef = useRef(null);
    const pendingOfferRef = useRef(null);
    const screenStreamRef = useRef(null);

    const [callAccepted, setCallAccepted] = useState(false);
    const [micMuted, setMicMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [status, setStatus] = useState(isCaller ? 'Calling...' : 'Waiting to connect...');
    // New UAT states
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [bgBlur, setBgBlur] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiQuestions, setAiQuestions] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [reportText, setReportText] = useState('');
    const [reportSent, setReportSent] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const stopAllTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const leaveCall = useCallback(() => {
        if (connectionRef.current) { connectionRef.current.destroy(); connectionRef.current = null; }
        stopAllTracks();
        navigate(-1);
    }, [navigate]);

    const createCallerPeer = useCallback((stream) => {
        const peer = new Peer({ initiator: true, trickle: true, stream, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
        peer.on('signal', (data) => callService.sendSignal(targetUserId, currentUser.uid, data));
        peer.on('stream', (remoteStream) => {
            setCallAccepted(true);
            setStatus(`Connected with ${otherUserName}`);
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });
        peer.on('close', leaveCall);
        peer.on('error', () => leaveCall());
        connectionRef.current = peer;
    }, [targetUserId, currentUser, otherUserName, leaveCall]);

    const createReceiverPeer = useCallback((stream, offerSignal) => {
        const peer = new Peer({ initiator: false, trickle: true, stream, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
        peer.on('signal', (data) => callService.sendSignal(targetUserId, currentUser.uid, data));
        peer.on('stream', (remoteStream) => {
            setCallAccepted(true);
            setStatus(`Connected with ${otherUserName}`);
            if (userVideo.current) userVideo.current.srcObject = remoteStream;
        });
        peer.on('close', leaveCall);
        peer.on('error', () => leaveCall());
        peer.signal(offerSignal);
        connectionRef.current = peer;
    }, [targetUserId, currentUser, otherUserName, leaveCall]);

    useEffect(() => {
        if (!targetUserId || !currentUser?.uid) return;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                streamRef.current = stream;
                if (myVideo.current) myVideo.current.srcObject = stream;
                if (isCaller) {
                    createCallerPeer(stream);
                } else {
                    if (pendingOfferRef.current) {
                        createReceiverPeer(stream, pendingOfferRef.current);
                        pendingOfferRef.current = null;
                    }
                }
            })
            .catch(() => { alert('Camera/microphone permission denied.'); navigate(-1); });

        const handleSignal = (data) => {
            if (data.fromUserId !== targetUserId) return;
            if (isCaller) {
                if (connectionRef.current && !connectionRef.current.destroyed) connectionRef.current.signal(data.signal);
            } else {
                if (data.signal.type === 'offer') {
                    if (streamRef.current) createReceiverPeer(streamRef.current, data.signal);
                    else pendingOfferRef.current = data.signal;
                } else {
                    if (connectionRef.current && !connectionRef.current.destroyed) connectionRef.current.signal(data.signal);
                }
            }
        };
        callService.listenForSignals(handleSignal);
        return () => {
            callService.stopListeningForSignals(handleSignal);
            if (connectionRef.current) { connectionRef.current.destroy(); connectionRef.current = null; }
            stopAllTracks();
        };
        // eslint-disable-next-line
    }, [targetUserId, currentUser?.uid]);

    const toggleMic = () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getAudioTracks()[0];
        if (track) { track.enabled = !track.enabled; setMicMuted(!track.enabled); }
    };

    const toggleVideo = () => {
        if (!streamRef.current) return;
        const track = streamRef.current.getVideoTracks()[0];
        if (track) { track.enabled = !track.enabled; setCamOff(!track.enabled); }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) mainContainerRef.current?.requestFullscreen().catch(console.error);
        else document.exitFullscreen();
    };

    useEffect(() => {
        const onChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    // ── Screen Share ──
    const toggleScreenShare = async () => {
        if (isSharingScreen) {
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
            setIsSharingScreen(false);
            const camTrack = streamRef.current?.getVideoTracks()[0];
            if (camTrack && connectionRef.current && !connectionRef.current.destroyed) {
                const sender = connectionRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(camTrack);
            }
            showToast('Screen sharing stopped.');
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];
                if (connectionRef.current && !connectionRef.current.destroyed) {
                    const sender = connectionRef.current._pc?.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                }
                screenTrack.onended = () => { setIsSharingScreen(false); showToast('Screen sharing stopped.'); };
                if (myVideo.current) myVideo.current.srcObject = screenStream;
                setIsSharingScreen(true);
                showToast('Screen sharing started.');
            } catch { showToast('Screen sharing cancelled.'); }
        }
    };

    // ── Background Blur ──
    const toggleBgBlur = () => setBgBlur(p => !p);

    // ── AI Questions ──
    const generateAIQuestions = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        setAiQuestions('');
        try {
            const res = await fetch(`${API_URL}/api/generate-interview-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt }),
            });
            if (res.ok) {
                const data = await res.json();
                setAiQuestions(data.questions || 'No questions generated.');
            } else {
                setAiQuestions('Failed to generate. Please try again.');
            }
        } catch {
            setAiQuestions('Network error. Make sure the backend is running.');
        }
        setAiLoading(false);
    };

    // ── In-call chat (local only — no signaling in this pass) ──
    const sendChatMessage = () => {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { from: 'You', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setChatInput('');
    };

    // ── Copy invite link ──
    const copyInviteLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => showToast('Invite link copied!')).catch(() => showToast('Could not copy link.'));
        setShowInvite(false);
    };

    if (!targetUserId) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#040914', color: '#fff', fontFamily: C.font, gap: 16 }}>
                <div style={{ fontSize: 48 }}>📞</div>
                <h3>Invalid Call Link</h3>
                <p style={{ color: C.silver, maxWidth: 320, textAlign: 'center' }}>This happens when you refresh the page. Please start or accept the call again.</p>
                <button onClick={() => navigate(-1)} style={{ padding: '12px 28px', borderRadius: 30, background: C.grad, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
            </div>
        );
    }

    return (
        <div ref={mainContainerRef} style={{ height: '100vh', width: '100%', background: '#040914', display: 'flex', flexDirection: 'column', fontFamily: C.font, position: 'relative', overflow: 'hidden' }}>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', background: 'rgba(26,111,232,.9)', color: '#fff', padding: '10px 22px', borderRadius: 30, fontSize: 13, fontWeight: 600, zIndex: 999, backdropFilter: 'blur(8px)' }}>
                    {toast}
                </div>
            )}

            {/* ── Header ── */}
            {!isFullScreen && (
                <div style={{ padding: '14px 24px', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10, backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: callAccepted ? '#34c759' : '#ff9f0a', boxShadow: callAccepted ? '0 0 8px #34c759' : '0 0 8px #ff9f0a' }} />
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Worqit Video Call</span>
                        {handRaised && <span style={{ fontSize: 18, animation: 'wave 0.8s ease infinite alternate' }}>✋</span>}
                    </div>
                    <span style={{ color: C.silver, fontSize: 13 }}>{status}</span>
                </div>
            )}

            {/* ── Main Area ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Video area */}
                <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
                    <video playsInline ref={userVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', display: callAccepted ? 'block' : 'none' }} />
                    {!callAccepted && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#060C1A 0%,#040914 100%)', gap: 20 }}>
                            <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, color: '#fff', fontWeight: 700, animation: 'ringPulse 2s infinite' }}>
                                {otherUserName.charAt(0).toUpperCase()}
                            </div>
                            <h3 style={{ color: '#fff', margin: 0, fontSize: 22 }}>{otherUserName}</h3>
                            <p style={{ color: C.silver, margin: 0, fontSize: 14 }}>{isCaller ? '📡 Connecting...' : '⏳ Waiting for caller...'}</p>
                        </div>
                    )}

                    {/* Local PIP */}
                    <div style={{ position: 'absolute', bottom: 90, right: 20, width: 160, aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', background: '#111', zIndex: 20 }}>
                        <video playsInline muted ref={myVideo} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: camOff ? 'none' : 'block', filter: bgBlur ? 'blur(8px)' : 'none' }} />
                        {camOff && (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.silver, flexDirection: 'column', gap: 6, fontSize: 12 }}><CameraOff size={20} /><span>Camera off</span></div>)}
                    </div>
                </div>

                {/* ── AI Questions Panel ── */}
                {showAiPanel && (
                    <div style={{ width: 320, background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} color={C.cyan} /> AI Question Generator</span>
                            <button onClick={() => setShowAiPanel(false)} style={{ background: 'none', border: 'none', color: C.silver, cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
                            <textarea
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="e.g. Generate 5 interview questions for a Senior React Developer..."
                                rows={3}
                                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', resize: 'none', fontFamily: C.font, fontSize: 13 }}
                            />
                            <button onClick={generateAIQuestions} disabled={aiLoading} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                {aiLoading ? 'Generating...' : <><Sparkles size={14} /> Generate Questions</>}
                            </button>
                            {aiQuestions && (
                                <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: 12, color: C.silver, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {aiQuestions}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── In-call Chat Panel ── */}
                {showChat && (
                    <div style={{ width: 300, background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 700 }}>In-Call Chat</span>
                            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: C.silver, cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {chatMessages.length === 0 && <div style={{ color: C.silver, fontSize: 12, textAlign: 'center', marginTop: 40 }}>No messages yet.</div>}
                            {chatMessages.map((m, i) => (
                                <div key={i} style={{ background: 'rgba(26,111,232,.15)', borderRadius: 10, padding: '8px 12px' }}>
                                    <div style={{ color: C.cyan, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{m.from} · {m.time}</div>
                                    <div style={{ color: '#fff', fontSize: 13 }}>{m.text}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8 }}>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                                placeholder="Type a message..."
                                style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontFamily: C.font, outline: 'none', fontSize: 13 }}
                            />
                            <button onClick={sendChatMessage} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Controls Bar ── */}
            <div style={{ padding: '16px 24px', background: 'rgba(10,14,28,0.95)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', zIndex: 30, flexWrap: 'wrap' }}>
                <Ctrl onClick={toggleMic} label={micMuted ? 'Unmute' : 'Mute'} bg={micMuted ? '#e53935' : 'rgba(255,255,255,0.12)'}>
                    {micMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                </Ctrl>
                <Ctrl onClick={toggleVideo} label={camOff ? 'Camera On' : 'Camera Off'} bg={camOff ? '#e53935' : 'rgba(255,255,255,0.12)'}>
                    {camOff ? <CameraOff size={20} color="#fff" /> : <Camera size={20} color="#fff" />}
                </Ctrl>
                <Ctrl onClick={toggleScreenShare} label="Share Screen" bg={isSharingScreen ? '#1a6fe8' : 'rgba(255,255,255,0.12)'}>
                    <Monitor size={20} color="#fff" />
                </Ctrl>
                <Ctrl onClick={toggleBgBlur} label="Background Blur" bg={bgBlur ? '#1a6fe8' : 'rgba(255,255,255,0.12)'}>
                    <span style={{ fontSize: 14 }}>🌫</span>
                </Ctrl>
                <Ctrl onClick={() => { setHandRaised(p => !p); showToast(handRaised ? 'Hand lowered.' : 'Hand raised! ✋'); }} label="Raise Hand" bg={handRaised ? '#f59e0b' : 'rgba(255,255,255,0.12)'}>
                    <Hand size={20} color="#fff" />
                </Ctrl>
                <Ctrl onClick={() => { setShowAiPanel(p => !p); setShowChat(false); }} label="AI Questions" bg={showAiPanel ? '#1a6fe8' : 'rgba(255,255,255,0.12)'}>
                    <Sparkles size={20} color="#fff" />
                </Ctrl>
                <Ctrl onClick={() => { setShowChat(p => !p); setShowAiPanel(false); }} label="Chat" bg={showChat ? '#1a6fe8' : 'rgba(255,255,255,0.12)'}>
                    <MessageSquare size={20} color="#fff" />
                </Ctrl>
                <Ctrl onClick={() => setShowInvite(true)} label="Invite / Add">
                    <UserPlus size={20} color="#fff" />
                </Ctrl>
                <Ctrl onClick={() => setShowReport(true)} label="Report Problem">
                    <AlertCircle size={20} color="#fff" />
                </Ctrl>
                {/* End + Fullscreen */}
                <button onClick={leaveCall} title="End Call" style={{ ...ctrlBtn('#e53935'), width: 64, borderRadius: 32 }}>
                    <PhoneOff size={22} color="#fff" />
                </button>
                <Ctrl onClick={toggleFullScreen} label="Full Screen">
                    {isFullScreen ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}
                </Ctrl>
            </div>

            {/* ── Invite Modal ── */}
            {showInvite && (
                <Modal title="Add Participant / Invite" onClose={() => setShowInvite(false)}>
                    <p style={{ color: C.silver, fontSize: 13, marginBottom: 16 }}>Share this meeting link with others to join:</p>
                    <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '10px 14px', color: C.cyan, fontSize: 12, wordBreak: 'break-all', marginBottom: 16 }}>{window.location.href}</div>
                    <button onClick={copyInviteLink} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                        📋 Copy Invite Link
                    </button>
                </Modal>
            )}

            {/* ── Report Problem Modal ── */}
            {showReport && (
                <Modal title="Report a Problem" onClose={() => { setShowReport(false); setReportSent(false); setReportText(''); }}>
                    {reportSent ? (
                        <div style={{ color: '#00C864', textAlign: 'center', padding: '20px 0' }}>✅ Report submitted. Thank you!</div>
                    ) : (
                        <>
                            <textarea
                                value={reportText}
                                onChange={e => setReportText(e.target.value)}
                                placeholder="Describe the issue (e.g. video lag, no audio, connection drop)..."
                                rows={4}
                                style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', resize: 'none', fontFamily: C.font, fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }}
                            />
                            <button onClick={() => setReportSent(true)} disabled={!reportText.trim()} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                                Submit Report
                            </button>
                        </>
                    )}
                </Modal>
            )}

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
                @keyframes ringPulse { 0%,100%{box-shadow:0 0 40px rgba(26,111,232,0.5)}50%{box-shadow:0 0 65px rgba(26,111,232,0.9)} }
                @keyframes wave { from{transform:rotate(0deg)}to{transform:rotate(20deg)} }
            `}</style>
        </div>
    );
}

function Ctrl({ onClick, label, bg = 'rgba(255,255,255,0.12)', children }) {
    return (
        <button onClick={onClick} title={label} style={ctrlBtn(bg)}>
            {children}
        </button>
    );
}

function ctrlBtn(bg) {
    return { width: 52, height: 52, borderRadius: '50%', background: bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 };
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
