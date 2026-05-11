import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Minus, Plus, X, CreditCard, Banknote, Smartphone,
  ShoppingCart, CheckCircle, Printer, Trash2, Search,
  RotateCcw, Loader, Settings, Edit2, Save, Upload,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { salesService }     from '../../services/salesService';
import { uploadImage }      from '../../services/cloudinaryService';
import { useApp }  from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
<<<<<<< HEAD
import StripePaymentModal   from '../../components/shared/StripePaymentModal';
=======
import { useLanguage } from '../../i18n/LanguageContext';
>>>>>>> b80d8bd (feat(i18n): traducción completa de todas las páginas y componentes)
import styles from './ConcessionPage.module.css';

const CATEGORY_EMOJI = { Palomitas: '🍿', Bebidas: '🥤', Snacks: '🌮', Combos: '🎁', Concesión: '🛒' };
const DEFAULT_CATEGORIES = ['Palomitas', 'Bebidas', 'Snacks', 'Combos', 'Concesión'];
const getEmoji = (p) => p.emoji ?? CATEGORY_EMOJI[p.category] ?? '🔲';
const getPrice = (p) => p.price ?? p.price_unit ?? 0;

const EMPTY_PRODUCT = { name: '', category: 'Palomitas', price: '', description: '', emoji: '', imageUrl: '', quantity: '' };
const MANAGE_ROLES  = ['admin', 'supervisor', 'operator'];

const IMG_KEY = 'lumen_product_images';
const getStoredImgs = () => { try { return JSON.parse(localStorage.getItem(IMG_KEY) ?? '{}'); } catch { return {}; } };
const saveStoredImg = (id, url) => { try { const s = getStoredImgs(); if (url) s[String(id)] = url; else delete s[String(id)]; localStorage.setItem(IMG_KEY, JSON.stringify(s)); } catch {} };
const mergeImgs = (prods) => { const s = getStoredImgs(); return prods.map(p => ({ ...p, imageUrl: s[String(p.id)] || p.imageUrl || '' })); };


function generateReceiptId() {
  return 'RCP-' + Date.now().toString(36).toUpperCase();
}

export default function CajaPage() {
  const { toast } = useApp();
  const { user }  = useAuth();
  const { t }     = useLanguage();

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [category, setCategory]       = useState('Todo');
  const [search, setSearch]           = useState('');
  const [cart, setCart]               = useState([]);
  const [payMethod, setPayMethod]     = useState('card');
  const [cashGiven, setCashGiven]     = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [receipt, setReceipt]         = useState(null);
  const [paying, setPaying]           = useState(false);
  const [stripeData, setStripeData]   = useState(null);
  const pendingReceipt                = useRef(null);
  const searchRef = useRef(null);

  // Gestión de productos (solo admin/supervisor/operator)
  const canManage    = MANAGE_ROLES.includes((user?.role ?? '').toLowerCase());
  const [showManager,     setShowManager]     = useState(false);
  const [productForm,     setProductForm]     = useState(null); // null = lista, objeto = formulario
  const [editingProduct,  setEditingProduct]  = useState(null);
  const [savingProduct,   setSavingProduct]   = useState(false);
  const [deletingId,      setDeletingId]      = useState(null);
  const [uploadingImg,    setUploadingImg]    = useState(false);
  const fileInputRef = useRef(null);
  const setField = (k, v) => setProductForm(prev => ({ ...prev, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      setField('imageUrl', url);
      toast('Imagen subida correctamente.', 'success');
    } catch (err) {
      toast(err.message ?? 'Error al subir la imagen.', 'error');
    }
    setUploadingImg(false);
  };

  // Normaliza campos que el backend puede devolver con distintos nombres
  const normalizeProduct = (p) => ({
    ...p,
    imageUrl: p.imageUrl ?? p.image_url ?? p.poster ?? '',
    description: p.description ?? p.desc ?? '',
  });

  // Cargar productos de concesión desde el backend
  useEffect(() => {
    inventoryService.getAll()
      .then(data => {
        const items = (Array.isArray(data) ? data : []).map(normalizeProduct);
        // Mostrar solo productos de concesión con stock disponible
        const concession = items.filter(p => p.quantity === undefined || p.quantity > 0);
        setProducts(mergeImgs(concession));
        // Categoría por defecto: la primera disponible
        const cats = [...new Set(concession.map(p => p.category))];
        if (cats.length > 0 && !cats.includes('Todo')) setCategory('Todo');
      })
      .catch(() => toast('Error al cargar productos.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const CATEGORIES = ['Todo', ...new Set(products.map(p => p.category))];

  // Atajos de teclado: F2 = buscar, F4 = cobrar, Esc = vaciar carrito
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4' && cart.length > 0) { e.preventDefault(); setShowPayModal(true); }
      if (e.key === 'Escape' && !showPayModal && !receipt) setCart([]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart, showPayModal, receipt]);

  const filteredProducts = products.filter(p => {
    if (category !== 'Todo' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const changeQty = useCallback((productId, delta) => {
    setCart(prev =>
      prev.map(i => i.product.id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter(i => i.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const total      = cart.reduce((s, i) => s + getPrice(i.product) * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const change     = payMethod === 'cash' && cashGiven ? (parseFloat(cashGiven) - total).toFixed(2) : null;

  const buildReceipt = useCallback((lines = cart) => ({
    id:        generateReceiptId(),
    lines:     [...lines],
    total,
    payMethod,
    cashGiven: payMethod === 'cash' ? parseFloat(cashGiven) : null,
    change:    change ? parseFloat(change) : null,
    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date:      new Date().toLocaleDateString('es-ES'),
  }), [cart, total, payMethod, cashGiven, change]);

  const finishSale = useCallback((rec) => {
    setReceipt(rec);
    setShowPayModal(false);
    setCart([]);
    setCashGiven('');
  }, []);

  const handlePay = async () => {
    if (payMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total)) {
      toast('Importe entregado insuficiente.', 'error');
      return;
    }
    if (!user?.id) {
      toast('No se pudo identificar el usuario de caja.', 'error');
      return;
    }
    setPaying(true);
    const rec = buildReceipt();
    try {
      const sale = await salesService.createConcessionSale({
        items: cart.map(({ product, qty }) => ({
          merchandiseId: product.id,
          name:       product.name,
          quantity:   qty,
          unit_price: getPrice(product),
        })),
        total,
        payment_method: payMethod === 'online' ? 'QR' : payMethod.toUpperCase(),
        userId:         user.id,
        cash_given:     payMethod === 'cash' ? parseFloat(cashGiven) : null,
        change:         change ? parseFloat(change) : null,
        cashier_id:     user?.id ?? null,
      });
      if (payMethod === 'online') {
        const purchaseId = sale?.purchaseId ?? sale?.purchase?.id;
        if (!purchaseId) throw new Error('El backend no devuelve un purchaseId para pagos Stripe de concesión.');
        const intent = await salesService.createPaymentIntent(purchaseId, total);
        pendingReceipt.current = { rec, purchaseId };
        setStripeData({
          clientSecret:   intent.clientSecret,
          publishableKey: intent.publishableKey,
          purchaseId,
        });
        setShowPayModal(false);
        return;
      }
      finishSale(rec);
    } catch {
      toast('Error al procesar el cobro. Inténtalo de nuevo.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleStripeSuccess = useCallback(async () => {
    try {
      await salesService.confirmPurchaseAfterStripe(stripeData.purchaseId);
    } catch { /* el webhook también confirma la venta en backend */ }
    if (pendingReceipt.current?.rec) finishSale(pendingReceipt.current.rec);
    setStripeData(null);
    pendingReceipt.current = null;
  }, [stripeData, finishSale]);

  const handleStripeCancel = useCallback(async () => {
    try {
      await salesService.cancelPurchase(stripeData.purchaseId);
    } catch { /* ignorar si el backend ya la canceló o no aplica */ }
    setStripeData(null);
    pendingReceipt.current = null;
    setPaying(false);
  }, [stripeData]);

  const resetAll = () => {
    setReceipt(null);
    setCart([]);
    setCashGiven('');
    setPayMethod('card');
  };

  const openNewProduct  = () => { setEditingProduct(null); setProductForm({ ...EMPTY_PRODUCT }); };
  const openEditProduct = (p) => { setEditingProduct(p);   setProductForm({ ...EMPTY_PRODUCT, ...p, price: String(getPrice(p)), quantity: String(p.quantity ?? '') }); };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price) { toast('Nombre y precio son obligatorios.', 'error'); return; }
    setSavingProduct(true);
    const payload = {
      name:        productForm.name.trim(),
      category:    productForm.category,
      price:       Number(productForm.price),
      description: productForm.description,
      emoji:       productForm.emoji,
      imageUrl:    productForm.imageUrl,
      quantity:    productForm.quantity !== '' ? Number(productForm.quantity) : undefined,
    };
    try {
      if (editingProduct) {
        const saved = await inventoryService.update(editingProduct.id, payload);
        const merged = { ...editingProduct, ...(saved ?? {}), ...payload };
        saveStoredImg(editingProduct.id, payload.imageUrl);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? merged : p));
        toast(`"${payload.name}" actualizado.`, 'success');
      } else {
        const saved = await inventoryService.create(payload);
        const created = { ...(saved ?? {}), ...payload, id: saved?.id ?? Date.now() };
        saveStoredImg(created.id, payload.imageUrl);
        setProducts(prev => [...prev, created]);
        toast(`"${payload.name}" añadido.`, 'success');
      }
      setProductForm(null);
      setEditingProduct(null);
    } catch (err) {
      toast(err?.status === 401 ? 'Sesión expirada.' : 'Error al guardar el producto.', 'error');
    }
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (product) => {
    setDeletingId(product.id);
    try {
      await inventoryService.remove(product.id);
      saveStoredImg(product.id, '');
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast(`"${product.name}" eliminado.`, 'warning');
      if (editingProduct?.id === product.id) { setProductForm(null); setEditingProduct(null); }
    } catch {
      toast('Error al eliminar el producto.', 'error');
    }
    setDeletingId(null);
  };

<<<<<<< HEAD
  useEffect(() => {
    if (!receipt) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [receipt]);

  const PAY_LABEL = { card: 'Tarjeta', cash: 'Efectivo', online: 'QR / App' };
=======
  const PAY_METHODS = [
    { id: 'card',   label: t('concession.pay_methods.card'),   Icon: CreditCard },
    { id: 'cash',   label: t('concession.pay_methods.cash'),   Icon: Banknote   },
    { id: 'online', label: t('concession.pay_methods.online'), Icon: Smartphone },
  ];
  const PAY_LABEL = {
    card:   t('concession.pay_methods.card'),
    cash:   t('concession.pay_methods.cash'),
    online: t('concession.pay_methods.online'),
  };
>>>>>>> b80d8bd (feat(i18n): traducción completa de todas las páginas y componentes)

  return (
    <div className={styles.shell}>
      {/* ── LEFT — productos ─────────────────────────────── */}
      <div className={styles.left}>
        <div className={styles.topBar}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              ref={searchRef}
              className={styles.searchInput}
              placeholder={t('concession.search')}
              value={search}
              onChange={e => { setSearch(e.target.value); setCategory('Todo'); }}
            />
            {search && <button className={styles.searchClear} onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
          <div className={styles.shortcuts}>
            {t('concession.shortcuts').split(' · ').map((s, i) => [
              <kbd key={`k${i}`}>{['F2','F4','Esc'][i]}</kbd>,
              ` ${s} `,
            ])}
          </div>
          {canManage && (
            <button className={styles.manageBtn} onClick={() => { setShowManager(true); setProductForm(null); setEditingProduct(null); }} title={t('concession.manage')}>
              <Settings size={14} />
              <span>{t('concession.manage')}</span>
            </button>
          )}
        </div>

        <div className={styles.catTabs}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${styles.catTab} ${category === c && !search ? styles.catActive : ''}`}
              onClick={() => { setCategory(c); setSearch(''); }}
            >
              {CATEGORY_EMOJI[c] ?? '🔲'} {c === 'Todo' ? t('concession.all') : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
            <Loader size={18} /> {t('common.loading')}
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.product.id === product.id);
              return (
                <button
                  key={product.id}
                  className={`${styles.productCard} ${inCart ? styles.productInCart : ''}`}
                  onClick={() => addToCart(product)}
                >
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.name} className={styles.productImg} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} />
                    : null}
                  <span className={styles.productEmoji} style={product.imageUrl ? { display: 'none' } : {}}>{getEmoji(product)}</span>
                  <span className={styles.productName}>{product.name}</span>
                  {product.description && <span className={styles.productDesc}>{product.description}</span>}
                  <span className={styles.productPrice}>€{getPrice(product).toFixed(2)}</span>
                  {inCart && <span className={styles.productQtyBadge}>{inCart.qty}</span>}
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className={styles.noResults}>{t('concession.noProducts', { query: search || (category === 'Todo' ? t('concession.all') : category) })}</div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT — carrito ─────────────────────────────── */}
      <div className={styles.right}>
        <div className={styles.cartHeader}>
          <ShoppingCart size={15} />
          <span>{t('concession.order')}</span>
          <span className={styles.cartCount}>{t('concession.items', { n: totalItems })}</span>
          {cart.length > 0 && (
            <button className={styles.clearBtn} onClick={() => setCart([])} title={t('concession.cancel')}>
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <div className={styles.cartLines}>
          {cart.length === 0 ? (
            <div className={styles.cartEmpty}>
              <ShoppingCart size={30} opacity={0.15} />
              <p>{t('concession.tapToAdd')}</p>
              <p className={styles.cartEmptySub}>{t('concession.pressSearch')}</p>
            </div>
          ) : (
            cart.map(({ product, qty }) => (
              <div key={product.id} className={styles.cartLine}>
                <span className={styles.lineEmoji}>{getEmoji(product)}</span>
                <div className={styles.lineInfo}>
                  <span className={styles.lineName}>{product.name}</span>
                  <span className={styles.lineUnit}>€{getPrice(product).toFixed(2)} / ud.</span>
                </div>
                <div className={styles.lineQty}>
                  <button className={styles.qtyBtn} onClick={() => changeQty(product.id, -1)}><Minus size={12} /></button>
                  <span className={styles.qtyNum}>{qty}</span>
                  <button className={styles.qtyBtn} onClick={() => changeQty(product.id, 1)}><Plus size={12} /></button>
                </div>
                <div className={styles.lineSubtotal}>
                  <span>€{(getPrice(product) * qty).toFixed(2)}</span>
                  <button className={styles.lineRemove} onClick={() => removeFromCart(product.id)}><X size={11} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.cartFooter}>
          {cart.length > 0 && (
            <div className={styles.cartSummary}>
              {cart.slice(0, 3).map(({ product, qty }) => (
                <div key={product.id} className={styles.summaryLine}>
                  <span>{qty}× {product.name}</span>
                  <span>€{(getPrice(product) * qty).toFixed(2)}</span>
                </div>
              ))}
              {cart.length > 3 && <div className={styles.summaryMore}>+{cart.length - 3} más...</div>}
            </div>
          )}

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>TOTAL</span>
            <span className={styles.totalAmount}>€{total.toFixed(2)}</span>
          </div>

          <div className={styles.payMethodRow}>
            {PAY_METHODS.map(({ id, label, Icon }) => (
              <button key={id}
                className={`${styles.payTab} ${payMethod === id ? styles.payTabActive : ''}`}
                onClick={() => setPayMethod(id)}>
                <Icon size={14} /><span>{label}</span>
              </button>
            ))}
          </div>

          {payMethod === 'cash' && (
            <div className={styles.cashRow}>
              <input
                className={styles.cashInput}
                type="number" step="0.50" min={total}
                placeholder={t('concession.cashDelivery', { min: total.toFixed(2) })}
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
              />
              <div className={styles.quickCash}>
                {[5, 10, 20, 50].map(v => (
                  <button key={v} className={styles.quickCashBtn} onClick={() => setCashGiven(String(v))}>€{v}</button>
                ))}
              </div>
              {change !== null && parseFloat(change) >= 0 && (
                <div className={styles.changeRow}>
                  <span>{t('concession.change')}</span>
                  <span className={styles.changeAmount}>€{change}</span>
                </div>
              )}
            </div>
          )}

          <button
            className={styles.cobrarBtn}
            disabled={cart.length === 0 || paying || (payMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total))}
            onClick={() => setShowPayModal(true)}
          >
            <CheckCircle size={20} />
            {t('concession.pay', { total: total.toFixed(2) })} &nbsp;<kbd className={styles.kbdInline}>F4</kbd>
          </button>
        </div>
      </div>

      {/* ── Modal confirmación ─────────────────── */}
      {showPayModal && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className={styles.payModal}>
            <div className={styles.payModalHeader}>
              <span>{t('concession.confirmPay')}</span>
              <button onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>
            <div className={styles.payModalBody}>
              <div className={styles.payModalTotal}>€{total.toFixed(2)}</div>
              <div className={styles.payModalMethod}>{PAY_LABEL[payMethod]}</div>
              {payMethod === 'cash' && change !== null && (
                <div className={styles.payModalChange}>{t('concession.change')}: <strong>€{change}</strong></div>
              )}
              <div className={styles.payModalLines}>
                {cart.map(({ product, qty }) => (
                  <div key={product.id} className={styles.payModalLine}>
                    <span>{qty}× {product.name}</span>
                    <span>€{(getPrice(product) * qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.payModalFooter}>
              <button className={styles.payModalCancel} onClick={() => setShowPayModal(false)}>{t('concession.cancel')}</button>
              <button className={styles.payModalConfirm} onClick={handlePay} disabled={paying}>
                {paying ? <Loader size={16} /> : <CheckCircle size={16} />} {t('concession.confirmPay')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recibo ─────────────────────────────── */}
      {receipt && (
        <div className={styles.modalOverlay}>
          <div className={styles.receiptModal}>
            <div className={styles.receiptHeader}>
              <CheckCircle size={22} className={styles.receiptOk} />
              <span>{t('concession.paid')}</span>
            </div>
            <div className={styles.receiptBody}>
              <div className={styles.receiptMeta}>
                <span className={styles.receiptId}>{receipt.id}</span>
                <span className={styles.receiptTime}>{receipt.date} — {receipt.timestamp}</span>
              </div>
              <div className={styles.receiptLines}>
                {receipt.lines.map(({ product, qty }) => (
                  <div key={product.id} className={styles.receiptLine}>
                    <span>{getEmoji(product)} {qty}× {product.name}</span>
                    <span>€{(getPrice(product) * qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.receiptDivider} />
              <div className={styles.receiptTotal}>
                <span>TOTAL</span>
                <span>€{receipt.total.toFixed(2)}</span>
              </div>
              <div className={styles.receiptPayInfo}>
                <span>{t('concession.method')}: <strong>{PAY_LABEL[receipt.payMethod]}</strong></span>
                {receipt.payMethod === 'cash' && (
                  <>
                    <span>{t('concession.given')}: <strong>€{receipt.cashGiven?.toFixed(2)}</strong></span>
                    <span>{t('concession.change')}: <strong className={styles.receiptChange}>€{receipt.change?.toFixed(2)}</strong></span>
                  </>
                )}
              </div>
            </div>
            <div className={styles.receiptFooter}>
              <button className={styles.receiptPrint} onClick={() => window.print()}>
                <Printer size={14} /> {t('concession.print')}
              </button>
              <button className={styles.receiptNew} onClick={resetAll}>
                <RotateCcw size={14} /> {t('concession.newSale')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal gestión de productos ────────────── */}
      {showManager && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowManager(false)}>
          <div className={styles.managerModal}>
            <div className={styles.managerHeader}>
              <span>{t('concession.manageTitle')}</span>
              <button onClick={() => setShowManager(false)}><X size={16} /></button>
            </div>

            {productForm === null ? (
              /* ── Lista ── */
              <div className={styles.managerBody}>
                <button className={styles.managerNewBtn} onClick={openNewProduct}>
                  <Plus size={14} /> {t('concession.newProduct')}
                </button>
                <div className={styles.managerList}>
                  {products.map(p => (
                    <div key={p.id} className={styles.managerItem}>
                      <span className={styles.managerItemEmoji}>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className={styles.managerItemImg} onError={e => { e.currentTarget.style.display='none'; }} />
                          : getEmoji(p)}
                      </span>
                      <div className={styles.managerItemInfo}>
                        <span className={styles.managerItemName}>{p.name}</span>
                        <span className={styles.managerItemMeta}>{p.category} · €{getPrice(p).toFixed(2)}</span>
                      </div>
                      <button className={styles.managerEditBtn} onClick={() => openEditProduct(p)} title="Editar">
                        <Edit2 size={13} />
                      </button>
                      <button
                        className={styles.managerDeleteBtn}
                        onClick={() => handleDeleteProduct(p)}
                        disabled={deletingId === p.id}
                        title="Eliminar"
                      >
                        {deletingId === p.id ? <Loader size={13} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className={styles.managerEmpty}>{t('concession.noList')}</p>
                  )}
                </div>
              </div>
            ) : (
              /* ── Formulario ── */
              <div className={styles.managerBody}>
                <button className={styles.managerBackBtn} onClick={() => { setProductForm(null); setEditingProduct(null); }}>
                  {t('concession.backToList')}
                </button>
                <h3 className={styles.managerFormTitle}>{editingProduct ? t('concession.editProduct') : t('concession.newProduct')}</h3>
                <div className={styles.managerFormGrid}>
                  <div className={styles.managerFieldFull}>
                    <label className={styles.managerLabel}>{t('concession.form.name')}</label>
                    <input className={styles.managerInput} value={productForm.name} onChange={e => setField('name', e.target.value)} placeholder={t('concession.form.imgPh')} />
                  </div>
                  <div>
                    <label className={styles.managerLabel}>{t('concession.form.category')}</label>
                    <select className={styles.managerInput} value={productForm.category} onChange={e => setField('category', e.target.value)}>
                      {[...new Set([...DEFAULT_CATEGORIES, ...products.map(p => p.category)])].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={styles.managerLabel}>{t('concession.form.price')}</label>
                    <input className={styles.managerInput} type="number" step="0.10" min="0" value={productForm.price} onChange={e => setField('price', e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={styles.managerLabel}>{t('concession.form.stock')}</label>
                    <input className={styles.managerInput} type="number" min="0" value={productForm.quantity} onChange={e => setField('quantity', e.target.value)} placeholder={t('concession.form.noLimit')} />
                  </div>
                  <div>
                    <label className={styles.managerLabel}>{t('concession.form.emoji')}</label>
                    <input className={styles.managerInput} value={productForm.emoji} onChange={e => setField('emoji', e.target.value)} placeholder="🍿" maxLength={4} />
                  </div>
                  <div className={styles.managerFieldFull}>
                    <label className={styles.managerLabel}>{t('concession.form.image')}</label>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    {productForm.imageUrl ? (
                      <div className={styles.imgPreviewWrap}>
                        <img src={productForm.imageUrl} alt="preview" className={styles.managerImgPreview} />
                        <button type="button" className={styles.imgRemoveBtn} onClick={() => setField('imageUrl', '')} title={t('concession.form.removeImg')}>
                          <X size={11} /> {t('concession.form.removeImg')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.imgUploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImg}
                      >
                        {uploadingImg ? <Loader size={14} className={styles.spin} /> : <Upload size={14} />}
                        {uploadingImg ? t('concession.form.uploading') : t('concession.form.selectImg')}
                      </button>
                    )}
                  </div>
                  <div className={styles.managerFieldFull}>
                    <label className={styles.managerLabel}>{t('concession.form.desc')}</label>
                    <input className={styles.managerInput} value={productForm.description} onChange={e => setField('description', e.target.value)} placeholder={t('concession.form.descPh')} />
                  </div>
                </div>
                <div className={styles.managerFormActions}>
                  <button className={styles.managerCancelBtn} onClick={() => { setProductForm(null); setEditingProduct(null); }}>{t('concession.cancel')}</button>
                  <button className={styles.managerSaveBtn} onClick={handleSaveProduct} disabled={savingProduct}>
                    {savingProduct ? <Loader size={14} /> : <Save size={14} />}
                    {editingProduct ? t('common.saveChanges') : t('concession.createProduct')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {stripeData && (
        <StripePaymentModal
          clientSecret={stripeData.clientSecret}
          publishableKey={stripeData.publishableKey}
          amount={total}
          title="Pago online de concesión"
          onSuccess={handleStripeSuccess}
          onCancel={handleStripeCancel}
        />
      )}
    </div>
  );
}
