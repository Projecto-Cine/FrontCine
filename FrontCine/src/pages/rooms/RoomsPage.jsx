import { useState, useEffect } from 'react';
import { Plus, Edit2, Wrench, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { Building2, Layers, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { roomsService } from '../../services/roomsService';
import styles from './RoomsPage.module.css';

const STATUS_MAP = { active: { label: 'Operativa', v: 'green' }, maintenance: { label: 'Mantenimiento', v: 'yellow' }, blocked: { label: 'Bloqueada', v: 'red' } };
const EMPTY = { name: '', capacity: '', format: '2D', status: 'active', screen: '', audio: '', last_maintenance: '' };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [maintTarget, setMaintTarget] = useState(null);
  const { toast } = useApp();

  useEffect(() => {
    roomsService.getAll().then(setRooms).catch(() => {});
  }, []);

  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal('form'); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.capacity) { toast('Nombre y capacidad son obligatorios.', 'error'); return; }
    if (editing) {
      setRooms(p => p.map(r => r.id === editing.id ? { ...r, ...form, capacity: Number(form.capacity) } : r));
      toast('Sala actualizada.', 'success');
      roomsService.update(editing.id, { ...form, capacity: Number(form.capacity) }).catch(() => toast('Error al guardar en el servidor.', 'error'));
    } else {
      setRooms(p => [...p, { ...form, id: Date.now(), capacity: Number(form.capacity), seats_available: Number(form.capacity) }]);
      toast('Sala creada.', 'success');
      roomsService.create({ ...form, capacity: Number(form.capacity) }).catch(() => toast('Error al guardar en el servidor.', 'error'));
    }
    setModal(null);
  };

  const toggleMaintenance = () => {
    const newStatus = maintTarget.status === 'maintenance' ? 'active' : 'maintenance';
    setRooms(p => p.map(r => r.id === maintTarget.id
      ? { ...r, status: newStatus, seats_available: newStatus === 'maintenance' ? 0 : r.capacity }
      : r));
    toast(`Sala ${maintTarget.status === 'maintenance' ? 'reactivada' : 'en mantenimiento'}.`, 'warning');
    roomsService.update(maintTarget.id, { ...maintTarget, status: newStatus }).catch(() => {});
    setMaintTarget(null);
  };

  const operative = rooms.filter(r => r.status === 'active');
  const totalCap = rooms.filter(r => r.status === 'active').reduce((s, r) => s + r.capacity, 0);

  const columns = [
    { key: 'name', label: 'Sala', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'format', label: 'Formato', width: 100, render: v => <Badge variant="default">{v}</Badge> },
    { key: 'capacity', label: 'Capacidad', width: 100, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{v} but.</span> },
    { key: 'screen', label: 'Pantalla' },
    { key: 'audio', label: 'Audio' },
    { key: 'last_maintenance', label: 'Último mant.', width: 120, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'status', label: 'Estado', width: 130, render: v => <Badge variant={STATUS_MAP[v]?.v || 'default'} dot>{STATUS_MAP[v]?.label || v}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Salas"
        subtitle={`${operative.length} operativas · ${totalCap} butacas disponibles`}
        actions={<Button icon={Plus} onClick={openCreate}>Nueva sala</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Salas operativas" value={operative.length} icon={Building2} color="green" sub={`de ${rooms.length} total`} />
        <KPICard label="Capacidad total" value={totalCap} icon={Users} color="accent" sub="butacas disponibles" />
        <KPICard label="En mantenimiento" value={rooms.filter(r => r.status === 'maintenance').length} icon={Wrench} color="yellow" />
        <KPICard label="Formatos" value={[...new Set(rooms.map(r => r.format))].length} icon={Layers} color="cyan" sub="tipos de sala" />
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchKeys={['name', 'format', 'audio']}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} title="Editar" />
            <Button variant="ghost" size="sm"
              icon={row.status === 'maintenance' ? CheckCircle : Wrench}
              onClick={() => setMaintTarget(row)}
              title={row.status === 'maintenance' ? 'Reactivar' : 'Poner en mantenimiento'} />
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
            <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Sala 1 — IMAX" />
          </div>
          <div>
            <label className={styles.label}>Capacidad (butacas) *</label>
            <input className={styles.input} type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
          </div>
          <div>
            <label className={styles.label}>Formato</label>
            <select className={styles.input} value={form.format} onChange={e => set('format', e.target.value)}>
              {['2D', '3D', 'IMAX', '4DX', 'IMAX 3D', '2D/3D'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Pantalla</label>
            <input className={styles.input} value={form.screen} onChange={e => set('screen', e.target.value)} placeholder="Ej: Pantalla plana 20m" />
          </div>
          <div>
            <label className={styles.label}>Audio</label>
            <input className={styles.input} value={form.audio} onChange={e => set('audio', e.target.value)} placeholder="Ej: Dolby Atmos" />
          </div>
          <div>
            <label className={styles.label}>Estado</label>
            <select className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Operativa</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="blocked">Bloqueada</option>
            </select>
          </div>
          <div>
            <label className={styles.label}>Último mantenimiento</label>
            <input className={styles.input} type="date" value={form.last_maintenance} onChange={e => set('last_maintenance', e.target.value)} />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!maintTarget} onClose={() => setMaintTarget(null)} onConfirm={toggleMaintenance}
        title={maintTarget?.status === 'maintenance' ? 'Reactivar sala' : 'Poner en mantenimiento'}
        message={maintTarget?.status === 'maintenance'
          ? `¿Reactivar "${maintTarget?.name}"? Las sesiones podrán programarse de nuevo.`
          : `¿Poner "${maintTarget?.name}" en mantenimiento? Se bloqueará para nuevas sesiones.`}
        confirmLabel={maintTarget?.status === 'maintenance' ? 'Reactivar' : 'Confirmar'}
        danger={maintTarget?.status !== 'maintenance'}
      />
    </div>
  );
}
