import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

const COLOR_PALETTE = [
  '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#e6e6e6', '#f5f5f5', '#ffffff',
  '#ff0000', '#ff1a1a', '#ff3333', '#ff4d4d', '#ff6666', '#ff8080', '#ff9999', '#ffb3b3', '#ffcccc', '#ffe6e6', '#fff5f5', '#ffebeb',
  '#cc0000', '#e60000', '#ff2626', '#ff4040', '#ff5959', '#ff7373', '#ff8c8c', '#ffa6a6', '#ffbfbf', '#ffd9d9', '#fff0f0', '#ffebe6',
  '#990000', '#b30000', '#cc1a1a', '#e63333', '#ff4d4d', '#ff6666', '#ff8080', '#ff9999', '#ffb3b3', '#ffcccc', '#ffe6e6', '#fff2f2',
  '#ff6600', '#ff7519', '#ff8533', '#ff944d', '#ffa366', '#ffb380', '#ffc299', '#ffd1b3', '#ffe0cc', '#fff0e6', '#fff7f0', '#fff5eb',
  '#ff9900', '#ffa31a', '#ffad33', '#ffb84d', '#ffc266', '#ffcc80', '#ffd699', '#ffe0b3', '#ffebcc', '#fff5e6', '#fffaf0', '#fff8eb',
  '#ffcc00', '#ffd11a', '#ffd633', '#ffdb4d', '#ffe066', '#ffe680', '#ffeb99', '#fff0b3', '#fff5cc', '#fffae6', '#fffcf0', '#fffbeb',
  '#ffff00', '#ffff1a', '#ffff33', '#ffff4d', '#ffff66', '#ffff80', '#ffff99', '#ffffb3', '#ffffcc', '#ffffe6', '#fffff5', '#ffffeb',
  '#ccff00', '#d1ff1a', '#d6ff33', '#dbff4d', '#e0ff66', '#e6ff80', '#ebff99', '#f0ffb3', '#f5ffcc', '#fafee6', '#fcfff0', '#fbffeb',
  '#99ff00', '#a3ff1a', '#adff33', '#b8ff4d', '#c2ff66', '#ccff80', '#d6ff99', '#e0ffb3', '#ebffcc', '#f5ffe6', '#fafff0', '#f8ffeb',
  '#66ff00', '#75ff19', '#85ff33', '#94ff4d', '#a3ff66', '#b3ff80', '#c2ff99', '#d1ffb3', '#e0ffcc', '#f0ffe6', '#f7fff0', '#f5ffeb',
  '#33ff00', '#47ff19', '#5cff33', '#70ff4d', '#85ff66', '#99ff80', '#adff99', '#c2ffb3', '#d6ffcc', '#ebffe6', '#f5fff0', '#f2ffeb',
  '#00ff00', '#1aff1a', '#33ff33', '#4dff4d', '#66ff66', '#80ff80', '#99ff99', '#b3ffb3', '#ccffcc', '#e6ffe6', '#f5fff5', '#ebffeb',
  '#00ff33', '#1aff47', '#33ff5c', '#4dff70', '#66ff85', '#80ff99', '#99ffad', '#b3ffc2', '#ccffd6', '#e6ffeb', '#f0fff5', '#ebfff2',
  '#00ff66', '#19ff75', '#33ff85', '#4dff94', '#66ffa3', '#80ffb3', '#99ffc2', '#b3ffd1', '#ccffe0', '#e6fff0', '#f0fff7', '#ebfff5',
  '#00ff99', '#1affa3', '#33ffad', '#4dffb8', '#66ffc2', '#80ffcc', '#99ffd6', '#b3ffe0', '#ccffeb', '#e6fff5', '#f0fffa', '#ebfff8',
  '#00ffcc', '#1affd1', '#33ffd6', '#4dffdb', '#66ffe0', '#80ffe6', '#99ffeb', '#b3fff0', '#ccfff5', '#e6fffa', '#f0fffc', '#ebfffb',
  '#00ffff', '#1affff', '#33ffff', '#4dffff', '#66ffff', '#80ffff', '#99ffff', '#b3ffff', '#ccffff', '#e6ffff', '#f5ffff', '#ebffff',
  '#00ccff', '#1ad1ff', '#33d6ff', '#4ddbff', '#66e0ff', '#80e6ff', '#99ebff', '#b3f0ff', '#ccf5ff', '#e6faff', '#f0fcff', '#ebfbff',
  '#0099ff', '#1aa3ff', '#33adff', '#4db8ff', '#66c2ff', '#80ccff', '#99d6ff', '#b3e0ff', '#ccebff', '#e6f5ff', '#f0faff', '#ebf8ff',
  '#0066ff', '#1975ff', '#3385ff', '#4d94ff', '#66a3ff', '#80b3ff', '#99c2ff', '#b3d1ff', '#cce0ff', '#e6f0ff', '#f0f7ff', '#ebf5ff',
  '#0033ff', '#1947ff', '#335cff', '#4d70ff', '#6685ff', '#8099ff', '#99adff', '#b3c2ff', '#ccd6ff', '#e6ebff', '#f0f5ff', '#ebf2ff',
  '#0000ff', '#1a1aff', '#3333ff', '#4d4dff', '#6666ff', '#8080ff', '#9999ff', '#b3b3ff', '#ccccff', '#e6e6ff', '#f5f5ff', '#ebebff',
  '#3300ff', '#4719ff', '#5c33ff', '#704dff', '#8566ff', '#9980ff', '#ad99ff', '#c2b3ff', '#d6ccff', '#ebe6ff', '#f5f0ff', '#f2ebff',
  '#6600ff', '#7519ff', '#8533ff', '#944dff', '#a366ff', '#b380ff', '#c299ff', '#d1b3ff', '#e0ccff', '#f0e6ff', '#f7f0ff', '#f5ebff',
  '#9900ff', '#a31aff', '#ad33ff', '#b84dff', '#c266ff', '#cc80ff', '#d699ff', '#e0b3ff', '#ebccff', '#f5e6ff', '#faf0ff', '#f8ebff',
  '#cc00ff', '#d11aff', '#d633ff', '#db4dff', '#e066ff', '#e680ff', '#eb99ff', '#f0b3ff', '#f5ccff', '#fae6ff', '#fcf0ff', '#fbebff',
  '#ff00ff', '#ff1aff', '#ff33ff', '#ff4dff', '#ff66ff', '#ff80ff', '#ff99ff', '#ffb3ff', '#ffccff', '#ffe6ff', '#fff5ff', '#ffebff',
  '#ff00cc', '#ff1ad1', '#ff33d6', '#ff4ddb', '#ff66e0', '#ff80e6', '#ff99eb', '#ffb3f0', '#ffccf5', '#ffe6fa', '#fff0fc', '#ffebfb',
  '#ff0099', '#ff1aa3', '#ff33ad', '#ff4db8', '#ff66c2', '#ff80cc', '#ff99d6', '#ffb3e0', '#ffcceb', '#ffe6f5', '#fff0fa', '#ffebf8',
  '#ff0066', '#ff1975', '#ff3385', '#ff4d94', '#ff66a3', '#ff80b3', '#ff99c2', '#ffb3d1', '#ffcce0', '#ffe6f0', '#fff0f7', '#ffebf5',
  '#ff0033', '#ff1947', '#ff335c', '#ff4d70', '#ff6685', '#ff8099', '#ff99ad', '#ffb3c2', '#ffccd6', '#ffe6eb', '#fff0f5', '#ffebf2',
  '#8b4513', '#a0522d', '#b8703d', '#cd853f', '#daa520', '#d2691e', '#c47138', '#b8860b', '#daa06d', '#f4a460', '#ffa500', '#ff8c00',
  '#ff7f50', '#ff6347', '#ff4500', '#ff6b35', '#dc143c', '#c91f37', '#b22222', '#8b0000', '#a52a2a', '#800000', '#8b1a1a', '#661a1a',
  '#4b0082', '#6a0dad', '#7b2a8e', '#8b008b', '#9932cc', '#9966ff', '#9370db', '#8a2be2', '#9400d3', '#9966cc', '#ba55d3', '#da70d6',
  '#dda0dd', '#ee82ee', '#ff00ff', '#ff1aff', '#e6e6fa', '#d8bfd8', '#dda0dd', '#da70d6', '#c71585', '#db7093', '#ff69b4', '#ff1493',
  '#ffc0cb', '#ffb6c1', '#ff69b4', '#ff1493', '#c71585', '#db7093', '#8b008b', '#800080', '#4b0082', '#483d8b', '#6a5acd', '#7b68ee',
  '#00008b', '#0000cd', '#0000ff', '#191970', '#000080', '#4169e1', '#4682b4', '#5f9ea0', '#6495ed', '#00bfff', '#1e90ff', '#87ceeb',
  '#87cefa', '#add8e6', '#b0c4de', '#b0e0e6', '#afeeee', '#e0ffff', '#f0f8ff', '#f0ffff', '#e6f3ff', '#d6ebff', '#c2e0ff', '#addbff',
  '#008b8b', '#008080', '#20b2aa', '#48d1cc', '#40e0d0', '#00ced1', '#00ffff', '#00ffff', '#afeeee', '#7fffd4', '#66cdaa', '#5f9ea0',
  '#2e8b57', '#3cb371', '#00ff7f', '#00fa9a', '#90ee90', '#98fb98', '#8fbc8f', '#32cd32', '#00ff00', '#7fff00', '#7cfc00', '#adff2f',
  '#556b2f', '#6b8e23', '#808000', '#9acd32', '#bdb76b', '#eee8aa', '#f0e68c', '#ffffe0', '#ffff00', '#ffd700', '#ffa500', '#ff8c00',
];

export const ColorPicker = ({ label, value, onChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm">{value.toUpperCase()}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-3 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-12 gap-1">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className={`w-6 h-6 rounded border transition-all hover:scale-125 hover:z-10 ${
                  value === color
                    ? 'border-accent-orange ring-2 ring-orange-200'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
