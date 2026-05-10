import { RouteObject } from 'react-router-dom'

import Layout from '../components/Layout'
import ProductPage from '../pages/ProductPage'
import CartPage from '../pages/CartPage'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ProductPage />
      },
      {
        path: 'cart',
        element: <CartPage />
      }
    ]
  }
]
