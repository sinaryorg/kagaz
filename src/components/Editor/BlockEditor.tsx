import React, { useState, useRef, useEffect } from 'react';
import { Block, BlockType, KagazDocument, FrontMatter, PageWidthMode } from '../../types/kagaz';
import { 
  Heading1, Heading2, Heading3, AlertCircle, CheckSquare, List, 
  Code, MessageSquareQuote, Binary, Divide, GripVertical, Plus, 
  Trash2, Copy, Check, ArrowUp, ArrowDown, ChevronRight, Folder, ChevronDown,
  Palette, Paintbrush, Image as ImageIcon, Video, Music, ExternalLink, Upload, Link2,
  AlignLeft, AlignCenter, AlignRight, Sparkles
} from 'lucide-react';

interface BlockEditorProps {
  document: KagazDocument;
  allDocuments: KagazDocument[];
  pageWidth: PageWidthMode;
  onUpdateDocument: (updatedDoc: KagazDocument) => void;
  onNavigateToDocument: (docId: string) => void;
}

export const getPageWidthClass = (width: PageWidthMode) => {
  switch (width) {
    case 'narrow': return 'max-w-3xl px-6';
    case 'normal': return 'max-w-5xl px-8';
    case 'wide': return 'max-w-7xl px-10';
    case 'full': return 'max-w-full px-12';
    default: return 'max-w-5xl px-8';
  }
};

export const getTextColorClass = (color?: string) => {
  switch (color) {
    case 'indigo': return 'text-indigo-400 font-semibold';
    case 'cyan': return 'text-cyan-400 font-semibold';
    case 'emerald': return 'text-emerald-400 font-semibold';
    case 'amber': return 'text-amber-400 font-semibold';
    case 'rose': return 'text-rose-400 font-semibold';
    case 'purple': return 'text-purple-400 font-semibold';
    default: return '';
  }
};

export const getBgColorClass = (color?: string) => {
  switch (color) {
    case 'indigo-box': return 'bg-indigo-950/60 border border-indigo-500/40 shadow-lg p-3 rounded-xl my-1';
    case 'cyan-box': return 'bg-cyan-950/60 border border-cyan-500/40 shadow-lg p-3 rounded-xl my-1';
    case 'emerald-box': return 'bg-emerald-950/60 border border-emerald-500/40 shadow-lg p-3 rounded-xl my-1';
    case 'amber-box': return 'bg-amber-950/60 border border-amber-500/40 shadow-lg p-3 rounded-xl my-1';
    case 'rose-box': return 'bg-rose-950/60 border border-rose-500/40 shadow-lg p-3 rounded-xl my-1';
    case 'purple-box': return 'bg-purple-950/60 border border-purple-500/40 shadow-lg p-3 rounded-xl my-1';
    default: return '';
  }
};

export const BlockEditor: React.FC<BlockEditorProps> = ({
  document,
  allDocuments,
  pageWidth,
  onUpdateDocument,
  onNavigateToDocument,
}) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [focusRequestedBlockId, setFocusRequestedBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState<{ blockId: string; filter: string; x: number; y: number } | null>(null);
  const [showWikilinkMenu, setShowWikilinkMenu] = useState<{ blockId: string; filter: string; x: number; y: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<{ blockId: string; x: number; y: number } | null>(null);
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState<boolean>(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<boolean>(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState<boolean>(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState<boolean>(false);
  const [iconPickerTab, setIconPickerTab] = useState<'emojis' | 'custom'>('emojis');
  const [iconSearchQuery, setIconSearchQuery] = useState<string>('');
  const [customIconInput, setCustomIconInput] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragOverEditor, setIsDragOverEditor] = useState<boolean>(false);

  const handleDropFilesOnEditor = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverEditor(false);

    // If dragging an internal block handle, ignore external file drop
    if (draggedIndex !== null) return;

    const files = Array.from(e.dataTransfer.files);
    if (!files || files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          onUpdateDocument({
            ...document,
            blocks: [
              ...document.blocks,
              {
                id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: 'image',
                content: file.name,
                url: dataUrl,
                width: '100%',
                align: 'center',
              }
            ]
          });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          onUpdateDocument({
            ...document,
            blocks: [
              ...document.blocks,
              {
                id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: 'video',
                content: file.name,
                url: dataUrl,
                width: '100%',
                align: 'center',
              }
            ]
          });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('audio/')) {
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          onUpdateDocument({
            ...document,
            blocks: [
              ...document.blocks,
              {
                id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: 'audio',
                content: file.name,
                url: dataUrl,
                width: '100%',
                align: 'center',
              }
            ]
          });
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (text) {
            onUpdateDocument({
              ...document,
              blocks: [
                ...document.blocks,
                {
                  id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  type: 'paragraph',
                  content: text,
                }
              ]
            });
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const resolveDirectMediaUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();

    // Google Drive File URL: drive.google.com/file/d/FILE_ID/view
    if (trimmed.includes('drive.google.com/file/d/')) {
      const match = trimmed.match(/\/file\/d\/([^\/]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    // Google Drive Open URL: drive.google.com/open?id=FILE_ID
    if (trimmed.includes('drive.google.com/open?id=')) {
      const match = trimmed.match(/id=([^&]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    // Google Share Link: share.google/FILE_ID
    if (trimmed.includes('share.google/')) {
      const match = trimmed.match(/share\.google\/([^\/\?]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    return trimmed;
  };

  const availableFolders = Array.from(new Set([
    'Getting Started',
    'Projects & Dev',
    'Knowledge Base',
    'General Notes',
    ...allDocuments.map(d => d.folder || d.frontmatter.folder).filter(Boolean) as string[],
  ]));

  const slashListRef = useRef<HTMLDivElement | null>(null);
  const wikilinkListRef = useRef<HTMLDivElement | null>(null);

  // Focus ref callback & auto-resize textarea height helper
  const setInputRef = (blockId: string) => (el: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (el) {
      if (focusRequestedBlockId === blockId) {
        el.focus();
        setFocusRequestedBlockId(null);
      }
      if (el instanceof HTMLTextAreaElement) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      }
    }
  };

  const handleTextareaChange = (blockId: string, val: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    handleInputChange(blockId, val, e);
  };

  const slashMenuItems = [
    { label: 'Heading 1', type: 'heading-1', icon: Heading1, desc: 'Large section heading' },
    { label: 'Heading 2', type: 'heading-2', icon: Heading2, desc: 'Medium section heading' },
    { label: 'Heading 3', type: 'heading-3', icon: Heading3, desc: 'Small section heading' },
    { label: 'Image / GIF', type: 'image', icon: ImageIcon, desc: 'Embed photo, GIF, or image URL', extra: { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', content: 'Sample Image' } },
    { label: 'Video Player', type: 'video', icon: Video, desc: 'Embed MP4 video or YouTube link', extra: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', content: 'Sample Video' } },
    { label: 'Audio Track', type: 'audio', icon: Music, desc: 'Embed MP3 audio or sound file', extra: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', content: 'Audio Track' } },
    { label: 'Web Link Card', type: 'link', icon: ExternalLink, desc: 'Embed rich bookmark link card', extra: { url: 'https://github.com', content: 'GitHub Repository' } },
    { label: 'Callout Box', type: 'callout', icon: AlertCircle, desc: 'Highlighted info box', extra: { calloutType: 'info' as const, calloutIcon: '💡' } },
    { label: 'To-do Checklist', type: 'todo', icon: CheckSquare, desc: 'Task with checkbox' },
    { label: 'Bullet List', type: 'bullet', icon: List, desc: 'Simple bullet point' },
    { label: 'Code Block', type: 'code', icon: Code, desc: 'Syntax highlighted code snippet' },
    { label: 'Quote', type: 'quote', icon: MessageSquareQuote, desc: 'Block quote' },
    { label: 'Math Equation', type: 'math', icon: Binary, desc: 'TeX math formula' },
    { label: 'Divider', type: 'divider', icon: Divide, desc: 'Visual line separator' },

    // Color Slash Options
    { label: 'Indigo Text', type: 'paragraph', icon: Paintbrush, desc: 'Set text to Indigo', extra: { textColor: 'indigo' } },
    { label: 'Cyan Text', type: 'paragraph', icon: Paintbrush, desc: 'Set text to Cyan', extra: { textColor: 'cyan' } },
    { label: 'Emerald Text', type: 'paragraph', icon: Paintbrush, desc: 'Set text to Emerald Green', extra: { textColor: 'emerald' } },
    { label: 'Amber Text', type: 'paragraph', icon: Paintbrush, desc: 'Set text to Amber Gold', extra: { textColor: 'amber' } },
    { label: 'Rose Red Text', type: 'paragraph', icon: Paintbrush, desc: 'Set text to Rose Red', extra: { textColor: 'rose' } },
    { label: 'Purple Text', type: 'paragraph', icon: Paintbrush, desc: 'Set text to Purple', extra: { textColor: 'purple' } },

    { label: 'Indigo Box Highlight', type: 'paragraph', icon: Palette, desc: 'Set background box to Indigo', extra: { bgColor: 'indigo-box' } },
    { label: 'Cyan Box Highlight', type: 'paragraph', icon: Palette, desc: 'Set background box to Cyan', extra: { bgColor: 'cyan-box' } },
    { label: 'Emerald Box Highlight', type: 'paragraph', icon: Palette, desc: 'Set background box to Emerald', extra: { bgColor: 'emerald-box' } },
    { label: 'Amber Box Highlight', type: 'paragraph', icon: Palette, desc: 'Set background box to Amber', extra: { bgColor: 'amber-box' } },
    { label: 'Rose Box Highlight', type: 'paragraph', icon: Palette, desc: 'Set background box to Rose', extra: { bgColor: 'rose-box' } },
    { label: 'Purple Box Highlight', type: 'paragraph', icon: Palette, desc: 'Set background box to Purple', extra: { bgColor: 'purple-box' } },
  ];

  const filteredSlashItems = showSlashMenu
    ? slashMenuItems.filter(item => item.label.toLowerCase().includes(showSlashMenu.filter))
    : [];

  const filteredWikilinks = showWikilinkMenu
    ? allDocuments.filter(d => d.title.toLowerCase().includes(showWikilinkMenu.filter))
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [showSlashMenu?.filter, showWikilinkMenu?.filter]);

  useEffect(() => {
    if (showSlashMenu && slashListRef.current) {
      const selectedElem = slashListRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElem) {
        selectedElem.scrollIntoView({ block: 'nearest' });
      }
    }
    if (showWikilinkMenu && wikilinkListRef.current) {
      const selectedElem = wikilinkListRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElem) {
        selectedElem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSlashMenu, showWikilinkMenu]);

  useEffect(() => {
    if (window.electronAPI?.onSpellcheckWordAdded) {
      const cleanup = window.electronAPI.onSpellcheckWordAdded(() => {
        const activeEl = window.document.activeElement as HTMLElement;
        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
          activeEl.blur();
          setTimeout(() => activeEl.focus(), 15);
        }
      });
      return cleanup;
    }
  }, []);



  const updateTitle = (newTitle: string) => {
    onUpdateDocument({
      ...document,
      title: newTitle,
      frontmatter: { ...document.frontmatter, title: newTitle },
    });
  };

  const updateIcon = (newIcon: string) => {
    onUpdateDocument({
      ...document,
      frontmatter: { ...document.frontmatter, icon: newIcon },
    });
  };

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const updatedBlocks = document.blocks.map(b => (b.id === blockId ? { ...b, ...updates } : b));
    onUpdateDocument({ ...document, blocks: updatedBlocks });
  };

  const [pasteToastMessage, setPasteToastMessage] = useState<string | null>(null);

  const showPasteToast = (msg: string) => {
    setPasteToastMessage(msg);
    setTimeout(() => setPasteToastMessage(null), 2500);
  };

  const addBlock = (
    afterBlockId: string, 
    type: BlockType = 'paragraph', 
    content = '',
    url?: string,
    width = '100%',
    align: 'left' | 'center' | 'right' = 'center'
  ) => {
    const newBlock: Block = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content,
      ...(url ? { url } : {}),
      width,
      align,
    };
    const index = document.blocks.findIndex(b => b.id === afterBlockId);
    const updatedBlocks = [...document.blocks];
    if (index !== -1) {
      updatedBlocks.splice(index + 1, 0, newBlock);
    } else {
      updatedBlocks.push(newBlock);
    }
    onUpdateDocument({ ...document, blocks: updatedBlocks });
    setActiveBlockId(newBlock.id);
    setFocusRequestedBlockId(newBlock.id);
  };

  const handlePasteMultimedia = (e: React.ClipboardEvent) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA')) {
      return;
    }

    const targetBlockId = activeBlockId || document.blocks[document.blocks.length - 1]?.id || '';

    // 1. Handle Clipboard Files (Snipping Tool screenshot, pasted image/video/audio file)
    const files = Array.from(e.clipboardData.files);
    if (files && files.length > 0) {
      e.preventDefault();
      files.forEach(file => {
        const reader = new FileReader();
        if (file.type.startsWith('image/')) {
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            addBlock(targetBlockId, 'image', file.name, dataUrl);
            showPasteToast('📋 Image pasted from clipboard!');
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            addBlock(targetBlockId, 'video', file.name, dataUrl);
            showPasteToast('📋 Video pasted from clipboard!');
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('audio/')) {
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            addBlock(targetBlockId, 'audio', file.name, dataUrl);
            showPasteToast('📋 Audio pasted from clipboard!');
          };
          reader.readAsDataURL(file);
        }
      });
      return;
    }

    // 2. Handle Clipboard Text / URLs
    const pastedText = e.clipboardData.getData('text/plain')?.trim();
    if (!pastedText) return;

    const isDirectImageUrl = /\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i.test(pastedText) || 
      pastedText.startsWith('data:image/') || 
      pastedText.includes('lh3.googleusercontent.com') ||
      pastedText.includes('images.unsplash.com');

    const isDirectVideoUrl = /\.(mp4|webm|ogg)($|\?)/i.test(pastedText) || 
      pastedText.includes('youtube.com/watch') || 
      pastedText.includes('youtu.be') || 
      pastedText.includes('vimeo.com');

    const isDirectAudioUrl = /\.(mp3|wav|ogg)($|\?)/i.test(pastedText);

    const isWebUrl = /^https?:\/\//i.test(pastedText);

    const currentActiveContent = document.blocks.find(b => b.id === targetBlockId)?.content;
    const isCurrentBlockEmpty = !currentActiveContent || currentActiveContent === '';

    if (isDirectImageUrl) {
      e.preventDefault();
      addBlock(targetBlockId, 'image', 'Image', pastedText);
      showPasteToast('🖼️ Image URL pasted as Image block!');
    } else if (isDirectVideoUrl) {
      e.preventDefault();
      addBlock(targetBlockId, 'video', 'Video', pastedText);
      showPasteToast('🎥 Video URL pasted as Video block!');
    } else if (isDirectAudioUrl) {
      e.preventDefault();
      addBlock(targetBlockId, 'audio', 'Audio', pastedText);
      showPasteToast('🎵 Audio URL pasted as Audio block!');
    } else if (isWebUrl && isCurrentBlockEmpty) {
      e.preventDefault();
      const domainName = pastedText.replace(/^https?:\/\//, '').split('/')[0] || 'Link';
      addBlock(targetBlockId, 'link', domainName, pastedText);
      showPasteToast('🌐 Web URL pasted as Web Link card!');
    }
  };

  const deleteBlock = (blockId: string) => {
    if (document.blocks.length <= 1) return;
    const updatedBlocks = document.blocks.filter(b => b.id !== blockId);
    onUpdateDocument({ ...document, blocks: updatedBlocks });
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= document.blocks.length || fromIndex === toIndex) return;
    const updatedBlocks = [...document.blocks];
    const [moved] = updatedBlocks.splice(fromIndex, 1);
    updatedBlocks.splice(toIndex, 0, moved);
    onUpdateDocument({ ...document, blocks: updatedBlocks });
  };

  const applySlashType = (blockId: string, type: BlockType, extra?: Partial<Block>) => {
    updateBlock(blockId, { type, content: '', ...extra });
    setActiveBlockId(blockId);
    setFocusRequestedBlockId(blockId);
    setShowSlashMenu(null);
  };

  const insertWikilink = (blockId: string, docTitle: string) => {
    const block = document.blocks.find(b => b.id === blockId);
    if (!block) return;
    const val = block.content;
    const lastDoubleBracket = val.lastIndexOf('[[');
    if (lastDoubleBracket !== -1) {
      const newVal = val.slice(0, lastDoubleBracket) + `[[${docTitle}]] `;
      updateBlock(blockId, { content: newVal });
    }
    setActiveBlockId(blockId);
    setShowWikilinkMenu(null);
  };

  const handleInputChange = (blockId: string, val: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (val.startsWith('/')) {
      const rect = e.target.getBoundingClientRect();
      setShowSlashMenu({
        blockId,
        filter: val.slice(1).toLowerCase(),
        x: rect.left,
        y: rect.bottom + 4,
      });
    } else {
      setShowSlashMenu(null);
    }

    const lastDoubleBracket = val.lastIndexOf('[[');
    if (lastDoubleBracket !== -1 && val.indexOf(']]', lastDoubleBracket) === -1) {
      const rect = e.target.getBoundingClientRect();
      setShowWikilinkMenu({
        blockId,
        filter: val.slice(lastDoubleBracket + 2).toLowerCase(),
        x: rect.left + 20,
        y: rect.bottom + 4,
      });
    } else {
      setShowWikilinkMenu(null);
    }

    updateBlock(blockId, { content: val });
  };

  const handleKeyDown = (blockId: string, e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showSlashMenu && filteredSlashItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSlashItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredSlashItems[selectedIndex];
        if (selected) {
          applySlashType(blockId, selected.type as BlockType, selected.extra);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(null);
        return;
      }
    }

    if (showWikilinkMenu && filteredWikilinks.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredWikilinks.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredWikilinks.length) % filteredWikilinks.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredWikilinks[selectedIndex];
        if (selected) {
          insertWikilink(blockId, selected.title);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowWikilinkMenu(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showSlashMenu && !showWikilinkMenu) {
      e.preventDefault();
      addBlock(blockId);
    }
  };

  const renderInlineFormatted = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\[.*?\]\])/g);

    return (
      <span className="whitespace-pre-wrap break-words">
        {parts.map((part, i) => {
          if (part.startsWith('[[') && part.endsWith(']]')) {
            const linkTitle = part.slice(2, -2).trim();
            const targetDoc = allDocuments.find(
              d => d.title.toLowerCase() === linkTitle.toLowerCase()
            );

            return (
              <span
                key={i}
                className="wikilink inline-flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (targetDoc) {
                    onNavigateToDocument(targetDoc.id);
                  }
                }}
                title={targetDoc ? `Jump to note: ${targetDoc.title}` : `Page "${linkTitle}" not created yet`}
              >
                <Link2 className="w-3.5 h-3.5 opacity-80" />
                {linkTitle}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const textColorOptions = [
    { name: 'Default', value: undefined, colorClass: 'bg-kagaz-700' },
    { name: 'Indigo', value: 'indigo', colorClass: 'bg-indigo-400' },
    { name: 'Cyan', value: 'cyan', colorClass: 'bg-cyan-400' },
    { name: 'Emerald', value: 'emerald', colorClass: 'bg-emerald-400' },
    { name: 'Amber', value: 'amber', colorClass: 'bg-amber-400' },
    { name: 'Rose', value: 'rose', colorClass: 'bg-rose-400' },
    { name: 'Purple', value: 'purple', colorClass: 'bg-purple-400' },
  ];

  const bgColorOptions = [
    { name: 'Default', value: undefined, colorClass: 'bg-kagaz-800 border border-kagaz-700' },
    { name: 'Indigo Box', value: 'indigo-box', colorClass: 'bg-indigo-900/60 border border-indigo-500' },
    { name: 'Cyan Box', value: 'cyan-box', colorClass: 'bg-cyan-900/60 border border-cyan-500' },
    { name: 'Emerald Box', value: 'emerald-box', colorClass: 'bg-emerald-900/60 border border-emerald-500' },
    { name: 'Amber Box', value: 'amber-box', colorClass: 'bg-amber-900/60 border border-amber-500' },
    { name: 'Rose Box', value: 'rose-box', colorClass: 'bg-rose-900/60 border border-rose-500' },
    { name: 'Purple Box', value: 'purple-box', colorClass: 'bg-purple-900/60 border border-purple-500' },
  ];

  const statusOptions: FrontMatter['status'][] = ['Backlog', 'In Progress', 'Review', 'Done'];
  const priorityOptions: FrontMatter['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];

  const [newTagInput, setNewTagInput] = useState('');

  const updateFrontmatterProperty = (field: keyof FrontMatter, val: any) => {
    onUpdateDocument({
      ...document,
      frontmatter: {
        ...document.frontmatter,
        [field]: val,
      },
    });
  };

  const addTag = (tagName: string) => {
    const cleanTag = tagName.replace(/^#/, '').trim();
    if (!cleanTag || document.frontmatter.tags.includes(cleanTag)) {
      setNewTagInput('');
      return;
    }
    const updatedTags = [...document.frontmatter.tags, cleanTag];
    updateFrontmatterProperty('tags', updatedTags);
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = document.frontmatter.tags.filter(t => t !== tagToRemove);
    updateFrontmatterProperty('tags', updatedTags);
  };

  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState<boolean>(false);
  const [customCoverInput, setCustomCoverInput] = useState<string>('');
  const [isRepositioningCover, setIsRepositioningCover] = useState<boolean>(false);
  const [tempCoverPos, setTempCoverPos] = useState<number>(50);
  const isDraggingCoverRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startPosRef = useRef<number>(50);

  const startRepositioning = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRepositioningCover(true);
    const currentPos = document.frontmatter.coverPosition ?? 50;
    setTempCoverPos(currentPos);
    startPosRef.current = currentPos;
    startYRef.current = e.clientY;
    isDraggingCoverRef.current = true;
  };

  const handleCoverMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCoverRef.current || !isRepositioningCover) return;
    const deltaY = e.clientY - startYRef.current;
    const newPos = Math.min(100, Math.max(0, startPosRef.current + deltaY * 0.5));
    setTempCoverPos(Math.round(newPos));
  };

  const stopRepositioning = () => {
    isDraggingCoverRef.current = false;
  };

  const saveCoverPosition = () => {
    updateFrontmatterProperty('coverPosition', tempCoverPos);
    setIsRepositioningCover(false);
    isDraggingCoverRef.current = false;
  };

  const cancelCoverPosition = () => {
    setIsRepositioningCover(false);
    isDraggingCoverRef.current = false;
  };

  const gradientPresets = [
    { id: 'gradient-1', label: 'Cosmic Glow', css: 'bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900' },
    { id: 'gradient-2', label: 'Cyber Neon', css: 'bg-gradient-to-r from-cyan-900 via-teal-900 to-indigo-900' },
    { id: 'gradient-3', label: 'Sunset Flare', css: 'bg-gradient-to-r from-rose-900 via-amber-900 to-red-900' },
    { id: 'gradient-4', label: 'Emerald Forest', css: 'bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900' },
    { id: 'gradient-5', label: 'Dark Obsidian', css: 'bg-gradient-to-r from-slate-900 via-zinc-900 to-stone-900' },
  ];

  const getCoverBgClass = (cover?: string) => {
    const found = gradientPresets.find(p => p.id === cover);
    return found ? found.css : '';
  };

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        if (draggedIndex === null && !isDragOverEditor) setIsDragOverEditor(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOverEditor(false);
      }}
      onDrop={handleDropFilesOnEditor}
      onPaste={handlePasteMultimedia}
      className={`relative mx-auto py-10 pb-32 text-kagaz-100 min-h-full select-text transition-all duration-300 ${getPageWidthClass(pageWidth)} ${
        isDragOverEditor ? 'ring-4 ring-kagaz-glow/60 rounded-3xl bg-kagaz-glow/5' : ''
      }`}
    >
      {pasteToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-kagaz-950 border border-kagaz-glow text-kagaz-glow px-4 py-2.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-kagaz-glow" />
          <span>{pasteToastMessage}</span>
        </div>
      )}
      {isDragOverEditor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <div className="p-8 rounded-3xl bg-kagaz-950 border-2 border-dashed border-kagaz-glow text-center shadow-2xl space-y-3">
            <Upload className="w-12 h-12 text-kagaz-glow mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Drop files to add to note</h3>
            <p className="text-xs text-kagaz-400">Supports Images, GIFs, Videos, Audio tracks, and Text files</p>
          </div>
        </div>
      )}

      {/* Notion / Craft style Custom Cover Banner (Hero Mode vs Banner Mode) */}
      {document.frontmatter.coverImage && document.frontmatter.coverStyle === 'hero' ? (
        <div className="relative group w-full rounded-3xl mb-8 border border-kagaz-800/80 shadow-2xl transition-all p-6 pt-10 text-white min-h-[260px] flex flex-col justify-end space-y-4">
          {/* Cover Background */}
          {document.frontmatter.coverImage.startsWith('gradient-') ? (
            <div className={`absolute inset-0 w-full h-full rounded-3xl ${getCoverBgClass(document.frontmatter.coverImage)}`} />
          ) : (
            <img 
              src={document.frontmatter.coverImage} 
              alt="Cover" 
              className={`absolute inset-0 w-full h-full rounded-3xl object-cover transition-all ${
                isRepositioningCover ? 'cursor-row-resize select-none ring-4 ring-kagaz-glow' : ''
              }`}
              style={{ objectPosition: `center ${isRepositioningCover ? tempCoverPos : (document.frontmatter.coverPosition ?? 50)}%` }}
              onMouseDown={isRepositioningCover ? startRepositioning : undefined}
              onMouseMove={isRepositioningCover ? handleCoverMouseMove : undefined}
              onMouseUp={isRepositioningCover ? stopRepositioning : undefined}
            />
          )}

          {/* Floating Reposition Tool Overlay Bar */}
          {isRepositioningCover && (
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[250] bg-kagaz-950/95 backdrop-blur-md border border-kagaz-glow px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-bold text-white animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-kagaz-glow animate-pulse" />
                <span>Drag image or adjust position:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tempCoverPos}
                  onChange={(e) => setTempCoverPos(Number(e.target.value))}
                  className="w-28 accent-kagaz-glow cursor-pointer"
                />
                <span className="font-mono text-kagaz-glow text-xs w-8">{tempCoverPos}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveCoverPosition}
                  className="px-3 py-1 rounded-xl bg-kagaz-accent text-white font-bold hover:bg-kagaz-accent/80 transition-all cursor-pointer shadow-md"
                >
                  Save Position
                </button>
                <button
                  onClick={cancelCoverPosition}
                  className="px-3 py-1 rounded-xl bg-kagaz-900 text-kagaz-400 hover:text-white transition-all cursor-pointer border border-kagaz-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Legibility Overlay Gradient */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-kagaz-950 via-kagaz-950/75 to-kagaz-950/20 backdrop-blur-[1px]" />

          {/* Cover Action Buttons Overlay */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 z-30">
            {!document.frontmatter.coverImage.startsWith('gradient-') && (
              <button
                onClick={startRepositioning}
                className="px-3 py-1 text-xs font-bold text-white bg-kagaz-900/90 hover:bg-kagaz-800 rounded-xl border border-kagaz-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Reposition cover image view area"
              >
                <GripVertical className="w-3.5 h-3.5 text-kagaz-cyan" />
                <span>Reposition</span>
              </button>
            )}

            <button
              onClick={() => updateFrontmatterProperty('coverStyle', 'banner')}
              className="px-3 py-1 text-xs font-bold text-kagaz-glow bg-kagaz-glow/15 hover:bg-kagaz-glow/25 border border-kagaz-glow/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Switch to Top Banner Mode"
            >
              <Sparkles className="w-3.5 h-3.5 text-kagaz-glow" />
              <span>Switch to Banner</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsCoverPickerOpen(!isCoverPickerOpen)}
                className="px-3 py-1 text-xs font-bold text-white bg-kagaz-accent/80 hover:bg-kagaz-accent rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Change Cover</span>
              </button>

              {isCoverPickerOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 z-[200] w-80 glass-panel rounded-2xl shadow-2xl p-4 border border-kagaz-glow/40 bg-kagaz-950/95 space-y-4 animate-in fade-in zoom-in-95 text-kagaz-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-kagaz-800 pb-2">
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-kagaz-glow" />
                      Note Cover Banner
                    </h4>
                    <button
                      onClick={() => setIsCoverPickerOpen(false)}
                      className="text-kagaz-500 hover:text-white text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Gradients */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider">
                      Preset Gradients
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {gradientPresets.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            updateFrontmatterProperty('coverImage', preset.id);
                            setIsCoverPickerOpen(false);
                          }}
                          className={`h-12 rounded-xl p-2 flex items-end justify-start text-[10px] font-extrabold text-white shadow-md transition-all hover:scale-105 cursor-pointer border border-white/20 ${preset.css}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Image URL or Upload */}
                  <div className="space-y-2 border-t border-kagaz-800 pt-3">
                    <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider">
                      Custom Image URL / File
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste Image / GIF URL..."
                        value={customCoverInput}
                        onChange={(e) => setCustomCoverInput(e.target.value)}
                        className="flex-1 bg-kagaz-900 border border-kagaz-800 rounded-xl px-3 py-1.5 text-xs text-kagaz-100 placeholder-kagaz-500 focus:outline-none focus:border-kagaz-glow"
                      />
                      <button
                        onClick={() => {
                          if (customCoverInput.trim()) {
                            updateFrontmatterProperty('coverImage', customCoverInput.trim());
                            setCustomCoverInput('');
                            setIsCoverPickerOpen(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-kagaz-accent text-white font-bold text-xs hover:bg-kagaz-accent/80 transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-kagaz-900 border border-dashed border-kagaz-700 hover:border-kagaz-glow text-kagaz-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-kagaz-cyan" />
                      <span>Upload Cover File...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              updateFrontmatterProperty('coverImage', dataUrl);
                              setIsCoverPickerOpen(false);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => updateFrontmatterProperty('coverImage', undefined)}
              className="px-3 py-1 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>

          {/* Hero Header Content (Floating ON TOP OF Cover) */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              {/* Icon Picker */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsIconPickerOpen(!isIconPickerOpen);
                    setIsFolderMenuOpen(false);
                    setIsStatusMenuOpen(false);
                    setIsPriorityMenuOpen(false);
                    setIsCoverPickerOpen(false);
                  }}
                  className="w-11 h-11 text-2xl bg-kagaz-900/90 border border-white/20 rounded-2xl hover:bg-kagaz-800 hover:border-kagaz-glow hover:scale-105 transition-all flex items-center justify-center cursor-pointer shadow-lg overflow-hidden backdrop-blur-md"
                  title="Click to choose note icon"
                >
                  {document.frontmatter.icon?.startsWith('http') || document.frontmatter.icon?.startsWith('data:image') ? (
                    <img src={document.frontmatter.icon} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{document.frontmatter.icon || '📝'}</span>
                  )}
                </button>
              </div>

              {/* Group / Status / Priority badges */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-xl bg-kagaz-cyan/20 text-kagaz-cyan border border-kagaz-cyan/40 backdrop-blur-md shadow-md">
                  📁 {document.frontmatter.folder || 'General Notes'}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-xl border backdrop-blur-md shadow-md ${
                  document.frontmatter.status === 'Done' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  document.frontmatter.status === 'In Progress' ? 'bg-kagaz-accent/25 text-kagaz-glow border-kagaz-accent/50' :
                  'bg-kagaz-900/80 text-kagaz-300 border-kagaz-700/80'
                }`}>
                  {document.frontmatter.status}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-md">
                  {document.frontmatter.priority} Priority
                </span>
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={document.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Untitled Note"
              className="w-full text-3xl md:text-4xl font-black bg-transparent text-white placeholder-white/40 focus:outline-none tracking-tight drop-shadow-md"
            />

            {/* Tags Row */}
            <div className="flex flex-wrap items-center gap-2">
              {document.frontmatter.tags.map((tag, i) => (
                <span key={i} className="tag-badge flex items-center gap-1.5 group font-bold bg-white/10 text-white border-white/20 backdrop-blur-md">
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity text-xs font-black cursor-pointer"
                    title={`Remove #${tag}`}
                  >
                    ✕
                  </button>
                </span>
              ))}

              <input
                type="text"
                placeholder="+ Add Tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag(newTagInput);
                  }
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-kagaz-glow w-28 transition-all backdrop-blur-md"
              />

              <span className="text-xs text-white/60 ml-auto font-medium">
                Last modified: {document.frontmatter.lastModified}
              </span>
            </div>
          </div>
        </div>
      ) : document.frontmatter.coverImage ? (
        <div className="relative group w-full h-44 md:h-52 rounded-3xl mb-6 border border-kagaz-800/80 shadow-2xl transition-all">
          {document.frontmatter.coverImage.startsWith('gradient-') ? (
            <div className={`w-full h-full rounded-3xl ${getCoverBgClass(document.frontmatter.coverImage)}`} />
          ) : (
            <img 
              src={document.frontmatter.coverImage} 
              alt="Cover" 
              className={`w-full h-full rounded-3xl object-cover transition-all ${
                isRepositioningCover ? 'cursor-row-resize select-none ring-4 ring-kagaz-glow' : ''
              }`}
              style={{ objectPosition: `center ${isRepositioningCover ? tempCoverPos : (document.frontmatter.coverPosition ?? 50)}%` }}
              onMouseDown={isRepositioningCover ? startRepositioning : undefined}
              onMouseMove={isRepositioningCover ? handleCoverMouseMove : undefined}
              onMouseUp={isRepositioningCover ? stopRepositioning : undefined}
            />
          )}

          {/* Floating Reposition Tool Overlay Bar */}
          {isRepositioningCover && (
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[250] bg-kagaz-950/95 backdrop-blur-md border border-kagaz-glow px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-bold text-white animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-kagaz-glow animate-pulse" />
                <span>Drag image or adjust position:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tempCoverPos}
                  onChange={(e) => setTempCoverPos(Number(e.target.value))}
                  className="w-28 accent-kagaz-glow cursor-pointer"
                />
                <span className="font-mono text-kagaz-glow text-xs w-8">{tempCoverPos}%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveCoverPosition}
                  className="px-3 py-1 rounded-xl bg-kagaz-accent text-white font-bold hover:bg-kagaz-accent/80 transition-all cursor-pointer shadow-md"
                >
                  Save Position
                </button>
                <button
                  onClick={cancelCoverPosition}
                  className="px-3 py-1 rounded-xl bg-kagaz-900 text-kagaz-400 hover:text-white transition-all cursor-pointer border border-kagaz-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Cover Action Buttons Overlay */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 z-20">
            {!document.frontmatter.coverImage.startsWith('gradient-') && (
              <button
                onClick={startRepositioning}
                className="px-3 py-1 text-xs font-bold text-white bg-kagaz-900/90 hover:bg-kagaz-800 rounded-xl border border-kagaz-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Reposition cover image view area"
              >
                <GripVertical className="w-3.5 h-3.5 text-kagaz-cyan" />
                <span>Reposition</span>
              </button>
            )}

            <button
              onClick={() => updateFrontmatterProperty('coverStyle', 'hero')}
              className="px-3 py-1 text-xs font-bold text-kagaz-glow bg-kagaz-glow/15 hover:bg-kagaz-glow/25 border border-kagaz-glow/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Use cover image as Title Background (Hero Mode)"
            >
              <Sparkles className="w-3.5 h-3.5 text-kagaz-glow" />
              <span>Use as Title BG</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsCoverPickerOpen(!isCoverPickerOpen)}
                className="px-3 py-1 text-xs font-bold text-white bg-kagaz-accent/80 hover:bg-kagaz-accent rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Change Cover</span>
              </button>

              {isCoverPickerOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 z-[200] w-80 glass-panel rounded-2xl shadow-2xl p-4 border border-kagaz-glow/40 bg-kagaz-950/95 space-y-4 animate-in fade-in zoom-in-95 text-kagaz-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-kagaz-800 pb-2">
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-kagaz-glow" />
                      Note Cover Banner
                    </h4>
                    <button
                      onClick={() => setIsCoverPickerOpen(false)}
                      className="text-kagaz-500 hover:text-white text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Gradients */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider">
                      Preset Gradients
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {gradientPresets.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            updateFrontmatterProperty('coverImage', preset.id);
                            setIsCoverPickerOpen(false);
                          }}
                          className={`h-12 rounded-xl p-2 flex items-end justify-start text-[10px] font-extrabold text-white shadow-md transition-all hover:scale-105 cursor-pointer border border-white/20 ${preset.css}`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Image URL or Upload */}
                  <div className="space-y-2 border-t border-kagaz-800 pt-3">
                    <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider">
                      Custom Image URL / File
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste Image / GIF URL..."
                        value={customCoverInput}
                        onChange={(e) => setCustomCoverInput(e.target.value)}
                        className="flex-1 bg-kagaz-900 border border-kagaz-800 rounded-xl px-3 py-1.5 text-xs text-kagaz-100 placeholder-kagaz-500 focus:outline-none focus:border-kagaz-glow"
                      />
                      <button
                        onClick={() => {
                          if (customCoverInput.trim()) {
                            updateFrontmatterProperty('coverImage', customCoverInput.trim());
                            setCustomCoverInput('');
                            setIsCoverPickerOpen(false);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-kagaz-accent text-white font-bold text-xs hover:bg-kagaz-accent/80 transition-all cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-kagaz-900 border border-dashed border-kagaz-700 hover:border-kagaz-glow text-kagaz-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-kagaz-cyan" />
                      <span>Upload Cover File...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              updateFrontmatterProperty('coverImage', dataUrl);
                              setIsCoverPickerOpen(false);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => updateFrontmatterProperty('coverImage', undefined)}
              className="px-3 py-1 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Document Header (Rendered only when NOT in Hero Title BG mode) */}
      {document.frontmatter.coverStyle !== 'hero' && (
        <div className="mb-8 border-b border-kagaz-800/60 pb-6">
        <div className="flex items-center gap-3 mb-4">
          {/* Custom Dark Glass Icon / Emoji / Image / GIF Picker Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setIsIconPickerOpen(!isIconPickerOpen);
                setIsFolderMenuOpen(false);
                setIsStatusMenuOpen(false);
                setIsPriorityMenuOpen(false);
                setIsCoverPickerOpen(false);
              }}
              className="w-11 h-11 text-2xl bg-kagaz-900 border border-kagaz-700/60 rounded-2xl hover:bg-kagaz-800 hover:border-kagaz-glow hover:scale-105 transition-all flex items-center justify-center cursor-pointer shadow-md overflow-hidden"
              title="Click to choose note icon, emoji, image or GIF"
            >
              {document.frontmatter.icon?.startsWith('http') || document.frontmatter.icon?.startsWith('data:image') ? (
                <img src={document.frontmatter.icon} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span>{document.frontmatter.icon || '📝'}</span>
              )}
            </button>

            {isIconPickerOpen && (
              <div 
                className="absolute left-0 top-full mt-2 z-50 w-80 glass-panel rounded-2xl shadow-2xl p-3.5 border border-kagaz-glow/40 animate-fade-in glow-border bg-kagaz-950/95 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-kagaz-800 pb-2">
                  <div className="flex items-center gap-1 bg-kagaz-900 p-0.5 rounded-xl border border-kagaz-800">
                    <button
                      onClick={() => setIconPickerTab('emojis')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        iconPickerTab === 'emojis' ? 'bg-kagaz-accent text-white shadow-sm' : 'text-kagaz-400 hover:text-white'
                      }`}
                    >
                      😀 Emojis
                    </button>
                    <button
                      onClick={() => setIconPickerTab('custom')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        iconPickerTab === 'custom' ? 'bg-kagaz-glow text-white shadow-sm' : 'text-kagaz-400 hover:text-white'
                      }`}
                    >
                      🖼️ Image / GIF
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      updateFrontmatterProperty('icon', '📝');
                      setIsIconPickerOpen(false);
                    }}
                    className="text-[11px] font-bold text-kagaz-400 hover:text-white underline cursor-pointer"
                  >
                    Reset Icon
                  </button>
                </div>

                {iconPickerTab === 'emojis' ? (
                  <div className="space-y-2">
                    {/* Search / Custom Emoji Input */}
                    <input
                      type="text"
                      value={iconSearchQuery}
                      onChange={(e) => {
                        setIconSearchQuery(e.target.value);
                        if (e.target.value.trim().length >= 1 && e.target.value.trim().length <= 3) {
                          updateFrontmatterProperty('icon', e.target.value.trim());
                        }
                      }}
                      placeholder="Search emojis or type custom symbol..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-100 focus:outline-none focus:border-kagaz-glow"
                    />

                    {/* Curated Emoji Picker Grid (100+ icons) */}
                    <div className="grid grid-cols-7 gap-1 max-h-52 overflow-y-auto p-1.5 bg-kagaz-900/50 rounded-xl border border-kagaz-800/80">
                      {[
                        '📝', '📄', '📓', '📚', '📖', '📜', '📁', '📂', '📑', '📌', '📍', '✉️', '📈', '📊', '🗓️', '📅', '📮', '🏷️', '💼', '🗂️', '📋',
                        '💡', '🧠', '⚡', '🎯', '🚀', '🔬', '💻', '🛠️', '⚙️', '🔑', '🧪', '🎨', '🌐', '🏆', '🌟', '⭐', '🤖', '👾', '🕹️', '📱', '📡', '🔋',
                        '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥳', '🤩', '🤔', '🤯', '🤫', '😴', '👻', '👽', '👑',
                        '🍏', '🍉', '🍔', '🍕', '☕', '🍺', '🌴', '🌲', '🌸', '🍀', '☀️', '🌙', '🔥', '🌊', '🐶', '🐱', '🦊', '🦁', '🦄', '🦅', '🐝', '🌱',
                        '⚽', '🎮', '🎵', '🎬', '🎨', '🎒', '🛡️', '💬', '❤️', '💯', '⚠️', '🚫', '🔴', '🟢', '🔵', '🟣', '🟤', '💥', '💫', '✨', '💎', '🧭', '🔮'
                      ]
                        .filter(icon => !iconSearchQuery || icon.includes(iconSearchQuery))
                        .map((icon, idx) => (
                          <button
                            key={`${icon}-${idx}`}
                            onClick={() => {
                              updateFrontmatterProperty('icon', icon);
                              setIsIconPickerOpen(false);
                              setIconSearchQuery('');
                            }}
                            className={`w-8 h-8 text-base rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              (document.frontmatter.icon || '📝') === icon
                                ? 'bg-kagaz-accent text-white shadow-md border border-kagaz-glow scale-110'
                                : 'hover:bg-kagaz-800 text-kagaz-200 hover:scale-105'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-1">
                    <p className="text-[11px] font-bold text-kagaz-400">
                      Upload an Image or animated GIF, or paste a URL below to use as your note icon!
                    </p>

                    <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-kagaz-900 hover:bg-kagaz-800 border border-dashed border-kagaz-glow/60 text-xs font-bold text-kagaz-glow cursor-pointer transition-all">
                      <Upload className="w-4 h-4 text-kagaz-glow" />
                      <span>Upload Image / GIF File</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;
                            updateFrontmatterProperty('icon', dataUrl);
                            setIsIconPickerOpen(false);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-kagaz-500 uppercase">Or Paste Image / GIF URL:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customIconInput}
                          onChange={(e) => setCustomIconInput(e.target.value)}
                          placeholder="https://example.com/icon.gif or logo.png..."
                          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl bg-kagaz-900 border border-kagaz-800 text-kagaz-200 focus:outline-none focus:border-kagaz-glow"
                        />
                        <button
                          onClick={() => {
                            if (customIconInput.trim()) {
                              updateFrontmatterProperty('icon', customIconInput.trim());
                              setIsIconPickerOpen(false);
                              setCustomIconInput('');
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-kagaz-glow text-white hover:bg-kagaz-glow/80 cursor-pointer transition-all"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Notion / Craft style Add Cover Button */}
            {!document.frontmatter.coverImage && (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsCoverPickerOpen(!isCoverPickerOpen);
                    setIsIconPickerOpen(false);
                    setIsFolderMenuOpen(false);
                    setIsStatusMenuOpen(false);
                    setIsPriorityMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-kagaz-glow/50 bg-kagaz-glow/15 text-kagaz-glow hover:bg-kagaz-glow/25 hover:border-kagaz-glow transition-all cursor-pointer shadow-md"
                  title="Add a custom cover image or gradient banner to this note"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-kagaz-glow" />
                  <span>Add Cover</span>
                </button>

                {isCoverPickerOpen && (
                  <div 
                    className="absolute left-0 top-full mt-2 z-[100] w-80 glass-panel rounded-2xl shadow-2xl p-4 border border-kagaz-glow/40 bg-kagaz-950/95 space-y-4 animate-in fade-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-kagaz-800 pb-2">
                      <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-kagaz-glow" />
                        Note Cover Banner
                      </h4>
                      <button
                        onClick={() => setIsCoverPickerOpen(false)}
                        className="text-kagaz-500 hover:text-white text-xs font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Preset Gradients */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider">
                        Preset Gradients
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {gradientPresets.map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              updateFrontmatterProperty('coverImage', preset.id);
                              setIsCoverPickerOpen(false);
                            }}
                            className={`h-12 rounded-xl p-2 flex items-end justify-start text-[10px] font-extrabold text-white shadow-md transition-all hover:scale-105 cursor-pointer border border-white/20 ${preset.css}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Image URL or Upload */}
                    <div className="space-y-2 border-t border-kagaz-800 pt-3">
                      <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider">
                        Custom Image URL / File
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste Image / GIF URL..."
                          value={customCoverInput}
                          onChange={(e) => setCustomCoverInput(e.target.value)}
                          className="flex-1 bg-kagaz-900 border border-kagaz-800 rounded-xl px-3 py-1.5 text-xs text-kagaz-100 placeholder-kagaz-500 focus:outline-none focus:border-kagaz-glow"
                        />
                        <button
                          onClick={() => {
                            if (customCoverInput.trim()) {
                              updateFrontmatterProperty('coverImage', customCoverInput.trim());
                              setCustomCoverInput('');
                              setIsCoverPickerOpen(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-kagaz-accent text-white font-bold text-xs hover:bg-kagaz-accent/80 transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      <label className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-kagaz-900 border border-dashed border-kagaz-700 hover:border-kagaz-glow text-kagaz-300 hover:text-white text-xs font-bold transition-all cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-kagaz-cyan" />
                        <span>Upload Cover File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const dataUrl = ev.target?.result as string;
                                updateFrontmatterProperty('coverImage', dataUrl);
                                setIsCoverPickerOpen(false);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Dark Glass Group/Folder Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsFolderMenuOpen(!isFolderMenuOpen);
                  setIsStatusMenuOpen(false);
                  setIsPriorityMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-kagaz-cyan/40 bg-kagaz-cyan/15 text-kagaz-cyan transition-all cursor-pointer shadow-md"
              >
                <Folder className="w-3.5 h-3.5 text-kagaz-cyan" />
                <span>{document.frontmatter.folder || 'General Notes'}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isFolderMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 z-50 w-52 glass-panel rounded-2xl shadow-2xl p-1.5 border border-kagaz-cyan/40 animate-fade-in glow-border bg-kagaz-950/95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] font-bold tracking-wider text-kagaz-cyan uppercase px-2 py-1 mb-1">
                    Assign Note Group
                  </div>
                  {availableFolders.map(folderName => (
                    <button
                      key={folderName}
                      onClick={() => {
                        updateFrontmatterProperty('folder', folderName);
                        setIsFolderMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        (document.frontmatter.folder || 'General Notes') === folderName
                          ? 'bg-kagaz-cyan/30 text-white border border-kagaz-cyan/50 shadow-sm'
                          : 'text-kagaz-300 hover:bg-kagaz-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Folder className="w-3.5 h-3.5 text-kagaz-cyan shrink-0" />
                        <span className="truncate">{folderName}</span>
                      </div>
                      {(document.frontmatter.folder || 'General Notes') === folderName && <Check className="w-3.5 h-3.5 text-kagaz-cyan stroke-[3]" />}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const newGroupName = prompt('Create new Note Group / Folder:');
                      if (newGroupName && newGroupName.trim()) {
                        updateFrontmatterProperty('folder', newGroupName.trim());
                      }
                      setIsFolderMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-2 mt-1 rounded-xl text-xs font-bold text-kagaz-glow hover:bg-kagaz-900 border border-dashed border-kagaz-glow/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Group...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Custom Dark Glass Status Popover Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsStatusMenuOpen(!isStatusMenuOpen);
                  setIsPriorityMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-md ${
                  document.frontmatter.status === 'Done' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' :
                  document.frontmatter.status === 'Review' ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' :
                  document.frontmatter.status === 'In Progress' ? 'bg-kagaz-accent/20 text-kagaz-accent border-kagaz-accent/40' :
                  'bg-kagaz-900 text-kagaz-400 border-kagaz-700/80'
                }`}
              >
                <span>{document.frontmatter.status}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isStatusMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 z-50 w-44 glass-panel rounded-2xl shadow-2xl p-1.5 border border-kagaz-accent/40 animate-fade-in glow-border bg-kagaz-950/95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] font-bold tracking-wider text-kagaz-glow uppercase px-2 py-1 mb-1">
                    Select Status
                  </div>
                  {statusOptions.map(statusVal => (
                    <button
                      key={statusVal}
                      onClick={() => {
                        updateFrontmatterProperty('status', statusVal);
                        setIsStatusMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        document.frontmatter.status === statusVal
                          ? 'bg-kagaz-accent/30 text-white border border-kagaz-accent/50 shadow-sm'
                          : 'text-kagaz-300 hover:bg-kagaz-900 hover:text-white'
                      }`}
                    >
                      <span>{statusVal}</span>
                      {document.frontmatter.status === statusVal && <Check className="w-3.5 h-3.5 text-kagaz-glow stroke-[3]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Dark Glass Priority Popover Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsPriorityMenuOpen(!isPriorityMenuOpen);
                  setIsStatusMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-kagaz-amber/40 bg-kagaz-amber/15 text-kagaz-amber transition-all cursor-pointer shadow-md"
              >
                <span>{document.frontmatter.priority} Priority</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {isPriorityMenuOpen && (
                <div 
                  className="absolute left-0 top-full mt-2 z-50 w-48 glass-panel rounded-2xl shadow-2xl p-1.5 border border-kagaz-amber/40 animate-fade-in glow-border bg-kagaz-950/95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-[10px] font-bold tracking-wider text-kagaz-amber uppercase px-2 py-1 mb-1">
                    Select Priority
                  </div>
                  {priorityOptions.map(priorityVal => (
                    <button
                      key={priorityVal}
                      onClick={() => {
                        updateFrontmatterProperty('priority', priorityVal);
                        setIsPriorityMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        document.frontmatter.priority === priorityVal
                          ? 'bg-kagaz-amber/30 text-white border border-kagaz-amber/50 shadow-sm'
                          : 'text-kagaz-300 hover:bg-kagaz-900 hover:text-white'
                      }`}
                    >
                      <span>{priorityVal} Priority</span>
                      {document.frontmatter.priority === priorityVal && <Check className="w-3.5 h-3.5 text-kagaz-amber stroke-[3]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Note Title Input */}
        <input
          type="text"
          value={document.title}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Untitled Note"
          spellCheck={true}
          className="w-full text-4xl font-extrabold bg-transparent text-kagaz-100 placeholder-kagaz-600 focus:outline-none font-sans tracking-tight"
        />

        {/* Interactive Tags Row with Add/Remove Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {document.frontmatter.tags.map((tag, i) => (
            <span key={i} className="tag-badge flex items-center gap-1.5 group font-bold">
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-rose-400 opacity-60 hover:opacity-100 transition-opacity text-xs font-black cursor-pointer"
                title={`Remove #${tag}`}
              >
                ✕
              </button>
            </span>
          ))}

          <input
            type="text"
            placeholder="+ Add Tag..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(newTagInput);
              }
            }}
            spellCheck={false}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-kagaz-900 border border-kagaz-800 text-kagaz-200 placeholder-kagaz-500 focus:outline-none focus:border-kagaz-glow w-28 transition-all"
          />

          <span className="text-xs text-kagaz-400 ml-auto">
            Last modified: {document.frontmatter.lastModified}
          </span>
        </div>
      </div>
      )}

      {/* Block List */}
      <div className="space-y-2">
        {document.blocks.map((block, index) => {
          const isFocused = activeBlockId === block.id;

          return (
            <div
              key={block.id}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(index));
                setDraggedIndex(index);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                moveBlock(fromIdx, index);
                setDraggedIndex(null);
              }}
              className={`block-row group flex items-start gap-2 rounded-lg p-1.5 transition-all ${getBgColorClass(block.bgColor)} ${
                draggedIndex === index ? 'opacity-40 border-2 border-dashed border-kagaz-accent' : 'hover:bg-kagaz-900/60'
              }`}
              onClick={() => setActiveBlockId(block.id)}
            >
              {/* Block Grip Handle & Drag Controls */}
              <div className="block-controls flex items-center gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div 
                  className="p-1 hover:bg-kagaz-800 rounded text-kagaz-500 hover:text-kagaz-100 cursor-grab active:cursor-grabbing"
                  title="Drag to reorder block"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setShowColorPicker(
                      showColorPicker?.blockId === block.id
                        ? null
                        : { blockId: block.id, x: rect.left, y: rect.bottom + 4 }
                    );
                  }}
                  className="p-1 hover:bg-kagaz-800 rounded text-kagaz-400 hover:text-kagaz-glow"
                  title="Customize block text & background color"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => addBlock(block.id)}
                  className="p-1 hover:bg-kagaz-800 rounded text-kagaz-400 hover:text-kagaz-100"
                  title="Add block below"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveBlock(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 hover:bg-kagaz-800 rounded text-kagaz-400 hover:text-kagaz-100 disabled:opacity-30"
                  title="Move up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveBlock(index, index + 1)}
                  disabled={index === document.blocks.length - 1}
                  className="p-1 hover:bg-kagaz-800 rounded text-kagaz-400 hover:text-kagaz-100 disabled:opacity-30"
                  title="Move down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="p-1 hover:bg-rose-500/20 rounded text-kagaz-400 hover:text-rose-400"
                  title="Delete block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Block Input Content Renderers */}
              <div className="flex-1 min-w-0">
                {block.type === 'heading-1' && (
                  !isFocused && block.content.includes('[[') ? (
                    <div onClick={() => setActiveBlockId(block.id)} className={`w-full text-2xl font-bold py-1 cursor-text ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}>
                      {renderInlineFormatted(block.content)}
                    </div>
                  ) : (
                    <textarea
                      ref={setInputRef(block.id)}
                      rows={1}
                      value={block.content}
                      onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                      onKeyDown={(e) => handleKeyDown(block.id, e)}
                      placeholder="Heading 1"
                      spellCheck={true}
                      className={`w-full text-2xl font-bold bg-transparent focus:outline-none py-1 border-b border-transparent focus:border-kagaz-accent/40 resize-none overflow-hidden leading-snug ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}
                    />
                  )
                )}

                {block.type === 'heading-2' && (
                  !isFocused && block.content.includes('[[') ? (
                    <div onClick={() => setActiveBlockId(block.id)} className={`w-full text-xl font-semibold py-1 cursor-text ${getTextColorClass(block.textColor) || 'text-kagaz-200'}`}>
                      {renderInlineFormatted(block.content)}
                    </div>
                  ) : (
                    <textarea
                      ref={setInputRef(block.id)}
                      rows={1}
                      value={block.content}
                      onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                      onKeyDown={(e) => handleKeyDown(block.id, e)}
                      placeholder="Heading 2"
                      spellCheck={true}
                      className={`w-full text-xl font-semibold bg-transparent focus:outline-none py-1 resize-none overflow-hidden leading-snug ${getTextColorClass(block.textColor) || 'text-kagaz-200'}`}
                    />
                  )
                )}

                {block.type === 'heading-3' && (
                  !isFocused && block.content.includes('[[') ? (
                    <div onClick={() => setActiveBlockId(block.id)} className={`w-full text-lg font-medium py-1 cursor-text ${getTextColorClass(block.textColor) || 'text-kagaz-300'}`}>
                      {renderInlineFormatted(block.content)}
                    </div>
                  ) : (
                    <textarea
                      ref={setInputRef(block.id)}
                      rows={1}
                      value={block.content}
                      onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                      onKeyDown={(e) => handleKeyDown(block.id, e)}
                      placeholder="Heading 3"
                      spellCheck={true}
                      className={`w-full text-lg font-medium bg-transparent focus:outline-none py-1 resize-none overflow-hidden leading-snug ${getTextColorClass(block.textColor) || 'text-kagaz-300'}`}
                    />
                  )
                )}

                {block.type === 'callout' && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-kagaz-900/80 border border-kagaz-700/60 shadow-lg my-2">
                    <span className="text-xl">{block.calloutIcon || '💡'}</span>
                    {!isFocused && block.content.includes('[[') ? (
                      <div onClick={() => setActiveBlockId(block.id)} className={`w-full py-0.5 cursor-text text-sm font-medium ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}>
                        {renderInlineFormatted(block.content)}
                      </div>
                    ) : (
                      <textarea
                        ref={setInputRef(block.id)}
                        rows={1}
                        value={block.content}
                        onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        placeholder="Callout information..."
                        spellCheck={true}
                        className={`w-full bg-transparent focus:outline-none resize-none overflow-hidden text-sm font-medium leading-relaxed ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}
                      />
                    )}
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="border-l-4 border-kagaz-accent pl-4 py-1 italic my-1">
                    {!isFocused && block.content.includes('[[') ? (
                      <div onClick={() => setActiveBlockId(block.id)} className={`w-full cursor-text ${getTextColorClass(block.textColor) || 'text-kagaz-300'}`}>
                        {renderInlineFormatted(block.content)}
                      </div>
                    ) : (
                      <textarea
                        ref={setInputRef(block.id)}
                        rows={1}
                        value={block.content}
                        onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        placeholder="Quote..."
                        spellCheck={true}
                        className={`w-full bg-transparent focus:outline-none resize-none overflow-hidden leading-relaxed ${getTextColorClass(block.textColor) || 'text-kagaz-300'}`}
                      />
                    )}
                  </div>
                )}

                {block.type === 'todo' && (
                  <div className="flex items-start gap-3 py-1">
                    <button
                      onClick={() => updateBlock(block.id, { checked: !block.checked })}
                      className={`w-5 h-5 mt-1 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        block.checked
                          ? 'bg-kagaz-accent border-kagaz-accent text-white'
                          : 'border-kagaz-600 hover:border-kagaz-400'
                      }`}
                    >
                      {block.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    {!isFocused && block.content.includes('[[') ? (
                      <div onClick={() => setActiveBlockId(block.id)} className={`w-full cursor-text ${block.checked ? 'line-through text-kagaz-400' : getTextColorClass(block.textColor) || 'text-kagaz-100'}`}>
                        {renderInlineFormatted(block.content)}
                      </div>
                    ) : (
                      <textarea
                        ref={setInputRef(block.id)}
                        rows={1}
                        value={block.content}
                        onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        placeholder="To-do task..."
                        spellCheck={true}
                        className={`w-full bg-transparent focus:outline-none resize-none overflow-hidden leading-relaxed ${
                          block.checked ? 'line-through text-kagaz-400' : getTextColorClass(block.textColor) || 'text-kagaz-100'
                        }`}
                      />
                    )}
                  </div>
                )}

                {block.type === 'bullet' && (
                  <div className="flex items-start gap-2 py-1">
                    <span className="text-kagaz-accent text-lg leading-none pt-1 shrink-0">•</span>
                    {!isFocused && block.content.includes('[[') ? (
                      <div onClick={() => setActiveBlockId(block.id)} className={`w-full cursor-text ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}>
                        {renderInlineFormatted(block.content)}
                      </div>
                    ) : (
                      <textarea
                        ref={setInputRef(block.id)}
                        rows={1}
                        value={block.content}
                        onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        placeholder="List item..."
                        spellCheck={true}
                        className={`w-full bg-transparent focus:outline-none resize-none overflow-hidden leading-relaxed ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}
                      />
                    )}
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="bg-kagaz-950 border border-kagaz-800 rounded-xl p-3 my-2 font-mono text-sm shadow-inner">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-kagaz-800 text-xs text-kagaz-400">
                      <span>{block.language || 'Code Snippet'}</span>
                    </div>
                    <textarea
                      ref={setInputRef(block.id)}
                      value={block.content}
                      onChange={(e) => handleInputChange(block.id, e.target.value, e)}
                      onKeyDown={(e) => handleKeyDown(block.id, e)}
                      placeholder="// Write code here..."
                      spellCheck={false}
                      rows={3}
                      className="w-full bg-transparent text-kagaz-cyan focus:outline-none font-mono resize-none text-xs leading-relaxed"
                    />
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="my-3 space-y-2.5 p-3 rounded-2xl bg-kagaz-900/60 border border-kagaz-800">
                    {/* Media Sizing & Alignment Toolbar */}
                    <div className="flex items-center justify-between gap-2 p-1.5 px-3 rounded-xl bg-kagaz-950/90 border border-kagaz-800/90 text-xs font-bold text-kagaz-300 shadow-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Size:</span>
                        {['25%', '50%', '75%', '100%'].map((w) => (
                          <button
                            key={w}
                            onClick={() => updateBlock(block.id, { width: w })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              (block.width || '100%') === w
                                ? 'bg-kagaz-accent text-white shadow-sm'
                                : 'bg-kagaz-900 text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Align:</span>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'left' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'left' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'center' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            (block.align || 'center') === 'center' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'right' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'right' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Media Display Container with Resized Width & Alignment */}
                    <div 
                      className={`transition-all ${
                        block.align === 'left' ? 'mr-auto ml-0' : block.align === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                      }`}
                      style={{ width: block.width || '100%' }}
                    >
                      {block.url ? (
                        <div className="relative group/img overflow-hidden rounded-xl border border-kagaz-700/60 shadow-xl bg-black/40">
                          <img 
                            src={resolveDirectMediaUrl(block.url)} 
                            alt={block.content || 'Embedded Media'} 
                            className="w-full max-h-[500px] object-contain rounded-xl"
                            onError={(e) => {
                              // If raw image loading fails (e.g. share.google HTML page), reveal live iframe preview
                              const imgEl = e.target as HTMLElement;
                              imgEl.style.display = 'none';
                              const fallbackContainer = imgEl.parentElement?.querySelector('.live-iframe-preview') as HTMLElement;
                              if (fallbackContainer) {
                                fallbackContainer.classList.remove('hidden');
                              }
                            }}
                          />
                          <div className="live-iframe-preview hidden w-full h-[420px] rounded-xl overflow-hidden bg-black">
                            <iframe 
                              src={block.url} 
                              className="w-full h-full border-0 rounded-xl" 
                              title="Live Media Embed"
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/80 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-bold text-kagaz-300 flex items-center gap-2 z-10">
                            <span>Image / Web Frame</span>
                            <a href={block.url} target="_blank" rel="noreferrer" className="text-kagaz-glow underline text-[10px]">Open Link ↗</a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 border-2 border-dashed border-kagaz-700 rounded-xl text-center text-kagaz-400">
                          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-kagaz-glow" />
                          <p className="text-xs font-bold">Paste Image / GIF URL or Upload File below</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Paste Image / GIF URL (e.g. https://... or data:image/...)"
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl bg-kagaz-950 border border-kagaz-800 text-kagaz-200 focus:outline-none focus:border-kagaz-glow"
                      />
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kagaz-800 hover:bg-kagaz-700 text-xs font-bold text-kagaz-100 cursor-pointer transition-all shrink-0">
                        <Upload className="w-3.5 h-3.5 text-kagaz-glow" />
                        <span>Upload</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              updateBlock(block.id, { url: dataUrl, content: file.name });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={block.content || ''}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Add image caption..."
                      className="w-full text-center text-xs text-kagaz-400 bg-transparent focus:outline-none italic"
                    />
                  </div>
                )}

                {block.type === 'video' && (
                  <div className="my-3 space-y-2.5 p-3 rounded-2xl bg-kagaz-900/60 border border-kagaz-800">
                    {/* Media Sizing & Alignment Toolbar */}
                    <div className="flex items-center justify-between gap-2 p-1.5 px-3 rounded-xl bg-kagaz-950/90 border border-kagaz-800/90 text-xs font-bold text-kagaz-300 shadow-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Size:</span>
                        {['25%', '50%', '75%', '100%'].map((w) => (
                          <button
                            key={w}
                            onClick={() => updateBlock(block.id, { width: w })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              (block.width || '100%') === w
                                ? 'bg-kagaz-cyan text-white shadow-sm'
                                : 'bg-kagaz-900 text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Align:</span>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'left' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'left' ? 'bg-kagaz-cyan text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'center' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            (block.align || 'center') === 'center' ? 'bg-kagaz-cyan text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'right' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'right' ? 'bg-kagaz-cyan text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Media Display Container with Resized Width & Alignment */}
                    <div 
                      className={`transition-all ${
                        block.align === 'left' ? 'mr-auto ml-0' : block.align === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                      }`}
                      style={{ width: block.width || '100%' }}
                    >
                      {block.url ? (
                        <div className="overflow-hidden rounded-xl border border-kagaz-700/60 shadow-xl bg-black/40">
                          {block.url.includes('youtube.com') || block.url.includes('youtu.be') ? (
                            <iframe
                              src={block.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                              title="YouTube video player"
                              className="w-full aspect-video rounded-xl"
                              allowFullScreen
                            />
                          ) : (
                            <video 
                              src={block.url} 
                              controls 
                              className="w-full max-h-[500px] rounded-xl"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="p-6 border-2 border-dashed border-kagaz-700 rounded-xl text-center text-kagaz-400">
                          <Video className="w-8 h-8 mx-auto mb-2 text-kagaz-cyan" />
                          <p className="text-xs font-bold">Paste MP4 Video URL or YouTube Link below</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Paste Video URL (MP4, WebM, or YouTube link...)"
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl bg-kagaz-950 border border-kagaz-800 text-kagaz-200 focus:outline-none focus:border-kagaz-glow"
                      />
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kagaz-800 hover:bg-kagaz-700 text-xs font-bold text-kagaz-100 cursor-pointer transition-all shrink-0">
                        <Upload className="w-3.5 h-3.5 text-kagaz-cyan" />
                        <span>Upload MP4</span>
                        <input 
                          type="file" 
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              updateBlock(block.id, { url: dataUrl, content: file.name });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {block.type === 'audio' && (
                  <div className="my-3 space-y-2.5 p-4 rounded-2xl bg-kagaz-900/60 border border-kagaz-800">
                    {/* Media Sizing & Alignment Toolbar */}
                    <div className="flex items-center justify-between gap-2 p-1.5 px-3 rounded-xl bg-kagaz-950/90 border border-kagaz-800/90 text-xs font-bold text-kagaz-300 shadow-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Size:</span>
                        {['25%', '50%', '75%', '100%'].map((w) => (
                          <button
                            key={w}
                            onClick={() => updateBlock(block.id, { width: w })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              (block.width || '100%') === w
                                ? 'bg-kagaz-glow text-white shadow-sm'
                                : 'bg-kagaz-900 text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Align:</span>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'left' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'left' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'center' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            (block.align || 'center') === 'center' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'right' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'right' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div 
                      className={`transition-all ${
                        block.align === 'left' ? 'mr-auto ml-0' : block.align === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                      }`}
                      style={{ width: block.width || '100%' }}
                    >
                      <div className="flex items-center gap-3">
                        <Music className="w-6 h-6 text-kagaz-glow shrink-0" />
                        {block.url ? (
                          <audio src={block.url} controls className="w-full" />
                        ) : (
                          <span className="text-xs text-kagaz-400 italic">No audio track loaded. Paste MP3 URL below.</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Paste Audio MP3 / WAV URL..."
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl bg-kagaz-950 border border-kagaz-800 text-kagaz-200 focus:outline-none focus:border-kagaz-glow"
                      />
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kagaz-800 hover:bg-kagaz-700 text-xs font-bold text-kagaz-100 cursor-pointer transition-all shrink-0">
                        <Upload className="w-3.5 h-3.5 text-kagaz-glow" />
                        <span>Upload Audio</span>
                        <input 
                          type="file" 
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              updateBlock(block.id, { url: dataUrl, content: file.name });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {block.type === 'link' && (
                  <div className="my-3 space-y-2.5 p-4 rounded-2xl bg-kagaz-900/70 border border-kagaz-700/60 shadow-lg hover:border-kagaz-glow transition-all">
                    {/* Media Sizing & Alignment Toolbar */}
                    <div className="flex items-center justify-between gap-2 p-1.5 px-3 rounded-xl bg-kagaz-950/90 border border-kagaz-800/90 text-xs font-bold text-kagaz-300 shadow-sm flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Size:</span>
                        {['25%', '50%', '75%', '100%'].map((w) => (
                          <button
                            key={w}
                            onClick={() => updateBlock(block.id, { width: w })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              (block.width || '100%') === w
                                ? 'bg-kagaz-glow text-white shadow-sm'
                                : 'bg-kagaz-900 text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-kagaz-500 font-extrabold uppercase mr-1">Align:</span>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'left' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'left' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'center' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            (block.align || 'center') === 'center' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { align: 'right' })}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            block.align === 'right' ? 'bg-kagaz-glow text-white' : 'text-kagaz-400 hover:text-white hover:bg-kagaz-800'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div 
                      className={`transition-all ${
                        block.align === 'left' ? 'mr-auto ml-0' : block.align === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                      }`}
                      style={{ width: block.width || '100%' }}
                    >
                      <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ExternalLink className="w-4 h-4 text-kagaz-glow shrink-0" />
                          <a 
                            href={block.url || '#'} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-bold text-sm text-kagaz-glow hover:underline truncate"
                          >
                            {block.content || block.url || 'Web Bookmark Link'}
                          </a>
                        </div>
                        {block.url && (
                          <span className="text-[11px] font-mono text-kagaz-400 bg-kagaz-950 px-2 py-0.5 rounded border border-kagaz-800 shrink-0 ml-2">
                            {block.url.replace(/^https?:\/\//, '').split('/')[0]}
                          </span>
                        )}
                      </div>

                      {block.url && (
                        <div className="w-full h-[380px] rounded-xl overflow-hidden border border-kagaz-800/90 bg-black/60 my-2 shadow-inner">
                          <iframe 
                            src={block.url} 
                            className="w-full h-full border-0 rounded-xl" 
                            title="Web Link Preview"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={block.content || ''}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder="Link Title (e.g. Kagaz GitHub Repository)..."
                        className="px-3 py-1 text-xs font-semibold rounded-xl bg-kagaz-950 border border-kagaz-800 text-kagaz-200 focus:outline-none focus:border-kagaz-glow"
                      />
                      <input
                        type="text"
                        value={block.url || ''}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Target URL (e.g. https://...)..."
                        className="px-3 py-1 text-xs font-mono rounded-xl bg-kagaz-950 border border-kagaz-800 text-kagaz-200 focus:outline-none focus:border-kagaz-glow"
                      />
                    </div>
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="py-3">
                    <hr className="border-t border-kagaz-800" />
                  </div>
                )}

                {block.type === 'paragraph' && (
                  <div className="relative py-1">
                    {!isFocused && block.content.includes('[[') ? (
                      <div
                        onClick={() => setActiveBlockId(block.id)}
                        className="min-h-[24px] cursor-text text-kagaz-200"
                      >
                        {renderInlineFormatted(block.content)}
                      </div>
                    ) : (
                      <textarea
                        ref={setInputRef(block.id)}
                        rows={1}
                        value={block.content}
                        onChange={(e) => handleTextareaChange(block.id, e.target.value, e)}
                        onKeyDown={(e) => handleKeyDown(block.id, e)}
                        placeholder="Type '/' for commands or '[[' to link notes..."
                        spellCheck={true}
                        className={`w-full bg-transparent focus:outline-none placeholder-kagaz-600 resize-none overflow-hidden leading-relaxed ${getTextColorClass(block.textColor) || 'text-kagaz-100'}`}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notion-Style Color Picker Popover Menu */}
      {showColorPicker && (
        <div
          className="fixed z-50 w-64 glass-panel rounded-2xl shadow-2xl p-3 animate-fade-in border border-kagaz-accent/40 glow-border"
          style={{ top: Math.min(showColorPicker.y, window.innerHeight - 300), left: showColorPicker.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-kagaz-glow px-1 mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" /> Block Color Style
          </div>

          {/* Text Color Options */}
          <div className="mb-3">
            <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider mb-1.5">
              Text Color
            </div>
            <div className="flex flex-wrap gap-1.5">
              {textColorOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    updateBlock(showColorPicker.blockId, { textColor: opt.value });
                    setShowColorPicker(null);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-kagaz-900 hover:bg-kagaz-800 border border-kagaz-700 hover:border-kagaz-glow transition-all cursor-pointer"
                >
                  <span className={`w-3 h-3 rounded-full ${opt.colorClass}`} />
                  <span className="text-[11px]">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Box Highlight Options */}
          <div>
            <div className="text-[10px] font-bold text-kagaz-400 uppercase tracking-wider mb-1.5">
              Background Box Highlight
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bgColorOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    updateBlock(showColorPicker.blockId, { bgColor: opt.value });
                    setShowColorPicker(null);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold bg-kagaz-900 hover:bg-kagaz-800 border border-kagaz-700 hover:border-kagaz-glow transition-all cursor-pointer"
                >
                  <span className={`w-3 h-3 rounded-md ${opt.colorClass}`} />
                  <span className="text-[11px]">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notion Slash Menu Dropdown */}
      {showSlashMenu && (
        <div
          className="fixed z-50 w-72 glass-panel rounded-xl shadow-2xl p-2 animate-fade-in border border-kagaz-700/80"
          style={{ top: Math.min(showSlashMenu.y, window.innerHeight - 320), left: showSlashMenu.x }}
        >
          <div className="text-[10px] font-bold tracking-wider text-kagaz-400 uppercase px-2 py-1 mb-1">
            Basic Blocks & Colors (Use ↑↓ Enter)
          </div>
          <div ref={slashListRef} className="max-h-60 overflow-y-auto space-y-0.5">
            {filteredSlashItems.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onClick={() => applySlashType(showSlashMenu.blockId, item.type as BlockType, item.extra)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected ? 'bg-kagaz-accent/35 text-white font-bold' : 'hover:bg-kagaz-accent/20 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-kagaz-800 text-kagaz-300">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-[10px] text-kagaz-400">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Wikilink [[ Auto-Suggest Dropdown */}
      {showWikilinkMenu && (
        <div
          className="fixed z-50 w-64 glass-panel rounded-xl shadow-2xl p-2 animate-fade-in border border-kagaz-accent/40 glow-border"
          style={{ top: Math.min(showWikilinkMenu.y, window.innerHeight - 200), left: showWikilinkMenu.x }}
        >
          <div className="text-[10px] font-bold tracking-wider text-kagaz-glow uppercase px-2 py-1 mb-1 flex items-center gap-1.5">
            <Link2 className="w-3 h-3" /> Link to Note (Use ↑↓ Enter)
          </div>
          <div ref={wikilinkListRef} className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredWikilinks.map((doc, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={doc.id}
                  onClick={() => insertWikilink(showWikilinkMenu.blockId, doc.title)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                    isSelected ? 'bg-kagaz-accent/40 text-white font-bold' : 'hover:bg-kagaz-accent/30 hover:text-white'
                  }`}
                >
                  <span>{doc.frontmatter.icon || '📄'}</span>
                  <span className="font-medium truncate">{doc.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
