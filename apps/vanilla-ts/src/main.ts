/**
 * Main application entry point
 */

import { GameController } from './components/game-controller.js';
import { initPGNSaves } from './components/pgn-saves.js';
import { Debug } from './utils/debug.js';
import { DebugUIManager } from './components/debug-ui-manager.js';

/**
 * Application class - manages the overall application lifecycle
 */
class ChessApp {
  private gameController: GameController;
  private debugUIManager: DebugUIManager;

  constructor() {
    // Initialize debug system first
    Debug.init();

    Debug.log('gameController', '🚀 ChessApp constructor starting...');
    this.gameController = new GameController();
    Debug.log('gameController', '✅ GameController created');

    // Initialize debug UI
    this.debugUIManager = new DebugUIManager();
    Debug.log('gameController', '✅ Debug UI Manager created');

    this.setupGlobalEventListeners();
    Debug.log('gameController', '✅ Global event listeners set up');
    this.init();
    Debug.log('gameController', '✅ ChessApp initialization complete');
  }

  /**
   * Initialize the application
   */
  private init(): void {
    Debug.log('gameController', '🎯 TypeScript Chess Game initialized');

    // Setup game controller event listeners
    this.gameController.on('gameStateChanged', (gameState) => {
      Debug.log('gameController', 'Game state updated:', gameState);
    });

    this.gameController.on('gameStarted', (gameState) => {
      Debug.log('gameController', 'New game started:', gameState);
    });

    this.gameController.on('gameEnded', (gameState) => {
      Debug.log('gameController', 'Game ended:', gameState.status);
    });

    this.gameController.on('errorOccurred', (error) => {
      Debug.error('gameController', 'Game error:', error);
      this.showErrorNotification(error.message);
    });
  }

  /**
   * Setup global event listeners
   */
  private setupGlobalEventListeners(): void {
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause timers when page is hidden
        Debug.log('gameController', 'Page hidden - pausing timers');
      } else {
        // Resume when page becomes visible
        Debug.log('gameController', 'Page visible - resuming');
      }
    });

    // Handle errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showErrorNotification('An unexpected error occurred');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showErrorNotification('Network or processing error occurred');
    });
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(message: string): void {
    // Create a simple error notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      max-width: 300px;
      font-size: 14px;
    `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Cleanup application resources
   */
  private cleanup(): void {
    this.gameController.destroy();
  }

  /**
   * Get game controller instance
   */
  getGameController(): GameController {
    return this.gameController;
  }

  /**
   * Get debug UI manager instance
   */
  getDebugUIManager(): DebugUIManager {
    return this.debugUIManager;
  }
}

// Global application instance
let chessApp: ChessApp;

/**
 * Initialize the application when DOM is ready
 */
function initializeApp(): void {
  chessApp = new ChessApp();
  // Initialize PGN/save manager now that controller exists
  try { initPGNSaves(chessApp.getGameController()); } catch {}

  // Make app globally accessible for debugging
  (window as any).chessApp = chessApp;
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential external access
export { ChessApp };
