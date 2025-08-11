# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned / In Progress

- Shared promotion dialog module extraction
- Deeper message styling unification & animation polish
- Potential FEN load implementation
- Additional accessibility audit (color contrast & focus outlines)


### Added

- Per-game mutex locking in backend to prevent concurrent state mutation races
- Deterministic AI hint fallback: explicit `hint_unavailable` error replaces prior pseudo-random fallback
- Shared `helpers.js` (unified move count & AI color logic)
- Shared `messages.js` utility for consistent accessible message stack (vanilla, jQuery, TypeScript)
- Accessible promotion dialog behaviors (focus trap, ESC, focus return) across vanilla, jQuery, TypeScript
- Comprehensive Makefile with 50+ Docker / dev commands
- Shared CSS architecture (tokens, header, common)
- Cross-app navigation header & enhanced landing page/cards

### Changed

- Explicit `ai_color` sent on all new game creations (consistency)
- Promotion dialog refactored; keyboard accessibility standardized
- Vanilla, jQuery, TypeScript apps delegate message rendering to shared utility
- Renamed directories: `apps/react` → `apps/react-js`, `apps/vue` → `apps/vue-js`
- README expanded with Make commands and workflow
- Angular chess service error handling improved
- Docker build/run organization refined

### Fixed

- jQuery double move submissions prevented via `isProcessingMove` guard
- Removed non-deterministic AI hint fallback (now deterministic error path)
- AI move stuck when opponent in check edge case
- Backend restart recovery & container 404 / ERR_EMPTY_RESPONSE issues
- Git tracking cleanup of obsolete directories

### Security

- Serialized AI computation with per-game locks reducing race risk

### Removed

- Angular build cache
- Legacy backup/temp files & .DS_Store
- Redundant old app directories

### Notes

- `/health` version updated to `1.0.4`
- Further UI refactors (shared promotion module) targeted for next release

### Temporarily Delisted (WIP Framework Implementations)

- Angular, React, and Vue have been temporarily excluded from aggregate Make targets (build / up / rebuild / health) and visually marked as WIP.
- Rationale: They lag behind recent backend + shared layer updates (move validation tightening, AI pipeline, shared messaging utilities, upcoming caching / optimistic update strategy).
- Scope: Source code remains; individual commands (e.g. `make start-angular`, `make build-react`) still function for contributors.
- Reinstatement Criteria: Parity with stable Vanilla JS / Vanilla TS / jQuery feature set (promotion modal, castling flow, SAN accuracy, undo replay safety, accessibility patterns) and passing the updated compatibility checklist.
- Outcome: Faster default builds and clearer user-facing demo state while rewrites proceed.

## [1.0.0-beta1] - 2025-08-03

### Initial Release

- Initial release of JS Chess Frontend Showcase with multiple framework implementations
