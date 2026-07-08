import { useEffect, useRef, useState } from 'react';
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
  const [openColorSection, setOpenColorSection] = useState<'fill' | 'border' | 'text' | null>(null);
  const [customColor, setCustomColor] = useState('#DC6300');
  const [customColors, setCustomColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mindmap-custom-colors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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
    ...customColors,
  ];

  const menuItemClass =
    'w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300';

  const normalizeHex = (value: string) => {
    const trimmed = value.trim();
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : null;
  };

  const saveCustomColor = (color: string) => {
    const normalized = normalizeHex(color);
    if (!normalized) return null;

    const nextColors = [normalized, ...customColors.filter((item) => item !== normalized)].slice(0, 12);
    setCustomColors(nextColors);
    localStorage.setItem('mindmap-custom-colors', JSON.stringify(nextColors));
    return normalized;
  };

  const applyColor = (target: 'fill' | 'border' | 'text', color: string) => {
    if (!node || !nodeId) return;

    const styleKey =
      target === 'fill' ? 'fill' : target === 'border' ? 'borderColor' : 'textColor';

    updateNode(nodeId, {
      style: {
        ...node.style,
        [styleKey]: color,
      },
    });
  };

  const applyCustomColor = (target: 'fill' | 'border' | 'text') => {
    const normalized = saveCustomColor(customColor);
    if (normalized) {
      applyColor(target, normalized);
      setOpenColorSection(null);
      onClose();
    } else {
      alert('Please enter a valid hex color, for example #DC6300.');
    }
  };

  const ColorSection = ({
    title,
    target,
  }: {
    title: string;
    target: 'fill' | 'border' | 'text';
  }) => (
    <div className="px-4 py-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setOpenColorSection(openColorSection === target ? null : target);
          }}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Custom
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {Array.from(new Set(colorChoices)).map((color) => (
          <button
            key={`${target}-${color}`}
            onClick={() => handleAction(() => applyColor(target, color))}
            className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: color }}
            aria-label={`Set ${title.toLowerCase()} ${color}`}
          />
        ))}
      </div>

      {openColorSection === target && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
            Choose color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalizeHex(customColor) ?? '#DC6300'}
              onChange={(event) => setCustomColor(event.target.value)}
              className="h-9 w-11 cursor-pointer rounded border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800"
              aria-label="Color wheel"
            />
            <input
              value={customColor}
              onChange={(event) => setCustomColor(event.target.value)}
              placeholder="#DC6300"
              className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              aria-label="Hex color code"
            />
          </div>
          <button
            onClick={() => applyCustomColor(target)}
            className="mt-3 w-full rounded bg-accent-orange px-3 py-2 text-sm font-semibold text-white hover:bg-accent-orange-light"
          >
            Add Color
          </button>
        </div>
      )}
    </div>
  );

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

        <ColorSection title="Fill Color" target="fill" />
        <ColorSection title="Border Color" target="border" />
        <ColorSection title="Text Color" target="text" />

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
