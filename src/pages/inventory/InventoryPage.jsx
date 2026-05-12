import { useState, useEffect } from 'react';
import { Plus, Edit2, AlertTriangle, Package } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { inventoryService } from '../../services/inventoryService';
import SkeletonPage from '../../components/shared/Skeleton';
import styles from './InventoryPage.module.css';

const CAT_COLOR = { Técnico: 'accent', Concesión: 'yellow', Oficina: 'default', Limpieza: 'green', Comercial: 'purple' };
const EMPTY = { name: '', category: 'Técnico', quantity: '', min_stock: '', unit: 'ud', location: '', supplier: '', price_unit: '' };
const CATEGORY_KEYS = ['Técnico', 'Concesión', 'Oficina', 'Limpieza', 'Comercial'];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filterCat, setFilterCat] = useState('all');
  const { toast } = useApp();
  const { t } = useLanguage();

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
        toast(t('inventory.modalEdit') + ' ✓', 'success');
      } else {
        const created = await inventoryService.create(payload);
        setItems(p => [...p, created]);
        toast(t('inventory.modalCreate') + ' ✓', 'success');
      }
    } catch {
      toast('Error al guardar el artículo.', 'error');
    }
    setModal(null);
  };

  const stockStatus = (qty, min) => {
    if (qty <= 0) return { label: t('inventory.stock.none'), v: 'red' };
    if (qty <= min) return { label: t('inventory.stock.low'), v: 'yellow' };
    return { label: t('inventory.stock.ok'), v: 'green' };
  };

  const columns = [
    { key: 'name', label: t('inventory.col.item'), render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {row.quantity <= row.min_stock && <AlertTriangle size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />}
        <span style={{ fontWeight: 500 }}>{v}</span>
      </div>
    )},
    { key: 'category', label: t('inventory.col.category'), width: 110, render: v => <Badge variant={CAT_COLOR[v] || 'default'}>{t(`inventory.categories.${v}`) || v}</Badge> },
    { key: 'quantity', label: t('inventory.col.quantity'), width: 90, render: (v, row) => (
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: v <= row.min_stock ? 'var(--yellow)' : 'var(--text-1)' }}>{v} {row.unit}</span>
    )},
    { key: 'min_stock', label: t('inventory.col.min'), width: 70, render: (v, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v} {row.unit}</span> },
    { key: 'location', label: t('inventory.col.location'), render: v => <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{v}</span> },
    { key: 'supplier', label: t('inventory.col.supplier'), render: v => <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{v}</span> },
    { key: 'price_unit', label: t('inventory.col.priceUnit'), width: 80, render: v => <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>€{Number(v).toFixed(2)}</span> },
    { key: 'stock_status', label: t('inventory.col.status'), width: 100, sortable: false, render: (_, row) => {
      const s = stockStatus(row.quantity, row.min_stock);
      return <Badge variant={s.v} dot>{s.label}</Badge>;
    }},
  ];

  if (loading) return <SkeletonPage />;

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('inventory.title')}
        subtitle={t('inventory.subtitle', { count: items.length, belowMin: belowMin.length })}
        actions={<Button icon={Plus} onClick={openCreate}>{t('inventory.createBtn')}</Button>}
      />

      <div className={styles.kpiRow}>
        <KPICard label={t('inventory.kpi.totalItems')} value={items.length}           icon={Package}       color="accent" />
        <KPICard label={t('inventory.kpi.belowMin')}   value={belowMin.length}        icon={AlertTriangle} color={belowMin.length > 0 ? 'yellow' : 'green'} />
        <KPICard label={t('inventory.kpi.categories')} value={categories.length}      icon={Package}       color="cyan" />
        <KPICard label={t('inventory.kpi.noStock')}    value={items.filter(i => i.quantity <= 0).length} icon={AlertTriangle} color="red" />
      </div>

      {belowMin.length > 0 && (
        <div className={styles.alertBanner}>
          <AlertTriangle size={14} />
          <span><strong>{t('inventory.alert.belowMin', { count: belowMin.length })}</strong>: {belowMin.map(i => i.name).join(', ')}</span>
        </div>
      )}

      <div className={styles.filterRow}>
        <button className={`${styles.filterBtn} ${filterCat === 'all' ? styles.filterActive : ''}`} onClick={() => setFilterCat('all')}>
          {t('inventory.filter.all')} <span className={styles.filterCount}>{items.length}</span>
        </button>
        {categories.map(c => (
          <button key={c} className={`${styles.filterBtn} ${filterCat === c ? styles.filterActive : ''}`} onClick={() => setFilterCat(c)}>
            {t(`inventory.categories.${c}`) || c} <span className={styles.filterCount}>{items.filter(i => i.category === c).length}</span>
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['name', 'category', 'location', 'supplier']}
        rowActions={(row) => <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} />}
      />

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editing ? t('inventory.modalEdit') : t('inventory.modalCreate')}
        footer={<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSave}>{editing ? t('common.save') : t('inventory.add')}</Button>
        </div>}
      >
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="inv-name">{t('inventory.form.name')}</label>
            <input id="inv-name" className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-cat">{t('inventory.form.category')}</label>
            <select id="inv-cat" className={styles.input} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORY_KEYS.map(c => <option key={c} value={c}>{t(`inventory.categories.${c}`) || c}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-unit">{t('inventory.form.unit')}</label>
            <input id="inv-unit" className={styles.input} value={form.unit} onChange={e => set('unit', e.target.value)} placeholder={t('inventory.form.unitPh')} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-qty">{t('inventory.form.quantity')}</label>
            <input id="inv-qty" className={styles.input} type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-min">{t('inventory.form.minStock')}</label>
            <input id="inv-min" className={styles.input} type="number" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-price">{t('inventory.form.priceUnit')}</label>
            <input id="inv-price" className={styles.input} type="number" step="0.01" value={form.price_unit} onChange={e => set('price_unit', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-loc">{t('inventory.form.location')}</label>
            <input id="inv-loc" className={styles.input} value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div>
            <label className={styles.label} htmlFor="inv-sup">{t('inventory.form.supplier')}</label>
            <input id="inv-sup" className={styles.input} value={form.supplier} onChange={e => set('supplier', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
