/**
 * Debug System for Vanilla JS Chess Application
 * Provides conditional logging with categories and persistent settings
 */

class Debug {
    static categories = {
        gameController: { enabled: false, description: 'Game state and flow control' },
        chessBoard: { enabled: false, description: 'Board rendering and interactions' },
        apiClient: { enabled: false, description: 'API communication' },
        configManager: { enabled: false, description: 'Configuration management' },
        chatManager: { enabled: false, description: 'Chat functionality' },
        moveValidation: { enabled: false, description: 'Move validation and logic' },
        boardRendering: { enabled: false, description: 'Visual board updates' },
        userInput: { enabled: false, description: 'User interaction handling' }
    };

    static isEnabled = false;
    static notificationTimeout = null;

    /**
     * Initialize debug system with stored settings
     */
    static init() {
        this.loadSettings();
        this.createUI();
        this.showInitNotification();
        // Only log after system is initialized
        this.log('configManager', 'Debug system initialization complete');
    }

    /**
     * Log a debug message if the category is enabled
     */
    static log(category, ...args) {
        // Return early if Debug system hasn't been initialized yet
        if (!this.categories || !this.isEnabled || !this.categories[category]?.enabled) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${category}]`;
        console.log(prefix, ...args);
    }

    /**
     * Log an error message if the category is enabled
     */
    static error(category, ...args) {
        // Return early if Debug system hasn't been initialized yet
        if (!this.categories || !this.isEnabled || !this.categories[category]?.enabled) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${category}] ERROR:`;
        console.error(prefix, ...args);
    }

    /**
     * Log a warning message if the category is enabled
     */
    static warn(category, ...args) {
        // Return early if Debug system hasn't been initialized yet
        if (!this.categories || !this.isEnabled || !this.categories[category]?.enabled) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${category}] WARN:`;
        console.warn(prefix, ...args);
    }

    /**
     * Load debug settings from cookies
     */
    static loadSettings() {
        // Load master debug state
        const debugEnabled = this.getCookie('debug_enabled');
        this.isEnabled = debugEnabled === 'true';

        // Load category states
        Object.keys(this.categories).forEach(category => {
            const savedState = this.getCookie(`debug_${category}`);
            this.categories[category].enabled = savedState === 'true';
        });
    }

    /**
     * Save debug settings to cookies
     */
    static saveSettings() {
        // Save master debug state
        this.setCookie('debug_enabled', this.isEnabled);

        // Save category states
        Object.keys(this.categories).forEach(category => {
            this.setCookie(`debug_${category}`, this.categories[category].enabled);
        });
    }

    /**
     * Get cookie value
     */
    static getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Set cookie value
     */
    static setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    /**
     * Create debug UI
     */
    static createUI() {
        // Create debug button
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-btn';
        debugBtn.className = 'btn btn-debug';
        debugBtn.innerHTML = '🐛';
        debugBtn.onclick = () => this.togglePanel();

        // Add to header controls
        const headerControls = document.querySelector('.header-controls');

        if (headerControls) {
            headerControls.appendChild(debugBtn);
        } else {
            // Fallback: add to body if header controls not found
            document.body.appendChild(debugBtn);
            debugBtn.style.position = 'fixed';
            debugBtn.style.top = '10px';
            debugBtn.style.right = '10px';
            debugBtn.style.zIndex = '1000';
        }

        // Create debug panel
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.className = 'debug-panel';
        debugPanel.innerHTML = this.getDebugPanelHTML();
        debugPanel.style.display = 'none';

        document.body.appendChild(debugPanel);

        // Setup event listeners
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * Get debug panel HTML
     */
    static getDebugPanelHTML() {
        const categoryHTML = Object.entries(this.categories)
            .map(([key, category]) => `
                <div class="debug-category">
                    <label class="debug-checkbox-label">
                        <input type="checkbox"
                               id="debug-${key}"
                               ${category.enabled ? 'checked' : ''}>
                        <span class="debug-category-name">${key}</span>
                        <span class="debug-category-desc">${category.description}</span>
                    </label>
                </div>
            `).join('');

        return `
            <div class="debug-header">
                <h3>🐛 Debug System</h3>
                <button class="debug-close" onclick="Debug.closePanel()">×</button>
            </div>
            <div class="debug-content">
                <div class="debug-master">
                    <label class="debug-master-label">
                        <input type="checkbox" id="debug-master" ${this.isEnabled ? 'checked' : ''}>
                        <span>Enable Debug Logging</span>
                    </label>
                </div>
                <div class="debug-categories">
                    <h4>Debug Categories:</h4>
                    ${categoryHTML}
                </div>
                <div class="debug-actions">
                    <button class="btn btn-small" onclick="Debug.enableAll()">Enable All</button>
                    <button class="btn btn-small" onclick="Debug.disableAll()">Disable All</button>
                    <button class="btn btn-small" onclick="Debug.clearConsole()">Clear Console</button>
                </div>
                <div class="debug-info">
                    <p>Debug messages are stored in cookies and persist across sessions.</p>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for debug panel
     */
    static setupEventListeners() {
        // Master debug toggle
        const masterToggle = document.getElementById('debug-master');
        if (masterToggle) {
            masterToggle.addEventListener('change', (e) => {
                this.isEnabled = e.target.checked;
                this.saveSettings();
                this.updateUI();
                this.showNotification(
                    `Debug ${this.isEnabled ? 'enabled' : 'disabled'}`
                );
            });
        }

        // Category toggles
        Object.keys(this.categories).forEach(category => {
            const checkbox = document.getElementById(`debug-${category}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.categories[category].enabled = e.target.checked;
                    this.saveSettings();
                    this.showNotification(
                        `${category} ${e.target.checked ? 'enabled' : 'disabled'}`
                    );
                });
            }
        });
    }

    /**
     * Update UI based on current state
     */
    static updateUI() {
        const debugBtn = document.getElementById('debug-btn');
        if (debugBtn) {
            debugBtn.className = `btn btn-debug ${this.isEnabled ? 'debug-active' : ''}`;
        }

        // Update category checkboxes disabled state
        Object.keys(this.categories).forEach(category => {
            const checkbox = document.getElementById(`debug-${category}`);
            if (checkbox) {
                checkbox.disabled = !this.isEnabled;
                checkbox.parentElement.style.opacity = this.isEnabled ? '1' : '0.5';
            }
        });
    }

    /**
     * Toggle debug panel
     */
    static togglePanel() {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Close debug panel
     */
    static closePanel() {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * Enable all categories
     */
    static enableAll() {
        Object.keys(this.categories).forEach(category => {
            this.categories[category].enabled = true;
            const checkbox = document.getElementById(`debug-${category}`);
            if (checkbox) checkbox.checked = true;
        });
        this.saveSettings();
        this.showNotification('All debug categories enabled');
    }

    /**
     * Disable all categories
     */
    static disableAll() {
        Object.keys(this.categories).forEach(category => {
            this.categories[category].enabled = false;
            const checkbox = document.getElementById(`debug-${category}`);
            if (checkbox) checkbox.checked = false;
        });
        this.saveSettings();
        this.showNotification('All debug categories disabled');
    }

    /**
     * Clear console
     */
    static clearConsole() {
        console.clear();
        this.showNotification('Console cleared');
    }

    /**
     * Show notification
     */
    static showNotification(message) {
        // Clear existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Create or update notification
        let notification = document.getElementById('debug-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'debug-notification';
            notification.className = 'debug-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.style.display = 'block';

        // Auto-hide after 3 seconds
        this.notificationTimeout = setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    /**
     * Show initialization notification
     */
    static showInitNotification() {
        if (this.isEnabled) {
            const enabledCategories = Object.entries(this.categories)
                .filter(([_, category]) => category.enabled)
                .map(([name, _]) => name);

            if (enabledCategories.length > 0) {
                this.showNotification(
                    `Debug enabled: ${enabledCategories.join(', ')}`
                );
            }
        }
    }
}

// Initialize debug system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Debug.init();
});
