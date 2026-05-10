import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
} from '@mui/material'
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material'
import { Product } from '../types'
import { useCart } from '../contexts/CartContext'
import { useProducts } from '../hooks/useProducts'

const ProductPage: React.FC = () => {
  const { products, loading, error } = useProducts()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  const handleQuantityChange = (productId: string, value: number) => {
    if (value >= 0) {
      setQuantities(prev => ({
        ...prev,
        [productId]: value
      }))
    }
  }

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1
    addToCart(product, quantity)
    
    // Reset quantity after adding to cart
    setQuantities(prev => ({
      ...prev,
      [product.id]: 0
    }))
  }

  const handleViewCart = () => {
    navigate('/cart')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography>Loading products...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          onClick={handleViewCart}
        >
          View Cart
        </Button>
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {product.name}
                  </Typography>
                  <Chip
                    label={product.category}
                    color="primary"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {product.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="primary">
                    Rp {product.price.toLocaleString('id-ID')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stock: {product.stock}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Box width="100%" display="flex" gap={1}>
                  <TextField
                    type="number"
                    label="Qty"
                    value={quantities[product.id] || ''}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                    InputProps={{ inputProps: { min: 0, max: product.stock } }}
                    size="small"
                    sx={{ width: '80px' }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleAddToCart(product)}
                    disabled={(quantities[product.id] || 0) === 0}
                  >
                    Add to Cart
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default ProductPage
