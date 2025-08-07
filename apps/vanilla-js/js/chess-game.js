// Chess Game API Interface
class ChessAPI {
    constructor(baseURL = 'http://localhost:8080') {
        this.baseURL = baseURL;
        Debug.log('apiClient', 'ChessAPI initialized with baseURL:', baseURL);
    }

    async createGame(gameConfig = {}) {
        try {
            Debug.log('apiClient', 'Creating new game with config:', gameConfig);
            const requestBody = {};

            // Set AI color based on player color preference
            if (gameConfig.playerColor) {
                requestBody.ai_color = gameConfig.playerColor === 'white' ? 'black' : 'white';
                Debug.log('apiClient', 'Setting AI color to:', requestBody.ai_color);
            }

            const response = await fetch(`${this.baseURL}/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            Debug.log('apiClient', 'Game created successfully:', result);
            return result;
        } catch (error) {
            Debug.error('apiClient', 'Error creating game:', error);
            throw error;
        }
    }

    async getGame(gameId) {
        try {
            Debug.log('apiClient', 'Getting game state for ID:', gameId);
            const response = await fetch(`${this.baseURL}/api/games/${gameId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            Debug.log('apiClient', 'Game state retrieved:', result);
            return result;
        } catch (error) {
            Debug.error('apiClient', 'Error getting game:', error);
            throw error;
        }
    }

    async makeMove(gameId, move) {
        try {
            Debug.log('apiClient', 'Making move for game', gameId, 'move:', move);
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/moves`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(move)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            Debug.log('apiClient', 'Move made successfully:', result);
            return result;
        } catch (error) {
            Debug.error('apiClient', 'Error making move:', error);
            throw error;
        }
    }

    async getValidMoves(gameId, position) {
        try {
            Debug.log('apiClient', 'Getting valid moves for game:', gameId);
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/legal-moves`);
            if (!response.ok) {
                Debug.warn('apiClient', `Legal moves endpoint returned status ${response.status}: ${response.statusText}`);
                return { legal_moves: [] };
            }
            const data = await response.json();
            Debug.log('apiClient', 'Valid moves retrieved:', data);
            return data;
        } catch (error) {
            Debug.error('apiClient', 'Error getting legal moves:', error);
            return { legal_moves: [] };
        }
    }

    async getAIMove(gameId, level = 'medium', engine = 'random') {
        try {
            Debug.log('apiClient', 'Requesting AI move for game:', gameId, 'level:', level, 'engine:', engine);
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/ai-move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level: level,
                    engine: engine
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                Debug.error('apiClient', `AI move failed with status ${response.status}: ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            Debug.log('apiClient', 'AI move received:', data);
            return data;
        } catch (error) {
            Debug.error('apiClient', 'Error getting AI move:', error);
            throw error;
        }
    }

    async getAIHint(gameId, level = 'medium', engine = 'random') {
        try {
            Debug.log('apiClient', 'Requesting AI hint for game:', gameId, 'level:', level, 'engine:', engine);
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/ai-hint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    level: level,
                    engine: engine
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                Debug.error('apiClient', `AI hint failed with status ${response.status}: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const result = await response.json();
            Debug.log('apiClient', 'AI hint received:', result);
            return result;
        } catch (error) {
            Debug.error('apiClient', 'Error getting AI hint:', error);
            throw error;
        }
    }
}

// Chess Game Logic
class ChessGame {
    constructor() {
        this.api = new ChessAPI();
        this.gameId = null;
        this.gameState = null;
        this.selectedSquare = null;
        this.validMoves = [];
        this.isAITurn = false; // Add AI turn lock
        this.isProcessingMove = false; // Prevent race conditions on fast clicks

        this.init();
    }

    async init() {
        this.createBoard();
        await this.startNewGame();
        this.setupEventListeners(); // Move this after the game is started
    }

    createBoard() {
        Debug.log('boardRendering', 'Creating chess board');
        const boardContainer = document.getElementById('chess-board');
        if (!boardContainer) {
            Debug.error('boardRendering', 'Chess board container not found!');
            return;
        }

        boardContainer.innerHTML = ''; // Clear existing content

        // Get player color from config
        const config = window.gameConfig || { playerColor: 'white' };
        const isBlackPlayer = config.playerColor === 'black';
        Debug.log('boardRendering', 'Creating board for player color:', config.playerColor);

        // Create 64 squares (8x8 board)
        if (isBlackPlayer) {
            // For black player, reverse the board order
            Debug.log('boardRendering', 'Creating board with black player perspective');
            for (let rank = 1; rank <= 8; rank++) {
                for (let file = 7; file >= 0; file--) {
                    const position = String.fromCharCode(97 + file) + rank; // a1, b1, ..., h8
                    const isLight = (rank + file) % 2 === 1;

                    const square = document.createElement('div');
                    square.className = `square ${isLight ? 'light' : 'dark'}`;
                    square.setAttribute('data-position', position);
                    square.addEventListener('click', (e) => this.handleSquareClick(e));

                    boardContainer.appendChild(square);
                }
            }
        } else {
            // For white player, normal board order
            Debug.log('boardRendering', 'Creating board with white player perspective');
            for (let rank = 8; rank >= 1; rank--) {
                for (let file = 0; file < 8; file++) {
                    const position = String.fromCharCode(97 + file) + rank; // a8, b8, ..., h1
                    const isLight = (rank + file) % 2 === 1;

                    const square = document.createElement('div');
                    square.className = `square ${isLight ? 'light' : 'dark'}`;
                    square.setAttribute('data-position', position);
                    square.addEventListener('click', (e) => this.handleSquareClick(e));

                    boardContainer.appendChild(square);
                }
            }
        }
        Debug.log('boardRendering', 'Chess board created successfully');
    }

    setupEventListeners() {
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.startNewGame());
        }

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undoMove();
            });
        }

        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.getHint();
            });
        }
    }

    async startNewGame() {
        try {
            Debug.log('gameController', 'Starting new game');
            // End any current game timers
            if (window.gameConfig) {
                window.gameConfig.onGameEnd();
            }

            // Get player color preference from config
            const playerColor = window.gameConfig?.config.playerColor || 'white';
            Debug.log('gameController', 'Player color:', playerColor);

            const game = await this.api.createGame({ playerColor });

            this.gameId = game.id;
            this.gameState = game;
            this.selectedSquare = null;
            this.validMoves = [];
            this.isAITurn = false; // Reset AI turn flag

            Debug.log('gameController', 'New game created with ID:', this.gameId);

            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();
            this.updateChat(); // Update chat with new game state

            // Start timers if enabled
            if (window.gameConfig) {
                window.gameConfig.onGameStart();
            }

            if (playerColor === 'white') {
                this.showMessage(`New game started! You play as White - make your move!`, 'success');
                Debug.log('gameController', 'Player plays as White, waiting for human move');
            } else {
                // For black players: AI plays as white and will move first
                this.showMessage(`New game started! You play as Black - AI will move first!`, 'success');
                Debug.log('gameController', 'Player plays as Black, triggering AI move');
                // Trigger AI move since AI plays white when player is black
                this.isAITurn = true;
                setTimeout(() => this.makeAIMove(), 1000);
            }
        } catch (error) {
            this.showMessage('Failed to start new game. Check if backend is running.', 'error');
            Debug.error('gameController', 'Error starting new game:', error);
        }
    }

    async handleSquareClick(event) {
        // Don't allow moves during AI turn
        if (this.isAITurn) {
            this.showMessage('Please wait - AI is thinking...', 'warning');
            return;
        }

        // Prevent multiple clicks during move processing
        if (this.isProcessingMove) {
            return;
        }

        const square = event.target.closest('.square');
        const position = square.dataset.position;
        Debug.log('userInput', 'Square clicked:', position);

        if (this.selectedSquare === position) {
            // Deselect if clicking the same square
            Debug.log('userInput', 'Deselecting square:', position);
            this.clearSelection();
            return;
        }

        if (this.selectedSquare && this.isValidMove(this.selectedSquare, position)) {
            // Make a move
            Debug.log('userInput', 'Making move from', this.selectedSquare, 'to', position);
            this.isProcessingMove = true;
            try {
                await this.makeMove(this.selectedSquare, position);
            } finally {
                this.isProcessingMove = false;
            }
        } else {
            // Select a new square
            Debug.log('userInput', 'Selecting new square:', position);
            await this.selectSquare(position);
        }
    }

    async selectSquare(position) {
        Debug.log('chessBoard', 'Selecting square:', position);
        this.clearSelection();

        const square = document.querySelector(`[data-position="${position}"]`);
        if (!square) {
            Debug.error('chessBoard', `Square not found for position: ${position}`);
            return;
        }

        const piece = square.dataset.piece || ''; // Get piece notation from data attribute

        // Allow selection for human player only (white for now, could be changed for vs human)
        // Note: For testing, let's allow both colors to be selected
        const currentPlayer = this.gameState?.active_color;
        Debug.log('chessBoard', 'Current player:', currentPlayer, 'piece at position:', piece);

        if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
            this.selectedSquare = position;
            square.classList.add('selected');
            Debug.log('chessBoard', 'Square selected, getting valid moves');

            try {
                const response = await this.api.getValidMoves(this.gameId, position);
                // Filter moves that start from the selected position
                this.validMoves = (response.legal_moves || []).filter(move => move.from === position);
                Debug.log('moveValidation', 'Valid moves for', position, ':', this.validMoves);

                this.highlightValidMoves();
            } catch (error) {
                Debug.error('moveValidation', 'Error getting valid moves:', error);
                this.validMoves = [];
                this.highlightValidMoves();
            }
        } else {
            // If there's no piece data, try to refresh the board state
            if (!piece) {
                Debug.log('chessBoard', 'No piece found at position, refreshing board state');
                try {
                    this.updateBoard();
                } catch (error) {
                    Debug.error('chessBoard', 'Error refreshing board state:', error);
                }
            }
        }
    }

    async makeMove(from, to) {
        try {
            Debug.log('gameController', 'Making move from', from, 'to', to);
            // Add loading state
            const board = document.getElementById('chess-board');
            this.addLoadingState(board);
            this.setButtonsEnabled(false);

            // Check if this is a castling move by finding the matching valid move
            const castlingMove = this.validMoves.find(move =>
                move.from === from && move.to === to && move.type === 'castling');

            let move;
            if (castlingMove) {
                // For castling moves, send the notation instead of from/to
                move = { notation: castlingMove.notation };
                Debug.log('gameController', 'Castling move detected:', castlingMove.notation);
            } else {
                // Regular move
                move = {
                    from: from,
                    to: to
                };

                // Check if this is a pawn promotion
                const piece = this.boardData[from];
                const isPromotion = this.isPawnPromotion(piece, from, to);

                if (isPromotion) {
                    Debug.log('gameController', 'Pawn promotion detected');
                    const promotionPiece = await this.getPromotionChoice();
                    if (!promotionPiece) {
                        // User cancelled promotion
                        Debug.log('gameController', 'Promotion cancelled by user');
                        this.clearSelection();
                        this.removeLoadingState(board);
                        this.setButtonsEnabled(true);
                        return;
                    }
                    move.promotion = promotionPiece;
                    Debug.log('gameController', 'Promotion piece selected:', promotionPiece);
                }
            }

            const response = await this.api.makeMove(this.gameId, move);

            if (response.error) {
                this.showMessage(response.error, 'error');
                this.removeLoadingState(board);
                this.setButtonsEnabled(true);
                Debug.error('gameController', 'Move failed with error:', response.error);
                return;
            }

            Debug.log('gameController', 'Move successful, updating game state');
            this.gameState = response;
            this.clearSelection();
            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();
            this.updateChat(); // Update chat with new game state

            // Start timer on first move and switch active player
            if (window.gameConfig) {
                if (!window.gameConfig.timers.gameStarted) {
                    window.gameConfig.timers.gameStarted = true;
                    window.gameConfig.startTimer();
                }
                window.gameConfig.onMovesMade();
            }

            // Remove loading state and re-enable buttons
            this.removeLoadingState(board);
            this.setButtonsEnabled(true);

            // Show success feedback
            this.showMessage(`Move: ${from} → ${to}`, 'success', 1500);

            // Check for game ending conditions
            const aiColor = this.gameState?.ai_color;
            Debug.log('gameController', 'Checking game status:', response.status);

            if (response.status === 'white_wins') {
                if (aiColor === 'white') {
                    this.showGameEnd('AI wins by checkmate!', 'white');
                } else {
                    this.showGameEnd('You win by checkmate!', 'white');
                }
                return;
            } else if (response.status === 'black_wins') {
                if (aiColor === 'black') {
                    this.showGameEnd('AI wins by checkmate!', 'black');
                } else {
                    this.showGameEnd('You win by checkmate!', 'black');
                }
                return;
            } else if (response.status === 'draw') {
                this.showGameEnd('Game drawn!', 'draw');
                return;
            } else if (response.status === 'check') {
                this.showMessage('Check! Your king is under attack!', 'warning');
            }

            // Determine if it's AI's turn based on player color configuration
            const playerColor = window.gameConfig?.config.playerColor || 'white';
            const currentTurn = response.active_color;
            const isAITurn = (playerColor === 'white' && currentTurn === 'black') ||
                           (playerColor === 'black' && currentTurn === 'white');

            Debug.log('gameController', 'Turn analysis - Player color:', playerColor, 'Current turn:', currentTurn, 'Is AI turn:', isAITurn);

            if (isAITurn && (response.status === 'in_progress' || response.status === 'check')) {
                // It's AI's turn
                this.isAITurn = true; // Set this BEFORE any async operations
                this.showMessage('AI is thinking...', 'info');
                Debug.log('gameController', 'Triggering AI move after player move');
                setTimeout(() => this.makeAIMove(), 1000); // Small delay for better UX
            } else {
                // It's player's turn or game ended
                this.isAITurn = false; // Make sure AI turn flag is reset
                Debug.log('gameController', 'Player turn or game ended');
            }

        } catch (error) {
            // Remove loading state and re-enable buttons on error
            const board = document.querySelector('.chess-board');
            this.removeLoadingState(board);
            this.setButtonsEnabled(true);

            this.showMessage('Invalid move', 'error');
            Debug.error('gameController', 'Error making move:', error);
        }
    }

    async makeAIMove() {
        try {
            Debug.log('gameController', 'AI making move...');
            // Get AI move suggestion using a more compatible engine and difficulty
            const aiResponse = await this.api.getAIMove(this.gameId, 'medium', 'random');

            if (aiResponse.move) {
                Debug.log('gameController', 'AI suggested move:', aiResponse.move);
                // Execute the AI move
                const move = {
                    from: aiResponse.move.from,
                    to: aiResponse.move.to
                };

                const response = await this.api.makeMove(this.gameId, move);

                if (response.error) {
                    this.showMessage(`AI move failed: ${response.error}`, 'error');
                    this.isAITurn = false; // Reset on error
                    Debug.error('gameController', 'AI move failed:', response.error);
                    return;
                }

                Debug.log('gameController', 'AI move executed successfully');
                this.gameState = response;
                this.isAITurn = false; // AI turn complete - reset BEFORE updating UI
                this.updateBoard();
                this.updateGameInfo();
                this.updateMoveHistory();
                this.updateControlButtons();

                this.showMessage(`AI played: ${aiResponse.move.notation}`, 'info');

                // Determine victory messages based on AI color
                const aiColor = this.gameState.ai_color;
                Debug.log('gameController', 'Checking AI move results, status:', response.status);

                if (response.status === 'white_wins') {
                    if (aiColor === 'white') {
                        this.showMessage(`Checkmate! AI wins!`, 'error');
                    } else {
                        this.showMessage(`Checkmate! You win!`, 'success');
                    }
                } else if (response.status === 'black_wins') {
                    if (aiColor === 'black') {
                        this.showMessage(`Checkmate! AI wins!`, 'error');
                    } else {
                        this.showMessage(`Checkmate! You win!`, 'success');
                    }
                } else if (response.status === 'check') {
                    this.showMessage('Check! Your king is under attack!', 'warning');
                } else if (response.status === 'draw') {
                    this.showMessage('Game drawn!', 'info');
                } else {
                    this.showMessage('Your turn', 'info');
                }
            }
        } catch (error) {
            Debug.error('gameController', 'Error making AI move:', error);
            this.showMessage('AI move failed', 'error');
            this.isAITurn = false; // Reset AI turn on error
        }
    }

    clearSelection() {
        this.selectedSquare = null;
        this.validMoves = [];

        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'castling-move');
            // Remove castling indicators
            const indicators = square.querySelectorAll('.castling-indicator');
            indicators.forEach(indicator => indicator.remove());
        });
    }

    highlightValidMoves() {
        this.validMoves.forEach(move => {
            const square = document.querySelector(`[data-position="${move.to}"]`);
            if (square) {
                square.classList.add('valid-move');

                // Add special styling for castling moves
                if (move.type === 'castling') {
                    square.classList.add('castling-move');
                    // Add visual indicator
                    const indicator = document.createElement('div');
                    indicator.className = 'castling-indicator';
                    indicator.textContent = '♔';
                    indicator.title = `Castling: ${move.notation}`;
                    square.appendChild(indicator);
                }
            }
        });
    }

    isValidMove(from, to) {
        return this.validMoves.some(move => move.from === from && move.to === to);
    }

    isPieceOwnedByCurrentPlayer(piece) {
        if (!piece) return false;

        const isWhitePiece = piece === piece.toUpperCase();
        const currentPlayer = this.gameState?.active_color || 'white';

        // Get the player's chosen color from configuration
        const playerColor = window.gameConfig?.config.playerColor || 'white';

        // Allow the player to move pieces of their chosen color when it's their turn
        const isPiecePlayerColor = (playerColor === 'white' && isWhitePiece) ||
                                  (playerColor === 'black' && !isWhitePiece);
        const isPlayerTurn = currentPlayer === playerColor;

        const owned = isPiecePlayerColor && isPlayerTurn;

        return owned;
    }

    updateBoard() {
        if (!this.gameState || !this.gameState.board) return;

        // Parse the board string from the API
        const boardLines = this.gameState.board.split('\n');
        this.boardData = {}; // Store board data as instance variable

        for (let i = 1; i <= 8; i++) {
            const line = boardLines[i];
            if (line) {
                const squares = line.split(' ');
                for (let j = 0; j < 8; j++) {
                    const file = String.fromCharCode(97 + j); // a-h
                    const rank = 9 - i; // 8-1
                    const position = file + rank;
                    const piece = squares[j + 1]; // Skip rank number
                    this.boardData[position] = piece === '.' ? '' : piece;
                }
            }
        }

        // Update the visual board
        document.querySelectorAll('.square').forEach(square => {
            const position = square.dataset.position;
            const piece = this.boardData[position] || '';

            // Store the piece notation in a data attribute for later retrieval
            square.dataset.piece = piece;

            // Convert piece notation to chess symbols
            const pieceSymbols = {
                'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
                'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
            };

            square.textContent = pieceSymbols[piece] || '';
        });
    }

    updateGameInfo() {
        if (!this.gameState) return;

        document.getElementById('current-player').textContent =
            this.gameState.active_color === 'white' ? 'White' : 'Black';

        let statusText = this.gameState.status.replace('_', ' ').toUpperCase();

        // Enhance status display
        if (this.gameState.status === 'in_progress') {
            statusText = 'IN PROGRESS';
        } else if (this.gameState.status === 'white_wins') {
            statusText = 'WHITE WINS!';
        } else if (this.gameState.status === 'black_wins') {
            statusText = 'BLACK WINS!';
        } else if (this.gameState.status === 'draw') {
            statusText = 'DRAW';
        }

        document.getElementById('game-status').textContent = statusText;
        document.getElementById('move-count').textContent =
            this.gameState.move_count || 1;
    }

    isPawnPromotion(piece, from, to) {
        if (!piece || (piece.toLowerCase() !== 'p')) return false;

        const toRank = parseInt(to[1]);
        const isWhitePawn = piece === 'P';
        const isBlackPawn = piece === 'p';

        return (isWhitePawn && toRank === 8) || (isBlackPawn && toRank === 1);
    }

    async getPromotionChoice() {
        return new Promise((resolve) => {
            // Create promotion dialog
            const dialog = document.createElement('div');
            dialog.className = 'promotion-dialog';
            dialog.innerHTML = `
                <div class="promotion-content">
                    <h3>Choose promotion piece:</h3>
                    <div class="promotion-pieces">
                        <button class="promotion-btn" data-piece="Q">♕ Queen</button>
                        <button class="promotion-btn" data-piece="R">♖ Rook</button>
                        <button class="promotion-btn" data-piece="B">♗ Bishop</button>
                        <button class="promotion-btn" data-piece="N">♘ Knight</button>
                    </div>
                    <button class="promotion-cancel">Cancel</button>
                </div>
            `;

            // Add event listeners
            dialog.querySelectorAll('.promotion-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const piece = btn.dataset.piece;
                    document.body.removeChild(dialog);
                    resolve(piece);
                });
            });

            dialog.querySelector('.promotion-cancel').addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(null);
            });

            document.body.appendChild(dialog);
        });
    }

    showGameEnd(message, winner) {
        // Stop the game timer
        if (window.gameConfig) {
            window.gameConfig.onGameEnd();
        }

        // Calculate game duration and moves
        const moves = this.gameState.move_count || 0;
        const endTime = new Date();
        const startTime = new Date(this.gameState.created_at);
        const durationMs = endTime - startTime;
        const durationMin = Math.floor(durationMs / 60000);
        const durationSec = Math.floor((durationMs % 60000) / 1000);

        const fullMessage = `${message}\n\nGame Statistics:\n• Total moves: ${moves}\n• Duration: ${durationMin}m ${durationSec}s`;

        this.showMessage(fullMessage, winner === 'white' ? 'success' : winner === 'black' ? 'error' : 'info');

        // Disable further moves
        this.gameState.status = winner + '_wins';
        this.updateControlButtons();
    }

    async undoMove() {
        Debug.log('gameController', 'Undo move requested');
        // Check if undo is enabled in configuration
        if (window.gameConfig && !window.gameConfig.isUndoEnabled()) {
            this.showMessage('Undo is disabled in game settings', 'warning');
            return;
        }

        if (!this.gameState || !this.gameState.move_history || this.gameState.move_history.length === 0) {
            this.showMessage('No moves to undo', 'warning');
            return;
        }

        if (this.isAITurn) {
            this.showMessage('Cannot undo while AI is thinking', 'warning');
            return;
        }

        // Check if it's appropriate to undo based on player color and current turn
        const playerColor = window.gameConfig?.config.playerColor || 'white';
        const currentTurn = this.gameState?.active_color || 'white';

        Debug.log('gameController', 'Undo analysis - Player color:', playerColor, 'Current turn:', currentTurn, 'Move history length:', this.gameState.move_history.length);

        // Player can only undo when it's not their turn (after AI has responded)
        // or when they have at least one move to undo
        if (currentTurn === playerColor && this.gameState.move_history.length < 2) {
            this.showMessage('No moves to undo yet', 'warning');
            return;
        }

        try {
            this.showMessage('Undoing last move...', 'info');

            // Reset AI turn flag to prevent issues
            this.isAITurn = false;

            // Create a new game
            const playerColor = window.gameConfig?.config.playerColor || 'white';
            const newGame = await this.api.createGame({ playerColor });

            // Determine how many moves to undo based on player color and current state
            let movesToReplay = this.gameState.move_history.slice();

            if (playerColor === 'white') {
                // For white player: undo both player and AI moves so player can try again
                if (currentTurn === 'white' && movesToReplay.length >= 2) {
                    // It's white's turn, so undo the last AI (black) move and the player's previous move
                    movesToReplay = movesToReplay.slice(0, -2);
                } else if (currentTurn === 'black' && movesToReplay.length >= 1) {
                    // It's black's turn (AI), so just undo the player's last move
                    movesToReplay = movesToReplay.slice(0, -1);
                }
            } else {
                // For black player: undo both AI and player moves so player can try again
                if (currentTurn === 'black' && movesToReplay.length >= 2) {
                    // It's black's turn (player), so undo the last AI (white) move and player's previous move
                    movesToReplay = movesToReplay.slice(0, -2);
                } else if (currentTurn === 'white' && movesToReplay.length >= 1) {
                    // It's white's turn (AI), so just undo the player's last move
                    movesToReplay = movesToReplay.slice(0, -1);
                }
            }

            // Replay the moves
            for (const move of movesToReplay) {
                await this.api.makeMove(newGame.id, {
                    from: move.from,
                    to: move.to
                });
            }

            // Update to the new game state
            const updatedGame = await this.api.getGame(newGame.id);
            this.gameId = newGame.id;
            this.gameState = updatedGame;

            // Make sure AI turn flag is false after undo
            this.isAITurn = false;

            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();

            this.showMessage('Move undone successfully - your turn', 'success');
        } catch (error) {
            this.showMessage('Failed to undo move', 'error');
            Debug.error('gameController', 'Undo error:', error);
            this.isAITurn = false; // Reset flag on error too
        }
    }

    async getHint() {
        Debug.log('gameController', 'Getting hint for player');
        // Check if hints are enabled in configuration
        if (window.gameConfig && !window.gameConfig.isHintsEnabled()) {
            this.showMessage('Hints are disabled in game settings', 'warning');
            return;
        }

        if (this.isAITurn) {
            this.showMessage('AI is already thinking...', 'warning');
            return;
        }

        if (this.gameState?.status !== 'in_progress') {
            this.showMessage('Game is over - no hints available', 'warning');
            return;
        }

        // Check if it's the player's turn
        const playerColor = window.gameConfig?.config.playerColor || 'white';
        const currentTurn = this.gameState?.active_color || 'white';

        Debug.log('gameController', 'Hint request - Player color:', playerColor, 'Current turn:', currentTurn);

        if (currentTurn !== playerColor) {
            this.showMessage('Wait for your turn to get a hint', 'warning');
            return;
        }

        try {
            this.showMessage('Getting hint...', 'info');
            const hintResponse = await this.api.getAIHint(this.gameId, 'medium', 'random');

            if (hintResponse.from && hintResponse.to) {
                const explanation = hintResponse.explanation || `Move from ${hintResponse.from} to ${hintResponse.to}`;
                Debug.log('gameController', 'Hint received:', hintResponse);
                this.showMessage(`Hint: ${explanation}`, 'success');

                // Highlight the suggested move
                this.highlightHint(hintResponse.from, hintResponse.to);
            } else {
                Debug.warn('gameController', 'No valid hint received:', hintResponse);
                this.showMessage('No hint available at this time', 'warning');
            }
        } catch (error) {
            Debug.error('gameController', 'Hint error:', error);
            this.showMessage('Unable to get hint - try again later', 'error');
        }
    }

    highlightHint(from, to) {
        // Clear previous hints
        document.querySelectorAll('.hint-from, .hint-to').forEach(el => {
            el.classList.remove('hint-from', 'hint-to');
        });

        // Highlight the hint move
        const fromSquare = document.querySelector(`[data-position="${from}"]`);
        const toSquare = document.querySelector(`[data-position="${to}"]`);

        if (fromSquare) fromSquare.classList.add('hint-from');
        if (toSquare) toSquare.classList.add('hint-to');

        // Remove hint highlights after 5 seconds
        setTimeout(() => {
            document.querySelectorAll('.hint-from, .hint-to').forEach(el => {
                el.classList.remove('hint-from', 'hint-to');
            });
        }, 5000);
    }

    updateMoveHistory() {
        const moveList = document.getElementById('move-list');
        if (!moveList || !this.gameState || !this.gameState.move_history) return;

        moveList.innerHTML = '';

        for (let i = 0; i < this.gameState.move_history.length; i += 2) {
            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';

            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.gameState.move_history[i];
            const blackMove = this.gameState.move_history[i + 1];

            moveItem.innerHTML = `
                <span class="move-number">${moveNumber}.</span>
                <span class="move-notation">${whiteMove ? whiteMove.notation : ''}</span>
                <span class="move-notation">${blackMove ? blackMove.notation : ''}</span>
            `;

            moveList.appendChild(moveItem);
        }

        // Scroll to bottom
        moveList.scrollTop = moveList.scrollHeight;
    }

    updateControlButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const hintBtn = document.getElementById('hint-btn');

        const playerColor = window.gameConfig?.config.playerColor || 'white';
        const currentTurn = this.gameState?.active_color || 'white';
        const isPlayerTurn = currentTurn === playerColor;

        if (undoBtn) {
            // Enable undo button if:
            // - We have a game with moves
            // - Game is not finished
            // - Not during AI turn
            // - Player has made at least one move (for white: >=1 move, for black: >=2 moves)
            const hasGameState = !!this.gameState;
            const hasMovesToUndo = this.gameState?.move_history && this.gameState.move_history.length > 0;
            const gameNotFinished = this.gameState?.status !== 'white_wins' && this.gameState?.status !== 'black_wins' && this.gameState?.status !== 'draw';

            let hasValidUndo = false;
            if (hasMovesToUndo) {
                const moveCount = this.gameState.move_history.length;
                // Allow undo after at least 1 move for better UX
                // Player can undo their own move once AI has responded, or undo AI's move if it's AI's turn
                hasValidUndo = moveCount >= 1;
            }

            undoBtn.disabled = !hasGameState || !hasValidUndo || !gameNotFinished || this.isAITurn;
        }

        if (hintBtn) {
            // Enable hint button if:
            // - Game is in progress
            // - It's the player's turn (not AI's turn)
            // - Not currently processing AI move
            const hasGameState = !!this.gameState;
            const gameInProgress = this.gameState?.status === 'in_progress' || this.gameState?.status === 'check';

            // Hint should be available when it's the player's turn and not during AI processing
            hintBtn.disabled = !hasGameState || !gameInProgress || this.isAITurn || !isPlayerTurn;
        }
    }

    showMessage(message, type = 'info', duration = 3000) {
        // Remove existing messages
        const existingMessage = document.querySelector('.game-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.className = `game-message ${type}`;
        messageEl.textContent = message;

        // Add to page
        const gameInfo = document.querySelector('.game-info');
        gameInfo.insertBefore(messageEl, gameInfo.firstChild);

        // Auto-remove after duration or 3 seconds default
        setTimeout(() => {
            messageEl.remove();
        }, duration || 3000);
    }

    setButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    addLoadingState(element) {
        element.classList.add('loading');
    }

    removeLoadingState(element) {
        element.classList.remove('loading');
    }

    updateChat() {
        // Update chat with current game state
        if (typeof chatManager !== 'undefined') {
            chatManager.setGameState(this.gameId, this.gameState);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
