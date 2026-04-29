/**
 * Badge atom
 * color: 'gold' | 'green' | 'red' | 'teal' | 'blue' | 'orange' | 'gray'
 */
export default function Badge({ children, color = 'gold', className = '' }) {
  return (
    <span className={`badge badge-${color} ${className}`.trim()}>
      {children}
    </span>
  )
}
