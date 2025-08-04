import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './styles/common.css'
import './styles/header.css'
import './App.css'

const API_BASE = 'http://localhost:8080'

// Piece symbols mapping
const pieceSymbols = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
}

function App() {
  // State management
  const [gameId, setGameId] = useState('')
  const [gameState, setGameState] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const [error, setError] = useState('')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [hintFrom, setHintFrom] = useState(null)
  const [hintTo, setHintTo] = useState(null)

  // Computed values
  const currentPlayer = useMemo(() => gameState?.active_color || 'white', [gameState])
  const gameStatus = useMemo(() => gameState?.status || '', [gameState])

  const canUndo = useMemo(() => {
    const hasGameState = !!gameState
    const hasMovesToUndo = gameState?.move_history && gameState.move_history.length > 0
    // Accept any status that indicates the game is still playable
    const gameNotFinished = !gameStatus ||
                           gameStatus === 'active' ||
                           gameStatus === '' ||
                           gameStatus === 'in_progress' ||
                           gameStatus === 'ongoing'
    const notAITurn = currentPlayer === 'white'
    const notProcessing = !isLoading && !isAIThinking && !isUndoing

    return hasGameState && hasMovesToUndo && gameNotFinished && notAITurn && notProcessing
  }, [gameState, gameStatus, currentPlayer, isLoading, isAIThinking, isUndoing])

  const boardSquares = useMemo(() => {
    if (!gameState?.board) {
      return Array(64).fill({ piece: null })
    }

    const squares = []
    const boardLines = gameState.board.split('\n')

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
  }, [gameState])

  // API methods
  const createGame = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to create game')

      const data = await response.json()
      setGameId(data.id)
      setGameState(data)
    } catch (err) {
      setError(`Unable to create game. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchGameState = useCallback(async () => {
    if (!gameId) return

    try {
      const response = await fetch(`${API_BASE}/api/games/${gameId}`)
      if (!response.ok) {
        if (response.status === 404) {
          // Game not found - backend might have restarted
          setError('Game session lost. Please create a new game.')
          resetGame()
          return
        }
        throw new Error('Failed to fetch game state')
      }

      const data = await response.json()
      if (data.error === 'game_not_found') {
        setError('Game session lost. Please create a new game.')
        resetGame()
        return
      }

      setGameState(data)
      setError('')
    } catch (err) {
      // Check if this is a network error (backend down/restarted)
      if (err.message.includes('ERR_EMPTY_RESPONSE') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Game session lost. Please create a new game.')
        resetGame()
      } else {
        setError(`Unable to load game. Please try again.`)
      }
    }
  }, [gameId])

  // Helper function to get piece at square
  const getPieceAtSquare = useCallback((square, gameState) => {
    if (!gameState?.board) return null

    const boardLines = gameState.board.split('\n')

    // Parse the board to find the piece at the given square
    for (let i = 1; i <= 8; i++) {
      const line = boardLines[i]
      if (line) {
        const lineParts = line.split(' ')
        for (let j = 0; j < 8; j++) {
          const file = String.fromCharCode(97 + j) // a-h
          const rank = 9 - i // 8-1
          const position = file + rank
          if (position === square) {
            const piece = lineParts[j + 1] // Skip rank number
            return piece === '.' ? null : piece
          }
        }
      }
    }
    return null
  }, [])

  // Helper function to check if move is pawn promotion
  const isPawnPromotion = useCallback((from, to, gameState) => {
    const piece = getPieceAtSquare(from, gameState)
    if (!piece || (piece.toLowerCase() !== 'p')) return false

    const toRank = parseInt(to[1])
    return (piece === 'P' && toRank === 8) || (piece === 'p' && toRank === 1)
  }, [getPieceAtSquare])

  // Helper function to show promotion dialog
  const getPromotionChoice = useCallback(() => {
    return new Promise((resolve) => {
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
  }, [])

  const makeMove = useCallback(async (from, to) => {
    if (!gameId) return

    setIsLoading(true)
    setError('')

    try {
      let movePayload = { from, to }

      // First, check if this is a special move like castling or promotion
      const currentBoard = gameState?.board

      // Check for pawn promotion
      if (isPawnPromotion(from, to, gameState)) {
        const promotionPiece = await getPromotionChoice()
        if (!promotionPiece) {
          setIsLoading(false)
          return // User cancelled promotion
        }
        movePayload = { from, to, promotion: promotionPiece }
      } else {
        // Check if this might be a castling move by getting legal moves
        try {
          const legalResponse = await fetch(`${API_BASE}/api/games/${gameId}/legal-moves`)
          if (legalResponse.ok) {
            const legalMoves = await legalResponse.json()
            // Check if this is a castling move
            const castlingMove = legalMoves.legal_moves?.find(move =>
              move.from === from && move.to === to && move.type === 'castling')

            if (castlingMove) {
              movePayload = { notation: castlingMove.notation }
            }
          } else if (legalResponse.status === 404) {
            // Game not found - backend might have restarted
            setError('Game session lost. Please create a new game.')
            resetGame()
            return
          }
        } catch (legalErr) {
          // Check if this is a network error (backend down/restarted)
          if (legalErr.message.includes('ERR_EMPTY_RESPONSE') || legalErr.message.includes('Failed to fetch') || legalErr.name === 'TypeError') {
            setError('Game session lost. Please create a new game.')
            resetGame()
            return
          }
          // Silently handle legal moves fetch failure for castling check
        }
      }

      const response = await fetch(`${API_BASE}/api/games/${gameId}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movePayload)
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Game not found - backend might have restarted
          setError('Game session lost. Please create a new game.')
          resetGame()
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to make move')
      }

      const data = await response.json()
      setGameState(data)

      // Clear hints and selection
      setHintFrom(null)
      setHintTo(null)
      setSelectedSquare(null)

      // If it's AI's turn, get AI move with a small delay to ensure state is updated
      if (data.active_color === 'black' && (data.status === 'in_progress' || data.status === 'check')) {
        setTimeout(() => {
          // Call getAIMove without adding it to dependencies to avoid circular reference
          setIsAIThinking(true)
          setError('')

          fetch(`${API_BASE}/api/games/${gameId}/ai-move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => {
            if (!response.ok) {
              if (response.status === 404) {
                // Game not found - backend might have restarted
                setError('Game session lost. Please create a new game.')
                resetGame()
                return Promise.reject(new Error('Game session lost'))
              }
              return response.json().then(errorData => {
                throw new Error(errorData.error || 'Failed to get AI move')
              })
            }
            // AI move endpoint returns move metadata, not game state
            // So we need to fetch the updated game state separately
            return fetch(`${API_BASE}/api/games/${gameId}`)
          })
          .then(response => {
            if (!response.ok) {
              if (response.status === 404) {
                // Game not found - backend might have restarted
                setError('Game session lost. Please create a new game.')
                resetGame()
                return Promise.reject(new Error('Game session lost'))
              }
              throw new Error('Failed to fetch game state')
            }
            return response.json()
          })
          .then(data => {
            setGameState(data)
            setError('')
          })
          .catch(err => {
            // Check if this is a network error (backend down/restarted)
            if (err.message.includes('ERR_EMPTY_RESPONSE') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
              setError('Game session lost. Please create a new game.')
              resetGame()
            } else {
              setError(`AI move failed: ${err.message}`)
            }
          })
          .finally(() => {
            setIsAIThinking(false)
          })
        }, 100) // Small delay to ensure state is properly updated
      }
    } catch (err) {
      // Check if this is a network error (backend down/restarted)
      if (err.message.includes('ERR_EMPTY_RESPONSE') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Game session lost. Please create a new game.')
        resetGame()
      } else {
        setError(`Unable to make move. Please try again.`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [gameId, gameState, isPawnPromotion, getPromotionChoice])

  const getAIMove = useCallback(async () => {
    if (!gameId) return

    setIsAIThinking(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/games/${gameId}/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI move')
      }

      // AI move endpoint returns move metadata, not game state
      // So we need to fetch the updated game state separately
      await fetchGameState()
    } catch (err) {
      setError(`AI move failed: ${err.message}`)
    } finally {
      setIsAIThinking(false)
    }
  }, [gameId, fetchGameState])

  const undoMove = useCallback(async () => {
    if (!gameId || !canUndo) return

    setIsUndoing(true)
    setError('Undoing last move...')

    try {
      // Create a new game with same initial state
      const newGameResponse = await fetch(`${API_BASE}/api/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!newGameResponse.ok) throw new Error('Failed to create new game for undo')

      const newGameData = await newGameResponse.json()
      const newGameId = newGameData.id

      // Get the moves to replay (all except last 2: player's move + AI response)
      const movesToReplay = gameState.move_history.slice(0, -2)

      // Replay moves if there are any
      if (movesToReplay.length > 0) {
        for (const move of movesToReplay) {
          const moveResponse = await fetch(`${API_BASE}/api/games/${newGameId}/moves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: move.from, to: move.to })
          })

          if (!moveResponse.ok) {
            const errorData = await moveResponse.json()
            throw new Error(errorData.error || 'Failed to replay move during undo')
          }
        }
      }

      // Update to the new game - set ID first, then fetch the complete state
      setGameId(newGameId)

      // Always fetch the final game state (whether moves were replayed or not)
      const finalResponse = await fetch(`${API_BASE}/api/games/${newGameId}`)
      if (!finalResponse.ok) throw new Error('Failed to fetch final game state after undo')

      const finalGameState = await finalResponse.json()
      setGameState(finalGameState)

      // Clear any selections or hints
      setSelectedSquare(null)
      setHintFrom(null)
      setHintTo(null)

      setError('✅ Move undone successfully')

      // Clear the success message after 3 seconds
      setTimeout(() => {
        setError(prev => prev === '✅ Move undone successfully' ? '' : prev)
      }, 3000)

    } catch (err) {
      setError(`Undo failed: ${err.message}`)
    } finally {
      setIsUndoing(false)
    }
  }, [gameId, canUndo, gameState])

  const getAIHint = useCallback(async () => {
    if (!gameId || currentPlayer !== 'white') return

    setIsAIThinking(true)
    setError('')

    try {
      // Clear previous hints
      setHintFrom(null)
      setHintTo(null)

      // Check if it's our turn (white)
      if (currentPlayer !== 'white') {
        setError('Hints are only available on your turn')
        return
      }

      // Get legal moves for the current position to provide hints
      const legalMovesResponse = await fetch(`${API_BASE}/api/games/${gameId}/legal-moves`)

      if (!legalMovesResponse.ok) {
        if (legalMovesResponse.status === 404) {
          // Game not found - backend might have restarted
          setError('Game session lost. Please create a new game.')
          resetGame()
          return
        }
        throw new Error(`Failed to get legal moves: ${legalMovesResponse.status}`)
      }

      const legalMoves = await legalMovesResponse.json()

      if (!legalMoves.legal_moves || legalMoves.legal_moves.length === 0) {
        setError('No legal moves available')
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
        setError(`💡 AI Hint: Try ${notation}`)

        // Highlight the suggested move
        setHintFrom(suggestedMove.from)
        setHintTo(suggestedMove.to)

        // Clear hints after 5 seconds
        setTimeout(() => {
          setHintFrom(null)
          setHintTo(null)
        }, 5000)

      } else {
        setError('No moves to suggest')
      }

    } catch (err) {
      // Check if this is a network error (backend down/restarted)
      if (err.message.includes('ERR_EMPTY_RESPONSE') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Game session lost. Please create a new game.')
        resetGame()
      } else {
        setError(`Unable to get hint. Please try again.`)
      }
    } finally {
      setIsAIThinking(false)
    }
  }, [gameId, currentPlayer])

  const resetGame = useCallback(() => {
    setGameId('')
    setGameState(null)
    setSelectedSquare(null)
    setHintFrom(null)
    setHintTo(null)
    setError('')
  }, [])

  // Event handlers
  const handleSquareClick = useCallback((index) => {
    const square = boardSquares[index]

    if (!gameId || currentPlayer !== 'white' || isLoading || isAIThinking) {
      return
    }

    // Clear hints when clicking on board
    setHintFrom(null)
    setHintTo(null)

    if (selectedSquare === null) {
      // First click - select a piece
      if (square.piece && isWhitePiece(square.piece)) {
        setSelectedSquare(index)
      }
    } else {
      // Second click - try to move or select different piece
      const fromSquare = boardSquares[selectedSquare]

      if (index === selectedSquare) {
        // Clicking same square - deselect
        setSelectedSquare(null)
      } else if (square.piece && isWhitePiece(square.piece)) {
        // Clicking another white piece - select it instead
        setSelectedSquare(index)
      } else {
        // Try to make a move
        makeMove(fromSquare.position, square.position)
      }
    }
  }, [boardSquares, gameId, currentPlayer, isLoading, isAIThinking, selectedSquare, makeMove])

  // Helper functions
  const isWhitePiece = (piece) => {
    return piece && piece === piece.toUpperCase()
  }

  const getSquareClass = (square, index) => {
    const classes = ['square']

    // Light/dark squares
    const isLight = (square.rank + square.file) % 2 === 0
    classes.push(isLight ? 'light' : 'dark')

    // Selected square
    if (selectedSquare === index) {
      classes.push('selected')
    }

    // Hint highlighting
    if (square.position === hintFrom) {
      classes.push('hint-from')
    }
    if (square.position === hintTo) {
      classes.push('hint-to')
    }

    return classes.join(' ')
  }

  const getPieceClass = (piece) => {
    const classes = ['piece']
    classes.push(isWhitePiece(piece) ? 'white' : 'black')
    return classes.join(' ')
  }

  const getPieceSymbol = (piece) => {
    return pieceSymbols[piece] || piece
  }

  const getMessageClass = (message) => {
    if (message.includes('success') || message.includes('hint') || message.includes('✅')) {
      return 'message success'
    }
    return 'message error'
  }

  // Initialize game on component mount
  useEffect(() => {
    createGame()
  }, [createGame])

  return (
    <div id="app">
      <header className="app-header">
        <div className="header-container">
          <a href="http://localhost:3000" className="header-brand">
            <span className="header-title">♟️ JS Chess</span>
            <span className="header-framework">React.js</span>
          </a>

          <nav className="header-nav">
            <ul className="nav-links">
              <li><a href="http://localhost:3000" className="nav-link">🏠 Home</a></li>
              <li><span className="nav-separator"></span></li>
              <li><a href="http://localhost:3001" className="nav-link">📦 Vanilla</a></li>
              <li><a href="http://localhost:3002" className="nav-link">💙 jQuery</a></li>
              <li><a href="http://localhost:3003" className="nav-link">💚 Vue</a></li>
              <li><a href="http://localhost:3004" className="nav-link active">⚛️ React</a></li>
              <li><a href="http://localhost:3005" className="nav-link">🅰️ Angular</a></li>
            </ul>

            <div className="header-controls">
              <button onClick={resetGame} className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'New Game'}
              </button>
              {gameId && (
                <button
                  onClick={undoMove}
                  disabled={!canUndo}
                  className="btn"
                >
                  {isUndoing ? 'Undoing...' : 'Undo'}
                </button>
              )}
              {gameId && (
                <button
                  onClick={getAIHint}
                  disabled={!gameId || currentPlayer !== 'white' || isLoading || isAIThinking}
                  className="btn"
                >
                  {isAIThinking ? 'Getting Hint...' : 'Hint'}
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <div className="container">

        <main>
          <div className="game-info">
            <h3>Game Status</h3>
            <div className="status">
              <div>Turn: <span>{gameId ? currentPlayer : (isLoading ? 'Loading...' : '-')}</span></div>
              <div>Status: <span>{gameId ? gameStatus || 'Active' : (isLoading ? 'Creating Game...' : 'No Game')}</span></div>
              <div>Move: <span>{gameId ? (gameState?.move_count || 1) : '-'}</span></div>
            </div>
          </div>

          <div className="chess-board" id="chessBoard">
            {boardSquares.map((square, index) => (
              <div
                key={index}
                className={getSquareClass(square, index)}
                onClick={() => handleSquareClick(index)}
              >
                {square.piece && (
                  <span className={getPieceClass(square.piece)}>
                    {getPieceSymbol(square.piece)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="move-history">
            <h3>📜 Move History</h3>
            <div className="moves">
              {(!gameId || !gameState?.move_history?.length) ? (
                <div className="move-item">
                  <span className="move-number">-</span>
                  <span className="move-notation">{gameId ? 'Game started' : 'No game active'}</span>
                </div>
              ) : (
                gameState.move_history.map((move, index) => (
                  <div key={index} className="move-item">
                    <span className="move-number">{index + 1}</span>
                    <span className="move-notation">{move.from}-{move.to}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        {error && (
          <div className={getMessageClass(error)}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
