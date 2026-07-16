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

    const draggedNode = { ...node, x, y };
    const candidateNodes = [...otherNodes, draggedNode];
    const verticalStack = candidateNodes
      .filter((candidate) => {
        const candidateCenterX = candidate.x + candidate.w / 2;
        const overlapsDragged = candidate.x < draggedBounds.right && candidate.x + candidate.w > draggedBounds.left;
        const centerDistance = Math.abs(candidateCenterX - draggedBounds.centerX);
        return candidate.id === node.id || overlapsDragged || centerDistance <= 60 / viewport.zoom;
      })
      .sort((first, second) => first.y - second.y);
    const horizontalStack = candidateNodes
      .filter((candidate) => {
        const candidateCenterY = candidate.y + candidate.h / 2;
        const overlapsDragged = candidate.y < draggedBounds.bottom && candidate.y + candidate.h > draggedBounds.top;
        const centerDistance = Math.abs(candidateCenterY - draggedBounds.centerY);
        return candidate.id === node.id || overlapsDragged || centerDistance <= 60 / viewport.zoom;
      })
      .sort((first, second) => first.x - second.x);

    const spacingGuides: AlignmentGuide[] = [];
    const verticalGaps = verticalStack
      .map((currentNode, index) => {
        const nextNode = verticalStack[index + 1];
        if (!nextNode) return null;

        return {
          start: currentNode.y + currentNode.h,
          end: nextNode.y,
          right: Math.max(currentNode.x + currentNode.w, nextNode.x + nextNode.w),
          value: nextNode.y - (currentNode.y + currentNode.h),
        };
      })
      .filter((gap): gap is { start: number; end: number; right: number; value: number } => gap !== null && gap.value >= 0);
    const horizontalGaps = horizontalStack
      .map((currentNode, index) => {
        const nextNode = horizontalStack[index + 1];
        if (!nextNode) return null;

        return {
          start: currentNode.x + currentNode.w,
          end: nextNode.x,
          bottom: Math.max(currentNode.y + currentNode.h, nextNode.y + nextNode.h),
          value: nextNode.x - (currentNode.x + currentNode.w),
        };
      })
      .filter((gap): gap is { start: number; end: number; bottom: number; value: number } => gap !== null && gap.value >= 0);
    const verticalGapsAreEqual =
      verticalGaps.length >= 2 && Math.max(...verticalGaps.map((gap) => gap.value)) - Math.min(...verticalGaps.map((gap) => gap.value)) <= spacingThreshold;
    const horizontalGapsAreEqual =
      horizontalGaps.length >= 2 && Math.max(...horizontalGaps.map((gap) => gap.value)) - Math.min(...horizontalGaps.map((gap) => gap.value)) <= spacingThreshold;

    verticalGaps.forEach((gap) => {
      spacingGuides.push({
        type: 'spacing',
        orientation: 'horizontal',
        start: gap.start,
        end: gap.end,
        crossStart: gap.right + 18 / viewport.zoom,
        crossEnd: gap.right + 18 / viewport.zoom,
        label: `${Math.round(gap.value)}`,
        isEqual: verticalGapsAreEqual,
      });
    });

    horizontalGaps.forEach((gap) => {
      spacingGuides.push({
        type: 'spacing',
        orientation: 'vertical',
        start: gap.start,
        end: gap.end,
        crossStart: gap.bottom + 18 / viewport.zoom,
        crossEnd: gap.bottom + 18 / viewport.zoom,
        label: `${Math.round(gap.value)}`,
        isEqual: horizontalGapsAreEqual,
      });
    });

    const guides: AlignmentGuide[] = [];
    if (bestVerticalPosition !== null) {
      guides.push({ type: 'alignment', orientation: 'vertical', position: bestVerticalPosition });
    }
    if (bestHorizontalPosition !== null) {
      guides.push({ type: 'alignment', orientation: 'horizontal', position: bestHorizontalPosition });
    }
    guides.push(...spacingGuides.slice(0, 6));

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
