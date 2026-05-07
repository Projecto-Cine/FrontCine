import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, Search, User, Mail, Calendar, GraduationCap, Ticket } from 'lucide-react';
import { usersService } from '../../services/usersService';
import styles from './ClientsPage.module.css';

export default function ClientsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    fechaNacimiento: '',
    esEstudiante: false,
    visitasAnio: 0
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      alert('Error al cargar usuarios: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = users.filter(u => 
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.apellido?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = {
    total: users.length,
    students: users.filter(u => u.esEstudiante).length,
    totalVisits: users.reduce((acc, u) => acc + (u.visitasAnio || 0), 0),
    fidelity: users.filter(u => u.visitasAnio >= 5).length
  };

  const openForm = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        fechaNacimiento: user.fechaNacimiento || '',
        esEstudiante: user.esEstudiante || false,
        visitasAnio: user.visitasAnio || 0
      });
    } else {
      setEditingUser(null);
      setFormData({ nombre: '', apellido: '', email: '', fechaNacimiento: '', esEstudiante: false, visitasAnio: 0 });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersService.update(editingUser.id, formData);
      } else {
        await usersService.create(formData);
      }
      closeForm();
      loadUsers();
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Eliminar usuario?')) return;
    try {
      await usersService.remove(id);
      loadUsers();
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Gestión de Clientes</h1>
        <button onClick={() => openForm()} className={styles.newBtn}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <User size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Clientes</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <GraduationCap size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.students}</div>
            <div className={styles.kpiLabel}>Estudiantes</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Ticket size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.totalVisits}</div>
            <div className={styles.kpiLabel}>Visitas Totales</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <RefreshCw size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.fidelity}</div>
            <div className={styles.kpiLabel}>Miembros Fidelidad</div>
          </div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button onClick={loadUsers} disabled={loading} className={styles.reloadBtn}>
          <RefreshCw size={14} /> {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formOverlay}>
          <form onSubmit={saveUser} className={styles.form}>
            <h2>{editingUser ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>Nombre</label>
                <input name="nombre" value={formData.nombre} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Apellido</label>
                <input name="apellido" value={formData.apellido} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Fecha Nacimiento</label>
                <input name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleInputChange} className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Visitas al año</label>
                <input name="visitasAnio" type="number" value={formData.visitasAnio} onChange={handleInputChange} min="0" className={styles.formInput} />
              </div>
              <div className={styles.checkboxWrap}>
                <input name="esEstudiante" type="checkbox" checked={formData.esEstudiante} onChange={handleInputChange} id="esEstudiante" />
                <label htmlFor="esEstudiante" className={styles.formLabel}>Es Estudiante</label>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn}>Guardar</button>
              <button type="button" onClick={closeForm} className={styles.cancelBtn}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Estudiante</th>
              <th>Visitas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)} className={selectedUser?.id === user.id ? styles.selectedRow : ''}>
                <td>{user.nombre}</td>
                <td>{user.apellido}</td>
                <td>{user.email}</td>
                <td>{user.esEstudiante ? 'Sí' : 'No'}</td>
                <td>{user.visitasAnio}</td>
                <td className={styles.actions}>
                  <button onClick={(e) => { e.stopPropagation(); openForm(user); }} className={styles.editBtn}><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }} className={styles.deleteBtn}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="6" className={styles.emptyRow}>No hay clientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className={styles.detail}>
          <div className={styles.detailHeader}>
            <div className={styles.detailAvatar}>{selectedUser.nombre?.[0]}{selectedUser.apellido?.[0]}</div>
            <div>
              <div className={styles.detailName}>{selectedUser.nombre} {selectedUser.apellido}</div>
              <div className={styles.detailEmail}>{selectedUser.email}</div>
            </div>
          </div>
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Fecha Nacimiento</div>
              <div className={styles.detailVal}>{selectedUser.fechaNacimiento || 'No especificada'}</div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Estudiante</div>
              <div className={styles.detailVal}>{selectedUser.esEstudiante ? 'Sí' : 'No'}</div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Visitas este año</div>
              <div className={styles.detailVal}>{selectedUser.visitasAnio}</div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Estado Fidelidad</div>
              <div className={styles.detailVal}>{selectedUser.visitasAnio >= 5 ? 'Miembro' : 'No miembro'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
