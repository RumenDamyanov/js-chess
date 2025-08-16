# JS Chess - Frontend Showcase

[![CI/CD Pipeline](https://github.com/RumenDamyanov/js-chess/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/RumenDamyanov/js-chess/actions)
[![Go Chess API](https://img.shields.io/badge/API-go--chess-blue.svg)](https://github.com/RumenDamyanov/go-chess)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Multi-framework chess UI demos powered by the Go backend. A shared design system in `shared/styles` keeps visuals consistent across implementations.

## 🔄 Current Status (Aug 2025)

Active & stable (included in default Docker / Make builds):

- Landing Page (overview + navigation)
- Vanilla JS
- Vanilla TypeScript
- jQuery
- Vue 3

Work‑in‑progress (excluded by default – manual start/build only):

- Angular (planned – WIP)
- React (planned – WIP)

These two WIP apps are intentionally disabled in aggregate Make targets to speed builds. They will return after framework‑specific rewrites that align with recent backend changes (improved move validation, AI workflow, and forthcoming caching / optimistic update layer).

## ✨ Recent Updates

Latest notable changes (since mid‑2025):

1. Angular rewrite: promotion modal UI, castling handling, SAN move history, AI auto‑move flow, safer undo via replay, self‑capture & illegal move guards.
2. Unified WIP labeling: Landing page & all active headers show disabled (grey) links for Angular / React.
3. Makefile optimization: Default `build`, `up`, `rebuild`, `health`, `logs-frontend`, etc. now exclude Angular / React (use `start-angular`, `build-react`, etc. individually). Vue is included.
4. Promotion & castling UX: Consistent notation capture and server‑validated sequencing.
5. Shared styling: Added disabled navigation/link styles and WIP tag classes.

Planned next steps for the WIP frameworks:

- Introduce a thin shared API client with response caching & diff reconciliation.
- Implement lightweight state stores (Signals / Zustand pattern equivalents) for faster replays.
- Add incremental board rendering & piece move animation.
- Re‑enable once parity with stable implementations is verified via test checklist.

## Frameworks

Stable: Vanilla JS · Vanilla TS · jQuery · Vue 3

WIP (temporarily disabled in default build): React · Angular

## Repository Layout (excerpt)

```text
shared/
    api/                # JS & TS API clients, websocket helpers
    styles/             # Design system (tokens, common, header, board, chat, theme-toggle.js)
apps/
    vanilla-js/
    vanilla-ts/
    jquery/
    vue-js/
    react-js/
    angular/
backend/
    go-chess/           # Submodule backend
docker/               # Container & proxy configs
Makefile              # Convenience targets
```

## Key Features

- Complete chess rules (promotion, castling, en passant)
- AI move generation + optional AI chat
- WebSocket live updates
- Move history & analysis hooks
- Light/Dark theme (CSS variables + toggle)

## Theming & Shared Styles

- Source of truth: `shared/styles/tokens.css`
- Dark overrides: `[data-theme="dark"]`
- Runtime path in containers: `/shared/styles/*`
- HTML references: `shared/styles/tokens.css`
- Toggle: `JSChessTheme.toggle()` (persists via `localStorage`)

Add new tokens or component CSS in `shared/styles` and rebuild images; all static apps pick up changes automatically. Future preprocessing (PostCSS/Sass) can hook into the placeholder Make target `build-shared-styles`.

## Quick Start (Docker – Active Set Only)

```bash
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess
make install          # Build & start backend + stable frontends
make urls             # List service URLs (WIP flagged as disabled)
```

Primary active ports: 3000 (landing) · 3001 (vanilla JS) · 3002 (vanilla TS) · 3003 (jQuery) · 3004 (Vue) · 8080 (API)

WIP (manual if needed): 3005 (react) · 3006 (angular)

## Make Targets (selection)

```bash
make up / down              # Start / stop active set only
make build / rebuild        # Build / rebuild active set only
make status / logs          # Container status / aggregated logs
make start-vanilla          # Start one app
make build-vanilla-ts       # Build TS vanilla image
make build-shared-styles    # Placeholder (no-op)
make start-angular          # (WIP) Start angular only
make build-react            # (WIP) Build react only
make build-vue              # Build vue only
```

## Local (no Docker)

```bash
npm run install:all
npm run start:backend
npm run start:vanilla   # or any start:* script
```

## Core API Endpoints

```text
POST /api/games               # New game
GET  /api/games/{id}          # State
POST /api/games/{id}/moves    # Player move
POST /api/games/{id}/ai-move  # AI move
WS   /ws/games/{id}           # Live updates
```

## Contributing

See `CONTRIBUTING.md`. Ideas: add Svelte/Solid examples, visual regression tests, accessibility passes, PostCSS pipeline.

## License

MIT — see `LICENSE.md`.

---
⭐ Star the repo if this multi-framework comparison helps you!

| **jQuery** | Classic event handling | None | Familiar, rapid development |
| **Vue.js** | Reactive components | Vite | Progressive enhancement |
| **React.js** | Component architecture | Vite | Modern hooks, state management |
| **Angular** | Enterprise features | Angular CLI | TypeScript, dependency injection |

## 🐳 Docker Deployment

The project includes a complete Docker setup with:

- **Backend API**: go-chess server running on port 8080
- **Frontend Apps**: Each app served on different ports (3000-3006)
- **Nginx Proxy**: Reverse proxy routing to different apps
- **Development Mode**: Hot reload for all frameworks

### WIP Framework Access (Optional)

These are disabled in aggregate commands. To experiment locally:

```bash
make start-angular   # Starts angular only (port 3006)
make start-react     # Starts react only (port 3005)
make start-vue       # Starts vue only (port 3004)
```

Expect partial / outdated UX until rewrites land.

## 🎨 Theming & Shared Styles

Unified theming is implemented via CSS Custom Properties in `shared/styles/tokens.css` with a light theme under `:root` and a dark theme scope using `[data-theme="dark"]`. Frontend apps load the same files so visual consistency is guaranteed.

Runtime path expectations inside Docker containers:

- All shared styles are copied to `/usr/share/nginx/html/shared/styles/`
- HTML references use relative paths like `shared/styles/tokens.css`

Add new design tokens or component styles in the shared directory; all static apps will receive them on the next image rebuild. If a preprocessing pipeline (PostCSS/Sass) is introduced, the placeholder Make target `build-shared-styles` can be extended.

Dark mode can be toggled with the button that calls `JSChessTheme.toggle()` (implemented in `theme-toggle.js`) which persists the user preference in `localStorage`.

## 🛠️ Make Commands

This project includes a comprehensive Makefile with convenient aliases for Docker operations. All commands are designed to make development workflow smoother and more intuitive.

### Essential Commands (Active Set)

```bash
make help          # Show all available commands with descriptions
make install       # First-time setup - build/start active services
make up            # Start active services in detached mode
make start         # Alias for 'up' command
make down          # Stop and remove all containers
make stop          # Alias for 'down' command
make restart       # Restart active containers
make status        # Show status of all containers
make logs          # Show logs from all containers (last 50 lines)
make health        # Check health of all services
make urls          # Display all application URLs
```

### Development Workflow (Active Set)

```bash
make dev           # Start active set with logs
make build         # Build active containers
make rebuild       # Clean rebuild (active only)
make test-api      # Test backend API endpoints
make test-frontend # Test active frontend endpoints
make open          # Open active applications (skips WIP)
```

### Individual Service Management

```bash
# Start individual services
make start-backend      # Start only backend (port 8080)
make start-angular      # Start only Angular (port 3006)
make start-react        # Start only React (port 3005)
make start-vue          # Start only Vue.js (port 3004)
make start-jquery       # Start only jQuery (port 3003)
make start-vanilla-ts   # Start only Vanilla TypeScript (port 3002)
make start-vanilla      # Start only Vanilla JS (port 3001)
make start-landing      # Start only Landing page (port 3000)

# Build individual services
make build-backend
make build-angular
make build-react
make build-vue
make build-jquery
make build-vanilla-ts
make build-vanilla
make build-landing

# Restart individual services
make restart-backend
make restart-frontend  # Restart active frontend containers
```

### Logging and Debugging

```bash
make logs-backend     # Show backend logs only
make logs-frontend    # Show active frontend logs
make shell-backend     # Open shell in backend container
make shell-angular     # Open shell in Angular container
make shell-react       # Open shell in React container
make shell-vue         # Open shell in Vue container
make shell-vanilla-ts  # Open shell in Vanilla TypeScript container
make watch            # Watch container status in real-time
make stats            # Show container resource usage
make inspect          # Show detailed container information
```

### Cleanup Commands

```bash
make clean            # Stop containers and remove images
make prune            # Remove unused Docker resources
make clean-volumes    # Remove all Docker volumes
make clean-all        # Nuclear option - remove everything (with 5s warning)
make reset-games      # Reset all game data (restart backend)
```

### Monitoring and Debugging Commands

```bash
make watch            # Watch container status in real-time
make stats            # Show container resource usage
make inspect          # Show detailed container information
make help-detailed    # Show detailed help with examples
```

### Database and Project Management

```bash
make backup-games     # Backup game data (if persistent storage exists)
make update           # Update project (git pull + submodule update + rebuild)
make setup            # Alias for install command
make validate-ci      # Run local CI validation checks
make ci-test          # Run complete CI test suite locally
```

### Example Workflows

First-time setup (active set):

```bash
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess
make install
make health
```

Daily development:

```bash
make up
make logs
# work...
make restart
make down
```

Exploring a WIP framework (optional):

```bash
make start-react   # or start-angular / start-vue
make logs          # Observe logs (other active services already running)
```

Debugging:

```bash
make health
make logs-backend
make test-api
make clean && make up
```

**Database and backup operations:**

```bash
make backup-games      # Backup game data
make reset-games       # Reset all games
make clean-volumes     # Remove persistent data
```

**Project maintenance:**

```bash
make update            # Update project from git
make validate-ci       # Run CI checks locally
make help-detailed     # Show comprehensive help
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose**
- **Go** 1.22+ (for backend development)

### Local Development

```bash
# Install dependencies for all apps
npm run install:all

# Start backend API
npm run start:backend

# Start individual frontend apps (active + optional WIP)
npm run start:vanilla      # Port 3001
npm run start:vanilla-ts   # Port 3002
npm run start:jquery       # Port 3003
npm run start:vue          # Port 3004
# (WIP) npm run start:react   # Port 3005
# (WIP) npm run start:angular # Port 3006

# Or start all (includes WIP; slower, not typical right now)
# npm run start:all
```

## � Documentation

- [Project Structure](https://github.com/RumenDamyanov/js-chess/wiki/Project-Structure)
- [API Integration](https://github.com/RumenDamyanov/js-chess/wiki/API-Integration)
- [Deployment Guide](https://github.com/RumenDamyanov/js-chess/wiki/Deployment-Guide)

Guides by implementation:

- [Vanilla JavaScript](https://github.com/RumenDamyanov/js-chess/wiki/Vanilla-JS-Guide)
- [Vanilla TypeScript](https://github.com/RumenDamyanov/js-chess/wiki/Vanilla-TS-Guide)
- [jQuery](https://github.com/RumenDamyanov/js-chess/wiki/jQuery-Guide)
- [Vue 3](https://github.com/RumenDamyanov/js-chess/wiki/Vue-Guide)
- (WIP) [React](https://github.com/RumenDamyanov/js-chess/wiki/React-Guide)
- (WIP) [Angular](https://github.com/RumenDamyanov/js-chess/wiki/Angular-Guide)

## 🙏 Acknowledgments

- Backend powered by [go-chess](https://github.com/RumenDamyanov/go-chess)
- Chess piece graphics from [Chess.com](https://chess.com) style
- Icons from [Feather Icons](https://feathericons.com/)

## 📜 Project Information

- 📄 [License](LICENSE.md) - MIT License
- 🤝 [Contributing](CONTRIBUTING.md) - How to contribute
- 🔒 [Security Policy](SECURITY.md) - Vulnerability reporting
- 💝 [Funding](FUNDING.md) - Support the project
- 📝 [Changelog](CHANGELOG.md) - Version history

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

⭐ **Star this repo** if you find it helpful for learning different JavaScript frameworks!
