import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="relative w-full max-w-sm mx-4 glass-panel rounded-2xl border border-kagaz-800 shadow-2xl shadow-black/60 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Glow accent top border */}
        <div className={`h-0.5 w-full ${danger ? 'bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500' : 'bg-gradient-to-r from-kagaz-accent via-kagaz-glow to-kagaz-accent'}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-kagaz-800/60">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-500/15 border border-rose-500/30' : 'bg-kagaz-accent/15 border border-kagaz-accent/30'}`}>
              <AlertTriangle className={`w-4 h-4 ${danger ? 'text-rose-400' : 'text-kagaz-glow'}`} />
            </div>
            <h2 className="text-sm font-extrabold text-white tracking-tight">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-kagaz-500 hover:text-white hover:bg-kagaz-800 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-kagaz-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-kagaz-300 bg-kagaz-900 border border-kagaz-800 hover:text-white hover:border-kagaz-700 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer shadow-lg active:scale-95 ${
              danger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25 border border-rose-500/50'
                : 'bg-kagaz-accent hover:bg-kagaz-accent/80 shadow-kagaz-accent/25 border border-kagaz-accent/50'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
