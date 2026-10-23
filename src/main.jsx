// AUTHORS: Ankith Kumar (https://github.com/ankith-00) · Santhosh M (https://github.com/SanthoshMB08)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// CSS
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
