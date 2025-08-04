import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface GameState {
  id: string;
  board: string;
  currentPlayer: 'white' | 'black';
  status: 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  moveHistory: string[];
  lastMove?: { from: string; to: string; piece: string };
  error?: string;
}

export interface LegalMove {
  from: string;
  to: string;
  type: string;
  piece: string;
  notation: string;
  isCapture?: boolean;
  promotionPieces?: string[];
}

export interface MoveRequest {
  from?: string;
  to?: string;
  promotion?: string;
  notation?: string;
}

export interface AIHint {
  from: string;
  to: string;
  explanation: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChessService {
  private readonly API_BASE = 'http://localhost:8080';

  // Piece symbols mapping (Unicode chess symbols)
  readonly pieceSymbols: { [key: string]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  // Reactive state management
  private gameStateSubject = new BehaviorSubject<GameState | null>(null);
  private legalMovesSubject = new BehaviorSubject<LegalMove[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string>('');

  // Public observables
  gameState$ = this.gameStateSubject.asObservable();
  legalMoves$ = this.legalMovesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Create a new game
  createGame(): Observable<GameState> {
    this.setLoading(true);
    this.clearError();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(`${this.API_BASE}/api/games`, {}, { headers }).pipe(
      map((apiResponse: any) => {
        const gameState: GameState = {
          id: apiResponse.id.toString(),
          board: apiResponse.board,
          currentPlayer: apiResponse.active_color === 'white' ? 'white' : 'black',
          status: apiResponse.status === 'in_progress' ? 'active' : apiResponse.status,
          moveHistory: (apiResponse.move_history || []).map((move: any) =>
            typeof move === 'string' ? move : move.notation || `${move.from}${move.to}`
          )
        };
        this.gameStateSubject.next(gameState);
        this.legalMovesSubject.next([]);
        this.setLoading(false);
        return gameState;
      }),
      catchError(error => {
        this.setLoading(false);
        this.setError('Unable to create game. Please try again.');
        return throwError(() => error);
      })
    );
  }

  // Fetch current game state
  fetchGameState(gameId: string): Observable<GameState | null> {
    return this.http.get<any>(`${this.API_BASE}/api/games/${gameId}`).pipe(
      map((apiResponse: any) => {
        if (apiResponse.error === 'game_not_found') {
          this.setError('Game session lost. Please create a new game.');
          this.gameStateSubject.next(null);
          return null;
        }

        const gameState: GameState = {
          id: apiResponse.id.toString(),
          board: apiResponse.board,
          currentPlayer: apiResponse.active_color === 'white' ? 'white' : 'black',
          status: apiResponse.status === 'in_progress' ? 'active' : apiResponse.status,
          moveHistory: (apiResponse.move_history || []).map((move: any) =>
            typeof move === 'string' ? move : move.notation || `${move.from}${move.to}`
          )
        };

        this.gameStateSubject.next(gameState);
        this.clearError();
        return gameState;
      }),
      catchError(error => {
        if (error.status === 404) {
          this.setError('Game session lost. Please create a new game.');
          this.gameStateSubject.next(null);
          return throwError(() => new Error('Game not found'));
        }

        // Handle network errors (backend down/restarted)
        if (error.name === 'HttpErrorResponse' &&
            (error.message.includes('ERR_EMPTY_RESPONSE') ||
             error.message.includes('Failed to fetch') ||
             error.status === 0)) {
          this.setError('Game session lost. Please create a new game.');
          this.gameStateSubject.next(null);
        } else {
          this.setError('Unable to load game. Please try again.');
        }

        return throwError(() => error);
      })
    );
  }

  // Get legal moves for a square
  getLegalMoves(gameId: string, from?: string): Observable<LegalMove[]> {
    const url = from
      ? `${this.API_BASE}/api/games/${gameId}/legal-moves?from=${from}`
      : `${this.API_BASE}/api/games/${gameId}/legal-moves`;

    return this.http.get<any>(url).pipe(
      map((apiResponse: any) => {
        const moves = apiResponse.legal_moves || [];
        this.legalMovesSubject.next(moves);
        return moves;
      }),
      catchError(error => {
        this.legalMovesSubject.next([]);

        // Handle network errors (backend down/restarted)
        if (error.name === 'HttpErrorResponse' &&
            (error.message.includes('ERR_EMPTY_RESPONSE') ||
             error.message.includes('Failed to fetch') ||
             error.status === 0)) {
          this.setError('Game session lost. Please refresh the page to start a new game.');
        } else if (error.status === 404) {
          this.setError('Game session lost. Please refresh the page to start a new game.');
        }

        return throwError(() => error);
      })
    );
  }

  // Make a move
  makeMove(gameId: string, move: MoveRequest): Observable<GameState> {
    this.setLoading(true);

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(`${this.API_BASE}/api/games/${gameId}/moves`, move, { headers }).pipe(
      map((apiResponse: any) => {
        const gameState: GameState = {
          id: apiResponse.id.toString(),
          board: apiResponse.board,
          currentPlayer: apiResponse.active_color === 'white' ? 'white' : 'black',
          status: apiResponse.status === 'in_progress' ? 'active' : apiResponse.status,
          moveHistory: (apiResponse.move_history || []).map((move: any) =>
            typeof move === 'string' ? move : move.notation || `${move.from}${move.to}`
          )
        };
        this.gameStateSubject.next(gameState);
        this.legalMovesSubject.next([]);
        this.setLoading(false);
        return gameState;
      }),
      catchError(error => {
        this.setLoading(false);

        // Handle network errors (backend down/restarted)
        if (error.name === 'HttpErrorResponse' &&
            (error.message.includes('ERR_EMPTY_RESPONSE') ||
             error.message.includes('Failed to fetch') ||
             error.status === 0)) {
          this.setError('Game session lost. Please refresh the page to start a new game.');
          return of(this.gameStateSubject.value!);
        }

        // Provide specific error messages based on the error
        if (error.status === 400) {
          if (error.error && error.error.error) {
            this.setError(`Invalid move: ${error.error.error}`);
          } else {
            this.setError('Invalid move: This move is not allowed in the current position.');
          }
        } else if (error.status === 404) {
          this.setError('Game session lost. Please refresh the page to start a new game.');
        } else if (error.status === 500) {
          this.setError('Server error. Please try again.');
        } else {
          this.setError('Unable to make move. Please try again.');
        }

        // Don't re-throw the error to prevent cascading errors
        return of(this.gameStateSubject.value!);
      })
    );
  }

  // Request AI move
  requestAIMove(gameId: string): Observable<GameState> {
    this.setLoading(true);

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(`${this.API_BASE}/api/games/${gameId}/ai-move`, {}, { headers }).pipe(
      switchMap((response: any) => {
        // After AI move, fetch updated game state
        return this.fetchGameState(gameId);
      }),
      map((gameState: GameState | null) => {
        this.setLoading(false);
        if (!gameState) {
          throw new Error('Game state not found');
        }
        return gameState;
      }),
      catchError(error => {
        this.setLoading(false);

        // Handle network errors (backend down/restarted)
        if (error.name === 'HttpErrorResponse' &&
            (error.message.includes('ERR_EMPTY_RESPONSE') ||
             error.message.includes('Failed to fetch') ||
             error.status === 0)) {
          this.setError('Game session lost. Please refresh the page to start a new game.');
        } else if (error.status === 404) {
          this.setError('Game session lost. Please refresh the page to start a new game.');
        } else {
          this.setError('AI move failed. Please try again.');
        }

        return throwError(() => error);
      })
    );
  }

  // Get AI hint
  getAIHint(gameId: string): Observable<AIHint> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<AIHint>(`${this.API_BASE}/api/games/${gameId}/ai-hint`, {}, { headers }).pipe(
      catchError(error => {
        this.setError('Unable to get AI hint. Please try again.');
        return throwError(() => error);
      })
    );
  }

  // Undo last move
  undoMove(gameId: string): Observable<GameState> {
    // Create new game with moves minus the last two (player + AI)
    const currentState = this.gameStateSubject.value;
    if (!currentState || currentState.moveHistory.length === 0) {
      return throwError(() => new Error('No moves to undo'));
    }

    this.setLoading(true);

    // Create new game and replay moves except last two
    return this.createGame().pipe(
      switchMap(newGameState => {
        const movesToReplay = currentState.moveHistory.slice(0, -2);

        if (movesToReplay.length === 0) {
          this.setLoading(false);
          return new Observable<GameState>(observer => {
            observer.next(newGameState);
            observer.complete();
          });
        }

        // Replay moves
        return this.replayMoves(newGameState.id, movesToReplay);
      }),
      catchError(error => {
        this.setLoading(false);
        this.setError('Unable to undo move. Please try again.');
        return throwError(() => error);
      })
    );
  }

  // Helper method to replay moves
  private replayMoves(gameId: string, moves: string[]): Observable<GameState> {
    // This would need to parse and replay each move
    // For now, just return current state
    return this.fetchGameState(gameId).pipe(
      map(gameState => {
        if (!gameState) {
          throw new Error('Game state not found');
        }
        return gameState;
      })
    );
  }

  // Utility methods
  getPieceSymbol(piece: string): string {
    return this.pieceSymbols[piece] || piece;
  }

  isLightSquare(row: number, col: number): boolean {
    return (row + col) % 2 === 0;
  }

  parseBoard(boardString: string): string[][] {
    // Parse visual board string into 8x8 array
    const board: string[][] = [];
    const lines = boardString.split('\n').filter(line => line.trim() && /^[1-8]/.test(line.trim()));

    for (let i = 0; i < 8; i++) {
      board[i] = [];
      if (lines[i]) {
        // Extract pieces from line like "8 r n b q k b n r 8"
        const pieces = lines[i].split(' ').slice(1, 9); // Skip rank number and take 8 pieces
        for (let j = 0; j < 8; j++) {
          board[i][j] = pieces[j] === '.' ? ' ' : pieces[j];
        }
      } else {
        // Fill with empty squares if line is missing
        for (let j = 0; j < 8; j++) {
          board[i][j] = ' ';
        }
      }
    }
    return board;
  }

  squareToCoords(square: string): { row: number; col: number } {
    const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(square[1]);
    return { row, col };
  }

  coordsToSquare(row: number, col: number): string {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = (8 - row).toString();
    return file + rank;
  }

  // State management helpers
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next('');
  }

  // Get current state values
  getCurrentGameState(): GameState | null {
    return this.gameStateSubject.value;
  }

  getCurrentLegalMoves(): LegalMove[] {
    return this.legalMovesSubject.value;
  }
}
