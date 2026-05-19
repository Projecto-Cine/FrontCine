import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Package, ShoppingCart, X } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import KPICard from '../../components/shared/KPICard';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { inventoryService } from '../../services/inventoryService';
import SkeletonPage from '../../components/shared/Skeleton';
import styles from './InventoryPage.module.css';

const CAT_COLOR = { Bebida: 'blue', Comida: 'pink', Merchandise: 'purple' };
const EMPTY = { name: '', category: 'Bebida', quantity: '', min_stock: '', unit: 'ud', supplier: '', price_unit: '' };
const CATEGORY_KEYS = ['Bebida', 'Comida', 'Merchandise'];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filterCat, setFilterCat] = useState('all');
  const [stockModal, setStockModal] = useState(null); // 'belowMin' | 'noStock'
  const [orderModal, setOrderModal] = useState(null);
  const [orderQtys, setOrderQtys] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newSupplier, setNewSupplier] = useState(false);
  const { toast } = useApp();
  const { t } = useLanguage();

  useEffect(() => {
    inventoryService.getAll()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => toast('Error al cargar inventario.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setNewSupplier(false); setModal('form'); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setNewSupplier(false); setModal('form'); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const belowMin = items.filter(i => i.quantity <= i.min_stock);
  const categories = [...new Set(items.map(i => i.category).filter(c => c != null))];
  const suppliers = [...new Set(items.map(i => i.supplier).filter(Boolean))];
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
    } catch (err) {
      console.error('Save error:', err);
      toast(`Error al guardar: ${err.message || 'desconocido'}`, 'error');
    }
    setModal(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await inventoryService.remove(deleteTarget.id);
      setItems(p => p.filter(i => i.id !== deleteTarget.id));
      toast('Producto eliminado ✓', 'success');
    } catch {
      toast('Error al eliminar el producto.', 'error');
    }
    setDeleteTarget(null);
  };

  const initOrderModal = (mode) => {
    const products = mode === 'belowMin' ? belowMin : items.filter(i => i.quantity <= 0);
    const defaults = {};
    products.forEach(p => { defaults[p.id] = Math.max(p.min_stock - p.quantity, 1); });
    setOrderQtys(defaults);
    setStockModal(null);
    setOrderModal(mode);
  };

  const setOQty = (id, val) => setOrderQtys(p => ({ ...p, [id]: Math.max(0, Number(val) || 0) }));

  const exportOrder = () => {
    const products = orderModal === 'belowMin' ? belowMin : items.filter(i => i.quantity <= 0);
    const grouped = {};
    products.forEach(p => {
      const sup = p.supplier || 'Sin proveedor';
      if (!grouped[sup]) grouped[sup] = [];
      grouped[sup].push(p);
    });
    let text = 'PEDIDO\n' + '='.repeat(30) + '\n';
    Object.entries(grouped).forEach(([supplier, prods]) => {
      text += `\nProveedor: ${supplier}\n${'.'.repeat(20)}\n`;
      prods.forEach(p => {
        const qty = orderQtys[p.id] || 0;
        text += `  ${p.name}  ->  ${qty} ${p.unit}\n`;
      });
    });
    navigator.clipboard.writeText(text).then(() => { toast('Pedido copiado al portapapeles.', 'success'); setOrderModal(null); });
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
    { key: 'supplier', label: 'Proveedor', width: 140, render: v => <span style={{ fontSize: 11, color: v ? 'var(--text-2)' : 'var(--text-3)' }}>{v || '—'}</span> },
    { key: 'quantity', label: t('inventory.col.quantity'), width: 90, render: (v, row) => (
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: v <= row.min_stock ? 'var(--yellow)' : 'var(--text-1)' }}>{v} {row.unit}</span>
    )},
    { key: 'min_stock', label: t('inventory.col.min'), width: 70, render: (v, row) => <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{v} {row.unit}</span> },
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
        <KPICard label={t('inventory.kpi.totalItems')} value={items.length}
          icon={Package} color="accent" />
        <KPICard label={t('inventory.kpi.categories')} value={categories.length}
          icon={Package} color="accent" />
        {categories.map(c => (
          <KPICard key={c} label={t(`inventory.categories.${c}`) || c}
            value={items.filter(i => i.category === c).length}
            icon={Package} color={CAT_COLOR[c] || 'default'} />
        ))}
        <KPICard label={t('inventory.kpi.belowMin')} value={belowMin.length}
          icon={AlertTriangle} color={belowMin.length > 0 ? 'yellow' : 'green'}
          onClick={belowMin.length > 0 ? () => setStockModal('belowMin') : undefined} />
        <KPICard label={t('inventory.kpi.noStock')}
          value={items.filter(i => i.quantity <= 0).length}
          icon={AlertTriangle} color="red"
          onClick={() => setStockModal('noStock')} />
      </div>

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
        searchKeys={['name', 'category', 'supplier']}
        rowActions={(row) => <><Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(row)} /><Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(row)} style={{ color: 'var(--red)' }} /></>}
      />

      {/* ── Stock detail modal ── */}
      {stockModal && (
        <div className={styles.modalBackdrop} onClick={e => e.target === e.currentTarget && setStockModal(null)}>
          <div className={styles.orderModalBox} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <AlertTriangle size={15} />
                {stockModal === 'belowMin' ? 'Productos bajo mínimo' : 'Productos sin stock'}
              </h3>
              <button className={styles.modalClose} onClick={() => setStockModal(null)} aria-label="Cerrar"><X size={15} /></button>
            </div>
            <div className={styles.orderBody}>
              {Object.entries(
                (stockModal === 'belowMin' ? belowMin : items.filter(i => i.quantity <= 0))
                  .reduce((acc, p) => {
                    const sup = p.supplier || 'Sin proveedor';
                    if (!acc[sup]) acc[sup] = [];
                    acc[sup].push(p);
                    return acc;
                  }, {})
              ).map(([supplier, prods]) => (
                <div key={supplier} className={styles.supplierGroup}>
                  <div className={styles.supplierTitle}>{supplier}</div>
                  {prods.map(item => (
                    <div key={item.id} className={styles.stockItem}>
                      <div className={styles.stockItemInfo}>
                        <span className={styles.stockItemName}>{item.name}</span>
                        <span className={styles.stockItemMeta}>
                          {item.category} · {item.quantity}/{item.min_stock} {item.unit}
                          {item.quantity > 0 && stockModal === 'belowMin' && ` · Faltan ${item.min_stock - item.quantity}`}
                          {item.quantity <= 0 && ` · Necesita ${item.min_stock}`}
                        </span>
                      </div>
                      <Badge variant={item.quantity <= 0 ? 'red' : 'yellow'} dot>
                        {item.quantity <= 0 ? 'Sin stock' : 'Bajo mínimo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}
              {(stockModal === 'belowMin' ? belowMin : items.filter(i => i.quantity <= 0)).length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: 16 }}>No hay productos en esta categoría.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setStockModal(null)}>Cerrar</button>
              <button className={styles.modalSave} onClick={() => initOrderModal(stockModal)}>
                <ShoppingCart size={14} /> Hacer pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order modal ── */}
      {orderModal && (
        <div className={styles.modalBackdrop} onClick={e => e.target === e.currentTarget && setOrderModal(null)}>
          <div className={styles.orderModalBox} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <ShoppingCart size={15} />
                {orderModal === 'belowMin' ? 'Hacer pedido — bajo mínimo' : 'Hacer pedido — sin stock'}
              </h3>
              <button className={styles.modalClose} onClick={() => setOrderModal(null)} aria-label="Cerrar"><X size={15} /></button>
            </div>
            <div className={styles.orderBody}>
              {Object.entries(
                (orderModal === 'belowMin' ? belowMin : items.filter(i => i.quantity <= 0))
                  .reduce((acc, p) => {
                    const sup = p.supplier || 'Sin proveedor';
                    if (!acc[sup]) acc[sup] = [];
                    acc[sup].push(p);
                    return acc;
                  }, {})
              ).map(([supplier, prods]) => (
                <div key={supplier} className={styles.supplierGroup}>
                  <div className={styles.supplierTitle}>{supplier}</div>
                  {prods.map(item => (
                    <div key={item.id} className={styles.orderItem}>
                      <div className={styles.orderItemInfo}>
                        <div className={styles.orderItemName}>{item.name}</div>
                        <div className={styles.orderItemMeta}>{item.category} · {item.quantity}/{item.min_stock} {item.unit} · €{Number(item.price_unit).toFixed(2)}</div>
                      </div>
                      <input className={styles.qtyInput} type="number" min="0" value={orderQtys[item.id] ?? 0}
                        onChange={e => setOQty(item.id, e.target.value)} />
                    </div>
                  ))}
                </div>
              ))}
              {(orderModal === 'belowMin' ? belowMin : items.filter(i => i.quantity <= 0)).length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: 16 }}>No hay productos en esta categoría.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setOrderModal(null)}>Cancelar</button>
              <button className={styles.modalSave} onClick={exportOrder}>
                Exportar pedido
              </button>
            </div>
          </div>
        </div>
      )}

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
            <label className={styles.label} htmlFor="inv-sup">{t('inventory.form.supplier')}</label>
            {newSupplier ? (
              <input id="inv-sup" className={styles.input} value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Nombre del nuevo proveedor" autoFocus />
            ) : (
              <select id="inv-sup" className={styles.input} value={form.supplier || ''} onChange={e => {
                if (e.target.value === '__new__') { setNewSupplier(true); set('supplier', ''); }
                else set('supplier', e.target.value);
              }}>
                <option value="">Seleccionar proveedor</option>
                {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__new__">+ Añadir nuevo proveedor</option>
              </select>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Eliminar producto" message={`¿Eliminar "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar" danger onConfirm={handleDelete} />
    </div>
  );
}
