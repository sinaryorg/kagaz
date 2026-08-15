import React, { useState, useEffect } from 'react';
import { KagazDocument } from '../../types/kagaz';
import { Search, FileText, Plus, X, ArrowRight } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  documents: KagazDocument[];
  onClose: () => void;
  onSelectDocument: (docId: string) => void;
  onCreateNewNoteWithTitle: (title: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  documents,
  onClose,
  onSelectDocument,
  onCreateNewNoteWithTitle,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = documents.filter(doc => {
    const q = query.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.rawMarkdown.toLowerCase().includes(q) ||
      doc.frontmatter.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl glass-panel rounded-2xl border border-kagaz-700 shadow-2xl overflow-hidden animate-scale-in">
        {/* Input Bar */}
        <div className="p-4 border-b border-kagaz-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-kagaz-accent" />
          <input
            type="text"
            autoFocus
            placeholder="Search notes, tags, or type to create a new page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-kagaz-100 placeholder-kagaz-500 focus:outline-none text-sm font-medium"
          />
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-kagaz-800 rounded-lg text-kagaz-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.map(doc => (
            <button
              key={doc.id}
              onClick={() => {
                onSelectDocument(doc.id);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-kagaz-accent/20 hover:border-kagaz-accent/40 border border-transparent text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{doc.frontmatter.icon || '📝'}</span>
                <div>
                  <div className="font-bold text-sm text-kagaz-100 group-hover:text-white">
                    {doc.title}
                  </div>
                  <div className="text-xs text-kagaz-400 line-clamp-1">
                    {doc.frontmatter.tags.map(t => `#${t}`).join(' ')}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-kagaz-500 group-hover:text-kagaz-glow opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          ))}

          {/* Option to create new document if query doesn't match exact title */}
          {query.trim() && !documents.some(d => d.title.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              onClick={() => {
                onCreateNewNoteWithTitle(query.trim());
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-kagaz-accent/15 border border-kagaz-accent/30 text-kagaz-accent hover:bg-kagaz-accent hover:text-white transition-all font-semibold text-xs mt-2"
            >
              <Plus className="w-4 h-4" />
              Create new note: "{query.trim()}"
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
