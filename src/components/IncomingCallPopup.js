import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import callService from '../services/callService';
import { C } from '../pages/shared/theme';

export default function IncomingCallPopup({ currentUser }) {
    const [incomingCall, setIncomingCall] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        // Listen for incoming calls
        callService.on('incoming-call', (data) => {
            setIncomingCall(data);
        });

        // Listen for call cancellations/updates (e.g. caller hung up before we answered)
        callService.on('call-status-update', (data) => {
            if (incomingCall && data.callId === incomingCall.callId && data.status === 'cancelled') {
                setIncomingCall(null);
            }
        });

        return () => {
            callService.off('incoming-call');
            callService.off('call-status-update');
        };
    }, [currentUser, incomingCall]);

    if (!incomingCall) return null;

    const handleAccept = () => {
        // Notify caller that we accepted
        callService.respondToCall(
            incomingCall.fromUserId,
            currentUser.uid,
            'accepted',
            incomingCall.callId
        );
        // Redirect to meeting room as the RECEIVER (isCaller: false)
        navigate(`/meeting/${incomingCall.callId}`, {
            state: {
                targetUserId: incomingCall.fromUserId,
                otherUserName: incomingCall.fromUserName,
                isCaller: false
            }
        });
        setIncomingCall(null);
    };

    const handleDecline = () => {
        // Notify caller that we declined
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
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: C.grad,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 20
                }}>
                    {incomingCall.fromUserName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                    <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                        {incomingCall.fromUserName}
                    </div>
                    <div style={{ color: C.silver, fontSize: 13 }}>
                        is calling you...
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={handleDecline}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 8,
                        border: `1px solid ${C.line}`,
                        background: 'transparent',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,59,48,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Decline
                </button>
                <button
                    onClick={handleAccept}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: C.grad,
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(26,111,232,0.3)',
                        transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => e.target.style.transform = 'scale(0.96)'}
                    onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Accept
                </button>
            </div>
            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
