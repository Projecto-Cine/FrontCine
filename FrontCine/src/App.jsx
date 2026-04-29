import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import Navbar from './components/organisms/Navbar'
import Footer from './components/organisms/Footer'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ClientesPage from './pages/ClientesPage'
import TiendaPage from './pages/TiendaPage'
import TicketsPage from './pages/TicketsPage'
import './App.css'

function App() {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/tienda" element={<TiendaPage />} />
          <Route path="/entradas" element={<TicketsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Router>
    </CartProvider>
  )
}

export default App
