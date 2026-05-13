import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './i18n/LanguageContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';

const Dashboard       = lazy(() => import('./pages/Dashboard'));
const MoviesPage      = lazy(() => import('./pages/movies/MoviesPage'));
const RoomsPage       = lazy(() => import('./pages/rooms/RoomsPage'));
const SchedulesPage   = lazy(() => import('./pages/schedules/SchedulesPage'));
const ReservationsPage= lazy(() => import('./pages/reservations/ReservationsPage'));
const IncidentsPage   = lazy(() => import('./pages/incidents/IncidentsPage'));
const ReportsPage     = lazy(() => import('./pages/reports/ReportsPage'));
const InventoryPage   = lazy(() => import('./pages/inventory/InventoryPage'));
const UsersPage       = lazy(() => import('./pages/users/UsersPage'));
const BoxOfficePage   = lazy(() => import('./pages/pos/BoxOfficePage'));
const ConcessionPage  = lazy(() => import('./pages/pos/ConcessionPage'));
const ShiftsPage      = lazy(() => import('./pages/shifts/ShiftsPage'));
const ClientsPage     = lazy(() => import('./pages/clients/ClientsPage'));
const EmployeesPage   = lazy(() => import('./pages/employees/EmployeesPage'));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: 'var(--text-3)', gap: 10 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span>Cargando...</span>
    </div>
  );
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
              <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="box-office"   element={<Suspense fallback={<PageLoader />}><BoxOfficePage /></Suspense>} />
              <Route path="concession"   element={<Suspense fallback={<PageLoader />}><ConcessionPage /></Suspense>} />
              <Route path="movies"       element={<Suspense fallback={<PageLoader />}><MoviesPage /></Suspense>} />
              <Route path="rooms"        element={<Suspense fallback={<PageLoader />}><RoomsPage /></Suspense>} />
              <Route path="schedules"    element={<Suspense fallback={<PageLoader />}><SchedulesPage /></Suspense>} />
              <Route path="reservations" element={<Suspense fallback={<PageLoader />}><ReservationsPage /></Suspense>} />
              <Route path="incidents"    element={<Suspense fallback={<PageLoader />}><IncidentsPage /></Suspense>} />
              <Route path="reports"      element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
              <Route path="inventory"    element={<Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>} />
              <Route path="shifts"       element={<Suspense fallback={<PageLoader />}><ShiftsPage /></Suspense>} />
              <Route path="employees"    element={<Suspense fallback={<PageLoader />}><EmployeesPage /></Suspense>} />
              <Route path="clients"      element={<Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
