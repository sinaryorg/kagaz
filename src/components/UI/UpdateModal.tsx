import React, { useState, useEffect } from 'react';
import { AppUpdateData } from '../../types/update';
import { Sparkles, Download, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UpdateModalProps {
  updateData: AppUpdateData | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateData, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'ready' | 'error'>('idle');
  const [percent, setPercent] = useState<number>(0);
  const [transferredMB, setTransferredMB] = useState<string>('0');
  const [totalMB, setTotalMB] = useState<string>('0');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Reset state when updateData changes
    if (updateData) {
      setStatus('idle');
      setPercent(0);
      setTransferredMB('0');
      setTotalMB('0');
      setErrorMessage('');
    }
  }, [updateData]);

  if (!updateData) return null;

  const handleStartDownload = async () => {
    if (!updateData.downloadUrl) {
      alert('Download URL not found in release payload.');
      return;
    }

    // Web Browser Fallback if electronAPI is not present
    if (!window.electronAPI?.downloadUpdate) {
      window.open(updateData.downloadUrl, '_blank');
      return;
    }

    setStatus('downloading');
    setPercent(0);

    let cleanup: (() => void) | undefined;
    if (window.electronAPI.onUpdateProgress) {
      cleanup = window.electronAPI.onUpdateProgress((data) => {
        setPercent(data.percent);
        setTransferredMB((data.transferred / 1024 / 1024).toFixed(1));
        if (data.total > 0) {
          setTotalMB((data.total / 1024 / 1024).toFixed(1));
        }
      });
    }

    try {
      const result = await window.electronAPI.downloadUpdate(updateData.downloadUrl);
      if (cleanup) cleanup();

      if (result.success && result.filePath) {
        setStatus('ready');
        setPercent(100);
        
        // Auto-launch installer after 800ms delay
        setTimeout(async () => {
          if (window.electronAPI?.installUpdate) {
            await window.electronAPI.installUpdate(result.filePath!);
          }
        }, 800);
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to download update file.');
      }
    } catch (err: any) {
      if (cleanup) cleanup();
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during download.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in p-4"
      onClick={() => status !== 'downloading' && onClose()}
    >
      <div 
        className="w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl border border-kagaz-accent/50 glow-border bg-kagaz-950/95 text-white flex flex-col gap-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-kagaz-accent/30 to-kagaz-cyan/20 border border-kagaz-accent/40 shadow-lg shadow-kagaz-accent/20">
              <Sparkles className="w-6 h-6 text-kagaz-glow animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Software Update Available
              </h2>
              <p className="text-xs text-kagaz-400 font-medium">
                {status === 'downloading'
                  ? 'Downloading latest version...'
                  : status === 'ready'
                  ? 'Download ready! Launching installer...'
                  : 'A new version of Kagaz is ready for download.'}
              </p>
            </div>
          </div>
          {status !== 'downloading' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-kagaz-900/80 border border-kagaz-800 text-kagaz-400 hover:text-white hover:border-kagaz-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Version Badges Comparison */}
        <div className="flex items-center gap-3 bg-kagaz-900/80 p-3 rounded-xl border border-kagaz-800/80">
          <div className="flex-1 text-center">
            <span className="text-[10px] font-bold text-kagaz-500 uppercase tracking-widest block mb-0.5">Installed</span>
            <span className="text-xs font-bold text-kagaz-300 font-mono bg-kagaz-950 px-2 py-1 rounded-md border border-kagaz-800 inline-block">
              v{updateData.currentVersion}
            </span>
          </div>

          <div className="text-kagaz-glow font-extrabold text-sm">→</div>

          <div className="flex-1 text-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Latest Version</span>
            <span className="text-xs font-extrabold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 inline-block">
              v{updateData.latestVersion} {updateData.buildNumber ? `(Build ${updateData.buildNumber})` : ''}
            </span>
          </div>
        </div>

        {/* Dynamic Download Progress UI */}
        {(status === 'downloading' || status === 'ready') && (
          <div className="bg-kagaz-900/90 border border-kagaz-accent/40 rounded-xl p-4 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-kagaz-200 flex items-center gap-2">
                {status === 'ready' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Download Complete!</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 text-kagaz-glow animate-spin" />
                    <span>Downloading Update File...</span>
                  </>
                )}
              </span>
              <span className="font-mono font-extrabold text-kagaz-glow">
                {percent}%
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-kagaz-950 rounded-full overflow-hidden border border-kagaz-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-kagaz-accent via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-kagaz-400 font-mono">
              <span>{totalMB !== '0' ? `${transferredMB} MB / ${totalMB} MB` : 'Connecting...'}</span>
              <span>{status === 'ready' ? 'Opening Installer...' : 'Please keep app open'}</span>
            </div>
          </div>
        )}

        {/* Error State Banner */}
        {status === 'error' && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* What's New / Changelog (Only shown when idle or error) */}
        {status !== 'downloading' && status !== 'ready' && (
          <div>
            <h3 className="text-xs font-bold text-kagaz-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              What's New in v{updateData.latestVersion}:
            </h3>
            <div className="max-h-40 overflow-y-auto bg-kagaz-900/90 border border-kagaz-800/90 rounded-xl p-3.5 text-xs text-kagaz-200 leading-relaxed font-sans whitespace-pre-wrap shadow-inner scrollbar-thin">
              {updateData.changelog}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-kagaz-800/80">
          {status !== 'downloading' && status !== 'ready' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-kagaz-900 border border-kagaz-800 text-xs font-bold text-kagaz-300 hover:text-white hover:border-kagaz-700 transition-all cursor-pointer"
              >
                Remind Me Later
              </button>

              <button
                onClick={handleStartDownload}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download & Install</span>
              </button>
            </>
          )}

          {(status === 'downloading' || status === 'ready') && (
            <p className="text-xs text-kagaz-400 italic">
              {status === 'ready' ? 'App will restart automatically.' : 'Downloading setup in background...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
