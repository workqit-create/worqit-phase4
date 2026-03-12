import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import callService from '../services/callService';
import { C } from '../pages/shared/theme';

export default function IncomingCallPopup({ currentUser }) {
    const [incomingCall, setIncomingCall] = useState(null);
    const incomingCallRef = useRef(null);
    const navigate = useNavigate();

    // Keep ref in sync so the socket handler closure is never stale
    useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

    useEffect(() => {
        if (!currentUser) return;

        // Ensure we are connected and registered to receive calls
        callService.connect(currentUser.uid);

        const onIncoming = (data) => {
            setIncomingCall(data);
        };

        const onStatusUpdate = (data) => {
            const cur = incomingCallRef.current;
            if (cur && data.callId === cur.callId && data.status === 'cancelled') {
                setIncomingCall(null);
            }
        };

        const onCallEnded = () => {
            setIncomingCall(null);
        };

        callService.on('incoming-call', onIncoming);
        callService.on('call-status-update', onStatusUpdate);
        callService.on('call-ended', onCallEnded);

        return () => {
            callService.off('incoming-call', onIncoming);
            callService.off('call-status-update', onStatusUpdate);
            callService.off('call-ended', onCallEnded);
        };
        // eslint-disable-next-line
    }, [currentUser?.uid]); // Only re-run if the user changes, NOT on every render

    if (!incomingCall) return null;

    const handleAccept = () => {
        callService.respondToCall(
            incomingCall.fromUserId,
            currentUser.uid,
            'accepted',
            incomingCall.callId
        );
        setIncomingCall(null);
        navigate(`/meeting/${incomingCall.callId}`, {
            state: {
                targetUserId: incomingCall.fromUserId,
                otherUserName: incomingCall.fromUserName,
                isCaller: false,
            },
        });
    };

    const handleDecline = () => {
        callService.respondToCall(
            incomingCall.fromUserId,
            currentUser.uid,
            'declined',
            incomingCall.callId
        );
        setIncomingCall(null);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            width: 320,
            background: C.ink2,
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: C.grad, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 'bold', fontSize: 20
                }}>
                    {incomingCall.fromUserName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{incomingCall.fromUserName}</div>
                    <div style={{ color: C.silver, fontSize: 13 }}>is calling you…</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={handleDecline}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${C.line}`, background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,59,48,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    Decline
                </button>
                <button
                    onClick={handleAccept}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: C.grad, color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,111,232,0.3)' }}
                >
                    Accept
                </button>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(110%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
}
