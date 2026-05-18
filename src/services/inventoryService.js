import { api } from './api';

const toInventory = (item) => ({
  ...item,
  quantity:   item.quantity ?? item.stock ?? 0,
  min_stock:  item.min_stock ?? item.minStock ?? 0,
  price_unit: item.price_unit ?? item.price ?? 0,
  unit:       item.unit ?? 'ud',
  location:   item.location ?? '',
});

const fromInventory = (data) => {
  const hasFrontendNames = 'quantity' in data;
  return {
    ...data,
    ...(hasFrontendNames ? {
      quantity: undefined,
      min_stock: undefined,
      price_unit: undefined,
      unit: undefined,
      location: undefined,
      stock: Number(data.quantity),
      minStock: Number(data.min_stock),
      price: Number(data.price_unit),
    } : {}),
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
