import React from 'react'

interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  image?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="product-placeholder">📦</div>
        )}
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">Rp {product.price.toLocaleString('id-ID')}</p>
        <p className="product-stock">Stok: {product.stock}</p>
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart?.(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Habis' : 'Tambah ke Keranjang'}
        </button>
      </div>
    </div>
  )
}

export default ProductCard