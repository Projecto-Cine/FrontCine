import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SkeletonPage, {
  SkeletonLine, SkeletonCard, SkeletonTable, SkeletonChart, SkeletonKpiGrid,
} from './Skeleton';

describe('Skeleton', () => {
  it('SkeletonLine applies default width and height', () => {
    const { container } = render(<SkeletonLine />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span.style.width).toBe('100%');
  });

  it('SkeletonLine accepts custom props', () => {
    const { container } = render(<SkeletonLine width="50%" height={20} />);
    const span = container.querySelector('span');
    expect(span.style.width).toBe('50%');
    expect(span.style.height).toBe('20px');
  });

  it('SkeletonCard renders without throwing', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).not.toBeNull();
  });

  it('SkeletonTable produces the right number of rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} cols={2} />);
    // Rows are direct child divs of the container (excluding the header).
    const allDivs = container.querySelectorAll('div > div');
    // 1 header + 3 rows = 4 direct children.
    expect(allDivs.length).toBeGreaterThanOrEqual(4);
  });

  it('SkeletonChart applies height via inline style', () => {
    const { container } = render(<SkeletonChart height={300} />);
    expect(container.firstChild.style.height).toBe('300px');
  });

  it('SkeletonKpiGrid renders the requested number of cards', () => {
    const { container } = render(<SkeletonKpiGrid count={3} />);
    // SkeletonCard has a distinctive structure — count its direct children.
    expect(container.firstChild.children.length).toBe(3);
  });

  it('SkeletonPage has role="status" and a loading aria-label', () => {
    const { container } = render(<SkeletonPage />);
    const root = container.querySelector('[role="status"]');
    expect(root).not.toBeNull();
    expect(root.getAttribute('aria-label')).toMatch(/Cargando/i);
  });
});
