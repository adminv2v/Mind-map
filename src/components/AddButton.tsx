import { Plus } from 'lucide-react';
import { useMindMapStore } from '../store';

export const AddButton = () => {
  const { addNode, nodes, theme, selectNode } = useMindMapStore();

  const handleAddButtonClick = () => {
    let newX = 100;
    let newY = 100;

    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      newX = lastNode.x;
      newY = lastNode.y + lastNode.h + 50;
    }

    const nodeId = `node-${Date.now()}-${Math.random()}`;
    addNode({
      id: nodeId,
      text: 'New Node',
      x: newX,
      y: newY,
      w: 220,
      h: 80,
      level: 1,
      style: {
        fill: theme === 'dark' ? '#1f2937' : '#ffffff',
        textColor: theme === 'dark' ? '#f9fafb' : '#111827',
        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        radius: 16,
        shadow: true,
      },
    });

    selectNode(nodeId);
  };

  return (
    <button
      onClick={handleAddButtonClick}
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
      title="Add Node (Shift+N)"
      aria-label="Add Node"
    >
      <Plus size={28} className="sm:w-8 sm:h-8" />
    </button>
  );
};
