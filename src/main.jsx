import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import './index.css'
import { registerForgeFlowServiceWorker, setupPwaHeadTags } from './utils/pwaUtils.js'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento root não encontrado.')
}

function Root() {
  return import.meta.env.DEV ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  )
}

setupPwaHeadTags()

ReactDOM.createRoot(rootElement).render(<Root />)

registerForgeFlowServiceWorker()