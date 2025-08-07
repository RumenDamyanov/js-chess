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

            const response = await $.ajax({
                url: `${this.baseURL}/api/games`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(requestBody)
            });

            Debug.log('apiClient', 'Game created successfully:', response);
            return response;
        } catch (error) {
            Debug.error('apiClient', 'Error creating game:', error);
            throw error;
        }
    }

    async getGame(gameId) {
        try {
            Debug.log('apiClient', 'Getting game state for ID:', gameId);
            const response = await $.ajax({
                url: `${this.baseURL}/api/games/${gameId}`,
                method: 'GET'
            });
            Debug.log('apiClient', 'Game state retrieved:', response);
            return response;
        } catch (error) {
            Debug.error('apiClient', 'Error getting game:', error);
            throw error;
        }
    }

    async makeMove(gameId, move) {
        try {
            Debug.log('apiClient', 'Making move for game', gameId, 'move:', move);
            const response = await $.ajax({
                url: `${this.baseURL}/api/games/${gameId}/moves`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(move)
            });
            Debug.log('apiClient', 'Move made successfully:', response);
            return response;
        } catch (error) {
            Debug.error('apiClient', 'Error making move:', error);
            throw error;
        }
    }

    async getValidMoves(gameId, position) {
        try {
            Debug.log('apiClient', 'Getting valid moves for game:', gameId);
            const response = await $.ajax({
                url: `${this.baseURL}/api/games/${gameId}/legal-moves`,
                method: 'GET'
            });
            Debug.log('apiClient', 'Valid moves retrieved:', response);
            return response;
        } catch (error) {
            Debug.warn('apiClient', 'Error getting legal moves:', error);
            return { legal_moves: [] };
        }
    }

    async getAIMove(gameId, level = 'medium', engine = 'random') {
        try {
            Debug.log('apiClient', 'Requesting AI move for game:', gameId, 'level:', level, 'engine:', engine);
            const response = await $.ajax({
                url: `${this.baseURL}/api/games/${gameId}/ai-move`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    level: level,
                    engine: engine
                })
            });
            Debug.log('apiClient', 'AI move received:', response);
            return response;
        } catch (error) {
            Debug.error('apiClient', 'Error getting AI move:', error);
            throw error;
        }
    }

    async getAIHint(gameId, level = 'medium', engine = 'random') {
        try {
            Debug.log('apiClient', 'Requesting AI hint for game:', gameId, 'level:', level, 'engine:', engine);
            const response = await $.ajax({
                url: `${this.baseURL}/api/games/${gameId}/ai-hint`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    level: level,
                    engine: engine
                })
            });
            Debug.log('apiClient', 'AI hint received:', response);
            return response;
        } catch (error) {
            Debug.error('apiClient', 'Error getting AI hint:', error);
            throw error;
        }
    }
}

// Chess Game with jQuery - Enhanced Version
class ChessGameJQuery {
    constructor() {
        this.api = new ChessAPI();
        this.gameId = null;
        this.gameState = null;
        this.selectedSquare = null;
        this.validMoves = [];
        this.isAITurn = false;
        this.isProcessingMove = false;

        Debug.log('gameController', 'ChessGameJQuery initialized');
        this.init();
    }

    async init() {
        this.createBoard();
        await this.startNewGame();
        this.setupEventListeners();
    }

    createBoard() {
        Debug.log('boardRendering', 'Creating chess board');
        const $boardContainer = $('#chess-board');
        if ($boardContainer.length === 0) {
            Debug.error('boardRendering', 'Chess board container not found!');
            return;
        }

        $boardContainer.empty();

        // Get player color from config
        const config = window.gameConfig || { config: { playerColor: 'white' } };
        const isBlackPlayer = config.config.playerColor === 'black';
        Debug.log('boardRendering', 'Creating board for player color:', config.config.playerColor);

        // Create 64 squares (8x8 board)
        if (isBlackPlayer) {
            // For black player, reverse the board order
            Debug.log('boardRendering', 'Creating board with black player perspective');
            for (let rank = 1; rank <= 8; rank++) {
                for (let file = 7; file >= 0; file--) {
                    const position = String.fromCharCode(97 + file) + rank; // a1, b1, ..., h8
                    const isLight = (rank + file) % 2 === 1;

                    const $square = $('<div>')
                        .addClass('square')
                        .addClass(isLight ? 'light' : 'dark')
                        .attr('data-position', position)
                        .click((event) => this.handleSquareClick(event));

                    $boardContainer.append($square);
                }
            }
        } else {
            // For white player, normal board order
            Debug.log('boardRendering', 'Creating board with white player perspective');
            for (let rank = 8; rank >= 1; rank--) {
                for (let file = 0; file < 8; file++) {
                    const position = String.fromCharCode(97 + file) + rank; // a8, b8, ..., h1
                    const isLight = (rank + file) % 2 === 1;

                    const $square = $('<div>')
                        .addClass('square')
                        .addClass(isLight ? 'light' : 'dark')
                        .attr('data-position', position)
                        .click((event) => this.handleSquareClick(event));

                    $boardContainer.append($square);
                }
            }
        }
        Debug.log('boardRendering', 'Chess board created successfully');
    }

    setupEventListeners() {
        // Setup "New Game" button
        $('#new-game-btn').off('click').on('click', () => this.startNewGame());

        // Setup Undo button
        const $undoBtn = $('#undo-btn');
        if ($undoBtn.length) {
            $undoBtn.off('click').on('click', () => this.undoMove());
        }

        // Setup Hint button
        const $hintBtn = $('#hint-btn');
        if ($hintBtn.length) {
            $hintBtn.off('click').on('click', () => this.getHint());
        }
    }

    async startNewGame() {
        try {
            const game = await this.api.createGame();

            this.gameId = game.id;
            this.gameState = game;
            this.selectedSquare = null;
            this.validMoves = [];
            this.isAITurn = false;

            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();
            this.updateChat(); // Update chat with new game state
            this.showMessage(`New game started! Game ID: ${this.gameId}`, 'success');
        } catch (error) {
            this.showMessage('Failed to start new game. Check if backend is running.', 'error');
            Debug.error('gameController', 'Error starting new game:', error);
        }
    }

    async handleSquareClick(event) {
        if (this.isAITurn) return;

        // Check if current game is still valid
        if (!(await this.isGameValid())) {
            this.showMessage('Game lost - starting new game...', 'warning');
            setTimeout(() => this.startNewGame(), 1000);
            return;
        }

        const $square = $(event.target).closest('.square');
        const position = $square.data('position');
        const piece = $square.data('piece') || '';

        if (this.selectedSquare) {
            if (this.selectedSquare === position) {
                // Clicking same square deselects
                this.clearSelection();
                return;
            }

            // Try to make a move
            if (this.isValidMove(this.selectedSquare, position)) {
                await this.makeMove(this.selectedSquare, position);
                return;
            }
        }

        // Try to select the piece
        const currentPlayer = this.gameState?.active_color;

        if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
            this.selectedSquare = position;
            $square.addClass('selected');

            // Get valid moves for this piece
            try {
                const response = await this.api.getValidMoves(this.gameId, position);
                this.validMoves = (response.legal_moves || []).filter(move => move.from === position);
                this.highlightValidMoves();
                Debug.log('moveValidation', `Found ${this.validMoves.length} valid moves for ${position} (Game ID: ${this.gameId})`);
            } catch (error) {
                Debug.error('moveValidation', 'Error getting valid moves:', error);
                this.validMoves = [];
            }
        } else {
            Debug.log('userInput', `Cannot select piece: piece="${piece}", owned by current player: ${this.isPieceOwnedByCurrentPlayer(piece)}`);
            this.clearSelection();
        }
    }

    async makeMove(from, to) {
        if (!this.gameId) return;

        try {
            const board = $('.chess-board');
            this.addLoadingState(board);
            this.setButtonsEnabled(false);

            let move;
            const piece = this.getPieceAt(from);

            // Check if this is a castling move
            const castlingMove = this.validMoves.find(move =>
                move.from === from && move.to === to && move.type === 'castling');

            if (castlingMove) {
                // For castling moves, send the notation instead of from/to
                move = { notation: castlingMove.notation };
            } else {
                // Check if this is a pawn promotion
                const isPromotion = this.isPawnPromotion(piece, from, to);

                if (isPromotion) {
                    const promotionPiece = await this.getPromotionChoice();
                    if (!promotionPiece) {
                        this.removeLoadingState(board);
                        this.setButtonsEnabled(true);
                        return;
                    }
                    move = { from, to, promotion: promotionPiece };
                } else {
                    move = { from, to };
                }
            }

            const response = await this.api.makeMove(this.gameId, move);

            if (response.error) {
                this.showMessage(response.error, 'error');
                this.removeLoadingState(board);
                this.setButtonsEnabled(true);
                return;
            }

            this.gameState = response;
            this.clearSelection();
            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();
            this.updateChat();

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
            if (response.status === 'white_wins') {
                this.showGameEnd('White wins by checkmate!', 'white');
                return;
            } else if (response.status === 'black_wins') {
                this.showGameEnd('Black wins by checkmate!', 'black');
                return;
            } else if (response.status === 'draw') {
                this.showGameEnd('Game drawn!', 'draw');
                return;
            } else if (response.status === 'check') {
                this.showMessage('Check! Your king is under attack!', 'warning');
            }

            if ((response.active_color === 'black' && (response.status === 'in_progress' || response.status === 'check'))) {
                // It's black's turn - make an AI move
                this.isAITurn = true;
                this.showMessage('AI is thinking...', 'info');
                setTimeout(() => this.makeAIMove(), 1000); // Small delay for better UX
            } else {
                this.isAITurn = false;
            }

        } catch (error) {
            // Remove loading state and re-enable buttons on error
            const board = $('.chess-board');
            this.removeLoadingState(board);
            this.setButtonsEnabled(true);

            // If game was not found (backend restart), start a new game
            if (error.message === 'GAME_NOT_FOUND') {
                this.showMessage('Game lost - starting new game...', 'warning');
                setTimeout(() => this.startNewGame(), 1000);
                return;
            }

            this.showMessage('Invalid move', 'error');
            Debug.error('gameController', 'Error making move:', error);
        }
    }

    async makeAIMove() {
        try {
            // Get AI move suggestion using minimax for better gameplay
            const aiResponse = await this.api.getAIMove(this.gameId, 'hard', 'minimax');

            if (aiResponse.move) {
                // Execute the AI move
                const move = {
                    from: aiResponse.move.from,
                    to: aiResponse.move.to
                };

                const response = await this.api.makeMove(this.gameId, move);

                if (response.error) {
                    this.showMessage(`AI move failed: ${response.error}`, 'error');
                    this.isAITurn = false;
                    return;
                }

                this.gameState = response;
                this.updateBoard();
                this.updateGameInfo();
                this.updateMoveHistory();
                this.updateControlButtons();
                this.updateChat();
                this.isAITurn = false;

                this.showMessage(`AI played: ${aiResponse.move.notation}`, 'info');

                if (response.status === 'white_wins') {
                    this.showMessage(`Checkmate! AI wins!`, 'error');
                } else if (response.status === 'black_wins') {
                    this.showMessage(`Checkmate! You win!`, 'success');
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

            // If game was not found (backend restart), start a new game
            if (error.message === 'GAME_NOT_FOUND') {
                this.showMessage('Game lost - starting new game...', 'warning');
                setTimeout(() => this.startNewGame(), 1000);
                return;
            }

            this.showMessage('AI move failed', 'error');
            this.isAITurn = false;
        }
    }

    // Helper Methods
    async isGameValid() {
        if (!this.gameId) return false;

        try {
            const response = await this.api.getGame(this.gameId);
            return !!response;
        } catch (error) {
            if (error.message.includes('404') || error.message === 'GAME_NOT_FOUND') {
                return false;
            }
            // For other errors, assume game is still valid to avoid false positives
            return true;
        }
    }

    clearSelection() {
        $('.square').removeClass('selected valid-move');
        this.selectedSquare = null;
        this.validMoves = [];
    }

    isValidMove(from, to) {
        return this.validMoves.some(move => move.from === from && move.to === to);
    }

    highlightValidMoves() {
        this.validMoves.forEach(move => {
            $(`[data-position="${move.to}"]`).addClass('valid-move');
        });
    }

    getPieceAt(position) {
        return $(`[data-position="${position}"]`).data('piece') || '';
    }

    isPieceOwnedByCurrentPlayer(piece) {
        if (!piece || !this.gameState) return false;

        const isWhite = piece === piece.toUpperCase();
        const currentPlayer = this.gameState.active_color;

        return (currentPlayer === 'white' && isWhite) || (currentPlayer === 'black' && !isWhite);
    }

    isPawnPromotion(piece, from, to) {
        if (!piece || piece.toLowerCase() !== 'p') return false;

        const isWhitePawn = piece === piece.toUpperCase();
        const toRank = parseInt(to[1]);

        return (isWhitePawn && toRank === 8) || (!isWhitePawn && toRank === 1);
    }

    async getPromotionChoice() {
        return new Promise((resolve) => {
            // Create promotion dialog
            const $dialog = $(`
                <div class="promotion-dialog" style="
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    z-index: 1000; text-align: center;">
                    <h3>Choose promotion piece:</h3>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                        <button class="promotion-btn" data-piece="Q" style="font-size: 30px; padding: 10px;">♕</button>
                        <button class="promotion-btn" data-piece="R" style="font-size: 30px; padding: 10px;">♖</button>
                        <button class="promotion-btn" data-piece="B" style="font-size: 30px; padding: 10px;">♗</button>
                        <button class="promotion-btn" data-piece="N" style="font-size: 30px; padding: 10px;">♘</button>
                    </div>
                </div>
            `);

            $('body').append($dialog);

            $('.promotion-btn').on('click', function() {
                const piece = $(this).data('piece');
                $dialog.remove();
                resolve(piece);
            });
        });
    }

    updateBoard() {
        if (!this.gameState || !this.gameState.board) return;

        // Parse the board representation
        const lines = this.gameState.board.split('\n').filter(line => line.match(/^[1-8]/));

        lines.forEach((line, rankIndex) => {
            const rank = 8 - rankIndex;
            const pieces = line.split(' ').slice(1, 9); // Skip rank number

            pieces.forEach((piece, fileIndex) => {
                const file = String.fromCharCode(97 + fileIndex); // a, b, c, ...
                const position = file + rank;
                const $square = $(`[data-position="${position}"]`);

                if (piece === '.') {
                    $square.text('').removeData('piece');
                } else {
                    $square.text(this.getPieceSymbol(piece)).data('piece', piece);
                }
            });
        });
    }

    getPieceSymbol(piece) {
        const symbols = {
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        };
        return symbols[piece] || piece;
    }

    updateGameInfo() {
        if (!this.gameState) return;

        $('#current-player').text(this.gameState.active_color === 'white' ? 'White' : 'Black');
        $('#game-status').text(this.getStatusText(this.gameState.status));
        $('#move-count').text(this.gameState.move_count || 1);
    }

    getStatusText(status) {
        switch (status) {
            case 'in_progress': return 'In Progress';
            case 'check': return 'Check!';
            case 'white_wins': return 'White Wins!';
            case 'black_wins': return 'Black Wins!';
            case 'draw': return 'Draw';
            default: return status;
        }
    }

    updateMoveHistory() {
        const $movesList = $('#move-list');
        if (!$movesList.length || !this.gameState || !this.gameState.move_history) return;

        $movesList.empty();

        for (let i = 0; i < this.gameState.move_history.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.gameState.move_history[i];
            const blackMove = this.gameState.move_history[i + 1];

            const $moveItem = $(`
                <div class="move-item">
                    <span class="move-number">${moveNumber}.</span>
                    <span class="move-notation">${whiteMove ? whiteMove.notation : ''}</span>
                    <span class="move-notation">${blackMove ? blackMove.notation : ''}</span>
                </div>
            `);
            $movesList.append($moveItem);
        }

        // Scroll to bottom
        $movesList.scrollTop($movesList[0].scrollHeight);
    }

    updateControlButtons() {
        const $undoBtn = $('#undo-btn');
        const $hintBtn = $('#hint-btn');

        const playerColor = window.gameConfig?.config.playerColor || 'white';
        const currentTurn = this.gameState?.active_color || 'white';
        const isPlayerTurn = currentTurn === playerColor;

        if ($undoBtn.length) {
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

            $undoBtn.prop('disabled', !hasGameState || !hasValidUndo || !gameNotFinished || this.isAITurn);
        }

        if ($hintBtn.length) {
            // Enable hint button if:
            // - Game is in progress
            // - It's the player's turn (not AI's turn)
            // - Not currently processing AI move
            const hasGameState = !!this.gameState;
            const gameInProgress = this.gameState?.status === 'in_progress' || this.gameState?.status === 'check';

            // Hint should be available when it's the player's turn and not during AI processing
            $hintBtn.prop('disabled', !hasGameState || !gameInProgress || this.isAITurn || !isPlayerTurn);
        }
    }

    showMessage(message, type = 'info', duration = 3000) {
        // Remove existing messages
        $('.game-message').remove();

        // Create new message
        const $messageEl = $(`
            <div class="game-message game-message-${type}" style="
                margin: 10px 0; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold;
                background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
                color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
                border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
                opacity: 0;
            ">${message}</div>
        `);

        // Add to page and fade in
        $('.game-info').prepend($messageEl);
        $messageEl.animate({ opacity: 1 }, 200);

        // Auto-remove after duration
        setTimeout(() => {
            $messageEl.animate({ opacity: 0 }, 200, () => {
                $messageEl.remove();
            });
        }, duration);
    }

    showGameEnd(message, winner) {
        this.showMessage(message, winner === 'white' || winner === 'black' ? 'success' : 'info', 10000);
    }

    setButtonsEnabled(enabled) {
        $('.btn').prop('disabled', !enabled);
    }

    addLoadingState($element) {
        $element.addClass('loading');
    }

    removeLoadingState($element) {
        $element.removeClass('loading');
    }

    // Game Actions
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

            this.clearSelection();
            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();
            this.updateChat();

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
        $('.hint-from, .hint-to').removeClass('hint-from hint-to');

        // Highlight the hint move
        const $fromSquare = $(`[data-position="${from}"]`);
        const $toSquare = $(`[data-position="${to}"]`);

        if ($fromSquare.length) $fromSquare.addClass('hint-from');
        if ($toSquare.length) $toSquare.addClass('hint-to');

        // Remove hint highlights after 5 seconds
        setTimeout(() => {
            $('.hint-from, .hint-to').removeClass('hint-from hint-to');
        }, 5000);
    }

    updateChat() {
        // Update chat with current game state
        if (typeof chatManager !== 'undefined') {
            chatManager.setGameState(this.gameId, this.gameState);
        }
    }
}

// Initialize the game when document is ready
$(document).ready(function() {
    new ChessGameJQuery();
});
