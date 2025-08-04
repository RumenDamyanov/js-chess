// Chess Game with jQuery - Enhanced Version
class ChessGameJQuery {
    constructor() {
        this.api = new ChessAPI();
        this.gameId = null;
        this.gameState = null;
        this.selectedSquare = null;
        this.validMoves = [];
        this.isAITurn = false;

        this.init();
    }

    async init() {
        this.createBoard();
        await this.startNewGame();
        this.setupEventListeners();
    }

    createBoard() {
        const $boardContainer = $('#chess-board');
        if ($boardContainer.length === 0) {
            console.error('Chess board container not found!');
            return;
        }

        $boardContainer.empty();

        // Create 64 squares (8x8 board)
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
            this.showMessage(`New game started! Game ID: ${this.gameId}`, 'success');
        } catch (error) {
            this.showMessage('Failed to start new game. Check if backend is running.', 'error');
            console.error('Error starting new game:', error);
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
                console.log(`Found ${this.validMoves.length} valid moves for ${position} (Game ID: ${this.gameId})`);
            } catch (error) {
                console.error('Error getting valid moves:', error);
                this.validMoves = [];
            }
        } else {
            console.log(`Cannot select piece: piece="${piece}", owned by current player: ${this.isPieceOwnedByCurrentPlayer(piece)}`);
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
            console.error('Error making move:', error);
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
            console.error('Error making AI move:', error);

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
        $movesList.empty();

        if (!this.gameState?.move_history) return;

        this.gameState.move_history.forEach((move, index) => {
            const $moveItem = $(`
                <div class="move-item">
                    <span class="move-number">${index + 1}.</span>
                    <span class="move-notation">${move.notation || `${move.from}-${move.to}`}</span>
                </div>
            `);
            $movesList.append($moveItem);
        });

        // Scroll to bottom
        $movesList.scrollTop($movesList[0].scrollHeight);
    }

    updateControlButtons() {
        // Note: AI turn flag is managed by the makeAIMove function

        const $undoBtn = $('#undo-btn');
        if ($undoBtn.length) {
            const hasGameState = !!this.gameState;
            const hasMovesToUndo = this.gameState?.move_history && this.gameState.move_history.length > 0;
            const gameNotFinished = this.gameState?.status !== 'white_wins' && this.gameState?.status !== 'black_wins' && this.gameState?.status !== 'draw';
            const notAITurn = !this.isAITurn;

            $undoBtn.prop('disabled', !(hasGameState && hasMovesToUndo && gameNotFinished && notAITurn));
        }

        const $hintBtn = $('#hint-btn');
        if ($hintBtn.length) {
            const hasGameState = !!this.gameState;
            const gameInProgress = this.gameState?.status === 'in_progress' || this.gameState?.status === 'check';
            const notAITurn = !this.isAITurn;

            $hintBtn.prop('disabled', !(hasGameState && gameInProgress && notAITurn));
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
        if (!this.gameState || !this.gameState.move_history || this.gameState.move_history.length === 0) {
            this.showMessage('No moves to undo', 'warning');
            return;
        }

        if (this.isAITurn) {
            this.showMessage('Cannot undo while AI is thinking', 'warning');
            return;
        }

        try {
            this.showMessage('Undoing last move...', 'info');
            this.isAITurn = false;

            // Create a new game and replay moves up to the last human move
            const game = await this.api.createGame();
            this.gameId = game.id;
            this.gameState = game;

            const movesToReplay = this.gameState.move_history.slice(0, -2); // Remove last 2 moves (human + AI)

            for (const moveData of movesToReplay) {
                if (moveData.notation) {
                    await this.api.makeMove(this.gameId, { notation: moveData.notation });
                } else {
                    await this.api.makeMove(this.gameId, { from: moveData.from, to: moveData.to });
                }
            }

            // Get the updated game state
            this.gameState = await this.api.getGame(this.gameId);
            this.clearSelection();
            this.updateBoard();
            this.updateGameInfo();
            this.updateMoveHistory();
            this.updateControlButtons();

            this.showMessage('Move undone', 'success');
        } catch (error) {
            console.error('Error undoing move:', error);
            this.showMessage('Failed to undo move', 'error');
        }
    }

    async getHint() {
        if (!this.gameState || this.isAITurn) {
            this.showMessage('Cannot get hint right now', 'warning');
            return;
        }

        try {
            this.showMessage('Getting hint...', 'info');
            const aiResponse = await this.api.getAIMove(this.gameId, 'hard', 'minimax');

            if (aiResponse.move) {
                const move = aiResponse.move;
                this.showMessage(`Hint: Try ${move.notation || `${move.from} → ${move.to}`}`, 'info', 5000);

                // Highlight the suggested move
                this.clearSelection();
                $(`[data-position="${move.from}"]`).addClass('selected');
                $(`[data-position="${move.to}"]`).addClass('valid-move');
            } else {
                this.showMessage('No hint available', 'warning');
            }
        } catch (error) {
            console.error('Error getting hint:', error);
            this.showMessage('Failed to get hint', 'error');
        }
    }
}

// Chess API Class
class ChessAPI {
    constructor() {
        this.baseURL = 'http://localhost:8080';
    }

    async createGame() {
        try {
            const response = await fetch(`${this.baseURL}/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating game:', error);
            throw error;
        }
    }

    async getGame(gameId) {
        try {
            const response = await fetch(`${this.baseURL}/api/games/${gameId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('GAME_NOT_FOUND');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting game:', error);
            throw error;
        }
    }

    async makeMove(gameId, move) {
        try {
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/moves`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(move)
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('GAME_NOT_FOUND');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error making move:', error);
            throw error;
        }
    }

    async getValidMoves(gameId, position) {
        try {
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/legal-moves`);
            if (!response.ok) {
                console.warn(`Legal moves endpoint returned status ${response.status}: ${response.statusText}`);
                return { legal_moves: [] };
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error getting legal moves:', error);
            return { legal_moves: [] };
        }
    }

    async getAIMove(gameId, difficulty = 'medium', algorithm = 'minimax') {
        try {
            const response = await fetch(`${this.baseURL}/api/games/${gameId}/ai-move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    difficulty: difficulty,
                    algorithm: algorithm
                })
            });
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('GAME_NOT_FOUND');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting AI move:', error);
            throw error;
        }
    }
}

// Initialize the game when document is ready
$(document).ready(function() {
    new ChessGameJQuery();
});
