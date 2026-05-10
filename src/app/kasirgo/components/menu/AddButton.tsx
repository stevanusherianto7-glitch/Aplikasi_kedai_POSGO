import React from 'react';
import { AddButtonProps } from './types/menu.types';

export const AddButton: React.FC<AddButtonProps> = ({
  onClick,
  label,
  icon,
  color,
  fullWidth = false
}) => {
  const colorClasses = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  };

  return (
    <button
      onClick={onClick}
      className={`py-3 px-6 ${colorClasses[color]} text-white font-bold rounded-lg transition-all duration-200 ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {label}
    </button>
  );
};
