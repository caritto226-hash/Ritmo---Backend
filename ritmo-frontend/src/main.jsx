import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Tema guardado antes del primer render: las pantallas públicas (login, registro, recuperación)
// no pasan por MainLayout, que es el que lo mantiene al día con el botón de la luna.
try {
  if (localStorage.getItem('ritmo-theme') === 'dark') document.documentElement.dataset.theme = 'dark'
} catch {
  // Sin almacenamiento se usa el tema claro.
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)