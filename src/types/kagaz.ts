export type BlockType = 
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'todo'
  | 'bullet'
  | 'callout'
  | 'quote'
  | 'code'
  | 'math'
  | 'toggle'
  | 'divider'
  | 'image'
  | 'video'
  | 'audio'
  | 'link';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // For todo
  language?: string; // For code
  calloutIcon?: string; // For callout
  calloutType?: 'info' | 'warning' | 'success' | 'tip';
  textColor?: string; // e.g. 'indigo', 'cyan', 'emerald', 'amber', 'rose', 'purple'
  bgColor?: string; // e.g. 'indigo-box', 'cyan-box', 'emerald-box', 'amber-box', 'rose-box', 'purple-box'
  collapsed?: boolean; // For toggle
  children?: Block[]; // For nested blocks
  url?: string; // For image, video, audio, link
  caption?: string; // For image, video, audio
  width?: string; // e.g. '25%', '50%', '75%', '100%', or '400px'
  align?: 'left' | 'center' | 'right';
}

export interface FrontMatter {
  title: string;
  status: 'Backlog' | 'In Progress' | 'Review' | 'Done' | 'Archived';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  category?: string;
  createdDate: string;
  lastModified: string;
  icon?: string;
  folder?: string;
  parentNoteId?: string;
  order?: number;
  coverImage?: string;
  coverStyle?: 'banner' | 'hero';
  coverPosition?: number;
}

export interface KagazDocument {
  id: string;
  path: string; // e.g. "Work/Project Alpha.md"
  title: string;
  frontmatter: FrontMatter;
  blocks: Block[];
  rawMarkdown: string;
  outgoingLinks: string[]; // List of page titles linked via [[Title]]
  backlinks: Array<{
    sourceDocId: string;
    sourceTitle: string;
    snippet: string;
  }>;
  folder?: string;
  parentNoteId?: string;
}

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  linkCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export type ActiveViewMode = 'editor' | 'database-table' | 'database-kanban' | 'graph' | 'canvas' | 'learn';
export type PageWidthMode = 'narrow' | 'normal' | 'wide' | 'full';

export interface ElectronAPI {
  openDirectory: () => Promise<string | null>;
  openFile: () => Promise<{ path: string; filename: string; content: string } | null>;
  readVaultFiles: (dirPath: string) => Promise<Record<string, string>>;
  saveVaultFile: (filePath: string, content: string) => Promise<boolean>;
  downloadUpdate?: (url: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  installUpdate?: (filePath: string) => Promise<boolean>;
  onUpdateProgress?: (callback: (data: { percent: number; transferred: number; total: number }) => void) => () => void;
  onSpellcheckWordAdded?: (callback: (word: string) => void) => () => void;
  browserPreloadPath?: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

