import { Block, BlockType, FrontMatter } from '../types/kagaz';

/**
 * Parses raw markdown text into FrontMatter and Blocks with STABLE IDs
 */
export function parseMarkdown(rawContent: string, defaultTitle: string = 'Untitled Note'): {
  frontmatter: FrontMatter;
  blocks: Block[];
  outgoingLinks: string[];
} {
  let frontmatter: FrontMatter = {
    title: defaultTitle,
    status: 'In Progress',
    priority: 'Medium',
    tags: [],
    createdDate: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    icon: '📝',
  };

  let markdownBody = rawContent;

  // 1. Extract YAML Frontmatter if present
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const match = rawContent.match(frontmatterRegex);

  if (match) {
    const yamlBlock = match[1];
    markdownBody = rawContent.slice(match[0].length);

    yamlBlock.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (!key || valueParts.length === 0) return;

      const trimmedKey = key.trim();
      const val = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');

      if (trimmedKey === 'title') frontmatter.title = val.replace(/^["']|["']$/g, '');
      else if (trimmedKey === 'status') frontmatter.status = val.replace(/^["']|["']$/g, '') as any;
      else if (trimmedKey === 'priority') frontmatter.priority = val.replace(/^["']|["']$/g, '') as any;
      else if (trimmedKey === 'icon') frontmatter.icon = val.replace(/^["']|["']$/g, '');
      else if (trimmedKey === 'folder') frontmatter.folder = val.replace(/^["']|["']$/g, '');
      else if (trimmedKey === 'parentNoteId') frontmatter.parentNoteId = val.replace(/^["']|["']$/g, '');
      else if (trimmedKey === 'createdDate') frontmatter.createdDate = val.replace(/^["']|["']$/g, '');
      else if (trimmedKey === 'order') frontmatter.order = parseInt(val, 10);
      else if (trimmedKey === 'coverImage') frontmatter.coverImage = val.replace(/^["']|["']$/g, '');
      else if (trimmedKey === 'coverStyle') frontmatter.coverStyle = val.replace(/^["']|["']$/g, '') as any;
      else if (trimmedKey === 'coverPosition') frontmatter.coverPosition = parseFloat(val);
      else if (trimmedKey === 'tags') {
        const cleanVal = val.replace(/^\[|\]$/g, '');
        const tagsClean = cleanVal
          .split(',')
          .map(t => t.trim().replace(/['"]/g, '').replace(/^#/, ''));
        frontmatter.tags = tagsClean.filter(Boolean);
      }
    });
  }

  // 2. Extract [[Wikilinks]]
  const wikilinkRegex = /\[\[(.*?)\]\]/g;
  const outgoingLinks: string[] = [];
  let linkMatch;
  while ((linkMatch = wikilinkRegex.exec(markdownBody)) !== null) {
    const linkText = linkMatch[1].split('|')[0].trim();
    if (linkText && !outgoingLinks.includes(linkText)) {
      outgoingLinks.push(linkText);
    }
  }

  // 3. Convert lines to Blocks with STABLE IDs based on line index
  const lines = markdownBody.split(/\r?\n/);
  const blocks: Block[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed && index > 0 && lines[index - 1].trim() === '') {
      return;
    }

    const id = `blk-${index}`;

    // Regex matchers for multimedia elements
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)(?:\s+["'](.*?)["'])?\)$/);
    const videoMatch = trimmed.match(/^<video src=["'](.*?)["'](?:\s+width=["'](.*?)["'])?(?:\s+align=["'](.*?)["'])?.*?>/i);
    const audioMatch = trimmed.match(/^<audio src=["'](.*?)["'](?:\s+width=["'](.*?)["'])?.*?>/i);
    const bookmarkLinkMatch = trimmed.match(/^\[(.*?)\]\((.*?)\)$/);

    if (imgMatch) {
      const extraMeta = imgMatch[3] || '';
      const [w, a] = extraMeta.split('|');
      blocks.push({ 
        id, 
        type: 'image', 
        content: imgMatch[1] || '', 
        url: imgMatch[2] || '',
        width: w || '100%',
        align: (a as any) || 'center',
      });
    } else if (videoMatch) {
      blocks.push({ 
        id, 
        type: 'video', 
        content: 'Video Track', 
        url: videoMatch[1] || '',
        width: videoMatch[2] || '100%',
        align: (videoMatch[3] as any) || 'center',
      });
    } else if (audioMatch) {
      blocks.push({ 
        id, 
        type: 'audio', 
        content: 'Audio Track', 
        url: audioMatch[1] || '',
        width: audioMatch[2] || '100%',
      });
    } else if (bookmarkLinkMatch && !trimmed.startsWith('!')) {
      blocks.push({ id, type: 'link', content: bookmarkLinkMatch[1] || '', url: bookmarkLinkMatch[2] || '' });
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ id, type: 'heading-1', content: trimmed.substring(2) });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id, type: 'heading-2', content: trimmed.substring(3) });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ id, type: 'heading-3', content: trimmed.substring(4) });
    } else if (trimmed.startsWith('> [!INFO]') || trimmed.startsWith('> [!NOTE]')) {
      blocks.push({ id, type: 'callout', content: trimmed.replace(/^> \[!.*?\]\s*/, ''), calloutType: 'info', calloutIcon: '💡' });
    } else if (trimmed.startsWith('> [!WARNING]')) {
      blocks.push({ id, type: 'callout', content: trimmed.replace(/^> \[!WARNING\]\s*/, ''), calloutType: 'warning', calloutIcon: '⚠️' });
    } else if (trimmed.startsWith('> [!TIP]') || trimmed.startsWith('> [!SUCCESS]')) {
      blocks.push({ id, type: 'callout', content: trimmed.replace(/^> \[!.*?\]\s*/, ''), calloutType: 'success', calloutIcon: '✨' });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ id, type: 'quote', content: trimmed.substring(2) });
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      blocks.push({
        id,
        type: 'todo',
        checked: trimmed.startsWith('- [x] '),
        content: trimmed.substring(6),
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ id, type: 'bullet', content: trimmed.substring(2) });
    } else if (trimmed.startsWith('```')) {
      const lang = trimmed.replace('```', '').trim();
      blocks.push({ id, type: 'code', content: '', language: lang || 'typescript' });
    } else if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
      blocks.push({ id, type: 'math', content: trimmed.replace(/\$\$/g, '').trim() });
    } else if (trimmed === '---') {
      blocks.push({ id, type: 'divider', content: '' });
    } else {
      blocks.push({ id, type: 'paragraph', content: line });
    }
  });

  if (blocks.length === 0) {
    blocks.push({ id: `blk-0`, type: 'paragraph', content: '' });
  }

  return { frontmatter, blocks, outgoingLinks };
}

/**
 * Extracts all [[Wikilinks]] from block content
 */
export function extractOutgoingLinksFromBlocks(blocks: Block[]): string[] {
  const wikilinkRegex = /\[\[(.*?)\]\]/g;
  const outgoingLinks: string[] = [];

  blocks.forEach(block => {
    let linkMatch;
    wikilinkRegex.lastIndex = 0;
    while ((linkMatch = wikilinkRegex.exec(block.content)) !== null) {
      const linkText = linkMatch[1].split('|')[0].trim();
      if (linkText && !outgoingLinks.includes(linkText)) {
        outgoingLinks.push(linkText);
      }
    }
  });

  return outgoingLinks;
}

/**
 * Serializes Blocks and FrontMatter back to raw Markdown string
 */
export function serializeToMarkdown(frontmatter: FrontMatter, blocks: Block[]): string {
  const cleanTags = frontmatter.tags.map(t => t.replace(/['"]/g, ''));
  const yamlHeader = [
    '---',
    `title: "${frontmatter.title.replace(/['"]/g, '')}"`,
    `icon: "${(frontmatter.icon || '📝').replace(/['"]/g, '')}"`,
    ...(frontmatter.folder ? [`folder: "${frontmatter.folder}"`] : []),
    ...(frontmatter.parentNoteId ? [`parentNoteId: "${frontmatter.parentNoteId}"`] : []),
    `status: "${frontmatter.status}"`,
    `priority: "${frontmatter.priority}"`,
    `tags: [${cleanTags.map(t => `"${t}"`).join(', ')}]`,
    ...(frontmatter.order !== undefined ? [`order: ${frontmatter.order}`] : []),
    ...(frontmatter.coverImage ? [`coverImage: "${frontmatter.coverImage}"`] : []),
    ...(frontmatter.coverStyle ? [`coverStyle: "${frontmatter.coverStyle}"`] : []),
    ...(frontmatter.coverPosition !== undefined ? [`coverPosition: ${frontmatter.coverPosition}`] : []),
    `createdDate: "${frontmatter.createdDate}"`,
    `lastModified: "${new Date().toISOString().split('T')[0]}"`,
    '---',
    '',
  ].join('\n');

  const bodyContent = blocks
    .map(block => {
      switch (block.type) {
        case 'image':
          return `![${block.content || ''}](${block.url || ''} "${block.width || '100%'}|${block.align || 'center'}")`;
        case 'video':
          return `<video src="${block.url || ''}" width="${block.width || '100%'}" align="${block.align || 'center'}" controls></video>`;
        case 'audio':
          return `<audio src="${block.url || ''}" width="${block.width || '100%'}" controls></audio>`;
        case 'link':
          return `[${block.content || 'Link'}](${block.url || ''})`;
        case 'heading-1':
          return `# ${block.content}`;
        case 'heading-2':
          return `## ${block.content}`;
        case 'heading-3':
          return `### ${block.content}`;
        case 'callout':
          return `> [!${(block.calloutType || 'info').toUpperCase()}]\n> ${block.content}`;
        case 'quote':
          return `> ${block.content}`;
        case 'todo':
          return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
        case 'bullet':
          return `- ${block.content}`;
        case 'code':
          return `\`\`\`${block.language || ''}\n${block.content}\n\`\`\``;
        case 'math':
          return `$$ ${block.content} $$`;
        case 'divider':
          return '---';
        case 'paragraph':
        default:
          return block.content;
      }
    })
    .join('\n');

  return `${yamlHeader}\n${bodyContent}`;
}
