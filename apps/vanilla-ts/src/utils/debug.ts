/**
 * Debug utility for conditional logging throughout the application
 */

import { ConfigStorage, DebugConfig } from './storage.js';

export type DebugCategory = keyof DebugConfig['categories'];

/**
 * Debug utility class for managing conditional console logging
 */
export class Debug {
  private static debugConfig: DebugConfig | null = null;
  private static uiRefreshCallbacks: (() => void)[] = [];

  /**
   * Register a callback to be called when debug config changes
   */
  static onConfigChange(callback: () => void): void {
    this.uiRefreshCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks that config has changed
   */
  private static notifyConfigChange(): void {
    this.uiRefreshCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Debug UI refresh callback failed:', error);
      }
    });
  }

  /**
   * Initialize debug configuration
   */
  static init(): void {
    this.debugConfig = ConfigStorage.loadDebugConfig();

    // Make debug utilities globally accessible for console debugging
    (window as any).debug = {
      enable: () => this.enable(),
      disable: () => this.disable(),
      toggle: () => this.toggle(),
      enableCategory: (category: DebugCategory) => this.enableCategory(category),
      disableCategory: (category: DebugCategory) => this.disableCategory(category),
      toggleCategory: (category: DebugCategory) => this.toggleCategory(category),
      getConfig: () => this.getConfig(),
      test: () => this.testAllCategories()
    };
  }

  /**
   * Get current debug configuration
   */
  static getConfig(): DebugConfig {
    if (!this.debugConfig) {
      this.debugConfig = ConfigStorage.loadDebugConfig();
    }
    return this.debugConfig;
  }

  /**
   * Check if debug is enabled and category is active
   */
  static isEnabled(category: DebugCategory): boolean {
    const config = this.getConfig();
    return config.enabled && config.categories[category];
  }

  /**
   * Log message if debug is enabled for the category
   */
  static log(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      const prefix = `🐛 [${category.toUpperCase()}]`;
      console.log(prefix, message, ...args);
    }
  }

  /**
   * Log error message if debug is enabled for the category
   */
  static error(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      const prefix = `❌ [${category.toUpperCase()}]`;
      console.error(prefix, message, ...args);
    }
  }

  /**
   * Log warning message if debug is enabled for the category
   */
  static warn(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      const prefix = `⚠️ [${category.toUpperCase()}]`;
      console.warn(prefix, message, ...args);
    }
  }

  /**
   * Log info message if debug is enabled for the category
   */
  static info(category: DebugCategory, message: string, ...args: any[]): void {
    if (this.isEnabled(category)) {
      const prefix = `ℹ️ [${category.toUpperCase()}]`;
      console.info(prefix, message, ...args);
    }
  }

  /**
   * Group logging for related messages
   */
  static group(category: DebugCategory, title: string, callback: () => void): void {
    if (this.isEnabled(category)) {
      const prefix = `📋 [${category.toUpperCase()}]`;
      console.group(prefix, title);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Enable debug logging
   */
  static enable(): void {
    ConfigStorage.toggleDebugEnabled(true);
    this.debugConfig = null; // Force reload
    this.notifyConfigChange();
    console.log('🐛 Debug logging enabled for vanilla-ts chess app');
  }

  /**
   * Disable debug logging
   */
  static disable(): void {
    ConfigStorage.toggleDebugEnabled(false);
    this.debugConfig = null; // Force reload
    this.notifyConfigChange();
    console.log('🐛 Debug logging disabled for vanilla-ts chess app');
  }

  /**
   * Toggle debug logging
   */
  static toggle(): void {
    const config = this.getConfig();
    if (config.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Enable specific debug category
   */
  static enableCategory(category: DebugCategory): void {
    ConfigStorage.toggleDebugCategory(category, true);
    this.debugConfig = null; // Force reload
    this.notifyConfigChange();
    console.log(`🐛 Debug category '${category}' enabled`);
  }

  /**
   * Disable specific debug category
   */
  static disableCategory(category: DebugCategory): void {
    ConfigStorage.toggleDebugCategory(category, false);
    this.debugConfig = null; // Force reload
    this.notifyConfigChange();
    console.log(`🐛 Debug category '${category}' disabled`);
  }

  /**
   * Toggle specific debug category
   */
  static toggleCategory(category: DebugCategory): void {
    const config = this.getConfig();
    const newState = !config.categories[category];
    ConfigStorage.toggleDebugCategory(category, newState);
    this.debugConfig = null; // Force reload
    this.notifyConfigChange();
    console.log(`🐛 Debug category '${category}' ${newState ? 'enabled' : 'disabled'}`);
  }

  /**
   * Test all debug categories
   */
  static testAllCategories(): void {
    const categories: DebugCategory[] = [
      'gameController',
      'chessBoard',
      'apiClient',
      'configManager',
      'chatManager',
      'moveValidation',
      'boardRendering',
      'userInput'
    ];

    console.log('🧪 Testing all debug categories...');

    categories.forEach(category => {
      this.log(category, `Test message for ${category} category`);
      this.info(category, `Info message for ${category} category`);
      this.warn(category, `Warning message for ${category} category`);
      this.error(category, `Error message for ${category} category`);
    });
  }
}
