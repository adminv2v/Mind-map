import { useState } from 'react';
import { Save, Zap, Lock, HardDrive, FolderOpen, PlusCircle } from 'lucide-react';
import { useMindMapStore } from '../store';

interface WelcomeDialogProps {
  onClose: () => void;
}

export const WelcomeDialog = ({ onClose }: WelcomeDialogProps) => {
  const [showFeatures, setShowFeatures] = useState(true);
  const [topicText, setTopicText] = useState('My Central Topic');
  const { addNode, theme, importData } = useMindMapStore();

  const handleCreate = () => {
    addNode({
      id: `node-${Date.now()}-${Math.random()}`,
      text: topicText,
      x: -150,
      y: -50,
      w: 300,
      h: 100,
      level: 0,
      style: {
        fill: theme === 'dark' ? '#1f2937' : '#ffffff',
        textColor: theme === 'dark' ? '#f9fafb' : '#111827',
        borderColor: theme === 'dark' ? '#ff8c3a' : '#DC6300',
        radius: 20,
        shadow: true,
      },
    });
    localStorage.setItem('welcome-dismissed', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('welcome-dismissed', 'true');
    onClose();
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
            localStorage.setItem('welcome-dismissed', 'true');
            onClose();
          } catch {
            alert('Failed to import file. Please check the format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const features = [
    {
      icon: Lock,
      title: 'No Login Required',
      description: 'Start creating immediately, no account needed',
    },
    {
      icon: HardDrive,
      title: 'Saved on Your Device',
      description: 'All data stays on your device, complete privacy',
    },
    {
      icon: Save,
      title: 'Export Your Work',
      description: 'Download as JSON, PDF, or JPEG anytime',
    },
    {
      icon: Zap,
      title: 'Works Offline',
      description: 'Install as PWA and create without internet',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {showFeatures ? (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Welcome to Mind Map Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Create beautiful mind maps privately on your device. No accounts, no cloud storage, complete control.
            </p>

            <div className="space-y-4 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Key Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                  >
                    <feature.icon className="w-5 h-5 text-accent-orange dark:text-orange-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-8 border border-orange-200 dark:border-orange-800">
              <h3 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-3">
                How to Use
              </h3>
              <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-2">
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span><strong>Create nodes:</strong> Click the + button or press Cmd/Ctrl+Enter</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span><strong>Edit text:</strong> Double-click any node to edit its content</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span><strong>Connect ideas:</strong> Right-click a node and select "Add Child"</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span><strong>Customize:</strong> Right-click nodes to change colors and styles</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span><strong>Save:</strong> Auto-saves to your device, export via save button</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">•</span>
                  <span><strong>Share:</strong> Export files and share them however you prefer</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen size={18} />
                Import File
              </button>
              <button
                onClick={() => setShowFeatures(false)}
                className="flex-1 bg-accent-orange hover:bg-accent-orange-light text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <PlusCircle size={18} />
                Start Fresh
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Create Your First Mind Map
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by giving your mind map a central topic.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Central Topic
              </label>
              <input
                type="text"
                value={topicText}
                onChange={(e) => setTopicText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Project Planning, Study Notes, Ideas..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFeatures(true)}
                className="px-6 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 bg-accent-orange hover:bg-accent-orange-light text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={handleSkip}
                className="px-6 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
