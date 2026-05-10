import { useMemo } from 'react';

export const useImageUtils = () => {
  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return getPlaceholderUrl();
    return url;
  };

  const getPlaceholderUrl = (): string => {
    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">
        <rect width="200" height="150" fill="#f8fafc"/>
        <text x="100" y="75" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14">No Image</text>
      </svg>
    `);
  };

  return { getImageUrl, getPlaceholderUrl };
};
