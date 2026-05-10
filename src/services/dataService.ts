import { supabase } from './supabaseClient'
import { Product } from '../types'

interface SupabaseProduct {
  id: string
  name: string
  price: number
  category: string
  stock: number
  description: string
  created_at: string
  updated_at: string
}

class DataService {
  async fetchProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    return (data as SupabaseProduct[]).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      stock: item.stock,
      description: item.description,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }))
  }

  async seedProducts(products: Product[]): Promise<void> {
    console.log('Starting to seed products...')
    
    // First, clear existing data
    await supabase.from('products').delete().neq('id', '')
    
    // Insert new products
    const productsToInsert = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString()
    }))

    const { data, error } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select()

    if (error) {
      console.error('Error seeding products:', error)
      throw error
    }

    console.log(`Successfully seeded ${products.length} products`)
    console.log('Inserted products:', data)
  }

  async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1)

      if (error) {
        console.error('Connection error:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Connection test failed:', err)
      return false
    }
  }
}

export const dataService = new DataService()
