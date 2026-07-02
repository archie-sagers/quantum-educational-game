import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { applyTheme } from './styles/applyTheme'
import { reportAppError } from './stores/appError'

const app = createApp(App)
app.use(router)
app.config.errorHandler = (error, instance, info) => {
	console.error('Vue app error', error, instance, info)
	reportAppError(error, info)
}
applyTheme()
app.mount('#app')