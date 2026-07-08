import { useRef, useState, useEffect } from 'react';
import { Node as NodeType } from '../types';
import { useMindMapStore } from '../store';
import { screenToWorld } from '../utils/geometry';
import { getLevelStyle, getLevelColor } from '../utils/levelStyles';
import { Link, Paperclip, Plus, Check } from 'lucide-react';

interface NodeProps {
  node: NodeType;
}

export const Node = ({ node }: NodeProps) => {
  const {
    updateNode,
    selectNode,
    selectedNodes,
    viewport,
    startConnection,
    updateTempConnection,
    endConnection,
    theme,
    uploadFileToNode,
  } = useMindMapStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editText, setEditText] = useState(node.text);
  const [showHandle, setShowHandle] = useState(false);
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
  }, [isDragging, isResizing, dragStart, node]);

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

  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    startConnection(node.id);

    const handleMove = (moveEvent: MouseEvent) => {
      const world = screenToWorld(moveEvent.clientX, moveEvent.clientY, viewport);
      updateTempConnection(world);
    };

    const handleUp = (upEvent: MouseEvent) => {
      const target = upEvent.target as HTMLElement;
      const targetNodeId = target.getAttribute('data-node-id');
      endConnection(targetNodeId);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleAttachmentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach((file) => {
          uploadFileToNode(node.id, file);
        });
      }
    };
    input.click();
  };

  const levelStyle = getLevelStyle(node.level);
  const levelColors = getLevelColor(node.level, theme);

  const bgColor = node.completed ? '#1f2937' : (node.style.fill || levelColors.fill);
  const textColor = node.completed ? '#ffffff' : node.style.textColor;
  const borderColor = node.completed ? '#6b7280' : (isSelected ? '#3b82f6' : (node.style.borderColor || levelColors.border));

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
    <g
      data-node-id={node.id}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
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
            fill={theme === 'dark' ? '#10b981' : '#059669'}
            stroke="white"
            strokeWidth={2}
            className="cursor-pointer"
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
        </g>
      )}

      {(isSelected || showHandle) && (
        <g>
          <circle
            cx={node.x + node.w}
            cy={node.y + node.h / 2}
            r={8}
            fill={theme === 'dark' ? '#3b82f6' : '#2563eb'}
            stroke="white"
            strokeWidth={2}
            onMouseDown={handleConnectionStart}
            className="cursor-pointer"
            style={{ pointerEvents: 'all' }}
          />
          <foreignObject
            x={node.x + node.w - 6}
            y={node.y + node.h / 2 - 6}
            width={12}
            height={12}
            pointerEvents="none"
          >
            <Link size={12} color="white" />
          </foreignObject>

          <g>
            <circle
              cx={node.x + node.w / 2}
              cy={node.y + node.h + 20}
              r={8}
              fill={theme === 'dark' ? '#8b5cf6' : '#7c3aed'}
              stroke="white"
              strokeWidth={2}
              onClick={handleAttachmentClick}
              className="cursor-pointer"
              style={{ pointerEvents: 'all' }}
            />
            <foreignObject
              x={node.x + node.w / 2 - 6}
              y={node.y + node.h + 14}
              width={12}
              height={12}
              pointerEvents="none"
            >
              <Plus size={12} color="white" />
            </foreignObject>
            <title>Add files or folder</title>
          </g>
        </g>
      )}

      {isSelected && (
        <rect
          x={node.x + node.w - 8}
          y={node.y + node.h - 8}
          width={8}
          height={8}
          fill={theme === 'dark' ? '#3b82f6' : '#2563eb'}
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
