<template>
  <div class="game-config card-like" id="game-config">
    <h3>Game Settings</h3>

    <div class="config-section">
      <h4>Player Settings</h4>
      <div class="config-group">
  <label for="player-name">Player Name:</label>
  <input id="player-name" type="text" v-model="model.playerName" placeholder="Enter your name" @input="emitChange" />
      </div>
      <div class="config-group">
  <label for="player-color">Play as:</label>
  <select id="player-color" v-model="model.playerColor" @change="emitChange">
          <option value="white">White</option>
          <option value="black">Black</option>
        </select>
      </div>
    </div>

    <div class="config-section">
      <h4>Game Features</h4>
      <div class="config-group">
        <label class="checkbox-label" for="enable-undo">
          <input type="checkbox" id="enable-undo" v-model="model.enableUndo" @change="emitChange" />
          <span class="checkmark"></span>
          Enable Undo Button
        </label>
      </div>
      <div class="config-group">
        <label class="checkbox-label" for="enable-hints">
          <input type="checkbox" id="enable-hints" v-model="model.enableHints" @change="emitChange" />
          <span class="checkmark"></span>
          Enable Hint Button
        </label>
      </div>
      <div class="config-group">
        <label class="checkbox-label" for="enable-chat">
          <input type="checkbox" id="enable-chat" v-model="model.enableChat" @change="emitChange" />
          <span class="checkmark"></span>
          Enable AI Chat
        </label>
      </div>
    </div>

    <div class="config-section">
      <h4>Timer Settings</h4>
      <div class="config-group">
        <label class="checkbox-label" for="enable-timer">
          <input type="checkbox" id="enable-timer" v-model="model.enableTimer" @change="emitChange" />
          <span class="checkmark"></span>
          Enable Timer
        </label>
      </div>
      <div class="config-group">
        <label for="timer-mode">Timer Mode:</label>
  <select id="timer-mode" v-model="model.timerMode" :disabled="!model.enableTimer" @change="emitChange">
          <option value="count-up">Count Up (Stopwatch)</option>
          <option value="count-down">Count Down (Time Limit)</option>
        </select>
      </div>
      <div class="config-group" id="time-limit-group" v-if="model.enableTimer && model.timerMode==='count-down'">
        <label for="time-limit">Time Limit (minutes):</label>
        <select id="time-limit" v-model.number="model.timeLimit" @change="emitChange">
          <option :value="5">5 minutes</option>
          <option :value="10">10 minutes</option>
          <option :value="15">15 minutes</option>
          <option :value="30">30 minutes</option>
          <option :value="60">60 minutes</option>
        </select>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit = defineEmits(['update:modelValue'])
// Direct binding so persistence composable sees immediate changes
const model = props.modelValue
function emitChange(){ emit('update:modelValue', { ...model }) }
</script>
