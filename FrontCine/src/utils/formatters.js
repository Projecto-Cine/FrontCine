export const formatPrice = (price) =>
  typeof price === 'number' ? `${price.toFixed(2)}€` : '0.00€'

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return ''
  return `${formatDate(dateStr)} ${timeStr || ''}`
}
