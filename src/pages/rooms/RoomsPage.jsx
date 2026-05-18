import { useEffect, useState } from 'react';
import { Building2, Edit2, Plus, Trash2, Users } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { theatersService } from '../../services/roomsService';
import styles from './RoomsPage.module.css';

const THEATER_TYPES = ['STANDARD', 'IMAX', '4DX', 'VIP', 'DOLBY', '3D'];
const EMPTY = { name: '', capacity: '', numRows: '', numColumns: '', type: 'STANDARD' };

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast } = useApp();
  const { t } = useLanguage();

  useEffect(() => {
    theatersService.getAll()
      .then(data => setRooms(data ?? []))
      .catch(() => toast('No se pudieron cargar las salas del backend.', 'error'));
  }, [toast]);

  const openEdit = (room) => { setEditing(room); setForm({ ...room }); setErrors({}); setModal('form'); };
  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal('form'); };
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const validateField = (name, value) => {
    const required = name === 'name' ? !String(value).trim() : !value;
    setErrors(e => ({ ...e, [name]: required ? t('common.fieldRequired') : undefined }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.capacity) {
      toast('Nombre y capacidad son obligatorios.', 'error');
      return;
    }
    const payload = {
      name:       form.name.trim(),
      capacity:   Number(form.capacity),
      type:       form.type || 'STANDARD',
      ...(form.numRows    ? { numRows:    Number(form.numRows)    } : {}),
      ...(form.numColumns ? { numColumns: Number(form.numColumns) } : {}),
    };
    try {
      if (editing) {
        const saved = await theatersService.update(editing.id, payload);
        setRooms(prev => prev.map(room => room.id === editing.id ? (saved ?? { ...room, ...payload }) : room));
        toast('Sala actualizada. Los asientos se han sincronizado con las sesiones futuras.', 'success');
      } else {
        const saved = await theatersService.create(payload);
        setRooms(prev => [...prev, saved]);
        toast('Sala creada.', 'success');
      }
      setModal(null);
    } catch {
      toast('Error al guardar la sala. Comprueba los datos e inténtalo de nuevo.', 'error');
    }
  };

  const handleDelete = async () => {
    await theatersService.remove(deleteTarget.id);
    setRooms(prev => prev.filter(room => room.id !== deleteTarget.id));
    toast('Sala eliminada.', 'warning');
    setDeleteTarget(null);
  };

  const totalCap = rooms.reduce((sum, room) => sum + Number(room.totalSeats ?? room.capacity ?? 0), 0);

  const columns = [
    { key: 'name', label: t('rooms.col.name'), render: (value, row) => (
      <span style={{ fontWeight: 500 }}>
        {value}
        {row.type && row.type !== 'STANDARD' && (
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: 4 }}>{row.type}</span>
        )}
      </span>
    )},
    { key: 'totalSeats', label: t('rooms.col.capacity'), width: 180, render: (value, row) => (
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
        {value ?? row.capacity ?? 0} but.
        {row.numRows && row.numColumns && (
          <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>({row.numRows}×{row.numColumns})</span>
        )}
      </span>
    )},
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('rooms.title')}
        subtitle={t('rooms.subtitle', { count: rooms.length, seats: totalCap })}
        actions={<Button icon={Plus} onClick={openCreate}>{t('rooms.createBtn')}</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label={t('rooms.kpi.rooms')}         value={rooms.length} icon={Building2} color="green" />
        <KPICard label={t('rooms.kpi.totalCapacity')} value={totalCap}     icon={Users}     color="accent" sub={t('rooms.kpi.seats')} />
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchKeys={['name']}
        rowActions={(row) => (
          <div style={{ display: 'flex', gap: 2 }}>
            <Button variant="ghost" size="sm" icon={Edit2}  onClick={() => openEdit(row)}        title={t('common.edit')} />
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} title={t('common.delete')} />
          </div>
        )}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? t('rooms.modalEdit') : t('rooms.modalCreate')}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? t('common.save') : t('common.create')}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="room-type">Tipo de sala</label>
            <select id="room-type" className={styles.input} value={form.type || 'STANDARD'} onChange={e => set('type', e.target.value)}>
              {THEATER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="room-name">{t('rooms.form.name')}</label>
            <input id="room-name"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={form.name} onChange={e => set('name', e.target.value)}
              onBlur={e => validateField('name', e.target.value)}
              placeholder={t('rooms.form.namePh')}
              aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-room-name' : undefined}
            />
            {errors.name && <span id="err-room-name" role="alert" className={styles.fieldError}>{errors.name}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="room-cap">{t('rooms.form.capacity')}</label>
            <input id="room-cap"
              className={`${styles.input} ${errors.capacity ? styles.inputError : ''}`}
              type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}
              onBlur={e => validateField('capacity', e.target.value)}
              aria-invalid={!!errors.capacity} aria-describedby={errors.capacity ? 'err-room-cap' : undefined}
            />
            {errors.capacity && <span id="err-room-cap" role="alert" className={styles.fieldError}>{errors.capacity}</span>}
          </div>
          <div>
            <label className={styles.label} htmlFor="room-rows">Filas</label>
            <input id="room-rows"
              className={styles.input}
              type="number" min="1" placeholder="Ej: 10"
              value={form.numRows} onChange={e => set('numRows', e.target.value)}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="room-cols">Columnas</label>
            <input id="room-cols"
              className={styles.input}
              type="number" min="1" placeholder="Ej: 15"
              value={form.numColumns} onChange={e => set('numColumns', e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('rooms.deleteTitle')} danger
        message={t('rooms.deleteMsg', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')} />
    </div>
  );
}
