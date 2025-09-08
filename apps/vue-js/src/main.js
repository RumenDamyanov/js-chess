import { createApp } from 'vue'
import App from './App.vue'
// Ensure global theme utility is loaded before app mounts
import '@shared/theme-toggle.js'
// Shared global styles: point to SCSS bundle entry so Vite compiles it (was referencing missing app-bundle.css)
import './styles/bundle.scss'
// Shared debug system is loaded via index.html script tag

const app = createApp(App)
app.mount('#app')
