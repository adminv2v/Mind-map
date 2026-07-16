import { useEffect, useRef, useState } from 'react';
import { useMindMapStore } from '../store';
import { screenToWorld } from '../utils/geometry';
import { Node as NodeComponent } from './Node';
import { Edge as EdgeComponent } from './Edge';
import { Grid } from './Grid';

export const Canvas = () => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  const {
    nodes,
    edges,
    viewport,
    setViewport,
    clearSelection,
    theme,
    isDrawingConnection,
    tempConnectionEnd,
    connectionStart,
    alignmentGuides,
  } = useMindMapStore();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldBefore = screenToWorld(mouseX, mouseY, viewport);
      const newViewport = { ...viewport, zoom: newZoom };
      const worldAfter = screenToWorld(mouseX, mouseY, newViewport);

      setViewport({
        zoom: newZoom,
        x: viewport.x + (worldAfter.x - worldBefore.x) * newZoom,
        y: viewport.y + (worldAfter.y - worldBefore.y) * newZoom,
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      if (e.target === canvasRef.current) {
        clearSelection();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - viewport.x, y: touch.clientY - viewport.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (distance) {
        const delta = distance / lastTouchDistance;
        const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta));

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = centerX - rect.left;
          const mouseY = centerY - rect.top;
          const worldBefore = screenToWorld(mouseX, mouseY, viewport);
          const newViewport = { ...viewport, zoom: newZoom };
          const worldAfter = screenToWorld(mouseX, mouseY, newViewport);

          setViewport({
            zoom: newZoom,
            x: viewport.x + (worldAfter.x - worldBefore.x) * newZoom,
            y: viewport.y + (worldAfter.y - worldBefore.y) * newZoom,
          });
        }
        setLastTouchDistance(distance);
      }
    } else if (e.touches.length === 1 && isPanning) {
      const touch = e.touches[0];
      setViewport({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(null);
  };

  const startNode = connectionStart ? nodes.find((n) => n.id === connectionStart) : null;
  const hiddenNodeIds = new Set<string>();

  nodes.forEach((node) => {
    if (!node.collapsed) return;

    const stack = edges
      .filter((edge) => edge.from === node.id)
      .map((edge) => edge.to);

    while (stack.length > 0) {
      const childId = stack.pop();
      if (!childId || hiddenNodeIds.has(childId)) continue;

      hiddenNodeIds.add(childId);
      edges
        .filter((edge) => edge.from === childId)
        .forEach((edge) => stack.push(edge.to));
    }
  });

  const visibleNodes = nodes.filter((node) => !hiddenNodeIds.has(node.id));
  const visibleEdges = edges.filter(
    (edge) => !hiddenNodeIds.has(edge.from) && !hiddenNodeIds.has(edge.to)
  );
  const visibleWorldBounds = {
    left: -viewport.x / viewport.zoom,
    right: (dimensions.width - viewport.x) / viewport.zoom,
    top: -viewport.y / viewport.zoom,
    bottom: (dimensions.height - viewport.y) / viewport.zoom,
  };

  return (
    <svg
      ref={canvasRef}
      className={`w-full h-full cursor-${isPanning ? 'grabbing' : 'default'} ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
        </marker>
        <marker
          id="spacing-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="4"
          refY="4"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path d="M0,4 L8,0 L8,8 z" fill={theme === 'dark' ? '#ffb36b' : '#DC6300'} />
        </marker>
      </defs>

      <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
        <Grid viewport={viewport} dimensions={dimensions} theme={theme} />

        {alignmentGuides.map((guide, index) => {
          const guideColor = theme === 'dark' ? '#ffb36b' : '#DC6300';

          if (guide.type === 'spacing') {
            const isVerticalSpacing = guide.orientation === 'vertical';
            const start = guide.start ?? 0;
            const end = guide.end ?? 0;
            const crossStart = guide.crossStart ?? 0;
            const crossEnd = guide.crossEnd ?? 0;
            const labelX = isVerticalSpacing
              ? (start + end) / 2
              : (crossStart + crossEnd) / 2;
            const labelY = isVerticalSpacing
              ? (crossStart + crossEnd) / 2
              : (start + end) / 2;

            return (
              <g key={`spacing-${guide.orientation}-${index}`} pointerEvents="none">
                <line
                  x1={isVerticalSpacing ? start : crossStart}
                  y1={isVerticalSpacing ? crossStart : start}
                  x2={isVerticalSpacing ? end : crossEnd}
                  y2={isVerticalSpacing ? crossEnd : end}
                  stroke={guideColor}
                  strokeWidth={guide.isEqual ? 2 : 1.25}
                  strokeDasharray={guide.isEqual ? '4 4' : '2 5'}
                  opacity={guide.isEqual ? 1 : 0.82}
                  vectorEffect="non-scaling-stroke"
                  markerStart="url(#spacing-arrow)"
                  markerEnd="url(#spacing-arrow)"
                />
                {guide.showLabel && (
                  <text
                    x={labelX}
                    y={labelY - 8 / viewport.zoom}
                    fill={guideColor}
                    fontSize={12 / viewport.zoom}
                    fontWeight={guide.isEqual ? 800 : 700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    paintOrder="stroke"
                    stroke={theme === 'dark' ? '#111827' : '#ffffff'}
                    strokeWidth={3 / viewport.zoom}
                  >
                    {guide.label}
                  </text>
                )}
              </g>
            );
          }

          return (
            <line
              key={`alignment-${guide.orientation}-${guide.position}`}
              x1={guide.orientation === 'vertical' ? guide.position : guide.start ?? visibleWorldBounds.left}
              y1={guide.orientation === 'vertical' ? guide.start ?? visibleWorldBounds.top : guide.position}
              x2={guide.orientation === 'vertical' ? guide.position : guide.end ?? visibleWorldBounds.right}
              y2={guide.orientation === 'vertical' ? guide.end ?? visibleWorldBounds.bottom : guide.position}
              stroke={guideColor}
              strokeWidth={1.5}
              strokeDasharray="4 5"
              opacity={0.85}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          );
        })}

        {visibleEdges.map((edge) => (
          <EdgeComponent key={edge.id} edge={edge} />
        ))}

        {isDrawingConnection && startNode && tempConnectionEnd && (
          <EdgeComponent
            edge={{
              id: 'temp',
              from: startNode.id,
              to: 'temp',
              style: 'curved',
              lineStyle: 'dashed',
            }}
            tempEnd={tempConnectionEnd}
            isTemp
          />
        )}

        {visibleNodes.map((node) => (
          <NodeComponent key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
};
