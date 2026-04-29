import Badge from '../atoms/Badge'

export default function CustomerRow({ customer }) {
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--gold-bg)', color: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: 'var(--text-sm)', flexShrink: 0,
          }}>
            {customer.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{customer.name}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{customer.email}</p>
          </div>
        </div>
      </td>
      <td>{customer.phone ?? '—'}</td>
      <td>
        <Badge color={customer.active ? 'green' : 'gray'}>
          {customer.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </td>
      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        {customer.joined ?? '—'}
      </td>
      <td className="gold" style={{ fontWeight: '600' }}>
        {customer.totalSpent != null ? `${customer.totalSpent.toFixed(2)} €` : '—'}
      </td>
    </tr>
  )
}
