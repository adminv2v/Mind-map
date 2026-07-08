export interface LevelStyleConfig {
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'semibold';
  minWidth: number;
  minHeight: number;
  scaleMultiplier: number;
}

export const getLevelStyle = (level: number): LevelStyleConfig => {
  const styles: Record<number, LevelStyleConfig> = {
    0: {
      fontSize: 20,
      fontWeight: 'bold',
      minWidth: 200,
      minHeight: 80,
      scaleMultiplier: 1.2,
    },
    1: {
      fontSize: 16,
      fontWeight: 'semibold',
      minWidth: 160,
      minHeight: 60,
      scaleMultiplier: 1.0,
    },
    2: {
      fontSize: 14,
      fontWeight: 'normal',
      minWidth: 140,
      minHeight: 50,
      scaleMultiplier: 0.9,
    },
  };

  if (level in styles) {
    return styles[level];
  }

  return {
    fontSize: Math.max(12, 14 - (level - 2) * 1),
    fontWeight: 'normal',
    minWidth: Math.max(120, 140 - (level - 2) * 10),
    minHeight: Math.max(40, 50 - (level - 2) * 5),
    scaleMultiplier: Math.max(0.7, 0.9 - (level - 2) * 0.1),
  };
};

export const getLevelColor = (level: number, theme: 'light' | 'dark'): { fill: string; border: string } => {
  const lightColors = [
    { fill: '#dbeafe', border: '#3b82f6' },
    { fill: '#fef3c7', border: '#f59e0b' },
    { fill: '#d1fae5', border: '#10b981' },
    { fill: '#fce7f3', border: '#ec4899' },
    { fill: '#e0e7ff', border: '#6366f1' },
    { fill: '#fef9c3', border: '#eab308' },
  ];

  const darkColors = [
    { fill: '#1e3a8a', border: '#60a5fa' },
    { fill: '#78350f', border: '#fbbf24' },
    { fill: '#064e3b', border: '#34d399' },
    { fill: '#831843', border: '#f472b6' },
    { fill: '#3730a3', border: '#818cf8' },
    { fill: '#713f12', border: '#facc15' },
  ];

  const colors = theme === 'dark' ? darkColors : lightColors;
  return colors[level % colors.length];
};
