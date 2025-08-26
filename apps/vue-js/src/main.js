import { createApp } from 'vue'
import App from './App.vue'
// Ensure global theme utility is loaded before app mounts
import '@shared/theme-toggle.js'
// Shared global styles
import '@shared/tokens.css'
import '@shared/common.css'
import '@shared/header.css'
import '@shared/chess-board.css'
import '@shared/chat.css'
import '@shared/board-toolbar.css'
// App-specific lightweight overrides
import './styles/vue-overrides.css'
// Shared debug system: load at runtime (not bundled) so path matches deployed static layout
if (!window.Debug) {
	const s = document.createElement('script')
	s.src = '/shared/assets/js/debug.js'
	s.defer = true
	document.head.appendChild(s)
}

const app = createApp(App)
app.mount('#app')
