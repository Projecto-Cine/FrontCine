import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TermsConditionsPage from './pages/TermsConditionsPage.jsx'

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
const isTermsPage = normalizedPath === '/terminos'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isTermsPage ? <TermsConditionsPage /> : <App />}
  </StrictMode>,
)
