import React, { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Panel,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDesignSystem } from '../design/ThemeProvider';
import { Play, Save, Settings2, FileCode2, Copy, Trash2, Undo, Redo, LayoutTemplate } from 'lucide-react';
import CustomNode from '../components/workflow/CustomNode';
import NodeInspector from '../components/workflow/NodeInspector';

// Define custom node types
const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  { id: 'upload', type: 'custom', position: { x: 50, y: 150 }, data: { label: 'Document Upload', type: 'upload', status: 'success' } },
  { id: 'ocr', type: 'custom', position: { x: 300, y: 150 }, data: { label: 'OCR Extraction', type: 'ai', status: 'success' } },
  { id: 'classifier', type: 'custom', position: { x: 550, y: 150 }, data: { label: 'Classification', type: 'ai', status: 'pending' } },
  
  // Subflow / Group Node example
  { id: 'group-1', type: 'group', position: { x: 750, y: 0 }, style: { width: 250, height: 350, backgroundColor: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border-light)', borderRadius: '8px' }, data: { label: 'Data Processing' } },
  
  { id: 'risk', type: 'custom', position: { x: 20, y: 50 }, parentNode: 'group-1', extent: 'parent', data: { label: 'Risk Analysis', type: 'ai', status: 'pending' } },
  { id: 'extract', type: 'custom', position: { x: 20, y: 150 }, parentNode: 'group-1', extent: 'parent', data: { label: 'Entity Extraction', type: 'ai', status: 'pending' } },
  
  { id: 'review', type: 'custom', position: { x: 1050, y: 150 }, data: { label: 'Human Review', type: 'human', status: 'pending' } },
];

const initialEdges = [
  { id: 'e1-2', source: 'upload', target: 'ocr', animated: true },
  { id: 'e2-3', source: 'ocr', target: 'classifier', animated: true },
  { id: 'e3-4', source: 'classifier', target: 'risk' },
  { id: 'e3-5', source: 'classifier', target: 'extract' },
  { id: 'e4-6', source: 'risk', target: 'review' },
  { id: 'e5-6', source: 'extract', target: 'review' },
];

function WorkflowDesignerInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { theme } = useDesignSystem();
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Filter nodes based on search
  const visibleNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.map(node => {
      if (node.type === 'group') return node;
      const matches = node.data.label.toLowerCase().includes(searchQuery.toLowerCase());
      return { ...node, style: { ...node.style, opacity: matches ? 1 : 0.2 } };
    });
  }, [nodes, searchQuery]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onSelectionChange = useCallback(({ nodes }) => {
    if (nodes.length === 1) {
      setSelectedNode(nodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const validateWorkflow = () => {
    const errors = [];
    const connectedNodeIds = new Set();
    
    edges.forEach(e => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });

    nodes.forEach(n => {
      if (n.type !== 'group' && n.id !== 'upload' && !connectedNodeIds.has(n.id)) {
        errors.push(`Node "${n.data.label}" is unconnected.`);
      }
    });

    setValidationErrors(errors);
    if (errors.length === 0) {
      alert("Workflow is valid!");
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', margin: '-2rem' }}>
      
      {/* Top Toolbar */}
      <div style={{ 
        height: '56px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Invoice Processing Pipeline</div>
          <div className="badge" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)' }}>v1.4.2</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Filter nodes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-deep)', color: 'var(--text-primary)', width: '150px' }}
          />
          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          
          <button className="btn-secondary" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <LayoutTemplate size={16} /> Templates
          </button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          <button className="btn-secondary" style={{ padding: '0.5rem' }} title="Undo (Ctrl+Z)"><Undo size={16} /></button>
          <button className="btn-secondary" style={{ padding: '0.5rem' }} title="Redo (Ctrl+Y)"><Redo size={16} /></button>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', margin: '0 0.5rem' }}></div>
          <button onClick={validateWorkflow} className="btn-secondary" style={{ padding: '0.5rem', position: 'relative' }} title="Validate Workflow">
            <FileCode2 size={16} />
            {validationErrors.length > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--accent-red)', color: 'white', fontSize: '0.6rem', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {validationErrors.length}
              </span>
            )}
          </button>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Save size={16} /> Save Workflow
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* React Flow Canvas */}
        <div style={{ flex: 1, height: '100%' }}>
          <ReactFlow
            nodes={visibleNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onSelectionChange={onSelectionChange}
            fitView
            colorMode={theme.isDark ? 'dark' : 'light'}
            style={{ backgroundColor: 'var(--bg-deep)' }}
          >
            <Background color="var(--border-light)" gap={16} size={1} />
            <Controls style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }} />
            <MiniMap 
              nodeColor={(n) => {
                if (n.data?.type === 'upload') return 'var(--accent-blue)';
                if (n.data?.type === 'ai') return 'var(--accent-purple)';
                if (n.data?.type === 'human') return 'var(--accent-green)';
                return 'var(--text-muted)';
              }}
              style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}
              maskColor={theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
            />
            
            <Panel position="top-left" style={{ background: 'var(--bg-panel)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nodes</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-blue)' }} title="Upload Node"></div>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-purple)' }} title="AI Node"></div>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--accent-green)' }} title="Human Review"></div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node Inspector Sidebar */}
        {selectedNode && (
          <div style={{ 
            width: '320px', borderLeft: '1px solid var(--border-light)', background: 'var(--bg-panel)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            <NodeInspector node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkflowDesigner() {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerInner />
    </ReactFlowProvider>
  );
}
