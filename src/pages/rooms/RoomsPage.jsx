import { useEffect, useState } from 'react';
import { Building2, Edit2, Plus, Trash2, Users } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { theatersService } from '../../services/roomsService';
import styles from './RoomsPage.module.css';

const EMPTY = { name: '', capacity: '' };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useApp();

  useEffect(() => {
    theatersService.getAll()
      .then(data => setRooms(data ?? []))
      .catch(() => toast('No se pudieron cargar las salas del backend.', 'error'));
  }, [toast]);

  const openEdit = (room) => { setEditing(room); setForm({ ...room }); setModal('form'); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.capacity) {
      toast('Nombre y capacidad son obligatorios.', 'error');
      return;
    }

    const payload = { name: form.name.trim(), capacity: Number(form.capacity) };
    if (editing) {
      const saved = await theatersService.update(editing.id, payload);
      setRooms(prev => prev.map(room => room.id === editing.id ? saved : room));
      toast('Sala actualizada.', 'success');
    } else {
      const saved = await theatersService.create(payload);
      setRooms(prev => [...prev, saved]);
      toast('Sala creada.', 'success');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    await theatersService.remove(deleteTarget.id);
    setRooms(prev => prev.filter(room => room.id !== deleteTarget.id));
    toast('Sala eliminada.', 'warning');
    setDeleteTarget(null);
  };

  const totalCap = rooms.reduce((sum, room) => sum + Number(room.capacity ?? 0), 0);

  const columns = [
    { key: 'name', label: 'Sala', render: value => <span style={{ fontWeight: 500 }}>{value}</span> },
    { key: 'capacity', label: 'Capacidad', width: 120, render: value => <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{value} but.</span> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Salas"
        subtitle={`${rooms.length} salas · ${totalCap} butacas`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva sala</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Salas" value={rooms.length} icon={Building2} color="green" />
        <KPICard label="Capacidad total" value={totalCap} icon={Users} color="accent" sub="butacas" />
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchKeys={['name']}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} title="Editar" />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title="Eliminar" />
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? 'Editar sala' : 'Nueva sala'}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label}>Nombre de sala *</label>
            <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Sala 1" />
          </div>
          <div>
            <label className={styles.label}>Capacidad (butacas) *</label>
            <input className={styles.input} type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Eliminar sala" danger
        message={`¿Eliminar "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar" />
    </div>
  );
}
