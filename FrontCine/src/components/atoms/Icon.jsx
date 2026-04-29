/**
 * Icon atom — wraps inline SVG children with consistent sizing.
 */
export default function Icon({ children, size = 20, color = 'currentColor', style = {}, ...props }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
