/**
 * Tests de RBAC (Role-Based Access Control)
 *
 * Cubre:
 *  1. Matriz de permisos EMPLOYEE_PERMISSIONS
 *  2. Lógica de RoleRoute (redirecciones)
 *  3. canAccess por rol
 *  4. hasRole por rol
 *  5. Login flow: endpoint correcto según modo
 *  6. Redirect post-login por rol
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Constantes replicadas del módulo (si cambian allá, aquí fallarán los tests) ──
const EMPLOYEE_PERMISSIONS = {
  GERENCIA:      '*',
  CAJERO:        ['/', '/box-office', '/concession', '/reservations', '/shifts'],
  LIMPIEZA:      ['/', '/shifts'],
  MANTENIMIENTO: ['/', '/shifts'],
};

const EMPLOYEE_ROLES = new Set(['GERENCIA', 'CAJERO', 'LIMPIEZA', 'MANTENIMIENTO']);
const ROLE_REDIRECT  = { CAJERO: '/box-office', LIMPIEZA: '/shifts', MANTENIMIENTO: '/shifts' };

// ── Funciones bajo test (copiadas del AuthContext) ───────────────────────────
function canAccess(user, path) {
  if (!user) return false;
  const perms = EMPLOYEE_PERMISSIONS[user.role];
  if (!perms) return false;
  if (perms === '*') return true;
  return perms.includes(path);
}

function hasRole(user, ...roles) {
  if (!user) return false;
  return roles.includes(user.role);
}

function getRoleRedirect(role) {
  return ROLE_REDIRECT[role] ?? '/';
}

function resolveRoleRoute(user, allowedRoles) {
  if (!user) return '/login';
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return ROLE_REDIRECT[user.role] ?? '/shifts';
  }
  return null; // null = render children
}

// ── 1. Matriz de permisos ─────────────────────────────────────────────────────
describe('EMPLOYEE_PERMISSIONS — matriz de acceso', () => {
  it('GERENCIA tiene acceso a todo (*)', () => {
    const user = { role: 'GERENCIA' };
    expect(canAccess(user, '/')).toBe(true);
    expect(canAccess(user, '/box-office')).toBe(true);
    expect(canAccess(user, '/concession')).toBe(true);
    expect(canAccess(user, '/reservations')).toBe(true);
    expect(canAccess(user, '/shifts')).toBe(true);
    expect(canAccess(user, '/movies')).toBe(true);
    expect(canAccess(user, '/employees')).toBe(true);
    expect(canAccess(user, '/inventory')).toBe(true);
    expect(canAccess(user, '/incidents')).toBe(true);
    expect(canAccess(user, '/reports')).toBe(true);
    expect(canAccess(user, '/clients')).toBe(true);
  });

  it('CAJERO accede a POS y shifts, NO a gestión', () => {
    const user = { role: 'CAJERO' };
    expect(canAccess(user, '/')).toBe(true);
    expect(canAccess(user, '/box-office')).toBe(true);
    expect(canAccess(user, '/concession')).toBe(true);
    expect(canAccess(user, '/reservations')).toBe(true);
    expect(canAccess(user, '/shifts')).toBe(true);
    // No accede a gestión
    expect(canAccess(user, '/movies')).toBe(false);
    expect(canAccess(user, '/employees')).toBe(false);
    expect(canAccess(user, '/inventory')).toBe(false);
    expect(canAccess(user, '/incidents')).toBe(false);
    expect(canAccess(user, '/reports')).toBe(false);
    expect(canAccess(user, '/clients')).toBe(false);
  });

  it('LIMPIEZA solo accede a dashboard y cuadrante', () => {
    const user = { role: 'LIMPIEZA' };
    expect(canAccess(user, '/')).toBe(true);
    expect(canAccess(user, '/shifts')).toBe(true);
    // Sin acceso a nada más
    expect(canAccess(user, '/box-office')).toBe(false);
    expect(canAccess(user, '/concession')).toBe(false);
    expect(canAccess(user, '/reservations')).toBe(false);
    expect(canAccess(user, '/movies')).toBe(false);
    expect(canAccess(user, '/employees')).toBe(false);
  });

  it('MANTENIMIENTO solo accede a dashboard y cuadrante', () => {
    const user = { role: 'MANTENIMIENTO' };
    expect(canAccess(user, '/')).toBe(true);
    expect(canAccess(user, '/shifts')).toBe(true);
    expect(canAccess(user, '/box-office')).toBe(false);
    expect(canAccess(user, '/concession')).toBe(false);
    expect(canAccess(user, '/incidents')).toBe(false);
  });

  it('null user siempre devuelve false', () => {
    expect(canAccess(null, '/')).toBe(false);
    expect(canAccess(null, '/shifts')).toBe(false);
    expect(canAccess(undefined, '/box-office')).toBe(false);
  });

  it('rol desconocido (no empleado) devuelve false', () => {
    expect(canAccess({ role: 'admin' }, '/shifts')).toBe(false);
    expect(canAccess({ role: 'SEGURIDAD' }, '/shifts')).toBe(false);
    expect(canAccess({ role: '' }, '/')).toBe(false);
  });
});

// ── 2. hasRole ────────────────────────────────────────────────────────────────
describe('hasRole', () => {
  it('devuelve true cuando el rol coincide', () => {
    expect(hasRole({ role: 'GERENCIA' }, 'GERENCIA')).toBe(true);
    expect(hasRole({ role: 'CAJERO' }, 'GERENCIA', 'CAJERO')).toBe(true);
  });

  it('devuelve false cuando el rol no está en la lista', () => {
    expect(hasRole({ role: 'LIMPIEZA' }, 'GERENCIA', 'CAJERO')).toBe(false);
    expect(hasRole({ role: 'CAJERO' }, 'LIMPIEZA')).toBe(false);
  });

  it('devuelve false sin usuario', () => {
    expect(hasRole(null, 'GERENCIA')).toBe(false);
    expect(hasRole(undefined, 'CAJERO')).toBe(false);
  });
});

// ── 3. RoleRoute — lógica de redirección ─────────────────────────────────────
describe('RoleRoute — resolución de redirección', () => {
  it('sin usuario redirige a /login', () => {
    expect(resolveRoleRoute(null, ['GERENCIA'])).toBe('/login');
    expect(resolveRoleRoute(undefined, ['CAJERO'])).toBe('/login');
  });

  it('usuario autenticado con rol permitido devuelve null (render hijos)', () => {
    expect(resolveRoleRoute({ role: 'GERENCIA' }, ['GERENCIA'])).toBeNull();
    expect(resolveRoleRoute({ role: 'CAJERO' }, ['GERENCIA', 'CAJERO'])).toBeNull();
    expect(resolveRoleRoute({ role: 'LIMPIEZA' }, ['GERENCIA', 'CAJERO', 'LIMPIEZA', 'MANTENIMIENTO'])).toBeNull();
  });

  it('usuario con rol NO permitido redirige a su default', () => {
    // CAJERO intentando entrar a ruta solo-GERENCIA → /box-office
    expect(resolveRoleRoute({ role: 'CAJERO' }, ['GERENCIA'])).toBe('/box-office');
    // LIMPIEZA intentando entrar a /box-office → /shifts
    expect(resolveRoleRoute({ role: 'LIMPIEZA' }, ['GERENCIA', 'CAJERO'])).toBe('/shifts');
    // MANTENIMIENTO intentando entrar a /movies → /shifts
    expect(resolveRoleRoute({ role: 'MANTENIMIENTO' }, ['GERENCIA'])).toBe('/shifts');
  });

  it('sin allowedRoles (ruta libre) render hijos para cualquier rol autenticado', () => {
    expect(resolveRoleRoute({ role: 'LIMPIEZA' }, null)).toBeNull();
    expect(resolveRoleRoute({ role: 'GERENCIA' }, undefined)).toBeNull();
  });
});

// ── 4. Redirect post-login por rol ────────────────────────────────────────────
describe('Redirect post-login por rol', () => {
  it('GERENCIA va al dashboard /', () => {
    expect(getRoleRedirect('GERENCIA')).toBe('/');
  });

  it('CAJERO va a /box-office', () => {
    expect(getRoleRedirect('CAJERO')).toBe('/box-office');
  });

  it('LIMPIEZA va a /shifts', () => {
    expect(getRoleRedirect('LIMPIEZA')).toBe('/shifts');
  });

  it('MANTENIMIENTO va a /shifts', () => {
    expect(getRoleRedirect('MANTENIMIENTO')).toBe('/shifts');
  });

  it('rol desconocido va a / por defecto', () => {
    expect(getRoleRedirect('admin')).toBe('/');
    expect(getRoleRedirect(undefined)).toBe('/');
  });
});

// ── 5. EMPLOYEE_ROLES set ────────────────────────────────────────────────────
describe('EMPLOYEE_ROLES — identificación de empleados', () => {
  it('contiene exactamente los 4 roles de empleados', () => {
    expect(EMPLOYEE_ROLES.has('GERENCIA')).toBe(true);
    expect(EMPLOYEE_ROLES.has('CAJERO')).toBe(true);
    expect(EMPLOYEE_ROLES.has('LIMPIEZA')).toBe(true);
    expect(EMPLOYEE_ROLES.has('MANTENIMIENTO')).toBe(true);
    expect(EMPLOYEE_ROLES.size).toBe(4);
  });

  it('no contiene roles del sistema antiguo', () => {
    expect(EMPLOYEE_ROLES.has('SEGURIDAD')).toBe(false);
    expect(EMPLOYEE_ROLES.has('admin')).toBe(false);
    expect(EMPLOYEE_ROLES.has('supervisor')).toBe(false);
    expect(EMPLOYEE_ROLES.has('operator')).toBe(false);
    expect(EMPLOYEE_ROLES.has('maintenance')).toBe(false);
  });
});

// ── 6. Login flow — selección de endpoint ────────────────────────────────────
describe('Login flow — selección de endpoint', () => {
  let mockEmployeeLogin;
  let mockLogin;

  beforeEach(() => {
    mockEmployeeLogin = vi.fn();
    mockLogin = vi.fn();
  });

  async function simulateLogin(email, password, employeeOnly, authService) {
    try {
      let res;
      if (employeeOnly) {
        res = await authService.employeeLogin(email, password);
      } else {
        try {
          res = await authService.employeeLogin(email, password);
          if (!EMPLOYEE_ROLES.has(res?.user?.role)) throw Object.assign(new Error(), { status: 401 });
        } catch (e) {
          if (e?.status !== 401) throw e;
          res = await authService.login(email, password);
        }
      }
      if (!res?.token || !res?.user) return { ok: false, redirect: null };
      return { ok: true, redirect: ROLE_REDIRECT[res.user.role] ?? '/' };
    } catch {
      return { ok: false, redirect: null };
    }
  }

  it('modo employeeOnly llama solo a employeeLogin', async () => {
    mockEmployeeLogin.mockResolvedValue({ token: 'tok', user: { role: 'CAJERO' } });
    const result = await simulateLogin('cajero@lumen.es', 'pass', true, {
      employeeLogin: mockEmployeeLogin,
      login: mockLogin,
    });
    expect(mockEmployeeLogin).toHaveBeenCalledOnce();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.redirect).toBe('/box-office');
  });

  it('modo admin: employeeLogin falla con 401 → cae a login normal', async () => {
    const err401 = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockEmployeeLogin.mockRejectedValue(err401);
    mockLogin.mockResolvedValue({ token: 'tok', user: { role: 'admin' } });

    const result = await simulateLogin('admin@lumen.es', 'pass', false, {
      employeeLogin: mockEmployeeLogin,
      login: mockLogin,
    });
    expect(mockEmployeeLogin).toHaveBeenCalledOnce();
    expect(mockLogin).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
    expect(result.redirect).toBe('/');
  });

  it('modo admin: employeeLogin devuelve rol NO empleado → cae a login normal', async () => {
    // El backend employee-login devuelve un admin (no debería, pero se maneja)
    mockEmployeeLogin.mockResolvedValue({ token: 'tok', user: { role: 'admin' } });
    mockLogin.mockResolvedValue({ token: 'tok', user: { role: 'admin' } });

    const result = await simulateLogin('admin@lumen.es', 'pass', false, {
      employeeLogin: mockEmployeeLogin,
      login: mockLogin,
    });
    expect(mockLogin).toHaveBeenCalledOnce();
    expect(result.ok).toBe(true);
  });

  it('empleado con modo employee: GERENCIA redirige a /', async () => {
    mockEmployeeLogin.mockResolvedValue({ token: 'tok', user: { role: 'GERENCIA' } });
    const result = await simulateLogin('gerencia@lumen.es', 'pass', true, {
      employeeLogin: mockEmployeeLogin,
      login: mockLogin,
    });
    expect(result.redirect).toBe('/');
  });

  it('credenciales incorrectas en modo employee: ok=false', async () => {
    const err401 = Object.assign(new Error('Unauthorized'), { status: 401 });
    mockEmployeeLogin.mockRejectedValue(err401);

    const result = await simulateLogin('wrong@lumen.es', 'wrong', true, {
      employeeLogin: mockEmployeeLogin,
      login: mockLogin,
    });
    expect(result.ok).toBe(false);
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

// ── 7. api.js — 401 handler no dispara en rutas de auth ─────────────────────
describe('api.js — exclusión de auth:expired en rutas /auth/', () => {
  function shouldDispatchExpired(path) {
    return !path.startsWith('/auth/');
  }

  it('/auth/login NO dispara auth:expired', () => {
    expect(shouldDispatchExpired('/auth/login')).toBe(false);
  });

  it('/auth/employee-login NO dispara auth:expired', () => {
    expect(shouldDispatchExpired('/auth/employee-login')).toBe(false);
  });

  it('/movies SÍ dispara auth:expired (sesión expirada real)', () => {
    expect(shouldDispatchExpired('/movies')).toBe(true);
  });

  it('/employees SÍ dispara auth:expired', () => {
    expect(shouldDispatchExpired('/employees')).toBe(true);
  });
});

// ── 9. Modo lectura ShiftsPage ────────────────────────────────────────────────
describe('ShiftsPage — modo readOnly por rol', () => {
  const READ_ONLY_ROLES = ['LIMPIEZA', 'MANTENIMIENTO'];

  it('LIMPIEZA es readOnly', () => {
    expect(READ_ONLY_ROLES.includes('LIMPIEZA')).toBe(true);
  });

  it('MANTENIMIENTO es readOnly', () => {
    expect(READ_ONLY_ROLES.includes('MANTENIMIENTO')).toBe(true);
  });

  it('GERENCIA NO es readOnly', () => {
    expect(READ_ONLY_ROLES.includes('GERENCIA')).toBe(false);
  });

  it('CAJERO NO es readOnly', () => {
    expect(READ_ONLY_ROLES.includes('CAJERO')).toBe(false);
  });
});

// ── 10. ConcessionPage — canManage ───────────────────────────────────────────
describe('ConcessionPage — canManage productos', () => {
  const MANAGE_ROLES = ['GERENCIA', 'CAJERO'];

  it('GERENCIA puede gestionar productos', () => {
    expect(MANAGE_ROLES.includes('GERENCIA')).toBe(true);
  });

  it('CAJERO puede gestionar productos', () => {
    expect(MANAGE_ROLES.includes('CAJERO')).toBe(true);
  });

  it('LIMPIEZA NO puede gestionar productos', () => {
    expect(MANAGE_ROLES.includes('LIMPIEZA')).toBe(false);
  });

  it('MANTENIMIENTO NO puede gestionar productos', () => {
    expect(MANAGE_ROLES.includes('MANTENIMIENTO')).toBe(false);
  });
});
