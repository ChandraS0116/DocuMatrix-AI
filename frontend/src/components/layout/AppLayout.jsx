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
  { id: 'pipeline', label: 'Documents & Extraction', route: '/', icon: <FileText size={18} /> },
  { id: 'search', label: 'Semantic Search', route: '/search', icon: <Search size={18} /> },
  { id: 'queue', label: 'Review Queue', route: '/queue', icon: <Inbox size={18} /> },
  { id: 'workflows', label: 'Workflows', route: '/workflows', icon: <Workflow size={18} /> },
  { id: 'monitor', label: 'Operations & Traces', route: '/monitor', icon: <Activity size={18} /> },
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
        height: '60px', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-panel)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', zIndex: 30,
        flexShrink: 0
      }}>
        
        {/* Left: Global Search / Command Palette Trigger */}
        <div style={{ flex: '0 1 300px' }}>
          <button 
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.45rem 0.85rem', background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-focus)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} />
              <span style={{ fontSize: '0.85rem' }}>Search or jump to...</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: 'var(--bg-panel)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
              <Command size={11} /> K
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
                  width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-panel-hover)' : 'transparent',
                  border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-panel-hover)';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/demo/interview" style={{ color: 'var(--accent-green)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, padding: '0.35rem 0.75rem', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-sm)', background: 'rgba(15, 157, 88, 0.06)' }}>
            Guided Demo
          </Link>
          
          {/* Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-deep)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => {
                setThemeName(theme.isDark ? 'Light' : 'Dark');
              }}
              title={`Theme: ${theme.isDark ? 'Dark' : 'Light'}. Click to toggle.`}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                padding: '4px 10px', position: 'relative', outline: 'none'
              }}
            >
              {theme.isDark ? <Moon size={14} color="var(--accent-blue)" /> : <Sun size={14} color="var(--accent-blue)" />}
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{theme.isDark ? 'Dark' : 'Light'}</span>
            </button>
          </div>
          
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative' }}>
            <Bell size={18} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-red)' }}></div>
          </button>
          
          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={16} color="#fff" />
            </div>
          </div>
        </div>
      </header>

      {/* 
        =========================================
        MAIN CONTENT (Clean Modern Layout)
        =========================================
      */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', backgroundColor: 'var(--bg-deep)' }}>
        
        {/* Full Screen Background: Core Visualization only on /spatial */}
        {location.pathname === '/spatial' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <CoreVisualization />
          </div>
        )}

        {/* Foreground Overlay: High-Productivity Clean Layout */}
        <main style={{ 
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'auto',
          overflowY: 'auto',
          padding: '1.25rem'
        }}>
          <div style={{ 
            padding: '1.75rem 2rem',
            width: '100%',
            maxWidth: '1500px',
            height: 'calc(100vh - 5.5rem)',
            pointerEvents: 'auto',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-glass)',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, y: 6 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.25 }}
              style={{ minHeight: 'calc(100% - 50px)', height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              {children}
            </motion.div>

            {/* Enterprise Legal & Compliance Footer */}
            <footer style={{ 
              marginTop: '2.5rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid var(--border-light)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '1rem', 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>DocuMatrix AI Enterprise v2.4</span>
                <span>|</span>
                <span>SOC2 Type II Certified</span>
                <span>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-green)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }} />
                  Systems Operational (99.99% SLA)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <Link to="/privacy-policy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
                <Link to="/terms-and-conditions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Terms & Conditions
                </Link>
                <Link to="/settings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Custom Domain & DNS
                </Link>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette />
    </div>
  );
}
