export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: 'food' | 'drink';
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  note: string;
}

export interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  color: 'emerald' | 'orange';
}

export interface MenuContainerProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  quantity: number;
  note: string;
  extras: Array<{
    item: MenuItem;
    quantity: number;
    note: string;
  }>;
  onQuantityChange: (quantity: number) => void;
  onNoteChange: (note: string) => void;
  onAddToCart: (item: MenuItem, quantity: number, note: string) => void;
  onAddExtra: (item: MenuItem, quantity: number, note: string) => void;
  color: 'emerald' | 'orange';
}

export interface MenuContentProps {
  item: MenuItem;
  quantity: number;
  note: string;
  extras: Array<{
    item: MenuItem;
    quantity: number;
    note: string;
  }>;
  onQuantityChange: (quantity: number) => void;
  onNoteChange: (note: string) => void;
  onAddToCart: (item: MenuItem, quantity: number, note: string) => void;
  onAddExtra: (item: MenuItem, quantity: number, note: string) => void;
  onClose: () => void;
  color: 'emerald' | 'orange';
}

export interface AddButtonProps {
  onClick: () => void;
  label: string;
  icon: 'Cart' | 'Plus' | 'Package';
  color: 'emerald' | 'orange';
  fullWidth?: boolean;
}

export interface NoteInputProps {
  value: string;
  onChange: (value: string) => void;
  color: 'emerald' | 'orange';
}

export interface QuantityControlsProps {
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  color: 'emerald' | 'orange';
}

export interface MenuInfoDisplayProps {
  item: MenuItem;
}

export interface QuickAddSectionProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem, quantity: number, note: string) => void;
  color: 'emerald' | 'orange';
  type: 'related' | 'extra';
}
