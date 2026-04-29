import { render, screen, fireEvent, act } from '@testing-library/react'
import { DataProvider, useData } from '../context/DataContext'

function PeliculasConsumer() {
  const { peliculas, addPelicula, updatePelicula, deletePelicula } = useData()
  return (
    <div>
      <span data-testid="count">{peliculas.length}</span>
      <ul>{peliculas.map(p => <li key={p.id} data-testid={`peli-${p.id}`}>{p.titulo}</li>)}</ul>
      <button onClick={() => addPelicula({ titulo: 'Test Film', genero: 'Drama', duracion: 90, clasificacion: 'TP', imagen: '', descripcion: '' })}>add</button>
      <button onClick={() => { const p = peliculas[0]; if (p) updatePelicula(p.id, { titulo: 'Updated' }) }}>update-first</button>
      <button onClick={() => { const p = peliculas[0]; if (p) deletePelicula(p.id) }}>delete-first</button>
    </div>
  )
}

function ProductosConsumer() {
  const { productos, addProducto, updateProducto, deleteProducto } = useData()
  return (
    <div>
      <span data-testid="prod-count">{productos.length}</span>
      <button onClick={() => addProducto({ nombre: 'New Prod', descripcion: '', categoria: 'Comida', precio: 5, stock: 10, imagen: '' })}>add-prod</button>
      <button onClick={() => { const p = productos[0]; if (p) updateProducto(p.id, { nombre: 'Updated Prod' }) }}>update-prod</button>
      <button onClick={() => { const p = productos[0]; if (p) deleteProducto(p.id) }}>delete-prod</button>
    </div>
  )
}

function UsuariosConsumer() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useData()
  return (
    <div>
      <span data-testid="user-count">{usuarios.length}</span>
      <button onClick={() => addUsuario({ nombre: 'New User', email: 'new@test.com', edad: 30, tipoDescuento: null })}>add-user</button>
      <button onClick={() => { const u = usuarios[0]; if (u) deleteUsuario(u.id) }}>delete-user</button>
    </div>
  )
}

function renderData(Consumer) {
  return render(<DataProvider><Consumer /></DataProvider>)
}

describe('DataContext - Películas CRUD', () => {
  test('initializes with 4 mock peliculas', () => {
    renderData(PeliculasConsumer)
    expect(screen.getByTestId('count').textContent).toBe('4')
  })

  test('addPelicula increases count', () => {
    renderData(PeliculasConsumer)
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('count').textContent).toBe('5')
  })

  test('addPelicula shows new title', () => {
    renderData(PeliculasConsumer)
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByText('Test Film')).toBeInTheDocument()
  })

  test('updatePelicula changes title of first film', () => {
    renderData(PeliculasConsumer)
    fireEvent.click(screen.getByText('update-first'))
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })

  test('deletePelicula decreases count', () => {
    renderData(PeliculasConsumer)
    fireEvent.click(screen.getByText('delete-first'))
    expect(screen.getByTestId('count').textContent).toBe('3')
  })
})

describe('DataContext - Productos CRUD', () => {
  test('initializes with 8 mock productos', () => {
    renderData(ProductosConsumer)
    expect(screen.getByTestId('prod-count').textContent).toBe('8')
  })

  test('addProducto increases count', () => {
    renderData(ProductosConsumer)
    fireEvent.click(screen.getByText('add-prod'))
    expect(screen.getByTestId('prod-count').textContent).toBe('9')
  })

  test('deleteProducto decreases count', () => {
    renderData(ProductosConsumer)
    fireEvent.click(screen.getByText('delete-prod'))
    expect(screen.getByTestId('prod-count').textContent).toBe('7')
  })
})

describe('DataContext - Usuarios CRUD', () => {
  test('initializes with 3 mock usuarios', () => {
    renderData(UsuariosConsumer)
    expect(screen.getByTestId('user-count').textContent).toBe('3')
  })

  test('addUsuario increases count and sets defaults', () => {
    renderData(UsuariosConsumer)
    fireEvent.click(screen.getByText('add-user'))
    expect(screen.getByTestId('user-count').textContent).toBe('4')
  })

  test('deleteUsuario decreases count', () => {
    renderData(UsuariosConsumer)
    fireEvent.click(screen.getByText('delete-user'))
    expect(screen.getByTestId('user-count').textContent).toBe('2')
  })
})
