# API Integration Guide

This guide explains how to integrate with the go-chess backend API across different frontend frameworks.

## API Overview

The go-chess backend provides a comprehensive RESTful API for chess game management, AI opponents, and real-time features.

**Base URL**: `http://localhost:8080`
**WebSocket**: `ws://localhost:8080`

## Authentication

Currently, the API does not require authentication for development. In production, you may want to implement API keys or JWT tokens.

## Core API Endpoints

### Game Management

#### Create a New Game
```http
POST /api/games
```

**Response:**
```json
{
  "id": "game-uuid",
  "board": [["r","n","b","q","k","b","n","r"], ...],
  "currentPlayer": "white",
  "isCheck": false,
  "isCheckmate": false,
  "moveHistory": [],
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
}
```

#### Get Game State
```http
GET /api/games/{gameId}
```

#### Delete Game
```http
DELETE /api/games/{gameId}
```

### Making Moves

#### Make a Move
```http
POST /api/games/{gameId}/moves
Content-Type: application/json

{
  "from": "e2",
  "to": "e4",
  "promotion": "Q"  // Optional, for pawn promotion
}
```

**Response:**
```json
{
  "move": {
    "from": "e2",
    "to": "e4",
    "piece": "P",
    "notation": "e4",
    "isCheck": false,
    "isCheckmate": false
  },
  "gameState": { /* Updated game state */ }
}
```

#### Get Move History
```http
GET /api/games/{gameId}/moves
```

### AI Integration

#### Get AI Move (Traditional)
```http
POST /api/games/{gameId}/ai-move
Content-Type: application/json

{
  "engine": "minimax",
  "difficulty": "medium"
}
```

**Available Engines:**
- `random` - Random move selection
- `minimax` - Classic minimax algorithm
- `alphabeta` - Alpha-beta pruning
- `llm` - LLM-powered AI

**Difficulty Levels:**
- `beginner`, `easy`, `medium`, `hard`, `expert`

#### Get LLM AI Move
```http
POST /api/games/{gameId}/ai-move
Content-Type: application/json

{
  "engine": "llm",
  "provider": "openai",
  "level": "expert"
}
```

**LLM Providers:**
- `openai` - GPT-4
- `anthropic` - Claude
- `google` - Gemini
- `xai` - Grok
- `deepseek` - DeepSeek

### LLM AI Features

#### Chat with AI
```http
POST /api/games/{gameId}/chat
Content-Type: application/json

{
  "message": "What do you think about my opening?",
  "provider": "openai"
}
```

#### Get AI Reaction
```http
POST /api/games/{gameId}/react
Content-Type: application/json

{
  "move": "Qh5",
  "provider": "anthropic"
}
```

### Game Analysis

#### Get Position Analysis
```http
GET /api/games/{gameId}/analysis
```

#### Get Legal Moves
```http
GET /api/games/{gameId}/legal-moves
```

#### Load Position from FEN
```http
POST /api/games/{gameId}/fen
Content-Type: application/json

{
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
}
```

## WebSocket Integration

### Connecting to WebSocket

```javascript
const gameId = 'your-game-id';
const ws = new WebSocket(`ws://localhost:8080/ws/games/${gameId}`);

ws.onopen = function() {
    console.log('Connected to game');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    handleGameUpdate(data);
};
```

### WebSocket Message Types

#### Game Update
```json
{
  "type": "game_update",
  "data": {
    "gameState": { /* Current game state */ },
    "lastMove": { /* Last move made */ }
  }
}
```

#### Move Made
```json
{
  "type": "move",
  "data": {
    "move": { /* Move details */ },
    "gameState": { /* Updated state */ }
  }
}
```

#### Game Over
```json
{
  "type": "game_over",
  "data": {
    "winner": "white",
    "reason": "checkmate",
    "gameState": { /* Final state */ }
  }
}
```

## Framework-Specific Integration

### Vanilla JavaScript

```javascript
// Using the shared API client
const api = new ChessAPI('http://localhost:8080', 'ws://localhost:8080');

// Create game
const game = await api.createGame();

// Make move
await api.makeMove('e2', 'e4');

// Connect WebSocket
api.connectWebSocket();
api.on('game:move', (data) => {
    updateBoard(data.gameState.board);
});
```

### jQuery

```javascript
// Traditional jQuery approach
$.post('/api/games', function(game) {
    currentGameId = game.id;
    renderBoard(game.board);
});

// Make move
$('#chess-board').on('click', '.square', function() {
    const move = {
        from: selectedSquare,
        to: $(this).data('square')
    };

    $.post(`/api/games/${currentGameId}/moves`, move)
        .done(function(response) {
            renderBoard(response.gameState.board);
        });
});
```

### Vue.js

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { ChessAPI } from '@/shared/api/chess-api'

const api = new ChessAPI()
const gameState = ref(null)

onMounted(async () => {
  const game = await api.createGame()
  gameState.value = game

  api.connectWebSocket()
  api.on('game:update', (data) => {
    gameState.value = data.gameState
  })
})

const makeMove = async (from, to) => {
  await api.makeMove(from, to)
}
</script>
```

### React

```jsx
import { useState, useEffect } from 'react'
import { ChessAPI } from '../shared/api/chess-api'

function ChessGame() {
  const [gameState, setGameState] = useState(null)
  const [api] = useState(() => new ChessAPI())

  useEffect(() => {
    const initGame = async () => {
      const game = await api.createGame()
      setGameState(game)

      api.connectWebSocket()
      api.on('game:update', (data) => {
        setGameState(data.gameState)
      })
    }

    initGame()

    return () => api.disconnectWebSocket()
  }, [api])

  const handleMove = async (from, to) => {
    await api.makeMove(from, to)
  }

  return <ChessBoard gameState={gameState} onMove={handleMove} />
}
```

### Angular

```typescript
import { Injectable } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { ChessAPI } from '../shared/api/chess-api'

@Injectable({
  providedIn: 'root'
})
export class ChessService {
  private api = new ChessAPI()
  private gameStateSubject = new BehaviorSubject(null)

  gameState$: Observable<any> = this.gameStateSubject.asObservable()

  async createGame() {
    const game = await this.api.createGame()
    this.gameStateSubject.next(game)

    this.api.connectWebSocket()
    this.api.on('game:update', (data) => {
      this.gameStateSubject.next(data.gameState)
    })
  }

  async makeMove(from: string, to: string) {
    await this.api.makeMove(from, to)
  }
}
```

## Error Handling

### Common Error Responses

```json
{
  "error": "Invalid move",
  "code": 400,
  "details": "The move e2-e5 is not legal in the current position"
}
```

### Error Codes
- `400` - Bad Request (invalid move, malformed data)
- `404` - Game not found
- `409` - Conflict (game already ended)
- `500` - Internal server error

### Handling Errors

```javascript
try {
  await api.makeMove('e2', 'e5')
} catch (error) {
  if (error.status === 400) {
    showError('Invalid move: ' + error.message)
  } else if (error.status === 404) {
    showError('Game not found')
  } else {
    showError('Something went wrong')
  }
}
```

## Rate Limiting

The API implements rate limiting:
- **Games**: 10 new games per minute
- **Moves**: 60 moves per minute
- **AI requests**: 20 requests per minute
- **Chat**: 10 messages per minute

## Best Practices

1. **Reuse API clients**: Create one instance per application
2. **Handle WebSocket disconnections**: Implement reconnection logic
3. **Cache game state**: Store locally to reduce API calls
4. **Validate moves client-side**: Check basic rules before API call
5. **Handle errors gracefully**: Provide user-friendly error messages
6. **Use TypeScript**: Leverage the typed API client for better DX

## Environment Configuration

```bash
# .env file
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080

# Production
VITE_API_URL=https://api.yourchess.com
VITE_WS_URL=wss://api.yourchess.com
```

## Testing the API

### Using curl

```bash
# Create game
curl -X POST http://localhost:8080/api/games

# Make move
curl -X POST http://localhost:8080/api/games/{gameId}/moves \
  -H "Content-Type: application/json" \
  -d '{"from": "e2", "to": "e4"}'

# Get AI move
curl -X POST http://localhost:8080/api/games/{gameId}/ai-move \
  -H "Content-Type: application/json" \
  -d '{"engine": "minimax", "difficulty": "medium"}'
```

### Using the Browser

Visit `http://localhost:8080/health` to check if the API is running.

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure backend allows your frontend origin
2. **WebSocket connection fails**: Check firewall and proxy settings
3. **API not responding**: Verify backend is running on port 8080
4. **Invalid moves**: Check move format (e.g., "e2" not "E2")

### Debug Mode

Enable debug logging in the API client:

```javascript
const api = new ChessAPI('http://localhost:8080', 'ws://localhost:8080')
api.debug = true // Logs all API calls
```
