import { useEffect, useRef } from 'react';
import {
  Edit,
  Copy,
  Trash2,
  PlusCircle,
  Target,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useMindMapStore } from '../store';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  onClose: () => void;
}

export const ContextMenu = ({ x, y, nodeId, edgeId, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    deleteNode,
    deleteEdge,
    duplicateNode,
    addChildNode,
    nodes,
    edges,
    updateNode,
    updateEdge,
  } = useMindMapStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const node = nodeId ? nodes.find((n) => n.id === nodeId) : null;
  const edge = edgeId ? edges.find((e) => e.id === edgeId) : null;

  if (nodeId && node) {
    return (
      <div
        ref={menuRef}
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-48"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => handleAction(() => {})}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <Edit size={16} />
          Edit Text
        </button>

        <button
          onClick={() => handleAction(() => addChildNode(nodeId))}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <PlusCircle size={16} />
          Add Child
        </button>

        <button
          onClick={() => handleAction(() => duplicateNode(nodeId))}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <Copy size={16} />
          Duplicate
        </button>

        <button
          onClick={() =>
            handleAction(() => updateNode(nodeId, { level: 0, text: node.text || 'Central Topic' }))
          }
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <Target size={16} />
          Set as Central Topic
        </button>

        <button
          onClick={() =>
            handleAction(() => updateNode(nodeId, { collapsed: !node.collapsed }))
          }
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          {node.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          {node.collapsed ? 'Expand' : 'Collapse'} Children
        </button>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        <button
          onClick={() => handleAction(() => deleteNode(nodeId))}
          className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm text-red-600 dark:text-red-400"
        >
          <Trash2 size={16} />
          Delete Node
        </button>
      </div>
    );
  }

  if (edgeId && edge) {
    return (
      <div
        ref={menuRef}
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-48"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => {
            const label = prompt('Enter connection label:', edge.label || '');
            if (label !== null) {
              handleAction(() => updateEdge(edgeId, { label }));
            } else {
              onClose();
            }
          }}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <Edit size={16} />
          Edit Label
        </button>

        <button
          onClick={() =>
            handleAction(() =>
              updateEdge(edgeId, {
                style: edge.style === 'curved' ? 'straight' : 'curved',
              })
            )
          }
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <Edit size={16} />
          Style: {edge.style === 'curved' ? 'Straight' : 'Curved'}
        </button>

        <button
          onClick={() =>
            handleAction(() =>
              updateEdge(edgeId, {
                lineStyle: edge.lineStyle === 'solid' ? 'dashed' : 'solid',
              })
            )
          }
          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
        >
          <Edit size={16} />
          Line: {edge.lineStyle === 'solid' ? 'Dashed' : 'Solid'}
        </button>

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        <button
          onClick={() => handleAction(() => deleteEdge(edgeId))}
          className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm text-red-600 dark:text-red-400"
        >
          <Trash2 size={16} />
          Delete Connection
        </button>
      </div>
    );
  }

  return null;
};
