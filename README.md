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
- Vue 3 (now feature‑aligned: timers, save slots, board + dark mode, shared debug)

Work‑in‑progress / planned (manual start or placeholders only):

- Angular (refactor toward new shared UI patterns)
- React (planned)
- UI5 (JS) – placeholder link (landing + headers)
- UI5 (TS) – placeholder link (landing + headers)

The WIP / planned entries are excluded from aggregate Make targets to keep build times low. UI5 variants are placeholders to illustrate upcoming framework diversity; ports will be assigned once scaffolds land.

## ✨ Recent Updates

Late Aug 2025 highlights:

1. Vue 3 reached full feature parity (timers, save slots, status blocks, chat, move history, dark mode, unified board styling).
2. Landing page redesign: modern dual‑row grid with stable vs WIP tiers and tech icon badges.
3. Shared SCSS design system cleanup: duplicate selectors removed, `@extend` eliminated, stylelint enforced in multiple CI jobs.
4. Unified debug panel + scoped log categories (legacy bespoke panels removed; AI noise gated behind `aiEngine`).
5. Accessibility & UX: improved timer control semantics, nav placeholder states, message stack handling.
6. Build stabilization: Sass CLI given `--load-path shared/styles/scss`; Vue switched to `@use 'main';` via Vite `includePaths` + Docker image now copies `shared/` once for resolution.
7. CI hardening: matrix (vanilla-ts, vue-js) builds after shared style compile; stylelint runs in setup, matrix, and quality jobs with fail‑fast disabled.
8. Future migration path: Remaining apps will migrate from deep relative `@use '../../../shared/.../main';` to simplified `@use 'main';` (already live in Vue) for consistency.

Planned next steps:

- Migrate remaining app bundles to simplified `@use 'main';` (remove deep relative paths).
- Implement UI5 (JS/TS) scaffolds with shared theme integration.
- React & Angular rewrites aligned with shared primitives.
- Add visual regression + a11y automated checks.
- Incremental board rendering & animation pipeline.

## Frameworks

Stable: Vanilla JS · Vanilla TS · jQuery · Vue 3

WIP / Planned: React · Angular · UI5 (JS) · UI5 (TS)

## Repository Layout (excerpt)

```text
shared/
    api/                # JS & TS API clients, websocket helpers
    styles/             # Design system (scss/ partials incl. _tokens.scss, theme-toggle.js)
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

- Source of truth: SCSS tokens & component partials under `shared/styles/scss/partials/` (notably `_tokens.scss`).
- Output: Compiled via `npm run build:styles` producing `common-scss.css` + per‑app bundles.
- Dark mode: `[data-theme="dark"]` overrides rely on CSS custom properties from tokens.
- Toggle: `JSChessTheme.toggle()` (persists with `localStorage`).
- Vue & future apps: prefer simplified `@use 'main';` (resolved by Sass load‑path / Vite includePaths). Legacy deep relative `@use '../../../shared/.../main';` entries will be migrated.
- Docker: Shared design system copied into build context; static apps reference compiled bundles only (no raw token file needed at runtime).

Add or modify tokens/components then run `npm run build:styles` (or rebuild images) — all active apps update automatically. The placeholder Make target `build-shared-styles` remains available for future pipeline hooks (e.g. PostCSS layering, style snapshots).

## Styling Architecture (Design System Migration)

The project now uses a shared SCSS design system located in `shared/styles/scss`.

Core partials:

- `_variables.scss` / `_mixins.scss` – tokens + helpers bridging to existing CSS custom properties.
- `_cards.scss`, `_panels.scss`, `_buttons.scss`, `_slots.scss`, `_forms.scss` – core UI primitives & patterns.
- `_board.scss`, `_messages.scss`, `_status.scss`, `_timer.scss`, `_move-history.scss` – chess domain & game UI.
- `_promotion.scss`, `_debug.scss` – utility overlays (promotion dialog + debug panel).

Each app has a SCSS bundle entry (`apps/<app>/scss/bundle.scss`) that imports the shared `main.scss` plus its local `app-overrides.scss`.

### Current patterns

- Vue: `@use 'main';` (load‑path driven – canonical going forward)
- Other stable apps (temporary): deep relative `@use '../../../shared/styles/scss/main';`

All bundles compile to `scss/dist/app-bundle.css` (or `src/styles/app-bundle.css` for Vue) and should be included as the single stylesheet.

Build scripts:

- `npm run build:styles` – expanded build (shared + per‑app) using Sass `--load-path shared/styles/scss`.
- `npm run watch:styles` – watch mode (same resolution semantics).
- `npm run build:styles:prod` – production build + PostCSS (autoprefixer, minification).

Migration status: Legacy raw CSS files (e.g. `css/style.css`, `chat.css`, `common.css`, `header.css`, `board-toolbar.css`) retired; tokens merged into SCSS pipeline. Load‑path unification complete for Vue; remaining apps queued for path simplification.

Style quality: Stylelint enforced in root + matrix + quality CI jobs. Use `npm run lint:styles`; production path runs through PostCSS (autoprefixer + cssnano).

## Quick Start (Docker – Active Set Only)

```bash
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess
make install          # Build & start backend + stable frontends
make urls             # List service URLs (WIP flagged as disabled)
```

Primary active ports: 3000 (landing) · 3001 (vanilla JS) · 3002 (vanilla TS) · 3003 (jQuery) · 3004 (vue 3) · 8080 (API)

WIP (manual if needed): 3005 (react) · 3006 (angular) · (UI5 JS/TS TBD)

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

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+
- **Docker & Docker Compose**
- **Go** 1.22+ (for backend development)

### Quick Start (Docker)

```bash
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess
make install          # Build & start backend + stable frontends
make urls             # List service URLs (WIP flagged as disabled)
```

Primary active ports: 3000 (landing) · 3001 (vanilla JS) · 3002 (vanilla TS) · 3003 (jQuery) · 3004 (vue 3) · 8080 (API)

WIP (manual if needed): 3005 (react) · 3006 (angular) · (UI5 JS/TS TBD)

### Local Development (no Docker)

```bash
# Install dependencies for all apps
npm run install:all

# Start backend API
npm run start:backend

# Start individual frontend apps (active + optional WIP)
npm run start:vanilla      # Port 3001
npm run start:vanilla-ts   # Port 3002
npm run start:jquery       # Port 3003
# npm run start:vue       # Port 3004
# (WIP) npm run start:react   # Port 3005
# (WIP) npm run start:angular # Port 3006
# (Planned) UI5 (JS/TS) scripts will be added after scaffolding

# Or start all (includes WIP; slower, not typical right now)
# npm run start:all
```

## Core API Endpoints

```text
POST /api/games               # New game
GET  /api/games/{id}          # State
POST /api/games/{id}/moves    # Player move
POST /api/games/{id}/ai-move  # AI move
WS   /ws/games/{id}           # Live updates
```

## Framework Comparison

| Framework | Key Features | Build Tool | Benefits |
|-----------|-------------|------------|----------|
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

### Shared In-Browser Debug Panel

All frontends load a single lightweight debug script: `shared/assets/js/debug.js` which injects:

- Header bug button (toggles panel)
- Master enable switch (persists via cookie `debug_enabled`)
- Per-category toggles (cookies `debug_<category>`)
- Actions: Enable All, Disable All, Clear Console, Test All

Categories:
`gameController`, `chessBoard`, `apiClient`, `configManager`, `chatManager`, `moveValidation`, `boardRendering`, `userInput`, `aiEngine`

Console helpers (alias to shared Debug):

```js
debug.enable();
debug.disable();
debug.enableCategory('aiEngine');
debug.toggleCategory('moveValidation');
debug.test(); // Emits sample logs for every category
```

Direct calls inside code (preferred over raw console.log for conditional noise suppression):

```js
Debug.log('aiEngine', 'Scheduling AI move', { gameId, depth });
Debug.warn('moveValidation', 'Illegal move attempt', move);
Debug.error('apiClient', 'Request failed', err);
```

Notes:

- Vue verbose AI logs removed; now gated behind `aiEngine`.
- TypeScript app legacy bespoke panel removed; adapter proxies old API to shared system.
- Unified panel / overlay styles now live in SCSS partials (`_debug.scss`, `_promotion.scss`) inside the compiled bundles.
- Minimal footprint: no frameworks, pure DOM + cookies.

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

## 📚 API Integration

All applications use the same go-chess API endpoints:

### Core Endpoints

- `POST /api/games` - Create new game
- `GET /api/games/{id}` - Get game state
- `POST /api/games/{id}/moves` - Make a move
- `POST /api/games/{id}/ai-move` - Get AI move

### Advanced Features

- `POST /api/games/{id}/chat` - Chat with AI
- `GET /api/games/{id}/analysis` - Position analysis
- `WebSocket /ws/games/{id}` - Real-time updates

See the [API Integration Guide](https://github.com/RumenDamyanov/js-chess/wiki/API-Integration) for detailed documentation.

## 🎓 Learning Objectives

This project demonstrates:

1. **API Integration**: How different frameworks consume RESTful APIs
2. **WebSocket Handling**: Real-time communication patterns
3. **State Management**: Different approaches across frameworks
4. **Component Architecture**: Framework-specific design patterns
5. **Build Systems**: Modern tooling for each technology
6. **Deployment**: Docker containerization and orchestration

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- Additional framework implementations (Svelte, Alpine.js, etc.)
- Enhanced UI/UX improvements
- Performance optimizations
- Test coverage improvements
- Documentation enhancements

## 📖 Documentation

- [Quick Start Guide](https://github.com/RumenDamyanov/js-chess/wiki/Quick-Start)
- [Project Structure](https://github.com/RumenDamyanov/js-chess/wiki/Project-Structure)
- [API Integration Guide](https://github.com/RumenDamyanov/js-chess/wiki/API-Integration)
- [Deployment Guide](https://github.com/RumenDamyanov/js-chess/wiki/Deployment-Guide)

### Framework-Specific Guides

- [Vanilla JavaScript](https://github.com/RumenDamyanov/js-chess/wiki/Vanilla-JS-Guide) - Pure JavaScript implementation
- [Vanilla TypeScript](https://github.com/RumenDamyanov/js-chess/wiki/Vanilla-TS-Guide) - Pure TypeScript implementation ✅
- [jQuery Implementation](https://github.com/RumenDamyanov/js-chess/wiki/jQuery-Guide) - jQuery-based implementation
- [Vue.js Implementation](https://github.com/RumenDamyanov/js-chess/wiki/Vue-Guide) - Stable parity
- (WIP) [React.js Implementation](https://github.com/RumenDamyanov/js-chess/wiki/React-Guide) - Pending rewrite
- (WIP) [Angular Implementation](https://github.com/RumenDamyanov/js-chess/wiki/Angular-Guide) - Internal refactor in progress
- (Planned) UI5 (JS) Implementation - Placeholder (guide to be added)
- (Planned) UI5 (TS) Implementation - Placeholder (guide to be added)

### Complete Wiki Documentation

For comprehensive guides, examples, and advanced topics, visit the [project wiki](https://github.com/RumenDamyanov/js-chess/wiki).

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
