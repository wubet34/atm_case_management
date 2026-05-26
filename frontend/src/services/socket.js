import { io } from 'socket.io-client';

// HARDCODED PRODUCTION URL
const SOCKET_URL = 'https://atm-case-management.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token, userId) {
    if (!this.socket) {
      console.log('Connecting to socket server at:', SOCKET_URL);
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        this.isConnected = true;
        this.socket.emit('register-user', userId);
        console.log(`📡 Registered user ${userId} to room`);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        this.socket.emit('register-user', userId);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new-notification', (data) => {
        console.log('📨 Received new notification:', data);
        callback(data);
      });
    }
  }

  onUnreadCountUpdate(callback) {
    if (this.socket) {
      this.socket.on('unread-count-update', (data) => {
        console.log('📊 Unread count update:', data);
        callback(data);
      });
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();