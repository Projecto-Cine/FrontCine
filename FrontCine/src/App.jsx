import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MoviesPage from './pages/movies/MoviesPage';
import RoomsPage from './pages/rooms/RoomsPage';
import SchedulesPage from './pages/schedules/SchedulesPage';
import ReservationsPage from './pages/reservations/ReservationsPage';
import IncidentsPage from './pages/incidents/IncidentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import InventoryPage from './pages/inventory/InventoryPage';
import UsersPage from './pages/users/UsersPage';
import AuditPage from './pages/audit/AuditPage';
import TaquillaPage from './pages/pos/TaquillaPage';
import CajaPage from './pages/pos/CajaPage';
import CuadrantePage from './pages/cuadrante/CuadrantePage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="taquilla" element={<TaquillaPage />} />
              <Route path="caja" element={<CajaPage />} />
              <Route path="peliculas" element={<MoviesPage />} />
              <Route path="salas" element={<RoomsPage />} />
              <Route path="horarios" element={<SchedulesPage />} />
              <Route path="reservas" element={<ReservationsPage />} />
              <Route path="incidencias" element={<IncidentsPage />} />
              <Route path="informes" element={<ReportsPage />} />
              <Route path="inventario" element={<InventoryPage />} />
              <Route path="cuadrante" element={<CuadrantePage />} />
              <Route path="usuarios" element={<UsersPage />} />
              <Route path="auditoria" element={<AuditPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
