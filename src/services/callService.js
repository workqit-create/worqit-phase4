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
                this.socket.emit('register-user', userId);
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
            })
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
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
}

const callServiceInstance = new CallService();
export default callServiceInstance;
