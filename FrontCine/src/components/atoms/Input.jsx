/**
 * Input atom
 */
export default function Input({ label, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`input ${className}`.trim()} {...props} />
    </div>
  )
}
