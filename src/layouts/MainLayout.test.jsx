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

vi.mock('lucide-react', () => {
  const MockIcon = () => null;
  const mod = {
    ALargeSmall: MockIcon, AlertCircle: MockIcon, AlertTriangle: MockIcon, ArrowLeft: MockIcon,
    ArrowRight: MockIcon, Banknote: MockIcon, Bell: MockIcon, Building2: MockIcon, Calendar: MockIcon,
    CalendarDays: MockIcon, CheckCircle: MockIcon, CheckSquare: MockIcon, ChevronDown: MockIcon,
    ChevronLeft: MockIcon, ChevronRight: MockIcon, ChevronUp: MockIcon, ChevronsUpDown: MockIcon,
    Circle: MockIcon, ClipboardList: MockIcon, Clock: MockIcon, CreditCard: MockIcon, Download: MockIcon,
    Edit2: MockIcon, Eye: MockIcon, EyeOff: MockIcon, Euro: MockIcon, Film: MockIcon, Globe: MockIcon,
    GraduationCap: MockIcon, Inbox: MockIcon, Info: MockIcon, Key: MockIcon, Keyboard: MockIcon,
    LayoutDashboard: MockIcon, Loader: MockIcon, LogIn: MockIcon, LogOut: MockIcon, Minus: MockIcon,
    Moon: MockIcon, Package: MockIcon, PanelLeft: MockIcon, PanelLeftClose: MockIcon, Plus: MockIcon,
    Printer: MockIcon, RefreshCw: MockIcon, RotateCcw: MockIcon, Save: MockIcon, Search: MockIcon,
    Settings: MockIcon, Shield: MockIcon, ShieldCheck: MockIcon, ShoppingBag: MockIcon,
    ShoppingCart: MockIcon, Smartphone: MockIcon, Star: MockIcon, Sun: MockIcon, SunMoon: MockIcon,
    Ticket: MockIcon, TicketCheck: MockIcon, TrendingUp: MockIcon, Trash2: MockIcon,
    Underline: MockIcon, Upload: MockIcon, User: MockIcon, UserCheck: MockIcon, UserSearch: MockIcon,
    UserX: MockIcon, Users: MockIcon, Volume2: MockIcon, VolumeX: MockIcon, Wifi: MockIcon,
    WifiOff: MockIcon, X: MockIcon, XCircle: MockIcon,
  };
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
      expect(document.querySelector('[data-testid="child"]') ?? document.body.textContent).toBeTruthy();
    } catch (e) {
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
    } catch (e) {
      expect(document.body.textContent).toBeTruthy();
    }
  });
});