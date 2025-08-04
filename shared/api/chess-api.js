/**
 * Chess API Client - Vanilla JavaScript
 *
 * A simple client for the go-chess backend API
 * Provides methods to interact with chess games, AI, and real-time features
 *
 * @author Rumen Damyanov <contact@rumenx.com>
 */

class ChessAPI {
  constructor(apiUrl = 'http://localhost:8080', wsUrl = 'ws://localhost:8080') {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.currentGameId = null;
    this.websocket = null;
    this.eventListeners = {};
  }

  /**
   * Make HTTP request to the API
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Game Management
   */

  // Create a new chess game
  async createGame() {
    const response = await this.request('/api/games', {
      method: 'POST'
    });
    this.currentGameId = response.id;
    return response;
  }

  // Get current game state
  async getGame(gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');
    return await this.request(`/api/games/${gameId}`);
  }

  // Delete a game
  async deleteGame(gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');
    return await this.request(`/api/games/${gameId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Game Actions
   */

  // Make a move
  async makeMove(from, to, promotion = null, gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    const moveData = { from, to };
    if (promotion) moveData.promotion = promotion;

    return await this.request(`/api/games/${gameId}/moves`, {
      method: 'POST',
      body: JSON.stringify(moveData)
    });
  }

  // Get move history
  async getMoveHistory(gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');
    return await this.request(`/api/games/${gameId}/moves`);
  }

  // Get AI move suggestion
  async getAIMove(difficulty = 'medium', engine = 'minimax', gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    return await this.request(`/api/games/${gameId}/ai-move`, {
      method: 'POST',
      body: JSON.stringify({ difficulty, engine })
    });
  }

  // Get LLM AI move (advanced AI with chat capabilities)
  async getLLMAIMove(provider = 'openai', level = 'expert', gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    return await this.request(`/api/games/${gameId}/ai-move`, {
      method: 'POST',
      body: JSON.stringify({
        engine: 'llm',
        provider,
        level
      })
    });
  }

  /**
   * LLM AI Features
   */

  // Chat with AI opponent
  async chatWithAI(message, provider = 'openai', gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    return await this.request(`/api/games/${gameId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, provider })
    });
  }

  // Get AI reaction to a move
  async getAIReaction(move, provider = 'openai', gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    return await this.request(`/api/games/${gameId}/react`, {
      method: 'POST',
      body: JSON.stringify({ move, provider })
    });
  }

  /**
   * Game Analysis
   */

  // Get position analysis
  async getAnalysis(gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');
    return await this.request(`/api/games/${gameId}/analysis`);
  }

  // Get all legal moves
  async getLegalMoves(gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');
    return await this.request(`/api/games/${gameId}/legal-moves`);
  }

  // Load position from FEN notation
  async loadFEN(fen, gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    return await this.request(`/api/games/${gameId}/fen`, {
      method: 'POST',
      body: JSON.stringify({ fen })
    });
  }

  /**
   * WebSocket for Real-time Updates
   */

  // Connect to WebSocket for real-time game updates
  connectWebSocket(gameId = this.currentGameId) {
    if (!gameId) throw new Error('No game ID provided');

    if (this.websocket) {
      this.websocket.close();
    }

    const wsUrl = `${this.wsUrl}/ws/games/${gameId}`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.emit('ws:connected');
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('game:update', data);

        // Emit specific events based on update type
        if (data.type === 'move') {
          this.emit('game:move', data);
        } else if (data.type === 'game_over') {
          this.emit('game:over', data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.websocket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('ws:disconnected');
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('ws:error', error);
    };

    return this.websocket;
  }

  // Disconnect WebSocket
  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Event System
   */

  // Add event listener
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.eventListeners[event]) return;

    const index = this.eventListeners[event].indexOf(callback);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  // Emit event
  emit(event, data) {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Utility Methods
   */

  // Check if coordinates are valid chess notation
  isValidSquare(square) {
    return /^[a-h][1-8]$/.test(square);
  }

  // Convert position to chess notation
  toChessNotation(row, col) {
    const files = 'abcdefgh';
    const ranks = '12345678';
    return files[col] + ranks[row];
  }

  // Parse chess notation to coordinates
  fromChessNotation(notation) {
    if (!this.isValidSquare(notation)) return null;

    const file = notation.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(notation[1]) - 1;   // 1=0, 2=1, etc.

    return { row: rank, col: file };
  }
}

// Export for use in modules or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChessAPI;
} else {
  window.ChessAPI = ChessAPI;
}
