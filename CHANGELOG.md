# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive Makefile with 50+ commands for Docker management
- Shared CSS architecture with header.css and common.css
- Cross-app navigation headers linking all framework implementations
- Enhanced landing page with stats showcase and framework cards
- Visual style standardization across all applications
- Project cleanup and improved .gitignore patterns

### Changed
- Renamed app directories: `apps/react` → `apps/react-js`, `apps/vue` → `apps/vue-js`
- Updated README.md with comprehensive Make commands documentation
- Enhanced error handling in Angular chess service
- Improved Docker container organization and build process

### Fixed
- AI move logic: Fixed issue where AI wouldn't move when opponent's king was in check
- Backend restart error recovery with comprehensive error handling
- Container restart issues causing 404 and ERR_EMPTY_RESPONSE errors
- Git tracking cleanup for old directory structures

### Removed
- Angular build cache (.angular directory with 246+ files)
- Backup files (*.bak, *-old.js, *-new.js)
- Temporary development scripts and .DS_Store files
- Redundant old app directories from git tracking

## [1.0.0] - 2025-08-03

### Added
- Initial release of JS Chess Frontend Showcase
- Five framework implementations:
  - Vanilla JavaScript chess application
  - jQuery-based chess interface
  - Vue.js reactive chess components
  - React.js modern hooks implementation
  - Angular enterprise-grade architecture
- Go-chess backend integration as git submodule
- Docker Compose orchestration for full-stack deployment
- Shared API client libraries (JavaScript and TypeScript)
- WebSocket integration for real-time gameplay
- Common styling and chess board components
- Development scripts and build automation
- Comprehensive documentation and setup guides

### Features
- ♟️ Complete chess game with all rules (castling, en passant, promotion)
- 🤖 AI opponents with multiple difficulty levels
- 💬 LLM AI chat integration (GPT-4, Claude, Gemini)
- 📊 Move analysis and position evaluation
- ⏱️ Real-time updates via WebSocket
- 📝 Game history and move tracking
- 💾 Save/load games (PGN and FEN format support)
- 🎨 Responsive design across all frameworks
- 🐳 Docker containerization with hot reload
- 🔄 Nginx reverse proxy for multi-app routing
