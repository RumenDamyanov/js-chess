import { createApp } from 'vue'
import App from './App.vue'
// Ensure global theme utility is loaded before app mounts
import '@shared/theme-toggle.js'
// Shared global styles: point to SCSS bundle entry so Vite compiles it (was referencing missing app-bundle.css)
import './styles/bundle.scss'
// Shared debug system: load at runtime (not bundled) so path matches deployed static layout
if (!window.Debug) {
	const s = document.createElement('script')
	s.src = '/shared/assets/js/debug.js'
	s.defer = true
	document.head.appendChild(s)
}

const app = createApp(App)
app.mount('#app')
