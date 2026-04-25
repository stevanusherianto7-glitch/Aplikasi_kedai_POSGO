export type Unit = 'kg' | 'gr' | 'ml' | 'l' | 'pcs' | 'pack' | 'sdm' | 'sdt' | 'btl' | 'cup' | 'tray';

export interface EditModalState {
  isOpen: boolean;
  type: 'ingredient' | 'recipe' | 'employee' | 'expense';
  data?: any;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  purchaseUnit: string;
  useUnit: Unit;
  conversionValue: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface RecipeItem {
  id: string;
  ingredientId: string;
  quantityNeeded: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  markupPercent: number;
  laborCost: number;
  overheadCost: number;
  shrinkagePercent: number;
  items: RecipeItem[];
  overheadBreakdown?: any;
  roundedSellingPrice?: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  avatarColor?: string;
  initials?: string;
}

export interface TransactionItem {
  recipeId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  date: string;
  totalPrice: number;
  totalHpp: number;
  paymentMethod: string;
  items: TransactionItem[];
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: 'Hadir' | 'Izin' | 'Alpha' | 'Sakit';
}

export interface RestaurantAsset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

export type ExpenseCategory = 'Operasional' | 'Bahan Baku' | 'Gaji' | 'Lainnya';

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
}

export type ShiftTypeLabel = 'Pagi' | 'Sore' | 'Full' | 'Off';

export enum ShiftType {
  Pagi = 'Pagi',
  Middle = 'Middle',
  Libur = 'Libur',
  PAGI = 'Pagi',
  MIDDLE = 'Middle',
  LIBUR = 'Libur'
}
