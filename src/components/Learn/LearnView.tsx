import React, { useState, useEffect } from 'react';
import { GraduationCap, RotateCw, ExternalLink, Sparkles, Folder, Link2, LayoutGrid, Clock, RefreshCw } from 'lucide-react';
import { API_CONFIG } from '../../constants/config';

interface LearnViewProps {
  learnUrl?: string;
}

export const LearnView: React.FC<LearnViewProps> = ({ 
  learnUrl = API_CONFIG.LEARN_URL 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasContent, setHasContent] = useState<boolean | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);

  const checkContentAvailability = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(learnUrl, { method: 'GET', cache: 'no-cache' });
      if (response.ok) {
        setHasContent(true);
      } else {
        setHasContent(false);
      }
    } catch (err) {
      setHasContent(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkContentAvailability();
  }, [learnUrl, iframeKey]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(learnUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full w-full bg-kagaz-950/80 overflow-hidden relative font-sans">
      {/* Top Header Bar */}
      <div className="h-12 px-6 border-b border-kagaz-800/80 bg-kagaz-950/90 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-kagaz-accent/20 border border-kagaz-accent/40 text-kagaz-glow">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-xs font-extrabold text-white tracking-tight flex items-center gap-2">
            Kagaz Learning Hub & Guides
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-widest ${
              hasContent === true 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {hasContent === true ? 'Live Docs' : 'Coming Soon'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-300 hover:text-white hover:border-kagaz-700 transition-all cursor-pointer"
            title="Reload learning content"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {hasContent && (
            <button
              onClick={handleOpenExternal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-300 hover:text-white text-xs font-semibold hover:border-kagaz-glow transition-all cursor-pointer"
              title="Open in external browser"
            >
              <span>Open in Browser</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Display Area */}
      <div className="flex-1 relative w-full h-full bg-kagaz-950 overflow-y-auto">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-kagaz-950/90 backdrop-blur-sm gap-3">
            <div className="p-3.5 rounded-2xl bg-kagaz-accent/20 border border-kagaz-accent/40 shadow-xl shadow-kagaz-accent/20">
              <Sparkles className="w-7 h-7 text-kagaz-glow animate-pulse" />
            </div>
            <span className="text-xs font-bold text-kagaz-300">Checking Kagaz Learning Guides...</span>
          </div>
        )}

        {/* Spacious Hero "Coming Soon" View */}
        {!isLoading && hasContent === false && (
          <div className="min-h-full w-full max-w-6xl mx-auto p-10 flex flex-col justify-center gap-8 relative overflow-hidden animate-fade-in">
            {/* Ambient Background Blur Accents */}
            <div className="absolute top-1/4 right-10 w-96 h-96 bg-kagaz-accent/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-kagaz-cyan/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

            {/* Hero Section Header */}
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Under Active Development</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Kagaz Learning Hub & Masterclass
              </h1>
              <p className="text-sm text-kagaz-300 font-medium leading-relaxed">
                Interactive video guides, keyboard shortcut cheat sheets, and structured tutorials are being prepared. Everything you need to build a second brain with Kagaz.
              </p>
            </div>

            {/* 3-Column Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-3xl bg-kagaz-900/60 border border-kagaz-800/80 hover:border-kagaz-accent/50 transition-all shadow-xl group">
                <div className="p-3 rounded-2xl bg-kagaz-accent/20 border border-kagaz-accent/30 text-kagaz-glow w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Folder className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Vaults & Local Files</h3>
                <p className="text-xs text-kagaz-400 leading-relaxed">
                  Learn how to connect local Markdown folders, organize hierarchical notes, and auto-sync changes to disk in real-time.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-kagaz-900/60 border border-kagaz-800/80 hover:border-kagaz-cyan/50 transition-all shadow-xl group">
                <div className="p-3 rounded-2xl bg-kagaz-cyan/20 border border-kagaz-cyan/30 text-kagaz-cyan w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Link2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Wikilinks & Graph</h3>
                <p className="text-xs text-kagaz-400 leading-relaxed">
                  Master bidirectional linking with <code className="text-kagaz-glow font-mono font-bold">[[Title]]</code>, inspect incoming backlinks, and navigate visual knowledge graphs.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-kagaz-900/60 border border-kagaz-800/80 hover:border-emerald-500/50 transition-all shadow-xl group">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Block Editor & Databases</h3>
                <p className="text-xs text-kagaz-400 leading-relaxed">
                  Discover rich block formatting with <code className="text-emerald-400 font-mono font-bold">/</code> slash commands, callouts, math formulas, Kanban boards, and database tables.
                </p>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="flex items-center justify-between p-6 rounded-3xl bg-kagaz-900/40 border border-kagaz-800/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs text-kagaz-300 font-medium">
                  Guides are published dynamically from the server without needing app updates.
                </span>
              </div>

              <button
                onClick={checkContentAvailability}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-kagaz-accent hover:bg-kagaz-accent/80 text-white text-xs font-extrabold shadow-lg shadow-kagaz-accent/30 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check for Available Guides</span>
              </button>
            </div>
          </div>
        )}

        {/* Embedded Live Server Content (Only rendered when 200 OK) */}
        {!isLoading && hasContent === true && (
          <iframe
            key={iframeKey}
            src={learnUrl}
            className="w-full h-full border-none bg-kagaz-950"
            title="Kagaz Learn Content"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
};
