import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChessService, GameState, LegalMove, MoveRequest, AIHint } from '../../services/chess.service';
import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { GameInfoComponent } from '../game-info/game-info.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ChessBoardComponent, GameInfoComponent],
  template: `
    <div class="game-container">
      <div class="chess-section">
        <app-chess-board
          [gameState]="gameState"
          [legalMoves]="legalMoves"
          [loading]="loading"
          [aiHint]="aiHint"
          (moveMade)="onMoveMade($event)"
          (squareSelected)="onSquareSelected($event)"
        ></app-chess-board>
      </div>

      <div class="info-section">
        <app-game-info
          [gameState]="gameState"
          [loading]="loading"
          [error]="error"
          [aiEnabled]="aiEnabled"
          [aiHint]="aiHint"
          (newGame)="onNewGame()"
          (toggleAI)="onToggleAI()"
          (getHint)="onGetHint()"
          (undoMove)="onUndoMove()"
          (clearError)="onClearError()"
          (clearHint)="onClearHint()"
        ></app-game-info>
      </div>
    </div>
  `,
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  legalMoves: LegalMove[] = [];
  loading = false;
  error = '';
  aiEnabled = true;
  aiHint: AIHint | null = null;

  private destroy$ = new Subject<void>();

  constructor(private chessService: ChessService) {}

  ngOnInit(): void {
    // Subscribe to service observables
    this.chessService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(gameState => {
        this.gameState = gameState;

        // Auto-play AI move if it's AI's turn
        if (gameState && this.aiEnabled &&
            gameState.currentPlayer === 'black' &&
            (gameState.status === 'active' || gameState.status === 'check')) {
          setTimeout(() => this.requestAIMove(), 500); // Small delay for UX
        }
      });

    this.chessService.legalMoves$
      .pipe(takeUntil(this.destroy$))
      .subscribe(moves => {
        this.legalMoves = moves;
      });

    this.chessService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    this.chessService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = error;
      });

    // Start with a new game
    this.onNewGame();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNewGame(): void {
    this.aiHint = null;
    this.chessService.createGame()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gameState) => {
          console.log('New game created:', gameState.id);
        },
        error: (error) => {
          console.error('Failed to create game:', error);
        }
      });
  }

  onMoveMade(move: MoveRequest): void {
    if (!this.gameState) {
      return;
    }

    this.aiHint = null; // Clear any existing hint

    this.chessService.makeMove(this.gameState.id, move)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gameState) => {
          console.log('Move made:', move);
        },
        error: (error) => {
          console.error('Failed to make move:', error);
        }
      });
  }

  onSquareSelected(square: string): void {
    if (!this.gameState || !square) {
      return;
    }

    // Get legal moves for the selected square
    this.chessService.getLegalMoves(this.gameState.id, square)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (moves) => {
          console.log('Legal moves for', square, ':', moves);
        },
        error: (error) => {
          console.error('Failed to get legal moves:', error);
        }
      });
  }

  onToggleAI(): void {
    this.aiEnabled = !this.aiEnabled;

    // If AI is now enabled and it's black's turn, make an AI move
    if (this.aiEnabled && this.gameState &&
        this.gameState.currentPlayer === 'black' &&
        (this.gameState.status === 'active' || this.gameState.status === 'check')) {
      setTimeout(() => this.requestAIMove(), 500);
    }
  }

  onGetHint(): void {
    if (!this.gameState) {
      return;
    }

    this.chessService.getAIHint(this.gameState.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hint) => {
          this.aiHint = hint;
        },
        error: (error) => {
          console.error('Failed to get AI hint:', error);
        }
      });
  }

  onUndoMove(): void {
    if (!this.gameState) {
      return;
    }

    this.aiHint = null; // Clear any existing hint

    this.chessService.undoMove(this.gameState.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gameState) => {
          console.log('Move undone');
        },
        error: (error) => {
          console.error('Failed to undo move:', error);
        }
      });
  }

  onClearError(): void {
    // Clear error by calling a service method or directly setting
    this.error = '';
  }

  onClearHint(): void {
    this.aiHint = null;
  }

  private requestAIMove(): void {
    if (!this.gameState || !this.aiEnabled || this.loading) {
      return;
    }

    this.chessService.requestAIMove(this.gameState.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gameState) => {
          console.log('AI move completed');
        },
        error: (error) => {
          console.error('AI move failed:', error);
        }
      });
  }
}
