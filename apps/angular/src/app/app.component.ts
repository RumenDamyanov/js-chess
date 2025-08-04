import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ChessService } from './services/chess.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HttpClientModule],
  providers: [ChessService],
  template: `
    <div class="app">
      <header class="app-header">
        <div class="header-container">
          <a href="http://localhost:3000" class="header-brand">
            <span class="header-title">♟️ JS Chess</span>
            <span class="header-framework">Angular</span>
          </a>

          <nav class="header-nav">
            <ul class="nav-links">
              <li><a href="http://localhost:3000" class="nav-link">🏠 Home</a></li>
              <li><span class="nav-separator"></span></li>
              <li><a href="http://localhost:3001" class="nav-link">📦 Vanilla</a></li>
              <li><a href="http://localhost:3002" class="nav-link">💙 jQuery</a></li>
              <li><a href="http://localhost:3003" class="nav-link">💚 Vue</a></li>
              <li><a href="http://localhost:3004" class="nav-link">⚛️ React</a></li>
              <li><a href="http://localhost:3005" class="nav-link active">🅰️ Angular</a></li>
            </ul>

            <div class="header-controls">
              <button (click)="newGame()" [disabled]="isLoading" class="btn btn-primary">
                {{ isLoading ? 'Loading...' : 'New Game' }}
              </button>
              <button (click)="toggleAI()" [class.active]="aiEnabled" class="btn">
                AI: {{ aiEnabled ? 'ON' : 'OFF' }}
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  isLoading = false;
  aiEnabled = true;

  private destroy$ = new Subject<void>();

  constructor(private chessService: ChessService) {}

  ngOnInit(): void {
    // Subscribe to loading state
    this.chessService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  newGame(): void {
    this.chessService.createGame()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gameState) => {
          console.log('New game created from header:', gameState.id);
        },
        error: (error) => {
          console.error('Failed to create game from header:', error);
        }
      });
  }

  toggleAI(): void {
    this.aiEnabled = !this.aiEnabled;
    // You could emit this to a service or communicate with child components
  }
}
