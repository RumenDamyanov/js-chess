<template>
  <div id="app">
    <header class="app-header">
      <div class="header-container">
        <a href="http://localhost:3000" class="header-brand">
          <span class="header-title">♟️ JS Chess</span>
          <span class="header-framework">Vue</span>
        </a>

    <nav class="header-nav">
          <ul class="nav-links">
            <li><a href="http://localhost:3000" class="nav-link">🏠 Home</a></li>
            <li><span class="nav-separator"></span></li>
            <li><a href="http://localhost:3001" class="nav-link">📦 Vanilla</a></li>
            <li><a href="http://localhost:3002" class="nav-link">📘 TypeScript</a></li>
            <li><a href="http://localhost:3003" class="nav-link">💙 jQuery</a></li>
  <li><span class="nav-link nav-link-disabled" title="Current app">💚 Vue</span></li>
            <li><span class="nav-link nav-link-disabled" title="Work in progress">⚛️ React (WIP)</span></li>
            <li><span class="nav-link nav-link-disabled" title="Work in progress">🅰️ Angular (WIP)</span></li>
          </ul>

          <div class="header-controls">
            <button class="btn" @click="flipBoard" title="Flip board orientation">Flip Board</button>
            <button id="theme-toggle-btn" class="btn btn-secondary" @click="toggleTheme" aria-label="Toggle theme">🌙 Dark</button>
            <button @click="resetGame" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Creating...' : 'New Game' }}
            </button>
            <button
              class="btn"
              :disabled="!hasSavedGame"
              @click="restoreFromSaved"
              title="Restore last saved game"
            >Restore</button>
            <button
              @click="undoMove"
              :disabled="!canUndo"
              class="btn"
              v-if="gameId"
            >
              Undo
            </button>
            <button
              @click="getAIHint"
              :disabled="!gameId || !hintsEnabled || currentPlayer !== playerColor || isLoading || isAIThinking"
              class="btn"
              v-if="gameId"
            >
              Hint
            </button>
          </div>
        </nav>
      </div>
    </header>

    <div class="container">

      <main class="grid" style="grid-template-columns: 1fr auto 1fr; align-items: start;">
        <div class="left-panel">
          <div class="card">
            <div class="card-header">
              <h3>⚙️ Game Settings</h3>
            </div>
            <div class="card-body text-sm" style="display: grid; gap: 8px; align-items: center;">
              <label for="player-name">Your Name</label>
              <input id="player-name" v-model="playerName" class="input" placeholder="Your name" />
              <label for="player-color">Play As</label>
              <select id="player-color" v-model="playerColor" class="input">
                <option value="white">White (bottom)</option>
                <option value="black">Black (bottom)</option>
              </select>
              <label for="ai-level">Game Difficulty</label>
              <select id="ai-level" v-model="aiLevel" class="input">
                <option value="harmless">Harmless</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
                <option value="godlike">Godlike</option>
              </select>

              <label for="time-control">Time Control</label>
              <select id="time-control" v-model="timeControl" class="input">
                <option value="bullet1">1+0 Bullet</option>
                <option value="blitz3">3+0 Blitz</option>
                <option value="blitz5">5+0 Blitz</option>
                <option value="blitz5_3">5+3 Blitz</option>
                <option value="rapid10_5">10+5 Rapid</option>
                <option value="rapid15_10">15+10 Rapid</option>
                <option value="custom">Custom…</option>
              </select>

              <div v-if="timeControl === 'custom'" class="grid" style="grid-template-columns: 1fr 1fr; gap: 8px; align-items: center;">
                <label for="custom-mins" style="grid-column: 1 / span 2;">Custom Time</label>
                <input id="custom-mins" type="number" min="0" max="180" step="1" v-model.number="customMinutes" class="input" placeholder="Minutes" />
                <input id="custom-inc" type="number" min="0" max="60" step="1" v-model.number="customIncrement" class="input" placeholder="Increment (s)" />
              </div>

              <label style="display: flex; gap: 8px; align-items: center;">
                <input type="checkbox" v-model="hintsEnabled" />
                Enable Hints
              </label>
              <label style="display: flex; gap: 8px; align-items: center;">
                <input type="checkbox" v-model="useTimers" />
                Use Timers
              </label>
            </div>
          </div>

          <!-- Saves card -->
          <div class="card">
            <div class="card-header">
              <h3>💾 Saves</h3>
            </div>
            <div class="card-body text-sm" style="display:grid; gap:8px;">
              <div v-for="slot in [1,2,3]" :key="slot" class="grid" style="grid-template-columns: auto 1fr auto auto; gap:8px; align-items:center;">
                <span>Slot {{ slot }}</span>
                <span class="text-xs" style="opacity:0.8;">{{ getSlotLabel(slot) }}</span>
                <button class="btn" @click="saveToSlot(slot)" :disabled="!canSave">Save</button>
                <div style="display:flex; gap:6px;">
                  <button class="btn" @click="loadFromSlot(slot)" :disabled="!hasSlot(slot)">Load</button>
                  <button class="btn btn-secondary" @click="deleteSlot(slot)" :disabled="!hasSlot(slot)">Delete</button>
                </div>
              </div>
            </div>
          </div>

          <!-- PGN moved below Saves -->
          <div class="card">
            <h3>📗 PGN</h3>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <button class="btn" @click="copyPGN" :disabled="!pgnText">Copy PGN</button>
              <span v-if="copiedPGN" class="text-sm">✅ Copied!</span>
            </div>
            <pre class="text-sm" style="white-space: pre-wrap; word-break: break-word;">{{ pgnText }}</pre>
          </div>
        </div>

        <div class="board-wrapper">
          <div class="chess-board" id="chess-board">
            <div
              v-for="(square, index) in boardSquares"
              :key="index"
              :class="getSquareClass(square, index)"
              @click="handleSquareClick(index)"
            >
              <span v-if="square.piece" :class="getPieceClass(square.piece)">
                {{ getPieceSymbol(square.piece) }}
              </span>
            </div>
          </div>
          <!-- Orientation indicator -->
          <div class="text-sm" style="margin-top:8px; opacity:0.8;">Bottom: <strong>{{ boardOrientation }}</strong></div>
          <!-- Message region below the board and indicator (consistent with other apps) -->
          <div id="game-messages" class="game-messages-region" aria-live="polite" aria-atomic="false">
            <div v-show="!!error" :class="getMessageClass(error)">{{ error }}</div>
          </div>
        </div>

        <div class="right-panel">
          <div class="game-info card">
            <h3>Game Status</h3>
            <div class="status">
              <div>Turn: <span>{{ gameId ? currentPlayer : (isLoading ? 'Loading...' : '-') }}</span></div>
              <div>Status: <span>{{ gameId ? gameStatus || 'Active' : (isLoading ? 'Creating Game...' : 'No Game') }}</span></div>
              <div>Move: <span>{{ gameId ? (gameState?.move_count || 1) : '-' }}</span></div>
            </div>
          </div>

          <TimerPanel
            v-if="gameId && useTimers"
            :activeColor="currentPlayer"
            :running="isGameOngoing"
            :gameId="gameId"
            :initialSeconds="timeInitial"
            :incrementSeconds="timeIncrement"
            :whiteSecondsOverride="restoredWhiteSeconds"
            :blackSecondsOverride="restoredBlackSeconds"
            @times-update="onTimesUpdate"
            :key="gameId + '-' + timeControl + '-' + timeInitial + '-' + timeIncrement"
            @time-expired="onTimeExpired"
          />

  <div class="move-history card">
            <h3>📜 Move History</h3>
    <div class="moves" style="max-height: 700px; overflow-y: auto;">
              <div class="move-item" v-if="!gameId || !gameState?.move_history?.length">
                <span class="move-number">-</span>
                <span class="move-notation">{{ gameId ? 'Game started' : 'No game active' }}</span>
              </div>
              <div
                v-for="(move, index) in gameState?.move_history"
                :key="index"
                class="move-item"
              >
                <span class="move-number">{{ index + 1 }}</span>
        <span class="move-notation">{{ move.notation || (move.from + ' → ' + move.to) }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Chat Component -->
  <ChatComponent
        v-if="gameId"
        :gameId="gameId"
        :gameState="gameState"
      />

      <!-- Promotion Modal -->
      <PromotionModal
        v-if="showPromotion"
        @select="onPromotionSelect"
        @cancel="onPromotionCancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import ChatComponent from './components/ChatComponent.vue'
import PromotionModal from './components/PromotionModal.vue'
import TimerPanel from './components/TimerPanel.vue'

// Reactive state
const gameId = ref('')
const gameState = ref(null)
const isLoading = ref(false)
const isAIThinking = ref(false)
const isUndoing = ref(false)
const error = ref('')
const selectedSquare = ref(null)
const hintFrom = ref(null)
const hintTo = ref(null)
const aiLevel = ref('hard')
const hintsEnabled = ref(true)
const playerColor = ref('white')
const playerName = ref('')
const useTimers = ref(true)
// Board orientation (which color is at the bottom). Defaults to playerColor but can be flipped.
const boardOrientation = ref('white')
// Time control: preset id -> initial seconds and increment seconds
const timeControl = ref('blitz5')
const customMinutes = ref(5)
const customIncrement = ref(0)
const timeInitial = computed(() => {
  switch (timeControl.value) {
    case 'bullet1': return 1 * 60
    case 'blitz3': return 3 * 60
    case 'blitz5': return 5 * 60
    case 'blitz5_3': return 5 * 60
    case 'rapid10_5': return 10 * 60
    case 'rapid15_10': return 15 * 60
  case 'custom': return Math.max(0, Math.floor((customMinutes.value || 0) * 60))
    default: return 5 * 60
  }
})
const timeIncrement = computed(() => {
  switch (timeControl.value) {
    case 'blitz5_3': return 3
    case 'rapid10_5': return 5
    case 'rapid15_10': return 10
  case 'custom': return Math.max(0, Math.floor(customIncrement.value || 0))
    default: return 0
  }
})

// Copy PGN feedback
const copiedPGN = ref(false)

// Promotion modal state
const showPromotion = ref(false)
const promotionResolver = ref(null)

// API base URL
const API_BASE = 'http://localhost:8080'

// Computed properties
const currentPlayer = computed(() => gameState.value?.active_color || 'white')
const gameStatus = computed(() => gameState.value?.status || '')
const terminalStatuses = ['white_wins', 'black_wins', 'draw', 'stalemate', 'checkmate', 'timeout']
const isGameOngoing = computed(() => {
  const statusVal = (gameStatus.value || '').toLowerCase()
  return !terminalStatuses.includes(statusVal)
})
const aiPlaysColor = computed(() => (playerColor.value === 'white' ? 'black' : 'white'))

const canUndo = computed(() => {
  const hasGameState = !!gameState.value
  const hasMovesToUndo = gameState.value?.move_history && gameState.value.move_history.length > 0
  // Accept any status that indicates the game is still playable
  const gameNotFinished = !gameStatus.value ||
                         gameStatus.value === 'active' ||
                         gameStatus.value === '' ||
                         gameStatus.value === 'in_progress' ||
                         gameStatus.value === 'ongoing'
  const notAITurn = currentPlayer.value === playerColor.value
  const notProcessing = !isLoading.value && !isAIThinking.value && !isUndoing.value

  return hasGameState && hasMovesToUndo && gameNotFinished && notAITurn && notProcessing
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

  // Create squares array in the order needed for the grid
  if (boardOrientation.value === 'white') {
    for (let rank = 8; rank >= 1; rank--) {
      for (let file = 0; file < 8; file++) {
        const fileChar = String.fromCharCode(97 + file)
        const position = fileChar + rank
        const piece = boardData[position]
        squares.push({ piece, rank: rank - 1, file, position })
      }
    }
  } else {
    for (let rank = 1; rank <= 8; rank++) {
      for (let file = 7; file >= 0; file--) {
        const fileChar = String.fromCharCode(97 + file)
        const position = fileChar + rank
        const piece = boardData[position]
        squares.push({ piece, rank: 8 - rank, file: 7 - file, position })
      }
    }
  }

  return squares
})

// Piece symbols mapping
const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
}

// Helpers
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
const fetchWithRetry = async (url, options = {}, retries = 2, backoffMs = 300) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options)
      return res
    } catch (e) {
      if (attempt === retries) throw e
      await delay(backoffMs * (attempt + 1))
    }
  }
}

// --- Cookie helpers for saving settings like other apps ---
const setCookie = (name, value, days = 365) => {
  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`
  } catch (_) {}
}
const getCookie = (name) => {
  try {
    const nameEQ = name + '='
    const parts = document.cookie.split(';')
    for (let c of parts) {
      c = c.trim()
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length))
    }
    return null
  } catch (_) { return null }
}
const SETTINGS_COOKIE_KEY = 'vue-chess-settings-v1'
const SETTINGS_VERSION = '1.0.0'
const buildSettingsPayload = () => ({
  version: SETTINGS_VERSION,
  timestamp: Date.now(),
  settings: {
    playerName: playerName.value,
    playerColor: playerColor.value,
    aiLevel: aiLevel.value,
    hintsEnabled: hintsEnabled.value,
    useTimers: useTimers.value,
    timeControl: timeControl.value,
    customMinutes: customMinutes.value,
    customIncrement: customIncrement.value,
    boardOrientation: boardOrientation.value
  }
})
const saveSettingsCookie = () => {
  try {
    const serialized = JSON.stringify(buildSettingsPayload())
    setCookie(SETTINGS_COOKIE_KEY, serialized, 365)
  } catch (e) {
    // ignore
  }
}
const loadSettingsCookie = () => {
  try {
    const serialized = getCookie(SETTINGS_COOKIE_KEY)
    if (!serialized) return false
    const data = JSON.parse(serialized)
    const s = data?.settings || {}
    if (typeof s.playerName === 'string') playerName.value = s.playerName
    if (s.playerColor === 'white' || s.playerColor === 'black') playerColor.value = s.playerColor
    if (typeof s.aiLevel === 'string') aiLevel.value = s.aiLevel
    if (typeof s.hintsEnabled === 'boolean') hintsEnabled.value = s.hintsEnabled
    if (typeof s.useTimers === 'boolean') useTimers.value = s.useTimers
    if (typeof s.timeControl === 'string') timeControl.value = s.timeControl
    if (typeof s.customMinutes === 'number') customMinutes.value = s.customMinutes
    if (typeof s.customIncrement === 'number') customIncrement.value = s.customIncrement
    if (s.boardOrientation === 'white' || s.boardOrientation === 'black') boardOrientation.value = s.boardOrientation
    return true
  } catch (e) { return false }
}

// Methods
const createGame = async () => {
  isLoading.value = true
  error.value = 'Creating game...'

  try {
  const response = await fetchWithRetry(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_color: aiPlaysColor.value })
    })

    if (!response.ok) throw new Error('Failed to create game')

    const data = await response.json()
    gameId.value = data.id
    gameState.value = data
    // If AI to move first, trigger
    if (gameState.value?.active_color === aiPlaysColor.value) {
      setTimeout(() => makeAIMove(), 400)
    }
  // Clear any status messages on new game shortly after create
  setTimeout(() => { if (error.value === 'Creating game...') error.value = '' }, 400)
  } catch (err) {
    error.value = `Failed to create game: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const fetchGameState = async () => {
  if (!gameId.value) return

  try {
  const response = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}`)
    if (!response.ok) {
      if (response.status === 404) {
    // Game not found - backend might have restarted
    error.value = 'Game session lost. You can restore from last saved history.'
    sessionLost.value = true
    return
      }
      throw new Error('Failed to fetch game state')
    }

    const data = await response.json()
    if (data.error === 'game_not_found') {
      error.value = 'Game session lost. You can restore from last saved history.'
      sessionLost.value = true
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
      const legalMovesResponse = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/legal-moves`)
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
      const legalMovesResponse = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/legal-moves`)
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

  const response = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movePayload)
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Game not found - backend might have restarted; don't auto-reset
        error.value = 'Game session lost. You can restore from last saved history.'
        sessionLost.value = true
        return
      }

      const errorData = await response.json()

      if (errorData.error === 'game_not_found') {
        error.value = 'Game session lost. You can restore from last saved history.'
        sessionLost.value = true
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
  saveAuto()
    selectedSquare.value = null

    // Check if it's AI's turn (black) and game is still ongoing
    const statusVal = (gameState.value?.status || '').toLowerCase()
  const ongoing = !terminalStatuses.includes(statusVal)
  if (gameState.value?.active_color === aiPlaysColor.value && ongoing && !isAIThinking.value) {
      // It's black's turn - make an AI move automatically
      setTimeout(() => makeAIMove(), 700) // Small delay for better UX
    }

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
  error.value = '💡 Getting Hint...'

  try {
    // Clear previous hints
    hintFrom.value = null
    hintTo.value = null

  // Check if it's our turn (respect selected player color)
  if (currentPlayer.value !== playerColor.value) {
      error.value = 'Hints are only available on your turn'
      return
    }

    // Get legal moves for the current position to provide hints
  const legalMovesResponse = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/legal-moves`)

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
      error.value = `💡 AI Hint: Try ${notation}`

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
    // If still showing transient loading message, clear it shortly
    if (error.value === '💡 Getting Hint...') {
      setTimeout(() => { if (error.value === '💡 Getting Hint...') error.value = '' }, 500)
    }
  }
}

const makeAIMove = async () => {
  if (!gameId.value) return
  if (isAIThinking.value) return

  error.value = ''
  // Ensure we have the latest state before deciding
  await fetchGameState()

  const statusVal = (gameState.value?.status || '').toLowerCase()
  const ongoing = !terminalStatuses.includes(statusVal)
  if (!(gameState.value?.active_color === aiPlaysColor.value && ongoing)) return

  isAIThinking.value = true

  try {
    // Make AI move for black player using the backend AI endpoint
    // Map UI difficulty to backend-friendly levels
    const levelMap = {
      harmless: 'easy',
      easy: 'easy',
      normal: 'medium',
      hard: 'hard',
      godlike: 'hard'
    }
    const backendLevel = levelMap[aiLevel.value] || 'medium'

  const aiResponse = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/ai-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: backendLevel,
        engine: 'minimax'
      })
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 404) {
        error.value = 'Game session lost. You can restore from last saved history.'
        sessionLost.value = true
        return
      }
      const errorData = await aiResponse.json()
      if (errorData.error === 'game_not_found') {
        error.value = 'Game session lost. You can restore from last saved history.'
        sessionLost.value = true
        return
      }
      throw new Error(errorData.error || 'Failed to make AI move')
    }

    const data = await aiResponse.json()

    if (data && (data.move || data.notation)) {
      // Apply the suggested AI move to the game via the standard moves endpoint
      const aiMove = data.move || {}
      const notation = data.notation || aiMove.notation
      let movePayload

      if (notation) {
        movePayload = { notation }
      } else if (aiMove.from && aiMove.to) {
        movePayload = { from: aiMove.from, to: aiMove.to }
        if (aiMove.promotion) movePayload.promotion = aiMove.promotion
      } else {
        error.value = 'AI provided an invalid move'
        return
      }

  const applyResp = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movePayload)
      })

      if (!applyResp.ok) {
        const errData = await applyResp.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to apply AI move')
      }

      // Refresh the game state after applying the move
  await fetchGameState()
  saveAuto()
      error.value = ''
    } else {
      error.value = 'AI could not find a move'
    }
  } catch (err) {
    console.error('Error making AI move:', err)
    error.value = `Failed to make AI move: ${err.message}`
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

// Handle chess clock timeout from TimerPanel
const onTimeExpired = ({ color }) => {
  // Stop further AI actions
  isAIThinking.value = false
  // Set user-facing message and mark status locally as timeout
  const winner = color === 'white' ? 'Black' : 'White'
  error.value = `⏰ Time over for ${color}. ${winner} wins!`
  if (gameState.value) {
    gameState.value.status = 'timeout'
  }
}

const undoMove = async () => {
  if (!gameState.value || !gameState.value.move_history || gameState.value.move_history.length === 0) {
    error.value = 'No moves to undo'
    return
  }

  if (isAIThinking.value) {
    error.value = 'Cannot undo while AI is thinking'
    return
  }

  if (currentPlayer.value !== playerColor.value) {
    error.value = 'Cannot undo during AI turn'
    return
  }

  isUndoing.value = true
  error.value = '↩️ Undoing last move...'

  try {
  // keep existing message

    // Create a new game preserving current AI color
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_color: aiPlaysColor.value })
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

    error.value = '✅ Move undone successfully'

    // Clear the success message after 3 seconds
    setTimeout(() => {
      if (error.value === '✅ Move undone successfully') {
        error.value = ''
      }
    }, 3000)

  } catch (err) {
    error.value = `Failed to undo move: ${err.message}`
  } finally {
    isUndoing.value = false
    // Clear transient message if still present
    if (error.value === '↩️ Undoing last move...') {
      setTimeout(() => { if (error.value === '↩️ Undoing last move...') error.value = '' }, 500)
    }
  }
}

const getMessageClass = (message) => {
  const lower = (message || '').toLowerCase()
  if (!lower) return 'game-message info'
  // success-style cues
  if (lower.includes('hint') || lower.includes('saved') || lower.includes('restored') || lower.includes('✅')) {
    return 'game-message success'
  }
  // warnings (non-fatal but notable)
  if (lower.includes('time over') || lower.includes('timeout') || lower.includes('lost')) {
    return 'game-message warning'
  }
  // neutral info/progress
  if (lower.includes('creating') || lower.includes('undoing') || lower.includes('loading') || lower.includes('restoring') || lower.includes('getting')) {
    return 'game-message info'
  }
  // errors
  if (lower.includes('failed') || lower.includes('error') || lower.includes('illegal') || lower.includes('cannot')) {
    return 'game-message error'
  }
  return 'game-message info'
}

// Build a simple PGN string from move history using SAN notation when present
const pgnText = computed(() => {
  const history = gameState.value?.move_history || []
  if (!history.length) return ''
  const parts = []
  for (let i = 0; i < history.length; i += 2) {
    const white = history[i]
    const black = history[i + 1]
    const whiteSan = white?.notation || `${white?.from || ''}-${white?.to || ''}`
    const blackSan = black ? (black.notation || `${black.from}-${black.to}`) : ''
    const moveNo = Math.floor(i / 2) + 1
    parts.push(`${moveNo}. ${whiteSan}${black ? ' ' + blackSan : ''}`)
  }
  return parts.join(' ')
})

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

const getPieceClass = (piece) => {
  return {
    'piece': true,
    [`piece-${piece}`]: true
  }
}

const getPieceSymbol = (piece) => {
  return pieceSymbols[piece] || '?'
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
    promotionResolver.value = resolve
    showPromotion.value = true
  })
}

const onPromotionSelect = (piece) => {
  try {
    if (promotionResolver.value) promotionResolver.value(piece)
  } finally {
    showPromotion.value = false
    promotionResolver.value = null
  }
}

const onPromotionCancel = () => {
  try {
    if (promotionResolver.value) promotionResolver.value(null)
  } finally {
    showPromotion.value = false
    promotionResolver.value = null
  }
}

// Initialize
onMounted(() => {
  // Load settings from cookie first so they apply before game creation
  const loaded = loadSettingsCookie()
  // If no saved orientation, default to selected player color
  if (!loaded && !boardOrientation.value) {
    boardOrientation.value = playerColor.value
  }
  // Automatically create a game on page load to match other apps
  createGame()
  // Start polling loop to keep state fresh while ongoing
  startPolling()
})
onUnmounted(() => {
  stopPolling()
})

// Theme toggle handler to integrate with shared theme script if present
const toggleTheme = () => {
  try {
    if (window && window.JSChessTheme && typeof window.JSChessTheme.toggle === 'function') {
      window.JSChessTheme.toggle()
    }
  } catch (e) {
    // no-op
  }
}

// Copy PGN to clipboard with simple feedback
const copyPGN = async () => {
  try {
    if (!pgnText.value) return
    await navigator.clipboard?.writeText(pgnText.value)
    copiedPGN.value = true
    setTimeout(() => (copiedPGN.value = false), 1500)
  } catch (e) {
    // Fallback: create a temporary textarea
    try {
      const ta = document.createElement('textarea')
      ta.value = pgnText.value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      copiedPGN.value = true
      setTimeout(() => (copiedPGN.value = false), 1500)
    } catch (_) {}
  }
}

// Lightweight polling to stay in sync with backend
let pollIntervalId = null
const startPolling = () => {
  stopPolling()
  pollIntervalId = setInterval(async () => {
    // Poll only when we have a game, it’s ongoing, and AI isn’t thinking
    if (!gameId.value) return
    if (!isGameOngoing.value) return
    if (isAIThinking.value) return
    await fetchGameState()
  }, 2000)
}
const stopPolling = () => {
  if (pollIntervalId) {
    clearInterval(pollIntervalId)
    pollIntervalId = null
  }
}

// --- Autosave & restore ---
const AUTOSAVE_KEY = 'vue_chess_autosave'
const restoredWhiteSeconds = ref(null)
const restoredBlackSeconds = ref(null)
const sessionLost = ref(false)
const hasSavedGame = computed(() => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    return Array.isArray(data?.moves) && data.moves.length > 0
  } catch (_) { return false }
})

const whiteSecondsSaved = ref(null)
const blackSecondsSaved = ref(null)
const onTimesUpdate = ({ white, black }) => {
  whiteSecondsSaved.value = white
  blackSecondsSaved.value = black
  saveAuto()
}

const saveAuto = () => {
  try {
    const moves = gameState.value?.move_history?.map(m => ({
      from: m.from,
      to: m.to,
      promotion: m.promotion,
      notation: m.notation
    })) || []
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      moves,
      aiLevel: aiLevel.value,
      hintsEnabled: hintsEnabled.value,
      timeControl: timeControl.value,
      customMinutes: customMinutes.value,
      customIncrement: customIncrement.value,
      playerColor: playerColor.value,
      playerName: playerName.value,
      useTimers: useTimers.value,
  boardOrientation: boardOrientation.value,
      whiteSeconds: whiteSecondsSaved.value,
      blackSeconds: blackSecondsSaved.value
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload))
  } catch (e) {
    // ignore
  }
}

const loadAuto = () => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (_) { return null }
}

const restoreFromSaved = async () => {
  const data = loadAuto()
  if (!data || !Array.isArray(data.moves) || data.moves.length === 0) return
  await restoreFromData(data)
}

const restoreFromData = async (data) => {
  if (!data || !Array.isArray(data.moves) || data.moves.length === 0) return
  isLoading.value = true
  error.value = 'Restoring saved game...'
  try {
    // Apply settings
    aiLevel.value = data.aiLevel || aiLevel.value
    hintsEnabled.value = data.hintsEnabled ?? hintsEnabled.value
    timeControl.value = data.timeControl || timeControl.value
    customMinutes.value = data.customMinutes ?? customMinutes.value
    customIncrement.value = data.customIncrement ?? customIncrement.value
    playerColor.value = data.playerColor || playerColor.value
    playerName.value = data.playerName || playerName.value
    useTimers.value = data.useTimers ?? useTimers.value
    boardOrientation.value = data.boardOrientation || data.playerColor || boardOrientation.value
    restoredWhiteSeconds.value = data.whiteSeconds ?? null
    restoredBlackSeconds.value = data.blackSeconds ?? null

    // Create new game
    const response = await fetchWithRetry(`${API_BASE}/api/games`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ai_color: aiPlaysColor.value }) })
    if (!response.ok) throw new Error('Failed to create game for restore')
    const newGame = await response.json()
    gameId.value = newGame.id

    // Replay moves
    for (const m of data.moves) {
      const body = m.notation ? { notation: m.notation } : { from: m.from, to: m.to, promotion: m.promotion }
      const moveResp = await fetchWithRetry(`${API_BASE}/api/games/${gameId.value}/moves`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (!moveResp.ok) throw new Error('Failed to replay a move during restore')
    }
    await fetchGameState()
    sessionLost.value = false
    error.value = '✅ Game restored from history'
    setTimeout(() => { if (error.value?.includes('restored')) error.value = '' }, 2500)
    saveAuto()
  } catch (e) {
    error.value = `Failed to restore: ${e.message}`
  } finally {
    isLoading.value = false
  }
}

// Persist on settings changes
watch([aiLevel, hintsEnabled, timeControl, customMinutes, customIncrement, playerColor, playerName, useTimers, boardOrientation], () => {
  saveAuto()
  saveSettingsCookie()
})

// Orientation is user-controlled via Flip; keep decoupled from playerColor

// --- Flip & Saves helpers ---
const flipBoard = () => {
  boardOrientation.value = boardOrientation.value === 'white' ? 'black' : 'white'
}

const SLOT_KEYS = ['vue_chess_slot_1', 'vue_chess_slot_2', 'vue_chess_slot_3']
const getSlotKey = (slot) => SLOT_KEYS[slot - 1]
const hasSlot = (slot) => {
  try { return !!localStorage.getItem(getSlotKey(slot)) } catch { return false }
}
const getSlotLabel = (slot) => {
  try {
    const raw = localStorage.getItem(getSlotKey(slot))
    if (!raw) return 'Empty'
    const d = JSON.parse(raw)
    const moves = (d.moves?.length || 0)
    const when = d.savedAt ? new Date(d.savedAt).toLocaleString() : 'unknown time'
    return `${moves} moves • ${when}`
  } catch { return 'Empty' }
}
const canSave = computed(() => !!gameState.value && (gameState.value.move_history?.length || 0) >= 0)
const buildSavePayload = () => {
  const moves = gameState.value?.move_history?.map(m => ({
    from: m.from, to: m.to, promotion: m.promotion, notation: m.notation
  })) || []
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    moves,
    aiLevel: aiLevel.value,
    hintsEnabled: hintsEnabled.value,
    timeControl: timeControl.value,
    customMinutes: customMinutes.value,
    customIncrement: customIncrement.value,
    playerColor: playerColor.value,
    playerName: playerName.value,
    useTimers: useTimers.value,
    boardOrientation: boardOrientation.value,
    whiteSeconds: whiteSecondsSaved.value,
    blackSeconds: blackSecondsSaved.value
  }
}
const saveToSlot = (slot) => {
  try {
    const payload = buildSavePayload()
    localStorage.setItem(getSlotKey(slot), JSON.stringify(payload))
    error.value = `✅ Saved to slot ${slot}`
    setTimeout(() => { if (error.value?.includes('Saved to slot')) error.value = '' }, 2000)
  } catch (e) {
    error.value = `Failed to save slot ${slot}: ${e.message}`
  }
}
const loadFromSlot = async (slot) => {
  try {
    const raw = localStorage.getItem(getSlotKey(slot))
    if (!raw) return
    const data = JSON.parse(raw)
    await restoreFromData(data)
  } catch (e) {
    error.value = `Failed to load slot ${slot}: ${e.message}`
  }
}
const deleteSlot = (slot) => {
  try {
    localStorage.removeItem(getSlotKey(slot))
    error.value = `🗑️ Deleted slot ${slot}`
    setTimeout(() => { if (error.value?.includes('Deleted slot')) error.value = '' }, 1500)
  } catch (e) {
    error.value = `Failed to delete slot ${slot}: ${e.message}`
  }
}
</script>

<style scoped>
/* Keep only component-specific helpers; global layout/board/chat/buttons come from shared CSS */
/* Message styling and spacing come from shared/styles/common.css */
/* Hint styles to complement shared board styles */
.square.hint-from { outline: 2px solid var(--color-success); outline-offset: -2px; }
.square.hint-to { outline: 2px solid var(--color-warning); outline-offset: -2px; }
.card { margin: 20px 0; }
.chess-board { margin-top: 20px; }
#player-name {
  background: var(--color-bg-surface);
  color: var(--color-text-field, #000);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: .5rem .75rem;
  font-size: .875rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
</style>
