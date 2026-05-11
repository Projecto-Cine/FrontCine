import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './i18n/LanguageContext';
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
import BoxOfficePage from './pages/pos/BoxOfficePage';
import ConcessionPage from './pages/pos/ConcessionPage';
import ShiftsPage from './pages/shifts/ShiftsPage';
import ClientsPage from './pages/clients/ClientsPage';

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
        <LanguageProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="box-office"   element={<BoxOfficePage />} />
              <Route path="concession"   element={<ConcessionPage />} />
              <Route path="movies"       element={<MoviesPage />} />
              <Route path="rooms"        element={<RoomsPage />} />
              <Route path="schedules"    element={<SchedulesPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="incidents"    element={<IncidentsPage />} />
              <Route path="reports"      element={<ReportsPage />} />
              <Route path="inventory"    element={<InventoryPage />} />
              <Route path="shifts"       element={<ShiftsPage />} />
              <Route path="employees"    element={<UsersPage />} />
              <Route path="clients"      element={<ClientsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
