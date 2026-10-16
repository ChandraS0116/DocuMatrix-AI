import React, { useState, useEffect, useRef } from 'react';
import { Network, Search, Database, FileText, Briefcase, Zap, Cpu, RefreshCw, ZoomIn, ZoomOut, Filter, Info } from 'lucide-react';
import { useTheme } from '../design/ThemeProvider';

const INITIAL_NODES = [
  { id: 'Apex Global Industries', type: 'company', group: 1, x: 400, y: 250, radius: 28, color: '#065fd4', vx: 0, vy: 0 },
  { id: 'Global Logistics Ltd', type: 'vendor', group: 2, x: 260, y: 160, radius: 22, color: '#0284c7', vx: 0, vy: 0 },
  { id: 'Acme Industrial Corp', type: 'vendor', group: 2, x: 550, y: 170, radius: 22, color: '#0284c7', vx: 0, vy: 0 },
  { id: 'Northwind Health Inc', type: 'client', group: 2, x: 320, y: 380, radius: 22, color: '#059669', vx: 0, vy: 0 },
  { id: 'Invoice: INV-1004 ($45,230)', type: 'invoice', group: 3, x: 650, y: 260, radius: 18, color: '#d97706', vx: 0, vy: 0 },
  { id: 'Invoice: INV-1005 ($12,400)', type: 'invoice', group: 3, x: 600, y: 90, radius: 18, color: '#d97706', vx: 0, vy: 0 },
  { id: 'Contract: MSA-2026-v2', type: 'contract', group: 4, x: 160, y: 110, radius: 20, color: '#475569', vx: 0, vy: 0 },
  { id: 'HIPAA Compliance Audit 2026', type: 'compliance', group: 4, x: 200, y: 440, radius: 20, color: '#475569', vx: 0, vy: 0 },
  { id: 'Stripe Settlement #9021', type: 'payment', group: 5, x: 740, y: 350, radius: 16, color: '#2563eb', vx: 0, vy: 0 }
];

const INITIAL_LINKS = [
  { source: 'Apex Global Industries', target: 'Global Logistics Ltd', label: 'Primary Carrier' },
  { source: 'Apex Global Industries', target: 'Acme Industrial Corp', label: 'Equipment Supplier' },
  { source: 'Apex Global Industries', target: 'Northwind Health Inc', label: 'Enterprise Account' },
  { source: 'Acme Industrial Corp', target: 'Invoice: INV-1004 ($45,230)', label: 'Billed' },
  { source: 'Acme Industrial Corp', target: 'Invoice: INV-1005 ($12,400)', label: 'Billed' },
  { source: 'Global Logistics Ltd', target: 'Contract: MSA-2026-v2', label: 'Master Agreement' },
  { source: 'Northwind Health Inc', target: 'HIPAA Compliance Audit 2026', label: 'Audited' },
  { source: 'Invoice: INV-1004 ($45,230)', target: 'Stripe Settlement #9021', label: 'Cleared via Stripe' }
];

export default function KnowledgeGraph() {
  const canvasRef = useRef(null);
  const { currentTheme } = useTheme();
  const isDark = Boolean(currentTheme?.isDark);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [links] = useState(INITIAL_LINKS);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isSimulating, setIsSimulating] = useState(true);

  // Physics simulation loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const tick = () => {
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            const force = (200 - dist) / dist * 0.04;
            nodes[i].x -= dx * force;
            nodes[i].y -= dy * force;
            nodes[j].x += dx * force;
            nodes[j].y += dy * force;
          }
        }
      }

      // Spring force on links
      links.forEach(l => {
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 140) * 0.005;
          s.x += dx * force;
          s.y += dy * force;
          t.x -= dx * force;
          t.y -= dy * force;
        }
      });

      // Clear & draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw links
      ctx.lineWidth = 1.5;
      links.forEach(l => {
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);
        if (s && t) {
          ctx.strokeStyle = selectedNode && (selectedNode.id === s.id || selectedNode.id === t.id) 
            ? (isDark ? '#38bdf8' : '#065fd4') 
            : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)');
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();

          // Link label
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2;
          ctx.font = '10px Inter, sans-serif';
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : '#606060';
          ctx.fillText(l.label, mx + 4, my - 4);
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const matchesSearch = !searchQuery || n.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'ALL' || n.type.toUpperCase() === filterType;
        const opacity = (matchesSearch && matchesFilter) ? 1.0 : 0.25;

        // Outer glow
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color}22`;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = selectedNode?.id === n.id ? 25 : 8;
        ctx.fill();
        ctx.strokeStyle = isDark ? '#ffffff' : '#f0f0f0';
        ctx.lineWidth = selectedNode?.id === n.id ? 3 : 1;
        ctx.stroke();
        ctx.restore();

        // Node title
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#0f0f0f';
        ctx.textAlign = 'center';
        ctx.fillText(n.id, n.x, n.y + n.radius + 16);
        ctx.restore();
      });

      if (isSimulating) {
        animId = requestAnimationFrame(tick);
      }
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [nodes, links, selectedNode, searchQuery, filterType, isSimulating, isDark]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const hit = nodes.find(n => {
      const dx = n.x - clickX;
      const dy = n.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 5;
    });

    setSelectedNode(hit || null);
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Top Header & Controls */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Network color="var(--accent-blue)" size={24} /> Entity Knowledge Graph
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
            Interconnected entity lineage generated from OCR, BERT NER, and Semantic Indexing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', padding: '0.35rem 0.75rem' }}>
            <Search size={14} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
            <input
              type="text"
              placeholder="Filter entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '160px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['ALL', 'VENDOR', 'INVOICE', 'CONTRACT'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  border: filterType === t ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                  background: filterType === t ? 'rgba(0, 102, 255, 0.2)' : 'var(--bg-deep)',
                  color: filterType === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-deep)',
              color: isSimulating ? 'var(--accent-green)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <RefreshCw size={12} /> {isSimulating ? 'Physics Active' : 'Physics Paused'}
          </button>
        </div>
      </div>

      {/* Main Canvas & Detail Drawer */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-deep)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={650}
          onClick={handleCanvasClick}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
        />

        {/* Selected Entity Inspector Card */}
        {selectedNode && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              right: '1.5rem',
              width: '320px',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${selectedNode.color}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6)`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge" style={{ background: `${selectedNode.color}33`, color: selectedNode.color, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {selectedNode.type}
              </span>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{selectedNode.id}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
              Extracted via BERT Named Entity Recognition. Linked to {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length} related entity graph edges.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Graph Cluster:</span>
                <span style={{ fontWeight: 600 }}>Group #{selectedNode.group}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Lineage Confidence:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>99.4%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
