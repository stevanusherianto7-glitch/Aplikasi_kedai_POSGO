import { useState } from 'react';

export const useMenuFlip = () => {
  const [flippedItemId, setFlippedItemId] = useState<string | number | null>(null);

  const flipItem = (itemId: string | number) => {
    setFlippedItemId(prev => prev === itemId ? null : itemId);
  };

  const closeDetail = () => {
    setFlippedItemId(null);
  };

  return {
    flippedItemId,
    flipItem,
    closeDetail,
    isFlipped: (itemId: string | number) => flippedItemId === itemId
  };
};
