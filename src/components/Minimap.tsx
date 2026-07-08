import { useMemo, useRef, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { useMindMapStore } from '../store';

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 132;
const PADDING = 18;

export const Minimap = () => {
  const ref = useRef<SVGSVGElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { nodes, edges, viewport, setViewport, theme } = useMindMapStore();

  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: -400, minY: -300, maxX: 400, maxY: 300, width: 800, height: 600 };
    }

    const nodeBounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.x),
        minY: Math.min(acc.minY, node.y),
        maxX: Math.max(acc.maxX, node.x + node.w),
        maxY: Math.max(acc.maxY, node.y + node.h),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    const width = Math.max(1, nodeBounds.maxX - nodeBounds.minX);
    const height = Math.max(1, nodeBounds.maxY - nodeBounds.minY);

    return {
      ...nodeBounds,
      width,
      height,
    };
  }, [nodes]);

  const scale = Math.min(
    (MINIMAP_WIDTH - PADDING * 2) / bounds.width,
    (MINIMAP_HEIGHT - PADDING * 2) / bounds.height
  );
  const contentWidth = bounds.width * scale;
  const contentHeight = bounds.height * scale;
  const offsetX = (MINIMAP_WIDTH - contentWidth) / 2;
  const offsetY = (MINIMAP_HEIGHT - contentHeight) / 2;

  const worldToMini = (x: number, y: number) => ({
    x: offsetX + (x - bounds.minX) * scale,
    y: offsetY + (y - bounds.minY) * scale,
  });

  const miniToWorld = (x: number, y: number) => ({
    x: (x - offsetX) / scale + bounds.minX,
    y: (y - offsetY) / scale + bounds.minY,
  });

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const visibleWorld = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: screenWidth / viewport.zoom,
    height: screenHeight / viewport.zoom,
  };
  const visibleTopLeft = worldToMini(visibleWorld.x, visibleWorld.y);

  const moveViewportTo = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const miniX = Math.max(0, Math.min(MINIMAP_WIDTH, clientX - rect.left));
    const miniY = Math.max(0, Math.min(MINIMAP_HEIGHT, clientY - rect.top));
    const center = miniToWorld(miniX, miniY);

    setViewport({
      x: screenWidth / 2 - center.x * viewport.zoom,
      y: screenHeight / 2 - center.y * viewport.zoom,
    });
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    moveViewportTo(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.buttons !== 1) return;
    moveViewportTo(event.clientX, event.clientY);
  };

  const handleFit = () => {
    if (nodes.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }

    const zoom = Math.max(
      0.1,
      Math.min(
        2,
        Math.min(screenWidth / (bounds.width + 160), screenHeight / (bounds.height + 160))
      )
    );

    setViewport({
      zoom,
      x: screenWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom,
      y: screenHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom,
    });
  };

  const handleZoom = (factor: number) => {
    setViewport({
      zoom: Math.max(0.1, Math.min(3, viewport.zoom * factor)),
    });
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-xl transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-label="Open minimap"
        title="Open minimap"
      >
        <Maximize2 size={18} />
      </button>
    );
  }

  const panelClass =
    theme === 'dark'
      ? 'border-gray-700 bg-gray-900/95 text-gray-200'
      : 'border-gray-200 bg-white/95 text-gray-700';

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 overflow-hidden rounded-lg border shadow-xl backdrop-blur ${panelClass}`}
      aria-label="Minimap"
    >
      <svg
        ref={ref}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
        className="block cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <rect
          x={0}
          y={0}
          width={MINIMAP_WIDTH}
          height={MINIMAP_HEIGHT}
          fill={theme === 'dark' ? '#111827' : '#f8fafc'}
        />

        {edges.map((edge) => {
          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);
          if (!from || !to) return null;

          const start = worldToMini(from.x + from.w / 2, from.y + from.h / 2);
          const end = worldToMini(to.x + to.w / 2, to.y + to.h / 2);

          return (
            <line
              key={edge.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={theme === 'dark' ? '#6b7280' : '#9ca3af'}
              strokeWidth={1}
              opacity={0.75}
            />
          );
        })}

        {nodes.map((node) => {
          const pos = worldToMini(node.x, node.y);
          return (
            <rect
              key={node.id}
              x={pos.x}
              y={pos.y}
              width={Math.max(3, node.w * scale)}
              height={Math.max(2, node.h * scale)}
              rx={2}
              fill={node.style.fill || '#ffffff'}
              stroke={node.style.borderColor || '#DC6300'}
              strokeWidth={0.8}
            />
          );
        })}

        <rect
          x={visibleTopLeft.x}
          y={visibleTopLeft.y}
          width={visibleWorld.width * scale}
          height={visibleWorld.height * scale}
          rx={3}
          fill="rgba(220, 99, 0, 0.12)"
          stroke="#DC6300"
          strokeWidth={1.5}
        />
      </svg>

      <div className="flex items-center justify-between border-t border-gray-200 px-2 py-1 dark:border-gray-700">
        <button
          onClick={() => handleZoom(1 / 1.15)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus size={15} />
        </button>
        <button
          onClick={handleFit}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Fit map to screen"
          title="Fit map to screen"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={() => handleZoom(1.15)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus size={15} />
        </button>
        <button
          onClick={() => setIsCollapsed(true)}
          className="ml-1 flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Collapse minimap"
          title="Collapse minimap"
        >
          Hide
        </button>
      </div>
    </div>
  );
};
