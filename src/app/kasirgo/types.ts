export type CartItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  isTakeAway?: boolean;
};

export type ExpenseItem = {
  id: string | number;
  description: string;
  amount: number;
  date: string;
  timestamp?: Date;
};

export type Transaction = {
  id: string | number;
  items: CartItem[];
  total: number;
  paymentMethod: 'Tunai' | 'QRIS';
  date: string;
};

export type MenuItem = {
  id: string | number;
  name: string;
  price: number;
  category: string;
};
