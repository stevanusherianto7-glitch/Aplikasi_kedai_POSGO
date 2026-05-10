import React from 'react';
import { QuantityControlsProps } from './types/menu.types';

export const QuantityControls: React.FC<QuantityControlsProps> = ({
  quantity,
  onAdd,
  onRemove,
  color
}) => {
  const colorClasses = {
    emerald: {
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      circle: 'bg-emerald-100 text-emerald-800'
    },
    orange: {
      button: 'bg-orange-500 hover:bg-orange-600 text-white',
      circle: 'bg-orange-100 text-orange-800'
    }
  };

  return (
    <div className="flex items-center justify-center space-x-6">
      <button
        onClick={onRemove}
        disabled={quantity <= 1}
        className={`w-12 h-12 rounded-full ${colorClasses[color].button} text-2xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        -
      </button>
      <div className={`w-16 h-16 rounded-full ${colorClasses[color].circle} flex items-center justify-center text-2xl font-bold`}>
        {quantity}
      </div>
      <button
        onClick={onAdd}
        className={`w-12 h-12 rounded-full ${colorClasses[color].button} text-2xl font-bold transition-all duration-200`}
      >
        +
      </button>
    </div>
  );
};
