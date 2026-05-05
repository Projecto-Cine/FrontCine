import { useState, useEffect } from 'react';
import { Plus, Edit2, AlertTriangle, Package } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { inventoryService } from '../../services/inventoryService';
import styles from './InventoryPage.module.css';

const CAT_COLOR = { Técnico: 'accent', Concesión: 'yellow', Oficina: 'default', Limpieza: 'green', Comercial: 'purple' };
const EMPTY = { name: '', category: 'Técnico', quantity: '', min_stock: '', unit: 'ud', location: '', supplier: '', price_unit: '' };

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filterCat, setFilterCat] = useState('all');
  const { toast } = useApp();

  useEffect(() => {
    inventoryService.getAll()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => toast('Error al cargar inventario.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setModal('form'); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const belowMin = items.filter(i => i.quantity <= i.min_stock);
  const categories = [...new Set(items.map(i => i.category))];
  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);

  const handleSave = async () => {
    if (!form.name.trim()) { toast('El nombre es obligatorio.', 'error'); return; }
    const payload = { ...form, quantity: Number(form.quantity), min_stock: Number(form.min_stock), price_unit: Number(form.price_unit) };
    try {
      if (editing) {
        const updated = await inventoryService.update(editing.id, payload);
        setItems(p => p.map(i => i.id === editing.id ? (updated ?? { ...i, ...payload }) : i));
        toast('Artículo actualizado.', 'success');
      } else {
        const created = await inventoryService.create(payload);
        setItems(p => [...p, created]);
        toast('Artículo añadido.', 'success');
      }
    } catch {
      toast('Error al guardar el artículo.', 'error');
    }
    setModal(null);
  };

  const stockStatus = (qty, min) => {
    if (qty <= 0) return { label: 'Sin stock', v: 'red' };
    if (qty <= min) return { label: 'Stock bajo', v: 'yellow' };
    return { label: 'OK', v: 'green' };
  };

  const columns = [
    { key: 'name', label: 'Artículo', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {row.quantity <= row.min_stock && <AlertTriangle size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />}
        <span style={{ fontWeight: 500 }}>{v}</span>
      </div>
    )},
    { key: 'category', label: 'Categoría', width: 110, render: v => <Badge variant={CAT_COLOR[v] || 'default'}>{v}</Badge> },
    { key: 'quantity', label: 'Cantidad', width: 90, render: (v, row) => (
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: v <= row.min_stock ? 'var(--yellow)' : 'var(--text-1)' }}>{v} {row.unit}</span>
    )},
    { key: 'min_stock', label: 'Mín.', width: 70, render: (v, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v} {row.unit}</span> },
    { key: 'location', label: 'Ubicación', render: v => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'supplier', label: 'Proveedor', render: v => <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'price_unit', label: 'P/ud.', width: 80, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>€{Number(v).toFixed(2)}</span> },
    { key: 'stock_status', label: 'Estado', width: 100, sortable: false, render: (_, row) => {
      const v = row.quantity;
      const s = stockStatus(v, row.min_stock);
      return <Badge variant={s.v} dot>{s.label}</Badge>;
    }},
  ];

  if (loading) return <div style={{ padding: 40, color: 'var(--text-3)', fontSize: 13 }}>Cargando inventario...</div>;

  return (
    <div className={styles.page}>
      <PageHeader
        title="Inventario"
        subtitle={`${items.length} artículos · ${belowMin.length} bajo mínimo`}
        actions={<Button icon={Plus} onClick={openCreate}>Añadir artículo</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label="Total artículos" value={items.length} icon={Package} color="accent" />
        <KPICard label="Bajo mínimo" value={belowMin.length} icon={AlertTriangle} color={belowMin.length > 0 ? 'yellow' : 'green'} />
        <KPICard label="Categorías" value={categories.length} icon={Package} color="cyan" />
        <KPICard label="Sin stock" value={items.filter(i => i.quantity <= 0).length} icon={AlertTriangle} color="red" />
      </div>

      {belowMin.length > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={14} />
          <span><strong>{belowMin.length} artículo{belowMin.length !== 1 ? 's' : ''}</strong> por debajo del stock mínimo: {belowMin.map(i => i.name).join(', ')}</span>
        </div>
      )}

      <div className={styles.filterRow}>
        <button className={`${styles.filterBtn} ${filterCat === 'all' ? styles.filterActive : ''}`} onClick={() => setFilterCat('all')}>
          Todos <span className={styles.filterCount}>{items.length}</span>
        </button>
        {categories.map(c => (
          <button key={c} className={`${styles.filterBtn} ${filterCat === c ? styles.filterActive : ''}`} onClick={() => setFilterCat(c)}>
            {c} <span className={styles.filterCount}>{items.filter(i => i.category === c).length}</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['name', 'category', 'location', 'supplier']}
        rowActions={(row) => <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} />}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? 'Editar artículo' : 'Nuevo artículo'}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? 'Guardar' : 'Añadir'}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="inv-name">Nombre *</label>
            <input id="inv-name" className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-cat">Categoría</label>
            <select id="inv-cat" className={styles.input} value={form.category} onChange={e => set('category', e.target.value)}>
              {['Técnico', 'Concesión', 'Oficina', 'Limpieza', 'Comercial'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-unit">Unidad</label>
            <input id="inv-unit" className={styles.input} value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="ud, saco, rollo..." />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-qty">Cantidad actual</label>
            <input id="inv-qty" className={styles.input} type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-min">Stock mínimo</label>
            <input id="inv-min" className={styles.input} type="number" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-price">Precio/unidad (€)</label>
            <input id="inv-price" className={styles.input} type="number" step="0.01" value={form.price_unit} onChange={e => set('price_unit', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-loc">Ubicación</label>
            <input id="inv-loc" className={styles.input} value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-sup">Proveedor</label>
            <input id="inv-sup" className={styles.input} value={form.supplier} onChange={e => set('supplier', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
