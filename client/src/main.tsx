import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './app/context/AuthContext.tsx'
import { AccountSettingsProvider } from './app/context/AccountSettingsContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AccountSettingsProvider>
        <App />
      </AccountSettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
