# JS Chess - Frontend Showcase

[![CI/CD Pipeline](https://github.com/RumenDamyanov/js-chess/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/RumenDamyanov/js-chess/actions)
[![Go Chess API](https://img.shields.io/badge/API-go--chess-blue.svg)](https://github.com/RumenDamyanov/go-chess)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive demonstration of chess frontends built with different JavaScript frameworks, all powered by the [go-chess](https://github.com/RumenDamyanov/go-chess) backend API.

## 🎯 Project Overview

This project showcases **6 different frontend implementations** of the same chess application, each using a different JavaScript technology:

- **Vanilla JS** - Pure JavaScript implementation
- **Vanilla TypeScript** - Type-safe pure TypeScript implementation ✅
- **jQuery** - Classic DOM manipulation approach
- **Vue.js** - Progressive framework implementation
- **React.js** - Component-based architecture
- **Angular** - Enterprise-grade framework

All implementations connect to the same go-chess backend API, demonstrating how different frontend technologies can consume the same RESTful API and WebSocket connections.

## 🏗️ Project Structure

```
js-chess/
├── README.md                     # This file
├── LICENSE.md                    # MIT License
├── CONTRIBUTING.md               # Contribution guidelines
├── docker-compose.yml            # Full stack orchestration
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules
├── .gitmodules                   # Git submodule configuration
├──
├── backend/                      # Go-chess backend (git submodule)
│   └── go-chess/                 # https://github.com/RumenDamyanov/go-chess
│
├── apps/                         # Frontend applications
│   ├── vanilla-js/               # Pure JavaScript implementation
│   │   ├── index.html
│   │   ├── js/
│   │   ├── css/
│   │   ├── assets/
│   │   └── README.md
│   │
│   ├── vanilla-ts/               # Pure TypeScript implementation ✅
│   │   ├── index.html
│   │   ├── src/                  # TypeScript source files
│   │   ├── dist/                 # Compiled JavaScript
│   │   ├── css/
│   │   ├── tsconfig.json         # TypeScript configuration
│   │   ├── package.json          # Build configuration
│   │   └── README.md
│   │
│   ├── jquery/                   # jQuery implementation
│   │   ├── index.html
│   │   ├── js/
│   │   ├── css/
│   │   ├── assets/
│   │   └── README.md
│   │
│   ├── vue/                      # Vue.js implementation
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── src/
│   │   ├── public/
│   │   └── README.md
│   │
│   ├── react/                    # React.js implementation
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   ├── src/
│   │   ├── public/
│   │   └── README.md
│   │
│   └── angular/                  # Angular implementation
│       ├── package.json
│       ├── angular.json
│       ├── src/
│       ├── public/
│       └── README.md
│
├── shared/                       # Shared resources
│   ├── api/                      # API client libraries
│   │   ├── chess-api.js          # Vanilla JS API client
│   │   ├── chess-api.ts          # TypeScript API client
│   │   └── websocket-client.js   # WebSocket client
│   │
│   ├── assets/                   # Common assets
│   │   ├── pieces/               # Chess piece images
│   │   ├── sounds/               # Game sounds
│   │   └── icons/                # UI icons
│   │
│   └── styles/                   # Shared stylesheets
│       ├── chess-board.css       # Board styling
│       └── common.css            # Common UI styles
│
├── docs/                         # Documentation
│   ├── api-integration.md        # API integration guide
│   ├── deployment.md             # Deployment instructions
│   ├── development.md            # Development setup
│   └── screenshots/              # App screenshots
│
├── scripts/                      # Build and deployment scripts
│   ├── build-all.sh              # Build all applications
│   ├── start-dev.sh              # Start development environment
│   ├── docker-setup.sh           # Docker environment setup
│   └── deploy.sh                 # Production deployment
│
└── docker/                       # Docker configurations
    ├── nginx/                    # Nginx reverse proxy config
    │   ├── nginx.conf
    │   └── default.conf
    │
    ├── vanilla/                  # Nginx config for vanilla app
    ├── jquery/                   # Nginx config for jquery app
    ├── vue/                      # Production build for Vue
    ├── react/                    # Production build for React
    └── angular/                  # Production build for Angular
```

## 🚀 Features

### Core Chess Features
- ♟️ **Complete Chess Game**: All rules including castling, en passant, pawn promotion
- 🤖 **AI Opponents**: Multiple difficulty levels using go-chess AI engines
- 💬 **LLM AI Chat**: Chat with AI opponents (GPT-4, Claude, Gemini, etc.)
- 📊 **Move Analysis**: Position evaluation and move suggestions
- ⏱️ **Real-time Updates**: WebSocket integration for live gameplay
- 📝 **Game History**: Move tracking and game replay
- 💾 **Save/Load Games**: PGN and FEN format support

### Frontend Implementations
Each app demonstrates the same features using different approaches:

| Framework | Key Features | Build Tool | Highlights |
|-----------|-------------|------------|------------|
| **Vanilla JS** | Pure DOM manipulation, ES6+ | None | Lightweight, educational |
| **Vanilla TypeScript** | Type-safe DOM, strict typing | TypeScript | Type safety, modern tooling |
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

### Quick Start

```bash
# Clone with submodules
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess

# Start everything with Docker
docker-compose up --build

# Or use the convenience script
./scripts/start-dev.sh

# Or use Make commands (recommended)
make install  # First-time setup
make up       # Start all services
make urls     # Show all application URLs
```

### Access the Applications

- **Landing Page**: http://localhost:3000
- **Vanilla JS**: http://localhost:3001
- **Vanilla TypeScript**: http://localhost:3002
- **jQuery**: http://localhost:3003
- **Vue.js**: http://localhost:3004
- **React.js**: http://localhost:3005
- **Angular**: http://localhost:3006
- **Backend API**: http://localhost:8080

## 🛠️ Make Commands

This project includes a comprehensive Makefile with convenient aliases for Docker operations. All commands are designed to make development workflow smoother and more intuitive.

### Essential Commands
```bash
make help          # Show all available commands with descriptions
make install       # First-time setup - build and start everything
make up            # Start all containers in detached mode
make start         # Alias for 'up' command
make down          # Stop and remove all containers
make stop          # Alias for 'down' command
make restart       # Restart all containers
make status        # Show status of all containers
make logs          # Show logs from all containers (last 50 lines)
make health        # Check health of all services
make urls          # Display all application URLs
```

### Development Workflow
```bash
make dev           # Start containers with live logs (development mode)
make build         # Build all containers
make rebuild       # Clean rebuild of everything (down → clean → build → up)
make test-api      # Test backend API endpoints
make test-frontend # Test all frontend endpoints
make open          # Open all applications in browser (macOS only)
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
make restart-frontend  # Restart all frontend containers
```

### Logging and Debugging
```bash
make logs-backend     # Show backend logs only
make logs-frontend    # Show all frontend logs
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

**First-time setup:**
```bash
git clone --recursive https://github.com/RumenDamyanov/js-chess.git
cd js-chess
make install    # Builds everything and starts all services
make health     # Verify everything is working
```

**Daily development:**
```bash
make up         # Start all services
make logs       # Check logs
# ... do development work ...
make restart    # Restart after changes
make down       # Stop when done
```

**Working on specific framework:**
```bash
make start-backend      # Start backend
make start-angular      # Start only Angular
make logs-angular       # Watch Angular logs
make build-angular      # Rebuild after changes
make restart-angular    # Restart Angular
```

**Debugging issues:**
```bash
make health            # Check service health
make logs-backend      # Check backend logs
make shell-backend     # Debug inside container
make test-api          # Test API endpoints
make stats             # Check resource usage
make inspect           # Show container details
make clean && make up  # Clean restart
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

# Start individual frontend apps
npm run start:vanilla      # Port 3001
npm run start:vanilla-ts   # Port 3002
npm run start:jquery       # Port 3003
npm run start:vue          # Port 3004
npm run start:react        # Port 3005
npm run start:angular      # Port 3006

# Or start all frontends
npm run start:all
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
- [Vue.js Implementation](https://github.com/RumenDamyanov/js-chess/wiki/Vue-Guide) - Vue 3 with Composition API
- [React.js Implementation](https://github.com/RumenDamyanov/js-chess/wiki/React-Guide) - Modern React with hooks
- [Angular Implementation](https://github.com/RumenDamyanov/js-chess/wiki/Angular-Guide) - Angular with TypeScript

### Complete Wiki Documentation

For comprehensive guides, examples, and advanced topics, visit the [project wiki](https://github.com/RumenDamyanov/js-chess/wiki).

## 👨‍💻 Author

**Rumen Damyanov**

- Email: [contact@rumenx.com](mailto:contact@rumenx.com)
- GitHub: [@RumenDamyanov](https://github.com/RumenDamyanov)
- Backend API: [go-chess](https://github.com/RumenDamyanov/go-chess)

## 🙏 Acknowledgments

- Backend powered by [go-chess](https://github.com/RumenDamyanov/go-chess)
- Chess piece graphics from [Chess.com](https://chess.com) style
- Icons from [Feather Icons](https://feathericons.com/)

## � Project Information

- 📄 [License](LICENSE.md) - MIT License
- 🤝 [Contributing](CONTRIBUTING.md) - How to contribute
- 🔒 [Security Policy](SECURITY.md) - Vulnerability reporting
- 💝 [Funding](FUNDING.md) - Support the project
- 📝 [Changelog](CHANGELOG.md) - Version history

## �📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

⭐ **Star this repo** if you find it helpful for learning different JavaScript frameworks!
