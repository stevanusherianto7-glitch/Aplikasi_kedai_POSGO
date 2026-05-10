import React from 'react';
import { MenuInfoDisplayProps } from './types/menu.types';

export const MenuInfoDisplay: React.FC<MenuInfoDisplayProps> = ({ item }) => {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">
        {item.category === 'food' ? '🍔' : '🥤'}
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h2>
      <p className="text-gray-600 mb-4">{item.description}</p>
      <div className="text-3xl font-bold text-gray-800">
        Rp {item.price.toLocaleString('id-ID')}
      </div>
    </div>
  );
};
