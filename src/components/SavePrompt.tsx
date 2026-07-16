import { useEffect, useState } from 'react';
import { useMindMapStore } from '../store';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export const SavePrompt = () => {
  const { exportData, nodes, edges } = useMindMapStore();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSPWA = (window.navigator as NavigatorWithStandalone).standalone === true;
    setIsPWA(isInStandaloneMode || isIOSPWA);
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [nodes, edges]);

  useEffect(() => {
    if (isPWA) {
      const autoSaveInterval = setInterval(() => {
        if (hasUnsavedChanges) {
          const data = exportData();
          localStorage.setItem('mindmap-autosave', JSON.stringify(data));
          localStorage.setItem('mindmap-autosave-time', new Date().toISOString());
          setHasUnsavedChanges(false);
        }
      }, 30000);

      return () => clearInterval(autoSaveInterval);
    }
  }, [isPWA, hasUnsavedChanges, exportData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && nodes.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, nodes]);

  return null;
};
