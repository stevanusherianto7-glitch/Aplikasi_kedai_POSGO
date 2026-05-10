import React from 'react';
import { MenuContentProps } from './types/menu.types';
import { NoteInput } from './NoteInput';
import { QuantityControls } from './QuantityControls';
import { AddButton } from './AddButton';
import { QuickAddSection } from './QuickAddSection';

export const MenuContent: React.FC<MenuContentProps> = ({
  item,
  quantity,
  note,
  relatedItems,
  extras,
  onAdd,
  onRemove,
  onNoteChange,
  onAddToCart,
  onAddRelatedItem
}) => {
  return (
    <div className="space-y-6">
      {/* Main Item Info */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {item.name}
        </h3>
        <p className="text-gray-600 mb-4">{item.description}</p>
        <div className="text-2xl font-bold text-emerald-600">
          Rp {item.price.toLocaleString('id-ID')}
        </div>
      </div>

      {/* Quantity Controls */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">Quantity</h3>
        <QuantityControls
          quantity={quantity}
          onAdd={onAdd}
          onRemove={onRemove}
          color="emerald"
        />
      </div>

      {/* Notes */}
      <NoteInput
        value={note}
        onChange={onNoteChange}
        color="emerald"
      />

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <QuickAddSection
          items={relatedItems}
          onAddToCart={onAddRelatedItem}
          color="emerald"
          type="related"
        />
      )}

      {/* Extras */}
      {extras.length > 0 && (
        <QuickAddSection
          items={extras}
          onAddToCart={onAddToCart}
          color="orange"
          type="extras"
        />
      )}

      {/* Add to Cart Button */}
      <AddButton
        onClick={() => onAddToCart(item, quantity, note)}
        label={`Add to Cart - Rp ${(item.price * quantity).toLocaleString('id-ID')}`}
        icon="Cart"
        color="emerald"
        fullWidth
      />
    </div>
  );
};
