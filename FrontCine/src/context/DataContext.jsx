import { createContext, useContext, useState, useCallback } from 'react'

const DataContext = createContext(null)

const MOCK_PELICULAS = [
  { id: 1, titulo: 'El Despertar de las Sombras', genero: 'Thriller', duracion: 142, clasificacion: '+16', imagen: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop', descripcion: 'Una thrillante aventura de suspense' },
  { id: 2, titulo: 'Aventuras en el Cosmos', genero: 'Ciencia Ficción', duracion: 125, clasificacion: 'TP', imagen: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop', descripcion: 'Un viaje épico por el universo' },
  { id: 3, titulo: 'Risas y Lágrimas', genero: 'Comedia Romántica', duracion: 108, clasificacion: 'TP', imagen: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', descripcion: 'Una comedia romántica llena de emociones' },
  { id: 4, titulo: 'El Último Dragón', genero: 'Fantasía', duracion: 156, clasificacion: '+12', imagen: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop', descripcion: 'Una épica aventura de fantasía' },
]

const MOCK_SESIONES = [
  { id: 1, peliculaId: 1, fecha: '2026-05-01', hora: '16:00', sala: 'Sala 1', precioEntrada: 10.5, entradasVendidas: 45, aforo: 120 },
  { id: 2, peliculaId: 1, fecha: '2026-05-01', hora: '19:30', sala: 'Sala 1', precioEntrada: 12.0, entradasVendidas: 80, aforo: 120 },
  { id: 3, peliculaId: 2, fecha: '2026-05-02', hora: '17:00', sala: 'Sala 2', precioEntrada: 10.5, entradasVendidas: 60, aforo: 100 },
  { id: 4, peliculaId: 3, fecha: '2026-05-03', hora: '18:00', sala: 'Sala 3', precioEntrada: 9.0, entradasVendidas: 30, aforo: 90 },
  { id: 5, peliculaId: 4, fecha: '2026-05-04', hora: '20:00', sala: 'Sala 2', precioEntrada: 11.0, entradasVendidas: 70, aforo: 100 },
  { id: 6, peliculaId: 2, fecha: '2026-05-05', hora: '15:30', sala: 'Sala 1', precioEntrada: 10.5, entradasVendidas: 50, aforo: 120 },
  { id: 7, peliculaId: 1, fecha: '2026-05-06', hora: '21:00', sala: 'Sala 3', precioEntrada: 12.0, entradasVendidas: 85, aforo: 90 },
  { id: 8, peliculaId: 4, fecha: '2026-05-07', hora: '17:30', sala: 'Sala 2', precioEntrada: 11.0, entradasVendidas: 40, aforo: 100 },
  { id: 9, peliculaId: 3, fecha: '2026-05-08', hora: '19:00', sala: 'Sala 1', precioEntrada: 9.0, entradasVendidas: 55, aforo: 120 },
]

const MOCK_PRODUCTOS = [
  { id: 1, nombre: 'Palomitas Grande', descripcion: 'Palomitas recién hechas con mantequilla', categoria: 'Comida', precio: 6.5, stock: 150, imagen: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop' },
  { id: 2, nombre: 'Refresco Grande', descripcion: 'Refresco de 750ml', categoria: 'Bebida', precio: 4.5, stock: 200, imagen: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop' },
  { id: 3, nombre: 'Nachos con Queso', descripcion: 'Nachos crujientes con salsa de queso cheddar', categoria: 'Comida', precio: 5.5, stock: 80, imagen: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop' },
  { id: 4, nombre: 'Agua Mineral', descripcion: 'Agua mineral 500ml', categoria: 'Bebida', precio: 2.5, stock: 180, imagen: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop' },
  { id: 5, nombre: 'Combo Palomitas', descripcion: 'Palomitas grande + refresco grande', categoria: 'Comida', precio: 9.5, stock: 100, imagen: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&h=300&fit=crop' },
  { id: 6, nombre: 'Camiseta Lumen', descripcion: 'Camiseta oficial Lumen Cinema', categoria: 'Merchandising', precio: 22.0, stock: 45, imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop' },
  { id: 7, nombre: 'Taza Cine', descripcion: 'Taza cerámica con logo del cine', categoria: 'Merchandising', precio: 12.0, stock: 60, imagen: 'https://images.unsplash.com/photo-1570784532036-4bcc8e0b3ec4?w=400&h=300&fit=crop' },
  { id: 8, nombre: 'Bolsa Palomitas Especial', descripcion: 'Palomitas en bolsa coleccionable', categoria: 'Comida', precio: 8.0, stock: 75, imagen: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=300&fit=crop' },
]

const MOCK_USUARIOS = [
  { id: 1, nombre: 'Ana García', email: 'ana@example.com', edad: 32, tipoDescuento: null, visitas: 15, fechaRegistro: '2024-01-15' },
  { id: 2, nombre: 'Carlos Ruiz', email: 'carlos@example.com', edad: 22, tipoDescuento: 'Estudiante', visitas: 8, fechaRegistro: '2024-03-20' },
  { id: 3, nombre: 'María López', email: 'maria@example.com', edad: 68, tipoDescuento: null, visitas: 12, fechaRegistro: '2023-11-10' },
]

export function DataProvider({ children }) {
  const [peliculas, setPeliculas] = useState(MOCK_PELICULAS)
  const [sesiones, setSesiones] = useState(MOCK_SESIONES)
  const [productos, setProductos] = useState(MOCK_PRODUCTOS)
  const [usuarios, setUsuarios] = useState(MOCK_USUARIOS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Peliculas CRUD
  const addPelicula = useCallback((pelicula) => {
    const newPelicula = { ...pelicula, id: Date.now() }
    setPeliculas(prev => [...prev, newPelicula])
    return newPelicula
  }, [])

  const updatePelicula = useCallback((id, updates) => {
    setPeliculas(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const deletePelicula = useCallback((id) => {
    setPeliculas(prev => prev.filter(p => p.id !== id))
    setSesiones(prev => prev.filter(s => s.peliculaId !== id))
  }, [])

  // Sesiones CRUD
  const addSesion = useCallback((sesion) => {
    const newSesion = { ...sesion, id: Date.now(), entradasVendidas: 0 }
    setSesiones(prev => [...prev, newSesion])
    return newSesion
  }, [])

  const updateSesion = useCallback((id, updates) => {
    setSesiones(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }, [])

  const deleteSesion = useCallback((id) => {
    setSesiones(prev => prev.filter(s => s.id !== id))
  }, [])

  // Productos CRUD
  const addProducto = useCallback((producto) => {
    const newProducto = { ...producto, id: Date.now() }
    setProductos(prev => [...prev, newProducto])
    return newProducto
  }, [])

  const updateProducto = useCallback((id, updates) => {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const deleteProducto = useCallback((id) => {
    setProductos(prev => prev.filter(p => p.id !== id))
  }, [])

  // Usuarios CRUD
  const addUsuario = useCallback((usuario) => {
    const newUsuario = { ...usuario, id: Date.now(), visitas: 0, fechaRegistro: new Date().toISOString().split('T')[0] }
    setUsuarios(prev => [...prev, newUsuario])
    return newUsuario
  }, [])

  const updateUsuario = useCallback((id, updates) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }, [])

  const deleteUsuario = useCallback((id) => {
    setUsuarios(prev => prev.filter(u => u.id !== id))
  }, [])

  return (
    <DataContext.Provider value={{
      peliculas, sesiones, productos, usuarios, loading, error,
      addPelicula, updatePelicula, deletePelicula,
      addSesion, updateSesion, deleteSesion,
      addProducto, updateProducto, deleteProducto,
      addUsuario, updateUsuario, deleteUsuario,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
