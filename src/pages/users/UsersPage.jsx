import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, Search, User, Mail, Calendar, Briefcase } from 'lucide-react';
import { workersService } from '../../services/workersService';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'CAJERO',
    hireDate: '',
    active: true
  });

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await workersService.getAll();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (e) {
      alert('Error al cargar trabajadores: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkers(); }, []);

  const filteredWorkers = workers.filter(w => 
    w.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    w.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    w.email?.toLowerCase().includes(search.toLowerCase()) ||
    w.role?.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = {
    total: workers.length,
    active: workers.filter(w => w.active).length,
    inactive: workers.filter(w => !w.active).length,
    roles: [...new Set(workers.map(w => w.role))].length
  };

  const openForm = (worker = null) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        firstName: worker.firstName || '',
        lastName: worker.lastName || '',
        email: worker.email || '',
        role: worker.role || 'CAJERO',
        hireDate: worker.hireDate || '',
        active: worker.active ?? true
      });
    } else {
      setEditingWorker(null);
      setFormData({ firstName: '', lastName: '', email: '', role: 'CAJERO', hireDate: '', active: true });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingWorker(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveWorker = async (e) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await workersService.update(editingWorker.id, formData);
      } else {
        await workersService.create(formData);
      }
      closeForm();
      loadWorkers();
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    }
  };

  const deleteWorker = async (id) => {
    if (!confirm('¿Eliminar trabajador?')) return;
    try {
      await workersService.remove(id);
      loadWorkers();
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Gestión de Trabajadores</h1>
        <button onClick={() => openForm()} className={styles.newBtn}>
          <Plus size={16} /> Nuevo Trabajador
        </button>
      </div>

      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <User size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.total}</div>
            <div className={styles.kpiLabel}>Total Trabajadores</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Briefcase size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.active}</div>
            <div className={styles.kpiLabel}>Activos</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <RefreshCw size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.inactive}</div>
            <div className={styles.kpiLabel}>Inactivos</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <Calendar size={20} />
          <div>
            <div className={styles.kpiValue}>{kpis.roles}</div>
            <div className={styles.kpiLabel}>Roles Diferentes</div>
          </div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, email o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button onClick={loadWorkers} disabled={loading} className={styles.reloadBtn}>
          <RefreshCw size={14} /> {loading ? 'Cargando...' : 'Recargar'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formOverlay}>
          <form onSubmit={saveWorker} className={styles.form}>
            <h2>{editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h2>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>Nombre</label>
                <input name="firstName" value={formData.firstName} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Apellido</label>
                <input name="lastName" value={formData.lastName} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} required className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Fecha Contratación</label>
                <input name="hireDate" type="date" value={formData.hireDate} onChange={handleInputChange} className={styles.formInput} />
              </div>
              <div>
                <label className={styles.formLabel}>Rol</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className={styles.formInput}>
                  <option value="CAJERO">Cajero</option>
                  <option value="LIMPIEZA">Limpieza</option>
                  <option value="SEGURIDAD">Seguridad</option>
                  <option value="GERENCIA">Gerencia</option>
                </select>
              </div>
              <div className={styles.checkboxWrap}>
                <input name="active" type="checkbox" checked={formData.active} onChange={handleInputChange} id="active" />
                <label htmlFor="active" className={styles.formLabel}>Activo</label>
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
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha Contratación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map(worker => (
              <tr key={worker.id} onClick={() => setSelectedWorker(selectedWorker?.id === worker.id ? null : worker)} className={selectedWorker?.id === worker.id ? styles.selectedRow : ''}>
                <td>{worker.firstName} {worker.lastName}</td>
                <td>{worker.email}</td>
                <td>{worker.role}</td>
                <td>{worker.hireDate || '-'}</td>
                <td>{worker.active ? 'Activo' : 'Inactivo'}</td>
                <td className={styles.actions}>
                  <button onClick={(e) => { e.stopPropagation(); openForm(worker); }} className={styles.editBtn}><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteWorker(worker.id); }} className={styles.deleteBtn}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filteredWorkers.length === 0 && (
              <tr><td colSpan="6" className={styles.emptyRow}>No hay trabajadores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedWorker && (
        <div className={styles.detail}>
          <div className={styles.detailHeader}>
            <div className={styles.detailAvatar}>{selectedWorker.firstName?.[0]}{selectedWorker.lastName?.[0]}</div>
            <div>
              <div className={styles.detailName}>{selectedWorker.firstName} {selectedWorker.lastName}</div>
              <div className={styles.detailEmail}>{selectedWorker.email}</div>
            </div>
          </div>
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Rol</div>
              <div className={styles.detailVal}>{selectedWorker.role}</div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Fecha Contratación</div>
              <div className={styles.detailVal}>{selectedWorker.hireDate || 'No especificada'}</div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Estado</div>
              <div className={styles.detailVal}>{selectedWorker.active ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailLbl}>Fecha Creación</div>
              <div className={styles.detailVal}>{selectedWorker.createdAt || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
