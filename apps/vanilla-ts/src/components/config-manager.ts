/**
 * Game Configuration Manager Component
 */

import { GameConfig, PieceColor, TimerMode, TimerState } from '../types/chess.js';
import { ConfigStorage, DEFAULT_CONFIG } from '../utils/storage.js';
import { getElement, addEventListenerTyped } from '../utils/dom-utils.js';

export interface ConfigManagerEvents {
  configChanged: (config: GameConfig) => void;
  timerUpdate: (timerState: TimerState) => void;
}

/**
 * Manages game configuration and settings UI
 */
export class ConfigManager {
  private config: GameConfig;
  private timers: TimerState;
  private flipTimeout: number | null = null;
  private flipInProgress: boolean = false;
  private eventListeners: Partial<ConfigManagerEvents> = {};

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.timers = {
      white: 0,
      black: 0,
      activePlayer: PieceColor.WHITE,
      interval: null,
      startTime: null,
      gameStarted: false
    };

    this.init();
  }

  /**
   * Initialize the configuration manager
   */
  private init(): void {
    this.loadSettings();
    this.bindEvents();
    this.updateDisplay();
    this.applyConfig();
  }

  /**
   * Register event listener
   */
  on<K extends keyof ConfigManagerEvents>(event: K, listener: ConfigManagerEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof ConfigManagerEvents>(event: K, ...args: Parameters<ConfigManagerEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  /**
   * Bind UI event handlers
   */
  private bindEvents(): void {
    // Player name input
    const playerNameInput = getElement<HTMLInputElement>('#player-name');
    addEventListenerTyped(playerNameInput, 'input', () => {
      this.config.playerName = playerNameInput.value || 'Player 1';
      this.saveAndApplyConfig();
    });

    // Player color select
    const playerColorSelect = getElement<HTMLSelectElement>('#player-color');
    addEventListenerTyped(playerColorSelect, 'change', () => {
      this.config.playerColor = playerColorSelect.value as PieceColor;
      this.saveAndApplyConfig();
      this.scheduleFlipBoard();
    });

    // Feature toggles
    this.bindToggle('#enable-undo', 'enableUndo');
    this.bindToggle('#enable-hints', 'enableHints');
    this.bindToggle('#enable-chat', 'enableChat');
    this.bindToggle('#enable-timer', 'enableTimer');

    // Timer mode select
    const timerModeSelect = getElement<HTMLSelectElement>('#timer-mode');
    addEventListenerTyped(timerModeSelect, 'change', () => {
      this.config.timerMode = timerModeSelect.value as TimerMode;
      this.updateTimerModeDisplay();
      this.saveAndApplyConfig();
    });

    // Time limit select
    const timeLimitSelect = getElement<HTMLSelectElement>('#time-limit');
    addEventListenerTyped(timeLimitSelect, 'change', () => {
      this.config.timeLimit = parseInt(timeLimitSelect.value, 10);
      this.saveAndApplyConfig();
    });
  }

  /**
   * Bind a toggle checkbox to a config property
   */
  private bindToggle(selector: string, configKey: keyof GameConfig): void {
    const checkbox = getElement<HTMLInputElement>(selector);
    addEventListenerTyped(checkbox, 'change', () => {
      (this.config as any)[configKey] = checkbox.checked;
      this.saveAndApplyConfig();
    });
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): void {
    this.config = ConfigStorage.loadConfig();

    // Load timer state
    const savedTimerState = ConfigStorage.loadTimerState();
    if (savedTimerState) {
      this.timers = { ...this.timers, ...savedTimerState };
    }
  }

  /**
   * Save and apply configuration
   */
  private saveAndApplyConfig(): void {
    ConfigStorage.saveConfig(this.config);
    this.applyConfig();
    this.emit('configChanged', this.config);
  }

  /**
   * Save timer state to storage
   */
  private saveTimerState(): void {
    // Only save relevant timer state (not the interval or DOM references)
    const stateToSave = {
      white: this.timers.white,
      black: this.timers.black,
      activePlayer: this.timers.activePlayer,
      gameStarted: this.timers.gameStarted,
      startTime: this.timers.startTime
    };
    ConfigStorage.saveTimerState(stateToSave);
  }

  /**
   * Update UI display based on current configuration
   */
  private updateDisplay(): void {
    // Update input values
    getElement<HTMLInputElement>('#player-name').value = this.config.playerName;
    getElement<HTMLSelectElement>('#player-color').value = this.config.playerColor;
    getElement<HTMLInputElement>('#enable-undo').checked = this.config.enableUndo;
    getElement<HTMLInputElement>('#enable-hints').checked = this.config.enableHints;
    getElement<HTMLInputElement>('#enable-chat').checked = this.config.enableChat;
    getElement<HTMLInputElement>('#enable-timer').checked = this.config.enableTimer;
    getElement<HTMLSelectElement>('#timer-mode').value = this.config.timerMode;
    getElement<HTMLSelectElement>('#time-limit').value = this.config.timeLimit.toString();

    // Update player display
    getElement('#player-display').textContent = this.config.playerName;

    // Update timer mode display
    this.updateTimerModeDisplay();
  }

  /**
   * Update timer mode display visibility
   */
  private updateTimerModeDisplay(): void {
    const timeLimitGroup = getElement('#time-limit-group');
    const timerDisplay = getElement('#timer-display');

    if (this.config.enableTimer) {
      timerDisplay.style.display = 'block';
      timeLimitGroup.style.display = this.config.timerMode === TimerMode.COUNT_DOWN ? 'block' : 'none';
    } else {
      timerDisplay.style.display = 'none';
    }
  }

  /**
   * Apply configuration to UI elements
   */
  private applyConfig(): void {
    // Toggle button states
    getElement('#undo-btn').style.display = this.config.enableUndo ? 'block' : 'none';
    getElement('#hint-btn').style.display = this.config.enableHints ? 'block' : 'none';

    // Chat container
    const chatContainer = getElement('#chat-container');
    chatContainer.style.display = this.config.enableChat ? 'block' : 'none';

    // Timer display
    this.updateTimerModeDisplay();

    // Reset timers if timer settings changed
    if (this.config.enableTimer) {
      this.resetTimers();
    }
  }

  /**
   * Schedule board flip animation
   */
  private scheduleFlipBoard(): void {
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
    }

    if (this.flipInProgress) {
      return;
    }

    this.flipTimeout = window.setTimeout(() => {
      this.flipBoard();
      this.flipTimeout = null;
    }, 300);
  }

  /**
   * Flip the chess board
   */
  private flipBoard(): void {
    if (this.flipInProgress) return;

    this.flipInProgress = true;
    const chessBoard = getElement('#chess-board');

    chessBoard.classList.add('flipping');

    setTimeout(() => {
      chessBoard.classList.toggle('flipped', this.config.playerColor === PieceColor.BLACK);

      setTimeout(() => {
        chessBoard.classList.remove('flipping');
        this.flipInProgress = false;
      }, 150);
    }, 150);
  }

  /**
   * Timer management methods
   */
  startTimer(): void {
    if (!this.config.enableTimer || this.timers.gameStarted) return;

    this.timers.gameStarted = true;
    this.timers.startTime = Date.now();
    this.timers.activePlayer = PieceColor.WHITE;

    if (this.config.timerMode === TimerMode.COUNT_DOWN) {
      this.timers.white = this.config.timeLimit * 60;
      this.timers.black = this.config.timeLimit * 60;
    }

    this.updateTimerInterval();
    this.saveTimerState();
  }

  switchTimer(activePlayer: PieceColor): void {
    if (!this.config.enableTimer || !this.timers.gameStarted) return;

    this.timers.activePlayer = activePlayer;
    this.updateTimerInterval();
    this.saveTimerState();
  }

  pauseTimer(): void {
    if (this.timers.interval) {
      clearInterval(this.timers.interval);
      this.timers.interval = null;
    }
    this.saveTimerState();
  }

  resetTimers(): void {
    this.pauseTimer();
    this.timers.white = this.config.timerMode === TimerMode.COUNT_DOWN ? this.config.timeLimit * 60 : 0;
    this.timers.black = this.config.timerMode === TimerMode.COUNT_DOWN ? this.config.timeLimit * 60 : 0;
    this.timers.gameStarted = false;
    this.timers.startTime = null;
    this.updateTimerDisplay();
    this.saveTimerState();
  }

  private updateTimerInterval(): void {
    this.pauseTimer();

    this.timers.interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = this.timers.startTime ? (now - this.timers.startTime) / 1000 : 0;

      if (this.config.timerMode === TimerMode.COUNT_UP) {
        if (this.timers.activePlayer === PieceColor.WHITE) {
          this.timers.white = elapsed;
        } else {
          this.timers.black = elapsed;
        }
      } else {
        // Count down mode
        if (this.timers.activePlayer === PieceColor.WHITE) {
          this.timers.white = Math.max(0, this.config.timeLimit * 60 - elapsed);
        } else {
          this.timers.black = Math.max(0, this.config.timeLimit * 60 - elapsed);
        }

        // Check for time expiration
        if (this.timers.white <= 0 || this.timers.black <= 0) {
          this.pauseTimer();
          // Could emit a time-expired event here
        }
      }

      this.updateTimerDisplay();
      this.emit('timerUpdate', { ...this.timers });
    }, 1000);
  }

  private updateTimerDisplay(): void {
    const whiteTimerElement = getElement('#white-timer');
    const blackTimerElement = getElement('#black-timer');

    whiteTimerElement.textContent = this.formatTime(this.timers.white);
    blackTimerElement.textContent = this.formatTime(this.timers.black);

    // Highlight active player
    whiteTimerElement.classList.toggle('active', this.timers.activePlayer === PieceColor.WHITE);
    blackTimerElement.classList.toggle('active', this.timers.activePlayer === PieceColor.BLACK);
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Public getters
   */
  getConfig(): GameConfig {
    return { ...this.config };
  }

  getTimerState(): TimerState {
    return { ...this.timers };
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    ConfigStorage.resetConfig();
    this.config = { ...DEFAULT_CONFIG };
    this.updateDisplay();
    this.applyConfig();
    this.emit('configChanged', this.config);
  }
}
