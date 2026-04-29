import { render, screen, fireEvent } from '@testing-library/react'
import { CartProvider, useCart } from '../context/CartContext'

const PRODUCT = { id: 1, nombre: 'Palomitas', precio: 6.5 }

function CartConsumer() {
  const { items, addItem, removeItem, updateQuantity, clearCart, total, count } = useCart()
  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="total">{total.toFixed(2)}</span>
      <span data-testid="items">{items.length}</span>
      <button onClick={() => addItem(PRODUCT, 1)}>add</button>
      <button onClick={() => addItem(PRODUCT, 2)}>add2</button>
      <button onClick={() => removeItem(PRODUCT.id)}>remove</button>
      <button onClick={() => updateQuantity(PRODUCT.id, 5)}>set5</button>
      <button onClick={() => updateQuantity(PRODUCT.id, 0)}>set0</button>
      <button onClick={clearCart}>clear</button>
    </div>
  )
}

function renderCart() {
  return render(
    <CartProvider>
      <CartConsumer />
    </CartProvider>
  )
}

describe('CartContext', () => {
  test('starts empty', () => {
    renderCart()
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('total').textContent).toBe('0.00')
    expect(screen.getByTestId('items').textContent).toBe('0')
  })

  test('addItem adds a product', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('total').textContent).toBe('6.50')
  })

  test('addItem increments quantity for existing product', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('items').textContent).toBe('1')
  })

  test('addItem with quantity 2', () => {
    renderCart()
    fireEvent.click(screen.getByText('add2'))
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('total').textContent).toBe('13.00')
  })

  test('removeItem removes product', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('remove'))
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('items').textContent).toBe('0')
  })

  test('updateQuantity changes quantity', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('set5'))
    expect(screen.getByTestId('count').textContent).toBe('5')
    expect(screen.getByTestId('total').textContent).toBe('32.50')
  })

  test('updateQuantity with 0 removes item', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('set0'))
    expect(screen.getByTestId('items').textContent).toBe('0')
  })

  test('clearCart empties cart', () => {
    renderCart()
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('add'))
    fireEvent.click(screen.getByText('clear'))
    expect(screen.getByTestId('count').textContent).toBe('0')
    expect(screen.getByTestId('items').textContent).toBe('0')
  })

  test('throws error when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<CartConsumer />)).toThrow()
    spy.mockRestore()
  })
})
