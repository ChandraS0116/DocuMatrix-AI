import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Settings, LayoutDashboard, Workflow, Moon, Sun, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesignSystem } from '../design/ThemeProvider';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { themes, setThemeName, getMotionConfig } = useDesignSystem();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const actions = [
    { id: 'nav-dashboard', title: 'Go to Pipeline', icon: <LayoutDashboard size={16} />, onSelect: () => navigate('/') },
    { id: 'nav-workflows', title: 'Go to Workflows', icon: <Workflow size={16} />, onSelect: () => navigate('/workflows') },
    { id: 'nav-settings', title: 'Go to Settings', icon: <Settings size={16} />, onSelect: () => navigate('/settings') },
    { id: 'search-docs', title: 'Search Documents', icon: <Search size={16} />, onSelect: () => navigate('/search') },
    { id: 'demo-interview', title: 'Start Guided Demo', icon: <ArrowRight size={16} />, onSelect: () => navigate('/demo/interview') },
    ...themes.map(t => ({
      id: `theme-${t.name}`,
      title: `Switch Theme: ${t.name}`,
      icon: t.isDark ? <Moon size={16} /> : <Sun size={16} />,
      onSelect: () => setThemeName(t.name)
    }))
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filteredActions[selectedIndex];
      if (action) {
        action.onSelect();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{ 
          position: 'fixed', inset: 0, zIndex: 100, 
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          {...getMotionConfig({
            initial: { opacity: 0, scale: 0.95, y: -20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: -20 },
            transition: { duration: 0.15 }
          })}
          onClick={(e) => e.stopPropagation()}
          className="glass-panel"
          style={{ 
            width: '100%', maxWidth: '600px', 
            display: 'flex', flexDirection: 'column', 
            overflow: 'hidden', backgroundColor: 'var(--bg-panel)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-glass)',
            border: '1px solid var(--border-light)'
          }}
        >
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
            <input 
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              style={{
                flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
                fontSize: '1.1rem', outline: 'none'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>ESC</div>
          </div>

          {/* Results */}
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
            {filteredActions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No commands found for "{query}"
              </div>
            ) : (
              filteredActions.map((action, idx) => (
                <div 
                  key={action.id}
                  onClick={() => { action.onSelect(); setIsOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', 
                    cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                    backgroundColor: idx === selectedIndex ? 'var(--bg-panel-hover)' : 'transparent',
                    color: idx === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ marginRight: '1rem', color: idx === selectedIndex ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                    {action.icon}
                  </div>
                  <span>{action.title}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
