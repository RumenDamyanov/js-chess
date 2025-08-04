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
            <li><a href="http://localhost:3000" class="nav-link">🏠 Home</a></li>
            <li><span class="nav-separator"></span></li>
            <li><a href="http://localhost:3001" class="nav-link">📦 Vanilla</a></li>
            <li><a href="http://localhost:3002" class="nav-link">💙 jQuery</a></li>
            <li><a href="http://localhost:3003" class="nav-link active">💚 Vue</a></li>
            <li><a href="http://localhost:3004" class="nav-link">⚛️ React</a></li>
            <li><a href="http://localhost:3005" class="nav-link">🅰️ Angular</a></li>
          </ul>

          <div class="header-controls">
            <button @click="resetGame" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Creating...' : 'New Game' }}
            </button>
            <button
              @click="undoMove"
              :disabled="!canUndo"
              class="btn"
              v-if="gameId"
            >
              {{ isUndoing ? 'Undoing...' : 'Undo' }}
            </button>
            <button
              @click="getAIHint"
              :disabled="!gameId || currentPlayer !== 'white' || isLoading || isAIThinking"
              class="btn"
              v-if="gameId"
            >
              {{ isAIThinking ? 'Getting Hint...' : 'Hint' }}
            </button>
          </div>
        </nav>
      </div>
    </header>

    <div class="container">

      <main>
        <div class="game-info">
          <h3>Game Status</h3>
          <div class="status">
            <div>Turn: <span>{{ gameId ? currentPlayer : (isLoading ? 'Loading...' : '-') }}</span></div>
            <div>Status: <span>{{ gameId ? gameStatus || 'Active' : (isLoading ? 'Creating Game...' : 'No Game') }}</span></div>
            <div>Move: <span>{{ gameId ? (gameState?.move_count || 1) : '-' }}</span></div>
          </div>
        </div>

        <div class="chess-board" id="chessBoard">
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

        <div class="move-history">
          <h3>📜 Move History</h3>
          <div class="moves">
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
              <span class="move-notation">{{ move.from }}-{{ move.to }}</span>
            </div>
          </div>
        </div>
      </main>

      <div v-if="error" :class="getMessageClass(error)">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

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

// API base URL
const API_BASE = 'http://localhost:8080'

// Computed properties
const currentPlayer = computed(() => gameState.value?.active_color || 'white')
const gameStatus = computed(() => gameState.value?.status || '')

const canUndo = computed(() => {
  const hasGameState = !!gameState.value
  const hasMovesToUndo = gameState.value?.move_history && gameState.value.move_history.length > 0
  // Accept any status that indicates the game is still playable
  const gameNotFinished = !gameStatus.value ||
                         gameStatus.value === 'active' ||
                         gameStatus.value === '' ||
                         gameStatus.value === 'in_progress' ||
                         gameStatus.value === 'ongoing'
  const notAITurn = currentPlayer.value === 'white'
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

// Piece symbols mapping
const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
}

// Methods
const createGame = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) throw new Error('Failed to create game')

    const data = await response.json()
    gameId.value = data.id
    gameState.value = data
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
    selectedSquare.value = null

    // Check if it's AI's turn (black) and game is still in progress
    if (gameState.value?.active_color === 'black' &&
        (gameState.value?.status === 'in_progress' || gameState.value?.status === 'check')) {
      // It's black's turn - make an AI move automatically
      setTimeout(() => makeAIMove(), 1000) // Small delay for better UX
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
  error.value = ''

  try {
    // Clear previous hints
    hintFrom.value = null
    hintTo.value = null

    // Check if it's our turn (white)
    if (currentPlayer.value !== 'white') {
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
  }
}

const makeAIMove = async () => {
  if (!gameId.value) return

  isAIThinking.value = true
  error.value = ''

  try {
    // Make AI move for black player using the backend AI endpoint
    const aiResponse = await fetch(`${API_BASE}/api/games/${gameId.value}/ai-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'hard',
        engine: 'minimax'
      })
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 404) {
        error.value = 'Game session lost. Please create a new game.'
        resetGame()
        return
      }
      const errorData = await aiResponse.json()
      if (errorData.error === 'game_not_found') {
        error.value = 'Game session lost. Please create a new game.'
        resetGame()
        return
      }
      throw new Error(errorData.error || 'Failed to make AI move')
    }

    const data = await aiResponse.json()

    if (data.move) {
      // AI move was successful, refresh the game state
      await fetchGameState()

      const move = data.move
      const notation = data.notation || `${move.from} → ${move.to}`

      // Clear any previous errors
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

const undoMove = async () => {
  if (!gameState.value || !gameState.value.move_history || gameState.value.move_history.length === 0) {
    error.value = 'No moves to undo'
    return
  }

  if (isAIThinking.value) {
    error.value = 'Cannot undo while AI is thinking'
    return
  }

  if (currentPlayer.value !== 'white') {
    error.value = 'Cannot undo during AI turn'
    return
  }

  isUndoing.value = true
  error.value = ''

  try {
    error.value = 'Undoing last move...'

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
  }
}

const getMessageClass = (message) => {
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('hint') || lowerMessage.includes('try')) {
    return 'message message-success'
  }
  return 'message message-error'
}

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
})
</script>

<style scoped>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  min-height: 100vh;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
  background: linear-gradient(45deg, #2c3e50, #4a6741);
  color: white;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

header h1 {
  margin: 0 0 20px 0;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #f39c12, #e74c3c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
  flex-wrap: wrap;
}

/* Main game area */
main {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 30px;
  align-items: start;
  max-width: 1000px;
  margin: 0 auto;
}

.game-info {
  padding: 20px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #dee2e6;
}

.game-info h3 {
  margin-top: 0;
  color: #2c3e50;
  text-align: center;
  font-size: 1.2em;
  margin-bottom: 15px;
}

.status {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status > div {
  padding: 8px 12px;
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.status > div:first-child {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
}

.status > div:nth-child(2) {
  background: linear-gradient(45deg, #2196F3, #1976D2);
  color: white;
}

.status > div:last-child {
  background: linear-gradient(45deg, #FF9800, #F57C00);
  color: white;
}

/* Chess Board Styles */
.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 60px);
  grid-template-rows: repeat(8, 60px);
  gap: 0;
  border: 3px solid #2c3e50;
  border-radius: 8px;
  margin: 20px auto;
  width: fit-content;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  position: relative;
  background: #2c3e50;
  padding: 2px;
}

.square {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.square.light {
  background: linear-gradient(145deg, #f0d9b5, #f5e4c7);
}

.square.dark {
  background: linear-gradient(145deg, #b58863, #a67c52);
}

.square:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 4px 15px rgba(157, 214, 89, 0.6);
  background: linear-gradient(145deg, #9fd659, #8bc34a) !important;
}

.square.selected {
  background: linear-gradient(145deg, #ffd700, #ffed4e) !important;
  box-shadow: inset 0 0 0 3px #ff6b6b, 0 0 20px rgba(255, 215, 0, 0.8);
  transform: scale(1.1);
  z-index: 15;
}

.square.hint-from {
  background-color: #4CAF50 !important;
  box-shadow: inset 0 0 0 3px #2E7D32;
  animation: pulse-from 2s infinite;
}

.square.hint-to {
  background-color: #FF9800 !important;
  box-shadow: inset 0 0 0 3px #F57C00;
  animation: pulse-to 2s infinite;
  position: relative;
}

.square.hint-to::after {
  content: '⭐';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  animation: star-twinkle 1.5s infinite;
  z-index: 10;
}

.empty-board {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 480px;
  height: 480px;
  margin: 20px auto;
  border: 3px solid #2c3e50;
  border-radius: 8px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.empty-board-message {
  text-align: center;
  color: #2c3e50;
}

.empty-board-message h3 {
  font-size: 2em;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #f39c12, #e74c3c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-board-message p {
  font-size: 1.2em;
  opacity: 0.8;
}

.piece {
  font-size: 36px;
  line-height: 1;
  user-select: none;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}

/* Move History */
.move-history {
  padding: 20px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #dee2e6;
}

.move-history h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  text-align: center;
  font-size: 1.2em;
}

.moves {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
  background: white;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.05);
  user-select: text;
}

.moves::-webkit-scrollbar {
  width: 6px;
}

.moves::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.moves::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 3px;
}

.moves::-webkit-scrollbar-thumb:hover {
  background: #0056b3;
}

.move-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 2px;
  transition: all 0.2s ease;
}

.move-item:hover {
  background: linear-gradient(145deg, #e3f2fd, #bbdefb);
  transform: translateX(3px);
}

.move-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.move-number {
  font-weight: bold;
  min-width: 35px;
  color: #2c3e50;
  font-size: 14px;
}

.move-notation {
  flex: 1;
  text-align: center;
  color: #495057;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

/* Button Styles */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, #007bff, #0056b3);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin: 5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #0056b3, #004494);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.btn:disabled {
  background: linear-gradient(145deg, #ccc, #999);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: linear-gradient(145deg, #6c757d, #545b62);
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(145deg, #545b62, #3d4449);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.btn-warning {
  background: linear-gradient(145deg, #ffc107, #e0a800);
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.btn-warning:hover:not(:disabled) {
  background: linear-gradient(145deg, #e0a800, #d39e00);
  box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
}

/* Message Styles */
.message {
  padding: 15px 20px;
  border-radius: 8px;
  margin: 20px auto;
  max-width: 600px;
  text-align: center;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.message-error {
  background: linear-gradient(145deg, #ffebee, #ffcdd2);
  color: #c62828;
  border-left: 4px solid #f44336;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.2);
}

.message-success {
  background: linear-gradient(145deg, #e8f5e8, #c8e6c9);
  color: #2e7d32;
  border-left: 4px solid #4caf50;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2);
}

/* Legacy error class for fallback */
.error {
  background: linear-gradient(145deg, #ffebee, #ffcdd2);
  color: #c62828;
  padding: 15px 20px;
  border-radius: 8px;
  margin: 20px auto;
  border-left: 4px solid #f44336;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.2);
  max-width: 600px;
  text-align: center;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1000px) {
  main {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .container {
    padding: 10px;
  }
}

@media (max-width: 600px) {
  .chess-board {
    grid-template-columns: repeat(8, 40px);
    grid-template-rows: repeat(8, 40px);
  }

  .square {
    width: 40px;
    height: 40px;
  }

  .piece {
    font-size: 24px;
  }

  header h1 {
    font-size: 2rem;
  }

  .game-controls {
    flex-direction: column;
    align-items: center;
  }
}

@keyframes pulse-from {
  0%, 100% {
    box-shadow: inset 0 0 0 3px #2E7D32;
    background-color: #4CAF50;
  }
  50% {
    box-shadow: inset 0 0 0 5px #1B5E20;
    background-color: #66BB6A;
  }
}

@keyframes pulse-to {
  0%, 100% {
    box-shadow: inset 0 0 0 3px #F57C00;
    background-color: #FF9800;
  }
  50% {
    box-shadow: inset 0 0 0 5px #E65100;
    background-color: #FFB74D;
  }
}

@keyframes star-twinkle {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1.2);
  }
}
</style>
