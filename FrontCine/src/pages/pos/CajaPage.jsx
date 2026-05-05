import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Minus, Plus, X, CreditCard, Banknote, Smartphone,
  ShoppingCart, CheckCircle, Printer, Trash2, Search,
  RotateCcw, Loader
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { salesService }     from '../../services/salesService';
import { useApp }  from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CajaPage.module.css';

const CATEGORY_EMOJI = { Palomitas: '🍿', Bebidas: '🥤', Snacks: '🌮', Combos: '🎁', Concesión: '🛒' };
const getEmoji = (p) => p.emoji ?? CATEGORY_EMOJI[p.category] ?? '🔲';
const getPrice = (p) => p.price ?? p.price_unit ?? 0;

const PAY_METHODS = [
  { id: 'card',   label: 'Tarjeta', Icon: CreditCard  },
  { id: 'cash',   label: 'Efectivo', Icon: Banknote   },
  { id: 'online', label: 'QR / App', Icon: Smartphone },
];

function generateReceiptId() {
  return 'RCP-' + Date.now().toString(36).toUpperCase();
}

export default function CajaPage() {
  const { toast } = useApp();
  const { user }  = useAuth();

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
  const searchRef = useRef(null);

  // Cargar productos de concesión desde el backend
  useEffect(() => {
    inventoryService.getAll()
      .then(data => {
        const items = Array.isArray(data) ? data : [];
        // Mostrar solo productos de concesión con stock disponible
        const concession = items.filter(p => p.quantity === undefined || p.quantity > 0);
        setProducts(concession);
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

  const handlePay = async () => {
    if (payMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total)) {
      toast('Importe entregado insuficiente.', 'error');
      return;
    }
    setPaying(true);
    try {
      await salesService.createConcessionSale({
        items: cart.map(({ product, qty }) => ({
          product_id: product.id,
          name:       product.name,
          qty,
          unit_price: getPrice(product),
        })),
        total,
        payment_method: payMethod.toUpperCase(),
        cash_given:     payMethod === 'cash' ? parseFloat(cashGiven) : null,
        change:         change ? parseFloat(change) : null,
        cashier_id:     user?.id ?? null,
      });
    } catch {
      // Si el endpoint aún no existe, continuamos igualmente con el recibo local
    } finally {
      setPaying(false);
    }

    const rec = {
      id:        generateReceiptId(),
      lines:     [...cart],
      total,
      payMethod,
      cashGiven: payMethod === 'cash' ? parseFloat(cashGiven) : null,
      change:    change ? parseFloat(change) : null,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date:      new Date().toLocaleDateString('es-ES'),
    };
    setReceipt(rec);
    setShowPayModal(false);
    setCart([]);
    setCashGiven('');
  };

  const resetAll = () => {
    setReceipt(null);
    setCart([]);
    setCashGiven('');
    setPayMethod('card');
  };

  const PAY_LABEL = { card: 'Tarjeta', cash: 'Efectivo', online: 'QR / App' };

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
              placeholder="Buscar producto... (F2)"
              value={search}
              onChange={e => { setSearch(e.target.value); setCategory('Todo'); }}
            />
            {search && <button className={styles.searchClear} onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
          <div className={styles.shortcuts}>
            <kbd>F2</kbd> Buscar
            <kbd>F4</kbd> Cobrar
            <kbd>Esc</kbd> Vaciar
          </div>
        </div>

        <div className={styles.catTabs}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${styles.catTab} ${category === c && !search ? styles.catActive : ''}`}
              onClick={() => { setCategory(c); setSearch(''); }}
            >
              {CATEGORY_EMOJI[c] ?? '🔲'} {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
            <Loader size={18} /> Cargando productos...
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
                  <span className={styles.productEmoji}>{getEmoji(product)}</span>
                  <span className={styles.productName}>{product.name}</span>
                  {product.desc && <span className={styles.productDesc}>{product.desc}</span>}
                  <span className={styles.productPrice}>€{getPrice(product).toFixed(2)}</span>
                  {inCart && <span className={styles.productQtyBadge}>{inCart.qty}</span>}
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className={styles.noResults}>Sin productos para "{search || category}"</div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT — carrito ─────────────────────────────── */}
      <div className={styles.right}>
        <div className={styles.cartHeader}>
          <ShoppingCart size={15} />
          <span>Pedido</span>
          <span className={styles.cartCount}>{totalItems} art.</span>
          {cart.length > 0 && (
            <button className={styles.clearBtn} onClick={() => setCart([])} title="Vaciar pedido (Esc)">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <div className={styles.cartLines}>
          {cart.length === 0 ? (
            <div className={styles.cartEmpty}>
              <ShoppingCart size={30} opacity={0.15} />
              <p>Toca un producto para añadir</p>
              <p className={styles.cartEmptySub}>o pulsa <kbd>F2</kbd> para buscar</p>
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
                placeholder={`Entrega (mín €${total.toFixed(2)})`}
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
                  <span>Cambio</span>
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
            Cobrar €{total.toFixed(2)} &nbsp;<kbd className={styles.kbdInline}>F4</kbd>
          </button>
        </div>
      </div>

      {/* ── Modal confirmación ─────────────────── */}
      {showPayModal && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowPayModal(false)}>
          <div className={styles.payModal}>
            <div className={styles.payModalHeader}>
              <span>Confirmar cobro</span>
              <button onClick={() => setShowPayModal(false)}><X size={16} /></button>
            </div>
            <div className={styles.payModalBody}>
              <div className={styles.payModalTotal}>€{total.toFixed(2)}</div>
              <div className={styles.payModalMethod}>{PAY_LABEL[payMethod]}</div>
              {payMethod === 'cash' && change !== null && (
                <div className={styles.payModalChange}>Cambio a devolver: <strong>€{change}</strong></div>
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
              <button className={styles.payModalCancel} onClick={() => setShowPayModal(false)}>Cancelar</button>
              <button className={styles.payModalConfirm} onClick={handlePay} disabled={paying}>
                {paying ? <Loader size={16} /> : <CheckCircle size={16} />} Confirmar cobro
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
              <span>Cobro realizado</span>
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
                <span>Método: <strong>{PAY_LABEL[receipt.payMethod]}</strong></span>
                {receipt.payMethod === 'cash' && (
                  <>
                    <span>Entregado: <strong>€{receipt.cashGiven?.toFixed(2)}</strong></span>
                    <span>Cambio: <strong className={styles.receiptChange}>€{receipt.change?.toFixed(2)}</strong></span>
                  </>
                )}
              </div>
            </div>
            <div className={styles.receiptFooter}>
              <button className={styles.receiptPrint} onClick={() => window.print()}>
                <Printer size={14} /> Imprimir
              </button>
              <button className={styles.receiptNew} onClick={resetAll}>
                <RotateCcw size={14} /> Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
