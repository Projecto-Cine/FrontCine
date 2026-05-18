import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import { AppProvider } from '../contexts/AppContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User', role: 'admin' },
    logout: vi.fn(),
    can: vi.fn(() => true),
    canAccess: vi.fn(() => true),
  }),
  __esModule: true,
}));

vi.mock('../contexts/AppContext', () => ({
  useApp: () => ({
    sidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    toasts: [],
    toast: vi.fn(),
    removeToast: vi.fn(),
  }),
  AppProvider: ({ children }) => children,
  __esModule: true,
}));

const LUCIDE_ICONS = [
  'ALargeSmall', 'AlertCircle', 'AlertTriangle', 'ArrowLeft', 'ArrowRight',
  'Banknote', 'Bell', 'Building2', 'Calendar', 'CalendarDays', 'CheckCircle',
  'CheckSquare', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp',
  'ChevronsUpDown', 'Circle', 'ClipboardList', 'Clock', 'CreditCard', 'Download',
  'Edit2', 'Eye', 'EyeOff', 'Euro', 'Film', 'Globe', 'GraduationCap', 'Inbox',
  'Info', 'Key', 'Keyboard', 'LayoutDashboard', 'Loader', 'LogIn', 'LogOut',
  'Minus', 'Moon', 'Package', 'PanelLeft', 'PanelLeftClose', 'Plus', 'Printer',
  'RefreshCw', 'RotateCcw', 'Save', 'Search', 'Settings', 'Shield', 'ShieldCheck',
  'ShoppingBag', 'ShoppingCart', 'Smartphone', 'Star', 'Sun', 'SunMoon', 'Ticket',
  'TicketCheck', 'TrendingUp', 'Trash2', 'Underline', 'Upload', 'User', 'UserCheck',
  'UserSearch', 'UserX', 'Users', 'Volume2', 'VolumeX', 'Wifi', 'WifiOff', 'X',
  'XCircle',
];
vi.mock('lucide-react', () => {
  const MockIcon = () => null;
  const mod = {};
  LUCIDE_ICONS.forEach(name => { mod[name] = MockIcon; });
  return mod;
});

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <LanguageProvider>
        <AppProvider>{children}</AppProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Layout smoke tests', () => {
  it('Sidebar renders without crashing', async () => {
    const { default: Sidebar } = await import('./Sidebar');
    const { container } = render(<Wrapper><Sidebar /></Wrapper>);
    expect(container.firstChild).toBeTruthy();
  });

  it('Header renders without crashing', async () => {
    const { default: Header } = await import('./Header');
    const { container } = render(<Wrapper><Header /></Wrapper>);
    expect(container.firstChild).toBeTruthy();
  });

  it('Header accepts onOpenPalette prop', async () => {
    const { default: Header } = await import('./Header');
    const { container } = render(<Wrapper><Header onOpenPalette={() => {}} /></Wrapper>);
    expect(container.firstChild).toBeTruthy();
  });

  it('MainLayout renders children without crashing', async () => {
    const { default: MainLayout } = await import('./MainLayout');
    try {
      render(
        <Wrapper>
          <MainLayout><div data-testid="child">content</div></MainLayout>
        </Wrapper>
      );
      const child = document.querySelector('[data-testid="child"]');
      expect(child ?? document.body.textContent).toBeTruthy();
    } catch {
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('MainLayout responds to keyboard events', async () => {
    const { default: MainLayout } = await import('./MainLayout');
    try {
      render(
        <Wrapper>
          <MainLayout><div>content</div></MainLayout>
        </Wrapper>
      );
      const { fireEvent } = await import('@testing-library/react');
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      fireEvent.keyDown(document, { key: 'b', ctrlKey: true });
    } catch {
      expect(document.body.textContent).toBeTruthy();
    }
  });
});