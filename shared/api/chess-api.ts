/**
 * Chess API Client - TypeScript Version
 *
 * A strongly-typed client for the go-chess backend API
 * Provides methods to interact with chess games, AI, and real-time features
 *
 * @author Rumen Damyanov <contact@rumenx.com>
 */

export interface GameState {
  id: string;
  board: string[][];
  currentPlayer: 'white' | 'black';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  winner?: 'white' | 'black';
  moveHistory: Move[];
  fen: string;
  pgn: string;
}

export interface Move {
  from: string;
  to: string;
  piece: string;
  captured?: string;
  promotion?: string;
  isCheck: boolean;
  isCheckmate: boolean;
  notation: string;
  timestamp: string;
}

export interface AIMove {
  move: Move;
  evaluation?: number;
  depth?: number;
  thinking_time?: number;
  engine: string;
  provider?: string;
}

export interface ChatResponse {
  message: string;
  provider: string;
  timestamp: string;
}

export interface Analysis {
  evaluation: number;
  best_move: string;
  threats: string[];
  suggestions: string[];
}

export interface RequestOptions {
  headers?: Record<string, string>;
  [key: string]: any;
}

export type AIEngine = 'random' | 'minimax' | 'alphabeta' | 'llm';
export type AIDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek';

export type GameEventType = 'move' | 'game_over' | 'chat' | 'analysis';

export interface GameEvent {
  type: GameEventType;
  data: any;
  timestamp: string;
}

export type EventCallback<T = any> = (data: T) => void;

export class ChessAPI {
  private apiUrl: string;
  private wsUrl: string;
  private currentGameId: string | null = null;
  private websocket: WebSocket | null = null;
  private eventListeners: Record<string, EventCallback[]> = {};

  constructor(apiUrl = 'http://localhost:8080', wsUrl = 'ws://localhost:8080') {
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
  }

  /**
   * Make HTTP request to the API
   */
  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const config: RequestInit = {
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

      return await response.json() as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Game Management
   */

  async createGame(): Promise<GameState> {
    const response = await this.request<GameState>('/api/games', {
      method: 'POST'
    });
    this.currentGameId = response.id;
    return response;
  }

  async getGame(gameId?: string): Promise<GameState> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');
    return await this.request<GameState>(`/api/games/${id}`);
  }

  async deleteGame(gameId?: string): Promise<void> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');
    await this.request(`/api/games/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Game Actions
   */

  async makeMove(
    from: string,
    to: string,
    promotion?: string,
    gameId?: string
  ): Promise<GameState> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    const moveData: any = { from, to };
    if (promotion) moveData.promotion = promotion;

    return await this.request<GameState>(`/api/games/${id}/moves`, {
      method: 'POST',
      body: JSON.stringify(moveData)
    });
  }

  async getMoveHistory(gameId?: string): Promise<Move[]> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');
    return await this.request<Move[]>(`/api/games/${id}/moves`);
  }

  async getAIMove(
    difficulty: AIDifficulty = 'medium',
    engine: AIEngine = 'minimax',
    gameId?: string
  ): Promise<AIMove> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    return await this.request<AIMove>(`/api/games/${id}/ai-move`, {
      method: 'POST',
      body: JSON.stringify({ difficulty, engine })
    });
  }

  async getLLMAIMove(
    provider: LLMProvider = 'openai',
    level: AIDifficulty = 'expert',
    gameId?: string
  ): Promise<AIMove> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    return await this.request<AIMove>(`/api/games/${id}/ai-move`, {
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

  async chatWithAI(
    message: string,
    provider: LLMProvider = 'openai',
    gameId?: string
  ): Promise<ChatResponse> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    return await this.request<ChatResponse>(`/api/games/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, provider })
    });
  }

  async getAIReaction(
    move: string,
    provider: LLMProvider = 'openai',
    gameId?: string
  ): Promise<ChatResponse> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    return await this.request<ChatResponse>(`/api/games/${id}/react`, {
      method: 'POST',
      body: JSON.stringify({ move, provider })
    });
  }

  /**
   * Game Analysis
   */

  async getAnalysis(gameId?: string): Promise<Analysis> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');
    return await this.request<Analysis>(`/api/games/${id}/analysis`);
  }

  async getLegalMoves(gameId?: string): Promise<string[]> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');
    return await this.request<string[]>(`/api/games/${id}/legal-moves`);
  }

  async loadFEN(fen: string, gameId?: string): Promise<GameState> {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    return await this.request<GameState>(`/api/games/${id}/fen`, {
      method: 'POST',
      body: JSON.stringify({ fen })
    });
  }

  /**
   * WebSocket for Real-time Updates
   */

  connectWebSocket(gameId?: string): WebSocket {
    const id = gameId || this.currentGameId;
    if (!id) throw new Error('No game ID provided');

    if (this.websocket) {
      this.websocket.close();
    }

    const wsUrl = `${this.wsUrl}/ws/games/${id}`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket connected');
      this.emit('ws:connected', null);
    };

    this.websocket.onmessage = (event) => {
      try {
        const data: GameEvent = JSON.parse(event.data);
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
      this.emit('ws:disconnected', null);
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('ws:error', error);
    };

    return this.websocket;
  }

  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Event System
   */

  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners[event]) return;

    const index = this.eventListeners[event].indexOf(callback);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  private emit<T = any>(event: string, data: T): void {
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

  isValidSquare(square: string): boolean {
    return /^[a-h][1-8]$/.test(square);
  }

  toChessNotation(row: number, col: number): string {
    const files = 'abcdefgh';
    const ranks = '12345678';
    return files[col] + ranks[row];
  }

  fromChessNotation(notation: string): { row: number; col: number } | null {
    if (!this.isValidSquare(notation)) return null;

    const file = notation.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(notation[1]) - 1;   // 1=0, 2=1, etc.

    return { row: rank, col: file };
  }

  // Getters
  get gameId(): string | null {
    return this.currentGameId;
  }

  get isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
}
