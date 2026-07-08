import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useMindMapStore } from '../store';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchPanel = ({ isOpen, onClose }: SearchPanelProps) => {
  const { nodes, selectNode, setViewport } = useMindMapStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return nodes
      .filter((node) => node.text.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [nodes, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const goToNode = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;

    selectNode(node.id);
    setViewport({
      zoom: 1,
      x: window.innerWidth / 2 - (node.x + node.w / 2),
      y: window.innerHeight / 2 - (node.y + node.h / 2),
    });
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === 'Enter' && matches[activeIndex]) {
      event.preventDefault();
      goToNode(matches[activeIndex].id);
    }
  };

  return (
    <div className="fixed left-1/2 top-20 z-[70] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <Search size={18} className="shrink-0 text-gray-500 dark:text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search nodes"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          aria-label="Close search"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto py-1">
        {query.trim() && matches.length === 0 && (
          <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
            No nodes found
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-5 text-center text-sm text-gray-500 dark:text-gray-400">
            Type a word or phrase from a node
          </div>
        )}

        {matches.map((node, index) => (
          <button
            key={node.id}
            onClick={() => goToNode(node.id)}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
              index === activeIndex
                ? 'bg-orange-50 text-accent-orange dark:bg-orange-900/30 dark:text-orange-200'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/60'
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-60" />
            <span className="min-w-0 flex-1 truncate">{node.text || 'Untitled node'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
