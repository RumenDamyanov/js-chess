/**
 * Chess-related utility functions
 */

import { Position, PieceColor, PieceType, ChessPiece } from '../types/chess.js';

/**
 * Converts algebraic notation to Position object
 */
export function parsePosition(notation: string): Position {
  if (notation.length !== 2) {
    throw new Error(`Invalid position notation: ${notation}`);
  }

  const file = notation[0];
  const rankStr = notation[1];

  if (!file || !rankStr) {
    throw new Error(`Invalid position notation: ${notation}`);
  }

  const rank = parseInt(rankStr, 10);

  if (file < 'a' || file > 'h' || rank < 1 || rank > 8) {
    throw new Error(`Invalid position notation: ${notation}`);
  }

  return { file, rank };
}

/**
 * Converts Position object to algebraic notation
 */
export function positionToNotation(position: Position): string {
  return `${position.file}${position.rank}`;
}

/**
 * Checks if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.file === pos2.file && pos1.rank === pos2.rank;
}

/**
 * Gets the opposite color
 */
export function oppositeColor(color: PieceColor): PieceColor {
  return color === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
}

/**
 * Converts piece type to Unicode symbol
 */
export function pieceToUnicode(piece: PieceType, color: PieceColor): string {
  const pieces = {
    [PieceColor.WHITE]: {
      [PieceType.KING]: '♔',
      [PieceType.QUEEN]: '♕',
      [PieceType.ROOK]: '♖',
      [PieceType.BISHOP]: '♗',
      [PieceType.KNIGHT]: '♘',
      [PieceType.PAWN]: '♙'
    },
    [PieceColor.BLACK]: {
      [PieceType.KING]: '♚',
      [PieceType.QUEEN]: '♛',
      [PieceType.ROOK]: '♜',
      [PieceType.BISHOP]: '♝',
      [PieceType.KNIGHT]: '♞',
      [PieceType.PAWN]: '♟'
    }
  };

  return pieces[color][piece];
}

/**
 * Parses piece information from string (e.g., "white-king")
 */
export function parsePieceString(pieceStr: string): { type: PieceType; color: PieceColor } {
  const [colorStr, typeStr] = pieceStr.split('-');

  const color = colorStr === 'white' ? PieceColor.WHITE : PieceColor.BLACK;
  const type = typeStr as PieceType;

  if (!Object.values(PieceType).includes(type)) {
    throw new Error(`Invalid piece type: ${typeStr}`);
  }

  return { type, color };
}

/**
 * Creates piece string from type and color (e.g., "white-king")
 */
export function createPieceString(type: PieceType, color: PieceColor): string {
  return `${color}-${type}`;
}

/**
 * Checks if a position is on the board
 */
export function isValidPosition(position: Position): boolean {
  return position.file >= 'a' &&
         position.file <= 'h' &&
         position.rank >= 1 &&
         position.rank <= 8;
}

/**
 * Gets all positions on the chess board
 */
export function getAllPositions(): Position[] {
  const positions: Position[] = [];
  for (let file = 'a'; file <= 'h'; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
    for (let rank = 1; rank <= 8; rank++) {
      positions.push({ file, rank });
    }
  }
  return positions;
}

/**
 * Calculates distance between two positions
 */
export function positionDistance(pos1: Position, pos2: Position): number {
  const fileDiff = Math.abs(pos1.file.charCodeAt(0) - pos2.file.charCodeAt(0));
  const rankDiff = Math.abs(pos1.rank - pos2.rank);
  return Math.max(fileDiff, rankDiff);
}

/**
 * Checks if a square is light or dark
 */
export function isLightSquare(position: Position): boolean {
  const fileIndex = position.file.charCodeAt(0) - 'a'.charCodeAt(0);
  return (fileIndex + position.rank) % 2 === 1;
}

/**
 * Gets the file index (0-7) from file letter
 */
export function getFileIndex(file: string): number {
  return file.charCodeAt(0) - 'a'.charCodeAt(0);
}

/**
 * Gets file letter from index (0-7)
 */
export function getFileFromIndex(index: number): string {
  return String.fromCharCode('a'.charCodeAt(0) + index);
}

/**
 * Creates initial chess board position
 */
export function createInitialPosition(): ChessPiece[] {
  const pieces: ChessPiece[] = [];

  // White pieces
  const whiteBackRank: PieceType[] = [
    PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
    PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
  ];

  // White back rank
  whiteBackRank.forEach((type, index) => {
    pieces.push({
      type,
      color: PieceColor.WHITE,
      position: { file: getFileFromIndex(index), rank: 1 }
    });
  });

  // White pawns
  for (let i = 0; i < 8; i++) {
    pieces.push({
      type: PieceType.PAWN,
      color: PieceColor.WHITE,
      position: { file: getFileFromIndex(i), rank: 2 }
    });
  }

  // Black pawns
  for (let i = 0; i < 8; i++) {
    pieces.push({
      type: PieceType.PAWN,
      color: PieceColor.BLACK,
      position: { file: getFileFromIndex(i), rank: 7 }
    });
  }

  // Black back rank
  whiteBackRank.forEach((type, index) => {
    pieces.push({
      type,
      color: PieceColor.BLACK,
      position: { file: getFileFromIndex(index), rank: 8 }
    });
  });

  return pieces;
}
