import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

class CallService {
    constructor() {
        this.socket = null;
        this.listeners = {};
    }

    connect(userId) {
        if (!this.socket) {
            this.socket = io(BACKEND_URL, {
                withCredentials: true,
            });

            this.socket.on('connect', () => {
                console.log('Connected to signaling server');
                // Always re-register on (re)connect so server mapping stays fresh
                if (this._registeredUserId) {
                    this.socket.emit('register-user', this._registeredUserId);
                }
            });

            this.socket.on('incoming-call', (data) => {
                if (this.listeners['incoming-call']) {
                    this.listeners['incoming-call'](data);
                }
            });

            this.socket.on('call-status-update', (data) => {
                if (this.listeners['call-status-update']) {
                    this.listeners['call-status-update'](data);
                }
            });

            this.socket.on('call-failed', (data) => {
                if (this.listeners['call-failed']) {
                    this.listeners['call-failed'](data);
                }
            });

            // ── Bridge call-ended so MeetingRoom's listener fires ──
            this.socket.on('call-ended', () => {
                if (this.listeners['call-ended']) {
                    this.listeners['call-ended']();
                }
            });
        }

        // Always register / re-register the user immediately.
        // If socket just opened, the 'connect' event fires and registers.
        // If socket was already open (reconnected or pre-existing), emit now.
        if (userId) {
            this._registeredUserId = userId;
            if (this.socket.connected) {
                this.socket.emit('register-user', userId);
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    endCall(targetUserId) {
        if (this.socket) {
            this.socket.emit('end-call', { targetUserId });
        }
    }

    sendControlEvent(targetUserId, eventData) {
        if (this.socket) {
            this.socket.emit('control-event', { targetUserId, eventData });
        }
    }

    listenForControlEvents(callback) {
        if (this.socket) {
            this.socket.on('control-event', callback);
        }
    }

    stopListeningForControlEvents(callback) {
        if (this.socket) {
            this.socket.off('control-event', callback);
        }
    }

    sendChatMessage(targetUserId, fromUserName, message) {
        if (this.socket) {
            this.socket.emit('chat-message', { targetUserId, fromUserName, message });
        }
    }

    listenForChatMessages(callback) {
        if (this.socket) {
            this.socket.on('chat-message', callback);
        }
    }

    stopListeningForChatMessages(callback) {
        if (this.socket) {
            this.socket.off('chat-message', callback);
        }
    }

    initiateCall(targetUserId, fromUserId, fromUserName, meetLink) {
        if (this.socket) {
            const callId = Date.now().toString();
            this.socket.emit('call-user', {
                targetUserId,
                fromUserId,
                fromUserName,
                meetLink,
                callId
            });
            return callId;
        }
        return null;
    }

    respondToCall(callerUserId, targetUserId, status, callId) {
        if (this.socket) {
            this.socket.emit('call-status', {
                callerUserId,
                targetUserId,
                status,
                callId
            });
        }
    }

    on(event, callback) {
        this.listeners[event] = callback;
    }

    off(event) {
        delete this.listeners[event];
    }

    sendSignal(targetUserId, fromUserId, signal) {
        if (this.socket) {
            this.socket.emit('webrtc-signal', {
                targetUserId,
                fromUserId,
                signal
            });
        }
    }

    listenForSignals(callback) {
        if (this.socket) {
            this.socket.on('webrtc-signal', callback);
        }
    }

    stopListeningForSignals(callback) {
        if (this.socket) {
            this.socket.off('webrtc-signal', callback);
        }
    }
}

const callServiceInstance = new CallService();
export default callServiceInstance;
