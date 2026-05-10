import React from 'react';
import { MenuContainerProps } from './types/menu.types';
import { MenuContent } from './MenuContent';

export const MenuContainer: React.FC<MenuContainerProps> = ({
  isOpen,
  onClose,
  item,
  quantity,
  note,
  extras,
  onQuantityChange,
  onNoteChange,
  onAddToCart,
  onAddExtra,
  color
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden ${
          color === 'emerald' ? 'border-2 border-emerald-100' : 'border-2 border-orange-100'
        }`}
      >
        <div className="p-6">
          <MenuContent
            item={item}
            quantity={quantity}
            note={note}
            extras={extras}
            onQuantityChange={onQuantityChange}
            onNoteChange={onNoteChange}
            onAddToCart={onAddToCart}
            onAddExtra={onAddExtra}
            onClose={onClose}
            color={color}
          />
        </div>
      </div>
    </div>
  );
};
