import { create } from 'zustand';
import { Node, Edge, FileAttachment, MindMapData, ViewportState } from './types';
import { getEdgeColor } from './utils/edgeColors';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export interface MapRecord {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}

interface MindMapStore {
  // Multi-map state
  maps: MapRecord[];
  currentMapId: string;

  // Active map working state (mirrors current map)
  nodes: Node[];
  edges: Edge[];

  selectedNodes: string[];
  selectedEdges: string[];
  viewport: ViewportState;
  theme: 'light' | 'dark';
  history: HistoryState[];
  historyIndex: number;
  isDrawingConnection: boolean;
  connectionStart: string | null;
  tempConnectionEnd: { x: number; y: number } | null;
  sidebarOpen: boolean;
  toolbarPosition: { x: number; y: number };

  // Computed
  mapName: string;

  // Node / edge actions
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  updateEdge: (id: string, updates: Partial<Edge>) => void;
  deleteEdge: (id: string) => void;

  // Selection
  selectNode: (id: string, multi?: boolean) => void;
  selectEdge: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  // Viewport / theme
  setViewport: (viewport: Partial<ViewportState>) => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // History
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  // Connection drawing
  startConnection: (nodeId: string) => void;
  updateTempConnection: (pos: { x: number; y: number } | null) => void;
  endConnection: (targetId: string | null) => void;

  // Import / export (single map, legacy)
  exportData: () => MindMapData;
  importData: (data: MindMapData) => void;

  // Persistence
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;

  // UI
  toggleSidebar: () => void;
  setToolbarPosition: (position: { x: number; y: number }) => void;

  // Node helpers
  duplicateNode: (id: string) => void;
  addChildNode: (parentId: string) => void;
  addAttachmentLinkToNode: (nodeId: string, url: string, name: string) => void;
  autoLayout: () => void;

  // Map management
  setMapName: (name: string) => void;
  createMap: (name?: string) => void;
  switchMap: (id: string) => void;
  deleteMap: (id: string) => void;
}

const STORAGE_KEY = 'mindweave-data-v2';

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalizeMapName = (name?: string) => name?.trim() || 'Untitled Mind Map';

const defaultNode = (x: number, y: number, text: string, level = 1): Node => {
  const levelSizes: Record<number, { w: number; h: number }> = {
    0: { w: 240, h: 100 },
    1: { w: 200, h: 80 },
    2: { w: 180, h: 70 },
  };
  const size = levelSizes[level] || {
    w: Math.max(160, 180 - (level - 2) * 10),
    h: Math.max(60, 70 - (level - 2) * 5),
  };
  return {
    id: `node-${makeId()}`,
    text,
    x,
    y,
    w: size.w,
    h: size.h,
    level,
    style: {
      fill: '#ffffff',
      textColor: '#111827',
      borderColor: '#e5e7eb',
      radius: 16,
      shadow: true,
    },
    completed: false,
  };
};

const makeBlankMap = (name = 'Untitled Mind Map'): MapRecord => ({
  id: `map-${makeId()}`,
  name: normalizeMapName(name),
  nodes: [],
  edges: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const initialMap = makeBlankMap('Untitled Mind Map');

export const useMindMapStore = create<MindMapStore>((set, get) => ({
  maps: [initialMap],
  currentMapId: initialMap.id,
  nodes: initialMap.nodes,
  edges: initialMap.edges,
  selectedNodes: [],
  selectedEdges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  theme: 'light',
  history: [],
  historyIndex: -1,
  isDrawingConnection: false,
  connectionStart: null,
  tempConnectionEnd: null,
  sidebarOpen: true,
  toolbarPosition: { x: 16, y: 16 },
  get mapName() {
    const s = get();
    return normalizeMapName(s.maps.find((m) => m.id === s.currentMapId)?.name);
  },

  // ─── Flush working nodes/edges into the maps array ───────────────────────
  saveToLocalStorage: () => {
    try {
      const s = get();
      // Sync working state into the current map record before saving
      const maps = s.maps.map((m) =>
        m.id === s.currentMapId
          ? { ...m, nodes: s.nodes, edges: s.edges, updatedAt: Date.now() }
          : m
      );
      const payload = {
        maps,
        currentMapId: s.currentMapId,
        theme: s.theme,
        toolbarPosition: s.toolbarPosition,
        version: 2,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save', e);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === 2 && Array.isArray(data.maps) && data.maps.length > 0) {
          const sanitizedMaps = data.maps.map((m: MapRecord) => ({
            ...m,
            name: normalizeMapName(m.name),
          }));
          const currentMapId = data.currentMapId ?? sanitizedMaps[0].id;
          const current = sanitizedMaps.find((m: MapRecord) => m.id === currentMapId) ?? sanitizedMaps[0];
          set({
            maps: sanitizedMaps,
            currentMapId: current.id,
            nodes: current.nodes,
            edges: current.edges,
            theme: data.theme ?? 'light',
            toolbarPosition: data.toolbarPosition ?? { x: 16, y: 16 },
          });
          get().saveHistory();
          return;
        }
        // Migrate v1 data
        if (data.nodes && data.edges) {
          const migrated = makeBlankMap(data.meta?.mapName ?? 'Untitled Mind Map');
          migrated.nodes = data.nodes;
          migrated.edges = data.edges;
          set({
            maps: [migrated],
            currentMapId: migrated.id,
            nodes: migrated.nodes,
            edges: migrated.edges,
            theme: data.meta?.theme ?? 'light',
            toolbarPosition: data.meta?.toolbarPosition ?? { x: 16, y: 16 },
          });
          get().saveHistory();
        }
      }
    } catch (e) {
      console.error('Failed to load', e);
    }
  },

  // ─── Multi-map management ─────────────────────────────────────────────────
  createMap: (name = 'Untitled Mind Map') => {
    const s = get();
    // Flush current working state into maps
    const flushedMaps = s.maps.map((m) =>
      m.id === s.currentMapId
        ? { ...m, nodes: s.nodes, edges: s.edges, updatedAt: Date.now() }
        : m
    );
    const newMap = makeBlankMap(name);
    set({
      maps: [...flushedMaps, newMap],
      currentMapId: newMap.id,
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      history: [],
      historyIndex: -1,
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    get().saveToLocalStorage();
  },

  switchMap: (id) => {
    const s = get();
    if (id === s.currentMapId) return;
    // Flush current working state
    const flushedMaps = s.maps.map((m) =>
      m.id === s.currentMapId
        ? { ...m, nodes: s.nodes, edges: s.edges, updatedAt: Date.now() }
        : m
    );
    const target = flushedMaps.find((m) => m.id === id);
    if (!target) return;
    set({
      maps: flushedMaps,
      currentMapId: id,
      nodes: target.nodes,
      edges: target.edges,
      selectedNodes: [],
      selectedEdges: [],
      history: [],
      historyIndex: -1,
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    get().saveHistory();
    get().saveToLocalStorage();
  },

  deleteMap: (id) => {
    const s = get();
    if (s.maps.length <= 1) return; // always keep at least one
    const remaining = s.maps.filter((m) => m.id !== id);
    const nextId =
      s.currentMapId === id
        ? remaining[remaining.length - 1].id
        : s.currentMapId;
    const target = remaining.find((m) => m.id === nextId)!;
    set({
      maps: remaining,
      currentMapId: nextId,
      nodes: target.nodes,
      edges: target.edges,
      selectedNodes: [],
      selectedEdges: [],
      history: [],
      historyIndex: -1,
    });
    get().saveHistory();
    get().saveToLocalStorage();
  },

  setMapName: (name) => {
    const s = get();
    const nextName = normalizeMapName(name);
    set({
      maps: s.maps.map((m) =>
        m.id === s.currentMapId ? { ...m, name: nextName, updatedAt: Date.now() } : m
      ),
    });
    get().saveToLocalStorage();
  },

  // ─── Node / edge actions ──────────────────────────────────────────────────
  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
    get().saveHistory();
    get().saveToLocalStorage();
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));
    get().saveToLocalStorage();
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.from !== id && e.to !== id),
      selectedNodes: state.selectedNodes.filter((nid) => nid !== id),
    }));
    get().saveHistory();
    get().saveToLocalStorage();
  },

  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge] }));
    get().saveHistory();
    get().saveToLocalStorage();
  },

  updateEdge: (id, updates) => {
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    get().saveToLocalStorage();
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdges: state.selectedEdges.filter((eid) => eid !== id),
    }));
    get().saveHistory();
    get().saveToLocalStorage();
  },

  // ─── Selection ────────────────────────────────────────────────────────────
  selectNode: (id, multi = false) => {
    set((state) => {
      const newSelectedNodes = multi
        ? state.selectedNodes.includes(id)
          ? state.selectedNodes.filter((nid) => nid !== id)
          : [...state.selectedNodes, id]
        : [id];

      if (multi && newSelectedNodes.length === 2) {
        const [firstId, secondId] = newSelectedNodes;
        const existing = state.edges.find(
          (e) =>
            (e.from === firstId && e.to === secondId) ||
            (e.from === secondId && e.to === firstId)
        );

        if (existing) {
          get().deleteEdge(existing.id);
        } else {
          const fromNode = state.nodes.find((n) => n.id === firstId);
          const toNode = state.nodes.find((n) => n.id === secondId);
          if (fromNode && toNode) {
            get().addEdge({
              id: `edge-${makeId()}`,
              from: firstId,
              to: secondId,
              style: 'curved',
              lineStyle: 'solid',
              arrowType: 'single',
              color: getEdgeColor(fromNode.level, toNode.level),
            });
          }
        }

        return {
          selectedNodes: [],
          selectedEdges: [],
        };
      }

      return {
        selectedNodes: newSelectedNodes,
        selectedEdges: [],
      };
    });
  },

  selectEdge: (id, multi = false) => {
    set((state) => ({
      selectedEdges: multi
        ? state.selectedEdges.includes(id)
          ? state.selectedEdges.filter((eid) => eid !== id)
          : [...state.selectedEdges, id]
        : [id],
      selectedNodes: [],
    }));
  },

  clearSelection: () => set({ selectedNodes: [], selectedEdges: [] }),

  // ─── Viewport / theme ─────────────────────────────────────────────────────
  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  setTheme: (theme) => {
    set({ theme });
    get().saveToLocalStorage();
  },

  // ─── History ──────────────────────────────────────────────────────────────
  saveHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ nodes: state.nodes, edges: state.edges });
      return {
        history: newHistory.slice(-50),
        historyIndex: Math.min(newHistory.length - 1, 49),
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const prev = state.history[state.historyIndex - 1];
      return { ...state, nodes: prev.nodes, edges: prev.edges, historyIndex: state.historyIndex - 1 };
    });
    get().saveToLocalStorage();
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const next = state.history[state.historyIndex + 1];
      return { ...state, nodes: next.nodes, edges: next.edges, historyIndex: state.historyIndex + 1 };
    });
    get().saveToLocalStorage();
  },

  // ─── Connection drawing ───────────────────────────────────────────────────
  startConnection: (nodeId) => set({ isDrawingConnection: true, connectionStart: nodeId }),

  updateTempConnection: (pos) => set({ tempConnectionEnd: pos }),

  endConnection: (targetId) => {
    const state = get();
    if (state.connectionStart && targetId && state.connectionStart !== targetId) {
      const exists = state.edges.find(
        (e) => e.from === state.connectionStart && e.to === targetId
      );
      if (!exists) {
        get().addEdge({
          id: `edge-${makeId()}`,
          from: state.connectionStart,
          to: targetId,
          style: 'curved',
          lineStyle: 'solid',
          arrowType: 'single',
        });
      }
    }
    set({ isDrawingConnection: false, connectionStart: null, tempConnectionEnd: null });
  },

  // ─── Import / export (single-map, for file save/load) ────────────────────
  exportData: () => {
    const s = get();
    return {
      nodes: s.nodes,
      edges: s.edges,
      meta: {
        theme: s.theme,
        toolbarPosition: s.toolbarPosition,
        mapName: s.maps.find((m) => m.id === s.currentMapId)?.name ?? 'Untitled Mind Map',
        version: 1,
      },
    };
  },

  importData: (data) => {
    // Importing a file creates a new map
    const newMap: MapRecord = {
      id: `map-${makeId()}`,
      name: data.meta?.mapName ?? 'Imported Map',
      nodes: data.nodes,
      edges: data.edges,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const s = get();
    const flushedMaps = s.maps.map((m) =>
      m.id === s.currentMapId
        ? { ...m, nodes: s.nodes, edges: s.edges, updatedAt: Date.now() }
        : m
    );
    set({
      maps: [...flushedMaps, newMap],
      currentMapId: newMap.id,
      nodes: newMap.nodes,
      edges: newMap.edges,
      theme: data.meta?.theme ?? s.theme,
      toolbarPosition: data.meta?.toolbarPosition ?? s.toolbarPosition,
      selectedNodes: [],
      selectedEdges: [],
      history: [],
      historyIndex: -1,
    });
    get().saveHistory();
    get().saveToLocalStorage();
  },

  // ─── UI ───────────────────────────────────────────────────────────────────
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setToolbarPosition: (position) => {
    set({ toolbarPosition: position });
    get().saveToLocalStorage();
  },

  // ─── Node helpers ─────────────────────────────────────────────────────────
  duplicateNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (node) {
      get().addNode({ ...node, id: `node-${makeId()}`, x: node.x + 20, y: node.y + 20 });
    }
  },

  addChildNode: (parentId) => {
    const state = get();
    const parent = state.nodes.find((n) => n.id === parentId);
    if (parent) {
      const childCount = state.edges.filter((e) => e.from === parentId).length;
      const child = defaultNode(
        parent.x + parent.w + 100,
        parent.y + childCount * 100,
        'New Node',
        parent.level + 1
      );
      get().addNode(child);
      get().addEdge({
        id: `edge-${makeId()}`,
        from: parentId,
        to: child.id,
        style: 'curved',
        lineStyle: 'solid',
        arrowType: 'single',
      });
    }
  },

  addAttachmentLinkToNode: (nodeId, url, name) => {
    const attachment: FileAttachment = {
      id: `file-${makeId()}`,
      name,
      url,
      type: 'link',
      uploadedAt: new Date().toISOString(),
    };

    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, attachments: [...(node.attachments ?? []), attachment] }
          : node
      ),
    }));
    get().saveHistory();
    get().saveToLocalStorage();
  },

  autoLayout: () => {
    const state = get();
    if (state.nodes.length < 2) return;

    get().saveHistory();

    let rootId = state.nodes[0].id;
    let maxConnections = -1;
    state.nodes.forEach((node) => {
      const connectionCount = state.edges.filter(
        (edge) => edge.from === node.id || edge.to === node.id
      ).length;
      if (connectionCount > maxConnections) {
        maxConnections = connectionCount;
        rootId = node.id;
      }
    });

    const nodeMap = new Map(state.nodes.map((node) => [node.id, node]));
    const placed = new Set<string>();
    const positions = new Map<string, { x: number; y: number }>();
    const centerX = (window.innerWidth / 2 - state.viewport.x) / state.viewport.zoom;
    const centerY = (window.innerHeight / 2 - state.viewport.y) / state.viewport.zoom;

    const neighborsFor = (id: string) =>
      state.edges
        .filter((edge) => edge.from === id || edge.to === id)
        .map((edge) => (edge.from === id ? edge.to : edge.from))
        .filter((neighborId) => !placed.has(neighborId));

    const placeNode = (
      id: string,
      x: number,
      y: number,
      level: number,
      angleStart: number,
      angleEnd: number
    ) => {
      const node = nodeMap.get(id);
      if (!node || placed.has(id)) return;

      placed.add(id);
      positions.set(id, { x: x - node.w / 2, y: y - node.h / 2 });

      const children = neighborsFor(id);
      if (!children.length) return;

      const step = (angleEnd - angleStart) / children.length;
      const radius = 180 + level * 90;
      children.forEach((childId, index) => {
        const angle = angleStart + step * index + step / 2;
        placeNode(
          childId,
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius,
          level + 1,
          angle - step / 2,
          angle + step / 2
        );
      });
    };

    placeNode(rootId, centerX, centerY, 1, 0, Math.PI * 2);

    let floatingX = centerX - 320;
    let floatingY = centerY + 320;
    state.nodes.forEach((node) => {
      if (!placed.has(node.id)) {
        positions.set(node.id, { x: floatingX, y: floatingY });
        floatingX += node.w + 60;
      }
    });

    const nodes = state.nodes.map((node) => {
      const next = positions.get(node.id);
      return next ? { ...node, x: next.x, y: next.y } : node;
    });

    const bounds = nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.x),
        minY: Math.min(acc.minY, node.y),
        maxX: Math.max(acc.maxX, node.x + node.w),
        maxY: Math.max(acc.maxY, node.y + node.h),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const padding = 120;
    const zoom = Math.max(
      0.2,
      Math.min(
        1.5,
        Math.min(window.innerWidth / (width + padding), window.innerHeight / (height + padding))
      )
    );

    set({
      nodes,
      viewport: {
        zoom,
        x: window.innerWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom,
        y: window.innerHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom,
      },
    });
    get().saveToLocalStorage();
  },
}));
