import React, { useState } from 'react'
import { Transaction } from '../types'

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onClose }) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    type: 'sale' as 'sale' | 'return',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTransaction(formData)
    setFormData({ productId: '', quantity: 1, type: 'sale' })
  }

  return (
    <div className="transaction-form">
      <h3>Add Transaction</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="productId">Product ID:</label>
          <input
            type="text"
            id="productId"
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            min="1"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'sale' | 'return' })}
          >
            <option value="sale">Sale</option>
            <option value="return">Return</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit">Add Transaction</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default TransactionForm