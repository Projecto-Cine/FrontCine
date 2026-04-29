import { formatPrice, formatDate, formatDateTime } from '../utils/formatters'

describe('formatPrice', () => {
  test('formats integer', () => {
    expect(formatPrice(10)).toBe('10.00€')
  })
  test('formats decimal', () => {
    expect(formatPrice(6.5)).toBe('6.50€')
  })
  test('formats zero', () => {
    expect(formatPrice(0)).toBe('0.00€')
  })
  test('returns 0.00€ for non-number', () => {
    expect(formatPrice(undefined)).toBe('0.00€')
    expect(formatPrice(null)).toBe('0.00€')
  })
  test('rounds to 2 decimals', () => {
    expect(formatPrice(1.999)).toBe('2.00€')
  })
})

describe('formatDate', () => {
  test('returns empty for falsy', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
  test('formats a valid date string', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })
})

describe('formatDateTime', () => {
  test('returns empty for falsy date', () => {
    expect(formatDateTime(null, '10:00')).toBe('')
  })
  test('combines date and time', () => {
    const result = formatDateTime('2024-01-15', '10:00')
    expect(result).toContain('10:00')
  })
})
