import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChessService, GameState, LegalMove, MoveRequest, AIHint } from '../../services/chess.service';

interface PawnPromotionDialog {
  show: boolean;
  from: string;
  to: string;
  currentPlayer: 'white' | 'black';
}

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chess-board-container">
      <!-- Chess Board -->
      <div class="chess-board">
        <div
          *ngFor="let square of boardSquares; trackBy: trackBySquare"
          class="square"
          [class.light]="isLightSquare(square.row, square.col)"
          [class.dark]="!isLightSquare(square.row, square.col)"
          [class.selected]="selectedSquare === square.position"
          [class.legal-move]="isLegalMoveTarget(square.position)"
          [class.last-move]="isLastMoveSquare(square.position)"
          [class.in-check]="isKingInCheck(square.position)"
          [class.hint-from]="isHintFromSquare(square.position)"
          [class.hint-to]="isHintToSquare(square.position)"
          (click)="onSquareClick(square.position)"
        >
          <span class="piece" *ngIf="square.piece">
            {{ getPieceSymbol(square.piece) }}
          </span>
          <div class="legal-move-indicator" *ngIf="isLegalMoveTarget(square.position)"></div>
        </div>
      </div>

      <!-- Pawn Promotion Dialog -->
      <div class="pawn-promotion-overlay" *ngIf="pawnPromotionDialog.show">
        <div class="pawn-promotion-dialog">
          <h3>Choose promotion piece:</h3>
          <div class="promotion-pieces">
            <button
              *ngFor="let piece of getPromotionPieces()"
              class="promotion-piece"
              (click)="onPromotionSelect(piece.symbol)"
            >
              {{ piece.display }} {{ piece.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chess-board.component.css']
})
export class ChessBoardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() gameState: GameState | null = null;
  @Input() legalMoves: LegalMove[] = [];
  @Input() loading = false;
  @Input() aiHint: AIHint | null = null;
  @Output() moveMade = new EventEmitter<MoveRequest>();
  @Output() squareSelected = new EventEmitter<string>();

  boardSquares: Array<{ row: number; col: number; position: string; piece: string }> = [];
  selectedSquare = '';
  pawnPromotionDialog: PawnPromotionDialog = {
    show: false,
    from: '',
    to: '',
    currentPlayer: 'white'
  };

  private destroy$ = new Subject<void>();

  constructor(private chessService: ChessService) {}

  ngOnInit(): void {
    this.initializeBoard();
    this.updateBoardFromGameState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.updateBoardFromGameState();
  }

  initializeBoard(): void {
    this.boardSquares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const position = this.chessService.coordsToSquare(row, col);
        this.boardSquares.push({
          row,
          col,
          position,
          piece: ' '
        });
      }
    }
  }

  updateBoardFromGameState(): void {
    if (!this.gameState) {
      return;
    }

    const board = this.chessService.parseBoard(this.gameState.board);

    this.boardSquares.forEach(square => {
      square.piece = board[square.row][square.col];
    });
  }

  onSquareClick(position: string): void {
    if (this.loading || this.pawnPromotionDialog.show) {
      return;
    }

    // If no square is selected, select this square (if it has a piece)
    if (!this.selectedSquare) {
      const square = this.boardSquares.find(s => s.position === position);
      if (square && square.piece && square.piece !== ' ') {
        this.selectedSquare = position;
        this.squareSelected.emit(position);
      }
      return;
    }

    // If same square clicked, deselect
    if (this.selectedSquare === position) {
      this.selectedSquare = '';
      this.squareSelected.emit('');
      return;
    }

    // If different square with own piece clicked, select it
    const targetSquare = this.boardSquares.find(s => s.position === position);
    if (targetSquare && targetSquare.piece && targetSquare.piece !== ' ') {
      // Check if it's the current player's piece
      const isWhitePiece = targetSquare.piece === targetSquare.piece.toUpperCase();
      const isCurrentPlayerPiece = (this.gameState?.currentPlayer === 'white') === isWhitePiece;

      if (isCurrentPlayerPiece) {
        this.selectedSquare = position;
        this.squareSelected.emit(position);
        return;
      }
    }

    // Check if this is a legal move
    const legalMove = this.legalMoves.find(
      move => move.from === this.selectedSquare && move.to === position
    );

    if (legalMove) {
      // Check if this is a pawn promotion by detecting pawn reaching promotion rank
      const fromSquare = this.boardSquares.find(s => s.position === this.selectedSquare);
      const movingPiece = fromSquare?.piece;
      const isPawn = movingPiece && (movingPiece.toLowerCase() === 'p');
      const toRank = parseInt(position[1]);
      const isPromotionMove = isPawn && (toRank === 8 || toRank === 1);

      if (isPromotionMove || (legalMove.promotionPieces && legalMove.promotionPieces.length > 0)) {
        this.pawnPromotionDialog = {
          show: true,
          from: this.selectedSquare,
          to: position,
          currentPlayer: this.gameState?.currentPlayer || 'white'
        };
        return;
      }

      // Make the move
      this.makeMove(this.selectedSquare, position);
    }

    // Clear selection
    this.selectedSquare = '';
    this.squareSelected.emit('');
  }

  onPromotionSelect(piece: string): void {
    if (!this.pawnPromotionDialog.show) {
      return;
    }

    this.makeMove(
      this.pawnPromotionDialog.from,
      this.pawnPromotionDialog.to,
      piece
    );

    this.pawnPromotionDialog.show = false;
    this.selectedSquare = '';
    this.squareSelected.emit('');
  }

  makeMove(from: string, to: string, promotion?: string): void {
    // Check if this is a castling move by finding the matching legal move
    const legalMove = this.legalMoves.find(
      move => move.from === from && move.to === to
    );

    let move: MoveRequest;
    if (legalMove && legalMove.type === 'castling') {
      // For castling moves, use the notation
      move = { notation: legalMove.notation };
    } else {
      // For regular moves, use from/to coordinates
      move = { from, to };
      if (promotion) {
        move.promotion = promotion;
      }
    }

    this.moveMade.emit(move);
  }

  isLightSquare(row: number, col: number): boolean {
    return this.chessService.isLightSquare(row, col);
  }

  isLegalMoveTarget(position: string): boolean {
    if (!this.selectedSquare) {
      return false;
    }
    return this.legalMoves.some(
      move => move.from === this.selectedSquare && move.to === position
    );
  }

  isLastMoveSquare(position: string): boolean {
    if (!this.gameState?.lastMove) {
      return false;
    }
    return position === this.gameState.lastMove.from || position === this.gameState.lastMove.to;
  }

  isKingInCheck(position: string): boolean {
    if (!this.gameState || this.gameState.status !== 'check') {
      return false;
    }

    const square = this.boardSquares.find(s => s.position === position);
    if (!square || !square.piece) {
      return false;
    }

    // Check if this is the king of the current player
    const isKing = square.piece.toLowerCase() === 'k';
    const isWhiteKing = square.piece === 'K';
    const isCurrentPlayerKing = (this.gameState.currentPlayer === 'white') === isWhiteKing;

    return isKing && isCurrentPlayerKing;
  }

  isHintFromSquare(position: string): boolean {
    return this.aiHint?.from === position;
  }

  isHintToSquare(position: string): boolean {
    return this.aiHint?.to === position;
  }

  getPieceSymbol(piece: string): string {
    return this.chessService.getPieceSymbol(piece);
  }

  getPromotionPieces(): Array<{ symbol: string; display: string; name: string }> {
    const isWhite = this.pawnPromotionDialog.currentPlayer === 'white';

    if (isWhite) {
      return [
        { symbol: 'Q', display: '♕', name: 'Queen' },
        { symbol: 'R', display: '♖', name: 'Rook' },
        { symbol: 'B', display: '♗', name: 'Bishop' },
        { symbol: 'N', display: '♘', name: 'Knight' }
      ];
    } else {
      return [
        { symbol: 'q', display: '♛', name: 'Queen' },
        { symbol: 'r', display: '♜', name: 'Rook' },
        { symbol: 'b', display: '♝', name: 'Bishop' },
        { symbol: 'n', display: '♞', name: 'Knight' }
      ];
    }
  }

  trackBySquare(index: number, square: any): string {
    return square.position;
  }
}
