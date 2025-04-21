import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Add error handling wrapper
const root = ReactDOM.createRoot(document.getElementById('root'))

// Error boundary to prevent white screen
try {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Error rendering app:', error)
  root.render(
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Something went wrong</h1>
      <p>The application failed to load. Please try again or contact support.</p>
      <button onClick={() => window.location.reload()}>Reload App</button>
      <pre style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        {error.toString()}
      </pre>
    </div>
  )
}
