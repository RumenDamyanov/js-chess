/**
 * Chess Piece Rendering Utilities
 * Supports both Unicode symbols and SVG images from backend assets
 */

class ChessPieceRenderer {
  constructor(options = {}) {
    this.useSvg = options.useSvg || false;
    this.basePath = options.basePath || '/shared/assets/images/pieces';
  }

  /**
   * Get CSS classes for a chess piece
   * @param {string} piece - Chess piece notation (P, p, Q, q, etc.)
   * @returns {string[]} Array of CSS classes
   */
  getPieceClasses(piece) {
    if (!piece) return [];

    const isWhite = piece === piece.toUpperCase();
    const color = isWhite ? 'white' : 'black';
    const type = this.getPieceType(piece.toLowerCase());

    if (this.useSvg) {
      return ['piece-svg', color, type];
    } else {
      return ['piece', color, type];
    }
  }

  /**
   * Get piece type from notation
   * @param {string} piece - Lowercase piece notation
   * @returns {string} Piece type class name
   */
  getPieceType(piece) {
    const map = {
      'k': 'king',
      'q': 'queen',
      'r': 'rook',
      'b': 'bishop',
      'n': 'knight',
      'p': 'pawn'
    };
    return map[piece] || 'piece';
  }

  /**
   * Get SVG image path for a piece
   * @param {string} piece - Chess piece notation
   * @returns {string} SVG image path
   */
  getSvgPath(piece) {
    if (!piece) return '';

    const isWhite = piece === piece.toUpperCase();
    const color = isWhite ? 'w' : 'b';
    const type = piece.toLowerCase();

    return `${this.basePath}/${color}_${type}.svg`;
  }

  /**
   * Create HTML element for a piece
   * @param {string} piece - Chess piece notation
   * @returns {string} HTML string
   */
  createPieceElement(piece) {
    if (!piece) return '';

    const classes = this.getPieceClasses(piece).join(' ');

    if (this.useSvg) {
      // Use background-image approach (matches CSS)
      return `<span class="${classes}"></span>`;
    } else {
      // Unicode fallback - CSS will handle the symbol via ::before
      return `<span class="${classes}"></span>`;
    }
  }

  /**
   * Toggle between SVG and Unicode rendering
   * @param {boolean} useSvg - Whether to use SVG images
   */
  setSvgMode(useSvg) {
    this.useSvg = useSvg;
    // Dispatch custom event for apps to handle the change
    window.dispatchEvent(new CustomEvent('piece-renderer-changed', {
      detail: { useSvg }
    }));
  }

  /**
   * Get current rendering mode
   * @returns {boolean} Whether SVG mode is active
   */
  isSvgMode() {
    return this.useSvg;
  }
}

// Create global instance
window.ChessPieceRenderer = ChessPieceRenderer;

// Initialize with SVG mode by default (changed from Unicode)
window.chessPieceRenderer = new ChessPieceRenderer({ useSvg: true });
