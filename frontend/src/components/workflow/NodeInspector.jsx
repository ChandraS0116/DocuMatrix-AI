import React, { useState } from 'react';
import { X, Activity, HardDrive, Clock, DollarSign, Database, GitBranch, Settings, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NodeInspector({ node, onClose }) {
  const [activeTab, setActiveTab] = useState('config');

  if (!node) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Node Inspector</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{node.data.label}</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={14} />} label="Config" />
        <TabButton active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')} icon={<Activity size={14} />} label="Telemetry" />
        <TabButton active={activeTab === 'lineage'} onClick={() => setActiveTab('lineage')} icon={<GitBranch size={14} />} label="Lineage" />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={14} />} label="History" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <AnimatePresence mode="wait">
          
          {activeTab === 'config' && (
            <motion.div key="config" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Node Name</label>
                <input type="text" className="input-field" defaultValue={node.data.label} />
              </div>
              
              {node.data.type === 'ai' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Model Configuration</label>
                  <select className="input-field" defaultValue="gpt-4-vision" style={{ marginBottom: '0.75rem' }}>
                    <option value="gpt-4-vision">GPT-4 Vision (High Precision)</option>
                    <option value="claude-3-sonnet">Claude 3.5 Sonnet</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="local-llama">Local Llama 3 (Fast/Secure)</option>
                  </select>
                  
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>System Prompt</label>
                  <textarea className="input-field" rows={4} defaultValue="Extract all invoice line items and detect anomalous vendor spend patterns." />
                </div>
              )}

              {node.data.type === 'human' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Routing Rule</label>
                  <select className="input-field" defaultValue="finance">
                    <option value="finance">Finance Team Pool</option>
                    <option value="compliance">Compliance Team Pool</option>
                    <option value="manager">Direct Manager Approval</option>
                  </select>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'telemetry' && (
            <motion.div key="telemetry" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <MetricCard icon={<Clock />} title="Avg Execution Time" value="1.24s" subtext="P99: 2.1s" color="var(--accent-blue)" />
              <MetricCard icon={<HardDrive />} title="Peak VRAM Usage" value="4.2 GB" subtext="Instance: g4dn.xlarge" color="var(--accent-purple)" />
              <MetricCard icon={<DollarSign />} title="Cost per 1k Docs" value="$12.50" subtext="Compute + Token cost" color="var(--accent-green)" />
              <MetricCard icon={<Activity />} title="Success Rate" value="99.4%" subtext="0.6% required fallback" color="var(--text-primary)" />
            </motion.div>
          )}

          {activeTab === 'lineage' && (
            <motion.div key="lineage" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Input Dependencies</div>
               <div className="glass-panel" style={{ padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Database size={16} color="var(--text-secondary)" />
                 <span>Raw Document Buffer (PDF/Image)</span>
               </div>
               
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Output Artifacts</div>
               <div className="glass-panel" style={{ padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Database size={16} color="var(--accent-blue)" />
                 <span>Extracted JSON Payload</span>
               </div>
               <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Database size={16} color="var(--accent-purple)" />
                 <span>Vector Embeddings (768d)</span>
               </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <HistoryItem user="System" time="2 mins ago" action="Auto-scaled to 4 instances due to queue depth" />
                <HistoryItem user="Alice Engineer" time="2 hours ago" action="Updated model to claude-3-sonnet" />
                <HistoryItem user="Bob Finance" time="1 day ago" action="Modified routing rule for human review" />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{
        flex: 1, padding: '1rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
        transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: active ? 600 : 400
      }}
    >
      {icon} {label}
    </button>
  );
}

function MetricCard({ icon, title, value, subtext, color }) {
  return (
    <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '0.75rem', background: `rgba(255,255,255,0.05)`, borderRadius: 'var(--radius-sm)', color: color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subtext}</div>
      </div>
    </div>
  );
}

function HistoryItem({ user, time, action }) {
  return (
    <div style={{ borderLeft: '2px solid var(--border-light)', paddingLeft: '1rem', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{time}</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{action}</div>
    </div>
  );
}
