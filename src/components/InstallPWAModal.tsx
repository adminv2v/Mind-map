import { X, Monitor, Smartphone, Apple, Chrome } from 'lucide-react';
import { useState, useEffect } from 'react';
import { detectPlatform, showInstallPrompt } from '../utils/pwa';

interface InstallPWAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPWAModal = ({ isOpen, onClose }: InstallPWAModalProps) => {
  const [platform, setPlatform] = useState<string>('other');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  if (!isOpen) return null;

  const handleInstall = async (targetPlatform: string) => {
    if (targetPlatform === 'windows' || targetPlatform === 'android' || targetPlatform === 'macos') {
      setInstalling(true);
      const installed = await showInstallPrompt();
      setInstalling(false);
      if (installed) {
        onClose();
      } else {
        // Show manual instructions if browser prompt not available
        alert('To install:\n\nChrome/Edge: Click the ⊕ icon in the address bar\nOr use browser menu > Install Mind Map Pro');
      }
    }
  };

  const platforms = [
    {
      id: 'windows',
      name: 'Windows',
      icon: Monitor,
      description: 'Install via Chrome or Edge',
      instructions: 'Click Install Now, or look for the ⊕ icon in your browser address bar.',
      steps: [
        'Click the Install button below, OR',
        'Click the ⊕ or ⋮ icon in the address bar',
        'Select "Install Mind Map Pro"',
        'The app will open in its own window',
      ],
      canAutoInstall: true,
    },
    {
      id: 'android',
      name: 'Android',
      icon: Smartphone,
      description: 'Add to Home Screen',
      instructions: 'Tap Install Now, or use your browser menu.',
      steps: [
        'Tap the Install button below, OR',
        'Tap the menu (⋮) in your browser',
        'Select "Add to Home screen" or "Install app"',
        'Tap "Add" or "Install" to confirm',
      ],
      canAutoInstall: true,
    },
    {
      id: 'macos',
      name: 'macOS',
      icon: Apple,
      description: 'Install via Chrome or Edge',
      instructions: 'Click Install Now, or look for the ⊕ icon in your browser address bar.',
      steps: [
        'Click the Install button below, OR',
        'Click the ⊕ or ⋮ icon in the address bar',
        'Select "Install Mind Map Pro"',
        'The app will open in its own window',
      ],
      canAutoInstall: true,
    },
    {
      id: 'ios',
      name: 'iOS',
      icon: Apple,
      description: 'Manual Installation',
      instructions: 'To install Mind Map Pro on iOS:',
      steps: [
        'Open this page in Safari browser',
        'Tap the Share button at the bottom',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm',
      ],
      canAutoInstall: false,
    },
  ];

  const currentPlatform = platforms.find((p) => p.id === platform);
  const otherPlatforms = platforms.filter((p) => p.id !== platform);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Install Mind Map Pro
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {currentPlatform && (
            <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border-2 border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-accent-orange rounded-xl flex items-center justify-center text-white">
                  <currentPlatform.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentPlatform.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentPlatform.description}
                  </p>
                </div>
                <span className="px-3 py-1 bg-accent-orange text-white text-xs font-semibold rounded-full">
                  Your Device
                </span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {currentPlatform.instructions}
              </p>

              {currentPlatform.steps && (
                <ol className="space-y-2 mb-4">
                  {currentPlatform.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-accent-orange text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {currentPlatform.canAutoInstall && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleInstall(currentPlatform.id)}
                    disabled={installing}
                    className="w-full px-6 py-3 bg-accent-orange hover:bg-accent-orange-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {installing ? 'Installing...' : 'Install Now'}
                  </button>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                    Or use the browser menu to install manually
                  </p>
                </div>
              )}
            </div>
          )}

          {otherPlatforms.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Other Platforms
              </h3>
              <div className="space-y-3">
                {otherPlatforms.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <p.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {p.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {p.description}
                        </p>
                      </div>
                      {p.canAutoInstall && (
                        <button
                          onClick={() => handleInstall(p.id)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                        >
                          Install
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 space-y-3">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                <Chrome size={16} />
                Desktop Icon & App Features
              </h4>
              <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
                <li>Desktop/home screen icon for quick access</li>
                <li>Runs in its own window without browser tabs</li>
                <li>Works offline with your saved mind maps</li>
                <li>Automatic updates when available</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> Installation is supported in Chrome, Edge, and Samsung Internet. Safari users can bookmark the page for quick access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
