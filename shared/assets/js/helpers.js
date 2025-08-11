// Shared frontend helpers for JS Chess apps (vanilla, jQuery, TS transpiled usage possible)
// Provides consistent move count formatting, AI/player color derivation, and message utility.

window.JSChessHelpers = (function() {
  function formatFullMoveCount(rawMoveCount) {
    if (!rawMoveCount || rawMoveCount < 1) return 1;
    // Engine counts half-moves (plies); full move number increments after Black's move.
    return Math.ceil(rawMoveCount / 2);
  }

  function deriveAIColor(playerColor) {
    return playerColor === 'white' ? 'black' : 'white';
  }

  // Standardized update for a move count element (pass element or selector)
  function applyMoveCount(rawMoveCount, el) {
    const value = formatFullMoveCount(rawMoveCount);
    const target = typeof el === 'string' ? document.querySelector(el) : el;
    if (target) target.textContent = value.toString();
    return value;
  }

  return { formatFullMoveCount, deriveAIColor, applyMoveCount };
})();
