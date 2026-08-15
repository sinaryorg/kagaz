import { KagazDocument } from '../types/kagaz';
import { parseMarkdown } from './markdownEngine';

export const INITIAL_DEMO_VAULT: Record<string, string> = {
  'welcome.md': `---
title: "Welcome to Kagaz"
icon: "⚡"
folder: "Getting Started"
status: "In Progress"
priority: "High"
tags: ["guide", "getting-started", "features"]
createdDate: "2026-08-06"
lastModified: "2026-08-06"
---

# Welcome to Kagaz

**Kagaz** is your local-first, supercharged workspace combining markdown file ownership, bi-directional linking, and knowledge graph with block-based editing, slash commands (\`/\`), and rich database views.

> Press \`/\` anywhere in the block editor to invoke the block creation menu! Try typing \`[[Project Architecture]]\` to create a live bi-directional link.

## 🚀 Key Hybrid Features

- **Block-Based Slash Menu (\`/\`):** Callout cards, code snippets, math formulas, toggles, and custom color options.
- **Kagaz Bi-directional Links:** Connect thoughts with [[Project Architecture]] and [[Knowledge Base]].
- **Interactive Knowledge Graph:** Explore visual graph node connections across your entire vault.
- **Kagaz Database Views:** Click **Table** or **Kanban** tab above to filter notes by Status, Priority, and Tags.
`,

  'project-architecture.md': `---
title: "Project Architecture"
icon: "🏗️"
folder: "Getting Started/Projects & Dev"
status: "In Progress"
priority: "High"
tags: ["architecture", "tech-stack", "electron"]
createdDate: "2026-08-06"
lastModified: "2026-08-06"
---

# Project Architecture

Kagaz is engineered for instant responsiveness, privacy, and full desktop offline capability.

Check [[Welcome to Kagaz]] to return to the starter dashboard!

## 📦 Tech Stack Components

- **Desktop Framework:** Electron + Node.js IPC Bridge
- **UI Engine:** React + Vite + TypeScript
- **Styling:** Tailwind CSS + Vanilla HSL Design Tokens
- **Graph Visualization:** React-Force-Graph-2D
`,

  'knowledge-base.md': `---
title: "Knowledge Base"
icon: "🧠"
folder: "Getting Started/Knowledge Base"
status: "Done"
priority: "Medium"
tags: ["documentation", "wiki"]
createdDate: "2026-08-06"
lastModified: "2026-08-06"
---

# Knowledge Base

In Kagaz, every note is connected via bi-directional links like [[Welcome to Kagaz]] and [[Project Architecture]].

- [x] Local-first vault indexing
- [x] Fast full-text search
- [x] Kagaz database property filters
- [x] Interactive dark glass popovers
`,

  'product-roadmap.md': `---
title: "Product Roadmap Q3/Q4"
icon: "🎯"
folder: "Getting Started/Projects & Dev"
status: "Backlog"
priority: "Urgent"
tags: ["roadmap", "planning"]
createdDate: "2026-08-06"
lastModified: "2026-08-06"
---

# Product Roadmap Q3/Q4

Referenced by [[Welcome to Kagaz]] and [[Project Architecture]].

## 📌 Features Completed

- [x] Native Electron desktop app integration
- [x] Custom page width switcher (Narrow, Normal, Wide, Full Width)
- [x] Color highlights & text colors via palette and slash menu
- [x] Interactive status and priority popovers
- [x] Build Kagaz Knowledge Graph
- [x] Build Kagaz Table and Kanban views
`
};

export function indexVault(vaultMap: Record<string, string>): KagazDocument[] {
  const documents: KagazDocument[] = [];

  // Step 1: Parse markdown files into documents
  Object.entries(vaultMap).forEach(([filePath, rawContent]) => {
    const { frontmatter, blocks, outgoingLinks } = parseMarkdown(rawContent, filePath.replace(/\.md$/, ''));
    let folderPath = frontmatter.folder || 'General Notes';
    if (folderPath === 'Knowledge Base') folderPath = 'Getting Started/Knowledge Base';
    if (folderPath === 'Projects & Dev') folderPath = 'Getting Started/Projects & Dev';

    const doc: KagazDocument = {
      id: filePath,
      path: filePath,
      title: frontmatter.title || filePath.replace(/\.md$/, ''),
      frontmatter: {
        ...frontmatter,
        folder: folderPath,
      },
      blocks,
      rawMarkdown: rawContent,
      outgoingLinks,
      folder: folderPath,
      parentNoteId: frontmatter.parentNoteId,
      backlinks: [],
    };
    documents.push(doc);
  });

  // Step 2: Build bi-directional backlinks
  documents.forEach(doc => {
    const incomingBacklinks = documents
      .filter(otherDoc => otherDoc.id !== doc.id && otherDoc.outgoingLinks.includes(doc.title))
      .map(otherDoc => ({
        sourceDocId: otherDoc.id,
        sourceTitle: otherDoc.title,
        snippet: otherDoc.blocks.find(b => b.content.includes(`[[${doc.title}]]`))?.content || '',
      }));

    doc.backlinks = incomingBacklinks;
  });

  return documents;
}
