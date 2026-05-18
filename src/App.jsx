import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LanguageProvider } from './i18n/LanguageContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';

const Dashboard       = lazy(() => import('./pages/dashboard/Dashboard'));
const MoviesPage      = lazy(() => import('./pages/movies/MoviesPage'));
const RoomsPage       = lazy(() => import('./pages/rooms/RoomsPage'));
const SchedulesPage   = lazy(() => import('./pages/schedules/SchedulesPage'));
const ReservationsPage= lazy(() => import('./pages/reservations/ReservationsPage'));
const IncidentsPage   = lazy(() => import('./pages/incidents/IncidentsPage'));
const ReportsPage     = lazy(() => import('./pages/reports/ReportsPage'));
const InventoryPage   = lazy(() => import('./pages/inventory/InventoryPage'));

const BoxOfficePage   = lazy(() => import('./pages/pos/BoxOfficePage'));
const ConcessionPage  = lazy(() => import('./pages/pos/ConcessionPage'));
const ShiftsPage      = lazy(() => import('./pages/shifts/ShiftsPage'));
const ClientsPage     = lazy(() => import('./pages/clients/ClientsPage'));
const EmployeesPage   = lazy(() => import('./pages/employees/EmployeesPage'));

const ROLE_DEFAULTS = { CAJERO: '/box-office', LIMPIEZA: '/shifts', MANTENIMIENTO: '/shifts' };

function CatchAll() {
  const { user } = useAuth();
  return <Navigate to={ROLE_DEFAULTS[user?.role] ?? '/'} replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user, canAccess } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role) && !canAccess('*')) {
    return <Navigate to={ROLE_DEFAULTS[user.role] ?? '/shifts'} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={ROLE_DEFAULTS[user?.role] ?? '/'} replace /> : children;
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
            <Route path="/" element={<RoleRoute><MainLayout /></RoleRoute>}>
              <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
              <Route path="box-office" element={
                <RoleRoute allowedRoles={['GERENCIA','CAJERO']}>
                  <Suspense fallback={<PageLoader />}><BoxOfficePage /></Suspense>
                </RoleRoute>
              } />
              <Route path="concession" element={
                <RoleRoute allowedRoles={['GERENCIA','CAJERO']}>
                  <Suspense fallback={<PageLoader />}><ConcessionPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="reservations" element={
                <RoleRoute allowedRoles={['GERENCIA','CAJERO']}>
                  <Suspense fallback={<PageLoader />}><ReservationsPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="shifts" element={
                <RoleRoute allowedRoles={['GERENCIA','CAJERO','LIMPIEZA','MANTENIMIENTO']}>
                  <Suspense fallback={<PageLoader />}><ShiftsPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="movies" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><MoviesPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="rooms" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><RoomsPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="schedules" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><SchedulesPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="incidents" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><IncidentsPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="reports" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="inventory" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="employees" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><EmployeesPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="clients" element={
                <RoleRoute allowedRoles={['GERENCIA']}>
                  <Suspense fallback={<PageLoader />}><ClientsPage /></Suspense>
                </RoleRoute>
              } />
              <Route path="*" element={<CatchAll />} />
            </Route>
          </Routes>
        </AppProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
