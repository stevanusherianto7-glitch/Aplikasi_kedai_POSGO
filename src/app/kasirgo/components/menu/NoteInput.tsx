import React from 'react';
import { NoteInputProps } from './types/menu.types';

export const NoteInput: React.FC<NoteInputProps> = ({
  value,
  onChange,
  color
}) => {
  const colorClasses = {
    emerald: 'focus:ring-emerald-500 focus:border-emerald-500',
    orange: 'focus:ring-orange-500 focus:border-orange-500'
  };

  return (
    <div>
      <label className="block text-lg font-medium text-gray-800 mb-2">
        Notes (Optional)
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add any special requests or notes..."
        className={`w-full p-3 border-2 border-gray-300 rounded-lg ${colorClasses[color]} transition-all duration-200 focus:outline-none`}
        rows={3}
      />
    </div>
  );
};
