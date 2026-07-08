import { useEffect, useRef } from 'react';
import {
  Check,
  Edit,
  ExternalLink,
  Link,
  Copy,
  Trash2,
  PlusCircle,
  Target,
  ChevronDown,
  ChevronRight,
  Circle,
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
    addEdge,
    deleteNode,
    deleteEdge,
    duplicateNode,
    addChildNode,
    addAttachmentLinkToNode,
    nodes,
    edges,
    selectedNodes,
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
  const selectedOtherNode = nodeId
    ? selectedNodes.find((selectedId) => selectedId !== nodeId)
    : undefined;

  const colorChoices = [
    '#ffffff',
    '#fef3c7',
    '#ffedd5',
    '#d1fae5',
    '#e0e7ff',
    '#fce7f3',
    '#1f2937',
    '#DC6300',
    '#3D8A06',
    '#3B7DD8',
    '#8b5cf6',
    '#ef4444',
  ];

  const menuItemClass =
    'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300';

  const promptForText = () => {
    if (!node || !nodeId) return;
    const text = prompt('Edit node text:', node.text);
    if (text !== null) {
      updateNode(nodeId, { text });
    }
  };

  const promptForTag = () => {
    if (!node || !nodeId) return;
    const tag = prompt('Node tag or label:', node.tag || '');
    if (tag !== null) {
      updateNode(nodeId, { tag });
    }
  };

  const promptForLevel = () => {
    if (!node || !nodeId) return;
    const level = prompt('Node level number:', String(node.level));
    if (level !== null) {
      updateNode(nodeId, { level: Number.parseInt(level, 10) || 0 });
    }
  };

  const promptForLink = () => {
    if (!nodeId) return;
    alert(
      'To keep the mind map file small, first save your file online, then paste the share link here.'
    );
    const url = prompt('Paste the online file link:');
    if (!url?.trim()) return;
    const name = prompt('Name for this link:', url.trim()) || url.trim();
    addAttachmentLinkToNode(nodeId, url.trim(), name.trim() || url.trim());
  };

  const connectSelectedNode = () => {
    if (!nodeId || !selectedOtherNode) return;
    const exists = edges.some(
      (edge) =>
        (edge.from === selectedOtherNode && edge.to === nodeId) ||
        (edge.from === nodeId && edge.to === selectedOtherNode)
    );
    if (!exists) {
      addEdge({
        id: `edge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        from: selectedOtherNode,
        to: nodeId,
        style: 'curved',
        lineStyle: 'solid',
        arrowType: 'single',
        color: '#DC6300',
      });
    }
  };

  if (nodeId && node) {
    return (
      <div
        ref={menuRef}
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 w-64 max-h-[90vh] overflow-y-auto"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => handleAction(promptForText)}
          className={menuItemClass}
        >
          <Edit size={16} />
          Edit Text
        </button>

        <button
          onClick={() => handleAction(() => addChildNode(nodeId))}
          className={menuItemClass}
        >
          <PlusCircle size={16} />
          Add Child
        </button>

        <button
          onClick={() => handleAction(() => duplicateNode(nodeId))}
          className={menuItemClass}
        >
          <Copy size={16} />
          Duplicate
        </button>

        <button
          onClick={() =>
            handleAction(() => updateNode(nodeId, { level: 0, text: node.text || 'Central Topic' }))
          }
          className={menuItemClass}
        >
          <Target size={16} />
          Set as Central Topic
        </button>

        <button
          onClick={() => handleAction(promptForLevel)}
          className={menuItemClass}
        >
          <Circle size={16} />
          Set Level
        </button>

        <button
          onClick={() => handleAction(promptForTag)}
          className={menuItemClass}
        >
          <Edit size={16} />
          Set Tag / Label
        </button>

        <button
          onClick={() =>
            handleAction(() => updateNode(nodeId, { collapsed: !node.collapsed }))
          }
          className={menuItemClass}
        >
          {node.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          {node.collapsed ? 'Expand' : 'Collapse'} Children
        </button>

        <button
          onClick={() => handleAction(() => updateNode(nodeId, { completed: !node.completed }))}
          className={menuItemClass}
        >
          <Check size={16} />
          {node.completed ? 'Mark Not Done' : 'Mark Done'}
        </button>

        <button
          onClick={() => handleAction(promptForLink)}
          className={menuItemClass}
        >
          <Link size={16} />
          Add Online File Link
        </button>

        {node.attachments?.[0]?.url && (
          <button
            onClick={() => handleAction(() => window.open(node.attachments?.[0]?.url, '_blank', 'noopener,noreferrer'))}
            className={menuItemClass}
          >
            <ExternalLink size={16} />
            Open First Link
          </button>
        )}

        {selectedOtherNode && (
          <button
            onClick={() => handleAction(connectSelectedNode)}
            className={menuItemClass}
          >
            <Link size={16} />
            Connect Selected Node
          </button>
        )}

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

        <div className="px-4 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Fill Color
          </div>
          <div className="grid grid-cols-6 gap-2">
            {colorChoices.map((color) => (
              <button
                key={`fill-${color}`}
                onClick={() =>
                  handleAction(() =>
                    updateNode(nodeId, { style: { ...node.style, fill: color } })
                  )
                }
                className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                aria-label={`Set fill color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Border Color
          </div>
          <div className="grid grid-cols-6 gap-2">
            {colorChoices.map((color) => (
              <button
                key={`border-${color}`}
                onClick={() =>
                  handleAction(() =>
                    updateNode(nodeId, { style: { ...node.style, borderColor: color } })
                  )
                }
                className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                aria-label={`Set border color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Text Color
          </div>
          <div className="grid grid-cols-6 gap-2">
            {colorChoices.map((color) => (
              <button
                key={`text-${color}`}
                onClick={() =>
                  handleAction(() =>
                    updateNode(nodeId, { style: { ...node.style, textColor: color } })
                  )
                }
                className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                aria-label={`Set text color ${color}`}
              />
            ))}
          </div>
        </div>

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
          className={menuItemClass}
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
          className={menuItemClass}
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
          className={menuItemClass}
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
