export const filenameFromMapName = (mapName?: string, fallback = 'Untitled Mind Map') => {
  const baseName = (mapName?.trim() || fallback).trim();
  const safeName = baseName
    .replace(/[<>:"/\\|?*]/g, '')
    .split('')
    .filter((character) => character.charCodeAt(0) > 31)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^-+|-+$/g, '');

  return safeName || fallback.replace(/\s+/g, '-');
};
