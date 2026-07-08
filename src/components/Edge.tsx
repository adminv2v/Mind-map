import { Edge as EdgeType } from '../types';
import { useMindMapStore } from '../store';
import { getBezierPath, getStraightPath, getNodeCenter } from '../utils/geometry';

interface EdgeProps {
  edge: EdgeType;
  tempEnd?: { x: number; y: number };
  isTemp?: boolean;
}

export const Edge = ({ edge, tempEnd, isTemp = false }: EdgeProps) => {
  const { nodes, selectedEdges, selectEdge, theme } = useMindMapStore();

  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = tempEnd ? null : nodes.find((n) => n.id === edge.to);

  if (!fromNode) return null;

  const fromCenter = getNodeCenter(fromNode);
  const fromX = fromNode.x + fromNode.w;
  const fromY = fromCenter.y;

  let toX: number;
  let toY: number;

  if (tempEnd) {
    toX = tempEnd.x;
    toY = tempEnd.y;
  } else if (toNode) {
    const toCenter = getNodeCenter(toNode);
    toX = toNode.x;
    toY = toCenter.y;
  } else {
    return null;
  }

  const path =
    edge.style === 'straight'
      ? getStraightPath(fromX, fromY, toX, toY)
      : getBezierPath(fromX, fromY, toX, toY);

  const isSelected = selectedEdges.includes(edge.id);
  const strokeColor = edge.color || (theme === 'dark' ? '#9ca3af' : '#6b7280');
  const selectedColor = theme === 'dark' ? '#ff8c3a' : '#DC6300';

  const handleClick = (e: React.MouseEvent) => {
    if (!isTemp) {
      e.stopPropagation();
      selectEdge(edge.id, e.shiftKey);
    }
  };

  return (
    <g data-edge-id={edge.id}>
      <path
        d={path}
        fill="none"
        stroke={isSelected ? selectedColor : strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={edge.lineStyle === 'dashed' ? '5,5' : undefined}
        markerEnd={edge.arrowType !== 'none' && !isTemp ? 'url(#arrowhead)' : undefined}
        onClick={handleClick}
        className={isTemp ? '' : 'cursor-pointer hover:stroke-orange-500 transition-all'}
        style={{ pointerEvents: 'stroke' }}
      />

      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={10}
        onClick={handleClick}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
      />

      {edge.label && !isTemp && (
        <text>
          <textPath
            href={`#${edge.id}`}
            startOffset="50%"
            textAnchor="middle"
            fill={theme === 'dark' ? '#f9fafb' : '#111827'}
            fontSize={12}
            dy={-5}
          >
            {edge.label}
          </textPath>
        </text>
      )}
    </g>
  );
};
