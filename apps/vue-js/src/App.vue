<template>
  <div id="app">
    <header class="app-header">
      <div class="header-container">
        <a href="http://localhost:3000" class="header-brand">
          <span class="header-title">♟️ JS Chess</span>
          <span class="header-framework">Vue.js</span>
        </a>

        <nav class="header-nav">
          <ul class="nav-links">
            <li><a href="http://localhost:3000" class="nav-link"><span class="tech-icon tech-home"></span> Home</a></li>
            <li><span class="nav-spacer"></span></li>
            <li><span class="nav-separator"></span></li>
            <li><a href="http://localhost:3001" class="nav-link" title="Vanilla JavaScript"><span class="tech-icon tech-js"></span> Vanilla (JS)</a></li>
            <li><a href="http://localhost:3002" class="nav-link" title="Vanilla TypeScript"><span class="tech-icon tech-ts"></span> Vanilla (TS)</a></li>
            <li><a href="http://localhost:3003" class="nav-link" title="jQuery"><span class="tech-icon tech-jq"></span> jQuery</a></li>
            <li><a href="http://localhost:3004" class="nav-link active" title="Vue"><span class="tech-icon tech-vue"></span> Vue</a></li>
            <li><span class="nav-link nav-link-disabled" aria-disabled="true" title="Work in progress"><span class="tech-icon tech-react"></span> React</span></li>
            <li><span class="nav-link nav-link-disabled" aria-disabled="true" title="Work in progress"><span class="tech-icon tech-angular"></span> Angular</span></li>
            <li><span class="nav-link nav-link-disabled" aria-disabled="true" title="Work in progress"><span class="tech-icon tech-ui5-js"></span> UI5 (JS)</span></li>
            <li><span class="nav-link nav-link-disabled" aria-disabled="true" title="Work in progress"><span class="tech-icon tech-ui5-ts"></span> UI5 (TS)</span></li>
          </ul>

          <div class="header-controls">
            <button id="theme-toggle-btn" class="btn btn-secondary" @click="toggleTheme()" aria-label="Toggle theme" style="display: none;">🌙</button>
            <!-- Debug button now injected by shared debug.js -->
          </div>
        </nav>
      </div>
    </header>

    <div class="container">
      <main>
        <div class="left-panel">
          <GameConfigPanel v-model="config" />

          <!-- Shared Save Slots structure required by pgn-core -->
          <div class="save-slots card-like" id="save-slots-card">
            <h3>Save Slots</h3>
            <div class="slots-grid save-slots">
              <div class="slot" data-slot="1">
                <div class="slot-label">Slot 1</div>
                <div class="slot-time" id="slot-1-time">Empty</div>
                <div class="slot-actions">
                  <button class="btn btn-smaller" data-action="save" data-slot="1">Save</button>
                  <button class="btn btn-smaller" data-action="load" data-slot="1" disabled>Load</button>
                  <button class="btn btn-smaller" data-action="delete" data-slot="1" disabled>✕</button>
                </div>
              </div>
              <div class="slot" data-slot="2">
                <div class="slot-label">Slot 2</div>
                <div class="slot-time" id="slot-2-time">Empty</div>
                <div class="slot-actions">
                  <button class="btn btn-smaller" data-action="save" data-slot="2">Save</button>
                  <button class="btn btn-smaller" data-action="load" data-slot="2" disabled>Load</button>
                  <button class="btn btn-smaller" data-action="delete" data-slot="2" disabled>✕</button>
                </div>
              </div>
              <div class="slot" data-slot="3">
                <div class="slot-label">Slot 3</div>
                <div class="slot-time" id="slot-3-time">Empty</div>
                <div class="slot-actions">
                  <button class="btn btn-smaller" data-action="save" data-slot="3">Save</button>
                  <button class="btn btn-smaller" data-action="load" data-slot="3" disabled>Load</button>
                  <button class="btn btn-smaller" data-action="delete" data-slot="3" disabled>✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Board / Messages Center Panel -->
        <div class="board-panel">
          <div class="board-toolbar">
            <button @click="resetGame" class="btn btn-primary" :disabled="isLoading">New Game</button>
            <button
              @click="undoMove"
              :disabled="!canUndo || isUndoing"
              class="btn"
              v-if="gameId && config.enableUndo"
            >Undo</button>
            <button
              @click="getAIHint"
              :disabled="!gameId || currentPlayer !== config.playerColor || isLoading || isAIThinking"
              class="btn"
              v-if="gameId && config.enableHints"
            >Hint</button>
          </div>
          <div class="board-wrapper" :class="{ flipped }">
            <div class="chess-board" id="chessBoard">
              <div
                v-for="(square, index) in boardSquares"
                :key="index"
                :class="getSquareClass(square, index)"
                role="button"
                :aria-label="squareAriaLabel(square, index)"
                tabindex="0"
                @click="handleSquareClick(index)"
                @keydown.enter.prevent="handleSquareClick(index)"
                @keydown.space.prevent="handleSquareClick(index)"
              >
                <span v-if="square.piece" :class="pieceCssClasses(square.piece)"></span>
              </div>
            </div>
          </div>
          <div id="game-messages" class="game-messages-region" aria-live="polite" aria-atomic="false" aria-label="Game status messages">
            <div class="game-message-stack">
              <div v-for="m in messages" :key="m.id" :class="['game-message', m.type]">{{ m.text }}</div>
              <div v-if="error" class="game-message error">{{ error }}</div>
            </div>
          </div>
        </div>

        <div class="right-panel">

          <div class="game-info card-like">
            <h3>Game Status</h3>
            <div class="status" role="group" aria-label="Live game status">
              <div>Player: <span id="status-player" aria-live="off">{{ config.playerName }}</span></div>
              <div>Turn: <span id="status-turn" aria-live="polite">{{ gameId ? currentPlayer : (isLoading ? 'Loading...' : '-') }}</span></div>
              <div>Status: <span id="status-state" aria-live="polite">{{ gameId ? gameStatus || 'Active' : (isLoading ? 'Creating Game...' : 'No Game') }}</span></div>
              <div>Move: <span id="status-move" aria-live="off">{{ gameId ? (gameState?.move_count || 1) : '-' }}</span></div>
            </div>
          </div>

          <div class="timers-card card-like" v-if="config.enableTimer">
            <h3>Timers</h3>
            <div class="timers" role="group" aria-label="Player timers">
              <div class="timer-row" role="status" aria-live="polite"><span>White:</span><span id="white-timer">{{ formatTime(whiteTime) }}</span></div>
              <div class="timer-row" role="status" aria-live="polite"><span>Black:</span><span id="black-timer">{{ formatTime(blackTime) }}</span></div>
            </div>
            <div class="orientation-indicator">Orientation: <span id="orientation-indicator">{{ orientationLabel }}</span></div>
            <div class="timer-actions">
              <button class="btn btn-small" id="timer-pause-btn" @click="togglePause" :disabled="!gameId">{{ paused ? 'Resume' : 'Pause' }}</button>
              <button class="btn btn-small" id="timer-reset-btn" @click="resetTimers" :disabled="!gameId">Reset</button>
              <button class="btn btn-small" @click="flipBoard" :disabled="!gameId">Flip</button>
            </div>
          </div>

          <div class="move-history card-like" aria-label="Move history" role="region">
            <h3>Move History</h3>
            <ol id="move-list" class="moves" aria-live="polite">
              <li class="move-item" v-if="!gameId || !gameState?.move_history?.length">
                <span class="move-number">-</span>
                <span class="move-notation">{{ gameId ? 'Game started' : 'No game active' }}</span>
              </li>
              <li v-for="(move, index) in gameState?.move_history" :key="index" class="move-item">
                <span class="move-number">{{ index + 1 }}</span>
                <span class="move-notation">{{ move.from }}→{{ move.to }}</span>
              </li>
            </ol>
          </div>
          <div class="pgn-card card-like" id="pgn-card">
            <h3>PGN</h3>
            <textarea id="pgn-output" class="pgn-output" readonly placeholder="Play moves to generate PGN" ref="pgnOutputRef"></textarea>
            <div class="pgn-actions">
              <button class="btn btn-smaller" id="pgn-copy-btn" aria-label="Copy PGN to clipboard" disabled>Copy</button>
              <button class="btn btn-smaller" id="pgn-download-btn" aria-label="Download PGN as file" disabled>Download</button>
              <button class="btn btn-smaller" id="pgn-refresh-btn" aria-label="Regenerate PGN from move history" disabled>Refresh</button>
              <button class="btn btn-smaller" id="pgn-import-toggle" aria-expanded="false" aria-controls="pgn-import-panel" :disabled="!gameId">Import</button>
            </div>
            <div id="pgn-import-panel" class="pgn-import" style="display:none;" role="region" aria-label="PGN import panel">
              <textarea id="pgn-import-input" class="pgn-input" placeholder="Paste PGN with coordinate moves (e2e4 e7e5 ...)"></textarea>
              <div class="pgn-actions">
                <button class="btn btn-smaller" id="pgn-import-run" disabled>Load PGN</button>
                <button class="btn btn-smaller" id="pgn-import-clear" disabled>Clear</button>
              </div>
              <div class="import-hint">Note: Only simple coordinate moves are supported for import.</div>
            </div>
          </div>
        </div>
      </main>

    </div>
    <!-- Chat panel placed outside main layout for parity with other implementations -->
    <ChatComponent
      v-if="gameId && config.enableChat"
      :gameId="gameId"
      :gameState="gameState"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { usePersistentConfig } from './composables/usePersistentConfig.js'
import ChatComponent from './components/ChatComponent.vue'
import GameConfigPanel from './components/GameConfigPanel.vue'
// Side‑effect imports of shared root assets (helpers / PGN / messages) that attach
// utilities onto window (Debug, JSChessPGN, JSChessMessages, etc.).
// Use @root-shared alias so local dev (outside Docker) resolves the repository root shared/.
import '@root-shared/assets/js/helpers.js'
import '@root-shared/assets/js/pgn-core.js'
import '@root-shared/assets/js/messages.js'
import '@root-shared/assets/js/piece-renderer.js'

// Reactive state
const gameId = ref('')
const gameState = ref(null)
const isLoading = ref(false)
const isAIThinking = ref(false)
const isUndoing = ref(false)
const error = ref('') // Reserved for actual error conditions (not status/progress)
const selectedSquare = ref(null)
const hintFrom = ref(null)
const hintTo = ref(null)
const messages = ref([])
// Timers & orientation
const whiteTime = ref(0) // seconds
const blackTime = ref(0)
const timerInterval = ref(null)
const paused = ref(false)
const flipped = ref(false)
const started = ref(false)
const pgnOutputRef = ref(null)
let pgnManager = null

// Persisted user configuration via composable
const { config } = usePersistentConfig()

// Local message helper replicating vanilla pushMessage usage
function pushMessage(text, type = 'info', duration = 2500) {
  // Update local reactive list for in-component rendering
  messages.value.unshift({ id: Date.now() + Math.random(), text, type })
  // Limit to last 10
  if (messages.value.length > 10) messages.value.splice(10)
  // Also call shared DOM message system if available (ensures consistent styling)
  if (window.JSChessMessages) {
    try { window.JSChessMessages.showMessage(text, type, { duration }) } catch (e) { /* no-op */ }
  }
}

// Lightweight debug logger now delegates to shared Debug system (aiEngine category)
function logAI(...args){ if(window.Debug) window.Debug.log('aiEngine', ...args) }

function showCopyFeedback(msg) { pushMessage(msg, 'info', 1800) }

// Central AI scheduling helper (ensures single scheduling point)
function scheduleAIMoveIfNeeded(reason='') {
  const statusVal = (gameState.value?.status || '').toLowerCase()
  if (!gameId.value) return
  if (!['active','in_progress','ongoing','check',''].includes(statusVal)) return
  if (currentPlayer.value !== aiColor.value) return
  if (isAIThinking.value) return
  // Schedule
  pushMessage(`AI thinking...${reason?` (${reason})`:''}`, 'info', 1200)
  logAI('Scheduling AI move', { reason, status: statusVal, active: currentPlayer.value, aiColor: aiColor.value })
  setTimeout(()=> makeAIMove(), 350) // shorter delay for snappier UX
}

function startOrResumeTimers() {
  if (paused.value || !gameId.value || !config.enableTimer) return
  if (timerInterval.value) return
  timerInterval.value = setInterval(() => {
    if (paused.value) return
    const status = gameStatus.value
    if ([ 'checkmate','stalemate','draw','aborted','timeout'].includes(status)) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
      return
    }
    if (config.timerMode === 'count-up') {
      if (currentPlayer.value === 'white') whiteTime.value++
      else blackTime.value++
    } else if (config.timerMode === 'count-down') {
      if (currentPlayer.value === 'white') {
        whiteTime.value = Math.max(0, whiteTime.value - 1)
        if (whiteTime.value === 0) { pushMessage("⏳ White's time expired", 'warning', 4000); stopTimer() }
      } else {
        blackTime.value = Math.max(0, blackTime.value - 1)
        if (blackTime.value === 0) { pushMessage("⏳ Black's time expired", 'warning', 4000); stopTimer() }
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function togglePause() {
  if (!gameId.value) return
  paused.value = !paused.value
  if (paused.value) {
    stopTimer()
  } else {
    startOrResumeTimers()
  }
}

function resetTimers() {
  if (!config.enableTimer) {
    whiteTime.value = 0
    blackTime.value = 0
  } else if (config.timerMode === 'count-up') {
    whiteTime.value = 0
    blackTime.value = 0
  } else { // count-down
    const base = config.timeLimit * 60
    whiteTime.value = base
    blackTime.value = base
  }
  paused.value = false
  stopTimer()
  startOrResumeTimers()
}

function flipBoard() { flipped.value = !flipped.value }

const orientationLabel = computed(() => flipped.value ? 'Black at Bottom' : 'White at Bottom')

function formatTime(total) {
  const m = Math.floor(total / 60).toString().padStart(2,'0')
  const s = (total % 60).toString().padStart(2,'0')
  return `${m}:${s}`
}

const API_BASE = 'http://localhost:8080'
const currentPlayer = computed(() => gameState.value?.active_color || 'white')
// Derived AI color (always opposite of player's chosen color)
const aiColor = computed(() => (config.playerColor === 'white' ? 'black' : 'white'))
const gameStatus = computed(() => gameState.value?.status || '')

const canUndo = computed(() => {
  const hasGameState = !!gameState.value
  const hasMoves = gameState.value?.move_history && gameState.value.move_history.length > 0
  const gameNotFinished = !gameStatus.value ||
    ['active','', 'in_progress','ongoing','check'].includes(gameStatus.value)
  // Player can undo only when it's currently their turn
  const isPlayersTurn = currentPlayer.value === config.playerColor
  const notProcessing = !isLoading.value && !isAIThinking.value && !isUndoing.value
  return hasGameState && hasMoves && gameNotFinished && isPlayersTurn && notProcessing
})

const boardSquares = computed(() => {
  if (!gameState.value?.board) {
    return Array(64).fill({ piece: null })
  }

  const squares = []
  const boardLines = gameState.value.board.split('\n')

  // Create a mapping of positions to pieces
  const boardData = {}
  for (let i = 1; i <= 8; i++) {
    const line = boardLines[i]
    if (line) {
      const lineParts = line.split(' ')
      for (let j = 0; j < 8; j++) {
        const file = String.fromCharCode(97 + j) // a-h
        const rank = 9 - i // 8-1
        const position = file + rank
        const piece = lineParts[j + 1] // Skip rank number
        boardData[position] = piece === '.' ? null : piece
      }
    }
  }

  // Create squares array in the order needed for the grid (rank 8 to 1, file a to h)
  for (let rank = 8; rank >= 1; rank--) {
    for (let file = 0; file < 8; file++) {
      const fileChar = String.fromCharCode(97 + file)
      const position = fileChar + rank
      const piece = boardData[position]
      squares.push({ piece, rank: rank - 1, file, position })
    }
  }

  return squares
})

// Using shared CSS pseudo-elements for piece glyphs (no mapping needed)

// Methods
const createGame = async () => {
  isLoading.value = true
  error.value = ''

  try {
    // Instruct backend which side AI controls (opposite of player)
    const body = { ai_color: aiColor.value }
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) throw new Error('Failed to create game')

    const data = await response.json()
    gameId.value = data.id
    gameState.value = data
    flipped.value = (config.playerColor === 'black')
    resetTimers()
    if (config.playerColor === 'black') {
      // Player chose black: AI (white) should make the opening move
      scheduleAIMoveIfNeeded('opening')
    }
  } catch (err) {
    error.value = `Failed to create game: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const fetchGameState = async () => {
  if (!gameId.value) return

  try {
    const response = await fetch(`${API_BASE}/api/games/${gameId.value}`)
    if (!response.ok) {
      if (response.status === 404) {
        // Game not found - backend might have restarted
        error.value = 'Game session lost. Please create a new game.'
        resetGame()
        return
      }
      throw new Error('Failed to fetch game state')
    }

    const data = await response.json()
    if (data.error === 'game_not_found') {
      error.value = 'Game session lost. Please create a new game.'
      resetGame()
      return
    }
    gameState.value = data
  } catch (err) {
    error.value = `Failed to fetch game state: ${err.message}`
  }
}

const makeMove = async (from, to) => {
  if (!gameId.value) return

  isLoading.value = true
  error.value = ''

  try {
    // Validate move client-side first to provide immediate feedback
    try {
      const legalMovesResponse = await fetch(`${API_BASE}/api/games/${gameId.value}/legal-moves`)
      if (legalMovesResponse.ok) {
        const legalMoves = await legalMovesResponse.json()
        const isLegalMove = legalMoves.legal_moves?.some(move =>
          move.from === from && move.to === to
        )

        if (!isLegalMove) {
          error.value = 'Illegal move! Please select a valid move.'
          selectedSquare.value = null
          return
        }
      }
    } catch (validationError) {
      console.warn('Could not validate move client-side, proceeding to server validation')
    }

    // First, check if this is a special move like castling or promotion
    let movePayload = { from, to }

    // Check if this is a pawn promotion
    const piece = getPieceAtSquare(from)
    const isPromotion = isPawnPromotion(piece, from, to)

    if (isPromotion) {
      const promotionPiece = await getPromotionChoice()
      if (!promotionPiece) {
        // User cancelled promotion
        isLoading.value = false
        return
      }
      movePayload.promotion = promotionPiece
    }

    // Check if this might be a castling move by getting legal moves
    try {
      const legalMovesResponse = await fetch(`${API_BASE}/api/games/${gameId.value}/legal-moves`)
      if (legalMovesResponse.ok) {
        const legalMoves = await legalMovesResponse.json()

        // Check if this is a castling move
        const castlingMove = legalMoves.legal_moves?.find(move =>
          move.from === from && move.to === to && move.type === 'castling')

        if (castlingMove) {
          movePayload = { notation: castlingMove.notation }
        }
      }
    } catch (legalMoveError) {
      console.warn('Could not fetch legal moves, proceeding with normal move')
    }

    const response = await fetch(`${API_BASE}/api/games/${gameId.value}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movePayload)
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Game not found - backend might have restarted
        error.value = 'Game session lost. Please create a new game.'
        resetGame()
        return
      }

      const errorData = await response.json()

      if (errorData.error === 'game_not_found') {
        error.value = 'Game session lost. Please create a new game.'
        resetGame()
        return
      }

      if (errorData.error === 'illegal_move') {
        error.value = 'Illegal move! Please try a different move.'
        selectedSquare.value = null // Clear selection to let user try again
        return // Don't crash, just show error and return
      }

      throw new Error(errorData.error || 'Invalid move')
    }

  await fetchGameState()
  logAI('Human move applied; state fetched; active now', currentPlayer.value)
    selectedSquare.value = null

    // Check if it's AI's turn (black) and game is still in progress
  logAI('Post-move check for AI scheduling', { active: currentPlayer.value, aiColor: aiColor.value })
  scheduleAIMoveIfNeeded('post-move')
  if (!started.value) { started.value = true; if (config.enableTimer) startOrResumeTimers() }

  } catch (err) {
    error.value = `Move failed: ${err.message}`
    selectedSquare.value = null // Clear selection on any error
  } finally {
    isLoading.value = false
  }
}

const getAIHint = async () => {
  if (!gameId.value) return

  isAIThinking.value = true
  error.value = ''

  try {
    // Clear previous hints
    hintFrom.value = null
    hintTo.value = null

    // Check if it's our turn (white)
  if (currentPlayer.value !== config.playerColor) {
      error.value = 'Hints are only available on your turn'
      return
    }

    // Get legal moves for the current position to provide hints
    const legalMovesResponse = await fetch(`${API_BASE}/api/games/${gameId.value}/legal-moves`)

    if (!legalMovesResponse.ok) {
      throw new Error(`Failed to get legal moves: ${legalMovesResponse.status}`)
    }

    const legalMoves = await legalMovesResponse.json()

    if (!legalMoves.legal_moves || legalMoves.legal_moves.length === 0) {
      error.value = 'No legal moves available'
      return
    }

    // Enhanced heuristics for better move suggestions
    const moves = legalMoves.legal_moves
    let suggestedMove = moves[0] // fallback to first move

    // Priority 1: Checkmate moves
    const checkmateMove = moves.find(m => m.type === 'checkmate')
    if (checkmateMove) {
      suggestedMove = checkmateMove
    } else {
      // Priority 2: Capture moves (especially high-value pieces)
      const captureMoves = moves.filter(m => m.capture)
      const highValueCaptures = captureMoves.filter(m => {
        const capturedPiece = m.capture?.toLowerCase()
        return ['q', 'r', 'b', 'n'].includes(capturedPiece) // Queen, Rook, Bishop, Knight
      })

      if (highValueCaptures.length > 0) {
        suggestedMove = highValueCaptures[0]
      } else if (captureMoves.length > 0) {
        suggestedMove = captureMoves[0]
      } else {
        // Priority 3: Check moves
        const checkMoves = moves.filter(m => m.type === 'check')
        if (checkMoves.length > 0) {
          suggestedMove = checkMoves[0]
        } else {
          // Priority 4: Center control moves
          const centerMoves = moves.filter(m =>
            ['e4', 'e5', 'd4', 'd5', 'f4', 'f5', 'c4', 'c5'].includes(m.to)
          )
          if (centerMoves.length > 0) {
            suggestedMove = centerMoves[0]
          } else {
            // Priority 5: Development moves (knights and bishops)
            const developmentMoves = moves.filter(m => {
              const piece = m.piece?.toLowerCase()
              return ['n', 'b'].includes(piece) &&
                     ['1', '2'].includes(m.from[1]) // From back ranks
            })
            if (developmentMoves.length > 0) {
              suggestedMove = developmentMoves[0]
            }
          }
        }
      }
    }

    if (suggestedMove) {
      const notation = suggestedMove.notation || `${suggestedMove.from} → ${suggestedMove.to}`

      // Show message with the suggested move
  pushMessage(`💡 AI Hint: Try ${notation}`, 'success', 5000)

      // Highlight the suggested move
      hintFrom.value = suggestedMove.from
      hintTo.value = suggestedMove.to

      // Clear hints after 5 seconds
      setTimeout(() => {
        hintFrom.value = null
        hintTo.value = null
      }, 5000)

    } else {
      error.value = 'No moves to suggest'
    }

  } catch (err) {
    console.error('Error getting hint:', err)
    error.value = `Failed to get hint: ${err.message}`
  } finally {
    isAIThinking.value = false
  }
}

const makeAIMove = async () => {
  if (!gameId.value) return
  if (isAIThinking.value) return
  if (currentPlayer.value !== aiColor.value) {
    // Too early (state not yet updated) -> retry shortly
  logAI('AI called too early; retry scheduling', { active: currentPlayer.value, expected: aiColor.value })
    setTimeout(()=> scheduleAIMoveIfNeeded('retry'), 180)
    return
  }

  isAIThinking.value = true
  error.value = ''

  try {
    // Step 1: ask backend for an AI move suggestion (does NOT apply the move itself)
  logAI('Requesting AI suggestion (primary)')
  let aiResponse = await fetch(`${API_BASE}/api/games/${gameId.value}/ai-move`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level: 'medium', engine: 'random' })
    })

    if (!aiResponse.ok) {
      // Fallback: try easy/random if first attempt unsupported
      const firstErr = await aiResponse.text().catch(()=> '')
  logAI('Primary AI suggestion failed; fallback attempt')
  aiResponse = await fetch(`${API_BASE}/api/games/${gameId.value}/ai-move`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'easy', engine: 'random' })
      })
      if (!aiResponse.ok) {
        if (aiResponse.status === 404) {
          error.value = 'Game session lost. Please create a new game.'
          resetGame(); return
        }
        const errorData = await aiResponse.text().catch(()=> '')
        throw new Error(errorData || firstErr || 'Failed AI move')
      }
    }

    const data = await aiResponse.json()

    if (!data.move || !data.move.from || !data.move.to) {
      error.value = 'AI could not find a move'
      pushMessage('AI found no move', 'warning', 2000)
      logAI('AI suggestion empty', data)
      return
    }

    // Step 2: execute the suggested move via normal move endpoint
    logAI('Applying AI move', data.move)
    const moveExec = await fetch(`${API_BASE}/api/games/${gameId.value}/moves`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: data.move.from, to: data.move.to })
    })
    if (!moveExec.ok) {
      const moveErrText = await moveExec.text().catch(()=> '')
      throw new Error(moveErrText || 'Failed to apply AI move')
    }
  const updated = await moveExec.json()
    gameState.value = updated
    error.value = ''
    pushMessage(`AI played: ${data.move.notation || data.notation || (data.move.from+data.move.to)}`, 'info', 2500)
  logAI('AI move applied; new active', updated.active_color)
  } catch (err) {
    console.error('Error making AI move:', err)
  error.value = `Failed to make AI move: ${err.message}`
  pushMessage('AI move failed – will retry if still its turn', 'error', 2200)
  setTimeout(()=> scheduleAIMoveIfNeeded('error-retry'), 600)
  } finally {
    isAIThinking.value = false
  }
}

const resetGame = () => {
  gameId.value = ''
  gameState.value = null
  selectedSquare.value = null
  hintFrom.value = null
  hintTo.value = null
  error.value = ''
  // Create a new game immediately
  createGame()
}

const undoMove = async () => {
  if (!gameState.value?.move_history?.length) {
    error.value = 'No moves to undo'
    return
  }

  if (isAIThinking.value) {
    error.value = 'Cannot undo while AI is thinking'
    return
  }

  if (currentPlayer.value !== config.playerColor) {
    error.value = 'Cannot undo during AI turn'
    return
  }

  isUndoing.value = true
  error.value = ''

  try {
  pushMessage('Undoing last move...', 'info', 1500)

    // Create a new game
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) throw new Error('Failed to create new game for undo')

    const newGame = await response.json()
    const newGameId = newGame.id

    // Get moves to replay (all except last 2: human + AI move)
    const currentMoves = gameState.value.move_history
    const movesToReplay = currentMoves.slice(0, -2)

    // Replay moves
    for (const moveData of movesToReplay) {
      const moveRequest = {
        from: moveData.from,
        to: moveData.to
      }

      const moveResponse = await fetch(`${API_BASE}/api/games/${newGameId}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveRequest)
      })

      if (!moveResponse.ok) {
        throw new Error('Failed to replay move during undo')
      }
    }

    // Update to the new game state
    gameId.value = newGameId
    await fetchGameState()

    // Clear selections and hints
    selectedSquare.value = null
    hintFrom.value = null
    hintTo.value = null

  pushMessage('✅ Move undone successfully', 'success', 3000)

  } catch (err) {
    error.value = `Failed to undo move: ${err.message}`
  } finally {
    isUndoing.value = false
  }
}

// Removed legacy getMessageClass (using shared .game-message styles)

const handleSquareClick = (index) => {
  // Clear any active hints when user clicks
  hintFrom.value = null
  hintTo.value = null

  const square = boardSquares.value[index]
  const position = square.position

  if (selectedSquare.value === null) {
    // First click - select piece
    if (square.piece && isCurrentPlayerPiece(square.piece)) {
      selectedSquare.value = index
    }
  } else {
    // Second click - try to move
    const fromSquare = boardSquares.value[selectedSquare.value]
    const fromPosition = fromSquare.position

    if (selectedSquare.value === index) {
      // Clicking same square - deselect
      selectedSquare.value = null
    } else {
      // Try to make move
      makeMove(fromPosition, position)
    }
  }
}

const isCurrentPlayerPiece = (piece) => {
  if (!piece) return false
  const isWhitePiece = piece === piece.toUpperCase()
  return (currentPlayer.value === 'white' && isWhitePiece) ||
         (currentPlayer.value === 'black' && !isWhitePiece)
}

const getSquareClass = (square, index) => {
  const rank = Math.floor(index / 8)
  const file = index % 8
  const isLight = (rank + file) % 2 === 0

  return {
    'square': true,
    'light': isLight,
    'dark': !isLight,
    'selected': selectedSquare.value === index,
    'has-piece': square.piece,
    'hint-from': hintFrom.value === square.position,
    'hint-to': hintTo.value === square.position
  }
}

function pieceCssClasses(piece) {
  if (!piece) return []
  // Use the shared piece renderer for consistent behavior across apps
  if (window.chessPieceRenderer) {
    return window.chessPieceRenderer.getPieceClasses(piece)
  }
  // Fallback to original implementation
  const isWhite = piece === piece.toUpperCase()
  const map = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }
  const type = map[piece.toLowerCase()] || 'piece'
  return ['piece', isWhite ? 'white' : 'black', type]
}

function squareAriaLabel(square, index) {
  if (!square) return 'Empty square'
  const coord = square.position || ''
  if (!square.piece) return `Empty square ${coord}`
  const isWhite = square.piece === square.piece.toUpperCase()
  const color = isWhite ? 'white' : 'black'
  const map = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }
  const type = map[square.piece.toLowerCase()] || 'piece'
  return `${color} ${type} on ${coord}`
}

// Pawn promotion helper functions
const getPieceAtSquare = (square) => {
  if (!gameState.value?.board) return null

  const file = square.charCodeAt(0) - 97 // a=0, b=1, ...
  const rank = parseInt(square[1]) - 1    // 1=0, 2=1, ...

  const boardLines = gameState.value.board.split('\n')
  if (boardLines.length < 10) return null

  const line = boardLines[8 - rank] // Board is displayed from 8 to 1
  if (!line || line.length < file * 2 + 2) return null

  const piece = line[file * 2 + 2]
  return piece === '.' ? null : piece
}

const isPawnPromotion = (piece, from, to) => {
  if (!piece || (piece.toLowerCase() !== 'p')) return false

  const toRank = parseInt(to[1])
  const isWhitePawn = piece === 'P'
  const isBlackPawn = piece === 'p'

  return (isWhitePawn && toRank === 8) || (isBlackPawn && toRank === 1)
}

const getPromotionChoice = () => {
  return new Promise((resolve) => {
    // Create promotion dialog overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `

    const dialog = document.createElement('div')
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      max-width: 400px;
    `

    dialog.innerHTML = `
      <h3 style="margin-bottom: 20px; color: #333;">Choose promotion piece:</h3>
      <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
        <button data-piece="Q" style="padding: 15px; font-size: 24px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">♕ Queen</button>
        <button data-piece="R" style="padding: 15px; font-size: 24px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">♖ Rook</button>
        <button data-piece="B" style="padding: 15px; font-size: 24px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">♗ Bishop</button>
        <button data-piece="N" style="padding: 15px; font-size: 24px; border: 2px solid #ddd; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;">♘ Knight</button>
      </div>
      <button id="cancel-promotion" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
    `

    // Add hover effects
    dialog.querySelectorAll('button[data-piece]').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#e9ecef'
        btn.style.borderColor = '#007bff'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'white'
        btn.style.borderColor = '#ddd'
      })
    })

    // Add event listeners
    dialog.querySelectorAll('button[data-piece]').forEach(btn => {
      btn.addEventListener('click', () => {
        const piece = btn.dataset.piece
        document.body.removeChild(overlay)
        resolve(piece)
      })
    })

    dialog.querySelector('#cancel-promotion').addEventListener('click', () => {
      document.body.removeChild(overlay)
      resolve(null)
    })

    overlay.appendChild(dialog)
    document.body.appendChild(overlay)
  })
}

// Initialize
onMounted(() => {
  // Automatically create a game on page load to match other apps
  createGame()
  pgnManager = window.JSChessPGNSavesCore?.createManager({
  saveKey:'vueSaveSlotsV2', autosaveKey:'vueAutosaveV2',
  getGame: ()=>({
    gameId: gameId.value,
    gameState: gameState.value,
    api: {
      makeMove: async (id,payload)=>{ const resp=await fetch(`${API_BASE}/api/games/${id}/moves`,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); if(!resp.ok) throw new Error('Move failed'); const st=await resp.json(); gameState.value=st; return st },
      getGame: async (id)=>{ const resp=await fetch(`${API_BASE}/api/games/${id}`); if(!resp.ok) throw new Error('Fetch failed'); return resp.json() }
    },
    startNewGame: async ()=>{ await createGame() },
    updateBoard: ()=>{}, updateGameInfo: ()=>{}, updateMoveHistory: ()=>{}
  }),
  getPlayerName: ()=> config.playerName,
  getOrientation: ()=> flipped.value ? 'black':'white',
  setOrientation: (o)=>{ flipped.value=(o==='black') },
  showMessage: (text,type)=> pushMessage(text,type,2000)
}); window.addEventListener('keydown', handleCopyShortcut)
})

function handleCopyShortcut(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
    if (document.activeElement === pgnOutputRef.value) {
      showCopyFeedback('PGN copied to clipboard')
    }
  }
}

// Watch active player/status to manage timers
watch(currentPlayer, () => { if (!paused.value) startOrResumeTimers() })
watch(() => config.timerMode, () => { resetTimers() })
watch(() => config.timeLimit, () => { if (config.timerMode === 'count-down') resetTimers() })
watch(() => config.enableTimer, () => { resetTimers() })
watch(() => config.playerColor, (val) => { flipped.value = (val === 'black') })
watch(gameStatus, (val) => {
  if ([ 'checkmate','stalemate','draw','aborted','timeout'].includes(val)) {
    stopTimer()
  }
})
watch(() => gameState.value?.move_history?.length, () => { pgnManager && pgnManager.handleMoveChange() })
watch(gameStatus, (val)=> { if(['checkmate','white_wins','black_wins','draw','stalemate'].includes(val)) { pgnManager && pgnManager.handleMoveChange() } })

// Ensure AI responds if state updates asynchronously but we didn't schedule its move yet
watch(gameState, (val) => {
  if (!val) return
  scheduleAIMoveIfNeeded('state-watcher')
})

function toggleTheme(){
  if(window.JSChessTheme){ window.JSChessTheme.toggle(); } else { console.warn('Theme script not ready'); }
}
</script>

<style scoped>
/* Minimal scoped styles retained for board flip only; all other rules use shared CSS */
.board-wrapper.flipped .chess-board { transform: rotate(180deg); }
.board-wrapper.flipped .chess-board .piece { transform: rotate(180deg); }
</style>
