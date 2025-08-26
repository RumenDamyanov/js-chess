import { reactive, watch } from 'vue'

// Centralized persistence keys (kept stable for backwards compatibility)
const KEY_PREFIX = 'vue'
const keys = {
  playerName: `${KEY_PREFIX}PlayerName`,
  playerColor: `${KEY_PREFIX}PlayerColor`,
  enableUndo: `${KEY_PREFIX}EnableUndo`,
  enableHints: `${KEY_PREFIX}EnableHints`,
  enableChat: `${KEY_PREFIX}EnableChat`,
  enableTimer: `${KEY_PREFIX}EnableTimer`,
  timerMode: `${KEY_PREFIX}TimerMode`,
  timeLimit: `${KEY_PREFIX}TimeLimit`
}

export function usePersistentConfig () {
  const config = reactive({
    playerName: localStorage.getItem(keys.playerName) || 'Player',
    playerColor: localStorage.getItem(keys.playerColor) || 'white',
    enableUndo: localStorage.getItem(keys.enableUndo) !== 'false',
    enableHints: localStorage.getItem(keys.enableHints) !== 'false',
    enableChat: localStorage.getItem(keys.enableChat) !== 'false',
    enableTimer: localStorage.getItem(keys.enableTimer) !== 'false',
    timerMode: localStorage.getItem(keys.timerMode) || 'count-up',
    timeLimit: parseInt(localStorage.getItem(keys.timeLimit) || '10', 10)
  })

  // Persist changes
  watch(() => ({ ...config }), (val) => {
    localStorage.setItem(keys.playerName, val.playerName)
    localStorage.setItem(keys.playerColor, val.playerColor)
    localStorage.setItem(keys.enableUndo, String(val.enableUndo))
    localStorage.setItem(keys.enableHints, String(val.enableHints))
    localStorage.setItem(keys.enableChat, String(val.enableChat))
    localStorage.setItem(keys.enableTimer, String(val.enableTimer))
    localStorage.setItem(keys.timerMode, val.timerMode)
    localStorage.setItem(keys.timeLimit, String(val.timeLimit))
  }, { deep: true })

  return { config }
}
