/**
 * Main Chess Game Controller - Orchestrates all components
 */

import {
  GameConfig,
  GameState,
  PieceColor,
  PieceType,
  ChessMove,
  Position,
  MakeMoveRequest,
  AILevel,
  AIEngine,
  GameStatus,
  InvalidMoveError
} from '../types/chess.js';
import { ChessAPIClient } from '../services/api-client.js';
import { ConfigManager } from './config-manager.js';
import { ChessBoard } from './chess-board.js';
import { ChatManager } from './chat-manager.js';
import { Debug } from '../utils/debug.js';
import { positionToNotation, parsePosition, oppositeColor } from '../utils/chess-utils.js';
import { getElement, addEventListenerTyped } from '../utils/dom-utils.js';

export interface GameControllerEvents {
  gameStateChanged: (gameState: GameState) => void;
  gameStarted: (gameState: GameState) => void;
  gameEnded: (gameState: GameState) => void;
  moveCompleted: (move: ChessMove, gameState: GameState) => void;
  errorOccurred: (error: Error) => void;
}

/**
 * Main game controller that coordinates all components
 */
export class GameController {
  private apiClient: ChessAPIClient;
  private configManager: ConfigManager;
  private chessBoard: ChessBoard;
  private chatManager: ChatManager;

  private gameState: GameState | null = null;
  private gameConfig: GameConfig;
  private isPlayerTurn: boolean = true;
  private isProcessingMove: boolean = false;
  private lastMoveTime: number = 0;
  private moveHistory: ChessMove[] = [];
  private eventListeners: Partial<GameControllerEvents> = {};
  private boardData: Record<string, string> = {}; // Track pieces by position like vanilla JS

  constructor() {
    this.apiClient = new ChessAPIClient();
    this.configManager = new ConfigManager();
    this.chessBoard = new ChessBoard();
    this.chatManager = new ChatManager(this.apiClient);
    this.gameConfig = this.configManager.getConfig();

    this.init();
  }

  /**
   * Register event listener
   */
  on<K extends keyof GameControllerEvents>(event: K, listener: GameControllerEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof GameControllerEvents>(event: K, ...args: Parameters<GameControllerEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  /**
   * Initialize the game controller
   */
  private init(): void {
    this.setupComponentListeners();
    this.setupUIEventListeners();
    this.updateUIFromConfig();
    this.startNewGame();
  }

  /**
   * Setup listeners for component events
   */
  private setupComponentListeners(): void {
    // Config manager events
    this.configManager.on('configChanged', (config) => {
      this.gameConfig = config;
      this.updateUIFromConfig();
      this.chessBoard.setPlayerColor(config.playerColor);
    });

    // Chess board events
    this.chessBoard.on('moveAttempted', (from, to) => {
      this.attemptMove(positionToNotation(from), positionToNotation(to));
    });

    this.chessBoard.on('pieceSelected', (piece, position) => {
      this.handlePieceSelection(piece, position);
    });

    // Chat manager events
    this.chatManager.on('messageReceived', (message) => {
      Debug.log('chatManager', 'Chat message received:', message.content);
    });

    this.chatManager.on('errorOccurred', (error) => {
      this.handleError(error);
    });
  }

  /**
   * Setup UI event listeners
   */
  private setupUIEventListeners(): void {
    // New game button
    const newGameBtn = getElement('#new-game-btn');
    addEventListenerTyped(newGameBtn, 'click', () => {
      this.startNewGame();
    });

    // Undo button
    const undoBtn = getElement('#undo-btn');
    addEventListenerTyped(undoBtn, 'click', () => {
      this.undoLastMove();
    });

    // Hint button
    const hintBtn = getElement('#hint-btn');
    addEventListenerTyped(hintBtn, 'click', () => {
      this.getHint();
    });
  }

  /**
   * Update UI based on current configuration
   */
  private updateUIFromConfig(): void {
    this.chessBoard.setPlayerColor(this.gameConfig.playerColor);
    this.chatManager.setEnabled(this.gameConfig.enableChat);

    // Update UI button visibility is handled by ConfigManager
  }

  /**
   * Start a new game
   */
  async startNewGame(): Promise<void> {
    try {
      this.isProcessingMove = true;
      this.updateGameStatus('Starting new game...');

      // Create new game via API
      const gameState = await this.apiClient.createGame(this.gameConfig.playerColor);
      this.gameState = gameState;
      this.moveHistory = [];
      this.isPlayerTurn = gameState.active_color === this.gameConfig.playerColor;

      // Update board data for pawn promotion checks
      this.updateBoardData();

      // Update components
      this.chessBoard.updateGameState(gameState);
      this.chessBoard.setLastMove(null);
      this.chatManager.setGameState(gameState.id, gameState);
      this.chatManager.clearMessages();

      // Reset timers but don't start until first move
      if (this.gameConfig.enableTimer) {
        this.configManager.resetTimers();
      }

      // Update UI
      this.updateGameInfo();
      this.updateMoveHistory([]);

      this.emit('gameStarted', gameState);

      // If AI plays first, make the first move
      if (gameState.active_color !== this.gameConfig.playerColor) {
        setTimeout(() => this.makeAIMove(), 1000);
      }

    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to start new game'));
    } finally {
      this.isProcessingMove = false;
    }
  }

  /**
   * Attempt to make a move
   */
  private async attemptMove(from: string, to: string): Promise<void> {
    if (!this.gameState || this.isProcessingMove || !this.isPlayerTurn) {
      return;
    }

    Debug.log('moveValidation', '🎯 ATTEMPTING MOVE:', from, '→', to);
    Debug.log('moveValidation', '🎯 Current board state BEFORE move:', this.gameState.board);
    Debug.log('moveValidation', '🎯 Board data before move:', this.boardData);
    Debug.log('moveValidation', '🎯 Piece at FROM position:', this.boardData[from]);
    Debug.log('moveValidation', '🎯 Piece at TO position:', this.boardData[to]);

    // Debounce fast clicks - minimum 200ms between moves
    const now = Date.now();
    if (now - this.lastMoveTime < 200) {
      Debug.warn('moveValidation', '⏰ Move debounced, too fast');
      return;
    }
    this.lastMoveTime = now;

    try {
      this.isProcessingMove = true;

      // Check if this is a special move (like castling) by finding the matching valid move
      let moveRequest: MakeMoveRequest;

      try {
        const legalMoves = await this.apiClient.getLegalMoves(this.gameState.id);
        const specialMove = legalMoves.legal_moves.find(move =>
          move.from === from && move.to === to && (move.type === 'castling' || move.type === 'en_passant'));

        if (specialMove) {
          // For special moves, send the notation instead of from/to
          moveRequest = {
            from: from,
            to: to,
            notation: specialMove.notation
          };
        } else {
          // Regular move - check for pawn promotion
          moveRequest = {
            from: from,
            to: to
          };

          // Check if this is a pawn promotion
          Debug.log('moveValidation', '🚀 About to check pawn promotion for move:', from, 'to', to);
          Debug.log('moveValidation', '🚀 Current game state board:', this.gameState?.board);
          if (this.isPawnPromotion(from, to)) {
            Debug.log('moveValidation', '✅ Pawn promotion detected, showing dialog');
            const promotionChar: string | null = await this.getPromotionChoice();
            if (!promotionChar) {
              // User cancelled promotion
              Debug.warn('moveValidation', '❌ User cancelled promotion');
              this.isProcessingMove = false;
              return;
            }
            Debug.log('moveValidation', '✅ User chose promotion piece:', promotionChar);
            // Send the raw character like vanilla JS does, not the converted enum
            (moveRequest as any).promotion = promotionChar;
          } else {
            Debug.log('moveValidation', 'No pawn promotion detected for this move');
          }
        }
      } catch (error) {
        Debug.warn('gameController', 'Could not get legal moves, trying regular move:', error);
        // If we can't get legal moves, just try the regular move
        moveRequest = {
          from: from,
          to: to
        };

        // Still check for pawn promotion even if legal moves failed
        if (this.isPawnPromotion(from, to)) {
          const promotionChar: string | null = await this.getPromotionChoice();
          if (!promotionChar) {
            this.isProcessingMove = false;
            return;
          }
          // Send the raw character like vanilla JS does, not the converted enum
          (moveRequest as any).promotion = promotionChar;
        }
      }

      // Make move via API
      Debug.log('apiClient', 'Sending move request to API:', JSON.stringify(moveRequest, null, 2));
      const updatedGameState = await this.apiClient.makeMove(this.gameState.id, moveRequest);

      // Get the move that was actually made
      const newMove = updatedGameState.move_history[updatedGameState.move_history.length - 1];
      if (newMove) {
        await this.chessBoard.animateMove(parsePosition(from), parsePosition(to));
      }

      await this.updateGameState(updatedGameState);

      // Start timer on first move if enabled
      if (this.gameConfig.enableTimer) {
        // Check if this is the first move by looking at timer state
        const timerState = this.configManager.getTimerState();
        if (!timerState.gameStarted) {
          this.configManager.startTimer();
        }
        this.configManager.switchTimer(updatedGameState.active_color);
      }

      // Check if game ended
      if (this.isGameEnded(updatedGameState.status)) {
        this.handleGameEnd(updatedGameState);
        return;
      }

      // Make AI move if it's AI's turn
      if (updatedGameState.active_color !== this.gameConfig.playerColor) {
        setTimeout(() => this.makeAIMove(), 1000); // Brief delay for better UX
      }

    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Invalid move'));
    } finally {
      this.isProcessingMove = false;
    }
  }

  /**
   * Make AI move
   */
  /**
   * Make AI move
   */
  private async makeAIMove(): Promise<void> {
    if (!this.gameState || this.isProcessingMove) {
      return;
    }

    try {
      this.isProcessingMove = true;

      // First verify the game still exists
      try {
        await this.apiClient.getGame(this.gameState.id);
      } catch (error) {
        console.error('Game no longer exists, starting new game');
        this.startNewGame();
        return;
      }

      const aiRequest = {
        level: AILevel.MEDIUM,
        engine: AIEngine.RANDOM
      };

      const aiResponse = await this.apiClient.getAIMove(this.gameState.id, aiRequest);

      if (aiResponse.move) {
        // Make the AI move
        const moveRequest: MakeMoveRequest = {
          from: aiResponse.move.from,
          to: aiResponse.move.to
        };

        const updatedGameState = await this.apiClient.makeMove(this.gameState.id, moveRequest);

        // Animate AI move
        await this.chessBoard.animateMove(
          parsePosition(aiResponse.move.from),
          parsePosition(aiResponse.move.to)
        );

        await this.updateGameState(updatedGameState);

        // Switch timer if enabled
        if (this.gameConfig.enableTimer) {
          this.configManager.switchTimer(updatedGameState.active_color);
        }

        // Check if game ended
        if (this.isGameEnded(updatedGameState.status)) {
          this.handleGameEnd(updatedGameState);
        }
      }

    } catch (error) {
      console.error('AI move failed:', error);
      // If AI move fails, just reset the processing flag and continue
      // Don't show error to user as this could be temporary
    } finally {
      this.isProcessingMove = false;
    }
  }

  /**
   * Update game state across all components
   */
  private async updateGameState(gameState: GameState): Promise<void> {
    this.gameState = gameState;
    this.isPlayerTurn = gameState.active_color === this.gameConfig.playerColor;

    // Update board data for pawn promotion checks
    this.updateBoardData();

    // Update components
    this.chessBoard.updateGameState(gameState);
    this.chatManager.setGameState(gameState.id, gameState);

    // Set last move highlight
    if (gameState.move_history.length > 0) {
      const lastMove = gameState.move_history[gameState.move_history.length - 1];
      this.chessBoard.setLastMove(lastMove || null);
    }

    // Load valid moves for current position
    try {
      const legalMoves = await this.apiClient.getLegalMoves(gameState.id);
      this.chessBoard.setValidMoves(legalMoves.legal_moves);
    } catch (error) {
      Debug.warn('gameController', 'Failed to load legal moves:', error);
    }

    // Update UI
    this.updateGameInfo();
    this.updateMoveHistory(gameState.move_history);

    this.emit('gameStateChanged', gameState);
  }

  /**
   * Handle piece selection for move hints
   */
  private async handlePieceSelection(piece: any, position: Position): Promise<void> {
    if (!this.gameState) {
      return;
    }

    try {
      const legalMoves = await this.apiClient.getLegalMoves(this.gameState.id);

      // Filter moves that start from the selected position
      const fromNotation = positionToNotation(position);
      const validMovesFromPosition = legalMoves.legal_moves
        .filter(move => move.from === fromNotation);

      // Set valid moves on the chess board for highlighting
      this.chessBoard.setValidMoves(validMovesFromPosition);

    } catch (error) {
      // If legal moves endpoint fails, just set empty moves - don't log error
      this.chessBoard.setValidMoves([]);
    }
  }

  /**
   * Undo last move by creating a new game and replaying moves
   */
  private async undoLastMove(): Promise<void> {
    if (!this.gameConfig.enableUndo || !this.gameState || this.isProcessingMove) {
      return;
    }

    if (!this.gameState.move_history || this.gameState.move_history.length === 0) {
      this.updateGameStatus('No moves to undo');
      return;
    }

    const playerColor = this.gameConfig.playerColor;
    const currentTurn = this.gameState.active_color;

    // Player can only undo when it's not their turn (after AI has responded)
    // or when they have at least one move to undo
    if (currentTurn === playerColor && this.gameState.move_history.length < 2) {
      this.updateGameStatus('No moves to undo yet');
      return;
    }

    try {
      this.updateGameStatus('Undoing last move...');
      this.isProcessingMove = true;

      Debug.log('gameController', 'Starting undo process - creating new game');

      // Create a new game
      const newGameState = await this.apiClient.createGame(playerColor);

      // Determine how many moves to undo based on player color and current state
      let movesToReplay = [...this.gameState.move_history];

      if (playerColor === PieceColor.WHITE) {
        // For white player: undo both player and AI moves so player can try again
        if (currentTurn === PieceColor.WHITE && movesToReplay.length >= 2) {
          // It's white's turn, so undo the last AI (black) move and the player's previous move
          movesToReplay = movesToReplay.slice(0, -2);
        } else if (currentTurn === PieceColor.BLACK && movesToReplay.length >= 1) {
          // It's black's turn (AI), so just undo the player's last move
          movesToReplay = movesToReplay.slice(0, -1);
        }
      } else {
        // For black player: undo both AI and player moves so player can try again
        if (currentTurn === PieceColor.BLACK && movesToReplay.length >= 2) {
          // It's black's turn (player), so undo the last AI (white) move and player's previous move
          movesToReplay = movesToReplay.slice(0, -2);
        } else if (currentTurn === PieceColor.WHITE && movesToReplay.length >= 1) {
          // It's white's turn (AI), so just undo the player's last move
          movesToReplay = movesToReplay.slice(0, -1);
        }
      }

      Debug.log('gameController', `Replaying ${movesToReplay.length} moves after undo`);

      // Update our game state to the new game
      this.gameState = newGameState;

      // Replay the moves
      let currentGameState = newGameState;
      for (const move of movesToReplay) {
        const moveRequest: MakeMoveRequest = {
          from: move.from,
          to: move.to
        };

        if (move.promotion) {
          (moveRequest as any).promotion = move.promotion;
        }

        currentGameState = await this.apiClient.makeMove(currentGameState.id, moveRequest);
      }

      // Update to the final state after replay
      this.gameState = currentGameState;

      // Update the board display
      this.chessBoard.updateGameState(this.gameState);

      // Update UI
      this.updateGameStatus('Ready');
      this.updateGameStatus('Move undone successfully');

      Debug.log('gameController', 'Undo completed successfully');

    } catch (error) {
      Debug.error('gameController', 'Failed to undo move:', error);
      this.handleError(error instanceof Error ? error : new Error('Failed to undo move'));
    } finally {
      this.isProcessingMove = false;
    }
  }

  /**
   * Get AI hint for current position
   */
  private async getHint(): Promise<void> {
    if (!this.gameConfig.enableHints || !this.gameState || this.isProcessingMove) {
      return;
    }

    // Check if it's the player's turn
    const playerColor = this.gameConfig.playerColor;
    const currentTurn = this.gameState.active_color;

    if (currentTurn !== playerColor) {
      this.updateGameStatus('Wait for your turn to get a hint');
      return;
    }

    // Check if game is over
    if (this.gameState.status !== GameStatus.IN_PROGRESS && this.gameState.status !== GameStatus.CHECK) {
      this.updateGameStatus('Game is over - no hints available');
      return;
    }

    try {
      this.updateGameStatus('Getting hint...');

      const aiRequest = {
        level: AILevel.MEDIUM,
        engine: AIEngine.RANDOM
      };

      const hintResponse = await this.apiClient.getAIHint(this.gameState.id, aiRequest);

      // Try both response formats - vanilla-js style (direct from/to) and TypeScript style (nested move)
      let moveData: { from: string; to: string; notation?: string } | null = null;

      if ((hintResponse as any).from && (hintResponse as any).to) {
        // Vanilla-js style response
        moveData = {
          from: (hintResponse as any).from,
          to: (hintResponse as any).to,
          notation: (hintResponse as any).explanation
        };
      } else if (hintResponse.move && hintResponse.move.from && hintResponse.move.to) {
        // TypeScript style response
        moveData = {
          from: hintResponse.move.from,
          to: hintResponse.move.to,
          notation: hintResponse.move.notation
        };
      }

      if (moveData) {
        const explanation = moveData.notation || `Move from ${moveData.from} to ${moveData.to}`;
        this.updateGameStatus(`💡 Hint: ${explanation}`);

        Debug.log('gameController', `Hint received: ${explanation}`);

        // Create a minimal ChessMove object for highlighting
        const hintMove: ChessMove = {
          from: moveData.from,
          to: moveData.to,
          piece: 'P', // Placeholder - the highlighting doesn't need the actual piece
          notation: moveData.notation || `${moveData.from}-${moveData.to}`
        };

        // Highlight suggested move on board
        this.chessBoard.highlightHint(hintMove);
      } else {
        Debug.log('gameController', 'Invalid hint response structure:', hintResponse);
        this.updateGameStatus('No hint available at this time');
      }

    } catch (error) {
      Debug.error('gameController', 'Failed to get hint:', error);
      this.updateGameStatus('Unable to get hint - try again later');
    }
  }

  /**
   * Update game information display
   */
  private updateGameInfo(): void {
    if (!this.gameState) return;

    const currentPlayerElement = getElement('#current-player');
    const gameStatusElement = getElement('#game-status');
    const moveCountElement = getElement('#move-count');

    currentPlayerElement.textContent = this.gameState.active_color;
    gameStatusElement.textContent = this.formatGameStatus(this.gameState.status);
    moveCountElement.textContent = Math.ceil(this.gameState.move_count / 2).toString();
  }

  /**
   * Update move history display
   */
  private updateMoveHistory(moves: ChessMove[]): void {
    const moveListElement = getElement('#move-list');
    moveListElement.innerHTML = '';

    if (moves.length === 0) {
      const startItem = getElement('#move-list').appendChild(
        document.createElement('div')
      );
      startItem.className = 'move-item';
      startItem.innerHTML = '<span class="move-number">-</span><span class="move-notation">Game started</span>';
      return;
    }

    moves.forEach((move, index) => {
      const moveItem = document.createElement('div');
      moveItem.className = 'move-item';

      const moveNumber = Math.ceil((index + 1) / 2);
      const isWhiteMove = index % 2 === 0;

      moveItem.innerHTML = `
        <span class="move-number">${moveNumber}${isWhiteMove ? '.' : '...'}</span>
        <span class="move-notation">${move.notation}</span>
      `;

      moveListElement.appendChild(moveItem);
    });

    // Scroll to bottom
    moveListElement.scrollTop = moveListElement.scrollHeight;
  }

  /**
   * Update game status message
   */
  private updateGameStatus(status: string): void {
    const gameStatusElement = getElement('#game-status');
    gameStatusElement.textContent = status;
  }

  /**
   * Format game status for display
   */
  private formatGameStatus(status: GameStatus): string {
    switch (status) {
      case GameStatus.IN_PROGRESS: return 'In Progress';
      case GameStatus.CHECK: return 'Check';
      case GameStatus.WHITE_WINS: return 'White Wins';
      case GameStatus.BLACK_WINS: return 'Black Wins';
      case GameStatus.DRAW: return 'Draw';
      case GameStatus.STALEMATE: return 'Stalemate';
      case GameStatus.CHECKMATE: return 'Checkmate';
      default: return status;
    }
  }

  /**
   * Check if game has ended
   */
  private isGameEnded(status: GameStatus): boolean {
    return status !== GameStatus.IN_PROGRESS && status !== GameStatus.CHECK;
  }

  /**
   * Handle game end
   */
  private handleGameEnd(gameState: GameState): void {
    if (this.gameConfig.enableTimer) {
      this.configManager.pauseTimer();
    }

    this.updateGameStatus(this.formatGameStatus(gameState.status));
    this.emit('gameEnded', gameState);

    Debug.log('gameController', 'Game ended:', gameState.status);
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Game error:', error);
    this.updateGameStatus(`Error: ${error.message}`);
    this.emit('errorOccurred', error);
  }

  /**
   * Get current game state
   */
  getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * Get current configuration
   */
  getConfig(): GameConfig {
    return this.gameConfig;
  }

  /**
   * Check if a move is a pawn promotion (using vanilla JS logic)
   */
  private isPawnPromotion(from: string, to: string): boolean {
    // Get the piece at the FROM position from our local board data
    const piece = this.boardData[from];

    Debug.log('moveValidation', 'Checking pawn promotion:', { from, to, piece });

    if (!piece || piece.toLowerCase() !== 'p') {
      Debug.log('moveValidation', 'Not a pawn, piece =', piece);
      return false;
    }

    const toRank = parseInt(to[1] || '0');
    const isWhitePawn = piece === 'P';
    const isBlackPawn = piece === 'p';

    const isPromotion = (isWhitePawn && toRank === 8) || (isBlackPawn && toRank === 1);

    Debug.log('moveValidation', 'Promotion check result:', {
      piece,
      toRank,
      isWhitePawn,
      isBlackPawn,
      isPromotion
    });

    return isPromotion;
  }  /**
   * Parse board string and populate boardData (like vanilla JS)
   */
  private updateBoardData(): void {
    if (!this.gameState || !this.gameState.board) return;

    Debug.log('boardRendering', '🎯 Updating board data from:', this.gameState.board);

    // Parse the board string from the API
    const boardLines = this.gameState.board.split('\n');
    this.boardData = {}; // Reset board data

    for (let i = 1; i <= 8; i++) {
      const line = boardLines[i];
      if (line) {
        const squares = line.split(' ');
        for (let j = 0; j < 8; j++) {
          const file = String.fromCharCode(97 + j); // a-h
          const rank = 9 - i; // 8-1
          const position = file + rank;
          const piece = squares[j + 1] || '.'; // Skip rank number, default to '.'
          this.boardData[position] = piece === '.' ? '' : piece;
        }
      }
    }

    Debug.log('boardRendering', '🎯 Board data updated:', this.boardData);
  }  /**
   * Convert single character promotion piece to PieceType
   */
  private charToPieceType(char: string): PieceType {
    switch (char) {
      case 'Q': return PieceType.QUEEN;
      case 'R': return PieceType.ROOK;
      case 'B': return PieceType.BISHOP;
      case 'N': return PieceType.KNIGHT;
      default: return PieceType.QUEEN; // Default to queen
    }
  }

  /**
   * Show promotion dialog and get user choice (using vanilla JS format)
   */
  private async getPromotionChoice(): Promise<string | null> {
    return new Promise((resolve) => {
      // Create promotion dialog
      const dialog = document.createElement('div');
      dialog.className = 'promotion-dialog';
      dialog.innerHTML = `
        <div class="promotion-content">
          <h3>Choose promotion piece:</h3>
          <div class="promotion-pieces">
            <button class="promotion-btn" data-piece="Q">♕ Queen</button>
            <button class="promotion-btn" data-piece="R">♖ Rook</button>
            <button class="promotion-btn" data-piece="B">♗ Bishop</button>
            <button class="promotion-btn" data-piece="N">♘ Knight</button>
          </div>
          <button class="promotion-cancel">Cancel</button>
        </div>
      `;

      // Add event listeners
      dialog.querySelectorAll('.promotion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const piece = (btn as HTMLElement).dataset.piece;
          document.body.removeChild(dialog);
          resolve(piece || null);
        });
      });

      dialog.querySelector('.promotion-cancel')?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(null);
      });

      // Add to page
      document.body.appendChild(dialog);
    });
  }

  /**
   * Debug method to set up a pawn promotion test scenario
   * Places a white pawn on f7 ready to promote
   */
  async setupPawnPromotionTest(): Promise<void> {
    try {
      // Create a custom board state with a white pawn on f7
      const testBoard = [
        "8 r . . . k . . r",
        "7 . . . . . P . .", // White pawn on f7 ready to promote
        "6 . . . . . . . .",
        "5 . . . . . . . .",
        "4 . . . . . . . .",
        "3 . . . . . . . .",
        "2 . . . . . . . .",
        "1 R . . . K . . R"
      ].join('\n');

      // Create a minimal game state for testing
      const testGameState: GameState = {
        id: 999,
        board: testBoard,
        active_color: 'white' as PieceColor,
        status: 'active' as GameStatus,
        move_count: 10,
        move_history: [],
        created_at: new Date().toISOString(),
        is_check: false
      };

      this.gameState = testGameState;
      this.updateBoardData();
      this.chessBoard.updateGameState(testGameState);
      this.isPlayerTurn = true;

      Debug.log('gameController', '🧪 Pawn promotion test scenario set up!');
      Debug.log('gameController', 'Board data:', this.boardData);
      Debug.log('gameController', 'White pawn on f7 - move to f8 to trigger promotion');

    } catch (error) {
      Debug.error('gameController', 'Failed to set up test scenario:', error);
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.configManager.pauseTimer();
    this.chessBoard.destroy();
    this.chatManager.destroy();
  }
}
