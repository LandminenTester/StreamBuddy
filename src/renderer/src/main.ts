import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'
import { useThemeStore } from './stores/theme.store'
import { useLocaleStore } from './stores/locale.store'
import './assets/styles/tailwind.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Theme und Sprache vor dem Mount laden, damit weder ein Farb- noch ein
// Sprachwechsel nach dem ersten Frame sichtbar wird.
await Promise.all([useThemeStore().init(), useLocaleStore().init()])

app.mount('#app')
