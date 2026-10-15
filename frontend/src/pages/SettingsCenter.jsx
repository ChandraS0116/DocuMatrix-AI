import React from 'react';
import { useDesignSystem } from '../design/ThemeProvider';
import { motion } from 'framer-motion';
import { Palette, Layout, Type, Zap, Check } from 'lucide-react';

export default function SettingsCenter() {
  const { 
    themeName, setThemeName, themes, 
    density, setDensity, 
    typography, setTypography, 
    motionLevel, setMotionLevel,
    getMotionConfig
  } = useDesignSystem();

  const themeFamilies = ['Executive', 'Dark Enterprise', 'Cyber', 'Nature', 'Creative', 'Cosmic'];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Enterprise Settings Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure your workspace layout, themes, and interactions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Theme Engine */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Palette size={24} color="var(--accent-blue)" />
            <h2>Premium Theme Engine</h2>
          </div>
          
          {themeFamilies.map(family => (
            <div key={family} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{family}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {themes.filter(t => t.family === family).map(t => (
                  <button
                    key={t.name}
                    onClick={() => setThemeName(t.name)}
                    className="hover-card"
                    style={{
                      padding: '1rem',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      background: t.tokens['--bg-panel'],
                      border: themeName === t.name ? '2px solid var(--accent-blue)' : `1px solid ${t.tokens['--border-light']}`,
                      borderRadius: 'var(--radius-md)',
                      color: t.tokens['--text-primary'],
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t.name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.tokens['--accent-primary'] }} />
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.tokens['--accent-secondary'] }} />
                    </div>
                    {themeName === t.name && (
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: 'var(--accent-blue)' }}>
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Layout & Density */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Layout size={24} color="var(--accent-purple)" />
            <h2>Density Modes</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {['Compact', 'Comfortable', 'Spacious'].map(d => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                style={{
                  padding: '1rem',
                  background: density === d ? 'var(--bg-panel-hover)' : 'var(--bg-panel)',
                  border: density === d ? '2px solid var(--accent-purple)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Type size={24} color="var(--accent-green)" />
            <h2>Typography System</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {['Inter', 'Roboto', 'Outfit', 'IBM Plex Sans'].map(font => (
              <button
                key={font}
                onClick={() => setTypography(font)}
                style={{
                  padding: '1rem',
                  fontFamily: `'${font}', sans-serif`,
                  background: typography === font ? 'var(--bg-panel-hover)' : 'var(--bg-panel)',
                  border: typography === font ? '2px solid var(--accent-green)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '1.1rem'
                }}
              >
                Aa {font}
              </button>
            ))}
          </div>
        </section>

        {/* Motion Settings */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Zap size={24} color="var(--accent-yellow)" />
            <h2>Motion & Interactions</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {['No Animation', 'Reduced', 'Premium'].map(m => (
              <button
                key={m}
                onClick={() => setMotionLevel(m)}
                style={{
                  padding: '1rem',
                  background: motionLevel === m ? 'var(--bg-panel-hover)' : 'var(--bg-panel)',
                  border: motionLevel === m ? '2px solid var(--accent-yellow)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Premium motion enables fluid micro-interactions, layout transitions, and animated components via Framer Motion.
          </p>
        </section>
      </div>
    </div>
  );
}
