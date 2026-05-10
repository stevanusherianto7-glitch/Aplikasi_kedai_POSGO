import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { MenuItem } from '../types'

export interface CartItem extends MenuItem {
  quantity: number
  notes?: string
}

interface CartState {
  items: CartItem[]
  totalAmount: number
  itemCount: number
  discount: number
  tax: number
  customer?: any
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'UPDATE_NOTES'; payload: { id: number; notes: string } }
  | { type: 'SET_DISCOUNT'; payload: number }
  | { type: 'SET_TAX'; payload: number }
  | { type: 'SET_CUSTOMER'; payload: any }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  itemCount: 0,
  discount: 0,
  tax: 0,
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        return {
          ...state,
          items: updatedItems,
          itemCount: state.itemCount + 1,
          totalAmount: calculateTotal(updatedItems, state.discount, state.tax)
        }
      } else {
        const newItem = { ...action.payload, quantity: 1 }
        const newItems = [...state.items, newItem]
        return {
          ...state,
          items: newItems,
          itemCount: state.itemCount + 1,
          totalAmount: calculateTotal(newItems, state.discount, state.tax)
        }
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: newItems,
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: calculateTotal(newItems, state.discount, state.tax)
      }
    }

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        const newItems = state.items.filter(item => item.id !== action.payload.id)
        return {
          ...state,
          items: newItems,
          itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: calculateTotal(newItems, state.discount, state.tax)
        }
      }

      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      )

      return {
        ...state,
        items: newItems,
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: calculateTotal(newItems, state.discount, state.tax)
      }
    }

    case 'UPDATE_NOTES': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, notes: action.payload.notes }
          : item
      )
      return {
        ...state,
        items: newItems
      }
    }

    case 'SET_DISCOUNT': {
      return {
        ...state,
        discount: action.payload,
        totalAmount: calculateTotal(state.items, action.payload, state.tax)
      }
    }

    case 'SET_TAX': {
      return {
        ...state,
        tax: action.payload,
        totalAmount: calculateTotal(state.items, state.discount, action.payload)
      }
    }

    case 'SET_CUSTOMER': {
      return {
        ...state,
        customer: action.payload
      }
    }

    case 'CLEAR_CART': {
      return initialState
    }

    case 'LOAD_CART': {
      const newItems = action.payload
      return {
        ...state,
        items: newItems,
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: calculateTotal(newItems, state.discount, state.tax)
      }
    }

    default:
      return state
  }
}

const calculateTotal = (items: CartItem[], discount: number, tax: number): number => {
  const subtotal = items.reduce((sum, item) => sum + (item.harga * item.quantity), 0)
  const afterDiscount = subtotal - (subtotal * discount / 100)
  const total = afterDiscount + (afterDiscount * tax / 100)
  return total
}

interface CartContextType {
  state: CartState
  addItem: (item: MenuItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  updateNotes: (id: number, notes: string) => void
  setDiscount: (discount: number) => void
  setTax: (tax: number) => void
  setCustomer: (customer: any) => void
  clearCart: () => void
  loadCart: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const addItem = (item: MenuItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }

  const updateNotes = (id: number, notes: string) => {
    dispatch({ type: 'UPDATE_NOTES', payload: { id, notes } })
  }

  const setDiscount = (discount: number) => {
    dispatch({ type: 'SET_DISCOUNT', payload: discount })
  }

  const setTax = (tax: number) => {
    dispatch({ type: 'SET_TAX', payload: tax })
  }

  const setCustomer = (customer: any) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const loadCart = (items: CartItem[]) => {
    dispatch({ type: 'LOAD_CART', payload: items })
  }

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      updateNotes,
      setDiscount,
      setTax,
      setCustomer,
      clearCart,
      loadCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
