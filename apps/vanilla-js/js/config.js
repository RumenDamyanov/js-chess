// Game Configuration Manager
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
    this.initialOrientationApplied = false; // Prevent repeated flip animation on initial load when black

        this.init();
    }

    init() {
        Debug.log('configManager', 'GameConfig initializing with default settings:', this.config);
        this.bindEvents();
        this.loadSettings();
        this.updateDisplay();
        this.applyConfig();
    this.updateOrientationIndicator();
    }

    // Cookie helper methods
    setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
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
        // Player settings
        document.getElementById('player-name').addEventListener('input', (e) => {
            this.config.playerName = e.target.value || 'Player 1';
            localStorage.setItem('player-name', this.config.playerName);
            this.updatePlayerDisplay();
            this.saveSettings();
        });

        document.getElementById('player-color').addEventListener('change', (e) => {
            this.config.playerColor = e.target.value;
            this.updateBoardOrientation();
            this.updateOrientationIndicator();
            this.saveSettings();
        });

        // Feature toggles
        document.getElementById('enable-undo').addEventListener('change', (e) => {
            this.config.enableUndo = e.target.checked;
            this.toggleUndoButton();
            this.saveSettings();
        });

        document.getElementById('enable-hints').addEventListener('change', (e) => {
            this.config.enableHints = e.target.checked;
            this.toggleHintButton();
            this.saveSettings();
        });

        document.getElementById('enable-chat').addEventListener('change', (e) => {
            this.config.enableChat = e.target.checked;
            this.toggleChatContainer();
            this.saveSettings();
        });

        // Timer settings
        document.getElementById('enable-timer').addEventListener('change', (e) => {
            this.config.enableTimer = e.target.checked;
            this.toggleTimerDisplay();
            if (e.target.checked) {
                this.resetTimers();
            } else {
                this.stopTimer();
            }
            this.saveSettings();
        });

        document.getElementById('timer-mode').addEventListener('change', (e) => {
            this.config.timerMode = e.target.value;
            this.toggleTimeLimitGroup();
            this.resetTimers();
            this.saveSettings();
        });

        document.getElementById('time-limit').addEventListener('change', (e) => {
            this.config.timeLimit = parseInt(e.target.value);
            this.resetTimers();
            this.saveSettings();
        });

        // Timer controls (optional elements)
        const pauseBtn = document.getElementById('timer-pause-btn');
        const resetBtn = document.getElementById('timer-reset-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.paused) {
                    this.resumeTimer();
                } else {
                    this.pauseTimer();
                }
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTimers());
        }
    }

    loadSettings() {
    // Prefer localStorage for player name to avoid cookie stripping, fallback to cookie config
    const storedName = localStorage.getItem('player-name');
    if(storedName) this.config.playerName = storedName;
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
        document.getElementById('player-name').value = this.config.playerName;
        document.getElementById('player-color').value = this.config.playerColor;
        document.getElementById('enable-undo').checked = this.config.enableUndo;
        document.getElementById('enable-hints').checked = this.config.enableHints;
        document.getElementById('enable-chat').checked = this.config.enableChat;
        document.getElementById('enable-timer').checked = this.config.enableTimer;
        document.getElementById('timer-mode').value = this.config.timerMode;
        document.getElementById('time-limit').value = this.config.timeLimit;

        this.updatePlayerDisplay();
        this.toggleTimeLimitGroup();
    }

    updatePlayerDisplay() {
        const playerDisplay = document.getElementById('player-display');
        if (playerDisplay) {
            playerDisplay.textContent = this.config.playerName;
        }
    }

    updateBoardOrientation() {
        const chessBoard = document.getElementById('chess-board');
        const desiredBlack = this.config.playerColor === 'black';
        if (chessBoard) {
            // First time application: apply orientation without animation to avoid flip flash on reload
            if (!this.initialOrientationApplied) {
                if (desiredBlack) {
                    chessBoard.classList.add('no-animate');
                    chessBoard.classList.add('flipped');
                    // Force reflow then remove no-animate so future flips animate
                    requestAnimationFrame(() => {
                        chessBoard.offsetHeight; // reflow
                        chessBoard.classList.remove('no-animate');
                    });
                } else {
                    chessBoard.classList.remove('flipped');
                }
                this.initialOrientationApplied = true;
            } else {
                // Subsequent user-triggered changes: animate as normal
                if (desiredBlack) chessBoard.classList.add('flipped'); else chessBoard.classList.remove('flipped');
            }
        }

        // Cancel any pending logic updates from previous color changes
        if (this.flipTimeout) {
            clearTimeout(this.flipTimeout);
        }

    // Only mark animation logic for true user-triggered flips (not initial silent orientation)
    this.flipInProgress = this.initialOrientationApplied;

        // Trigger board recreation with new orientation
        if (window.chessGame && window.chessGame.createBoard) {
            window.chessGame.createBoard();
            if (window.chessGame.gameState) {
                window.chessGame.updateBoard();
                if (this.flipInProgress) {
                    // Wait for CSS transition to complete (0.5s) before updating logic
                    this.flipTimeout = setTimeout(() => {
                        this.completeColorChangeLogic();
                    }, 500);
                } else {
                    // Immediate logic update when no animation
                    this.completeColorChangeLogic();
                }
            }
        }
    }

    completeColorChangeLogic() {
        // Update all game logic after the board flip animation completes
        if (window.chessGame && window.chessGame.gameState) {
            // Update button states based on new player color
            window.chessGame.updateControlButtons();

            // Check if AI should make a move after color change
            this.checkAIMoveAfterColorChange();

            // Mark flip as complete
            this.flipInProgress = false;
        this.updateOrientationIndicator();
        }
    }    checkAIMoveAfterColorChange() {
        // Only check if we have an active game
        if (!window.chessGame || !window.chessGame.gameState || !window.chessGame.gameId) {
            return;
        }

        const gameState = window.chessGame.gameState;
        const currentTurn = gameState.active_color; // 'white' or 'black'
        const playerColor = this.config.playerColor; // 'white' or 'black'

        // Determine if it's AI's turn based on the new player color configuration
        const isAITurn = (playerColor === 'white' && currentTurn === 'black') ||
                        (playerColor === 'black' && currentTurn === 'white');

        // Only trigger AI move if:
        // 1. It's AI's turn based on new color configuration
        // 2. Game is still in progress
        // 3. AI is not already thinking
        if (isAITurn &&
            (gameState.status === 'in_progress' || gameState.status === 'check') &&
            !window.chessGame.isAITurn) {

            window.chessGame.isAITurn = true;
            window.chessGame.showMessage('AI is thinking...', 'info');
            setTimeout(() => window.chessGame.makeAIMove(), 1000);
        }
    }

    applyConfig() {
        this.toggleUndoButton();
        this.toggleHintButton();
        this.toggleChatContainer();
        this.toggleTimerDisplay();
        this.updateBoardOrientation();
        this.resetTimers();
        this.saveSettings();
    }

    toggleUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.style.display = this.config.enableUndo ? 'inline-block' : 'none';
        }
    }

    toggleHintButton() {
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.style.display = this.config.enableHints ? 'inline-block' : 'none';
        }
    }

    toggleChatContainer() {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.style.display = this.config.enableChat ? 'block' : 'none';
        }
    }

    toggleTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            timerDisplay.style.display = this.config.enableTimer ? 'block' : 'none';
        }
    }

    toggleTimeLimitGroup() {
        const timeLimitGroup = document.getElementById('time-limit-group');
        if (timeLimitGroup) {
            timeLimitGroup.style.display = this.config.timerMode === 'count-down' ? 'block' : 'none';
        }
    }

    // Timer Management
    startTimer() {
        if (!this.config.enableTimer) return;

        this.stopTimer();
        this.timers.startTime = Date.now();
    this.paused = false;
    this.updatePauseButtonLabel();

    this.startOrResumeInterval();

        this.updateTimerDisplay();
    }

    stopTimer() {
        if (this.timers.interval) {
            clearInterval(this.timers.interval);
            this.timers.interval = null;
        }
    }

    resetTimers() {
        this.stopTimer();

        if (this.config.timerMode === 'count-down') {
            const timeInSeconds = this.config.timeLimit * 60;
            this.timers.white = timeInSeconds;
            this.timers.black = timeInSeconds;
        } else {
            this.timers.white = 0;
            this.timers.black = 0;
        }

        this.timers.activePlayer = this.config.playerColor;
        this.updateTimerDisplay();
    this.paused = false;
    this.updatePauseButtonLabel();
    }

    updateTimers() {
    if (!this.config.enableTimer || !this.timers.startTime || this.paused) return;

        const now = Date.now();
        const elapsed = Math.floor((now - this.timers.startTime) / 1000);

        if (this.config.timerMode === 'count-down') {
            this.timers[this.timers.activePlayer] = Math.max(0, this.timers[this.timers.activePlayer] - 1);

            // Check for time out
            if (this.timers[this.timers.activePlayer] <= 0) {
                this.stopTimer();
                this.onTimeOut(this.timers.activePlayer);
            }
        } else {
            this.timers[this.timers.activePlayer] += 1;
        }

        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const whiteTimer = document.getElementById('white-timer');
        const blackTimer = document.getElementById('black-timer');

        if (whiteTimer && blackTimer) {
            whiteTimer.textContent = this.formatTime(this.timers.white);
            blackTimer.textContent = this.formatTime(this.timers.black);

            // Update active timer styling
            whiteTimer.className = 'timer';
            blackTimer.className = 'timer';

            if (this.timers.activePlayer === 'white') {
                whiteTimer.classList.add('active');
            } else {
                blackTimer.classList.add('active');
            }

            // Add warning/danger classes for countdown mode
            if (this.config.timerMode === 'count-down') {
                if (this.timers.white <= 60) {
                    whiteTimer.classList.add(this.timers.white <= 30 ? 'danger' : 'warning');
                }
                if (this.timers.black <= 60) {
                    blackTimer.classList.add(this.timers.black <= 30 ? 'danger' : 'warning');
                }
            }
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    switchActivePlayer() {
        if (!this.config.enableTimer) return;

        this.timers.activePlayer = this.timers.activePlayer === 'white' ? 'black' : 'white';
        this.timers.startTime = Date.now();
        this.updateTimerDisplay();
    }

    // Pause / Resume helpers
    pauseTimer() {
        if (this.timers.interval) {
            clearInterval(this.timers.interval);
            this.timers.interval = null;
        }
        this.paused = true;
        this.updatePauseButtonLabel();
    }

    resumeTimer() {
        if (!this.config.enableTimer || !this.timers.startTime) return;
        this.paused = false;
        this.updatePauseButtonLabel();
        this.startOrResumeInterval();
    }

    startOrResumeInterval() {
        if (this.timers.interval || this.paused) return;
        this.timers.interval = setInterval(() => this.updateTimers(), 1000);
    }

    updatePauseButtonLabel() {
        const btn = document.getElementById('timer-pause-btn');
        if (btn) btn.textContent = this.paused ? 'Resume' : 'Pause';
    }

    // Orientation indicator update (called after color changes)
    updateOrientationIndicator() {
        const el = document.getElementById('orientation-indicator');
        if (el) el.textContent = this.config.playerColor === 'white' ? 'White' : 'Black';
    }

    onTimeOut(player) {
        const winner = player === 'white' ? 'Black' : 'White';
        const gameStatus = document.getElementById('game-status');
        if (gameStatus) {
            gameStatus.textContent = `${winner} wins - Time out!`;
        }

        // Disable the game
        const chessBoard = document.getElementById('chess-board');
        if (chessBoard) {
            chessBoard.style.pointerEvents = 'none';
            chessBoard.style.opacity = '0.7';
        }

        // Show alert
        setTimeout(() => {
            alert(`Game Over! ${winner} wins by timeout!`);
        }, 100);
    }

    // Public methods for the chess game to use
    onGameStart() {
        this.resetTimers();
        this.timers.gameStarted = false; // Reset the game started flag
        // Timer will be started when first move is made
    }

    onMovesMade() {
        if (this.config.enableTimer) {
            this.switchActivePlayer();
        }
    }

    onGameEnd() {
        this.stopTimer();
    }

    getPlayerName() {
        return this.config.playerName;
    }

    getPlayerColor() {
        return this.config.playerColor;
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
}

// Initialize global config manager
window.gameConfig = null;

document.addEventListener('DOMContentLoaded', () => {
    window.gameConfig = new GameConfig();
});
