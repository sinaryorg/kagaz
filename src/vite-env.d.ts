/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APP_VERSION: string;
  readonly VITE_UPDATE_CHECK_URL: string;
  readonly VITE_LEARN_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ElectronAPI {
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

interface Window {
  electronAPI?: ElectronAPI;
}
