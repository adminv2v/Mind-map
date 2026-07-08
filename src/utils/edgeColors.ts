const levelColors: Record<number, string> = {
  0: '#8b5cf6',   // purple - same level
  1: '#DC6300',   // orange
  2: '#10b981',   // green
  3: '#06b6d4',   // cyan
  4: '#f59e0b',   // amber
  5: '#ef4444',   // red
  6: '#ec4899',   // pink
  7: '#a855f7',   // purple variant
  8: '#14b8a6',   // teal
  9: '#f97316',   // orange
  10: '#84cc16',  // lime
  11: '#6366f1',  // indigo
  12: '#22c55e',  // green variant
  13: '#0ea5e9',  // sky blue
  14: '#eab308',  // yellow
  15: '#dc2626',  // red variant
  16: '#d946ef',  // fuchsia
  17: '#8b5cf6',  // purple
  18: '#2dd4bf',  // teal variant
  19: '#fb923c',  // orange variant
};

const negativeLevelColors: Record<number, string> = {
  1: '#f59e0b',   // amber
  2: '#ef4444',   // red
  3: '#ec4899',   // pink
  4: '#dc2626',   // red variant
  5: '#fb7185',   // rose
  6: '#f43f5e',   // rose variant
  7: '#e11d48',   // rose dark
  8: '#be123c',   // rose darker
  9: '#fbbf24',   // amber variant
  10: '#f87171',  // red light
  11: '#fb923c',  // orange
  12: '#fdba74',  // orange light
  13: '#fca5a5',  // red lighter
  14: '#fecaca',  // red lightest
  15: '#fde047',  // yellow
  16: '#facc15',  // yellow variant
  17: '#f59e0b',  // amber
  18: '#ea580c',  // orange dark
  19: '#c2410c',  // orange darker
};

export const getEdgeColor = (fromLevel: number, toLevel: number): string => {
  const levelDiff = toLevel - fromLevel;

  if (levelDiff === 0) {
    return levelColors[0];
  } else if (levelDiff > 0) {
    const colorIndex = levelDiff % Object.keys(levelColors).length;
    return levelColors[colorIndex];
  } else {
    const absLevelDiff = Math.abs(levelDiff);
    const colorIndex = absLevelDiff % Object.keys(negativeLevelColors).length;
    return negativeLevelColors[colorIndex];
  }
};
