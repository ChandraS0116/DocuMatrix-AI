import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Columns, Rows, Square, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import ReviewQueue from './ReviewQueue';

export default function WorkspaceManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Tabs state
  const [tabs, setTabs] = useState(id ? [{ id, title: `DOC-${id.substring(0,6)}` }] : []);
  const [activeTabId, setActiveTabId] = useState(id);
  const [layoutMode, setLayoutMode] = useState('single'); // single, split-v, split-h

  useEffect(() => {
    if (id && !tabs.find(t => t.id === id)) {
      setTabs(prev => [...prev, { id, title: `DOC-${id.substring(0,6)}` }]);
      setActiveTabId(id);
    }
  }, [id]);

  const closeTab = (e, tabId) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (newTabs.length === 0) {
      navigate('/');
    } else if (activeTabId === tabId) {
      const nextTab = newTabs[newTabs.length - 1];
      setActiveTabId(nextTab.id);
      navigate(`/review/${nextTab.id}`);
    }
  };

  const selectTab = (tabId) => {
    setActiveTabId(tabId);
    navigate(`/review/${tabId}`);
  };

  // For split views, we need to know which documents to show
  // We'll just take the active tab and the one next to it (if exists)
  const activeIndex = tabs.findIndex(t => t.id === activeTabId);
  const doc1 = tabs[activeIndex]?.id;
  const doc2 = tabs.length > 1 ? tabs[(activeIndex + 1) % tabs.length]?.id : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Workspace Tabs & Controls */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-deep)',
        padding: '0 1rem', height: '48px', flexShrink: 0
      }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '4px', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', cursor: 'pointer',
                backgroundColor: activeTabId === tab.id ? 'var(--bg-panel)' : 'transparent',
                borderTop: activeTabId === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                borderLeft: '1px solid var(--border-light)',
                borderRight: '1px solid var(--border-light)',
                borderTopLeftRadius: 'var(--radius-sm)',
                borderTopRightRadius: 'var(--radius-sm)',
                color: activeTabId === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                height: activeTabId === tab.id ? '100%' : 'calc(100% - 4px)',
                transition: 'background-color 0.2s',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.title}
              </span>
              <button 
                onClick={(e) => closeTab(e, tab.id)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} />
          </button>
        </div>

        {/* Layout Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Mode</div>
          <button 
            onClick={() => setLayoutMode('single')}
            style={{ background: layoutMode === 'single' ? 'var(--bg-panel)' : 'transparent', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '4px', color: layoutMode === 'single' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Square size={16} />
          </button>
          <button 
            onClick={() => setLayoutMode('split-v')}
            disabled={tabs.length < 2}
            style={{ background: layoutMode === 'split-v' ? 'var(--bg-panel)' : 'transparent', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '4px', color: layoutMode === 'split-v' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: tabs.length < 2 ? 'not-allowed' : 'pointer', opacity: tabs.length < 2 ? 0.5 : 1 }}
          >
            <Columns size={16} />
          </button>
          <button 
            onClick={() => setLayoutMode('split-h')}
            disabled={tabs.length < 2}
            style={{ background: layoutMode === 'split-h' ? 'var(--bg-panel)' : 'transparent', border: '1px solid var(--border-light)', borderRadius: '4px', padding: '4px', color: layoutMode === 'split-h' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: tabs.length < 2 ? 'not-allowed' : 'pointer', opacity: tabs.length < 2 ? 0.5 : 1 }}
          >
            <Rows size={16} />
          </button>
        </div>
      </div>

      {/* Render Document(s) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: layoutMode === 'split-h' ? 'column' : 'row', gap: layoutMode !== 'single' ? '1rem' : '0', padding: layoutMode !== 'single' ? '1rem' : '0', overflow: 'hidden' }}>
        
        {layoutMode === 'single' ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
             {doc1 && <ReviewQueue documentId={doc1} isMultiWindow={true} />}
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              {doc1 && <ReviewQueue documentId={doc1} isMultiWindow={true} />}
            </div>
            <div style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              {doc2 && <ReviewQueue documentId={doc2} isMultiWindow={true} />}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
