import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { activateUpdate } from '../utils/pwa';

interface UpdateNotificationProps {
  show: boolean;
}

export const UpdateNotification = ({ show }: UpdateNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [show]);

  if (!show) return null;

  const handleReload = () => {
    activateUpdate();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-accent-orange to-accent-orange-light text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[320px] max-w-[500px]">
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">Update Available</p>
          <p className="text-xs opacity-90">
            A new version of Mind Map Pro is available
          </p>
        </div>
        <button
          onClick={handleReload}
          className="px-4 py-2 bg-white text-accent-orange rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          Reload Now
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
