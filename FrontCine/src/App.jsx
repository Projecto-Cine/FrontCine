import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Cartelera from './pages/Cartelera'
import Merchandising from './pages/Merchandising'
import Peliculas from './pages/Peliculas'
import Productos from './pages/Productos'
import Clientes from './pages/Clientes'
import Horarios from './pages/Horarios'
import './styles/global.css'

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/cartelera" replace />} />
                <Route path="dashboard"     element={<Dashboard />} />
                <Route path="cartelera"     element={<Cartelera />} />
                <Route path="merchandising" element={<Merchandising />} />
                <Route path="clientes"      element={<Clientes />} />
                <Route path="horarios"      element={<Horarios />} />
                <Route path="peliculas"     element={<Peliculas />} />
                <Route path="productos"     element={<Productos />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </CartProvider>
    </ThemeProvider>
  )
}
