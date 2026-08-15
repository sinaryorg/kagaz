import React, { useState } from 'react';
import { KagazDocument, FrontMatter } from '../../types/kagaz';
import { Table, Kanban, Search, Filter } from 'lucide-react';

interface DatabaseViewProps {
  documents: KagazDocument[];
  onNavigateToDocument: (docId: string) => void;
  onUpdateDocument: (doc: KagazDocument) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  documents,
  onNavigateToDocument,
  onUpdateDocument,
}) => {
  const [viewType, setViewType] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);

  const allTags = Array.from(
    new Set(documents.flatMap(d => d.frontmatter.tags))
  );

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.frontmatter.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'ALL' || doc.frontmatter.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const statuses: FrontMatter['status'][] = ['Backlog', 'In Progress', 'Review', 'Done'];

  const getStatusBadgeClass = (status: FrontMatter['status']) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-kagaz-accent/15 text-kagaz-accent border-kagaz-accent/30';
      case 'Review':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Backlog':
      default:
        return 'bg-kagaz-700/30 text-kagaz-400 border-kagaz-600/30';
    }
  };

  const updateDocProperty = (doc: KagazDocument, field: keyof FrontMatter, val: any) => {
    onUpdateDocument({
      ...doc,
      frontmatter: {
        ...doc.frontmatter,
        [field]: val,
      },
    });
  };

  const renderIcon = (icon?: string) => {
    if (!icon) return <span className="text-lg shrink-0">📄</span>;
    if (icon.startsWith('http') || icon.startsWith('data:image')) {
      return <img src={icon} alt="" className="w-5 h-5 rounded object-cover shrink-0 border border-kagaz-700/50" />;
    }
    return <span className="text-lg shrink-0">{icon}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-kagaz-950 p-6 space-y-6 text-kagaz-100 overflow-y-auto">
      {/* Top Filter & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-kagaz-800 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-kagaz-900 border border-kagaz-800 rounded-xl p-1">
            <button
              onClick={() => setViewType('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewType === 'table' ? 'bg-kagaz-accent text-white shadow-md' : 'text-kagaz-400 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              Table View
            </button>
            <button
              onClick={() => setViewType('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewType === 'kanban' ? 'bg-kagaz-accent text-white shadow-md' : 'text-kagaz-400 hover:text-white'
              }`}
            >
              <Kanban className="w-4 h-4" />
              Kanban Board
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-kagaz-400" />
            <input
              type="text"
              placeholder="Search properties or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-kagaz-900 border border-kagaz-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-kagaz-100 placeholder-kagaz-500 focus:outline-none focus:border-kagaz-glow"
            />
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-kagaz-400" />
          <span className="text-xs text-kagaz-400 font-medium">Tag:</span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedTag === 'ALL' ? 'bg-kagaz-accent/20 text-kagaz-accent border border-kagaz-accent/40' : 'bg-kagaz-900 text-kagaz-400 hover:text-white'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedTag === tag ? 'bg-kagaz-accent/20 text-kagaz-accent border border-kagaz-accent/40' : 'bg-kagaz-900 text-kagaz-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewType === 'table' && (
        <div className="glass-panel rounded-2xl border border-kagaz-800 overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs table-fixed min-w-[700px]">
            <thead className="bg-kagaz-900/90 border-b border-kagaz-800 text-kagaz-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6 w-2/5">Document Title</th>
                <th className="p-4 w-32">Status</th>
                <th className="p-4 w-28">Priority</th>
                <th className="p-4 w-1/4">Tags</th>
                <th className="p-4 pr-6 w-32">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kagaz-800/60">
              {filteredDocs.map(doc => (
                <tr
                  key={doc.id}
                  onClick={() => onNavigateToDocument(doc.id)}
                  className="hover:bg-kagaz-900/70 transition-colors cursor-pointer group"
                >
                  <td className="p-4 pl-6 font-semibold text-kagaz-100 min-w-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {renderIcon(doc.frontmatter.icon)}
                      <span className="group-hover:text-kagaz-glow transition-colors truncate font-extrabold">{doc.title}</span>
                    </div>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={doc.frontmatter.status}
                      onChange={(e) => updateDocProperty(doc, 'status', e.target.value)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none bg-kagaz-950 cursor-pointer ${getStatusBadgeClass(
                        doc.frontmatter.status
                      )}`}
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={doc.frontmatter.priority}
                      onChange={(e) => updateDocProperty(doc, 'priority', e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-kagaz-700 bg-kagaz-950 text-kagaz-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {doc.frontmatter.tags.map((t, idx) => (
                        <span key={idx} className="tag-badge truncate max-w-[120px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-kagaz-400 truncate">{doc.frontmatter.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN BOARD VIEW WITH DRAG AND DROP */}
      {viewType === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {statuses.map(status => {
            const statusDocs = filteredDocs.filter(d => d.frontmatter.status === status);

            return (
              <div 
                key={status} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const docId = e.dataTransfer.getData('text/plain');
                  const targetDoc = documents.find(d => d.id === docId);
                  if (targetDoc && targetDoc.frontmatter.status !== status) {
                    updateDocProperty(targetDoc, 'status', status);
                  }
                  setDraggedDocId(null);
                }}
                className="glass-panel p-4 rounded-2xl border border-kagaz-800 flex flex-col space-y-3 min-h-[450px] transition-all hover:border-kagaz-accent/40 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-kagaz-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      status === 'Done' ? 'bg-emerald-400' :
                      status === 'In Progress' ? 'bg-kagaz-accent' :
                      status === 'Review' ? 'bg-amber-400' : 'bg-kagaz-600'
                    }`} />
                    <h3 className="font-bold text-sm text-kagaz-100">{status}</h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-kagaz-900 text-kagaz-400 border border-kagaz-800">
                    {statusDocs.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-hidden">
                  {statusDocs.map(doc => (
                    <div
                      key={doc.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', doc.id);
                        setDraggedDocId(doc.id);
                      }}
                      onClick={() => onNavigateToDocument(doc.id)}
                      className={`glass-panel-interactive p-4 rounded-xl cursor-grab active:cursor-grabbing space-y-2 border border-kagaz-700/50 transition-all overflow-hidden ${
                        draggedDocId === doc.id ? 'opacity-40 border-dashed border-kagaz-accent' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {renderIcon(doc.frontmatter.icon)}
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-kagaz-800 text-kagaz-300 shrink-0">
                          {doc.frontmatter.priority}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-kagaz-100 truncate">{doc.title}</h4>
                      
                      <div className="flex flex-wrap gap-1 pt-1 overflow-hidden">
                        {doc.frontmatter.tags.map((t, idx) => (
                          <span key={idx} className="tag-badge text-[10px] py-0 px-1.5 truncate max-w-[120px]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {statusDocs.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-kagaz-800/60 rounded-xl flex items-center justify-center text-xs font-semibold text-kagaz-500">
                      Drag cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
