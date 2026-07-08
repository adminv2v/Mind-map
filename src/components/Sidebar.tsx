import { ChevronRight } from 'lucide-react';
import { useMindMapStore } from '../store';
import { ColorPicker } from './ColorPicker';

export const Sidebar = () => {
  const { selectedNodes, nodes, updateNode, sidebarOpen, toggleSidebar } =
    useMindMapStore();

  const selectedNode = selectedNodes.length === 1 ? nodes.find((n) => n.id === selectedNodes[0]) : null;

  if (!selectedNode) return null;

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1.5 sm:p-2 rounded-l-lg shadow-lg z-50 transition-all ${
          sidebarOpen ? 'right-64 sm:right-80' : 'right-0'
        }`}
        aria-label="Toggle Sidebar"
      >
        <ChevronRight
          size={18}
          className={`sm:w-5 sm:h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`fixed right-0 top-0 h-full w-64 sm:w-80 bg-white dark:bg-gray-800 shadow-xl z-40 transition-transform ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 overflow-y-auto h-full">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
            Node Properties
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Text
              </label>
              <textarea
                value={selectedNode.text}
                onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Level
              </label>
              <input
                type="number"
                value={selectedNode.level}
                onChange={(e) =>
                  updateNode(selectedNode.id, { level: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min={0}
              />
            </div>

            <ColorPicker
              label="Fill Color"
              value={selectedNode.style.fill}
              onChange={(color) =>
                updateNode(selectedNode.id, {
                  style: { ...selectedNode.style, fill: color },
                })
              }
            />

            <ColorPicker
              label="Text Color"
              value={selectedNode.style.textColor}
              onChange={(color) =>
                updateNode(selectedNode.id, {
                  style: { ...selectedNode.style, textColor: color },
                })
              }
            />

            <ColorPicker
              label="Border Color"
              value={selectedNode.style.borderColor}
              onChange={(color) =>
                updateNode(selectedNode.id, {
                  style: { ...selectedNode.style, borderColor: color },
                })
              }
            />

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Border Radius: {selectedNode.style.radius}px
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={selectedNode.style.radius}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    style: { ...selectedNode.style, radius: parseInt(e.target.value) },
                  })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNode.style.shadow}
                  onChange={(e) =>
                    updateNode(selectedNode.id, {
                      style: { ...selectedNode.style, shadow: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Drop Shadow
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Tag/Label
              </label>
              <input
                type="text"
                value={selectedNode.tag || ''}
                onChange={(e) => updateNode(selectedNode.id, { tag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Optional tag"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>Position: {Math.round(selectedNode.x)}, {Math.round(selectedNode.y)}</div>
                <div>Size: {Math.round(selectedNode.w)} × {Math.round(selectedNode.h)}</div>
                <div>ID: {selectedNode.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
