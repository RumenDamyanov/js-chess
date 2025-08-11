// Game Configuration Manager for jQuery
class GameConfig {
    constructor() {
        this.config = {
            playerName: 'Player 1',
            playerColor: 'white',
            enableUndo: true,
            enableHints: true,
            enableChat: true,
            enableTimer: true,
            timerMode: 'count-up', // 'count-up' or 'count-down'
            timeLimit: 10 // minutes
        };

        this.timers = {
            white: 0,
            black: 0,
            activePlayer: 'white',
            interval: null,
            startTime: null,
            gameStarted: false // Track if game has started
        };

        this.flipTimeout = null; // Track pending flip animation timeouts
        this.flipInProgress = false; // Track if board flip is currently animating

        this.init();
    }

    init() {
        Debug.log('configManager', 'GameConfig initializing with default settings:', this.config);
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
        this.applyConfig();
    }

    // Cookie helper methods
    setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(c.substring(nameEQ.length, c.length));
                } catch (e) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
        }
        return null;
    }

    bindEvents() {
        // Player name input
        $('#player-name').on('input', (e) => {
            this.config.playerName = e.target.value;
            this.saveSettings();
        });

        // Player color selection
        $('#player-color').on('change', (e) => {
            this.config.playerColor = e.target.value;
            this.saveSettings();
            this.applyConfig();
        });

        // Enable/disable checkboxes
        $('#enable-undo').on('change', (e) => {
            this.config.enableUndo = e.target.checked;
            this.saveSettings();
        });

        $('#enable-hints').on('change', (e) => {
            this.config.enableHints = e.target.checked;
            this.saveSettings();
        });

        $('#enable-chat').on('change', (e) => {
            this.config.enableChat = e.target.checked;
            this.saveSettings();
            this.applyConfig();
        });

        $('#enable-timer').on('change', (e) => {
            this.config.enableTimer = e.target.checked;
            this.saveSettings();
            this.applyConfig();
        });

        $('#timer-mode').on('change', (e) => {
            this.config.timerMode = e.target.value;
            this.saveSettings();
            this.applyConfig();
        });

        $('#time-limit').on('input', (e) => {
            this.config.timeLimit = parseInt(e.target.value);
            this.saveSettings();
        });
    }

    loadSettings() {
        const saved = this.getCookie('chess-config');
        if (saved) {
            try {
                this.config = { ...this.config, ...saved };
                Debug.log('configManager', 'Settings loaded from cookies:', this.config);
            } catch (e) {
                Debug.warn('configManager', 'Could not load saved config:', e);
            }
        }
    }

    saveSettings() {
        this.setCookie('chess-config', this.config);
    }

    updateDisplay() {
        // Update form values
        $('#player-name').val(this.config.playerName);
        $('#player-color').val(this.config.playerColor);
        $('#enable-undo').prop('checked', this.config.enableUndo);
        $('#enable-hints').prop('checked', this.config.enableHints);
        $('#enable-chat').prop('checked', this.config.enableChat);
        $('#enable-timer').prop('checked', this.config.enableTimer);
        $('#timer-mode').val(this.config.timerMode);
        $('#time-limit').val(this.config.timeLimit);

        // Update timer display
        this.updateTimerDisplay();

    // Update player display in status panel
    $('#player-display').text(this.config.playerName || 'Player');
    }

    applyConfig() {
        // Apply player color preference
        const $board = $('.chess-board');
        if (this.config.playerColor === 'black') {
            $board.addClass('flipped');
        } else {
            $board.removeClass('flipped');
        }

        // Show/hide chat based on setting
        const $chat = $('#chat-container');
        if (this.config.enableChat) {
            $chat.show();
        } else {
            $chat.hide();
        }

    // Update player display when config applied (e.g., color change may not matter but name could)
    $('#player-display').text(this.config.playerName || 'Player');

        // Show/hide timer based on setting
        const $timer = $('.timer-display');
        if (this.config.enableTimer) {
            $timer.show();
        } else {
            $timer.hide();
        }
    }

    isUndoEnabled() {
        return this.config.enableUndo;
    }

    isHintsEnabled() {
        return this.config.enableHints;
    }

    isChatEnabled() {
        return this.config.enableChat;
    }

    // Timer functionality
    startTimer() {
        if (!this.config.enableTimer) return;

        this.timers.startTime = new Date();
        this.timers.interval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timers.interval) {
            clearInterval(this.timers.interval);
            this.timers.interval = null;
        }
    }

    updateTimer() {
        if (!this.config.enableTimer) return;

        const now = new Date();
        const elapsedSeconds = Math.floor((now - this.timers.startTime) / 1000);

        if (this.config.timerMode === 'count-up') {
            if (this.timers.activePlayer === 'white') {
                this.timers.white = elapsedSeconds;
            } else {
                this.timers.black = elapsedSeconds;
            }
        } else {
            // Count-down mode
            const timeLimit = this.config.timeLimit * 60; // Convert to seconds
            if (this.timers.activePlayer === 'white') {
                this.timers.white = Math.max(0, timeLimit - elapsedSeconds);
            } else {
                this.timers.black = Math.max(0, timeLimit - elapsedSeconds);
            }

            // Check for time out
            if (this.timers[this.timers.activePlayer] === 0) {
                this.onTimeOut();
            }
        }

        this.updateTimerDisplay();
    }

    switchTimer() {
        if (!this.config.enableTimer) return;

        this.timers.activePlayer = this.timers.activePlayer === 'white' ? 'black' : 'white';
        this.timers.startTime = new Date();
        this.updateTimerDisplay();
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateTimerDisplay() {
        if (!this.config.enableTimer) return;

        const whiteTime = this.formatTime(this.timers.white);
        const blackTime = this.formatTime(this.timers.black);

        $('#white-timer').text(whiteTime);
        $('#black-timer').text(blackTime);

        // Highlight active timer
        $('.timer-section').removeClass('active');
        $(`.timer-section.${this.timers.activePlayer}`).addClass('active');
    }

    onTimeOut() {
        this.stopTimer();
        // Trigger game end due to timeout
        if (window.chessGame) {
            const winner = this.timers.activePlayer === 'white' ? 'black' : 'white';
            window.chessGame.showMessage(`Time's up! ${winner === 'white' ? 'White' : 'Black'} wins!`, 'error');
        }
    }

    resetTimers() {
        this.timers.white = 0;
        this.timers.black = 0;
        this.timers.activePlayer = this.config.playerColor === 'black' ? 'black' : 'white';
        this.timers.gameStarted = false;
        this.updateTimerDisplay();
    }

    onGameStart() {
        this.resetTimers();
        if (this.config.enableTimer) {
            this.startTimer();
        }
    }

    onGameEnd() {
        this.stopTimer();
    }

    onMovesMade() {
        if (this.config.enableTimer && this.timers.gameStarted) {
            this.switchTimer();
        }
    }
}

// Initialize when document is ready
$(document).ready(() => {
    window.gameConfig = new GameConfig();
});
