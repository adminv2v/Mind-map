import {
  Undo,
  Redo,
  Moon,
  Sun,
  FolderOpen,
  HelpCircle,
  GitBranch,
  GripVertical,
  Search,
  Save,
  Smartphone,
  X,
  FileText,
  Image,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  Plus,
  Trash2,
  Map,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useMindMapStore } from '../store';
import { filenameFromMapName } from '../utils/filenames';

interface ToolbarProps {
  onShowInstallModal?: () => void;
  onShowSearch?: () => void;
  showInstallButton?: boolean;
}

export const Toolbar = ({
  onShowInstallModal,
  onShowSearch,
  showInstallButton = false,
}: ToolbarProps) => {
  const {
    undo,
    redo,
    theme,
    setTheme,
    history,
    historyIndex,
    exportData,
    importData,
    toolbarPosition,
    setToolbarPosition,
    setMapName,
    maps,
    currentMapId,
    createMap,
    switchMap,
    deleteMap,
    autoLayout,
  } = useMindMapStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const mapName = maps.find((map) => map.id === currentMapId)?.name?.trim() || 'Untitled Mind Map';
  const exportFilename = filenameFromMapName(mapName);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(mapName);
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [renamingMapId, setRenamingMapId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInput(mapName);
  }, [mapName, currentMapId]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (renamingMapId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingMapId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMapDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMapDropdown(false);
        setRenamingMapId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMapDropdown]);

  const handleSave = () => setShowSaveModal(true);

  const handleSaveJSON = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSaveModal(false);
  };

  const handleSavePDFWithJSON = async () => {
    const svg = document.querySelector('svg') as SVGSVGElement;
    if (svg) {
      try {
        const { exportToPDF } = await import('../utils/export');
        await exportToPDF(svg, exportFilename);
        setTimeout(() => {
          const data = exportData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${exportFilename}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }, 500);
        setShowSaveModal(false);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export. Please try again.');
      }
    }
  };

  const handleSaveJPEGWithJSON = async () => {
    const svg = document.querySelector('svg') as SVGSVGElement;
    if (svg) {
      try {
        const { exportToJPEG } = await import('../utils/export');
        await exportToJPEG(svg, exportFilename);
        setTimeout(() => {
          const data = exportData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${exportFilename}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }, 500);
        setShowSaveModal(false);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export. Please try again.');
      }
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            importData(data);
          } catch {
            alert('Failed to import file. Please check the format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleHelp = () => {
    alert(
      'Mind Map Pro - Keyboard Shortcuts\n\n' +
        'EDITING:\n' +
        '  Enter - Edit selected node\n' +
        '  Cmd/Ctrl+Enter - Add child node\n' +
        '  Cmd/Ctrl+D - Duplicate node\n' +
        '  Delete/Backspace - Delete selected\n\n' +
        'NAVIGATION:\n' +
        '  Tab/Shift+Tab - Navigate nodes\n' +
        '  Space+Drag - Pan canvas\n' +
        '  Mouse Wheel - Zoom in/out\n' +
        '  Cmd/Ctrl+=/- - Zoom in/out\n\n' +
        'ACTIONS:\n' +
        '  Cmd/Ctrl+Z - Undo\n' +
        '  Cmd/Ctrl+Shift+Z - Redo\n' +
        '  Cmd/Ctrl+S - Export/Save\n' +
        '  Right-click - Context menu\n\n' +
        'All data is saved automatically to your device!'
    );
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - toolbarPosition.x, y: e.clientY - toolbarPosition.y });
  };

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging) {
      setToolbarPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleDragEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, dragStart, toolbarPosition]);

  const commitName = () => {
    const trimmed = nameInput.trim() || 'Untitled Mind Map';
    setMapName(trimmed);
    setNameInput(trimmed);
    setEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitName();
    if (e.key === 'Escape') { setNameInput(mapName); setEditingName(false); }
  };

  const commitRename = (id: string) => {
    const trimmed = renameInput.trim();
    if (trimmed) {
      if (id === currentMapId) {
        setMapName(trimmed);
      } else {
        // Update name on non-active map directly in maps array
        useMindMapStore.setState((s) => ({
          maps: s.maps.map((m) =>
            m.id === id ? { ...m, name: trimmed || 'Untitled Mind Map', updatedAt: Date.now() } : m
          ),
        }));
        useMindMapStore.getState().saveToLocalStorage();
      }
    }
    setRenamingMapId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') commitRename(id);
    if (e.key === 'Escape') setRenamingMapId(null);
  };

  const btnCls = 'p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-gray-100';
  const dividerCls = 'w-px h-6 bg-gray-300 dark:bg-gray-600 shrink-0';

  // ─── Name + dropdown section (shared between collapsed/expanded) ───────────
  const renderMapSwitcher = (inPill = false) => (
    <div className="relative flex items-center gap-1 shrink-0" ref={inPill ? undefined : dropdownRef}>
      {editingName && !inPill ? (
        <div className="flex items-center gap-1">
          <input
            ref={nameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={commitName}
            className="text-sm font-semibold bg-transparent border-b border-accent-orange outline-none text-gray-800 dark:text-gray-100 w-36 sm:w-48"
            maxLength={60}
          />
          <button onClick={commitName} className={btnCls} aria-label="Confirm name">
            <Check size={14} className="text-accent-orange" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 group">
          <span
            className={`text-sm font-semibold text-gray-800 dark:text-gray-100 truncate ${inPill ? 'max-w-[160px]' : 'max-w-[120px] sm:max-w-[160px]'}`}
            title={mapName}
          >
            {mapName}
          </span>
          {!inPill && (
            <button
              onClick={() => {
                setNameInput(mapName);
                setEditingName(true);
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all"
              aria-label="Rename mind map"
              title="Rename"
            >
              <Pencil size={11} />
            </button>
          )}
          {/* Dropdown toggle */}
          <button
            onClick={() => setShowMapDropdown((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Switch mind map"
            title="All mind maps"
          >
            <ChevronDown size={13} className={`transition-transform duration-150 ${showMapDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {/* Dropdown panel */}
      {showMapDropdown && (
        <div
          ref={inPill ? dropdownRef : undefined}
          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          {/* Map list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {maps.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-2 px-3 py-2 group cursor-pointer transition-colors ${
                  m.id === currentMapId
                    ? 'bg-orange-50 dark:bg-orange-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  if (renamingMapId === m.id) return;
                  switchMap(m.id);
                  setShowMapDropdown(false);
                }}
              >
                <Map
                  size={14}
                  className={m.id === currentMapId ? 'text-accent-orange' : 'text-gray-400 dark:text-gray-500'}
                />

                {renamingMapId === m.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, m.id)}
                    onBlur={() => commitRename(m.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm bg-transparent border-b border-accent-orange outline-none text-gray-800 dark:text-gray-100"
                    maxLength={60}
                  />
                ) : (
                  <span
                    className={`flex-1 text-sm truncate ${
                      m.id === currentMapId
                        ? 'font-semibold text-accent-orange dark:text-orange-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {m.name}
                  </span>
                )}

                {/* Actions (only visible on hover) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingMapId(m.id);
                      setRenameInput(m.name);
                    }}
                    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Pencil size={11} />
                  </button>
                  {maps.length > 1 && (
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${m.name}"? This cannot be undone.`)) {
                          deleteMap(m.id);
                          if (m.id === currentMapId) setShowMapDropdown(false);
                        }
                      }}
                      className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New map button */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => {
                createMap();
                setShowMapDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <Plus size={14} />
              New mind map
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className="fixed z-50"
        style={{
          left: `${toolbarPosition.x}px`,
          top: `${toolbarPosition.y}px`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* ── Collapsed pill ── */}
        {collapsed ? (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 select-none border border-gray-200 dark:border-gray-700">
            <button
              onMouseDown={handleDragStart}
              className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Drag to move"
            >
              <GripVertical size={14} />
            </button>
            {renderMapSwitcher(true)}
            <button
              onClick={() => setCollapsed(false)}
              className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title="Expand toolbar"
              aria-label="Expand toolbar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          /* ── Expanded toolbar ── */
          <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 max-w-[95vw] overflow-visible border border-gray-200 dark:border-gray-700">
            {/* Drag handle */}
            <button
              onMouseDown={handleDragStart}
              className="p-1.5 sm:p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-grab active:cursor-grabbing hidden sm:block text-gray-500 dark:text-gray-400"
              title="Drag to move toolbar"
              aria-label="Drag to move toolbar"
            >
              <GripVertical size={16} />
            </button>

            <div className={`${dividerCls} hidden sm:block`} />

            {/* Map name + switcher */}
            {renderMapSwitcher()}

            <div className={dividerCls} />

            <button onClick={undo} disabled={!canUndo} className={`${btnCls} disabled:opacity-30 disabled:cursor-not-allowed`} title="Undo (Cmd/Ctrl+Z)" aria-label="Undo">
              <Undo size={16} />
            </button>
            <button onClick={redo} disabled={!canRedo} className={`${btnCls} disabled:opacity-30 disabled:cursor-not-allowed`} title="Redo (Cmd/Ctrl+Shift+Z)" aria-label="Redo">
              <Redo size={16} />
            </button>

            <div className={dividerCls} />

            <button onClick={handleSave} className={btnCls} title="Save (Cmd/Ctrl+S)" aria-label="Save">
              <Save size={16} />
            </button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={btnCls} title="Toggle Theme" aria-label="Toggle Theme">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button onClick={handleImport} className={btnCls} title="Import" aria-label="Import">
              <FolderOpen size={16} />
            </button>
            <button onClick={autoLayout} className={btnCls} title="Auto Layout (L)" aria-label="Auto Layout">
              <GitBranch size={16} />
            </button>
            <button onClick={onShowSearch} className={btnCls} title="Search (Cmd/Ctrl+F)" aria-label="Search">
              <Search size={16} />
            </button>
            <button onClick={handleHelp} className={btnCls} title="Help" aria-label="Help">
              <HelpCircle size={16} />
            </button>

            {showInstallButton && (
              <>
                <div className={dividerCls} />
                <button onClick={onShowInstallModal} className={btnCls} title="Install App" aria-label="Install App">
                  <Smartphone size={16} />
                </button>
              </>
            )}

            <div className={dividerCls} />

            {/* Collapse */}
            <button onClick={() => setCollapsed(true)} className={btnCls} title="Collapse toolbar" aria-label="Collapse toolbar">
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Save modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Save Mind Map</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose how you'd like to save your mind map</p>
            <div className="space-y-3">
              <button onClick={handleSaveJSON} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <FileText size={20} className="text-gray-700 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-gray-100">JSON Only</span>
              </button>
              <button onClick={handleSavePDFWithJSON} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <FileText size={20} className="text-gray-700 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-gray-100">PDF + JSON</span>
              </button>
              <button onClick={handleSaveJPEGWithJSON} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <Image size={20} className="text-gray-700 dark:text-gray-300" />
                <span className="text-gray-900 dark:text-gray-100">JPEG + JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
