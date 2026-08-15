import React, { useState, useEffect } from 'react';
import { KagazDocument, ActiveViewMode, PageWidthMode } from './types/kagaz';
import { INITIAL_DEMO_VAULT, indexVault } from './services/vaultIndexer';
import { serializeToMarkdown, extractOutgoingLinksFromBlocks } from './services/markdownEngine';
import { Sidebar } from './components/Sidebar/Sidebar';
import { BlockEditor } from './components/Editor/BlockEditor';
import { KnowledgeGraph } from './components/Graph/KnowledgeGraph';
import { DatabaseView } from './components/Database/DatabaseView';
import { LearnView } from './components/Learn/LearnView';
import { QuickSearchModal } from './components/Search/QuickSearchModal';
import { WebBrowserDrawer } from './components/Browser/WebBrowserDrawer';
import { UpdateModal } from './components/UI/UpdateModal';
import { checkForAppUpdates } from './services/updateService';
import { AppUpdateData } from './types/update';
import { API_CONFIG } from './constants/config';

import { FileText, Network, Table, Download, Sparkles, SlidersHorizontal, ChevronDown, Check, Globe, X, Columns2, GraduationCap } from 'lucide-react';



export const App: React.FC = () => {
  const [documents, setDocuments] = useState<KagazDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string>('welcome.md');
  const [openTabIds, setOpenTabIds] = useState<string[]>(['welcome.md']);
  const [activeView, setActiveView] = useState<ActiveViewMode>('editor');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isWidthMenuOpen, setIsWidthMenuOpen] = useState<boolean>(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState<boolean>(false);
  const [splitDocId, setSplitDocId] = useState<string | null>(null);
  const [vaultFolderPath, setVaultFolderPath] = useState<string | undefined>(undefined);
  const [pageWidth, setPageWidth] = useState<PageWidthMode>(() => {
    return (localStorage.getItem('kagaz_page_width') as PageWidthMode) || 'normal';
  });

  const [updateData, setUpdateData] = useState<AppUpdateData | null>(null);

  // Check for app updates on startup
  useEffect(() => {
    const checkUpdates = async () => {
      const result = await checkForAppUpdates(API_CONFIG.UPDATE_CHECK_URL);
      if (result) {
        setUpdateData(result);
      }
    };
    checkUpdates();
  }, []);

  const handleManualCheckForUpdates = async () => {
    const result = await checkForAppUpdates(API_CONFIG.UPDATE_CHECK_URL);
    if (result) {
      setUpdateData(result);
    } else {
      alert('You are running the latest version of Kagaz!');
    }
  };

  // Initialize Vault Index with persistent storage & disk vault restoration
  useEffect(() => {
    const initVault = async () => {
      const savedVaultPath = localStorage.getItem('kagaz_vault_path');
      const savedActiveDocId = localStorage.getItem('kagaz_active_doc_id');

      if (savedVaultPath && window.electronAPI?.readVaultFiles) {
        const diskVaultMap = await window.electronAPI.readVaultFiles(savedVaultPath);
        if (Object.keys(diskVaultMap).length > 0) {
          setVaultFolderPath(savedVaultPath);
          const indexed = indexVault(diskVaultMap);
          setDocuments(indexed);
          if (savedActiveDocId && indexed.some(d => d.id === savedActiveDocId)) {
            setActiveDocumentId(savedActiveDocId);
          } else if (indexed.length > 0) {
            setActiveDocumentId(indexed[0].id);
          }
          return;
        }
      }

      // Fallback to local storage saved vault map
      const savedVaultMapRaw = localStorage.getItem('kagaz_saved_vault_map');
      if (savedVaultMapRaw) {
        try {
          const savedVaultMap = JSON.parse(savedVaultMapRaw);
          if (Object.keys(savedVaultMap).length > 0) {
            const indexed = indexVault(savedVaultMap);
            setDocuments(indexed);
            if (savedActiveDocId && indexed.some(d => d.id === savedActiveDocId)) {
              setActiveDocumentId(savedActiveDocId);
            } else if (indexed.length > 0) {
              setActiveDocumentId(indexed[0].id);
            }
            return;
          }
        } catch (err) {
          console.error('Failed to parse saved vault map', err);
        }
      }

      // Initial Default Demo Vault
      const indexed = indexVault(INITIAL_DEMO_VAULT);
      setDocuments(indexed);
    };

    initVault();
  }, []);

  // Save vault map and active doc ID to localStorage whenever updated
  useEffect(() => {
    if (documents.length > 0) {
      const vaultMap: Record<string, string> = {};
      documents.forEach(d => {
        vaultMap[d.id] = d.rawMarkdown;
      });
      localStorage.setItem('kagaz_saved_vault_map', JSON.stringify(vaultMap));
    }
  }, [documents]);

  useEffect(() => {
    if (activeDocumentId) {
      localStorage.setItem('kagaz_active_doc_id', activeDocumentId);
    }
  }, [activeDocumentId]);

  const activeDocument = documents.find(d => d.id === activeDocumentId) || documents[0];

  const handleSetPageWidth = (mode: PageWidthMode) => {
    setPageWidth(mode);
    localStorage.setItem('kagaz_page_width', mode);
  };

  const handleOpenFolderVault = async () => {
    if (!window.electronAPI?.openDirectory) {
      alert('Native folder selection is available when running Kagaz as a desktop app (npm run app).');
      return;
    }

    const dirPath = await window.electronAPI.openDirectory();
    if (!dirPath) return;

    localStorage.setItem('kagaz_vault_path', dirPath);
    setVaultFolderPath(dirPath);

    const diskVaultMap = await window.electronAPI.readVaultFiles(dirPath);
    if (Object.keys(diskVaultMap).length === 0) {
      alert(`No .md files found in "${dirPath}". Starting with template notes in this directory.`);
    }

    const vaultData = Object.keys(diskVaultMap).length > 0 ? diskVaultMap : INITIAL_DEMO_VAULT;
    const indexed = indexVault(vaultData);
    setDocuments(indexed);
    if (indexed.length > 0) {
      setActiveDocumentId(indexed[0].id);
    }
  };

  const handleOpenSingleFile = async () => {
    if (!window.electronAPI?.openFile) {
      // Web browser file picker fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.txt,.markdown';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const docId = file.name;
            const vaultMap: Record<string, string> = {};
            documents.forEach(d => { vaultMap[d.id] = d.rawMarkdown; });
            vaultMap[docId] = content;
            const reindexed = indexVault(vaultMap);
            setDocuments(reindexed);
            setActiveDocumentId(docId);
            setActiveView('editor');
          }
        };
        reader.readAsText(file);
      };
      input.click();
      return;
    }

    const res = await window.electronAPI.openFile();
    if (!res) return;

    const docId = res.filename;
    const vaultMap: Record<string, string> = {};
    documents.forEach(d => { vaultMap[d.id] = d.rawMarkdown; });
    vaultMap[docId] = res.content;

    const reindexed = indexVault(vaultMap);
    setDocuments(reindexed);
    setActiveDocumentId(docId);
    setActiveView('editor');
  };

  const handleUpdateDocument = (updatedDoc: KagazDocument) => {
    const updatedRawMarkdown = serializeToMarkdown(updatedDoc.frontmatter, updatedDoc.blocks);
    const outgoingLinks = extractOutgoingLinksFromBlocks(updatedDoc.blocks);

    const newDocObj: KagazDocument = {
      ...updatedDoc,
      outgoingLinks,
      rawMarkdown: updatedRawMarkdown,
    };

    if (vaultFolderPath && window.electronAPI?.saveVaultFile) {
      const fullFilePath = `${vaultFolderPath}\\${updatedDoc.path}`;
      window.electronAPI.saveVaultFile(fullFilePath, updatedRawMarkdown);
    }

    setDocuments(prevDocs => {
      const updatedList = prevDocs.map(d => (d.id === updatedDoc.id ? newDocObj : d));
      return updatedList.map(doc => {
        const incomingBacklinks = updatedList
          .filter(other => other.id !== doc.id && other.outgoingLinks.includes(doc.title))
          .map(other => ({
            sourceDocId: other.id,
            sourceTitle: other.title,
            snippet: other.blocks.find(b => b.content.includes(`[[${doc.title}]]`))?.content || '',
          }));
        return { ...doc, backlinks: incomingBacklinks };
      });
    });
  };

  const handleCreateDocument = (folderName?: string, parentNoteId?: string) => {
    const title = `Untitled Note ${documents.length + 1}`;
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const folder = folderName || 'General Notes';

    const newRawMarkdown = `---
title: "${title}"
icon: "📝"
folder: "${folder}"
${parentNoteId ? `parentNoteId: "${parentNoteId}"\n` : ''}status: "In Progress"
priority: "Medium"
tags: ["note"]
createdDate: "${new Date().toISOString().split('T')[0]}"
lastModified: "${new Date().toISOString().split('T')[0]}"
---

# ${title}

Start writing here or type \`/\` to insert blocks...
`;

    if (vaultFolderPath && window.electronAPI?.saveVaultFile) {
      const fullFilePath = `${vaultFolderPath}\\${filename}`;
      window.electronAPI.saveVaultFile(fullFilePath, newRawMarkdown);
    }

    const updatedVaultMap: Record<string, string> = {};
    documents.forEach(d => {
      updatedVaultMap[d.id] = d.rawMarkdown;
    });
    updatedVaultMap[filename] = newRawMarkdown;

    const reindexed = indexVault(updatedVaultMap);
    setDocuments(reindexed);
    setActiveDocumentId(filename);
    setOpenTabIds(prev => prev.includes(filename) ? prev : [...prev, filename]);
    setActiveView('editor');
  };

  const handleSelectDocument = (docId: string) => {
    setActiveDocumentId(docId);
    if (!openTabIds.includes(docId)) {
      setOpenTabIds(prev => [...prev, docId]);
    }
  };

  const handleCloseTab = (docIdToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabIds.filter(id => id !== docIdToClose);
    setOpenTabIds(nextTabs);
    if (activeDocumentId === docIdToClose) {
      if (nextTabs.length > 0) {
        const closedIdx = openTabIds.indexOf(docIdToClose);
        const newActiveId = nextTabs[Math.max(0, closedIdx - 1)] || nextTabs[0];
        setActiveDocumentId(newActiveId);
      } else {
        setActiveDocumentId('');
      }
    }
  };

  const handleClipWebpage = (url: string, suggestedTitle: string) => {
    const filename = `clip-${Date.now().toString(36)}.md`;
    const newDoc: KagazDocument = {
      id: filename,
      path: filename,
      title: suggestedTitle,
      frontmatter: {
        title: suggestedTitle,
        status: 'In Progress',
        priority: 'Medium',
        tags: ['web-clip', 'bookmark'],
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        icon: '✂️',
        folder: 'Getting Started/Knowledge Base',
      },
      blocks: [
        {
          id: `blk-clip-1`,
          type: 'heading-1',
          content: suggestedTitle,
        },
        {
          id: `blk-clip-2`,
          type: 'paragraph',
          content: `Clipped from [${url}](${url}) on ${new Date().toLocaleString()}.`,
        },
        {
          id: `blk-clip-3`,
          type: 'link',
          content: url.replace(/^https?:\/\//, '').split('/')[0],
          url: url,
        },
        {
          id: `blk-clip-4`,
          type: 'heading-2',
          content: 'Notes & Highlights',
        },
        {
          id: `blk-clip-5`,
          type: 'paragraph',
          content: 'Add your insights or summary notes here...',
        }
      ],
      outgoingLinks: [],
      backlinks: [],
      rawMarkdown: '',
    };

    const newRaw = serializeToMarkdown(newDoc.frontmatter, newDoc.blocks);
    newDoc.rawMarkdown = newRaw;

    if (window.electronAPI && vaultFolderPath) {
      window.electronAPI.saveVaultFile(`${vaultFolderPath}/${filename}`, newRaw);
    }

    const updatedMap: Record<string, string> = {};
    documents.forEach(d => { updatedMap[d.id] = d.rawMarkdown; });
    updatedMap[filename] = newRaw;

    const reindexed = indexVault(updatedMap);
    setDocuments(reindexed);
    handleSelectDocument(filename);
    setActiveView('editor');
  };

  const handleMoveNote = (docId: string, targetFolderPath: string, targetParentNoteId?: string) => {
    const targetDoc = documents.find(d => d.id === docId);
    if (!targetDoc) return;

    const updatedDoc: KagazDocument = {
      ...targetDoc,
      folder: targetFolderPath,
      parentNoteId: targetParentNoteId,
      frontmatter: {
        ...targetDoc.frontmatter,
        folder: targetFolderPath,
        parentNoteId: targetParentNoteId,
      },
    };

    handleUpdateDocument(updatedDoc);
  };

  const handleMoveFolder = (sourceFolderPath: string, targetFolderPath: string) => {
    if (sourceFolderPath === targetFolderPath) return;
    if (targetFolderPath && targetFolderPath.startsWith(`${sourceFolderPath}/`)) {
      alert('Cannot move a folder inside one of its own sub-folders!');
      return;
    }

    const folderName = sourceFolderPath.split('/').pop()!;
    const newBaseFolderPath = targetFolderPath ? `${targetFolderPath}/${folderName}` : folderName;

    setDocuments(prevDocs => {
      return prevDocs.map(d => {
        const docFolder = d.folder || d.frontmatter.folder || 'General Notes';
        if (docFolder === sourceFolderPath || docFolder.startsWith(`${sourceFolderPath}/`)) {
          const suffix = docFolder.slice(sourceFolderPath.length);
          const updatedFolderPath = `${newBaseFolderPath}${suffix}`;
          const updatedRawMarkdown = serializeToMarkdown(
            { ...d.frontmatter, folder: updatedFolderPath },
            d.blocks
          );
          if (vaultFolderPath && window.electronAPI?.saveVaultFile) {
            const fullFilePath = `${vaultFolderPath}\\${d.path}`;
            window.electronAPI.saveVaultFile(fullFilePath, updatedRawMarkdown);
          }
          return {
            ...d,
            folder: updatedFolderPath,
            frontmatter: { ...d.frontmatter, folder: updatedFolderPath },
            rawMarkdown: updatedRawMarkdown,
          };
        }
        return d;
      });
    });
  };

  const handleDeleteNote = (docId: string) => {
    if (documents.length <= 1) return;
    const filtered = documents.filter(d => d.id !== docId && d.parentNoteId !== docId);
    setDocuments(filtered);
    if (activeDocumentId === docId) {
      setActiveDocumentId(filtered[0].id);
    }
  };

  const handleDeleteFolder = (folderPath: string) => {
    const filtered = documents.filter(d => d.folder !== folderPath && !d.folder?.startsWith(`${folderPath}/`));
    if (filtered.length === 0) return;
    setDocuments(filtered);
    if (activeDocument?.folder === folderPath) {
      setActiveDocumentId(filtered[0].id);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeDocument) return;
    const blob = new Blob([activeDocument.rawMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDocument.path;
    a.click();
    URL.revokeObjectURL(url);
  };

  const widthOptions: { label: string; value: PageWidthMode }[] = [
    { label: 'Narrow (Reading)', value: 'narrow' },
    { label: 'Normal Width', value: 'normal' },
    { label: 'Wide (Spacious)', value: 'wide' },
    { label: 'Full Width', value: 'full' },
  ];

  return (
    <div className="flex h-screen w-screen bg-kagaz-950 text-kagaz-100 overflow-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <Sidebar
        documents={documents}
        activeDocumentId={activeDocumentId}
        vaultFolderPath={vaultFolderPath}
        onSelectDocument={(id) => {
          handleSelectDocument(id);
          setActiveView('editor');
        }}
        onCreateDocument={(folderName, parentNoteId) => handleCreateDocument(folderName, parentNoteId)}
        onMoveNote={handleMoveNote}
        onMoveFolder={handleMoveFolder}
        onReorderNotes={(reordered) => setDocuments(reordered)}
        onDeleteNote={handleDeleteNote}
        onDeleteFolder={handleDeleteFolder}
        onOpenQuickSearch={() => setIsSearchOpen(true)}
        onOpenFolderVault={handleOpenFolderVault}
        onOpenSingleFile={handleOpenSingleFile}
        hasUpdateAvailable={!!updateData}
        onCheckForUpdates={handleManualCheckForUpdates}
      />

      {/* Right Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-kagaz-900/40 relative">
        {/* Ambient Glowing Background Accents */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-kagaz-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-kagaz-cyan/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

        {/* Top Header View Switcher Navigation */}
        <header className="h-16 border-b border-kagaz-800/90 px-6 flex items-center justify-between z-30 shrink-0 bg-kagaz-950/90 relative overflow-visible">
          <div className="flex items-center gap-1.5 bg-kagaz-950/90 p-1.5 rounded-xl border border-kagaz-800 shadow-inner">
            <button
              onClick={() => setActiveView('editor')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeView === 'editor'
                  ? 'bg-kagaz-accent text-white shadow-lg shadow-kagaz-accent/35'
                  : 'text-kagaz-300 hover:text-white font-semibold'
              }`}
            >
              <FileText className="w-4 h-4 stroke-[2.2]" />
              <span>Document</span>
            </button>

            <button
              onClick={() => setActiveView('database-table')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeView === 'database-table' || activeView === 'database-kanban'
                  ? 'bg-kagaz-accent text-white shadow-lg shadow-kagaz-accent/35'
                  : 'text-kagaz-300 hover:text-white font-semibold'
              }`}
            >
              <Table className="w-4 h-4 stroke-[2.2]" />
              <span>Database</span>
            </button>

            <button
              onClick={() => setActiveView('graph')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeView === 'graph'
                  ? 'bg-kagaz-accent text-white shadow-lg shadow-kagaz-accent/35'
                  : 'text-kagaz-300 hover:text-white font-semibold'
              }`}
            >
              <Network className="w-4 h-4 text-kagaz-cyan stroke-[2.2]" />
              <span>Knowledge Graph</span>
            </button>

            <button
              onClick={() => setActiveView('learn')}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activeView === 'learn'
                  ? 'bg-kagaz-accent text-white shadow-lg shadow-kagaz-accent/35'
                  : 'text-kagaz-300 hover:text-white font-semibold'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
              <span>Learn</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Space-Saving Width Popover Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsWidthMenuOpen(!isWidthMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-200 text-xs font-semibold hover:border-kagaz-glow transition-all cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-kagaz-400" />
                <span>Width: <strong className="text-white capitalize">{pageWidth}</strong></span>
                <ChevronDown className={`w-3.5 h-3.5 text-kagaz-400 transition-transform ${isWidthMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isWidthMenuOpen && (
                <>
                  {/* Invisible backdrop to close on outside click */}
                  <div className="fixed inset-0 z-[199]" onClick={() => setIsWidthMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-kagaz-900 border border-kagaz-700 rounded-2xl shadow-2xl shadow-black/60 p-1.5 z-[200]">
                    {widthOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          handleSetPageWidth(opt.value);
                          setIsWidthMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2.5 text-xs rounded-xl transition-all cursor-pointer ${
                          pageWidth === opt.value
                            ? 'bg-kagaz-accent/20 text-kagaz-glow font-bold border border-kagaz-accent/30'
                            : 'text-white/80 hover:bg-kagaz-800 hover:text-white font-medium'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {pageWidth === opt.value && <Check className="w-3.5 h-3.5 text-kagaz-glow" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-200 text-xs font-semibold hover:border-kagaz-glow transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>

            {/* In-App Browser Drawer Button */}
            <button
              onClick={() => setIsBrowserOpen(!isBrowserOpen)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                isBrowserOpen
                  ? 'bg-kagaz-cyan text-kagaz-950 shadow-kagaz-cyan/30'
                  : 'bg-kagaz-900 border border-kagaz-800 text-kagaz-200 hover:border-kagaz-cyan hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Browser</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-400 hover:text-white hover:border-kagaz-glow transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-kagaz-glow" />
            </button>

            {/* Split View Toggle */}
            <button
              onClick={() => {
                if (splitDocId) {
                  setSplitDocId(null);
                } else {
                  // pick the second open tab, else the same doc
                  const other = openTabIds.find(id => id !== activeDocumentId);
                  setSplitDocId(other || activeDocumentId);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                splitDocId
                  ? 'bg-kagaz-glow/15 text-kagaz-glow border-kagaz-glow/50 shadow-md shadow-kagaz-glow/20'
                  : 'bg-kagaz-900 border-kagaz-800 text-kagaz-400 hover:text-white hover:border-kagaz-glow'
              }`}
              title={splitDocId ? 'Close split view' : 'Open split view — compare two notes side by side'}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{splitDocId ? 'Split On' : 'Split'}</span>
            </button>
          </div>
        </header>

        {/* VS Code / Obsidian Style Multi-Tab Note Bar */}
        {openTabIds.length > 0 && (
          <div className="flex items-center gap-1 px-4 pt-1.5 bg-kagaz-950/80 border-b border-kagaz-800/80 overflow-x-auto select-none shrink-0 scrollbar-none z-10">
            {openTabIds.map(tabId => {
              const tabDoc = documents.find(d => d.id === tabId);
              if (!tabDoc) return null;
              const isActive = activeDocumentId === tabId;

              return (
                <div
                  key={tabId}
                  onClick={() => {
                    handleSelectDocument(tabId);
                    setActiveView('editor');
                  }}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x max-w-[190px] shrink-0 ${
                    isActive
                      ? 'bg-kagaz-900 text-white border-kagaz-700/80 shadow-md shadow-black/40 border-b-2 border-b-kagaz-glow'
                      : 'bg-kagaz-950/40 text-kagaz-400 hover:text-white border-transparent hover:bg-kagaz-900/40'
                  }`}
                >
                  {tabDoc.frontmatter.icon?.startsWith('http') || tabDoc.frontmatter.icon?.startsWith('data:image') ? (
                    <img src={tabDoc.frontmatter.icon} alt="" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
                  ) : (
                    <span className="text-xs shrink-0">{tabDoc.frontmatter.icon || '📝'}</span>
                  )}
                  <span className="truncate">{tabDoc.title}</span>
                  <button
                    onClick={(e) => handleCloseTab(tabId, e)}
                    className="p-0.5 rounded text-kagaz-500 hover:text-white hover:bg-kagaz-800 transition-colors opacity-60 group-hover:opacity-100"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* View Router Display Area */}
        <div className={`flex-1 relative overflow-hidden ${splitDocId && activeView === 'editor' ? 'flex' : ''}`}>
          {activeView === 'editor' && activeDocument && !splitDocId && (
            <div className="flex-1 overflow-y-auto h-full">
              <BlockEditor
                document={activeDocument}
                allDocuments={documents}
                pageWidth={pageWidth}
                onUpdateDocument={handleUpdateDocument}
                onNavigateToDocument={(docId) => setActiveDocumentId(docId)}
              />
            </div>
          )}

          {/* ── Split View ── */}
          {activeView === 'editor' && activeDocument && splitDocId && (() => {
            const splitDoc = documents.find(d => d.id === splitDocId) || activeDocument;
            return (
              <>
                {/* Left Pane */}
                <div className="flex-1 flex flex-col overflow-hidden border-r border-kagaz-800/80 min-w-0">
                  {/* Pane header */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-kagaz-950/90 border-b border-kagaz-800/60 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-kagaz-400">Left</span>
                    <select
                      value={activeDocumentId}
                      onChange={(e) => handleSelectDocument(e.target.value)}
                      className="flex-1 text-xs font-semibold bg-kagaz-900 border border-kagaz-800 text-kagaz-100 rounded-lg px-2 py-1 focus:outline-none focus:border-kagaz-glow cursor-pointer"
                    >
                      {documents.map(d => (
                        <option key={d.id} value={d.id}>{d.frontmatter.icon && !d.frontmatter.icon.startsWith('http') && !d.frontmatter.icon.startsWith('data:') ? d.frontmatter.icon + ' ' : ''}{d.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <BlockEditor
                      document={activeDocument}
                      allDocuments={documents}
                      pageWidth="narrow"
                      onUpdateDocument={handleUpdateDocument}
                      onNavigateToDocument={(docId) => handleSelectDocument(docId)}
                    />
                  </div>
                </div>

                {/* Divider handle */}
                <div className="w-1 bg-kagaz-800/60 hover:bg-kagaz-glow/60 transition-colors cursor-col-resize shrink-0" />

                {/* Right Pane */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                  {/* Pane header */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-kagaz-950/90 border-b border-kagaz-800/60 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-kagaz-400">Right</span>
                    <select
                      value={splitDocId}
                      onChange={(e) => setSplitDocId(e.target.value)}
                      className="flex-1 text-xs font-semibold bg-kagaz-900 border border-kagaz-800 text-kagaz-100 rounded-lg px-2 py-1 focus:outline-none focus:border-kagaz-cyan cursor-pointer"
                    >
                      {documents.map(d => (
                        <option key={d.id} value={d.id}>{d.frontmatter.icon && !d.frontmatter.icon.startsWith('http') && !d.frontmatter.icon.startsWith('data:') ? d.frontmatter.icon + ' ' : ''}{d.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSplitDocId(null)}
                      className="p-1 rounded-lg text-kagaz-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Close split view"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <BlockEditor
                      document={splitDoc}
                      allDocuments={documents}
                      pageWidth="narrow"
                      onUpdateDocument={handleUpdateDocument}
                      onNavigateToDocument={(docId) => setSplitDocId(docId)}
                    />
                  </div>
                </div>
              </>
            );
          })()}

          {(activeView === 'database-table' || activeView === 'database-kanban') && (
            <DatabaseView
              documents={documents}
              onNavigateToDocument={(docId) => {
                setActiveDocumentId(docId);
                setActiveView('editor');
              }}
              onUpdateDocument={handleUpdateDocument}
            />
          )}

          {activeView === 'graph' && (
            <div className="p-6 h-full">
              <KnowledgeGraph
                documents={documents}
                activeDocumentId={activeDocumentId}
                onNavigateToDocument={(docId) => {
                  setActiveDocumentId(docId);
                  setActiveView('editor');
                }}
              />
            </div>
          )}

          {activeView === 'learn' && (
            <LearnView />
          )}
        </div>
      </main>

      {/* Right In-App Web Browser Drawer */}
      <WebBrowserDrawer 
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        activeDocument={activeDocument}
        onUpdateDocument={handleUpdateDocument}
        onClipWebpage={handleClipWebpage}
      />

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        documents={documents}
        onClose={() => setIsSearchOpen(false)}
        onSelectDocument={(id) => {
          setActiveDocumentId(id);
          setActiveView('editor');
        }}
        onCreateNewNoteWithTitle={(title) => handleCreateDocument(title)}
      />

      {/* Software Update Modal */}
      <UpdateModal
        updateData={updateData}
        onClose={() => setUpdateData(null)}
      />
    </div>
  );
};
