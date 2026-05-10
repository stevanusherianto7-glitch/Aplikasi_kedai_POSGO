import React, { useState } from 'react'
import ProductCard from '../components/ProductCard'

const Products: React.FC = () => {
  const products = [
    {
      id: 1,
      name: 'Espresso',
      price: 25000,
      image: '/placeholder.svg?height=200&width=200'
    },
    {
      id: 2,
      name: 'Cappuccino',
      price: 30000,
      image: '/placeholder.svg?height=200&width=200'
    },
    {
      id: 3,
      name: 'Latte',
      price: 35000,
      image: '/placeholder.svg?height=200&width=200'
    }
  ]

  return (
    <div className="products-page">
      <h1>Products</h1>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default Products
