import { api } from './api';

const CAT_BE_TO_FE = { FOOD: 'Comida', DRINK: 'Bebida', MERCHANDISE: 'Merchandise' };
const CAT_FE_TO_BE = { Comida: 'FOOD', Bebida: 'DRINK', Merchandise: 'MERCHANDISE' };

const toInventory = (item) => ({
  ...item,
  quantity:   item.quantity ?? item.stock ?? 0,
  min_stock:  item.min_stock ?? item.minStock ?? 0,
  price_unit: item.price_unit ?? item.price ?? 0,
  unit:       item.unit ?? 'ud',
  location:   item.location ?? '',
  category:   CAT_BE_TO_FE[item.category] || item.category,
});

const fromInventory = (data) => {
  const hasFrontendNames = 'quantity' in data;
  const base = {
    minStock: 0,
    supplier: '',
    ...data,
  };
  if (!hasFrontendNames) return base;
  return {
    ...base,
    quantity:   undefined,
    min_stock:  undefined,
    price_unit: undefined,
    unit:       undefined,
    location:   undefined,
    stock:      Number(data.quantity),
    minStock:   Number(data.min_stock) || 0,
    price:      Number(data.price_unit),
    category:   CAT_FE_TO_BE[data.category] || data.category,
  };
};

export const inventoryService = {
  getAll:  ()         => api.get('/merchandise').then(data => (Array.isArray(data) ? data : []).map(toInventory)),
  getById: (id)       => api.get(`/merchandise/${id}`).then(toInventory),
  create:  (data)     => api.post('/merchandise', fromInventory(data)).then(toInventory),
  update:  (id, data) => api.put(`/merchandise/${id}`, fromInventory(data)).then(toInventory),
  remove:  (id)       => api.delete(`/merchandise/${id}`),
};

export const merchandiseService = inventoryService;
