export const filenameFromMapName = (mapName?: string, fallback = 'Untitled Mind Map') => {
  const baseName = (mapName?.trim() || fallback).trim();
  const safeName = baseName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^-+|-+$/g, '');

  return safeName || fallback.replace(/\s+/g, '-');
};
