import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import Navbar from './components/organisms/Navbar'
import DashboardPage from './pages/DashboardPage'
import ClientesPage from './pages/ClientesPage'
import TiendaPage from './pages/TiendaPage'
import TicketsPage from './pages/TicketsPage'
import HomePage from './pages/HomePage'
import './App.css'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <CartProvider>
      <Router>
        <div className="app-layout">
          <Navbar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
          <div
            className="app-content"
            style={{ marginLeft: sidebarCollapsed ? '64px' : '220px' }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/tienda" element={<TiendaPage />} />
              <Route path="/entradas" element={<TicketsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </CartProvider>
  )
}

export default App
