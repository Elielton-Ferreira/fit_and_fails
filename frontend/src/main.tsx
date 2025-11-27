import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { AuthProvider } from './modules/auth/AuthContext'
import { ThemeProvider } from './modules/theme/ThemeProvider'

const container = document.getElementById('root') as HTMLElement

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Registre o service worker apenas em produção para evitar cache quebrado em dev
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {
    // ignore erros de registro
  })
}
