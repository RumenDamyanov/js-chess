/**
 * WebSocket Client for Chess Games
 *
 * A lightweight WebSocket client specifically designed for chess game communication
 * Handles reconnection, message parsing, and event management
 *
 * @author Rumen Damyanov <contact@rumenx.com>
 */

class ChessWebSocketClient {
  constructor(url, gameId, options = {}) {
    this.url = url;
    this.gameId = gameId;
    this.options = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...options
    };

    this.websocket = null;
    this.reconnectAttempts = 0;
    this.eventListeners = {};
    this.isConnected = false;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    try {
      const wsUrl = `${this.url}/ws/games/${this.gameId}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = this.handleOpen.bind(this);
      this.websocket.onmessage = this.handleMessage.bind(this);
      this.websocket.onclose = this.handleClose.bind(this);
      this.websocket.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.emit('error', { error, type: 'connection_failed' });
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.clearTimers();
    this.reconnectAttempts = 0;

    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect');
      this.websocket = null;
    }
  }

  /**
   * Send a message to the server
   */
  send(message) {
    if (!this.isConnected) {
      console.warn('WebSocket not connected, message not sent:', message);
      return false;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.websocket.send(data);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      this.emit('error', { error, type: 'send_failed' });
      return false;
    }
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('WebSocket connected to game:', this.gameId);
    this.isConnected = true;
    this.reconnectAttempts = 0;

    this.startHeartbeat();
    this.emit('connected', { gameId: this.gameId });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle heartbeat/pong messages
      if (data.type === 'pong') {
        return;
      }

      // Emit specific event based on message type
      this.emit('message', data);

      if (data.type) {
        this.emit(data.type, data);
      }

      // Emit game-specific events
      switch (data.type) {
        case 'move':
          this.emit('game:move', data);
          break;
        case 'game_over':
          this.emit('game:over', data);
          break;
        case 'player_joined':
          this.emit('player:joined', data);
          break;
        case 'player_left':
          this.emit('player:left', data);
          break;
        case 'chat_message':
          this.emit('chat:message', data);
          break;
        case 'ai_reaction':
          this.emit('ai:reaction', data);
          break;
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('error', { error, type: 'parse_failed', raw: event.data });
    }
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.clearTimers();

    this.emit('disconnected', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(error) {
    console.error('WebSocket error:', error);
    this.emit('error', { error, type: 'websocket_error' });
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Event system methods
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners[event]) return;

    const index = this.eventListeners[event].indexOf(callback);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener for %s:', event, error);
      }
    });
  }

  /**
   * Utility methods
   */
  getConnectionState() {
    if (!this.websocket) return 'disconnected';

    switch (this.websocket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  isReady() {
    return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
  }
}

// Export for use in modules or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessWebSocketClient;
} else {
  window.ChessWebSocketClient = ChessWebSocketClient;
}
