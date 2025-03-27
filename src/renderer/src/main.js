import { mount } from 'svelte'
import { initializeI18n } from './utils/lang'

// Main css
import './assets/main.css'

// Initialize i18n
initializeI18n()

// Main app
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')
})

export default app
