import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

class CallService {
    constructor() {
        this.socket = null;
        this.listeners = {}; // key: eventName, value: array of callbacks
    }

    connect(userId) {
        if (!this.socket) {
            this.socket = io(BACKEND_URL, {
                withCredentials: true,
            });

            this.socket.on('connect', () => {
                console.log('Connected to signaling server');
                if (this._registeredUserId) {
                    this.socket.emit('register-user', this._registeredUserId);
                }
            });

            this._setupSocketListener('incoming-call');
            this._setupSocketListener('call-status-update');
            this._setupSocketListener('call-failed');
            this._setupSocketListener('call-ended');
            this._setupSocketListener('control-event');
            this._setupSocketListener('chat-message');
            this._setupSocketListener('webrtc-signal');
        }

        if (userId) {
            this._registeredUserId = userId;
            if (this.socket.connected) {
                this.socket.emit('register-user', userId);
            }
        }
    }

    _setupSocketListener(event) {
        this.socket.on(event, (data) => {
            if (this.listeners[event]) {
                const results = [];
                // Use a copy to avoid issues if a listener removes itself during execution
                [...this.listeners[event]].forEach(cb => {
                    try {
                        const res = cb(data);
                        if (res !== undefined) results.push(res);
                    } catch (e) {
                        console.error(`Error in listener for ${event}:`, e);
                    }
                });
                return results;
            }
        });
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
        this.on('control-event', callback);
    }

    stopListeningForControlEvents(callback) {
        this.off('control-event', callback);
    }

    sendChatMessage(targetUserId, fromUserName, message) {
        if (this.socket) {
            this.socket.emit('chat-message', { targetUserId, fromUserName, message });
        }
    }

    listenForChatMessages(callback) {
        this.on('chat-message', callback);
    }

    stopListeningForChatMessages(callback) {
        this.off('chat-message', callback);
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
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        if (callback) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        } else {
            delete this.listeners[event];
        }
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
        this.on('webrtc-signal', callback);
    }

    stopListeningForSignals(callback) {
        this.off('webrtc-signal', callback);
    }
}

const callServiceInstance = new CallService();
export default callServiceInstance;
