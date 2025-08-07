/**
 * Debug UI Manager - Handles the debug panel interface
 */

import { Debug, DebugCategory } from '../utils/debug.js';
import { ConfigStorage, DebugConfig } from '../utils/storage.js';
import { getElement, addEventListenerTyped } from '../utils/dom-utils.js';

export class DebugUIManager {
  private debugPanel: HTMLElement;
  private debugButton: HTMLElement;
  private masterToggle: HTMLInputElement;
  private categoryCheckboxes: NodeListOf<HTMLInputElement>;

  constructor() {
    this.debugPanel = getElement('#debug-panel');
    this.debugButton = getElement('#debug-btn');
    this.masterToggle = getElement('#debug-master-toggle') as HTMLInputElement;
    this.categoryCheckboxes = document.querySelectorAll('[data-category]') as NodeListOf<HTMLInputElement>;

    this.init();
  }

  /**
   * Initialize debug UI
   */
  private init(): void {
    // Ensure master toggle is always enabled right from the start
    this.masterToggle.disabled = false;

    this.setupEventListeners();
    this.updateUI();

    // Register for debug config change notifications
    Debug.onConfigChange(() => {
      this.updateUI();
    });
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Debug button toggle
    addEventListenerTyped(this.debugButton, 'click', () => {
      this.togglePanel();
    });

    // Close button
    const closeButton = getElement('#debug-close');
    addEventListenerTyped(closeButton, 'click', () => {
      this.hidePanel();
    });

    // Master toggle
    addEventListenerTyped(this.masterToggle, 'change', () => {
      this.onMasterToggleChange();
    });

    // Category checkboxes
    this.categoryCheckboxes.forEach(checkbox => {
      addEventListenerTyped(checkbox, 'change', () => {
        this.onCategoryToggleChange(checkbox);
      });
    });

    // Test button
    const testButton = getElement('#debug-test');
    addEventListenerTyped(testButton, 'click', () => {
      Debug.testAllCategories();
    });

    // Clear console button
    const clearButton = getElement('#debug-clear');
    addEventListenerTyped(clearButton, 'click', () => {
      console.clear();
      console.log('🐛 Console cleared by debug panel');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (!this.debugPanel.contains(target) && !this.debugButton.contains(target)) {
        this.hidePanel();
      }
    });

    // Prevent panel close when clicking inside
    addEventListenerTyped(this.debugPanel, 'click', (event: Event) => {
      event.stopPropagation();
    });
  }

  /**
   * Handle master toggle change
   */
  private onMasterToggleChange(): void {
    const enabled = this.masterToggle.checked;

    console.log(`🐛 Debug master toggle changed to: ${enabled}`);

    if (enabled) {
      Debug.enable();
    } else {
      Debug.disable();
    }

    // The updateUI will be called automatically via the config change notification
  }  /**
   * Handle category toggle change
   */
  private onCategoryToggleChange(checkbox: HTMLInputElement): void {
    const category = checkbox.dataset.category as DebugCategory;
    const enabled = checkbox.checked;

    if (category) {
      // Set the specific state instead of toggling
      if (enabled) {
        Debug.enableCategory(category);
      } else {
        Debug.disableCategory(category);
      }
    }
  }  /**
   * Toggle debug panel visibility
   */
  private togglePanel(): void {
    const isHidden = this.debugPanel.classList.contains('hidden');

    if (isHidden) {
      this.showPanel();
    } else {
      this.hidePanel();
    }
  }

  /**
   * Show debug panel
   */
  private showPanel(): void {
    this.debugPanel.classList.remove('hidden');
    this.updateUI();
    Debug.log('userInput', 'Debug panel opened');
  }

  /**
   * Hide debug panel
   */
  private hidePanel(): void {
    this.debugPanel.classList.add('hidden');
    Debug.log('userInput', 'Debug panel closed');
  }

  /**
   * Update UI to reflect current debug configuration
   */
  private updateUI(): void {
    const config = Debug.getConfig();

    // Update master toggle
    this.masterToggle.checked = config.enabled;

    // Update category checkboxes
    this.categoryCheckboxes.forEach(checkbox => {
      const category = checkbox.dataset.category as DebugCategory;
      if (category && config.categories[category] !== undefined) {
        checkbox.checked = config.categories[category];
      }
    });

    this.updateCategoryStates();
    this.updateButtonState();
  }

  /**
   * Update category checkbox states based on master toggle
   */
  private updateCategoryStates(): void {
    const config = Debug.getConfig();
    const masterEnabled = config.enabled;

    // Ensure master toggle is always enabled (never disabled)
    this.masterToggle.disabled = false;

    // Ensure action buttons are always enabled
    const testButton = document.getElementById('debug-test') as HTMLButtonElement;
    const clearButton = document.getElementById('debug-clear') as HTMLButtonElement;
    if (testButton) testButton.disabled = false;
    if (clearButton) clearButton.disabled = false;

    // Only disable category checkboxes when master is off
    this.categoryCheckboxes.forEach(checkbox => {
      checkbox.disabled = !masterEnabled;

      const label = checkbox.closest('.debug-category') as HTMLElement;
      if (label) {
        label.style.opacity = masterEnabled ? '1' : '0.5';
      }
    });
  }  /**
   * Update debug button visual state
   */
  private updateButtonState(): void {
    const config = Debug.getConfig();

    if (config.enabled) {
      this.debugButton.classList.add('debug-enabled');
      this.debugButton.title = 'Debug Enabled - Click to toggle debug panel';
    } else {
      this.debugButton.classList.remove('debug-enabled');
      this.debugButton.title = 'Debug Disabled - Click to toggle debug panel';
    }
  }  /**
   * Public method to update UI when debug config changes externally
   */
  public refresh(): void {
    this.updateUI();
  }

  /**
   * Get debug panel visibility state
   */
  public isVisible(): boolean {
    return !this.debugPanel.classList.contains('hidden');
  }

  /**
   * Show panel and enable debug
   */
  public enableAndShow(): void {
    Debug.enable();
    this.showPanel();
  }

  /**
   * Hide panel and disable debug
   */
  public disableAndHide(): void {
    Debug.disable();
    this.hidePanel();
  }
}
