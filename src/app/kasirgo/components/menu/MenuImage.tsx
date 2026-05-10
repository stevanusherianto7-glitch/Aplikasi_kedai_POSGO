import React from 'react';
import { MenuImageProps } from './types/menu.types';
import { X } from 'lucide-react';

export const MenuImage: React.FC<MenuImageProps> = ({ imageUrl, name, onClose }) => {
  return (
    <div className="relative">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-48 object-cover rounded-t-lg"
        loading="lazy"
      />
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors duration-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
