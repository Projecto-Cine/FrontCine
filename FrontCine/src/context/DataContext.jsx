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

const MOCK_CLIENTES = [
  { id: 1, nombre: 'Ana García', email: 'ana@example.com', telefono: '612 345 678', tipoDescuento: null, visitas: 15, fechaRegistro: '2024-01-15' },
  { id: 2, nombre: 'Carlos Ruiz', email: 'carlos@example.com', telefono: '623 456 789', tipoDescuento: 'Estudiante', visitas: 8, fechaRegistro: '2024-03-20' },
  { id: 3, nombre: 'María López', email: 'maria@example.com', telefono: '634 567 890', tipoDescuento: 'Jubilado', visitas: 12, fechaRegistro: '2023-11-10' },
]

const MOCK_TRABAJADORES = [
  { id: 1, nombre: 'Laura Sánchez', rol: 'Taquillera', telefono: '612 111 222', email: 'laura@lumencine.es' },
  { id: 2, nombre: 'Pedro Martín', rol: 'Acomodador', telefono: '623 222 333', email: 'pedro@lumencine.es' },
  { id: 3, nombre: 'Sofía Romero', rol: 'Encargada', telefono: '634 333 444', email: 'sofia@lumencine.es' },
  { id: 4, nombre: 'Diego Torres', rol: 'Taquillero', telefono: '645 444 555', email: 'diego@lumencine.es' },
  { id: 5, nombre: 'Carmen Vega', rol: 'Acomodadora', telefono: '656 555 666', email: 'carmen@lumencine.es' },
]

const MOCK_TURNOS = [
  { id: 1,  trabajadorId: 1, fecha: '2026-04-28', inicio: '09:00', fin: '17:00' },
  { id: 2,  trabajadorId: 3, fecha: '2026-04-28', inicio: '09:00', fin: '18:00' },
  { id: 3,  trabajadorId: 2, fecha: '2026-04-28', inicio: '14:00', fin: '22:00' },
  { id: 4,  trabajadorId: 1, fecha: '2026-04-29', inicio: '09:00', fin: '17:00' },
  { id: 5,  trabajadorId: 3, fecha: '2026-04-29', inicio: '09:00', fin: '18:00' },
  { id: 6,  trabajadorId: 4, fecha: '2026-04-30', inicio: '16:00', fin: '22:00' },
  { id: 7,  trabajadorId: 5, fecha: '2026-04-30', inicio: '14:00', fin: '22:00' },
  { id: 8,  trabajadorId: 2, fecha: '2026-05-01', inicio: '09:00', fin: '17:00' },
  { id: 9,  trabajadorId: 4, fecha: '2026-05-01', inicio: '09:00', fin: '17:00' },
  { id: 10, trabajadorId: 1, fecha: '2026-05-02', inicio: '14:00', fin: '22:00' },
  { id: 11, trabajadorId: 5, fecha: '2026-05-02', inicio: '09:00', fin: '17:00' },
  { id: 12, trabajadorId: 3, fecha: '2026-05-03', inicio: '10:00', fin: '18:00' },
]

export function DataProvider({ children }) {
  const [peliculas, setPeliculas] = useState(MOCK_PELICULAS)
  const [sesiones, setSesiones]   = useState(MOCK_SESIONES)
  const [productos, setProductos] = useState(MOCK_PRODUCTOS)
  const [clientes, setClientes]   = useState(MOCK_CLIENTES)
  const [trabajadores, setTrabajadores] = useState(MOCK_TRABAJADORES)
  const [turnos, setTurnos]       = useState(MOCK_TURNOS)

  // Peliculas
  const addPelicula    = useCallback((p)       => setPeliculas(prev => [...prev, { ...p, id: Date.now() }]), [])
  const updatePelicula = useCallback((id, upd) => setPeliculas(prev => prev.map(p => p.id === id ? { ...p, ...upd } : p)), [])
  const deletePelicula = useCallback((id)      => {
    setPeliculas(prev => prev.filter(p => p.id !== id))
    setSesiones(prev => prev.filter(s => s.peliculaId !== id))
  }, [])

  // Sesiones
  const addSesion    = useCallback((s)       => setSesiones(prev => [...prev, { ...s, id: Date.now(), entradasVendidas: 0 }]), [])
  const updateSesion = useCallback((id, upd) => setSesiones(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s)), [])
  const deleteSesion = useCallback((id)      => setSesiones(prev => prev.filter(s => s.id !== id)), [])

  // Productos
  const addProducto    = useCallback((p)       => setProductos(prev => [...prev, { ...p, id: Date.now() }]), [])
  const updateProducto = useCallback((id, upd) => setProductos(prev => prev.map(p => p.id === id ? { ...p, ...upd } : p)), [])
  const deleteProducto = useCallback((id)      => setProductos(prev => prev.filter(p => p.id !== id)), [])

  // Clientes
  const addCliente    = useCallback((c)       => setClientes(prev => [...prev, { ...c, id: Date.now(), visitas: 0, fechaRegistro: new Date().toISOString().split('T')[0] }]), [])
  const updateCliente = useCallback((id, upd) => setClientes(prev => prev.map(c => c.id === id ? { ...c, ...upd } : c)), [])
  const deleteCliente = useCallback((id)      => setClientes(prev => prev.filter(c => c.id !== id)), [])

  // Trabajadores
  const addTrabajador    = useCallback((t)       => setTrabajadores(prev => [...prev, { ...t, id: Date.now() }]), [])
  const updateTrabajador = useCallback((id, upd) => setTrabajadores(prev => prev.map(t => t.id === id ? { ...t, ...upd } : t)), [])
  const deleteTrabajador = useCallback((id)      => {
    setTrabajadores(prev => prev.filter(t => t.id !== id))
    setTurnos(prev => prev.filter(t => t.trabajadorId !== id))
  }, [])

  // Turnos
  const addTurno    = useCallback((t)       => setTurnos(prev => [...prev, { ...t, id: Date.now(), trabajadorId: parseInt(t.trabajadorId) }]), [])
  const updateTurno = useCallback((id, upd) => setTurnos(prev => prev.map(t => t.id === id ? { ...t, ...upd, trabajadorId: parseInt(upd.trabajadorId ?? t.trabajadorId) } : t)), [])
  const deleteTurno = useCallback((id)      => setTurnos(prev => prev.filter(t => t.id !== id)), [])

  return (
    <DataContext.Provider value={{
      peliculas, sesiones, productos, clientes, trabajadores, turnos,
      addPelicula, updatePelicula, deletePelicula,
      addSesion, updateSesion, deleteSesion,
      addProducto, updateProducto, deleteProducto,
      addCliente, updateCliente, deleteCliente,
      addTrabajador, updateTrabajador, deleteTrabajador,
      addTurno, updateTurno, deleteTurno,
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
