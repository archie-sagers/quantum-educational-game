import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { applyTheme } from './styles/applyTheme'

const app = createApp(App)
app.use(router)
applyTheme()
app.mount('#app')