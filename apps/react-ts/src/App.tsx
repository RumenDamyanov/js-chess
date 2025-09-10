import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.scss';
import type { GameState, ChessMove } from './global';

// API wrapper
class ChessAPI {
  baseURL: string;
  constructor(baseURL = 'http://localhost:8080') { this.baseURL = baseURL; }
  async createGame(gameConfig: { playerColor?: 'white' | 'black' } = {}) {
    const requestBody: Record<string, any> = {};
    if (gameConfig.playerColor) {
      requestBody.ai_color = gameConfig.playerColor === 'white' ? 'black' : 'white';
    }
    const response = await fetch(`${this.baseURL}/api/games`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
  async getGame(id: string) { const r = await fetch(`${this.baseURL}/api/games/${id}`); if (!r.ok) throw new Error('game_not_found'); return r.json(); }
  async makeMove(id: string, move: Partial<ChessMove>) { const r = await fetch(`${this.baseURL}/api/games/${id}/moves`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(move) }); if (!r.ok) throw new Error('move_failed'); return r.json(); }
  async getValidMoves(id: string) { const r = await fetch(`${this.baseURL}/api/games/${id}/legal-moves`); if (!r.ok) return { legal_moves: [] }; return r.json(); }
  async getAIMove(id: string, level = 'medium', engine = 'random') { const r = await fetch(`${this.baseURL}/api/games/${id}/ai-move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level, engine }) }); if (!r.ok) throw new Error('ai_failed'); return r.json(); }
  async getAIHint(id: string, level = 'medium', engine = 'random') { const r = await fetch(`${this.baseURL}/api/games/${id}/ai-hint`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level, engine }) }); if (!r.ok) throw new Error('hint_failed'); return r.json(); }
  async sendChat(id: string, message: string, provider?: string) {
    const payload: any = { message };
    if (provider) payload.provider = provider;
    const r = await fetch(`${this.baseURL}/api/games/${id}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      const err = new Error(`chat_failed:${r.status}:${text}`);
      // @ts-ignore attach status
      err.status = r.status;
      throw err;
    }
    return r.json(); // expected { response: string, provider?: string }
  }
}

interface SaveSlotData {
  gameId: string;
  fen: string;
  pgn?: string;
  moveHistory: ChessMove[];
  timestamp: string;
  playerColor: 'white' | 'black';
  whiteTime: number;
  blackTime: number;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const App: React.FC = () => {
  // Core state
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState('');
  const [moveCount, setMoveCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Settings & feature toggles
  const [playerName, setPlayerName] = useState('Player');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [enableUndo, setEnableUndo] = useState(true);
  const [enableHints, setEnableHints] = useState(true);
  const [enableChat, setEnableChat] = useState(true);
  const [enableTimer, setEnableTimer] = useState(true);
  const [timerMode, setTimerMode] = useState<'count-up' | 'count-down'>('count-up');
  const [timeLimit, setTimeLimit] = useState(10); // minutes for countdown
  const [chatExpanded, setChatExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string; ts: number; reaction?: boolean }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const prevMoveCountRef = useRef(0);

  // Mock chat configuration (ported from Vue implementation)
  const USE_MOCK_CHAT = true; // Set false to re-enable backend calls
  const mockResponsesRef = useRef<string[]>([
    "That's an interesting question about chess strategy!",
    'Chess is such a fascinating game with endless possibilities.',
    "I'd be happy to discuss that move with you!",
    'Great observation about the position!',
    'Chess theory has many different schools of thought on that.',
    "That's a classic chess principle you're referring to!",
    'The position does look quite complex from here.',
    'Chess masters have debated similar questions for centuries!',
    "That's exactly the kind of thinking that improves your game!",
    "You're really getting into the strategic depth of chess!"
  ]);
  const mockMoveReactionsRef = useRef<string[]>([
    'Great move! 👍',
    'Interesting choice! 🤔',
    'Nice tactical play! ⚡',
    'Solid move! 💪',
    "That's a clever idea! 💡",
    'Good positioning! 📍',
    'Well calculated! 🧮',
    'Strategic thinking! 🎯',
    'Impressive! ✨',
    'Keep it up! 🔥'
  ]);
  // PGN / Import UI state
  const [pgnImportOpen, setPgnImportOpen] = useState(false);
  const [pgnImportText, setPgnImportText] = useState('');
  const [pgnImportBusy, setPgnImportBusy] = useState(false);

  // Board interaction
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<ChessMove[]>([]);
  const [boardData, setBoardData] = useState<Record<string, string>>({});
  const [isAITurn, setIsAITurn] = useState(false);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string }>({ text: '', type: 'info' });
  const [currentFEN, setCurrentFEN] = useState(INITIAL_FEN);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionResolver, setPromotionResolver] = useState<((p: string | null) => void) | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);

  // Timers
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Save slots
  const [saveSlots, setSaveSlots] = useState<Array<SaveSlotData | null>>([null, null, null]);

  const apiRef = useRef(new ChessAPI());
  const hintTimeoutRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Helpers
  const showMessage = useCallback((text: string, type: string = 'info', duration = 3000) => {
    setMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => setMessage({ text: '', type: 'info' }), duration);
    }
  }, []);

  const parseFENToBoard = useCallback((fen: string) => {
    const board: Record<string, string> = {};
    if (!fen) return board;
    const fenBoard = fen.split(' ')[0];
    const ranks = fenBoard.split('/');
    for (let rankIdx = 0; rankIdx < ranks.length; rankIdx++) {
      const rankStr = ranks[rankIdx];
      let fileIdx = 0;
      for (const ch of rankStr) {
        if (/^[1-8]$/.test(ch)) {
          fileIdx += parseInt(ch, 10);
        } else {
          const fileChar = String.fromCharCode(97 + fileIdx);
          const rank = 8 - rankIdx;
          board[fileChar + rank] = ch;
          fileIdx++;
        }
      }
    }
    return board;
  }, []);

  const updateBoard = useCallback((fen: string) => {
    setBoardData(parseFENToBoard(fen));
  }, [parseFENToBoard]);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setValidMoves([]);
  }, []);

  const selectSquare = useCallback(async (position: string) => {
    clearSelection();
    const piece = boardData[position];
    if (piece) {
      const isWhitePiece = piece === piece.toUpperCase();
      const isOwned = (playerColor === 'white' && isWhitePiece) || (playerColor === 'black' && !isWhitePiece);
      if (isOwned) {
        setSelectedSquare(position);
        if (!gameId) return;
        try {
          const resp = await apiRef.current.getValidMoves(gameId);
            const movesForPiece = (resp.legal_moves || []).filter((m: ChessMove) => m.from === position);
            setValidMoves(movesForPiece);
        } catch {
          setValidMoves([]);
        }
      }
    }
  }, [boardData, playerColor, gameId, clearSelection]);

  // Promotion helpers
  const getPromotionChoice = useCallback(() => new Promise<string | null>(resolve => { setShowPromotionDialog(true); setPromotionResolver(() => resolve); }), []);
  const handlePromotionChoice = (piece: string | null) => { promotionResolver?.(piece); setShowPromotionDialog(false); setPromotionResolver(null); };

  // AI Move
  const makeAIMove = useCallback(async (gid: string) => {
    if (!gid) return; setIsAITurn(true); showMessage('AI is thinking...', 'info', 0);
    try {
      const ai = await apiRef.current.getAIMove(gid);
      if (ai.move) {
        const res: GameState = await apiRef.current.makeMove(gid, ai.move);
        setGameState(res); setCurrentFEN(res.fen || ''); updateBoard(res.fen || ''); setCurrentPlayer(res.active_color || 'white'); setGameStatus(res.status || ''); setMoveCount(res.move_count || 0);
        if (res.status?.includes('wins') || res.status === 'draw') {
          showMessage((res.status || '').replace('_', ' ').toUpperCase(), 'success');
        } else if (res.status === 'check') {
          showMessage('Check!', 'warning');
        } else {
          showMessage('Your turn', 'info');
        }
      }
    } catch { showMessage('AI move failed', 'error'); } finally { setIsAITurn(false); }
  }, [showMessage, updateBoard]);

  // Move (player)
  const makeMove = useCallback(async (from: string, to: string) => {
    if (!gameId) return; setIsProcessingMove(true);
    try {
      const piece = boardData[from];
  const valid = validMoves.find((m: ChessMove) => m.from === from && m.to === to);
      let move: Partial<ChessMove>;
      if (valid?.type === 'castling' && valid.notation) {
        move = { notation: valid.notation };
      } else {
        move = { from, to };
        // Promotion
        if (piece && piece.toLowerCase() === 'p') {
          const toRank = to[1];
          if ((piece === 'P' && toRank === '8') || (piece === 'p' && toRank === '1')) {
            const promo = await getPromotionChoice();
            if (!promo) { clearSelection(); setIsProcessingMove(false); return; }
            move.promotion = promo;
          }
        }
      }
      const res: GameState = await apiRef.current.makeMove(gameId, move);
      clearSelection(); setGameState(res); setCurrentFEN(res.fen || ''); updateBoard(res.fen || ''); setCurrentPlayer(res.active_color || 'white'); setGameStatus(res.status || ''); setMoveCount(res.move_count || 0);
      const aiTurnNext = (playerColor === 'white' && res.active_color === 'black') || (playerColor === 'black' && res.active_color === 'white');
      if (res.status?.includes('wins') || res.status === 'draw') {
        showMessage((res.status || '').replace('_', ' ').toUpperCase(), 'success');
      } else if (res.status === 'check') {
        showMessage('Check!', 'warning');
      }
      if (aiTurnNext && !res.status?.includes('wins') && res.status !== 'draw') {
        setTimeout(() => makeAIMove(gameId), 500);
      }
    } catch {
      showMessage('Invalid move', 'error');
      clearSelection();
    } finally {
      setIsProcessingMove(false);
    }
  }, [gameId, boardData, validMoves, playerColor, getPromotionChoice, clearSelection, showMessage, makeAIMove, updateBoard]);

  // New Game
  const createGame = useCallback(async () => {
    setIsLoading(true); clearSelection(); setGameId(null);
    try {
      const g = await apiRef.current.createGame({ playerColor });
      const full = await apiRef.current.getGame(g.id);
      setGameId(g.id); setGameState(full); setCurrentFEN(full.fen || ''); updateBoard(full.fen || ''); setCurrentPlayer(full.active_color || 'white'); setGameStatus(full.status || ''); setMoveCount(full.move_count || 0); setIsAITurn(false);
      showMessage(`New game started as ${playerColor}`, 'success');
      if (full.active_color !== playerColor) setTimeout(() => makeAIMove(g.id), 500);
    } catch {
      showMessage('Failed to start new game', 'error');
    } finally { setIsLoading(false); }
  }, [playerColor, clearSelection, updateBoard, showMessage, makeAIMove]);

  // Undo
  const undoMove = useCallback(async () => {
    if (!enableUndo) { showMessage('Undo disabled.', 'warning'); return; }
    if (!gameState?.move_history?.length) { showMessage('No moves to undo.', 'warning'); return; }
    if (isAITurn) { showMessage('AI thinking – cannot undo.', 'warning'); return; }
    setIsLoading(true); showMessage('Undoing last move...', 'info');
    try {
      const isPlayerTurn = currentPlayer === playerColor;
      const movesToPop = isPlayerTurn ? 2 : 1;
      if (gameState.move_history.length < movesToPop) { await createGame(); return; }
      const movesToReplay = gameState.move_history.slice(0, -movesToPop);
      const newGame = await apiRef.current.createGame({ playerColor });
      for (const move of movesToReplay) {
        let payload: Partial<ChessMove>;
        if (move.type === 'castling' || (move.notation && /O-O/.test(move.notation))) {
          payload = { notation: move.notation };
        } else {
          payload = { from: move.from, to: move.to };
          if (move.promotion) payload.promotion = move.promotion;
        }
        await apiRef.current.makeMove(newGame.id, payload);
      }
      const finalState = await apiRef.current.getGame(newGame.id);
      setGameId(newGame.id); setGameState(finalState); setCurrentFEN(finalState.fen || ''); updateBoard(finalState.fen || ''); setCurrentPlayer(finalState.active_color || 'white'); setGameStatus(finalState.status || ''); setMoveCount(finalState.move_count || 0); setIsAITurn(false);
      showMessage('Move undone. Your turn.', 'success');
    } catch {
      showMessage('Undo failed. Starting new game.', 'error');
      await createGame();
    } finally { setIsLoading(false); }
  }, [enableUndo, gameState, isAITurn, currentPlayer, playerColor, createGame, updateBoard, showMessage]);

  // Hint
  const highlightHint = useCallback((from: string, to: string, explanation?: string, notation?: string) => {
    if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
    document.querySelectorAll('.hint-from, .hint-to').forEach(el => el.classList.remove('hint-from', 'hint-to'));
    const fromSquare = document.querySelector(`[data-position="${from}"]`);
    const toSquare = document.querySelector(`[data-position="${to}"]`);
    fromSquare?.classList.add('hint-from');
    toSquare?.classList.add('hint-to');
    showMessage(`Hint: ${explanation || `Move ${notation}`}`, 'success', 3000);
    hintTimeoutRef.current = window.setTimeout(() => {
      document.querySelectorAll('.hint-from, .hint-to').forEach(el => el.classList.remove('hint-from', 'hint-to'));
      hintTimeoutRef.current = null;
    }, 3000);
  }, [showMessage]);

  const getHint = useCallback(async () => {
    if (!gameId || isAITurn) return; showMessage('Getting hint...', 'info', 0);
    try { const hint = await apiRef.current.getAIHint(gameId); if (hint.from && hint.to) highlightHint(hint.from, hint.to, hint.explanation, hint.notation); else showMessage('No hint available.', 'info'); }
    catch { showMessage('Could not get hint', 'error'); }
  }, [gameId, isAITurn, showMessage, highlightHint]);

  // Save / Load
  const handleSaveGame = (slot: number) => {
    if (!gameId || !gameState) { showMessage('No active game to save.', 'warning'); return; }
    const saveData: SaveSlotData = { gameId, fen: currentFEN, pgn: gameState.pgn, moveHistory: gameState.move_history || [], timestamp: new Date().toISOString(), playerColor, whiteTime, blackTime };
    localStorage.setItem(`chess-save-slot-${slot}`, JSON.stringify(saveData));
    const next = [...saveSlots]; next[slot - 1] = saveData; setSaveSlots(next); showMessage(`Game saved to slot ${slot}.`, 'success');
  };
  const handleLoadGame = useCallback(async (slot: number) => {
    const slotData = localStorage.getItem(`chess-save-slot-${slot}`);
    if (!slotData) { showMessage(`Slot ${slot} is empty.`, 'warning'); return; }
    const saveData: SaveSlotData = JSON.parse(slotData);
    setIsLoading(true); showMessage(`Loading game from slot ${slot}...`, 'info');
    try {
      setPlayerColor(saveData.playerColor);
      const newGame = await apiRef.current.createGame({ playerColor: saveData.playerColor });
      for (const move of saveData.moveHistory) {
        let payload: Partial<ChessMove>;
        if (move.type === 'castling' || (move.notation && /O-O/.test(move.notation))) {
          payload = { notation: move.notation };
        } else {
          payload = { from: move.from, to: move.to };
          if (move.promotion) payload.promotion = move.promotion;
        }
        await apiRef.current.makeMove(newGame.id, payload);
      }
      const finalState = await apiRef.current.getGame(newGame.id);
      setGameId(newGame.id); setGameState(finalState); setCurrentFEN(finalState.fen || ''); updateBoard(finalState.fen || ''); setCurrentPlayer(finalState.active_color || 'white'); setGameStatus(finalState.status || ''); setMoveCount(finalState.move_count || 0); setIsAITurn(false); setWhiteTime(saveData.whiteTime || 0); setBlackTime(saveData.blackTime || 0);
      showMessage(`Game from slot ${slot} loaded.`, 'success');
    } catch { showMessage('Failed to load game.', 'error'); } finally { setIsLoading(false); }
  }, [showMessage, updateBoard]);
  const handleDeleteSlot = (slot: number) => { localStorage.removeItem(`chess-save-slot-${slot}`); const next = [...saveSlots]; next[slot - 1] = null; setSaveSlots(next); showMessage(`Slot ${slot} cleared.`, 'success'); };

  // Timers
  const formatTime = (seconds: number) => { const mins = Math.floor(seconds / 60).toString().padStart(2, '0'); const secs = (seconds % 60).toString().padStart(2, '0'); return `${mins}:${secs}`; };
  const handlePauseTimer = () => setIsTimerPaused((p: boolean) => !p);
  const handleResetTimer = () => { const initial = timerMode === 'count-down' ? timeLimit * 60 : 0; setWhiteTime(initial); setBlackTime(initial); setIsTimerPaused(false); };

  // Hydrate settings
  useEffect(() => {
    try {
      const name = localStorage.getItem('chess-player-name'); if (name) setPlayerName(name);
      const color = localStorage.getItem('chess-player-color'); if (color === 'white' || color === 'black') setPlayerColor(color);
      const undo = localStorage.getItem('chess-enable-undo'); if (undo !== null) setEnableUndo(undo === 'true');
      const hints = localStorage.getItem('chess-enable-hints'); if (hints !== null) setEnableHints(hints === 'true');
      const chat = localStorage.getItem('chess-enable-chat'); if (chat !== null) setEnableChat(chat === 'true');
      const timer = localStorage.getItem('chess-enable-timer'); if (timer !== null) setEnableTimer(timer === 'true');
      const mode = localStorage.getItem('chess-timer-mode'); if (mode === 'count-up' || mode === 'count-down') setTimerMode(mode);
      const limit = localStorage.getItem('chess-time-limit'); if (limit !== null && !Number.isNaN(parseInt(limit))) setTimeLimit(parseInt(limit));
      const loadedSlots: Array<SaveSlotData | null> = [1,2,3].map(slot => { const saved = localStorage.getItem(`chess-save-slot-${slot}`); return saved ? JSON.parse(saved) : null; });
      setSaveSlots(loadedSlots);
    } catch { /* ignore */ } finally { setSettingsReady(true); }
  }, []);

  // Create game when settings ready
  useEffect(() => { if (settingsReady) { createGame(); } }, [settingsReady, createGame]);

  // Persist settings
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-player-name', playerName); }, [playerName, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-player-color', playerColor); }, [playerColor, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-enable-undo', enableUndo.toString()); }, [enableUndo, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-enable-hints', enableHints.toString()); }, [enableHints, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-enable-chat', enableChat.toString()); }, [enableChat, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-enable-timer', enableTimer.toString()); }, [enableTimer, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-timer-mode', timerMode); }, [timerMode, settingsReady]);
  useEffect(() => { if (settingsReady) localStorage.setItem('chess-time-limit', timeLimit.toString()); }, [timeLimit, settingsReady]);

  // Initialize timers on new game
  useEffect(() => { if (gameId) { const initial = timerMode === 'count-down' ? timeLimit * 60 : 0; setWhiteTime(initial); setBlackTime(initial); setIsTimerPaused(false); } }, [gameId, timerMode, timeLimit]);

  // Timer tick
  useEffect(() => {
    if (!enableTimer || isTimerPaused || !gameId || gameStatus.includes('wins') || gameStatus === 'draw') { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } return; }
    timerRef.current = window.setInterval(() => {
      if (timerMode === 'count-up') {
  if (currentPlayer === 'white') setWhiteTime((t: number) => t + 1); else setBlackTime((t: number) => t + 1);
      } else { // countdown
  if (currentPlayer === 'white') setWhiteTime((t: number) => { if (t <= 1) { setGameStatus('black_wins'); showMessage('Black wins on time!', 'success'); if (timerRef.current) window.clearInterval(timerRef.current); return 0; } return t - 1; }); else setBlackTime((t: number) => { if (t <= 1) { setGameStatus('white_wins'); showMessage('White wins on time!', 'success'); if (timerRef.current) window.clearInterval(timerRef.current); return 0; } return t - 1; });
      }
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [enableTimer, isTimerPaused, gameId, gameStatus, currentPlayer, timerMode, showMessage]);

  // Board click
  const handleSquareClick = useCallback((position: string) => {
    if (!gameId || isAITurn || isProcessingMove || gameStatus.includes('wins') || gameStatus === 'draw') return;
  if (selectedSquare && validMoves.some((m: ChessMove) => m.from === selectedSquare && m.to === position)) {
      makeMove(selectedSquare, position);
    } else {
      selectSquare(position);
    }
  }, [gameId, isAITurn, isProcessingMove, gameStatus, selectedSquare, validMoves, makeMove, selectSquare]);

  const pieceSymbols: Record<string, string> = { 'K': '♔','Q': '♕','R': '♖','B': '♗','N': '♘','P': '♙','k': '♚','q': '♛','r': '♜','b': '♝','n': '♞','p': '♟' };

  const toggleChat = () => setChatExpanded((e: boolean) => !e);

  const sendChatMessage = useCallback(async () => {
    if (!enableChat) { showMessage('Chat disabled', 'warning'); return; }
    if (!gameId) { showMessage('Start a game to chat', 'warning'); return; }
    const text = chatInput.trim();
    if (!text) return;
    const now = Date.now();
    setChatMessages(m => [...m, { id: `u-${now}`, sender: 'user', text, ts: now }]);
    setChatInput('');
    setIsChatSending(true);
    // Mock path (default)
    if (USE_MOCK_CHAT) {
      const delay = 800 + Math.random() * 1200;
      window.setTimeout(() => {
        const resp = mockResponsesRef.current[Math.floor(Math.random() * mockResponsesRef.current.length)];
        setChatMessages(m => [...m, { id: `a-${Date.now()}`, sender: 'ai', text: resp, ts: Date.now() }]);
        setIsChatSending(false);
      }, delay);
      return;
    }
    // Real backend path (optional)
    try {
      const resp = await apiRef.current.sendChat(gameId!, text);
      const aiText = resp.response || resp.message || '...';
      setChatMessages(m => [...m, { id: `a-${Date.now()}`, sender: 'ai', text: aiText, ts: Date.now() }]);
    } catch (err) {
      const fallback = mockResponsesRef.current[Math.floor(Math.random() * mockResponsesRef.current.length)] + ' (fallback)';
      setChatMessages(m => [...m, { id: `f-${Date.now()}`, sender: 'ai', text: fallback, ts: Date.now() }]);
    } finally { setIsChatSending(false); }
  }, [chatInput, enableChat, gameId, showMessage]);

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  };

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatExpanded]);

  // Welcome message when a new game starts (only if chat enabled & empty)
  useEffect(() => {
    if (!enableChat) return;
    if (gameId && chatMessages.length === 0) {
      const welcome = "Welcome to the chess game! I'm your AI opponent. Feel free to chat with me about the game!";
      setChatMessages([{ id: 'welcome', sender: 'ai', text: welcome, ts: Date.now() }]);
      prevMoveCountRef.current = gameState?.move_history?.length || 0;
    }
  }, [gameId, enableChat]);

  // Auto move reaction similar to Vue implementation
  useEffect(() => {
    if (!enableChat || !USE_MOCK_CHAT) return;
    const currentMoves = gameState?.move_history?.length || 0;
    const prev = prevMoveCountRef.current;
    if (currentMoves > prev && currentMoves > 0) {
      // React to last move
      const delay = 500 + Math.random() * 1000;
      const reaction = mockMoveReactionsRef.current[Math.floor(Math.random() * mockMoveReactionsRef.current.length)];
      window.setTimeout(() => {
        setChatMessages(m => [...m, { id: `r-${Date.now()}`, sender: 'ai', text: reaction, ts: Date.now(), reaction: true }]);
      }, delay);
    }
    prevMoveCountRef.current = currentMoves;
  }, [gameState?.move_history?.length, enableChat]);

  // PGN helpers
  const buildLocalPGN = useCallback(() => {
    if (!gameState) return '';
    if (gameState.pgn) return gameState.pgn; // Prefer backend PGN if already provided
    const moves = gameState.move_history || [];
    const rows: string[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const white = moves[i]?.notation || '';
      const black = moves[i + 1]?.notation || '';
      rows.push(`${moveNumber}. ${white}${black ? ' ' + black : ''}`.trim());
    }
    let result = '*';
    if (gameStatus.includes('white_wins')) result = '1-0';
    else if (gameStatus.includes('black_wins')) result = '0-1';
    else if (gameStatus === 'draw') result = '1/2-1/2';
    const today = new Date();
    const tagDate = today.toISOString().slice(0,10).replace(/-/g,'.');
    const tags = [
      `[Event "JS Chess"]`,
      `[Site "Local"]`,
      `[Date "${tagDate}"]`,
      `[Round "-"]`,
      `[White "${playerColor === 'white' ? playerName : 'AI'}"]`,
      `[Black "${playerColor === 'black' ? playerName : 'AI'}"]`,
      `[Result "${result}"]`
    ];
    return `${tags.join('\n')}\n\n${rows.join(' ')} ${result}`.trim();
  }, [gameState, gameStatus, playerColor, playerName]);

  const regeneratePGN = useCallback(async () => {
    if (!gameId) return;
    try {
      const fresh = await apiRef.current.getGame(gameId);
      setGameState(fresh);
      showMessage('PGN refreshed', 'success');
    } catch { showMessage('Failed to refresh PGN', 'error'); }
  }, [gameId, showMessage]);

  const handleCopyPGN = useCallback(async () => {
    const pgn = buildLocalPGN();
    if (!pgn) { showMessage('No PGN to copy', 'warning'); return; }
    try {
      await navigator.clipboard.writeText(pgn);
      showMessage('PGN copied to clipboard', 'success');
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = pgn; document.body.appendChild(textarea); textarea.select();
      try { document.execCommand('copy'); showMessage('PGN copied (fallback)', 'success'); } catch { showMessage('Copy failed', 'error'); }
      document.body.removeChild(textarea);
    }
  }, [buildLocalPGN, showMessage]);

  const handleDownloadPGN = useCallback(() => {
    const pgn = buildLocalPGN();
    if (!pgn) { showMessage('No PGN to download', 'warning'); return; }
    const blob = new Blob([pgn + '\n'], { type: 'application/x-chess-pgn' });
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:T]/g,'-').split('.')[0];
    a.download = `game-${gameId || 'local'}-${stamp}.pgn`;
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    showMessage('PGN download started', 'success');
  }, [buildLocalPGN, gameId, showMessage]);

  const toggleImportPanel = () => setPgnImportOpen((o: boolean) => !o);
  const handleImportClear = () => { setPgnImportText(''); showMessage('PGN input cleared', 'info'); };

  const handleImportRun = useCallback(async () => {
    if (!pgnImportText.trim()) { showMessage('Paste coordinate moves first', 'warning'); return; }
    if (!playerColor) return;
    setPgnImportBusy(true);
    try {
      // Start a fresh game using current color
      const g = await apiRef.current.createGame({ playerColor });
      const tokens = pgnImportText.trim().split(/\s+/);
      let idx = 0;
      for (const token of tokens) {
        if (!/^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/i.test(token)) { showMessage(`Invalid move: ${token}`, 'error'); break; }
        const from = token.slice(0,2);
        const to = token.slice(2,4);
        const promoChar = token[4];
        const move: Partial<ChessMove> = { from, to };
        if (promoChar) move.promotion = promoChar.toUpperCase();
        await apiRef.current.makeMove(g.id, move);
        idx++;
      }
      const finalState = await apiRef.current.getGame(g.id);
      setGameId(g.id); setGameState(finalState); setCurrentFEN(finalState.fen || ''); updateBoard(finalState.fen || ''); setCurrentPlayer(finalState.active_color || 'white'); setGameStatus(finalState.status || ''); setMoveCount(finalState.move_count || 0); setIsAITurn(false);
      showMessage(`Imported ${idx} moves`, 'success');
    } catch { showMessage('PGN import failed', 'error'); }
    finally { setPgnImportBusy(false); }
  }, [pgnImportText, playerColor, updateBoard, showMessage]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-container">
          <a href="http://localhost:3000" className="header-brand">
            <span className="header-title">♟️ JS Chess</span>
            <span className="header-framework">React (TS)</span>
          </a>
          <nav className="header-nav">
            <ul className="nav-links">
              <li><a href="http://localhost:3000" className="nav-link"><span className="tech-icon tech-home"></span> Home</a></li>
              <li><span className="nav-spacer"></span></li>
              <li><span className="nav-separator"></span></li>
              <li><a href="http://localhost:3001" className="nav-link" title="Vanilla JavaScript"><span className="tech-icon tech-js"></span> Vanilla (JS)</a></li>
              <li><a href="http://localhost:3002" className="nav-link" title="Vanilla TypeScript"><span className="tech-icon tech-ts"></span> Vanilla (TS)</a></li>
              <li><a href="http://localhost:3003" className="nav-link" title="jQuery"><span className="tech-icon tech-jq"></span> jQuery</a></li>
              <li><a href="http://localhost:3004" className="nav-link" title="Vue"><span className="tech-icon tech-vue"></span> Vue</a></li>
              <li><a href="http://localhost:3007" className="nav-link" title="WebAssembly"><span className="tech-icon tech-wasm"></span> WASM</a></li>
              <li><span className="nav-spacer"></span></li>
              <li><span className="nav-separator"></span></li>
              <li><a href="http://localhost:3005" className="nav-link active" title="React (TS)"><span className="tech-icon tech-react"></span> React (TS)</a></li>
              <li><a href="http://localhost:3006" className="nav-link" title="Angular"><span className="tech-icon tech-angular"></span> Angular</a></li>
              <li><a href="http://localhost:3008" className="nav-link" title="UI5 TypeScript"><span className="tech-icon tech-ui5-ts"></span> UI5</a></li>
            </ul>
            <div className="header-controls"></div>
          </nav>
        </div>
      </header>

      <div className="container">
        <main>
          <div className="left-panel">
            <div className="game-config">
              <h3>Game Settings</h3>
              <div className="config-section">
                <h4>Player Settings</h4>
                <div className="config-group">
                  <label htmlFor="player-name">Player Name:</label>
                  <input id="player-name" type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name" />
                </div>
                <div className="config-group">
                  <label htmlFor="player-color">Play as:</label>
                  <select id="player-color" value={playerColor} onChange={e => { setPlayerColor(e.target.value as 'white' | 'black'); if (settingsReady) createGame(); }}>
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </div>
              </div>
              <div className="config-section">
                <h4>Game Features</h4>
                <div className="config-group"><label className="checkbox-label"><input type="checkbox" checked={enableUndo} onChange={e => setEnableUndo(e.target.checked)} /><span className="checkmark"></span>Enable Undo Button</label></div>
                <div className="config-group"><label className="checkbox-label"><input type="checkbox" checked={enableHints} onChange={e => setEnableHints(e.target.checked)} /><span className="checkmark"></span>Enable Hint Button</label></div>
                <div className="config-group"><label className="checkbox-label"><input type="checkbox" checked={enableChat} onChange={e => setEnableChat(e.target.checked)} /><span className="checkmark"></span>Enable AI Chat</label></div>
              </div>
              <div className="config-section">
                <h4>Timer Settings</h4>
                <div className="config-group"><label className="checkbox-label"><input type="checkbox" checked={enableTimer} onChange={e => setEnableTimer(e.target.checked)} /><span className="checkmark"></span>Enable Timer</label></div>
                <div className="config-group"><label htmlFor="timer-mode">Timer Mode:</label><select id="timer-mode" value={timerMode} onChange={e => setTimerMode(e.target.value as 'count-up' | 'count-down')}><option value="count-up">Count Up (Stopwatch)</option><option value="count-down">Count Down (Time Limit)</option></select></div>
                <div className="config-group"><label htmlFor="time-limit">Time Limit (minutes):</label><select id="time-limit" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value))}>{[5,10,15,30,60].map(v => <option key={v} value={v}>{v} minutes</option>)}</select></div>
              </div>
            </div>
            <div className="save-slots card-like" id="save-slots-card">
              <h3>Save Slots</h3>
              <div className="slots-grid">
                {[1,2,3].map(slot => (
                  <div key={slot} className="slot" data-slot={slot}>
                    <div className="slot-label">Slot {slot}</div>
                    <div className="slot-time" id={`slot-${slot}-time`}>{saveSlots[slot - 1] ? new Date(saveSlots[slot - 1]!.timestamp).toLocaleString() : 'Empty'}</div>
                    <div className="slot-actions">
                      <button className="btn btn-smaller" onClick={() => handleSaveGame(slot)}>Save</button>
                      <button className="btn btn-smaller" onClick={() => handleLoadGame(slot)}>Load</button>
                      <button className="btn btn-smaller" onClick={() => handleDeleteSlot(slot)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="board-wrapper">
            <div className="board-toolbar" id="board-toolbar">
              <button id="new-game-btn" className="btn btn-primary" onClick={createGame} disabled={isLoading || !settingsReady}>{isLoading ? 'Creating...' : 'New Game'}</button>
              <button id="undo-btn" className="btn" onClick={undoMove} disabled={!enableUndo || isAITurn || isLoading || !gameId || !gameState?.move_history?.length}>Undo</button>
              <button id="hint-btn" className="btn" onClick={getHint} disabled={!enableHints || isAITurn || isLoading || !gameId || currentPlayer !== playerColor}>Hint</button>
            </div>
            <div className="chess-board" id="chess-board" style={{ pointerEvents: (isAITurn || isLoading || !gameId) ? 'none' : 'auto' }} data-orientation={playerColor}>
              {(() => {
                const ranks = playerColor === 'black' ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
                const files = playerColor === 'black' ? 'hgfedcba' : 'abcdefgh';
                const squares: JSX.Element[] = [];
                for (const rank of ranks) {
                  for (const file of files) {
                    const position = file + rank;
                    const isLight = (files.indexOf(file) + rank) % 2 === 1;
                    const piece = boardData[position];
                    const useImageRenderer = piece && window.chessPieceRenderer;
                    const isWhite = piece && piece === piece.toUpperCase();
                    const isValidDest = validMoves.some(m => m.to === position);
                    const isCastlingDest = validMoves.some(m => m.to === position && m.type === 'castling');
                    squares.push(
                      <div key={position} className={`square ${isLight ? 'light' : 'dark'} ${selectedSquare === position ? 'selected' : ''} ${isValidDest ? 'valid-move' : ''} ${isCastlingDest ? 'castling-move' : ''}`} data-position={position} onClick={() => handleSquareClick(position)}>
                        {(() => {
                          if (!piece) return null;
                          // If custom renderer exists, use it first
                          if (useImageRenderer) {
                            try {
                              const html = window.chessPieceRenderer!.createPieceElement(piece!);
                              if (typeof html === 'string') {
                                return <span className="renderer-wrapper" dangerouslySetInnerHTML={{ __html: html }} />;
                              } else if (html) {
                                return <span className="renderer-wrapper" dangerouslySetInnerHTML={{ __html: (html as any).outerHTML }} />;
                              }
                            } catch (e) {
                              // swallow and fallback
                            }
                          }
                          // Fallback only if renderer missing or failed
                          return <span className={`piece unicode-fallback ${isWhite ? 'piece-white' : 'piece-black'}`}>{pieceSymbols[piece]}</span>;
                        })()}
                        {isCastlingDest && (
                          <div className="castling-indicator" title={`Castling: ${validMoves.find(m => m.to === position && m.type === 'castling')?.notation}`}>♔</div>
                        )}
                      </div>
                    );
                  }
                }
                return squares;
              })()}
            </div>
            <div id="game-messages" className="game-messages-region" aria-live="polite" aria-atomic="false">
              {message.text && <div className={`game-message ${message.type}`}>{message.text}</div>}
            </div>
          </div>
          <div className="right-panel">
            <div className="game-info">
              <h3>Game Status</h3>
              <div className="status">
                <div>Player: <span id="player-display">{playerName}</span></div>
                <div>Turn: <span id="current-player">{gameId ? currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1) : 'N/A'}</span></div>
                <div>Status: <span id="game-status">{gameId ? gameStatus.replace(/_/g, ' ') : 'No game'}</span></div>
                <div>Move: <span id="move-count">{gameId ? moveCount : '0'}</span></div>
              </div>
            </div>
            {enableTimer && (
              <div id="timer-display" className="timer-info">
                <h3>Game Timer</h3>
                <div className="timer-content">
                  <div className="timer-row"><span className="timer-label">White:</span><span id="white-timer" className="timer">{formatTime(whiteTime)}</span></div>
                  <div className="timer-row"><span className="timer-label">Black:</span><span id="black-timer" className="timer">{formatTime(blackTime)}</span></div>
                  <div className="timer-actions">
                    <button id="timer-pause-btn" className="btn btn-smaller" aria-pressed={isTimerPaused} onClick={handlePauseTimer}>{isTimerPaused ? 'Resume' : 'Pause'}</button>
                    <button id="timer-reset-btn" className="btn btn-smaller" onClick={handleResetTimer}>Reset</button>
                  </div>
                  <div className="orientation-indicator">Orientation: <span id="orientation-indicator">{playerColor.charAt(0).toUpperCase() + playerColor.slice(1)}</span></div>
                </div>
              </div>
            )}
            <div className="move-history">
              <h3>Move History</h3>
              <div id="move-list" className="moves">
                {gameState?.move_history?.length ? (
                  gameState.move_history.reduce<JSX.Element[]>((acc, move, idx) => {
                    if (idx % 2 === 0) {
                      const moveNumber = Math.floor(idx / 2) + 1;
                      const whiteMove = gameState.move_history![idx];
                      const blackMove = gameState.move_history![idx + 1];
                      acc.push(
                        <div key={moveNumber} className="move-item">
                          <span className="move-number">{moveNumber}.</span>
                          <span className="move-notation">{whiteMove?.notation || ''}</span>
                          {blackMove && <span className="move-notation">{blackMove?.notation || ''}</span>}
                        </div>
                      );
                    }
                    return acc;
                  }, [])
                ) : (
                  <div className="move-item"><span className="move-number">-</span><span className="move-notation">Game not started</span></div>
                )}
              </div>
            </div>
            <div className="pgn-card card-like" id="pgn-card">
              <h3>PGN</h3>
              <textarea id="pgn-output" className="pgn-output" readOnly value={buildLocalPGN()} placeholder="Play moves to generate PGN"></textarea>
              <div className="pgn-actions">
                <button className="btn btn-smaller" id="pgn-copy-btn" onClick={handleCopyPGN} aria-label="Copy PGN to clipboard" disabled={!buildLocalPGN()}>Copy</button>
                <button className="btn btn-smaller" id="pgn-download-btn" onClick={handleDownloadPGN} aria-label="Download PGN as file" disabled={!buildLocalPGN()}>Download</button>
                <button className="btn btn-smaller" id="pgn-refresh-btn" onClick={regeneratePGN} aria-label="Regenerate PGN from move history" disabled={!gameId}>Refresh</button>
                <button className="btn btn-smaller" id="pgn-import-toggle" onClick={toggleImportPanel} aria-expanded={pgnImportOpen} aria-controls="pgn-import-panel">{pgnImportOpen ? 'Hide' : 'Import'}</button>
              </div>
              {pgnImportOpen && (
                <div id="pgn-import-panel" className="pgn-import" role="region" aria-label="PGN import panel">
                  <textarea id="pgn-import-input" className="pgn-input" value={pgnImportText} disabled={pgnImportBusy} onChange={e => setPgnImportText(e.target.value)} placeholder="Paste coordinate moves (e2e4 e7e5 g1f3 ...)"></textarea>
                  <div className="pgn-actions">
                    <button className="btn btn-smaller" id="pgn-import-run" onClick={handleImportRun} disabled={!pgnImportText.trim() || pgnImportBusy}>{pgnImportBusy ? 'Importing...' : 'Load Moves'}</button>
                    <button className="btn btn-smaller" id="pgn-import-clear" onClick={handleImportClear} disabled={!pgnImportText || pgnImportBusy}>Clear</button>
                  </div>
                  <div className="import-hint">Supports simple coordinate moves only (e.g. e2e4). Promotions like e7e8q are allowed. Castling via e1g1 / e8c8.</div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {enableChat && (
        <div className={`chat-container ${chatExpanded ? '' : 'collapsed'}`}>
          <div className="chat-header" onClick={toggleChat}><span>💬 AI Chat</span><span className="chat-toggle">{chatExpanded ? '−' : '+'}</span></div>
          {chatExpanded && (
            <div className="chat-content">
              <div className="messages">
                {chatMessages.length === 0 && <div className="placeholder">Say hi to the AI coach! ✨</div>}
                {chatMessages.map(m => (
                  <div key={m.id} className={`message ${m.sender} ${m.reaction ? 'reaction' : ''}`}>
                    <div className="message-content">
                      <div className="message-text">{m.text}</div>
                    </div>
                  </div>
                ))}
                {isChatSending && <div className="message ai"><div className="message-content"><div className="message-text">Thinking...</div></div></div>}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input">
                <textarea
                  placeholder="Type a message to the AI..."
                  rows={2}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  disabled={isChatSending}
                ></textarea>
                <button className="send-button" disabled={isChatSending || !chatInput.trim()} onClick={sendChatMessage}>{isChatSending ? '...' : 'Send'}</button>
              </div>
            </div>
          )}
        </div>
      )}
      {showPromotionDialog && (
        <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label="Choose promotion piece">
          <div className="promotion-dialog">
            <h3 className="promotion-title">Choose promotion piece:</h3>
            <div className="promotion-pieces">
              <button className="promotion-piece" onClick={() => handlePromotionChoice('Q')}>♕<span>Queen</span></button>
              <button className="promotion-piece" onClick={() => handlePromotionChoice('R')}>♖<span>Rook</span></button>
              <button className="promotion-piece" onClick={() => handlePromotionChoice('B')}>♗<span>Bishop</span></button>
              <button className="promotion-piece" onClick={() => handlePromotionChoice('N')}>♘<span>Knight</span></button>
            </div>
            <button className="promotion-cancel" onClick={() => handlePromotionChoice(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
