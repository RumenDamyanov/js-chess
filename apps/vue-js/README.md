# Vue JS Chess

This Vue 3 implementation of JS Chess is aligned with the shared cross-framework architecture used by the Vanilla, jQuery, and other examples.

## Key Features

- Shared PGN save/import manager (pgn-core.js) with autosave + 3 manual slots
- Configurable game settings (player name/color, undo, hints, chat, timers)
- Count-up and count-down timers with orientation indicator
- AI move + hint system (white vs AI black by default when player chooses black)
- Accessible status, timers, move history, and interactive board squares (ARIA labels and keyboard activation)
- Theming via global `JSChessTheme.toggle()` shared script

## Component Structure

- `App.vue`: Orchestrates game lifecycle, board rendering, timers, PGN integration, and messaging
- `components/GameConfigPanel.vue`: Encapsulated settings panel using `v-model`
- `components/ChatComponent.vue`: Optional chat/AI commentary panel (togglable)

## Accessibility

Each board square exposes an `aria-label` such as `white knight on g1` or `Empty square e4` and is keyboard operable via Enter/Space.
Move history uses an ordered list with live polite updates.
Timers and game status regions use appropriate `role` + `aria-live` attributes.

## Persistence

Settings persist to `localStorage` under `vue*` key names. (A future enhancement may extract a composable for this; kept inline for minimal overhead.)

## PGN Manager Integration

The shared PGN manager is initialized on mount and wired via callbacks to:

- Access current game + state
- Provide orientation and player name
- Trigger PGN regeneration after move or terminal game state changes

## Development

Uses Vite (see root scripts) and shared assets imported from `../shared/assets`.

## Next Enhancements (ideas)

- Extract config persistence into a composable (e.g. `usePersistentConfig`)
- Enhanced move list pairing (1. e2e4 e7e5)
- Improved keyboard navigation for piece selection/move generation
