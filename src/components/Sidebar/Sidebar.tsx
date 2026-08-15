import React, { useState, useEffect } from 'react';
import { KagazDocument } from '../../types/kagaz';
import { 
  Folder, Plus, Search, FileText, Link2, 
  FolderPlus, ChevronRight, FolderOpen, Trash2, FilePlus, X, Upload, FolderSearch
} from 'lucide-react';
import { ConfirmModal } from '../UI/ConfirmModal';
import { APP_VERSION } from '../../constants/version';


interface SidebarProps {
  documents: KagazDocument[];
  activeDocumentId: string;
  vaultFolderPath?: string;
  hasUpdateAvailable?: boolean;
  onSelectDocument: (id: string) => void;
  onCreateDocument: (folderName?: string, parentNoteId?: string) => void;
  onMoveNote: (docId: string, targetFolderPath: string, targetParentNoteId?: string) => void;
  onMoveFolder: (sourceFolderPath: string, targetFolderPath: string) => void;
  onReorderNotes?: (reorderedDocs: KagazDocument[]) => void;
  onDeleteNote: (docId: string) => void;
  onDeleteFolder: (folderPath: string) => void;
  onOpenQuickSearch: () => void;
  onOpenFolderVault: () => void;
  onOpenSingleFile?: () => void;
  onCheckForUpdates?: () => void;
}

interface DragData {
  type: 'note' | 'folder';
  id: string;
}

interface FolderNode {
  name: string;
  fullPath: string;
  subFolders: Record<string, FolderNode>;
  notes: KagazDocument[];
}

function buildFolderTree(documents: KagazDocument[]): Record<string, FolderNode> {
  const rootFolders: Record<string, FolderNode> = {};

  const getOrCreateFolder = (pathParts: string[], root: Record<string, FolderNode>): FolderNode => {
    let currentLevel = root;
    let currentPath = '';
    let lastNode: FolderNode | null = null;

    pathParts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          fullPath: currentPath,
          subFolders: {},
          notes: [],
        };
      }
      lastNode = currentLevel[part];
      currentLevel = lastNode.subFolders;
    });

    return lastNode!;
  };

  documents.forEach(doc => {
    const rawFolder = doc.folder || doc.frontmatter.folder || 'General Notes';
    const parts = rawFolder.split('/').map(p => p.trim()).filter(Boolean);
    const targetNode = getOrCreateFolder(parts.length > 0 ? parts : ['General Notes'], rootFolders);
    targetNode.notes.push(doc);
  });

  return rootFolders;
}

function countTotalNotesInFolderNode(node: FolderNode): number {
  let count = node.notes.length;
  Object.values(node.subFolders).forEach(sub => {
    count += countTotalNotesInFolderNode(sub);
  });
  return count;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  activeDocumentId,
  vaultFolderPath,
  onSelectDocument,
  onCreateDocument,
  onMoveNote,
  onMoveFolder,
  onReorderNotes,
  onDeleteNote,
  onDeleteFolder,
  onOpenQuickSearch,
  onOpenFolderVault,
  onOpenSingleFile,
  hasUpdateAvailable,
  onCheckForUpdates,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    return Number(localStorage.getItem('kagaz_sidebar_width')) || 270;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'before' | 'after' | 'inside'>('inside');

  const [folderOrderMap, setFolderOrderMap] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('kagaz_folder_order') || '{}');
    } catch {
      return {};
    }
  });

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState<string>('');
  const [parentFolderForSub, setParentFolderForSub] = useState<string | null>(null);

  // Confirm Delete Modal State
  const [pendingDeleteNote, setPendingDeleteNote] = useState<{ id: string; title: string } | null>(null);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<{ path: string; name: string } | null>(null);

  const activeDoc = documents.find(d => d.id === activeDocumentId);

  // Sidebar Drag Resizing Logic
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 200), 500);
      setSidebarWidth(newWidth);
      localStorage.setItem('kagaz_sidebar_width', String(newWidth));
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleFolder = (fullPath: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [fullPath]: prev[fullPath] === undefined ? false : !prev[fullPath],
    }));
  };

  const toggleNote = (noteId: string) => {
    setOpenNotes(prev => ({
      ...prev,
      [noteId]: prev[noteId] === undefined ? true : !prev[noteId],
    }));
  };

  const rootFolders = buildFolderTree(documents);

  const sortFolderNodes = (nodes: FolderNode[]): FolderNode[] => {
    return [...nodes].sort((a, b) => {
      const orderA = folderOrderMap[a.fullPath] !== undefined ? folderOrderMap[a.fullPath] : 999;
      const orderB = folderOrderMap[b.fullPath] !== undefined ? folderOrderMap[b.fullPath] : 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  };

  const sortNotesList = (notesList: KagazDocument[]): KagazDocument[] => {
    return [...notesList].sort((a, b) => {
      const orderA = a.frontmatter.order !== undefined ? a.frontmatter.order : 999;
      const orderB = b.frontmatter.order !== undefined ? b.frontmatter.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  };

  const handleConfirmCreateGroup = () => {
    const trimmed = newGroupNameInput.trim();
    if (!trimmed) return;
    if (parentFolderForSub) {
      onCreateDocument(`${parentFolderForSub}/${trimmed}`);
    } else {
      onCreateDocument(trimmed);
    }
    setNewGroupNameInput('');
    setParentFolderForSub(null);
    setIsGroupModalOpen(false);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, type: 'note' | 'folder', id: string) => {
    e.stopPropagation();
    const payload: DragData = { type, id };
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
  };

  const handleDragOverItem = (e: React.DragEvent, targetId: string, itemType: 'folder' | 'note') => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let pos: 'before' | 'after' | 'inside' = 'inside';
    if (offsetY < height * 0.3) {
      pos = 'before';
    } else if (offsetY > height * 0.7) {
      pos = 'after';
    } else {
      pos = itemType === 'folder' ? 'inside' : 'after';
    }

    if (dragOverTarget !== targetId || dragOverPos !== pos) {
      setDragOverTarget(targetId);
      setDragOverPos(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data: DragData = JSON.parse(rawData);
      if (data.type === 'note') {
        onMoveNote(data.id, targetFolderPath, undefined);
      } else if (data.type === 'folder' && data.id !== targetFolderPath) {
        if (dragOverPos === 'inside' || !targetFolderPath) {
          onMoveFolder(data.id, targetFolderPath);
        } else {
          // Reorder folder position relative to targetFolderPath
          const allFoldersList = Object.values(rootFolders).map(f => f.fullPath);
          const filtered = allFoldersList.filter(p => p !== data.id);
          const targetIdx = filtered.indexOf(targetFolderPath);
          const insertIdx = dragOverPos === 'before' ? Math.max(0, targetIdx) : targetIdx + 1;

          filtered.splice(insertIdx, 0, data.id);
          const newOrderMap = { ...folderOrderMap };
          filtered.forEach((path, idx) => {
            newOrderMap[path] = idx;
          });
          setFolderOrderMap(newOrderMap);
          localStorage.setItem('kagaz_folder_order', JSON.stringify(newOrderMap));
        }
      }
    } catch (err) {
      console.error('Failed to parse drag data', err);
    }
  };

  const handleDropOnNote = (e: React.DragEvent, targetDoc: KagazDocument) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data: DragData = JSON.parse(rawData);
      if (data.type === 'note' && data.id !== targetDoc.id) {
        const targetFolder = targetDoc.folder || 'General Notes';
        const targetParentId = targetDoc.parentNoteId;
        
        const folderDocs = sortNotesList(documents.filter(d => (d.folder || 'General Notes') === targetFolder && d.parentNoteId === targetParentId));
        const filteredDocs = folderDocs.filter(d => d.id !== data.id);
        const targetIdx = filteredDocs.findIndex(d => d.id === targetDoc.id);
        const insertIdx = dragOverPos === 'before' ? Math.max(0, targetIdx) : targetIdx + 1;
        
        const movedDoc = documents.find(d => d.id === data.id);
        if (!movedDoc) return;

        const updatedDoc = {
          ...movedDoc,
          folder: targetFolder,
          parentNoteId: targetParentId,
          frontmatter: { ...movedDoc.frontmatter, folder: targetFolder, parentNoteId: targetParentId }
        };

        filteredDocs.splice(insertIdx, 0, updatedDoc);

        const updatedOrderDocs = documents.map(d => {
          if ((d.folder || 'General Notes') === targetFolder && d.parentNoteId === targetParentId) {
            const idxInFiltered = filteredDocs.findIndex(fd => fd.id === d.id);
            if (idxInFiltered !== -1) {
              return {
                ...d,
                folder: targetFolder,
                parentNoteId: targetParentId,
                frontmatter: { ...d.frontmatter, order: idxInFiltered }
              };
            }
          }
          if (d.id === data.id) return updatedDoc;
          return d;
        });

        if (onReorderNotes) {
          onReorderNotes(updatedOrderDocs);
        } else {
          onMoveNote(data.id, targetFolder, targetParentId);
        }
      }
    } catch (err) {
      console.error('Failed to parse drag data', err);
    }
  };

  // Render a note row cleanly without dots
  const renderNoteNode = (doc: KagazDocument, level: number = 0) => {
    const isActive = doc.id === activeDocumentId;
    const subNotes = sortNotesList(documents.filter(d => d.parentNoteId === doc.id));
    const hasSubNotes = subNotes.length > 0;
    const isSubExpanded = openNotes[doc.id] !== false;
    const isTarget = dragOverTarget === `note-${doc.id}`;

    return (
      <div key={doc.id} className="space-y-0.5">
        <div
          draggable={true}
          onDragStart={(e) => handleDragStart(e, 'note', doc.id)}
          onDragOver={(e) => handleDragOverItem(e, `note-${doc.id}`, 'note')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDropOnNote(e, doc)}
          onClick={() => onSelectDocument(doc.id)}
          className={`group relative flex items-center justify-between px-2.5 py-1 rounded-lg text-sm transition-all cursor-pointer ${
            isActive
              ? 'bg-kagaz-accent/30 text-white font-extrabold border-l-2 border-kagaz-glow shadow-sm'
              : 'text-kagaz-300 hover:bg-kagaz-900/90 hover:text-white font-medium'
          } ${
            isTarget && dragOverPos === 'before' ? 'border-t-2 border-kagaz-glow bg-kagaz-glow/10' : ''
          } ${
            isTarget && dragOverPos === 'after' ? 'border-b-2 border-kagaz-glow bg-kagaz-glow/10' : ''
          } ${
            isTarget && dragOverPos === 'inside' ? 'ring-2 ring-kagaz-glow bg-kagaz-accent/40' : ''
          }`}
          style={{ paddingLeft: `${Math.max(10, level * 14 + 10)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasSubNotes ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNote(doc.id);
                }}
                className="p-0.5 hover:bg-kagaz-800 rounded text-kagaz-400"
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSubExpanded ? 'rotate-90' : ''}`} />
              </button>
            ) : null}
            {doc.frontmatter.icon?.startsWith('http') || doc.frontmatter.icon?.startsWith('data:image') ? (
              <img src={doc.frontmatter.icon} alt="" className="w-4 h-4 rounded object-cover shrink-0 border border-kagaz-700/50" />
            ) : (
              <span className="text-sm shrink-0">{doc.frontmatter.icon || '📝'}</span>
            )}
            <span className="truncate tracking-tight">{doc.title}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateDocument(doc.folder, doc.id);
              }}
              className="p-1 hover:bg-kagaz-800 rounded text-kagaz-cyan hover:text-white"
              title="Add Sub-note"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            {documents.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteNote({ id: doc.id, title: doc.title });
                }}
                className="p-1 hover:bg-rose-500/20 rounded text-kagaz-400 hover:text-rose-400"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Recursive Sub-Notes */}
        {hasSubNotes && isSubExpanded && (
          <div className="space-y-0.5">
            {subNotes.map(subDoc => renderNoteNode(subDoc, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render a folder node cleanly
  const renderFolderNode = (folderNode: FolderNode, level: number = 0) => {
    const isOpen = openFolders[folderNode.fullPath] !== false;
    const isTarget = dragOverTarget === `folder-${folderNode.fullPath}`;
    const topLevelNotes = sortNotesList(folderNode.notes.filter(d => !d.parentNoteId));
    const subFolderList = sortFolderNodes(Object.values(folderNode.subFolders));
    const totalCount = countTotalNotesInFolderNode(folderNode);

    return (
      <div
        key={folderNode.fullPath}
        onDragOver={(e) => handleDragOverItem(e, `folder-${folderNode.fullPath}`, 'folder')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDropOnFolder(e, folderNode.fullPath)}
        className={`rounded-lg transition-all ${
          isTarget && dragOverPos === 'before' ? 'border-t-2 border-kagaz-glow bg-kagaz-glow/10' : ''
        } ${
          isTarget && dragOverPos === 'after' ? 'border-b-2 border-kagaz-glow bg-kagaz-glow/10' : ''
        } ${
          isTarget && dragOverPos === 'inside' ? 'ring-2 ring-kagaz-glow bg-kagaz-accent/30' : ''
        }`}
      >
        {/* Folder Header Row */}
        <div
          draggable={true}
          onDragStart={(e) => handleDragStart(e, 'folder', folderNode.fullPath)}
          onClick={() => toggleFolder(folderNode.fullPath)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-bold text-kagaz-200 hover:text-white hover:bg-kagaz-900/80 transition-all cursor-pointer group"
          style={{ paddingLeft: `${Math.max(8, level * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            <ChevronRight className={`w-3.5 h-3.5 text-kagaz-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            <Folder className="w-4 h-4 text-kagaz-cyan shrink-0" />
            <span className="truncate font-semibold">{folderNode.name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-kagaz-500 font-mono">
              {totalCount}
            </span>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateDocument(folderNode.fullPath);
                }}
                className="p-1 hover:bg-kagaz-800 rounded text-kagaz-glow"
                title={`Add Note in "${folderNode.fullPath}"`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setParentFolderForSub(folderNode.fullPath);
                  setNewGroupNameInput('');
                  setIsGroupModalOpen(true);
                }}
                className="p-1 hover:bg-kagaz-800 rounded text-kagaz-cyan"
                title="Add Sub-folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              {Object.keys(rootFolders).length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDeleteFolder({ path: folderNode.fullPath, name: folderNode.name });
                  }}
                  className="p-1 hover:bg-rose-500/20 rounded text-rose-400"
                  title="Delete folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nested Folder Contents */}
        {isOpen && (
          <div className="space-y-0.5 border-l border-kagaz-800/40 ml-3 pl-1 my-0.5">
            {subFolderList.map(subNode => renderFolderNode(subNode, level + 1))}
            {topLevelNotes.map(doc => renderNoteNode(doc, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <aside 
      className="h-full bg-kagaz-950 border-r border-kagaz-800/80 flex flex-col z-20 shadow-2xl select-none relative group/sidebar shrink-0"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Draggable Sidebar Resizer Handle */}
      <div 
        onMouseDown={startResizing} 
        className={`absolute top-0 -right-1.5 w-3 h-full cursor-col-resize transition-all z-50 ${
          isResizing ? 'bg-kagaz-glow opacity-100' : 'hover:bg-kagaz-accent/60 opacity-0 group-hover/sidebar:opacity-100'
        }`}
        title="Drag right/left edge to resize sidebar width"
      />

      {/* Dragging Overlay */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      {/* Sleek App Branding Top Header - Matched h-16 height */}
      <div className="h-16 px-4 border-b border-kagaz-800/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <img 
            src="./icon.png" 
            alt="Kagaz Logo" 
            className="w-8 h-8 rounded-xl shadow-lg shadow-kagaz-glow/20 border border-kagaz-accent/40 object-cover"
          />
          <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
            Kagaz
            <button
              onClick={onCheckForUpdates}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 ${
                hasUpdateAvailable
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30 animate-pulse'
                  : 'bg-kagaz-accent/30 text-kagaz-glow border-kagaz-accent/50 hover:bg-kagaz-accent/50'
              }`}
              title={hasUpdateAvailable ? "New version available! Click to update" : `Version ${APP_VERSION} (Click to check for updates)`}
            >
              <span>v{APP_VERSION}</span>
              {hasUpdateAvailable && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
            </button>
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="p-3 border-b border-kagaz-800/80 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onCreateDocument()}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-2.5 rounded-xl bg-kagaz-accent hover:bg-kagaz-accent/80 text-white font-bold text-xs transition-all shadow-md shadow-kagaz-accent/25 active:scale-95 cursor-pointer"
            title="Create a new Note"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Note</span>
          </button>

          <button
            onClick={() => {
              setParentFolderForSub(null);
              setNewGroupNameInput('');
              setIsGroupModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-2.5 rounded-xl bg-kagaz-900 border border-kagaz-800 hover:border-kagaz-glow text-kagaz-200 hover:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer"
            title="Create a new Note Group / Folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-kagaz-cyan" />
            <span>New Group</span>
          </button>
        </div>

        <button
          onClick={onOpenQuickSearch}
          className="flex items-center justify-between w-full py-1.5 px-2.5 rounded-xl bg-kagaz-900/80 border border-kagaz-800/80 text-kagaz-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Quick Search...</span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-kagaz-950 border border-kagaz-800 rounded text-kagaz-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Explorer Tree Header with Compact Icon Actions */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-kagaz-400">
        <span className="flex items-center gap-1.5 text-[11px] tracking-widest text-kagaz-400 font-extrabold">
          EXPLORER
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSingleFile}
            className="p-1 hover:bg-kagaz-900 rounded text-kagaz-400 hover:text-kagaz-glow cursor-pointer transition-colors"
            title="Open Single Markdown File"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenFolderVault}
            className="p-1 hover:bg-kagaz-900 rounded text-kagaz-400 hover:text-kagaz-cyan cursor-pointer transition-colors"
            title="Open Folder Vault Directory"
          >
            <FolderSearch className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hierarchical Folder & Note Drag-and-Drop Tree */}
      <div 
        onDragOver={(e) => handleDragOverItem(e, 'root-explorer', 'folder')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDropOnFolder(e, '')}
        className={`flex-1 overflow-y-auto px-2 py-1 space-y-0.5 transition-all ${
          dragOverTarget === 'root-explorer' ? 'ring-2 ring-kagaz-glow bg-kagaz-glow/5 rounded-xl' : ''
        }`}
      >
        {sortFolderNodes(Object.values(rootFolders)).map(folderNode => 
          renderFolderNode(folderNode, 0)
        )}
      </div>

      {/* Kagaz Backlinks Panel */}
      {activeDoc && (
        <div className="p-3 border-t border-kagaz-800/80 bg-kagaz-950/80 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-kagaz-400 mb-1.5">
            <Link2 className="w-3.5 h-3.5 text-kagaz-glow" /> Backlinks ({activeDoc.backlinks.length})
          </div>

          {activeDoc.backlinks.length === 0 ? (
            <p className="text-[11px] text-kagaz-500 italic px-1">
              No incoming links. Type <code className="text-kagaz-glow font-mono font-bold">[[{activeDoc.title}]]</code> to link it!
            </p>
          ) : (
            <div className="space-y-1">
              {activeDoc.backlinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectDocument(link.sourceDocId)}
                  className="w-full text-left p-1.5 rounded-lg bg-kagaz-900/80 border border-kagaz-800/80 hover:border-kagaz-glow transition-all cursor-pointer group"
                >
                  <div className="text-xs font-bold text-kagaz-200 group-hover:text-white flex items-center justify-between">
                    <span>{link.sourceTitle}</span>
                    <span className="text-xs text-kagaz-glow">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vault Desktop Status Footer */}
      <div className="px-3.5 py-2 border-t border-kagaz-800/80 bg-kagaz-950 text-[11px] font-semibold text-kagaz-400 flex items-center justify-between">
        <span className="truncate">{vaultFolderPath ? `Vault: ${vaultFolderPath.split('\\').pop()}` : 'Local Vault Active'}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
      </div>

      {/* Custom Dark Glass Modal for Create Group / Sub-Folder */}
      {isGroupModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsGroupModalOpen(false)}
        >
          <div 
            className="w-80 glass-panel rounded-2xl p-5 shadow-2xl border border-kagaz-accent/40 glow-border bg-kagaz-950/95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-kagaz-glow">
                <FolderPlus className="w-4 h-4 text-kagaz-cyan" />
                <span>{parentFolderForSub ? `New Sub-Folder in "${parentFolderForSub}"` : 'Create Note Group'}</span>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1 hover:bg-kagaz-800 rounded text-kagaz-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="e.g. Personal, Work Projects, Ideas..."
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreateGroup();
                if (e.key === 'Escape') setIsGroupModalOpen(false);
              }}
              className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-kagaz-900 border border-kagaz-700 text-white placeholder-kagaz-500 focus:outline-none focus:border-kagaz-glow mb-4 shadow-inner"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-kagaz-900 border border-kagaz-800 text-xs font-bold text-kagaz-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCreateGroup}
                className="px-4 py-1.5 rounded-xl bg-kagaz-accent text-white text-xs font-extrabold shadow-md shadow-kagaz-accent/30 hover:bg-indigo-500 cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>

      {/* Delete Note Confirm Modal */}
      <ConfirmModal
        isOpen={!!pendingDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete "${pendingDeleteNote?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Note"
        onConfirm={() => {
          if (pendingDeleteNote) onDeleteNote(pendingDeleteNote.id);
          setPendingDeleteNote(null);
        }}
        onCancel={() => setPendingDeleteNote(null)}
      />

      {/* Delete Folder Confirm Modal */}
      <ConfirmModal
        isOpen={!!pendingDeleteFolder}
        title="Delete Folder"
        message={`Delete folder "${pendingDeleteFolder?.name}" and all its notes? This cannot be undone.`}
        confirmLabel="Delete Folder"
        onConfirm={() => {
          if (pendingDeleteFolder) onDeleteFolder(pendingDeleteFolder.path);
          setPendingDeleteFolder(null);
        }}
        onCancel={() => setPendingDeleteFolder(null)}
      />
    </>
  );
};
