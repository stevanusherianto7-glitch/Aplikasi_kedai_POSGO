// Helper functions for Supabase storage operations

/**
 * Gets the public URL for a Supabase storage item
 * @param path The path to the file in Supabase storage
 * @returns The full public URL
 */
export const getSupabasePublicUrl = (path: string | null | undefined): string => {
  if (!path) {
    return getPlaceholderUrl();
  }

  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Construct the Supabase public URL
  const supabaseUrl = 'https://nfnpxkogqyxjqqdyywwe.supabase.co';
  const storagePath = path.startsWith('storage/v1/object/public/')
    ? path
    : `storage/v1/object/public/menu_items/${path}`;

  return `${supabaseUrl}/${storagePath}`;
};

/**
 * Gets a placeholder image URL
 * @returns A placeholder image URL
 */
export const getPlaceholderUrl = (): string => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzAgMTAwQzEzMCAxMTAuNDkzIDEzOC41MDcgMTIwIDE1MCAxMjBDMTYxLjQ5MyAxMjAgMTcwIDExMC40OTMgMTcwIDEwMEMxNzAgODkuNTA3IDE2MS40OTMgODAgMTUwIDgwQzEzOC41MDcgODAgMTMwIDg5LjUwNyAxMzAgMTAwWiIgZmlsbD0iI0Q5RDlEOCIvCjxwYXRoIGQ9Ik0xMjAgMTYwQzEyMCAxNjUuNTIzIDEyNC40NzcgMTcwIDEzMCAxNzBIMTcwQzE3NS41MjMgMTcwIDE4MCAxNjUuNTIzIDE4MCAxNjBDMTgwIDE1NC40NzcgMTc1LjUyMyAxNTAgMTcwIDE1MEgxMzBDMTI0LjQ3NyAxNTAgMTIwIDE1NC40NzcgMTIwIDE2MFoiIGZpbGw9IiNEOUQ5RDgiLz4KPC9zdmc+';
};

/**
 * Storage service object for potential future expansion
 */
export const storageService = {
  getPublicUrl: getSupabasePublicUrl,
  getPlaceholder: getPlaceholderUrl,
};