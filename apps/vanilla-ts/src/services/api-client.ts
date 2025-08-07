/**
 * Type-safe Chess API client
 */

import {
  CreateGameRequest,
  CreateGameResponse,
  GameState,
  MakeMoveRequest,
  MakeMoveResponse,
  AIRequest,
  AIResponse,
  LegalMovesResponse,
  ChatRequest,
  ChatResponse,
  MoveReactionRequest,
  MoveReactionResponse,
  ChessAPIError,
  PieceColor
} from '../types/chess.js';

export interface APIClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

/**
 * Chess API client with full type safety
 */
export class ChessAPIClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: APIClientConfig = { baseURL: 'http://localhost:8080' }) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout ?? 10000; // 10 seconds default
    this.retries = config.retries ?? 3;
  }

  /**
   * Generic fetch wrapper with error handling and typing
   */
  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new ChessAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      return await response.json() as T;

    } catch (error) {
      clearTimeout(timeoutId);

      // Retry on network errors
      if (attempt < this.retries && (
        error instanceof TypeError || // Network error
        (error instanceof ChessAPIError && (error.status ?? 0) >= 500) // Server error
      )) {
        console.warn(`API request failed, retrying (${attempt}/${this.retries}):`, error);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.fetchWithTimeout<T>(url, options, attempt + 1);
      }

      if (error instanceof ChessAPIError) {
        throw error;
      }

      throw new ChessAPIError(
        error instanceof Error ? error.message : 'Unknown network error'
      );
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a new chess game
   */
  async createGame(playerColor?: PieceColor): Promise<CreateGameResponse> {
    const requestBody: CreateGameRequest = {};

    if (playerColor) {
      // Set AI color to opposite of player color
      requestBody.ai_color = playerColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    }

    return this.fetchWithTimeout<CreateGameResponse>(
      `${this.baseURL}/api/games`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      }
    );
  }

  /**
   * Get game state by ID
   */
  async getGame(gameId: number): Promise<GameState> {
    return this.fetchWithTimeout<GameState>(
      `${this.baseURL}/api/games/${gameId}`
    );
  }

  /**
   * Make a move in the game
   */
  async makeMove(gameId: number, move: MakeMoveRequest): Promise<MakeMoveResponse> {
    return this.fetchWithTimeout<MakeMoveResponse>(
      `${this.baseURL}/api/games/${gameId}/moves`,
      {
        method: 'POST',
        body: JSON.stringify(move)
      }
    );
  }

  /**
   * Get AI move for the current position
   */
  async getAIMove(gameId: number, aiRequest: AIRequest): Promise<AIResponse> {
    return this.fetchWithTimeout<AIResponse>(
      `${this.baseURL}/api/games/${gameId}/ai-move`,
      {
        method: 'POST',
        body: JSON.stringify(aiRequest)
      }
    );
  }

  /**
   * Get AI hint for the current position
   */
  async getAIHint(gameId: number, aiRequest: AIRequest): Promise<AIResponse> {
    return this.fetchWithTimeout<AIResponse>(
      `${this.baseURL}/api/games/${gameId}/ai-hint`,
      {
        method: 'POST',
        body: JSON.stringify(aiRequest)
      }
    );
  }

  /**
   * Get legal moves for the current position
   */
  async getLegalMoves(gameId: number): Promise<LegalMovesResponse> {
    try {
      return await this.fetchWithTimeout<LegalMovesResponse>(
        `${this.baseURL}/api/games/${gameId}/legal-moves`
      );
    } catch (error) {
      // Gracefully handle missing legal moves endpoint
      if (error instanceof ChessAPIError && (error.status === 404 || error.status === 501)) {
        console.warn('Legal moves endpoint not available, returning empty array');
        return { legal_moves: [] };
      }
      throw error;
    }
  }

  /**
   * Send chat message to AI
   */
  async sendChatMessage(gameId: number, chatRequest: ChatRequest): Promise<ChatResponse> {
    return this.fetchWithTimeout<ChatResponse>(
      `${this.baseURL}/api/games/${gameId}/chat`,
      {
        method: 'POST',
        body: JSON.stringify(chatRequest)
      }
    );
  }

  /**
   * Get AI reaction to a move
   */
  async getMoveReaction(gameId: number, reactionRequest: MoveReactionRequest): Promise<MoveReactionResponse> {
    return this.fetchWithTimeout<MoveReactionResponse>(
      `${this.baseURL}/api/games/${gameId}/react`,
      {
        method: 'POST',
        body: JSON.stringify(reactionRequest)
      }
    );
  }

  /**
   * Send general chat message (without game context)
   */
  async sendGeneralChat(chatRequest: ChatRequest): Promise<ChatResponse> {
    return this.fetchWithTimeout<ChatResponse>(
      `${this.baseURL}/api/chat`,
      {
        method: 'POST',
        body: JSON.stringify(chatRequest)
      }
    );
  }

  /**
   * Delete a game
   */
  async deleteGame(gameId: number): Promise<void> {
    await this.fetchWithTimeout<void>(
      `${this.baseURL}/api/games/${gameId}`,
      {
        method: 'DELETE'
      }
    );
  }

  /**
   * Get list of all games
   */
  async listGames(): Promise<GameState[]> {
    return this.fetchWithTimeout<GameState[]>(
      `${this.baseURL}/api/games`
    );
  }

  /**
   * Load game from FEN notation
   */
  async loadFromFEN(gameId: number, fen: string): Promise<GameState> {
    return this.fetchWithTimeout<GameState>(
      `${this.baseURL}/api/games/${gameId}/fen`,
      {
        method: 'POST',
        body: JSON.stringify({ fen })
      }
    );
  }

  /**
   * Get position analysis
   */
  async analyzePosition(gameId: number): Promise<any> {
    return this.fetchWithTimeout<any>(
      `${this.baseURL}/api/games/${gameId}/analysis`
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.fetchWithTimeout<{ status: string }>(`${this.baseURL}/health`);
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ChessAPIClient();
