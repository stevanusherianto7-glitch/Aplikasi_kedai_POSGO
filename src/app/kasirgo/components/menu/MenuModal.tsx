import React, { useState, useEffect } from 'react';
import { MenuModalProps } from './types/menu.types';
import { MenuContainer } from './MenuContainer';

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  item,
  color
}) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [extras, setExtras] = useState<Array<{
    item: MenuItem;
    quantity: number;
    note: string;
  }>>([]);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNote('');
      setExtras([]);
    }
  }, [isOpen, item]);

  const handleAddToCart = (cartItem: MenuItem, qty: number, note: string) => {
    console.log('Adding to cart:', { ...cartItem, quantity: qty, note });
  };

  const handleAddExtra = (extraItem: MenuItem, qty: number, note: string) => {
    setExtras(prev => [...prev, { item: extraItem, quantity: qty, note }]);
  };

  return (
    <MenuContainer
      isOpen={isOpen}
      onClose={onClose}
      item={item}
      quantity={quantity}
      note={note}
      extras={extras}
      onQuantityChange={setQuantity}
      onNoteChange={setNote}
      onAddToCart={handleAddToCart}
      onAddExtra={handleAddExtra}
      color={color}
    />
  );
};
