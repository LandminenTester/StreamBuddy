import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useThemeStore } from './stores/theme.store'
import './assets/styles/tailwind.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

await useThemeStore().init()

app.mount('#app')
