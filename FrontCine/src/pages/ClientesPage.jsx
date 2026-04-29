import { useState } from 'react'
import Badge from '../components/atoms/Badge'
import Button from '../components/atoms/Button'

const CUSTOMERS = [
  {
    id: 1,
    name: 'Ana García Martínez',
    email: 'ana.garcia@email.com',
    phone: '+34 612 345 678',
    visits: 15,
    totalSpent: 245.50,
    lastVisit: '25/4/2026',
    status: 'Cliente Frecuente',
  },
  {
    id: 2,
    name: 'Carlos Rodríguez López',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 623 456 789',
    visits: 8,
    totalSpent: 156.00,
    lastVisit: '20/4/2026',
    status: 'Regular',
  },
  {
    id: 3,
    name: 'Maria Sánchez Pérez',
    email: 'maria.sanchez@email.com',
    phone: '+34 634 567 890',
    visits: 23,
    totalSpent: 387.90,
    lastVisit: '27/4/2026',
    status: 'Cliente Frecuente',
  },
  {
    id: 4,
    name: 'Juan Fernández Torres',
    email: 'juan.fernandez@email.com',
    phone: '+34 645 678 901',
    visits: 5,
    totalSpent: 89.50,
    lastVisit: '15/4/2026',
    status: 'Regular',
  },
  {
    id: 5,
    name: 'Laura Martín Gómez',
    email: 'laura.martin@email.com',
    phone: '+34 656 789 012',
    visits: 12,
    totalSpent: 198.75,
    lastVisit: '28/4/2026',
    status: 'Cliente Frecuente',
  },
]

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = CUSTOMERS.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCustomers = CUSTOMERS.length
  const frequentCustomers = CUSTOMERS.filter(c => c.status === 'Cliente Frecuente').length
  const totalIncome = CUSTOMERS.reduce((sum, c) => sum + c.totalSpent, 0)

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Gestión de Clientes</h1>
          <div className="grid-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '0.5rem' }}>Total Clientes</p>
              <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700' }}>{totalCustomers}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⭐</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '0.5rem' }}>Clientes Frecuentes</p>
              <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700' }}>{frequentCustomers}</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '0.5rem' }}>Ingresos Totales</p>
              <p style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--gold)' }}>{totalIncome.toFixed(2)}€</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="section" style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Buscar clientes por nombre o email..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '100%' }}
          />
        </div>

        {/* Table */}
        <div className="section">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Visitas</th>
                  <th>Gasto Total</th>
                  <th>Última Visita</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: '600' }}>{customer.name}</td>
                    <td>
                      <div style={{ fontSize: 'var(--text-sm)', marginBottom: '0.25rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', marginRight: '0.25rem' }} />
                        {customer.email}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        {customer.phone}
                      </div>
                    </td>
                    <td>{customer.visits}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: '600' }}>{customer.totalSpent.toFixed(2)}€</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{customer.lastVisit}</td>
                    <td>
                      <Badge color={customer.status === 'Cliente Frecuente' ? 'gold' : 'teal'}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" size="sm" style={{ padding: '0.25rem' }}>✉️</Button>
                        <Button variant="ghost" size="sm" style={{ padding: '0.25rem' }}>📱</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No se encontraron clientes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
