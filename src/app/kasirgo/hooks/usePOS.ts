import { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { CartItem, ExpenseItem, Transaction, MenuItem } from '../types';
import { getCurrentFormattedDate } from '../utils/format';

export function usePOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS'>('Tunai');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [activeCategory, setActiveCategory] = useState<string>(
    Array.from(new Set<string>(MENU_ITEMS.map(item => item.category)))[0] || ''
  );
  const [history, setHistory] = useState<Transaction[]>([]);
  
  // Petty Cash States
  const [initialCash, setInitialCash] = useState<number>(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  
  // Modals
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [tempCashInput, setTempCashInput] = useState<string>('');
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const currentPettyCash = initialCash - totalExpenses;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // Assuming 0% tax/service for now
  const change = paymentMethod === 'Tunai' ? Math.max(0, cashAmount - total) : 0;

  const categories = Array.from(new Set<string>(menuItems.map(item => item.category)));
  const filteredMenu = menuItems.filter(item => item.category === activeCategory);

  const handleOpenCashModal = () => {
    setTempCashInput(initialCash > 0 ? initialCash.toString() : '');
    setIsCashModalOpen(true);
  };

  const handleSaveInitialCash = () => {
    const amount = Number(tempCashInput);
    if (!isNaN(amount)) {
      setInitialCash(amount);
    }
    setIsCashModalOpen(false);
  };

  const handleSaveExpense = () => {
    const amount = Number(expenseAmount);
    if (!isNaN(amount) && amount > 0 && expenseDesc.trim() !== '') {
      const newExpense: ExpenseItem = {
        id: Date.now(),
        description: expenseDesc,
        amount,
        date: getCurrentFormattedDate()
      };
      setExpenses(prev => [newExpense, ...prev]);
      setExpenseDesc('');
      setExpenseAmount('');
      setIsExpenseModalOpen(false);
    }
  };

  const deleteMenuItem = (id: number) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const editMenuItem = (item: MenuItem) => {
    const newName = prompt('Ubah nama menu:', item.name);
    const newPrice = prompt('Ubah harga menu:', item.price.toString());
    if (newName && newPrice) {
      setMenuItems((prev) => prev.map((i) => i.id === item.id ? { ...i, name: newName, price: Number(newPrice) } : i));
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const completeTransaction = () => {
    const transaction: Transaction = {
      id: Date.now(),
      items: [...cart],
      total,
      paymentMethod,
      date: getCurrentFormattedDate(),
    };
    setHistory((prev) => [transaction, ...prev]);
    setCart([]);
    setCashAmount(0);
  };

  return {
    cart, paymentMethod, setPaymentMethod, cashAmount, setCashAmount,
    menuItems, activeCategory, setActiveCategory, history,
    initialCash, expenses, currentPettyCash,
    isCashModalOpen, setIsCashModalOpen, tempCashInput, setTempCashInput,
    isExpenseModalOpen, setIsExpenseModalOpen, expenseDesc, setExpenseDesc, expenseAmount, setExpenseAmount,
    total, change, categories, filteredMenu,
    handleOpenCashModal, handleSaveInitialCash, handleSaveExpense,
    deleteMenuItem, editMenuItem, addToCart, completeTransaction
  };
}
