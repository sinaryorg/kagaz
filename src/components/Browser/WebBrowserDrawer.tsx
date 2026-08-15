import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, X, Search, 
  Globe, Plus, Sparkles, Check
} from 'lucide-react';
import { KagazDocument, Block } from '../../types/kagaz';

interface WebBrowserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDocument: KagazDocument | undefined;
  onUpdateDocument: (doc: KagazDocument) => void;
  onClipWebpage?: (url: string, title: string) => void;
}

const DEFAULT_BOOKMARKS = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
  { name: 'YouTube', url: 'https://www.youtube.com' },
  { name: 'ChatGPT', url: 'https://chatgpt.com' },
];

export const WebBrowserDrawer: React.FC<WebBrowserDrawerProps> = ({
  isOpen,
  onClose,
  activeDocument,
  onUpdateDocument,
  onClipWebpage,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>('https://www.google.com');
  const [inputUrl, setInputUrl] = useState<string>('https://www.google.com');
  const [history, setHistory] = useState<string[]>(['https://www.google.com']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isClipped, setIsClipped] = useState<boolean>(false);

  // Dynamic Drawer Width Resizing State (matching Left Sidebar behavior)
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    return Number(localStorage.getItem('kagaz_browser_drawer_width')) || 520;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const webviewRef = React.useRef<any>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleNavigate = (e: any) => {
      if (e.url) {
        setCurrentUrl(e.url);
        setInputUrl(e.url);
      }
    };

    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);

    return () => {
      webview.removeEventListener('did-navigate', handleNavigate);
      webview.removeEventListener('did-navigate-in-page', handleNavigate);
    };
  }, [iframeKey, isOpen]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 320), Math.min(1100, window.innerWidth - 260));
      setDrawerWidth(newWidth);
      localStorage.setItem('kagaz_browser_drawer_width', String(newWidth));
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

  if (!isOpen) return null;

  const handleClipPage = () => {
    const domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Webpage';
    onClipWebpage?.(currentUrl, `Clipped: ${domain}`);
    setIsClipped(true);
    setTimeout(() => setIsClipped(false), 2000);
  };

  const navigateToUrl = (targetUrl: string) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setCurrentUrl(finalUrl);
    setInputUrl(finalUrl);

    // Update history stack
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateToUrl(inputUrl);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(prevUrl);
      setInputUrl(prevUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(nextUrl);
      setInputUrl(nextUrl);
    }
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleInsertLinkToNote = () => {
    if (!activeDocument) return;

    const newBlock: Block = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'link',
      content: currentUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Web Link',
      url: currentUrl,
      width: '100%',
      align: 'center',
    };

    onUpdateDocument({
      ...activeDocument,
      blocks: [...activeDocument.blocks, newBlock],
    });

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      {/* Resizing Backdrop Overlay to ensure smooth mousemove tracking over webview/iframe */}
      {isResizing && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize select-none bg-transparent" />
      )}

      <aside 
        style={{ width: `${drawerWidth}px` }} 
        className="h-full bg-kagaz-950/95 border-l border-kagaz-800/90 flex flex-col z-20 shadow-2xl relative animate-fade-in shrink-0"
      >
        {/* Resizable Left Drag Handle Bar */}
        <div
          onMouseDown={startResizing}
          className={`absolute top-0 bottom-0 -left-1.5 w-3 cursor-col-resize z-50 group flex items-center justify-center transition-all ${
            isResizing ? 'bg-kagaz-cyan/40' : 'hover:bg-kagaz-cyan/30'
          }`}
          title="Click and drag left or right to resize Browser Drawer width"
        >
          <div className={`w-1 h-16 rounded-full transition-all ${
            isResizing ? 'bg-kagaz-cyan shadow-glow scale-125' : 'bg-kagaz-700/60 group-hover:bg-kagaz-cyan'
          }`} />
        </div>

        {/* Header Bar: Title & Close */}
        <div className="h-14 px-4 border-b border-kagaz-800 flex items-center justify-between bg-kagaz-900/60">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-kagaz-cyan" />
            <span className="font-extrabold text-sm text-kagaz-100 tracking-tight">Web Browser Drawer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-kagaz-400 hover:text-white hover:bg-kagaz-800 transition-all cursor-pointer"
            title="Close Web Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Control Bar */}
        <div className="p-3 border-b border-kagaz-800 bg-kagaz-950 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg text-kagaz-300 hover:text-white hover:bg-kagaz-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg text-kagaz-300 hover:text-white hover:bg-kagaz-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Forward"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg text-kagaz-300 hover:text-white hover:bg-kagaz-900 transition-all cursor-pointer"
              title="Reload"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigateToUrl('https://www.google.com')}
              className="p-1.5 rounded-lg text-kagaz-300 hover:text-white hover:bg-kagaz-900 transition-all cursor-pointer"
              title="Google Home"
            >
              <Home className="w-3.5 h-3.5" />
            </button>

            {/* URL Input Box */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or enter web URL..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-100 focus:outline-none focus:border-kagaz-glow"
              />
              <Search className="w-3.5 h-3.5 text-kagaz-400 absolute left-2.5 pointer-events-none" />
            </div>

            <button
              className="p-1.5 rounded-xl bg-kagaz-800 hover:bg-kagaz-700 text-kagaz-200 hover:text-white transition-all cursor-pointer"
              title="Open current page in default web browser"
            >
              <a href={currentUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </button>
          </div>

          {/* Quick Bookmarks Bar */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1">
              {DEFAULT_BOOKMARKS.map((bm) => (
                <button
                  key={bm.name}
                  onClick={() => navigateToUrl(bm.url)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    currentUrl.includes(bm.name.toLowerCase().replace(' ', ''))
                      ? 'bg-kagaz-cyan/30 text-kagaz-cyan border border-kagaz-cyan/50'
                      : 'bg-kagaz-900 text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                  }`}
                >
                  {bm.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={handleClipPage}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-kagaz-glow text-kagaz-950 text-[11px] font-extrabold hover:bg-kagaz-glow/80 transition-all cursor-pointer shadow-md"
                title="Clip & create a new note from webpage"
              >
                <Sparkles className="w-3 h-3 text-kagaz-950" />
                <span>{isClipped ? 'Clipped!' : 'Clip Webpage'}</span>
              </button>

              <button
                onClick={handleInsertLinkToNote}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-kagaz-accent text-white text-[11px] font-extrabold hover:bg-kagaz-accent/80 transition-all cursor-pointer shadow-md"
                title="Insert current URL into active note"
              >
                {isCopied ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-white" />}
                <span>{isCopied ? 'Link Added!' : 'Add Link'}</span>
              </button>
            </div>
          </div>

          {(currentUrl.includes('accounts.google.com') || currentUrl.includes('ServiceLogin') || currentUrl.includes('v3/signin')) && (
            <div className="bg-amber-500/25 border border-amber-500/50 p-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold text-amber-200 shadow-lg">
              <div className="flex items-center gap-2">
                <span>🔐 Google blocks logins inside embedded app webviews for security.</span>
              </div>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-extrabold hover:bg-amber-300 cursor-pointer transition-all shrink-0 ml-2 shadow-md flex items-center gap-1 text-xs"
              >
                <span>Sign In in Browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Embedded Web View / Iframe Frame */}
        <div className={`flex-1 bg-white relative overflow-hidden ${isResizing ? 'pointer-events-none select-none' : ''}`}>
          {window.electronAPI ? (
            /* @ts-ignore Electron webview element */
            <webview
              ref={webviewRef}
              key={iframeKey}
              src={currentUrl}
              partition="persist:browserdrawer"
              allowpopups={true}
              preload={window.electronAPI?.browserPreloadPath}
              className="w-full h-full border-0 bg-white"
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
            />
          ) : (
            <iframe
              key={iframeKey}
              src={currentUrl}
              className="w-full h-full border-0 bg-white"
              title="Web Browser Drawer"
            />
          )}
        </div>
      </aside>
    </>
  );
};
