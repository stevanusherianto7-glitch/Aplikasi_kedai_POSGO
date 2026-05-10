import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { CartItem } from './CartContext'

export interface Transaction {
  id: string
  date: string
  items: CartItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'debt'
  status: 'pending' | 'completed' | 'cancelled'
  customer?: any
  cashier: string
}

export interface DashboardStats {
  todaySales: number
  todayTransactions: number
  todayItemsSold: number
  averageTransaction: number
  hourlySales: { hour: string; sales: number }[]
}

interface TransactionState {
  currentTransaction: Transaction | null
  transactions: Transaction[]
  dailyStats: DashboardStats
  loading: boolean
  error: string | null
}

type TransactionAction =
  | { type: 'START_TRANSACTION'; payload: Transaction }
  | { type: 'COMPLETE_TRANSACTION'; payload: string }
  | { type: 'CANCEL_TRANSACTION'; payload: string }
  | { type: 'LOAD_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_DAILY_STATS'; payload: DashboardStats }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialStats: DashboardStats = {
  todaySales: 0,
  todayTransactions: 0,
  todayItemsSold: 0,
  averageTransaction: 0,
  hourlySales: []
}

const initialState: TransactionState = {
  currentTransaction: null,
  transactions: [],
  dailyStats: initialStats,
  loading: false,
  error: null,
}

const transactionReducer = (state: TransactionState, action: TransactionAction): TransactionState => {
  switch (action.type) {
    case 'START_TRANSACTION':
      return {
        ...state,
        currentTransaction: action.payload,
        transactions: [action.payload, ...state.transactions]
      }

    case 'COMPLETE_TRANSACTION':
      return {
        ...state,
        currentTransaction: null,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.payload
            ? { ...transaction, status: 'completed' }
            : transaction
        )
      }

    case 'CANCEL_TRANSACTION':
      return {
        ...state,
        currentTransaction: null,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.payload
            ? { ...transaction, status: 'cancelled' }
            : transaction
        )
      }

    case 'LOAD_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload
      }

    case 'UPDATE_DAILY_STATS':
      return {
        ...state,
        dailyStats: action.payload
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }

    default:
      return state
  }
}

interface TransactionContextType {
  state: TransactionState
  startTransaction: (transaction: Transaction) => void
  completeTransaction: (id: string) => void
  cancelTransaction: (id: string) => void
  loadTransactions: (transactions: Transaction[]) => void
  updateDailyStats: (stats: DashboardStats) => void
  getTransactionsByDate: (date: string) => Transaction[]
  getTransactionsByStatus: (status: Transaction['status']) => Transaction[]
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(transactionReducer, initialState)

  const startTransaction = (transaction: Transaction) => {
    dispatch({ type: 'START_TRANSACTION', payload: transaction })
  }

  const completeTransaction = (id: string) => {
    dispatch({ type: 'COMPLETE_TRANSACTION', payload: id })
  }

  const cancelTransaction = (id: string) => {
    dispatch({ type: 'CANCEL_TRANSACTION', payload: id })
  }

  const loadTransactions = (transactions: Transaction[]) => {
    dispatch({ type: 'LOAD_TRANSACTIONS', payload: transactions })
  }

  const updateDailyStats = (stats: DashboardStats) => {
    dispatch({ type: 'UPDATE_DAILY_STATS', payload: stats })
  }

  const getTransactionsByDate = (date: string): Transaction[] => {
    return state.transactions.filter(transaction =>
      transaction.date.startsWith(date)
    )
  }

  const getTransactionsByStatus = (status: Transaction['status']): Transaction[] => {
    return state.transactions.filter(transaction =>
      transaction.status === status
    )
  }

  return (
    <TransactionContext.Provider value={{
      state,
      startTransaction,
      completeTransaction,
      cancelTransaction,
      loadTransactions,
      updateDailyStats,
      getTransactionsByDate,
      getTransactionsByStatus
    }}>
      {children}
    </TransactionContext.Provider>
  )
}

export const useTransactions = () => {
  const context = useContext(TransactionContext)
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider')
  }
  return context
}
