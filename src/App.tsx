import { useEffect, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { AddButton } from './components/AddButton';
import { ContextMenu } from './components/ContextMenu';
import { UpdateNotification } from './components/UpdateNotification';
import { SavePrompt } from './components/SavePrompt';
import { InstallPWAModal } from './components/InstallPWAModal';
import { SearchPanel } from './components/SearchPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useMindMapStore } from './store';
import { registerServiceWorker, setupPWAInstallPrompt, isPWAInstalled } from './utils/pwa';

function App() {
  const { loadFromLocalStorage, theme, importData } = useMindMapStore();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  } | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      if (cmdOrCtrl && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setShowSearch(true);
      }

      if (event.key === 'Escape' && showSearch) {
        event.preventDefault();
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  useEffect(() => {
    registerServiceWorker(() => {
      setUpdateAvailable(true);
    });

    setupPWAInstallPrompt(() => undefined);

    // Show install modal after delay, regardless of browser prompt availability
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    const isInstalled = isPWAInstalled();

    if (!installDismissed && !isInstalled) {
      setTimeout(() => {
        setShowInstallModal(true);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');

    if (sharedData) {
      try {
        const data = JSON.parse(decodeURIComponent(sharedData));
        importData(data);
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Failed to load shared data:', error);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
  }, [loadFromLocalStorage, importData]);

  useEffect(() => {
    const handleFileOpen = async () => {
      if ('launchQueue' in window) {
        (window as any).launchQueue.setConsumer(async (launchParams: any) => {
          if (launchParams.files && launchParams.files.length > 0) {
            const file = launchParams.files[0];
            try {
              const fileHandle = await file.getFile();
              const text = await fileHandle.text();
              const data = JSON.parse(text);
              importData(data);
            } catch (error) {
              console.error('Failed to open file:', error);
              alert('Failed to open file. Please make sure it is a valid Mind Map JSON file.');
            }
          }
        });
      }
    };

    handleFileOpen();
  }, [importData]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeId = target.getAttribute('data-node-id') ||
                     target.closest('[data-node-id]')?.getAttribute('data-node-id');
      const edgeId = target.getAttribute('data-edge-id') ||
                     target.closest('[data-edge-id]')?.getAttribute('data-edge-id');

      if (nodeId || edgeId) {
        e.preventDefault();
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          nodeId: nodeId || undefined,
          edgeId: edgeId || undefined,
        });
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const handleCloseInstallModal = () => {
    setShowInstallModal(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-white dark:bg-stone-shadow">
      <Canvas />
      <Toolbar
        onShowInstallModal={() => setShowInstallModal(true)}
        onShowSearch={() => setShowSearch(true)}
        showInstallButton={!isPWAInstalled()}
      />
      <AddButton />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          edgeId={contextMenu.edgeId}
          onClose={() => setContextMenu(null)}
        />
      )}

      <UpdateNotification show={updateAvailable} />
      <SavePrompt />
      <SearchPanel isOpen={showSearch} onClose={() => setShowSearch(false)} />

      <InstallPWAModal
        isOpen={showInstallModal}
        onClose={handleCloseInstallModal}
      />
    </div>
  );
}

export default App;
