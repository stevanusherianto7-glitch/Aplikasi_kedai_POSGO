import React from 'react';
import { RelatedItemProps } from './types/menu.types';

export const RelatedItem: React.FC<RelatedItemProps> = ({
  item,
  onAddToCart
}) => {
  return (
    <div className="flex items-center justify-between p-3 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
      <div>
        <h4 className="font-semibold text-gray-800">{item.name}</h4>
        <p className="text-sm text-gray-600">{item.description}</p>
        <p className="text-emerald-600 font-bold mt-1">
          Rp {item.price.toLocaleString('id-ID')}
        </p>
      </div>
      <button
        onClick={() => onAddToCart(item, 1, '')}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
      >
        Add
      </button>
    </div>
  );
};
