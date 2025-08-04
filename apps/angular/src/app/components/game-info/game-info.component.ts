import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameState, AIHint } from '../../services/chess.service';

@Component({
  selector: 'app-game-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-info">
      <!-- Game Status -->
      <div class="status-section">
        <h3>Game Status</h3>
        <div class="status-card" *ngIf="gameState">
          <div class="current-player">
            <span class="player-indicator" [class]="gameState.currentPlayer">
              {{ gameState.currentPlayer === 'white' ? '♔' : '♚' }}
            </span>
            Current Player: {{ gameState.currentPlayer | titlecase }}
          </div>
          <div class="game-status" [class]="gameState.status">
            Status: {{ getStatusDisplay(gameState.status) }}
          </div>
        </div>
        <div class="no-game" *ngIf="!gameState">
          <p>No active game. Start a new game to begin!</p>
        </div>
      </div>

      <!-- Game Controls -->
      <div class="controls-section">
        <h3>Game Controls</h3>
        <div class="control-buttons">
          <button
            class="btn btn-primary"
            (click)="onNewGame()"
            [disabled]="loading"
          >
            {{ loading ? 'Loading...' : 'New Game' }}
          </button>

          <button
            class="btn btn-secondary"
            [class.active]="aiEnabled"
            (click)="onToggleAI()"
            [disabled]="loading"
          >
            AI: {{ aiEnabled ? 'ON' : 'OFF' }}
          </button>

          <button
            class="btn btn-info"
            (click)="onGetHint()"
            [disabled]="loading || !gameState || gameState.status !== 'active'"
          >
            Get Hint
          </button>

          <button
            class="btn btn-warning"
            (click)="onUndo()"
            [disabled]="loading || !gameState || gameState.moveHistory.length === 0"
          >
            Undo Move
          </button>
        </div>
      </div>

      <!-- AI Hint Display -->
      <div class="hint-section" *ngIf="aiHint">
        <h3>AI Hint</h3>
        <div class="hint-card">
          <div class="hint-move">
            <strong>Suggested Move:</strong> {{ aiHint.from }} → {{ aiHint.to }}
          </div>
          <div class="hint-explanation">
            <strong>Explanation:</strong> {{ aiHint.explanation }}
          </div>
          <button class="btn btn-small" (click)="onClearHint()">Clear Hint</button>
        </div>
      </div>

      <!-- Move History -->
      <div class="history-section">
        <h3>Move History</h3>
        <div class="move-history" *ngIf="gameState && gameState.moveHistory.length > 0">
          <div class="move-list">
            <div
              *ngFor="let move of gameState.moveHistory; let i = index"
              class="move-item"
              [class.white-move]="i % 2 === 0"
              [class.black-move]="i % 2 === 1"
            >
              <span class="move-number">{{ Math.floor(i / 2) + 1 }}{{ i % 2 === 0 ? '.' : '...' }}</span>
              <span class="move-notation">{{ move }}</span>
            </div>
          </div>
        </div>
        <div class="no-moves" *ngIf="!gameState || gameState.moveHistory.length === 0">
          <p>No moves yet</p>
        </div>
      </div>

      <!-- Error Display -->
      <div class="error-section" *ngIf="error">
        <div class="error-card">
          <div class="error-icon">⚠️</div>
          <div class="error-message">{{ error }}</div>
          <button class="btn btn-small" (click)="onClearError()">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./game-info.component.css']
})
export class GameInfoComponent {
  @Input() gameState: GameState | null = null;
  @Input() loading = false;
  @Input() error = '';
  @Input() aiEnabled = true;
  @Input() aiHint: AIHint | null = null;

  @Output() newGame = new EventEmitter<void>();
  @Output() toggleAI = new EventEmitter<void>();
  @Output() getHint = new EventEmitter<void>();
  @Output() undoMove = new EventEmitter<void>();
  @Output() clearError = new EventEmitter<void>();
  @Output() clearHint = new EventEmitter<void>();

  Math = Math; // Make Math available in template

  onNewGame(): void {
    this.newGame.emit();
  }

  onToggleAI(): void {
    this.toggleAI.emit();
  }

  onGetHint(): void {
    this.getHint.emit();
  }

  onUndo(): void {
    this.undoMove.emit();
  }

  onClearError(): void {
    this.clearError.emit();
  }

  onClearHint(): void {
    this.clearHint.emit();
  }

  getStatusDisplay(status: string): string {
    switch (status) {
      case 'active': return 'Game in Progress';
      case 'check': return 'Check!';
      case 'checkmate': return 'Checkmate!';
      case 'stalemate': return 'Stalemate';
      case 'draw': return 'Draw';
      default: return status;
    }
  }
}
