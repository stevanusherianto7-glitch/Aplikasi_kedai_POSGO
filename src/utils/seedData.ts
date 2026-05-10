import { dataService } from '../services/dataService'
import { Product } from '../types'

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Espresso',
    price: 25000,
    category: 'Coffee',
    stock: 50,
    description: 'Rich and bold espresso shot',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Cappuccino',
    price: 35000,
    category: 'Coffee',
    stock: 40,
    description: 'Espresso with steamed milk and foam',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Latte',
    price: 40000,
    category: 'Coffee',
    stock: 45,
    description: 'Espresso with steamed milk',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Americano',
    price: 28000,
    category: 'Coffee',
    stock: 60,
    description: 'Espresso with hot water',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Mocha',
    price: 42000,
    category: 'Coffee',
    stock: 35,
    description: 'Espresso with chocolate and milk',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Green Tea',
    price: 20000,
    category: 'Tea',
    stock: 30,
    description: 'Fresh green tea leaves',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    name: 'Black Tea',
    price: 18000,
    category: 'Tea',
    stock: 35,
    description: 'Strong black tea',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '8',
    name: 'Orange Juice',
    price: 25000,
    category: 'Juice',
    stock: 25,
    description: 'Freshly squeezed orange juice',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '9',
    name: 'Apple Juice',
    price: 25000,
    category: 'Juice',
    stock: 20,
    description: 'Fresh apple juice',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10',
    name: 'Chocolate Cake',
    price: 45000,
    category: 'Dessert',
    stock: 15,
    description: 'Rich chocolate cake',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '11',
    name: 'Croissant',
    price: 22000,
    category: 'Bakery',
    stock: 20,
    description: 'Buttery French croissant',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '12',
    name: 'Sandwich',
    price: 38000,
    category: 'Food',
    stock: 18,
    description: 'Fresh club sandwich',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export async function seedDatabase(): Promise<void> {
  try {
    console.log('Checking database connection...')
    const isConnected = await dataService.checkConnection()
    
    if (!isConnected) {
      console.error('Failed to connect to database. Please check your Supabase configuration.')
      return
    }

    console.log('Connection successful. Starting seed process...')
    await dataService.seedProducts(sampleProducts)
    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

// Auto-seed if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
}
