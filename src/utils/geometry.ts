export const snapToGrid = (value: number, gridSize: number = 8): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const getNodeCenter = (node: { x: number; y: number; w: number; h: number }) => ({
  x: node.x + node.w / 2,
  y: node.y + node.h / 2,
});

export const getBezierPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(distance / 2, 100);

  const cx1 = x1 + offset;
  const cy1 = y1;
  const cx2 = x2 - offset;
  const cy2 = y2;

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
};

export const getStraightPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string => {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
};

export const isPointInRect = (
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean => {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

export const screenToWorld = (
  screenX: number,
  screenY: number,
  viewport: { x: number; y: number; zoom: number }
) => ({
  x: (screenX - viewport.x) / viewport.zoom,
  y: (screenY - viewport.y) / viewport.zoom,
});

export const worldToScreen = (
  worldX: number,
  worldY: number,
  viewport: { x: number; y: number; zoom: number }
) => ({
  x: worldX * viewport.zoom + viewport.x,
  y: worldY * viewport.zoom + viewport.y,
});
