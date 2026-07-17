import { useEffect } from 'react';
import { useMindMapStore } from '../store';
import { filenameFromMapName } from '../utils/filenames';

export const useKeyboardShortcuts = () => {
  const {
    undo,
    redo,
    deleteNode,
    deleteEdge,
    duplicateNode,
    addChildNode,
    autoLayout,
    selectedNodes,
    selectedEdges,
    setViewport,
    viewport,
    exportData,
    alignSelectedNodes,
    distributeSelectedNodes,
  } = useMindMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.altKey && selectedNodes.length > 1 && e.key === 'ArrowLeft') {
        e.preventDefault();
        alignSelectedNodes('left');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 1 && e.key === 'ArrowRight') {
        e.preventDefault();
        alignSelectedNodes('right');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 1 && e.key === 'ArrowUp') {
        e.preventDefault();
        alignSelectedNodes('top');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 1 && e.key === 'ArrowDown') {
        e.preventDefault();
        alignSelectedNodes('bottom');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 1 && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        alignSelectedNodes('center');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 1 && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        alignSelectedNodes('middle');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 2 && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        distributeSelectedNodes('horizontal');
      } else if (cmdOrCtrl && e.altKey && selectedNodes.length > 2 && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        distributeSelectedNodes('vertical');
      } else if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (cmdOrCtrl && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (cmdOrCtrl && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if (cmdOrCtrl && e.key === 'd') {
        e.preventDefault();
        if (selectedNodes.length === 1) {
          duplicateNode(selectedNodes[0]);
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
        e.preventDefault();
        selectedNodes.forEach((id) => deleteNode(id));
        selectedEdges.forEach((id) => deleteEdge(id));
      } else if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (selectedNodes.length === 1) {
          addChildNode(selectedNodes[0]);
        }
      } else if (cmdOrCtrl && e.key === '=') {
        e.preventDefault();
        setViewport({ zoom: Math.min(3, viewport.zoom * 1.1) });
      } else if (cmdOrCtrl && e.key === '-') {
        e.preventDefault();
        setViewport({ zoom: Math.max(0.1, viewport.zoom * 0.9) });
      } else if (cmdOrCtrl && e.key === 's') {
        e.preventDefault();
        const data = exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenameFromMapName(data.meta.mapName)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (e.key.toLowerCase() === 'l' && !isInputFocused()) {
        e.preventDefault();
        autoLayout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    deleteNode,
    deleteEdge,
    duplicateNode,
    addChildNode,
    autoLayout,
    selectedNodes,
    selectedEdges,
    setViewport,
    viewport,
    exportData,
    alignSelectedNodes,
    distributeSelectedNodes,
  ]);
};

const isInputFocused = (): boolean => {
  const active = document.activeElement;
  return (
    active?.tagName === 'INPUT' ||
    active?.tagName === 'TEXTAREA' ||
    (active as HTMLElement)?.isContentEditable
  );
};
