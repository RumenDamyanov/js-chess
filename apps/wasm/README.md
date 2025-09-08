# Chess WebAssembly Demo

This application showcases the native Go chess engine compiled to WebAssembly, running directly in the browser without any JavaScript chess logic. It uses the [go-chess](https://github.com/RumenDamyanov/go-chess) module (`go.rumenx.com/chess`) and is built with the [Ebiten](https://github.com/hajimehoshi/ebiten) 2D game engine.

## Features

- **Native Go Performance**: Direct execution of the Go chess engine via WebAssembly
- **Interactive Chess Board**: Click-based piece selection and movement
- **AI Opponents**: Multiple difficulty levels (Beginner → Expert)
- **Game Modes**: Human vs Human or Human vs AI
- **Position Evaluation**: Real-time chess position analysis
- **Visual Feedback**: Legal move highlighting and last move indication
- **Beautiful Graphics**: High-quality SVG-derived piece images with automatic scaling
- **Responsive Design**: Adapts to different screen sizes and orientations

## Controls

- **Left Click**: Select piece / destination square
- **Spacebar**: Cycle through AI difficulty levels
- **A Key**: Toggle between Human vs Human and Human vs AI modes
- **N Key**: Start a new game
- **E Key**: Evaluate current position (shows score)
- **Esc/Q**: Quit (desktop only)

## Technical Details

### Core Dependencies

- **[go-chess](https://github.com/RumenDamyanov/go-chess)** (`go.rumenx.com/chess`): Complete chess engine with:
  - Full chess rule implementation (castling, en passant, promotion, etc.)
  - AI engine with multiple difficulty levels
  - Position evaluation and move generation
  - Standard Algebraic Notation (SAN) support
- **[Ebiten v2](https://github.com/hajimehoshi/ebiten)**: 2D game engine providing:
  - Cross-platform graphics rendering
  - WebAssembly compilation support
  - Event handling (mouse, keyboard)
  - Image loading and manipulation

### Architecture

This demo compiles the existing Go chess GUI (built with [Ebiten](https://github.com/hajimehoshi/ebiten)) to WebAssembly. The chess logic, AI, and rendering all run as native Go code in the browser.

The application uses a hybrid asset loading approach:

- **WASM Environment**: Loads piece images via HTTP requests from the web server
- **Desktop Environment**: Loads assets from the local file system
- **Fallback**: Vector-based piece rendering if image assets fail to load

### Build Process

1. **SVG to PNG Conversion**: Beautiful SVG piece assets are converted to 80x80 PNG files using `rsvg-convert`
2. **WASM Compilation**: `GOOS=js GOARCH=wasm go build` compiles the Go GUI to WebAssembly
3. **Asset Bundling**: Includes `wasm_exec.js` for Go-WASM runtime support and piece images
4. **Nginx Serving**: Configured with proper MIME types, CORS headers, and security headers for WASM

### Performance

- **First Load**: May take a few seconds to download and initialize the WASM module
- **Runtime**: Near-native performance for chess calculations and AI
- **Memory**: Efficient Go garbage collection within WASM environment

## Development

### Local Build

```bash
# Ensure you have Go 1.23+ installed
# From the backend/go-chess directory
cd backend/go-chess
GOOS=js GOARCH=wasm go build -o chess.wasm ./examples/gui
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
```

### Docker Build

The WASM app is built automatically as part of the main project:

```bash
# From project root
make rebuild
# Or specifically for WASM
docker-compose build chess-wasm
```

### Dependencies

The project uses Go modules with the following key dependencies:

```go
require (
    github.com/hajimehoshi/ebiten/v2 v2.7.7
    go.rumenx.com/chess v1.0.0 // github.com/RumenDamyanov/go-chess
)
```

### Browser Requirements

- Modern browser with WebAssembly support (Chrome 57+, Firefox 52+, Safari 11+)
- JavaScript enabled
- Sufficient memory for WASM module (~10-20MB)

## Differences from JS Demos

Unlike the JavaScript framework demos that implement chess logic in JS and communicate with the Go backend via API, this WASM demo:

- **Complete Engine**: Runs the full `go.rumenx.com/chess` engine locally in the browser
- **No Network Required**: All gameplay, AI, and evaluation happens client-side
- **Native Performance**: Direct access to Go's performance and algorithms
- **Shared Codebase**: Uses the exact same chess engine as the backend API and desktop GUI
- **Advanced AI**: Includes sophisticated position evaluation and move generation algorithms
- **Full Rule Set**: Complete implementation of chess rules including:
  - Castling (kingside and queenside)
  - En passant captures
  - Pawn promotion
  - Check and checkmate detection
  - Stalemate and draw conditions

## Security

The WASM module runs in a sandboxed environment with:

- No file system access
- No network access
- Isolated memory space
- Cross-Origin security headers

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome  | 57+     | Full support |
| Firefox | 52+     | Full support |
| Safari  | 11+     | Full support |
| Edge    | 16+     | Full support |

## Troubleshooting

### Common Issues

1. **WASM failed to load**: Check browser WebAssembly support
2. **Slow loading**: First load downloads ~10MB WASM module
3. **Controls not working**: Ensure canvas has focus (click on it)
4. **Graphics issues**: Try refreshing the page

### Debug Information

Check browser console for detailed error messages and loading progress.
