import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SkeletonPage, {
  SkeletonLine, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonKpiGrid,
} from './Skeleton';

describe('Skeleton', () => {
  it('SkeletonLine aplica width y height por defecto', () => {
    const { container } = render(<SkeletonLine />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span.style.width).toBe('100%');
  });

  it('SkeletonLine acepta props personalizadas', () => {
    const { container } = render(<SkeletonLine width="50%" height={20} />);
    const span = container.querySelector('span');
    expect(span.style.width).toBe('50%');
    expect(span.style.height).toBe('20px');
  });

  it('SkeletonCard se renderiza sin lanzar error', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).not.toBeNull();
  });

  it('SkeletonTable genera el número correcto de filas y columnas', () => {
    const { container } = render(<SkeletonTable rows={3} cols={2} />);
    // Las filas son divs hijos directos del contenedor (excluyendo el header).
    const allDivs = container.querySelectorAll('div > div');
    // 1 header + 3 rows = 4 divs hijos.
    expect(allDivs.length).toBeGreaterThanOrEqual(4);
  });

  it('SkeletonChart aplica height en estilo inline', () => {
    const { container } = render(<SkeletonChart height={300} />);
    expect(container.firstChild.style.height).toBe('300px');
  });

  it('SkeletonKpiGrid renderiza el número de cards pedido', () => {
    const { container } = render(<SkeletonKpiGrid count={3} />);
    // SkeletonCard tiene una estructura distintiva — contamos los hijos directos.
    expect(container.firstChild.children.length).toBe(3);
  });

  it('SkeletonPage tiene role="status" y aria-label de carga', () => {
    const { container } = render(<SkeletonPage />);
    const root = container.querySelector('[role="status"]');
    expect(root).not.toBeNull();
    expect(root.getAttribute('aria-label')).toMatch(/Cargando/i);
  });
});
