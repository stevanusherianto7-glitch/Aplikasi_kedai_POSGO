import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { BrowserRouter as Router } from 'react-router-dom'

import { AppProvider } from '../contexts/AppContext'
import { CartProvider } from '../contexts/CartContext'
import { ProductProvider } from '../contexts/ProductContext'
import { TransactionProvider } from '../contexts/TransactionContext'
import { theme } from '../styles/theme'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <CartProvider>
            <ProductProvider>
              <TransactionProvider>
                {children}
              </TransactionProvider>
            </ProductProvider>
          </CartProvider>
        </Router>
      </AppProvider>
    </ThemeProvider>
  )
}

export default Providers
