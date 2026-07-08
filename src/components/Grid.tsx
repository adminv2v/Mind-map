interface GridProps {
  viewport: { x: number; y: number; zoom: number };
  dimensions: { width: number; height: number };
  theme: 'light' | 'dark';
}

export const Grid = ({ viewport, dimensions, theme }: GridProps) => {
  const minorGridSize = 8;
  const majorGridSize = 32;

  const startX = Math.floor((-viewport.x / viewport.zoom) / majorGridSize) * majorGridSize;
  const endX = Math.ceil(((dimensions.width - viewport.x) / viewport.zoom) / majorGridSize) * majorGridSize;
  const startY = Math.floor((-viewport.y / viewport.zoom) / majorGridSize) * majorGridSize;
  const endY = Math.ceil(((dimensions.height - viewport.y) / viewport.zoom) / majorGridSize) * majorGridSize;

  const minorLines = [];
  const majorLines = [];

  for (let x = startX; x <= endX; x += minorGridSize) {
    const isMajor = x % majorGridSize === 0;
    const line = (
      <line
        key={`v-${x}`}
        x1={x}
        y1={startY}
        x2={x}
        y2={endY}
        stroke={theme === 'dark' ? (isMajor ? '#2d2a26' : '#252220') : (isMajor ? '#d1d5db' : '#e5e7eb')}
        strokeWidth={isMajor ? 0.5 : 0.25}
      />
    );
    if (isMajor) majorLines.push(line);
    else minorLines.push(line);
  }

  for (let y = startY; y <= endY; y += minorGridSize) {
    const isMajor = y % majorGridSize === 0;
    const line = (
      <line
        key={`h-${y}`}
        x1={startX}
        y1={y}
        x2={endX}
        y2={y}
        stroke={theme === 'dark' ? (isMajor ? '#2d2a26' : '#252220') : (isMajor ? '#d1d5db' : '#e5e7eb')}
        strokeWidth={isMajor ? 0.5 : 0.25}
      />
    );
    if (isMajor) majorLines.push(line);
    else minorLines.push(line);
  }

  return (
    <>
      {minorLines}
      {majorLines}
    </>
  );
};
