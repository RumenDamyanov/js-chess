<template>
  <div class="card">
    <h3>⏱️ Timers</h3>
    <div class="status">
      <div>
        White: <span :class="{ 'text-strong': activeColor === 'white' }">{{ format(timeWhite) }}</span>
        <span v-if="timeWhite === 0" title="Flag fell" aria-label="White flag">🏳️</span>
      </div>
      <div>
        Black: <span :class="{ 'text-strong': activeColor === 'black' }">{{ format(timeBlack) }}</span>
        <span v-if="timeBlack === 0" title="Flag fell" aria-label="Black flag">🏴</span>
      </div>
    </div>
    <div class="actions" style="margin-top: 8px; display: flex; gap: 8px;">
      <button class="btn" @click="reset">Reset</button>
      <button class="btn" @click="togglePause">{{ paused ? 'Resume' : 'Pause' }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TimerPanel',
  props: {
    activeColor: { type: String, default: 'white' },
    running: { type: Boolean, default: true },
    gameId: { type: [String, Number], default: '' },
    initialSeconds: { type: Number, default: 300 },
    incrementSeconds: { type: Number, default: 0 },
    whiteSecondsOverride: { type: Number, default: null },
    blackSecondsOverride: { type: Number, default: null }
  },
  emits: ['time-expired', 'times-update'],
  data() {
    return {
      timeWhite: this.initialSeconds,
      timeBlack: this.initialSeconds,
      paused: false,
      intervalId: null,
  expiredSent: false,
  lastActiveColor: null
    }
  },
  watch: {
    running(newVal) {
      if (newVal && !this.paused) this.start()
      else this.stop()
    },
    gameId() {
      // New game: reset state
      this.reset()
      this.paused = false
      this.expiredSent = false
      if (this.running) this.start()
    },
    initialSeconds(newVal, oldVal) {
      if (newVal !== oldVal) {
        // Update both clocks to new initial when time control changes
        if (this.whiteSecondsOverride == null) this.timeWhite = Math.max(0, Number(newVal) || 0)
        if (this.blackSecondsOverride == null) this.timeBlack = Math.max(0, Number(newVal) || 0)
        this.expiredSent = false
        if (this.running && !this.paused) this.start()
      }
    },
    whiteSecondsOverride(newVal) {
      if (newVal != null) this.timeWhite = Math.max(0, Number(newVal) || 0)
    },
    blackSecondsOverride(newVal) {
      if (newVal != null) this.timeBlack = Math.max(0, Number(newVal) || 0)
    },
    activeColor(newColor) {
      if (this.lastActiveColor && this.lastActiveColor !== newColor) {
        // Side switched: award increment to side that just moved
        if (this.lastActiveColor === 'white') this.timeWhite = Math.max(0, this.timeWhite + this.incrementSeconds)
        else if (this.lastActiveColor === 'black') this.timeBlack = Math.max(0, this.timeBlack + this.incrementSeconds)
      }
      this.lastActiveColor = newColor
    },
    paused(newVal) {
      if (newVal) this.stop()
      else if (this.running) this.start()
    }
  },
  mounted() {
    if (this.running && !this.paused) this.start()
  },
  beforeUnmount() {
    this.stop()
  },
  methods: {
    start() {
      this.stop()
      this.intervalId = setInterval(() => {
        if (this.paused) return
        if (this.activeColor === 'white' && this.timeWhite > 0) this.timeWhite--
        if (this.activeColor === 'black' && this.timeBlack > 0) this.timeBlack--

        // Detect expiry once and notify parent
        if (!this.expiredSent) {
          if (this.timeWhite === 0 && this.activeColor === 'white') {
            this.expiredSent = true
            this.$emit('time-expired', { color: 'white' })
            this.stop()
          } else if (this.timeBlack === 0 && this.activeColor === 'black') {
            this.expiredSent = true
            this.$emit('time-expired', { color: 'black' })
            this.stop()
          }
        }

        // Emit times for persistence
        this.$emit('times-update', { white: this.timeWhite, black: this.timeBlack })
      }, 1000)
    },
    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    },
    reset() {
      this.timeWhite = this.whiteSecondsOverride != null ? Math.max(0, Number(this.whiteSecondsOverride) || 0) : this.initialSeconds
      this.timeBlack = this.blackSecondsOverride != null ? Math.max(0, Number(this.blackSecondsOverride) || 0) : this.initialSeconds
      this.expiredSent = false
    },
    togglePause() {
      this.paused = !this.paused
    },
    format(totalSeconds) {
      const m = Math.floor(totalSeconds / 60)
      const s = totalSeconds % 60
      return `${m}:${s.toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
/* Relies on shared card/status/button styles */
</style>
