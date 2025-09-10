export interface ChessMove {
  from?: string;
  to?: string;
  notation?: string;
  type?: string;
  promotion?: string;
}

export interface GameState {
  id?: string;
  fen?: string;
  pgn?: string;
  move_history?: ChessMove[];
  active_color?: 'white' | 'black';
  status?: string;
  move_count?: number;
  ai_color?: 'white' | 'black';
}

declare global {
  interface Window {
    chessPieceRenderer?: {
      createPieceElement: (piece: string) => HTMLElement;
  isSvgMode?: () => boolean;
    };
    JSChessMessages?: any;
    JSChessHelpers?: any;
  }
}

export {};
