import React from 'react';
import { QuickAddSectionProps } from './types/menu.types';

export const QuickAddSection: React.FC<QuickAddSectionProps> = ({
  items,
  onAddToCart,
  color,
  type
}) => {
  const colorClasses = {
    emerald: {
      border: 'border-emerald-500',
      button: 'bg-emerald-500 hover:bg-emerald-600',
      text: 'text-emerald-600'
    },
    orange: {
      border: 'border-orange-500',
      button: 'bg-orange-500 hover:bg-orange-600',
      text: 'text-orange-600'
    }
  };

  const title = type === 'related' ? 'Related Items' : 'Add Extras';
  const buttonText = type === 'related' ? 'Add' : 'Add Extra';

  return (
    <div>
      <h3 className={`text-lg font-medium ${colorClasses[color].text} mb-3`}>
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onAddToCart(item, 1, '')}
            className={`p-4 border-2 ${colorClasses[color].border} rounded-lg text-left transition-all duration-200 hover:shadow-md`}
          >
            <div className="font-semibold text-gray-800">{item.name}</div>
            <div className="text-sm text-gray-600">{item.description}</div>
            <div className="text-lg font-bold text-gray-800 mt-1">
              Rp {item.price.toLocaleString('id-ID')}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(item, 1, '');
              }}
              className={`mt-2 px-3 py-1 ${colorClasses[color].button} text-white rounded-md text-sm transition-all duration-200`}
            >
              {buttonText}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
};
