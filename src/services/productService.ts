import { Product } from '../types'

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Kopi Hitam',
    price: 15000,
    category: 'Minuman',
    stock: 50,
    description: 'Kopi hitam arabika pilihan',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Teh Manis',
    price: 10000,
    category: 'Minuman',
    stock: 30,
    description: 'Teh manis dingin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Nasi Goreng',
    price: 25000,
    category: 'Makanan',
    stock: 20,
    description: 'Nasi goreng spesial',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Ayam Goreng',
    price: 30000,
    category: 'Makanan',
    stock: 15,
    description: 'Ayam goreng crispy',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

class ProductService {
  private products: Product[] = [...mockProducts]

  async getProducts(): Promise<Product[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.products), 100)
    })
  }

  async getProductById(id: string): Promise<Product | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = this.products.find(p => p.id === id)
        resolve(product || null)
      }, 100)
    })
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct: Product = {
          ...product,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.products.push(newProduct)
        resolve(newProduct)
      }, 100)
    })
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            ...updates,
            updatedAt: new Date()
          }
          resolve(this.products[index])
        } else {
          resolve(null)
        }
      }, 100)
    })
  }

  async deleteProduct(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products.splice(index, 1)
          resolve(true)
        } else {
          resolve(false)
        }
      }, 100)
    })
  }
}

export const productService = new ProductService()