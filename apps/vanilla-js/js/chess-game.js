// Chess Game API Interface
class ChessAPI {
    constructor(baseURL = 'http://localhost:8080') {
        this.baseURL = baseURL;
    }

    async createGame() {
        try {
            const response = await fetch(`${this.baseURL}/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(move)
            });
            if (!response.ok) {
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

    async getAIMove(gameId, level = 'medium', engine = 'random') {
        try {
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error getting AI move:', error);
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

        this.init();
    }

    async init() {
        this.createBoard();
        await this.startNewGame();
        this.setupEventListeners(); // Move this after the game is started
    }

    createBoard() {
        const boardContainer = document.getElementById('chess-board');
        if (!boardContainer) {
            console.error('Chess board container not found!');
            return;
        }

        boardContainer.innerHTML = ''; // Clear existing content

        // Create 64 squares (8x8 board)
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
            const game = await this.api.createGame();

            this.gameId = game.id;
            this.gameState = game;
            this.selectedSquare = null;
            this.validMoves = [];
            this.isAITurn = false; // Reset AI turn flag

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
        // Don't allow moves during AI turn
        if (this.isAITurn) {
            this.showMessage('Please wait - AI is thinking...', 'warning');
            return;
        }

        const square = event.target.closest('.square');
        const position = square.dataset.position;

        if (this.selectedSquare === position) {
            // Deselect if clicking the same square
            this.clearSelection();
            return;
        }

        if (this.selectedSquare && this.isValidMove(this.selectedSquare, position)) {
            // Make a move
            await this.makeMove(this.selectedSquare, position);
        } else {
            // Select a new square
            await this.selectSquare(position);
        }
    }

    async selectSquare(position) {
        this.clearSelection();

        const square = document.querySelector(`[data-position="${position}"]`);
        const piece = square.dataset.piece || ''; // Get piece notation from data attribute

        // Allow selection for human player only (white for now, could be changed for vs human)
        // Note: For testing, let's allow both colors to be selected
        const currentPlayer = this.gameState?.active_color;

        if (piece && this.isPieceOwnedByCurrentPlayer(piece)) {
            this.selectedSquare = position;
            square.classList.add('selected');

            try {
                const response = await this.api.getValidMoves(this.gameId, position);
                // Filter moves that start from the selected position
                this.validMoves = (response.legal_moves || []).filter(move => move.from === position);
                console.log(`Found ${this.validMoves.length} valid moves for ${position} (Game ID: ${this.gameId})`);

                this.highlightValidMoves();
            } catch (error) {
                console.error('Error getting valid moves:', error);
                this.validMoves = [];
                this.highlightValidMoves();
            }
        } else {
            console.log(`Cannot select piece: piece="${piece}", owned by current player: ${this.isPieceOwnedByCurrentPlayer(piece)}`);
        }
    }

    async makeMove(from, to) {
        try {
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
                console.log(`Making castling move: ${castlingMove.notation}`);
                move = { notation: castlingMove.notation };
            } else {
                // Regular move
                move = {
                    from: from,
                    to: to
                };

                // Check if this is a pawn promotion
                const piece = this.boardData[from];
                console.log(`Checking promotion for piece ${piece} moving from ${from} to ${to}`);
                const isPromotion = this.isPawnPromotion(piece, from, to);
                console.log(`Is promotion: ${isPromotion}`);

                if (isPromotion) {
                    console.log('Showing promotion dialog...');
                    const promotionPiece = await this.getPromotionChoice();
                    if (!promotionPiece) {
                        // User cancelled promotion
                        console.log('Promotion cancelled');
                        this.clearSelection();
                        this.removeLoadingState(board);
                        this.setButtonsEnabled(true);
                        return;
                    }
                    console.log(`Promotion piece selected: ${promotionPiece}`);
                    move.promotion = promotionPiece;
                }
            }

            console.log(`Making move: ${from} → ${to} for game ${this.gameId}`, move);
            const response = await this.api.makeMove(this.gameId, move);
            console.log('Move response:', response);

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
                // It's black's turn - make an AI move only if human is playing white
                console.log('Triggering AI move for black...');
                this.isAITurn = true; // Set this BEFORE any async operations
                console.log('Set isAITurn to true');
                this.showMessage('AI is thinking...', 'info');
                setTimeout(() => this.makeAIMove(), 1000); // Small delay for better UX
            } else {
                // Game ended or it's still the current player's turn
                console.log(`Game state after move: active_color=${response.active_color}, status=${response.status}`);
                this.isAITurn = false; // Make sure AI turn flag is reset
            }

        } catch (error) {
            // Remove loading state and re-enable buttons on error
            const board = document.querySelector('.chess-board');
            this.removeLoadingState(board);
            this.setButtonsEnabled(true);

            this.showMessage('Invalid move', 'error');
            console.error('Error making move:', error);
        }
    }

    async makeAIMove() {
        try {
            console.log('AI move starting, isAITurn:', this.isAITurn);
            // Get AI move suggestion using minimax for better gameplay
            const aiResponse = await this.api.getAIMove(this.gameId, 'hard', 'minimax');
            console.log('AI move suggestion:', aiResponse);

            if (aiResponse.move) {
                // Execute the AI move
                const move = {
                    from: aiResponse.move.from,
                    to: aiResponse.move.to
                };

                const response = await this.api.makeMove(this.gameId, move);
                console.log('AI move executed:', response);

                if (response.error) {
                    this.showMessage(`AI move failed: ${response.error}`, 'error');
                    this.isAITurn = false; // Reset on error
                    return;
                }

                this.gameState = response;
                this.updateBoard();
                this.updateGameInfo();
                this.updateMoveHistory();
                this.updateControlButtons();
                this.isAITurn = false; // AI turn complete
                console.log('AI turn completed, set isAITurn to false');

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

        console.log(`Piece check: "${piece}", isWhite: ${isWhitePiece}, currentPlayer: ${currentPlayer}`);

        const owned = (currentPlayer === 'white' && isWhitePiece) ||
                     (currentPlayer === 'black' && !isWhitePiece);

        console.log(`Piece owned by current player: ${owned}`);
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
        console.log('undoMove method called');
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

            // Reset AI turn flag to prevent issues
            this.isAITurn = false;

            // Create a new game
            const newGame = await this.api.createGame();

            // For undo, we typically want to undo both the player's last move AND the AI's last move
            // so the player can make a different move
            let movesToReplay = this.gameState.move_history.slice();

            // If the last move was by the AI (black), undo both AI and player moves
            if (this.gameState.active_color === 'white' && movesToReplay.length >= 2) {
                // Remove last 2 moves (AI move + player move) so player can try again
                movesToReplay = movesToReplay.slice(0, -2);
                console.log(`Undoing 2 moves (player + AI): replaying ${movesToReplay.length} moves`);
            } else {
                // Just undo the last move
                movesToReplay = movesToReplay.slice(0, -1);
                console.log(`Undoing 1 move: replaying ${movesToReplay.length} moves`);
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
            console.error('Undo error:', error);
            this.isAITurn = false; // Reset flag on error too
        }
    }

    async getHint() {
        console.log('getHint method called');
        if (this.isAITurn) {
            this.showMessage('AI is already thinking...', 'warning');
            return;
        }

        if (this.gameState?.status !== 'in_progress') {
            this.showMessage('Game is over - no hints available', 'warning');
            return;
        }

        try {
            this.showMessage('Getting hint...', 'info');
            const hintResponse = await this.api.getAIMove(this.gameId, 'expert', 'minimax');

            if (hintResponse.move) {
                const move = hintResponse.move;
                this.showMessage(`Hint: Move ${move.piece} from ${move.from} to ${move.to}`, 'success');

                // Highlight the suggested move
                this.highlightHint(move.from, move.to);
            } else {
                this.showMessage('No hint available', 'warning');
            }
        } catch (error) {
            this.showMessage('Failed to get hint', 'error');
            console.error('Hint error:', error);
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

        console.log('updateControlButtons called with gameState:', {
            hasGameState: !!this.gameState,
            status: this.gameState?.status,
            moveHistoryLength: this.gameState?.move_history?.length || 0,
            isAITurn: this.isAITurn,
            moveCount: this.gameState?.move_count,
            activeColor: this.gameState?.active_color
        });

        // Note: AI turn flag is managed by the makeAIMove function, don't reset it here

        if (undoBtn) {
            // Enable undo button if we have a game with moves - be more permissive
            const hasGameState = !!this.gameState;
            const hasMovesToUndo = this.gameState?.move_history && this.gameState.move_history.length > 0;
            const gameNotFinished = this.gameState?.status !== 'white_wins' && this.gameState?.status !== 'black_wins' && this.gameState?.status !== 'draw';

            // Only disable if no game state, no moves, game is finished, or actively AI thinking
            undoBtn.disabled = !hasGameState || !hasMovesToUndo || !gameNotFinished || this.isAITurn;
            console.log(`Undo button - hasGameState: ${hasGameState}, hasMovesToUndo: ${hasMovesToUndo}, gameNotFinished: ${gameNotFinished}, notAITurn: ${!this.isAITurn}`);
            console.log(`Undo button disabled: ${undoBtn.disabled}, moves: ${this.gameState?.move_history?.length || 0}, isAITurn: ${this.isAITurn}, status: ${this.gameState?.status}`);
        }

        if (hintBtn) {
            // Enable hint button if game is in progress and not AI's turn
            const hasGameState = !!this.gameState;
            const gameInProgress = this.gameState?.status === 'in_progress' || this.gameState?.status === 'check';

            hintBtn.disabled = !hasGameState || !gameInProgress || this.isAITurn;
            console.log(`Hint button - hasGameState: ${hasGameState}, gameInProgress: ${gameInProgress}, notAITurn: ${!this.isAITurn}`);
            console.log(`Hint button disabled: ${hintBtn.disabled}, status: ${this.gameState?.status}, isAITurn: ${this.isAITurn}`);
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
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
