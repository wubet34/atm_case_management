import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token, userId) {
    if (!this.socket) {
      console.log('Connecting to socket server at:', SOCKET_URL);
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Add polling as fallback
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully, ID:', this.socket.id);
        this.isConnected = true;
        if (userId) {
          this.socket.emit('register-user', userId);
          console.log(`📡 Registered user ${userId} to room`);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.isConnected = false;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        if (userId) {
          this.socket.emit('register-user', userId);
        }
      });

      // Debug: Log all incoming events
      this.socket.onAny((event, ...args) => {
        console.log('📨 Socket event received:', event, args);
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
        console.log('🔔 New notification received:', data);
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
      console.log(`📤 Emitted ${event}:`, data);
    } else {
      console.warn(`Cannot emit ${event}, socket not connected`);
    }
  }
}

export default new SocketService();