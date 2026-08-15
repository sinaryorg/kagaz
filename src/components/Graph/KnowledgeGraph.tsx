import React, { useEffect, useRef, useState } from 'react';
import { KagazDocument, GraphNode, GraphLink } from '../../types/kagaz';
import { ZoomIn, ZoomOut, RefreshCw, Sparkles } from 'lucide-react';

interface KnowledgeGraphProps {
  documents: KagazDocument[];
  activeDocumentId: string;
  onNavigateToDocument: (docId: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  documents,
  activeDocumentId,
  onNavigateToDocument,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // ResizeObserver for 100% responsive canvas width and height
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 900;
    const height = canvas ? canvas.height : 650;

    const nodes: GraphNode[] = documents.map((doc, idx) => {
      const angle = (idx / documents.length) * 2 * Math.PI;
      const radius = 180 + Math.random() * 40;
      return {
        id: doc.id,
        title: doc.title,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: doc.id === activeDocumentId ? 14 : 10 + (doc.backlinks.length + doc.outgoingLinks.length) * 1.5,
        color: doc.id === activeDocumentId ? '#818cf8' : '#38bdf8',
        linkCount: doc.backlinks.length + doc.outgoingLinks.length,
      };
    });

    const links: GraphLink[] = [];
    documents.forEach(sourceDoc => {
      sourceDoc.outgoingLinks.forEach(targetTitle => {
        const targetDoc = documents.find(
          d => d.title.toLowerCase() === targetTitle.toLowerCase()
        );
        if (targetDoc && targetDoc.id !== sourceDoc.id) {
          links.push({ source: sourceDoc.id, target: targetDoc.id });
        }
      });
    });

    nodesRef.current = nodes;
    linksRef.current = links;

    // Physics Loop
    const simulate = () => {
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 900;
      const h = canvas ? canvas.height : 650;
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Force towards center
      nodes.forEach(node => {
        if (node.id === draggedNodeId) return; // Skip physics for mouse dragged node
        node.vx += (w / 2 - node.x) * 0.0005;
        node.vy += (h / 2 - node.y) * 0.0005;
      });

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.15;
            if (nodes[i].id !== draggedNodeId) {
              nodes[i].vx -= dx * force * 0.05;
              nodes[i].vy -= dy * force * 0.05;
            }
            if (nodes[j].id !== draggedNodeId) {
              nodes[j].vx += dx * force * 0.05;
              nodes[j].vy += dy * force * 0.05;
            }
          }
        }
      }

      // Link attraction
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.01;
          if (sourceNode.id !== draggedNodeId) {
            sourceNode.vx += (dx / dist) * force;
            sourceNode.vy += (dy / dist) * force;
          }
          if (targetNode.id !== draggedNodeId) {
            targetNode.vx -= (dx / dist) * force;
            targetNode.vy -= (dy / dist) * force;
          }
        }
      });

      // Apply velocities with damping
      nodes.forEach(node => {
        if (node.id === draggedNodeId) return;
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.88;
        node.vy *= 0.88;
      });

      renderCanvas();
      animFrameRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [documents, activeDocumentId, draggedNodeId]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Pan & Zoom
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const nodes = nodesRef.current;
    const links = linksRef.current;

    // Draw Links
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const isActive = node.id === activeDocumentId;
      const isHovered = hoveredNode?.id === node.id;
      const isDragged = draggedNodeId === node.id;

      if (isActive || isHovered || isDragged) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? 'rgba(99, 102, 241, 0.3)' : 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#818cf8' : isHovered || isDragged ? '#38bdf8' : '#475569';
      ctx.fill();
      ctx.strokeStyle = isActive ? '#a5b4fc' : '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${isActive ? '700 13px' : '600 12px'} Outfit, sans-serif`;
      ctx.fillStyle = isActive ? '#ffffff' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x, node.y + node.radius + 16);
    });

    ctx.restore();
  };

  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - canvas.width / 2 - offset.x) / scale + canvas.width / 2;
    const mouseY = (e.clientY - rect.top - canvas.height / 2 - offset.y) / scale + canvas.height / 2;
    return { x: mouseX, y: mouseY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);
    const clickedNode = nodesRef.current.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 4;
    });

    if (clickedNode) {
      setDraggedNodeId(clickedNode.id);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasMousePos(e);

    if (draggedNodeId) {
      const node = nodesRef.current.find(n => n.id === draggedNodeId);
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    const hovered = nodesRef.current.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 4;
    });

    setHoveredNode(hovered || null);
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode && !isDraggingCanvas) {
      onNavigateToDocument(hoveredNode.id);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] flex flex-col bg-kagaz-950 rounded-2xl border border-kagaz-800 overflow-hidden shadow-2xl"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 glass-panel px-4 py-2 rounded-xl">
        <Sparkles className="w-4 h-4 text-kagaz-glow" />
        <span className="text-xs font-bold uppercase tracking-wider text-kagaz-100">
          Knowledge Graph View
        </span>
        <span className="text-xs text-kagaz-400 pl-2 border-l border-kagaz-700">
          {documents.length} Notes • {linksRef.current.length} Connections
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 glass-panel p-1.5 rounded-xl">
        <button
          onClick={() => setScale(s => Math.min(s + 0.15, 2.5))}
          className="p-2 hover:bg-kagaz-800 rounded-lg text-kagaz-300 hover:text-white cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale(s => Math.max(s - 0.15, 0.4))}
          className="p-2 hover:bg-kagaz-800 rounded-lg text-kagaz-300 hover:text-white cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-2 hover:bg-kagaz-800 rounded-lg text-kagaz-300 hover:text-white cursor-pointer"
          title="Reset View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-6 left-6 z-20 glass-panel p-3.5 rounded-xl border border-kagaz-accent/40 animate-fade-in shadow-2xl max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-kagaz-glow" />
            <span className="font-bold text-sm text-white">{hoveredNode.title}</span>
          </div>
          <p className="text-xs text-kagaz-400">
            Click node to navigate directly into this note. Drag node to position.
          </p>
          <div className="mt-2 text-xs font-semibold text-kagaz-accent">
            {hoveredNode.linkCount} Linked References
          </div>
        </div>
      )}
    </div>
  );
};
