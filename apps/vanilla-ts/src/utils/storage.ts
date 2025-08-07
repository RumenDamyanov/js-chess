/**
 * Storage utilities for game configuration and state persistence
 */

import { GameConfig, PieceColor, TimerMode, TimerState } from '../types/chess.js';

const STORAGE_KEY = 'chess-game-config';
const DEBUG_STORAGE_KEY = 'chess-debug-config-vanilla-ts';
const CONFIG_VERSION = '1.0.0';

/**
 * Default game configuration
 */
export const DEFAULT_CONFIG: GameConfig = {
  playerName: 'Player 1',
  playerColor: PieceColor.WHITE,
  enableUndo: true,
  enableHints: true,
  enableChat: true,
  enableTimer: true,
  timerMode: TimerMode.COUNT_UP,
  timeLimit: 10
};

/**
 * Debug configuration interface
 */
export interface DebugConfig {
  enabled: boolean;
  categories: {
    gameController: boolean;
    chessBoard: boolean;
    apiClient: boolean;
    configManager: boolean;
    chatManager: boolean;
    moveValidation: boolean;
    boardRendering: boolean;
    userInput: boolean;
  };
}

/**
 * Default debug configuration (all disabled by default)
 */
export const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  enabled: false,
  categories: {
    gameController: false,
    chessBoard: false,
    apiClient: false,
    configManager: false,
    chatManager: false,
    moveValidation: false,
    boardRendering: false,
    userInput: false
  }
};

/**
 * Cookie storage utilities
 */
export class CookieStorage {
  /**
   * Set a cookie with expiration
   */
  static setCookie(name: string, value: string, days: number = 365): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
  }

  /**
   * Get cookie value
   */
  static getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Delete a cookie
   */
  static deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}

/**
 * Stored configuration structure with versioning
 */
interface StoredConfig {
  version: string;
  config: GameConfig;
  timestamp: number;
}

/**
 * Game configuration storage manager
 */
export class ConfigStorage {
  /**
   * Save game configuration to cookies
   */
  static saveConfig(config: GameConfig): void {
    try {
      const storedConfig: StoredConfig = {
        config,
        version: CONFIG_VERSION,
        timestamp: Date.now()
      };

      const serialized = JSON.stringify(storedConfig);
      CookieStorage.setCookie(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save game configuration:', error);
    }
  }

  /**
   * Load game configuration from cookies
   */
  static loadConfig(): GameConfig {
    try {
      const serialized = CookieStorage.getCookie(STORAGE_KEY);

      if (!serialized) {
        return { ...DEFAULT_CONFIG };
      }

      const storedConfig: StoredConfig = JSON.parse(serialized);

      // Version compatibility check
      if (storedConfig.version !== CONFIG_VERSION) {
        console.warn(`Config version mismatch. Expected ${CONFIG_VERSION}, got ${storedConfig.version}`);
        return { ...DEFAULT_CONFIG };
      }

      // Validate and merge with defaults
      const config = this.validateConfig(storedConfig.config);
      return { ...DEFAULT_CONFIG, ...config };

    } catch (error) {
      console.error('Failed to load game configuration:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Reset configuration to defaults
   */
  static resetConfig(): void {
    CookieStorage.deleteCookie(STORAGE_KEY);
  }

  /**
   * Save timer state to cookies
   */
  static saveTimerState(timerState: Partial<TimerState>): void {
    try {
      const serialized = JSON.stringify(timerState);
      CookieStorage.setCookie('chess-timer-state', serialized, 1); // 1 day expiry for timer state
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  }

  /**
   * Load timer state from cookies
   */
  static loadTimerState(): Partial<TimerState> | null {
    try {
      const cookieValue = CookieStorage.getCookie('chess-timer-state');
      if (!cookieValue) {
        return null;
      }
      return JSON.parse(cookieValue) as Partial<TimerState>;
    } catch (error) {
      console.error('Failed to load timer state:', error);
      return null;
    }
  }

  /**
   * Clear timer state
   */
  static clearTimerState(): void {
    CookieStorage.deleteCookie('chess-timer-state');
  }

  /**
   * Validate configuration object
   */
  private static validateConfig(config: any): Partial<GameConfig> {
    const validated: Partial<GameConfig> = {};

    // Validate each field with type checking
    if (typeof config.playerName === 'string' && config.playerName.length > 0) {
      validated.playerName = config.playerName;
    }

    if (Object.values(PieceColor).includes(config.playerColor)) {
      validated.playerColor = config.playerColor;
    }

    if (typeof config.enableUndo === 'boolean') {
      validated.enableUndo = config.enableUndo;
    }

    if (typeof config.enableHints === 'boolean') {
      validated.enableHints = config.enableHints;
    }

    if (typeof config.enableChat === 'boolean') {
      validated.enableChat = config.enableChat;
    }

    if (typeof config.enableTimer === 'boolean') {
      validated.enableTimer = config.enableTimer;
    }

    if (Object.values(TimerMode).includes(config.timerMode)) {
      validated.timerMode = config.timerMode;
    }

    if (typeof config.timeLimit === 'number' && config.timeLimit > 0) {
      validated.timeLimit = config.timeLimit;
    }

    return validated;
  }

  /**
   * Save debug configuration to cookies
   */
  static saveDebugConfig(debugConfig: DebugConfig): void {
    try {
      const serialized = JSON.stringify(debugConfig);
      CookieStorage.setCookie(DEBUG_STORAGE_KEY, serialized, 365);
    } catch (error) {
      console.error('Failed to save debug configuration:', error);
    }
  }

  /**
   * Load debug configuration from cookies
   */
  static loadDebugConfig(): DebugConfig {
    try {
      const cookieValue = CookieStorage.getCookie(DEBUG_STORAGE_KEY);
      if (!cookieValue) {
        return { ...DEFAULT_DEBUG_CONFIG };
      }

      const debugConfig = JSON.parse(cookieValue) as DebugConfig;

      // Merge with defaults to ensure all categories exist
      return {
        enabled: debugConfig.enabled ?? DEFAULT_DEBUG_CONFIG.enabled,
        categories: {
          ...DEFAULT_DEBUG_CONFIG.categories,
          ...debugConfig.categories
        }
      };
    } catch (error) {
      console.error('Failed to load debug configuration:', error);
      return { ...DEFAULT_DEBUG_CONFIG };
    }
  }

  /**
   * Reset debug configuration to defaults
   */
  static resetDebugConfig(): void {
    CookieStorage.deleteCookie(DEBUG_STORAGE_KEY);
  }

  /**
   * Toggle debug category
   */
  static toggleDebugCategory(category: keyof DebugConfig['categories'], enabled?: boolean): void {
    const debugConfig = this.loadDebugConfig();

    if (enabled !== undefined) {
      debugConfig.categories[category] = enabled;
    } else {
      debugConfig.categories[category] = !debugConfig.categories[category];
    }

    this.saveDebugConfig(debugConfig);
  }

  /**
   * Toggle debug master switch
   */
  static toggleDebugEnabled(enabled?: boolean): void {
    const debugConfig = this.loadDebugConfig();

    if (enabled !== undefined) {
      debugConfig.enabled = enabled;
    } else {
      debugConfig.enabled = !debugConfig.enabled;
    }

    this.saveDebugConfig(debugConfig);
  }
}

/**
 * Session storage utilities for temporary data
 */
export class SessionStorage {
  /**
   * Set session data
   */
  static setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to set session item ${key}:`, error);
    }
  }

  /**
   * Get session data
   */
  static getItem<T>(key: string): T | null {
    try {
      const serialized = sessionStorage.getItem(key);
      if (serialized === null) return null;
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Failed to get session item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove session data
   */
  static removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all session data
   */
  static clear(): void {
    sessionStorage.clear();
  }
}
