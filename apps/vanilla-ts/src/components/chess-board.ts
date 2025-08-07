/**
 * Chess Board Component - Interactive chess board with drag & drop
 */

import {
  ChessPiece,
  Position,
  PieceColor,
  PieceType,
  GameState,
  DragState,
  ChessMove,
  LegalMove
} from '../types/chess.js';
import {
  parsePosition,
  positionToNotation,
  positionsEqual,
  pieceToUnicode,
  parsePieceString,
  createPieceString,
  isValidPosition,
  getAllPositions
} from '../utils/chess-utils.js';
import {
  getElement,
  createElement,
  addEventListenerTyped,
  addClass,
  removeClass,
  hasClass,
  setDataset,
  getDataset
} from '../utils/dom-utils.js';
import { Debug } from '../utils/debug.js';

export interface ChessBoardEvents {
  pieceSelected: (piece: ChessPiece, position: Position) => void;
  moveAttempted: (from: Position, to: Position) => void;
  squareClicked: (position: Position, piece?: ChessPiece | null) => void;
}

/**
 * Interactive Chess Board Component
 */
export class ChessBoard {
  private boardElement: HTMLElement;
  private gameState: GameState | null = null;
  private playerColor: PieceColor = PieceColor.WHITE;
  private dragState: DragState;
  private validMoves: Position[] = [];
  private lastMove: ChessMove | null = null;
  private eventListeners: Partial<ChessBoardEvents> = {};

  constructor(boardElementId: string = 'chess-board') {
    const selector = boardElementId.startsWith('#') ? boardElementId : `#${boardElementId}`;
    this.boardElement = getElement(selector);
    this.dragState = {
      isDragging: false,
      draggedPiece: null,
      sourceSquare: null,
      validMoves: []
    };

    this.initializeBoard();
    this.setupEventListeners();
  }

  /**
   * Register event listener
   */
  on<K extends keyof ChessBoardEvents>(event: K, listener: ChessBoardEvents[K]): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof ChessBoardEvents>(event: K, ...args: Parameters<ChessBoardEvents[K]>): void {
    const listener = this.eventListeners[event];
    if (listener) {
      (listener as any)(...args);
    }
  }

  /**
   * Initialize the chess board HTML structure
   */
  private initializeBoard(): void {
    this.boardElement.innerHTML = '';
    this.boardElement.className = 'chess-board';

    // Create squares
    for (let rank = 8; rank >= 1; rank--) {
      for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
        const square = this.createSquare({ file, rank });
        this.boardElement.appendChild(square);
      }
    }
  }

  /**
   * Create a chess board square element
   */
  private createSquare(position: Position): HTMLElement {
    const square = createElement('div', {
      className: `square ${this.getSquareColor(position)}`,
      dataset: {
        file: position.file,
        rank: position.rank.toString()
      }
    });

    return square;
  }

  /**
   * Get CSS class for square color
   */
  private getSquareColor(position: Position): string {
    const fileIndex = position.file.charCodeAt(0) - 'a'.charCodeAt(0);
    return (fileIndex + position.rank) % 2 === 1 ? 'light' : 'dark';
  }

  /**
   * Setup event listeners for board interaction
   */
  private setupEventListeners(): void {
    Debug.log('chessBoard', 'Setting up chess board event listeners on element:', this.boardElement);

    // Mouse events for desktop
    addEventListenerTyped(this.boardElement, 'mousedown', this.handleMouseDown.bind(this));
    addEventListenerTyped(this.boardElement, 'mousemove', this.handleMouseMove.bind(this));
    addEventListenerTyped(this.boardElement, 'mouseup', this.handleMouseUp.bind(this));

    // Touch events for mobile
    addEventListenerTyped(this.boardElement, 'touchstart', this.handleTouchStart.bind(this));
    addEventListenerTyped(this.boardElement, 'touchmove', this.handleTouchMove.bind(this));
    addEventListenerTyped(this.boardElement, 'touchend', this.handleTouchEnd.bind(this));

    // Click events
    addEventListenerTyped(this.boardElement, 'click', this.handleClick.bind(this));
    Debug.log('chessBoard', 'Click event listener bound to chess board');

    // Prevent default drag behavior
    addEventListenerTyped(this.boardElement, 'dragstart', (e) => e.preventDefault());
  }

  /**
   * Mouse event handlers
   */
  private handleMouseDown(event: MouseEvent): void {
    const square = this.getSquareFromEvent(event);
    if (square) {
      this.startDrag(square, { x: event.clientX, y: event.clientY });
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.dragState.isDragging) {
      this.updateDrag({ x: event.clientX, y: event.clientY });
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.dragState.isDragging) {
      const square = this.getSquareFromEvent(event);
      this.endDrag(square);
    }
  }

  /**
   * Touch event handlers
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
      const square = this.getSquareFromTouch(touch);
      if (square) {
        this.startDrag(square, { x: touch.clientX, y: touch.clientY });
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (this.dragState.isDragging) {
      const touch = event.touches[0];
      if (touch) {
        this.updateDrag({ x: touch.clientX, y: touch.clientY });
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (this.dragState.isDragging) {
      const touch = event.changedTouches[0];
      if (touch) {
        const square = this.getSquareFromTouch(touch);
        this.endDrag(square);
      }
    }
  }

  /**
   * Click handler for square selection
   */
  private handleClick(event: MouseEvent): void {
    Debug.log('userInput', 'Chess board click detected', event.target);

    if (this.dragState.isDragging) {
      Debug.log('userInput', 'Click ignored - drag in progress');
      return;
    }

    const square = this.getSquareFromEvent(event);
    if (!square) {
      Debug.warn('userInput', 'No square found for click');
      return;
    }

    const position = this.getPositionFromSquare(square);
    const piece = this.getPieceAtPosition(position);

    Debug.log('userInput', 'Click on square:', { position, piece: piece?.type, color: piece?.color, playerColor: this.playerColor });

    this.emit('squareClicked', position, piece);

    // Handle square selection
    if (piece && piece.color === this.playerColor) {
      Debug.log('userInput', 'Selecting piece:', piece.type);
      this.selectSquare(position);
      Debug.log('userInput', 'Emitting pieceSelected event');
      this.emit('pieceSelected', piece, position);
    } else if (this.hasSelectedSquare()) {
      const selectedPosition = this.getSelectedSquare();
      Debug.log('userInput', 'Attempting move from', selectedPosition, 'to', position);
      if (selectedPosition && !positionsEqual(selectedPosition, position)) {
        Debug.log('userInput', 'Emitting moveAttempted event');
        this.emit('moveAttempted', selectedPosition, position);
      }
      this.clearSelection();
    }
  }

  /**
   * Drag and drop handlers
   */
  private startDrag(square: HTMLElement, pointer: { x: number; y: number }): void {
    const position = this.getPositionFromSquare(square);
    const piece = this.getPieceAtPosition(position);

    if (!piece || piece.color !== this.playerColor) {
      return;
    }

    this.dragState = {
      isDragging: true,
      draggedPiece: piece,
      sourceSquare: position,
      validMoves: this.validMoves
    };

    addClass(square, 'dragging');
    this.highlightValidMoves(position);
    this.emit('pieceSelected', piece, position);

    // Create drag ghost element
    this.createDragGhost(piece, pointer);
  }

  private updateDrag(pointer: { x: number; y: number }): void {
    const dragGhost = getElement('.drag-ghost');
    if (dragGhost) {
      dragGhost.style.left = `${pointer.x - 30}px`;
      dragGhost.style.top = `${pointer.y - 30}px`;
    }
  }

  private endDrag(targetSquare: HTMLElement | null): void {
    if (!this.dragState.isDragging || !this.dragState.sourceSquare) {
      this.resetDragState();
      return;
    }

    const sourcePosition = this.dragState.sourceSquare;

    if (targetSquare) {
      const targetPosition = this.getPositionFromSquare(targetSquare);
      if (!positionsEqual(sourcePosition, targetPosition)) {
        this.emit('moveAttempted', sourcePosition, targetPosition);
      }
    }

    this.resetDragState();
  }

  /**
   * Reset drag state and cleanup
   */
  private resetDragState(): void {
    // Remove drag ghost
    const dragGhost = document.querySelector('.drag-ghost');
    if (dragGhost) {
      dragGhost.remove();
    }

    // Remove dragging class
    const draggingSquare = this.boardElement.querySelector('.dragging');
    if (draggingSquare) {
      removeClass(draggingSquare as HTMLElement, 'dragging');
    }

    // Clear highlights
    this.clearHighlights();

    this.dragState = {
      isDragging: false,
      draggedPiece: null,
      sourceSquare: null,
      validMoves: []
    };
  }

  /**
   * Create visual drag ghost element
   */
  private createDragGhost(piece: ChessPiece, pointer: { x: number; y: number }): void {
    const ghost = createElement('div', {
      className: 'drag-ghost',
      textContent: pieceToUnicode(piece.type, piece.color)
    });

    ghost.style.left = `${pointer.x - 30}px`;
    ghost.style.top = `${pointer.y - 30}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '1000';

    document.body.appendChild(ghost);
  }

  /**
   * Utility methods for square and position handling
   */
  private getSquareFromEvent(event: MouseEvent): HTMLElement | null {
    const target = event.target as HTMLElement;
    return target.closest('.square') as HTMLElement | null;
  }

  private getSquareFromTouch(touch: Touch): HTMLElement | null {
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    return element?.closest('.square') as HTMLElement | null;
  }

  private getPositionFromSquare(square: HTMLElement): Position {
    const file = getDataset(square, 'file')!;
    const rank = parseInt(getDataset(square, 'rank')!, 10);
    return { file, rank };
  }

  private getSquareElement(position: Position): HTMLElement {
    return getElement(`[data-file="${position.file}"][data-rank="${position.rank}"]`, this.boardElement);
  }

  /**
   * Game state management
   */
  updateGameState(gameState: GameState): void {
    this.gameState = gameState;
    this.renderPieces();
    this.updateMoveHighlight();
  }

  setPlayerColor(color: PieceColor): void {
    this.playerColor = color;
    this.boardElement.classList.toggle('flipped', color === PieceColor.BLACK);
  }

  setValidMoves(moves: string[] | LegalMove[]): void {
    if (moves.length === 0) {
      this.validMoves = [];
      return;
    }

    // Handle different input types
    if (typeof moves[0] === 'string') {
      this.validMoves = (moves as string[]).map(parsePosition);
    } else {
      // Extract 'to' positions from LegalMove objects
      this.validMoves = (moves as LegalMove[]).map(move => parsePosition(move.to));
    }
  }

  setLastMove(move: ChessMove | null): void {
    this.lastMove = move;
    this.updateMoveHighlight();
  }

  /**
   * Piece rendering
   */
  private renderPieces(): void {
    // Clear all pieces
    this.boardElement.querySelectorAll('.piece').forEach(piece => piece.remove());

    Debug.log('boardRendering', 'renderPieces called, gameState:', this.gameState);

    if (!this.gameState) {
      Debug.warn('boardRendering', 'No game state, rendering initial position');
      this.renderInitialPosition();
      return;
    }

    // Try to parse pieces from pieces array first, then fall back to board parsing
    if (this.gameState.pieces && this.gameState.pieces.length > 0) {
      Debug.log('boardRendering', 'Using pieces array:', this.gameState.pieces.length, 'pieces');
      this.gameState.pieces.forEach(piece => {
        this.placePiece(piece);
      });
    } else if (this.gameState.board) {
      Debug.log('boardRendering', 'Parsing board string:', this.gameState.board.substring(0, 50) + '...');
      this.parseBoardString(this.gameState.board);
    } else {
      Debug.log('boardRendering', 'No pieces array or board, using initial position');
      // Fallback to initial position
      this.renderInitialPosition();
    }
  }

  /**
   * Parse board from string representation (FEN-like or visual format)
   */
  private parseBoardString(boardString: string): void {
    Debug.log('boardRendering', 'parseBoardString called with:', boardString);
    const lines = boardString.split('\n').filter(line => line.trim());
    Debug.log('boardRendering', 'Filtered lines:', lines);

    // Find lines that look like board ranks (start with rank number, end with rank number)
    // Accept any line that starts and ends with a rank number (1-8)
    const boardLines = lines.filter(line => {
      const trimmed = line.trim();
      const startsWithRank = /^[1-8]\s/.test(trimmed);
      const endsWithRank = /\s[1-8]$/.test(trimmed);
      Debug.log('boardRendering', `Testing line: "${trimmed}" - starts: ${startsWithRank}, ends: ${endsWithRank}`);
      return startsWithRank && endsWithRank;
    });

    Debug.log('boardRendering', 'Board lines found:', boardLines.length, boardLines);

    if (boardLines.length === 8) {
      Debug.log('boardRendering', 'Using visual board parser');
      this.parseVisualBoard(boardLines);
    } else {
      Debug.log('boardRendering', 'Trying FEN parser');
      // Try FEN format
      this.parseFEN(boardString);
    }
  }

  /**
   * Parse visual board format like:
   * 8 r n b q k b n r 8
   * 7 p p p p p p p p 7
   */
  private parseVisualBoard(boardLines: string[]): void {
    Debug.log('boardRendering', 'parseVisualBoard called with', boardLines.length, 'lines');
    for (let i = 0; i < 8; i++) {
      const line = boardLines[i];
      if (!line) {
        Debug.error('boardRendering', `Line ${i} is undefined`);
        continue;
      }
      Debug.log('boardRendering', `Processing line ${i}:`, line);
      // Example: '8 r n b q k b n r 8'
      const trimmedLine = line.trim();
      // Remove rank numbers at start/end
      const rankMatch = trimmedLine.match(/^([1-8]) (.*) ([1-8])$/);
      if (!rankMatch || !rankMatch[1] || !rankMatch[2]) {
        Debug.error('boardRendering', `No rank match for line: ${trimmedLine}`);
        continue;
      }
      const rank = parseInt(rankMatch[1] as string);
      const pieceChars = (rankMatch[2] as string).split(/\s+/);
      Debug.log('boardRendering', `Rank ${rank}, pieces:`, pieceChars);

      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const pieceChar = pieceChars[fileIndex];
        if (!pieceChar || pieceChar === '.' || pieceChar === ' ') {
          Debug.log('boardRendering', `Empty square at ${String.fromCharCode('a'.charCodeAt(0) + fileIndex)}${rank}`);
          continue;
        }
        const file = String.fromCharCode('a'.charCodeAt(0) + fileIndex);
        Debug.log('boardRendering', `Trying to place piece '${pieceChar}' at ${file}${rank}`);
        const piece = this.charToPiece(pieceChar, { file, rank });
        if (piece) {
          Debug.log('boardRendering', `✅ Placing piece:`, piece);
          this.placePiece(piece);
        } else {
          Debug.log('boardRendering', `❌ Failed to create piece from '${pieceChar}'`);
        }
      }
    }
  }

  /**
   * Parse FEN board position
   */
  private parseFEN(fen: string): void {
    const fenParts = fen.split(' ');
    const boardPart = fenParts[0];
    if (!boardPart) return;

    const ranks = boardPart.split('/');

    ranks.forEach((rankString, rankIndex) => {
      const rank = 8 - rankIndex;
      let file = 0;

      for (let i = 0; i < rankString.length; i++) {
        const char = rankString[i];
        if (!char) continue;

        if (/[1-8]/.test(char)) {
          // Empty squares
          file += parseInt(char);
        } else {
          // Piece
          const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
          const piece = this.charToPiece(char, { file: fileChar, rank });
          if (piece) {
            this.placePiece(piece);
          }
          file++;
        }
      }
    });
  }

  /**
   * Convert piece character to ChessPiece object
   */
  private charToPiece(char: string, position: Position): ChessPiece | null {
    Debug.log('boardRendering', `🔍 charToPiece: converting '${char}' at ${position.file}${position.rank}`);
    const isWhite = char === char.toUpperCase();
    const pieceType = this.charToPieceType(char.toLowerCase());

    Debug.log('boardRendering', `🎯 Piece analysis: char='${char}', isWhite=${isWhite}, pieceType=${pieceType}`);

    if (!pieceType) {
      Debug.log('boardRendering', `❌ Unknown piece type for '${char}'`);
      return null;
    }

    const piece = {
      type: pieceType,
      color: isWhite ? PieceColor.WHITE : PieceColor.BLACK,
      position
    };

    Debug.log('boardRendering', `✅ Created piece:`, piece);
    return piece;
  }  /**
   * Convert character to piece type
   */
  private charToPieceType(char: string): PieceType | null {
    switch (char) {
      case 'p': return PieceType.PAWN;
      case 'r': return PieceType.ROOK;
      case 'n': return PieceType.KNIGHT;
      case 'b': return PieceType.BISHOP;
      case 'q': return PieceType.QUEEN;
      case 'k': return PieceType.KING;
      default: return null;
    }
  }

  private renderInitialPosition(): void {
    // For now, render the standard starting position
    // This should be replaced with actual game state parsing
    const initialPieces = this.getInitialPieces();

    initialPieces.forEach(piece => {
      this.placePiece(piece);
    });
  }

  private getInitialPieces(): ChessPiece[] {
    // Standard chess starting position
    const pieces: ChessPiece[] = [];

    // Define piece order for back rank
    const backRank: PieceType[] = [
      PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
      PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
    ];

    // White pieces
    backRank.forEach((type, index) => {
      const file = String.fromCharCode('a'.charCodeAt(0) + index);
      pieces.push({ type, color: PieceColor.WHITE, position: { file, rank: 1 } });
    });

    // White pawns
    for (let i = 0; i < 8; i++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + i);
      pieces.push({ type: PieceType.PAWN, color: PieceColor.WHITE, position: { file, rank: 2 } });
    }

    // Black pawns
    for (let i = 0; i < 8; i++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + i);
      pieces.push({ type: PieceType.PAWN, color: PieceColor.BLACK, position: { file, rank: 7 } });
    }

    // Black pieces
    backRank.forEach((type, index) => {
      const file = String.fromCharCode('a'.charCodeAt(0) + index);
      pieces.push({ type, color: PieceColor.BLACK, position: { file, rank: 8 } });
    });

    return pieces;
  }

  private placePiece(piece: ChessPiece): void {
    Debug.log('boardRendering', '🎭 Placing piece:', piece);
    const square = this.getSquareElement(piece.position);
    Debug.log('boardRendering', '📍 Square element:', square);

    const pieceElement = createElement('div', {
      className: `piece ${piece.color}-${piece.type}`,
      textContent: pieceToUnicode(piece.type, piece.color),
      dataset: {
        piece: createPieceString(piece.type, piece.color),
        color: piece.color
      }
    });

    Debug.log('boardRendering', '🎯 Created piece element:', pieceElement);
    square.appendChild(pieceElement);
  }

  private getPieceAtPosition(position: Position): ChessPiece | null {
    const square = this.getSquareElement(position);
    const pieceElement = square.querySelector('.piece');

    if (!pieceElement) return null;

    const pieceData = getDataset(pieceElement as HTMLElement, 'piece');
    if (!pieceData) return null;

    const { type, color } = parsePieceString(pieceData);
    return { type, color, position };
  }

  /**
   * Visual feedback methods
   */
  private highlightValidMoves(fromPosition: Position): void {
    this.clearHighlights();

    // Highlight source square
    const sourceSquare = this.getSquareElement(fromPosition);
    addClass(sourceSquare, 'selected');

    // Highlight valid moves
    this.validMoves.forEach(move => {
      const square = this.getSquareElement(move);
      addClass(square, 'valid-move');
    });
  }

  private clearHighlights(): void {
    this.boardElement.querySelectorAll('.selected, .valid-move, .last-move-from, .last-move-to, .hint-from, .hint-to')
      .forEach(element => {
        removeClass(element as HTMLElement, 'selected', 'valid-move', 'last-move-from', 'last-move-to', 'hint-from', 'hint-to');
      });
  }

  /**
   * Highlight a hint move on the board
   */
  public highlightHint(move: ChessMove): void {
    // Clear only previous hints (not all highlights)
    this.boardElement.querySelectorAll('.hint-from, .hint-to').forEach(element => {
      removeClass(element as HTMLElement, 'hint-from', 'hint-to');
    });

    try {
      // Parse the move coordinates
      const fromPosition = parsePosition(move.from);
      const toPosition = parsePosition(move.to);

      // Highlight the from and to squares
      const fromSquare = this.getSquareElement(fromPosition);
      const toSquare = this.getSquareElement(toPosition);

      addClass(fromSquare, 'hint-from');
      addClass(toSquare, 'hint-to');

      Debug.log('boardRendering', 'Hint highlighted:', move.from, 'to', move.to);

      // Auto-clear hint after 5 seconds
      setTimeout(() => {
        removeClass(fromSquare, 'hint-from');
        removeClass(toSquare, 'hint-to');
        Debug.log('boardRendering', 'Hint highlight cleared');
      }, 5000);

    } catch (error) {
      Debug.error('boardRendering', 'Failed to highlight hint:', error);
    }
  }

  private updateMoveHighlight(): void {
    this.boardElement.querySelectorAll('.last-move-from, .last-move-to')
      .forEach(element => {
        removeClass(element as HTMLElement, 'last-move-from', 'last-move-to');
      });

    if (this.lastMove && this.lastMove.from && this.lastMove.to) {
      Debug.log('boardRendering', '🎯 Highlighting last move:', this.lastMove.from, 'to', this.lastMove.to);
      // Parse string coordinates to Position objects
      const fromPosition = parsePosition(this.lastMove.from);
      const toPosition = parsePosition(this.lastMove.to);

      const fromSquare = this.getSquareElement(fromPosition);
      const toSquare = this.getSquareElement(toPosition);
      addClass(fromSquare, 'last-move-from');
      addClass(toSquare, 'last-move-to');
    } else if (this.lastMove) {
      console.warn('⚠️ Last move missing from/to fields:', this.lastMove);
    }
  }

  /**
   * Selection management
   */
  private selectSquare(position: Position): void {
    this.clearSelection();
    const square = this.getSquareElement(position);
    addClass(square, 'selected');
    this.highlightValidMoves(position);
  }

  private clearSelection(): void {
    this.clearHighlights();
  }

  private hasSelectedSquare(): boolean {
    return this.boardElement.querySelector('.selected') !== null;
  }

  private getSelectedSquare(): Position | null {
    const selectedSquare = this.boardElement.querySelector('.selected') as HTMLElement;
    if (!selectedSquare) return null;
    return this.getPositionFromSquare(selectedSquare);
  }

  /**
   * Animation methods
   */
  animateMove(from: Position, to: Position): Promise<void> {
    return new Promise((resolve) => {
      const fromSquare = this.getSquareElement(from);
      const toSquare = this.getSquareElement(to);
      const piece = fromSquare.querySelector('.piece') as HTMLElement;

      if (!piece) {
        resolve();
        return;
      }

      // Calculate movement
      const fromRect = fromSquare.getBoundingClientRect();
      const toRect = toSquare.getBoundingClientRect();
      const deltaX = toRect.left - fromRect.left;
      const deltaY = toRect.top - fromRect.top;

      // Apply transform
      piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      piece.style.transition = 'transform 0.3s ease-in-out';

      setTimeout(() => {
        piece.style.transform = '';
        piece.style.transition = '';
        resolve();
      }, 300);
    });
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    this.resetDragState();
    this.boardElement.innerHTML = '';
  }
}
