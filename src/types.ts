export interface NodeStyle {
  fill: string;
  textColor: string;
  borderColor: string;
  radius: number;
  shadow: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  type: string;
  uploadedAt: string;
}

export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: number;
  style: NodeStyle;
  collapsed?: boolean;
  tag?: string;
  icon?: string;
  attachments?: FileAttachment[];
  completed?: boolean;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: 'straight' | 'curved';
  lineStyle?: 'solid' | 'dashed';
  arrowType?: 'single' | 'double' | 'none';
  color?: string;
}

export interface MindMapData {
  nodes: Node[];
  edges: Edge[];
  meta: {
    theme: 'light' | 'dark';
    toolbarPosition?: { x: number; y: number };
    mapName?: string;
    version: number;
  };
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
