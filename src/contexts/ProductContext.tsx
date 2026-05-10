import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { MenuItem, Category } from '../types'

interface ProductState {
  products: MenuItem[]
  categories: Category[]
  loading: boolean
  error: string | null
}

type ProductAction =
  | { type: 'FETCH_PRODUCTS_REQUEST' }
  | { type: 'FETCH_PRODUCTS_SUCCESS'; payload: { products: MenuItem[]; categories: Category[] } }
  | { type: 'FETCH_PRODUCTS_ERROR'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: MenuItem }
  | { type: 'UPDATE_PRODUCT'; payload: MenuItem }
  | { type: 'DELETE_PRODUCT'; payload: number }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: number }

const initialState: ProductState = {
  products: [],
  categories: [],
  loading: false,
  error: null,
}

const productReducer = (state: ProductState, action: ProductAction): ProductState => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      }

    case 'FETCH_PRODUCTS_SUCCESS':
      return {
        ...state,
        loading: false,
        products: action.payload.products,
        categories: action.payload.categories
      }

    case 'FETCH_PRODUCTS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload]
      }

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        )
      }

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload)
      }

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      }

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        )
      }

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      }

    default:
      return state
  }
}

interface ProductContextType {
  state: ProductState
  fetchProducts: () => void
  addProduct: (product: MenuItem) => void
  updateProduct: (product: MenuItem) => void
  deleteProduct: (id: number) => void
  addCategory: (category: Category) => void
  updateCategory: (category: Category) => void
  deleteCategory: (id: number) => void
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState)

  const fetchProducts = async () => {
    dispatch({ type: 'FETCH_PRODUCTS_REQUEST' })
    
    try {
      // Simulate API call - replace with actual API call
      const mockProducts: MenuItem[] = [
        {
          id: 1,
          nama: 'Nasi Goreng',
          harga: 25000,
          kategori: 'makanan',
          kategori_id: 1,
          gambar: '/images/nasi-goreng.jpg',
          deskripsi: 'Nasi goreng spesial dengan telur dan ayam',
          status: 'tersedia',
          harga_eceran: 30000,
          harga_grosir: 28000,
          stok: 50
        },
        {
          id: 2,
          nama: 'Es Teh',
          harga: 5000,
          kategori: 'minuman',
          kategori_id: 2,
          gambar: '/images/es-teh.jpg',
          deskripsi: 'Teh manis dingin',
          status: 'tersedia',
          harga_eceran: 5000,
          harga_grosir: 4500,
          stok: 100
        }
      ]

      const mockCategories: Category[] = [
        {
          id: 1,
          nama: 'makanan',
          display_nama: 'Makanan',
          gambar: '/images/food-category.jpg',
          products_count: 15
        },
        {
          id: 2,
          nama: 'minuman',
          display_nama: 'Minuman',
          gambar: '/images/drinks-category.jpg',
          products_count: 10
        }
      ]

      dispatch({
        type: 'FETCH_PRODUCTS_SUCCESS',
        payload: { products: mockProducts, categories: mockCategories }
      })
    } catch (error) {
      dispatch({
        type: 'FETCH_PRODUCTS_ERROR',
        payload: 'Gagal memuat data produk'
      })
    }
  }

  const addProduct = (product: MenuItem) => {
    dispatch({ type: 'ADD_PRODUCT', payload: product })
  }

  const updateProduct = (product: MenuItem) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: product })
  }

  const deleteProduct = (id: number) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id })
  }

  const addCategory = (category: Category) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category })
  }

  const updateCategory = (category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category })
  }

  const deleteCategory = (id: number) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id })
  }

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <ProductContext.Provider value={{
      state,
      fetchProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      updateCategory,
      deleteCategory
    }}>
      {children}
    </ProductContext.Provider>
  )
}

export const useProducts = () => {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
