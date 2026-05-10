import { CartItem, Product } from '../types'

class CartService {
  private items: CartItem[] = []

  getItems(): CartItem[] {
    return [...this.items]
  }

  addItem(product: Product, quantity: number = 1): CartItem[] {
    const existingItem = this.items.find(item => item.product.id === product.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
      existingItem.subtotal = existingItem.quantity * existingItem.product.price
    } else {
      this.items.push({
        product,
        quantity,
        subtotal: quantity * product.price
      })
    }
    
    return this.getItems()
  }

  removeItem(productId: string): CartItem[] {
    this.items = this.items.filter(item => item.product.id !== productId)
    return this.getItems()
  }

  updateQuantity(productId: string, quantity: number): CartItem[] {
    const item = this.items.find(item => item.product.id === productId)
    
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(productId)
      } else {
        item.quantity = quantity
        item.subtotal = item.quantity * item.product.price
      }
    }
    
    return this.getItems()
  }

  getTotal(): number {
    return this.items.reduce((total, item) => total + item.subtotal, 0)
  }

  getItemCount(): number {
    return this.items.reduce((count, item) => count + item.quantity, 0)
  }

  clearCart(): CartItem[] {
    this.items = []
    return this.getItems()
  }
}

export const cartService = new CartService()