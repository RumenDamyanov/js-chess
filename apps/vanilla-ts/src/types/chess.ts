/**
 * Core type definitions for the Chess game
 */

// Fundamental chess types
export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black'
}

export enum PieceType {
  PAWN = 'pawn',
  ROOK = 'rook',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  QUEEN = 'queen',
  KING = 'king'
}

export enum GameStatus {
  IN_PROGRESS = 'in_progress',
  CHECK = 'check',
  WHITE_WINS = 'white_wins',
  BLACK_WINS = 'black_wins',
  DRAW = 'draw',
  STALEMATE = 'stalemate',
  CHECKMATE = 'checkmate'
}

export enum TimerMode {
  COUNT_UP = 'count-up',
  COUNT_DOWN = 'count-down'
}

export enum AIEngine {
  RANDOM = 'random',
  MINIMAX = 'minimax',
  LLM = 'llm'
}

export enum AILevel {
  BEGINNER = 'beginner',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

// Chess piece representation
export interface ChessPiece {
  readonly type: PieceType;
  readonly color: PieceColor;
  readonly position: Position;
  readonly hasMoved?: boolean;
}

// Board position
export interface Position {
  readonly file: string; // a-h
  readonly rank: number; // 1-8
}

// Chess move representation
export interface ChessMove {
  readonly from: string; // e.g., "d2"
  readonly to: string;   // e.g., "d4"
  readonly piece: string; // e.g., "P" for pawn
  readonly notation: string;
  readonly type?: string; // e.g., "normal"
  readonly promotion?: PieceType;
  readonly isCapture?: boolean;
  readonly isCastle?: boolean;
  readonly isEnPassant?: boolean;
  readonly isCheck?: boolean;
  readonly isCheckmate?: boolean;
}

// Game configuration
export interface GameConfig {
  playerName: string;
  playerColor: PieceColor;
  enableUndo: boolean;
  enableHints: boolean;
  enableChat: boolean;
  enableTimer: boolean;
  timerMode: TimerMode;
  timeLimit: number; // in minutes
}

// Timer state
export interface TimerState {
  white: number; // seconds
  black: number; // seconds
  activePlayer: PieceColor;
  interval: number | null;
  startTime: number | null;
  gameStarted: boolean;
}

// Move history entry
export interface MoveHistoryEntry {
  readonly move: ChessMove;
  readonly timestamp: number;
  readonly gameState: GameState;
}

// Complete game state
export interface GameState {
  readonly id: number;
  readonly status: GameStatus;
  readonly active_color: PieceColor;
  readonly ai_color?: PieceColor;
  readonly board: string; // FEN-like representation
  readonly fen?: string; // Full FEN string from backend (preferred over board when present)
  readonly move_count: number;
  readonly move_history: ChessMove[];
  readonly created_at: string;
  readonly pieces?: ChessPiece[];
  readonly is_check?: boolean;
  readonly is_checkmate?: boolean;
  readonly is_stalemate?: boolean;
}

// API request/response types
export interface CreateGameRequest {
  ai_color?: PieceColor;
}

export interface CreateGameResponse extends GameState {}

export interface MakeMoveRequest {
  from: string;
  to: string;
  promotion?: PieceType;
  notation?: string;
}

export interface MakeMoveResponse extends GameState {}

export interface AIRequest {
  level: AILevel;
  engine: AIEngine;
  provider?: string;
}

export interface AIResponse {
  move: ChessMove;
  evaluation?: number;
  depth?: number;
  thinking_time?: number;
}

export interface LegalMove {
  from: string;
  to: string;
  type: string;
  piece: string;
  notation: string;
}

export interface LegalMovesResponse {
  count?: number;
  legal_moves: LegalMove[];
}

// Chat-related types
export interface ChatMessage {
  readonly id: string;
  readonly type: 'user' | 'ai' | 'system';
  readonly content: string;
  readonly timestamp: number;
  readonly gameState?: Partial<GameState> | undefined;
}

export interface ChatRequest {
  message: string;
  provider?: string;
}

export interface ChatResponse {
  response: string;
  provider: string;
}

export interface MoveReactionRequest {
  move: string;
  provider?: string;
}

export interface MoveReactionResponse {
  reaction: string;
  provider: string;
}

// UI-related types
export interface SquareElement extends HTMLElement {
  dataset: {
    file: string;
    rank: string;
    piece?: string;
    color?: string;
  };
}

export interface DragState {
  isDragging: boolean;
  draggedPiece: ChessPiece | null;
  sourceSquare: Position | null;
  validMoves: Position[];
}

// Error types
export class ChessAPIError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: string
  ) {
    super(message);
    this.name = 'ChessAPIError';
  }
}

export class InvalidMoveError extends Error {
  constructor(message: string, public readonly move: Partial<ChessMove>) {
    super(message);
    this.name = 'InvalidMoveError';
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// Event types
export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface MoveEvent extends GameEvent {
  type: 'move';
  data: {
    move: ChessMove;
    gameState: GameState;
  };
}

export interface GameStatusEvent extends GameEvent {
  type: 'gameStatus';
  data: {
    status: GameStatus;
    gameState: GameState;
  };
}

export interface TimerEvent extends GameEvent {
  type: 'timer';
  data: {
    timerState: TimerState;
  };
}

export interface ChatEvent extends GameEvent {
  type: 'chat';
  data: {
    message: ChatMessage;
  };
}

// Configuration persistence
export interface StoredConfig {
  config: GameConfig;
  version: string;
  timestamp: number;
}
