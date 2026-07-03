import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './lib/AuthContext'
import { PermissionsProvider } from './lib/PermissionsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <PermissionsProvider>
        <App />
      </PermissionsProvider>
    </AuthProvider>
  </React.StrictMode>
)
