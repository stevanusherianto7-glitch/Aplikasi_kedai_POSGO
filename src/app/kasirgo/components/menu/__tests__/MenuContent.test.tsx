import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuContent } from '../MenuContent';
import { MenuItem } from '../types/menu.types';

const mockItem: MenuItem = {
  id: 1,
  name: 'Test Item',
  description: 'Test Description',
  price: 10000,
  category: 'Main',
  ingredients: [],
  allergens: [],
  tags: [],
  relatedItems: [],
  extras: [],
  customizable: false
};

const defaultProps = {
  item: mockItem,
  quantity: 1,
  note: '',
  relatedItems: [],
  extras: [],
  onAdd: jest.fn(),
  onRemove: jest.fn(),
  onNoteChange: jest.fn(),
  onAddToCart: jest.fn(),
  onAddRelatedItem: jest.fn()
};

describe('MenuContent', () => {
  it('renders item information correctly', () => {
    render(<MenuContent {...defaultProps} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Rp 10.000')).toBeInTheDocument();
  });

  it('shows quantity controls', () => {
    render(<MenuContent {...defaultProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
  });

  it('handles note input', () => {
    render(<MenuContent {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Add any special requests or notes...');
    fireEvent.change(textarea, { target: { value: 'Extra spicy' } });
    
    expect(defaultProps.onNoteChange).toHaveBeenCalledWith('Extra spicy');
  });

  it('disables minus button when quantity is 1', () => {
    render(<MenuContent {...defaultProps} />);
    
    const minusButton = screen.getByRole('button', { name: '-' });
    expect(minusButton).toBeDisabled();
  });

  it('calls onAddToCart when add button is clicked', () => {
    render(<MenuContent {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /Add to Cart/i });
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddToCart).toHaveBeenCalledWith(mockItem, 1, '');
  });
});
