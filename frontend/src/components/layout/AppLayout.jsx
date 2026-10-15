import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, Command, Bell, User as UserIcon, Moon, Sun,
  LayoutDashboard, Activity, FileText, Workflow, Server, Settings,
  Network, CreditCard, Sparkles, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDesignSystem } from '../../design/ThemeProvider';
import CommandPalette from '../CommandPalette';
import CoreVisualization from '../core/CoreVisualization';

const TOP_NAV_ITEMS = [
  { id: 'pipeline', label: 'Pipeline', route: '/', icon: <LayoutDashboard size={18} /> },
  { id: 'monitor', label: 'Monitor', route: '/monitor', icon: <Activity size={18} /> },
  { id: 'queue', label: 'Review Queue', route: '/queue', icon: <Inbox size={18} /> },
  { id: 'search', label: 'Intelligence', route: '/search', icon: <Search size={18} /> },
  { id: 'graph', label: 'Knowledge Graph', route: '/graph', icon: <Network size={18} /> },
  { id: 'workflows', label: 'Workflows', route: '/workflows', icon: <Workflow size={18} /> },
  { id: 'prompts', label: 'Prompt Studio', route: '/prompts', icon: <Sparkles size={18} /> },
  { id: 'operations', label: 'Operations', route: '/operations', icon: <Server size={18} /> },
  { id: 'billing', label: 'Billing & Usage', route: '/billing', icon: <CreditCard size={18} /> },
  { id: 'settings', label: 'Settings', route: '/settings', icon: <Settings size={18} /> }
];

export default function AppLayout({ children }) {
  const { theme, setThemeName } = useDesignSystem();
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-deep)' }}>
      
      {/* 
        =========================================
        TOP APP BAR (Full Width)
        =========================================
      */}
      <header style={{ 
        height: '64px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-deep)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', zIndex: 30,
        flexShrink: 0
      }}>
        
        {/* Left: Global Search / Command Palette Trigger */}
        <div style={{ flex: '0 1 300px' }}>
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-focus)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} />
              <span style={{ fontSize: '0.9rem' }}>Search or jump to...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: 'var(--bg-deep)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
              <Command size={12} /> K
            </div>
          </button>
        </div>

        {/* Center: Main Navigation Icons */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {TOP_NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.route || (item.route !== '/' && location.pathname.startsWith(item.route));
            return (
              <Link
                key={item.id}
                to={item.route}
                title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(0, 102, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link to="/demo/interview" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, padding: '0.4rem 0.8rem', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-sm)' }}>
            Guided Demo
          </Link>
          
          {/* Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => setThemeName(theme.name === 'Midnight' ? 'Enterprise Navy' : 'Midnight')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                padding: '4px 12px', position: 'relative', outline: 'none'
              }}
            >
              <AnimatePresence mode="wait">
                {theme.name === 'Midnight' ? (
                  <motion.div
                    key="midnight"
                    initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Moon size={14} color="var(--accent-purple)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Cyber</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="navy"
                    initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sun size={14} color="var(--accent-blue)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Executive</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative' }}>
            <Bell size={20} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)' }}></div>
          </button>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={18} color="#fff" />
            </div>
          </div>
        </div>
      </header>

      {/* 
        =========================================
        MAIN CONTENT (Unified Spatial Layout)
        =========================================
      */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        
        {/* Full Screen Background: Core Visualization */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <CoreVisualization />
        </div>

        {/* Foreground Overlay: Interactive Dynamic Content */}
        <main style={{ 
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'auto',
          overflowY: 'auto',
          padding: '1rem'
        }}>
          <div style={{ 
            padding: '1.5rem 2rem',
            width: '96%',
            maxWidth: '1480px',
            height: 'calc(100vh - 6rem)',
            pointerEvents: 'auto',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(16px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, y: 6 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.25 }}
              style={{ minHeight: '100%' }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette />
    </div>
  );
}
