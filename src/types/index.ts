export interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  description?: string
  image?: string
  barcode?: string
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}

export interface Transaction {
  id: string
  items: CartItem[]
  total: number
  payment: number
  change: number
  createdAt: Date
  customerId?: string
  notes?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  totalTransactions: number
  totalRevenue: number
  todayTransactions: number
  todayRevenue: number
  lowStockProducts: Product[]
  topProducts: Product[]
}

export interface MenuItem {
  id: string
  no: number
  nama_menu: string
  kategori: 'makanan' | 'minuman' | 'pelengkap'
  harga: number
  order_type: 'take away' | 'dine in'
  chef_notes?: string
  metode_pembayaran: 'tunai' | 'non-tunai'
  status_pembayaran: 'lunas' | 'promo' | 'pending'
  image_url?: string
  created_at?: Date
  updated_at?: Date
}