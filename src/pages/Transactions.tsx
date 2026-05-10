import React, { useState } from 'react'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'

const Transactions: React.FC = () => {
  return (
    <div className="transactions-page">
      <h1>Transactions</h1>
      <div className="transactions-content">
        <TransactionForm />
        <TransactionList />
      </div>
    </div>
  )
}

export default Transactions
