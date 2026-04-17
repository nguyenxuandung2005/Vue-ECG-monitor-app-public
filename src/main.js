import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const mountTarget = document.querySelector('#app')

const renderFatalError = (message) => {
	if (!mountTarget) {
		return
	}

	mountTarget.innerHTML = `
		<section class="fatal-error">
			<h1>App Runtime Error</h1>
			<p>${message}</p>
			<p>Open browser console (F12) for technical details.</p>
		</section>
	`
}

try {
	const app = createApp(App)

	app.config.errorHandler = (error, _instance, info) => {
		console.error('Vue runtime error:', info, error)
		renderFatalError('A runtime exception occurred while rendering the ECG dashboard.')
	}

	app.mount('#app')
} catch (error) {
	console.error('Bootstrap failed:', error)
	renderFatalError('Failed to bootstrap app. Please check imports and runtime logs.')
}

window.addEventListener('unhandledrejection', (event) => {
	console.error('Unhandled promise rejection:', event.reason)
	renderFatalError('An async runtime error occurred. See console for details.')
})

window.addEventListener('error', (event) => {
	console.error('Global runtime error:', event.error || event.message)
})
