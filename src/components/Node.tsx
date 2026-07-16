import { useRef, useState, useEffect } from 'react';
import { Node as NodeType } from '../types';
import { AlignmentGuide, useMindMapStore } from '../store';
import { screenToWorld } from '../utils/geometry';
import { getLevelStyle, getLevelColor } from '../utils/levelStyles';
import { Paperclip, Check } from 'lucide-react';

interface NodeProps {
  node: NodeType;
}

export const Node = ({ node }: NodeProps) => {
  const {
    updateNode,
    selectNode,
    selectedNodes,
    nodes,
    viewport,
    theme,
    setAlignmentGuides,
  } = useMindMapStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editText, setEditText] = useState(node.text);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const isSelected = selectedNodes.includes(node.id);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button === 0) {
      if (e.ctrlKey || e.metaKey) {
        selectNode(node.id, true);
      } else {
        selectNode(node.id, e.shiftKey);
        setIsDragging(true);
        const world = screenToWorld(e.clientX, e.clientY, viewport);
        setDragStart({ x: world.x - node.x, y: world.y - node.y });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const world = screenToWorld(e.clientX, e.clientY, viewport);
      const newX = world.x - dragStart.x;
      const newY = world.y - dragStart.y;

      updateNode(node.id, { x: newX, y: newY });
      setAlignmentGuides(getAlignmentGuides(newX, newY));
    } else if (isResizing) {
      const world = screenToWorld(e.clientX, e.clientY, viewport);
      const newW = Math.max(100, world.x - node.x);
      const newH = Math.max(50, world.y - node.y);

      updateNode(node.id, { w: newW, h: newH });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setAlignmentGuides([]);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, node, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    updateNode(node.id, { text: editText });
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setEditText(node.text);
      setIsEditing(false);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    selectNode(node.id);
  };

  const getAlignmentGuides = (x: number, y: number): AlignmentGuide[] => {
    const threshold = 6 / viewport.zoom;
    const spacingThreshold = 8 / viewport.zoom;
    const draggedPositions = {
      vertical: [x, x + node.w / 2, x + node.w],
      horizontal: [y, y + node.h / 2, y + node.h],
    };
    const draggedBounds = {
      left: x,
      right: x + node.w,
      top: y,
      bottom: y + node.h,
      centerX: x + node.w / 2,
      centerY: y + node.h / 2,
    };

    let bestVerticalPosition: number | null = null;
    let bestVerticalDistance = Number.POSITIVE_INFINITY;
    let bestHorizontalPosition: number | null = null;
    let bestHorizontalDistance = Number.POSITIVE_INFINITY;
    let bestVerticalSpacing: AlignmentGuide | null = null;
    let bestVerticalSpacingDistance = Number.POSITIVE_INFINITY;
    let bestHorizontalSpacing: AlignmentGuide | null = null;
    let bestHorizontalSpacingDistance = Number.POSITIVE_INFINITY;
    const otherNodes = nodes.filter((otherNode) => otherNode.id !== node.id);

    otherNodes.forEach((otherNode) => {
      const otherPositions = {
        vertical: [otherNode.x, otherNode.x + otherNode.w / 2, otherNode.x + otherNode.w],
        horizontal: [otherNode.y, otherNode.y + otherNode.h / 2, otherNode.y + otherNode.h],
      };

      draggedPositions.vertical.forEach((draggedPosition) => {
        otherPositions.vertical.forEach((otherPosition) => {
          const distance = Math.abs(draggedPosition - otherPosition);
          if (distance <= threshold && distance < bestVerticalDistance) {
            bestVerticalPosition = otherPosition;
            bestVerticalDistance = distance;
          }
        });
      });

      draggedPositions.horizontal.forEach((draggedPosition) => {
        otherPositions.horizontal.forEach((otherPosition) => {
          const distance = Math.abs(draggedPosition - otherPosition);
          if (distance <= threshold && distance < bestHorizontalDistance) {
            bestHorizontalPosition = otherPosition;
            bestHorizontalDistance = distance;
          }
        });
      });
    });

    for (let i = 0; i < otherNodes.length; i += 1) {
      for (let j = i + 1; j < otherNodes.length; j += 1) {
        const first = otherNodes[i];
        const second = otherNodes[j];

        const leftNode = first.x <= second.x ? first : second;
        const rightNode = leftNode === first ? second : first;
        const existingHorizontalGap = rightNode.x - (leftNode.x + leftNode.w);

        if (existingHorizontalGap >= 0) {
          const gapToLeft = draggedBounds.left - (rightNode.x + rightNode.w);
          const gapToRight = leftNode.x - draggedBounds.right;
          const gapBetweenLeftAndDragged = draggedBounds.left - (leftNode.x + leftNode.w);
          const gapBetweenDraggedAndRight = rightNode.x - draggedBounds.right;

          if (gapToLeft >= 0) {
            const distance = Math.abs(gapToLeft - existingHorizontalGap);
            if (distance <= spacingThreshold && distance < bestVerticalSpacingDistance) {
              bestVerticalSpacingDistance = distance;
              bestVerticalSpacing = {
                type: 'spacing',
                orientation: 'vertical',
                start: rightNode.x + rightNode.w,
                end: draggedBounds.left,
                crossStart: draggedBounds.centerY,
                crossEnd: draggedBounds.centerY,
                label: `${Math.round(existingHorizontalGap)}`,
              };
            }
          }

          if (gapToRight >= 0) {
            const distance = Math.abs(gapToRight - existingHorizontalGap);
            if (distance <= spacingThreshold && distance < bestVerticalSpacingDistance) {
              bestVerticalSpacingDistance = distance;
              bestVerticalSpacing = {
                type: 'spacing',
                orientation: 'vertical',
                start: draggedBounds.right,
                end: leftNode.x,
                crossStart: draggedBounds.centerY,
                crossEnd: draggedBounds.centerY,
                label: `${Math.round(existingHorizontalGap)}`,
              };
            }
          }

          if (gapBetweenLeftAndDragged >= 0 && gapBetweenDraggedAndRight >= 0) {
            const distance = Math.abs(gapBetweenLeftAndDragged - gapBetweenDraggedAndRight);
            if (distance <= spacingThreshold && distance < bestVerticalSpacingDistance) {
              const spacingLabel = `${Math.round(gapBetweenLeftAndDragged)} = ${Math.round(gapBetweenDraggedAndRight)}`;
              bestVerticalSpacingDistance = distance;
              bestVerticalSpacing = {
                type: 'spacing',
                orientation: 'vertical',
                start: leftNode.x + leftNode.w,
                end: rightNode.x,
                crossStart: draggedBounds.centerY,
                crossEnd: draggedBounds.centerY,
                label: spacingLabel,
              };
            }
          }
        }

        const topNode = first.y <= second.y ? first : second;
        const bottomNode = topNode === first ? second : first;
        const existingVerticalGap = bottomNode.y - (topNode.y + topNode.h);

        if (existingVerticalGap >= 0) {
          const gapAbove = draggedBounds.top - (bottomNode.y + bottomNode.h);
          const gapBelow = topNode.y - draggedBounds.bottom;
          const gapBetweenTopAndDragged = draggedBounds.top - (topNode.y + topNode.h);
          const gapBetweenDraggedAndBottom = bottomNode.y - draggedBounds.bottom;

          if (gapAbove >= 0) {
            const distance = Math.abs(gapAbove - existingVerticalGap);
            if (distance <= spacingThreshold && distance < bestHorizontalSpacingDistance) {
              bestHorizontalSpacingDistance = distance;
              bestHorizontalSpacing = {
                type: 'spacing',
                orientation: 'horizontal',
                start: bottomNode.y + bottomNode.h,
                end: draggedBounds.top,
                crossStart: draggedBounds.centerX,
                crossEnd: draggedBounds.centerX,
                label: `${Math.round(existingVerticalGap)}`,
              };
            }
          }

          if (gapBelow >= 0) {
            const distance = Math.abs(gapBelow - existingVerticalGap);
            if (distance <= spacingThreshold && distance < bestHorizontalSpacingDistance) {
              bestHorizontalSpacingDistance = distance;
              bestHorizontalSpacing = {
                type: 'spacing',
                orientation: 'horizontal',
                start: draggedBounds.bottom,
                end: topNode.y,
                crossStart: draggedBounds.centerX,
                crossEnd: draggedBounds.centerX,
                label: `${Math.round(existingVerticalGap)}`,
              };
            }
          }

          if (gapBetweenTopAndDragged >= 0 && gapBetweenDraggedAndBottom >= 0) {
            const distance = Math.abs(gapBetweenTopAndDragged - gapBetweenDraggedAndBottom);
            if (distance <= spacingThreshold && distance < bestHorizontalSpacingDistance) {
              const spacingLabel = `${Math.round(gapBetweenTopAndDragged)} = ${Math.round(gapBetweenDraggedAndBottom)}`;
              bestHorizontalSpacingDistance = distance;
              bestHorizontalSpacing = {
                type: 'spacing',
                orientation: 'horizontal',
                start: topNode.y + topNode.h,
                end: bottomNode.y,
                crossStart: draggedBounds.centerX,
                crossEnd: draggedBounds.centerX,
                label: spacingLabel,
              };
            }
          }
        }
      }
    }

    const guides: AlignmentGuide[] = [];
    if (bestVerticalPosition !== null) {
      guides.push({ type: 'alignment', orientation: 'vertical', position: bestVerticalPosition });
    }
    if (bestHorizontalPosition !== null) {
      guides.push({ type: 'alignment', orientation: 'horizontal', position: bestHorizontalPosition });
    }
    if (bestVerticalSpacing) {
      guides.push(bestVerticalSpacing);
    }
    if (bestHorizontalSpacing) {
      guides.push(bestHorizontalSpacing);
    }

    return guides;
  };

  const handleOpenAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    const firstUrl = node.attachments?.[0]?.url;
    if (firstUrl) {
      window.open(firstUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const levelStyle = getLevelStyle(node.level);
  const levelColors = getLevelColor(node.level, theme);

  const bgColor = node.completed ? '#1f2937' : (node.style.fill || levelColors.fill);
  const textColor = node.completed ? '#ffffff' : node.style.textColor;
  const borderColor = node.completed ? '#6b7280' : (isSelected ? '#DC6300' : (node.style.borderColor || levelColors.border));

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNode(node.id, { completed: !node.completed });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const timer = window.setTimeout(() => {
      selectNode(node.id, true);
      setLongPressTimer(null);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (longPressTimer !== null) {
      window.clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer !== null) {
      window.clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  return (
    <g data-node-id={node.id}>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={node.style.radius}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isSelected ? 2 : 1}
        filter={node.style.shadow ? 'url(#node-shadow)' : undefined}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className="cursor-move transition-all duration-200"
        style={{ pointerEvents: 'all' }}
      />

      <g>
        <rect
          x={node.x + 8}
          y={node.y + 8}
          width={20}
          height={20}
          rx={4}
          fill={node.completed ? '#10b981' : 'white'}
          stroke={node.completed ? '#059669' : '#9ca3af'}
          strokeWidth={2}
          onClick={handleToggleComplete}
          className="cursor-pointer transition-all duration-200"
          style={{ pointerEvents: 'all' }}
        />
        {node.completed && (
          <foreignObject
            x={node.x + 10}
            y={node.y + 10}
            width={16}
            height={16}
            pointerEvents="none"
          >
            <Check size={16} color="white" strokeWidth={3} />
          </foreignObject>
        )}
      </g>

      <defs>
        <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {!isEditing && (
        <text
          x={node.x + node.w / 2}
          y={node.y + node.h / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={levelStyle.fontSize}
          fontWeight={levelStyle.fontWeight}
          pointerEvents="none"
          className="select-none"
        >
          {node.text.split('\n').map((line, i, arr) => (
            <tspan
              key={i}
              x={node.x + node.w / 2}
              dy={i === 0 ? -(arr.length - 1) * 0.6 + 'em' : '1.2em'}
            >
              {line}
            </tspan>
          ))}
        </text>
      )}

      {isEditing && (
        <foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
          <textarea
            ref={textRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            className="w-full h-full resize-none border-none outline-none bg-transparent p-2"
            style={{
              color: textColor,
              fontSize: levelStyle.fontSize,
              fontWeight: levelStyle.fontWeight,
              textAlign: 'center',
            }}
          />
        </foreignObject>
      )}

      {node.attachments && node.attachments.length > 0 && (
        <g>
          <circle
            cx={node.x + node.w - 16}
            cy={node.y + 16}
            r={10}
            fill={theme === 'dark' ? '#ff8c3a' : '#DC6300'}
            stroke="white"
            strokeWidth={2}
            className="cursor-pointer"
            onClick={handleOpenAttachment}
            style={{ pointerEvents: 'all' }}
          />
          <foreignObject
            x={node.x + node.w - 22}
            y={node.y + 10}
            width={12}
            height={12}
            pointerEvents="none"
          >
            <Paperclip size={12} color="white" />
          </foreignObject>
          <text
            x={node.x + node.w - 16}
            y={node.y + 16}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={8}
            fontWeight="bold"
            pointerEvents="none"
            dy={10}
          >
            {node.attachments.length}
          </text>
          <title>{node.attachments.map((item) => item.name).join(', ')}</title>
        </g>
      )}

      {isSelected && (
        <rect
          x={node.x + node.w - 8}
          y={node.y + node.h - 8}
          width={8}
          height={8}
          fill={theme === 'dark' ? '#ff8c3a' : '#DC6300'}
          stroke="white"
          strokeWidth={1}
          onMouseDown={handleResizeMouseDown}
          className="cursor-nwse-resize"
          style={{ pointerEvents: 'all' }}
        />
      )}
    </g>
  );
};
