import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle, AlertTriangle, GitCommit, Search, RefreshCw, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ModelGovernanceView() {
  const [selectedModel, setSelectedModel] = useState('ext-v4.2.1-prod');
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState([
    { id: 'ext-v4.2.1-prod', name: 'Invoice Extractor', env: 'Production', status: 'Healthy', precision: 0.95 },
    { id: 'ext-v4.3.0-rc', name: 'Invoice Extractor', env: 'Staging', status: 'Evaluating', precision: 0.96 },
    { id: 'cls-v2.1.0-prod', name: 'Document Classifier', env: 'Production', status: 'Drifting', precision: 0.88 },
    { id: 'risk-v1.0.5-prod', name: 'Vendor Risk Analysis', env: 'Production', status: 'Healthy', precision: 0.92 },
  ]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/model-governance', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.models) setModels(data.models);
        }
      } catch (err) {
        console.error("Failed to load model governance", err);
      }
    };
    fetchModels();
  }, []);

  const performanceData = [
    { week: 'W1', precision: 0.94, recall: 0.92, drift: 0.01 },
    { week: 'W2', precision: 0.94, recall: 0.91, drift: 0.02 },
    { week: 'W3', precision: 0.93, recall: 0.91, drift: 0.04 },
    { week: 'W4', precision: 0.91, recall: 0.89, drift: 0.08 }, // Drift detected
    { week: 'W5', precision: 0.95, recall: 0.94, drift: 0.00 }, // Retrained
    { week: 'W6', precision: 0.95, recall: 0.94, drift: 0.01 },
  ];

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>AI Model Governance</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor model drift, evaluation metrics, and deployment history.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}><RefreshCw size={16} /> Trigger Retraining</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Model Registry */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search registry..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
            {filteredModels.map(m => (
              <div 
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className="glass-panel" 
                style={{ 
                  padding: '1rem', cursor: 'pointer', 
                  border: selectedModel === m.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                  background: selectedModel === m.id ? 'var(--bg-deep)' : 'var(--bg-panel)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span className="badge" style={{ 
                    background: m.status === 'Healthy' ? 'rgba(0,229,255,0.1)' : m.status === 'Drifting' ? 'rgba(255,234,0,0.1)' : 'rgba(255,255,255,0.1)',
                    color: m.status === 'Healthy' ? 'var(--accent-green)' : m.status === 'Drifting' ? 'var(--accent-yellow)' : 'var(--text-muted)'
                  }}>{m.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'monospace' }}>{m.id}</span>
                  <span>{m.env}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Model Details */}
        <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(0,102,255,0.1)', borderRadius: '8px', color: 'var(--accent-blue)' }}>
                  <Cpu size={24} />
                </div>
                <h3 style={{ fontSize: '1.5rem' }}>Invoice Extractor</h3>
              </div>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: ext-v4.2.1-prod | Deployed: 14 days ago</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>95.2%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>F1 Score (Production)</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Precision</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>0.95</div>
            </div>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recall</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>0.94</div>
            </div>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Data Drift (KL)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-green)' }}>0.012</div>
            </div>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>P99 Latency</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>142ms</div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem', flex: 1, minHeight: '250px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} /> Performance & Drift Over Time
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0.8, 1]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 0.2]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{background: 'var(--bg-deep)', border: '1px solid var(--border-light)'}} itemStyle={{color: 'var(--text-primary)'}} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="precision" stroke="var(--accent-blue)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="left" type="monotone" dataKey="recall" stroke="var(--accent-blue)" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="step" dataKey="drift" stroke="var(--accent-yellow)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Deployment History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { version: 'v4.2.1-prod', date: '2026-06-14', author: 'ml-pipeline', change: 'Retrained on Q2 corpus. Fixed invoice number drift.' },
                { version: 'v4.2.0-prod', date: '2026-05-22', author: 'sarah.k', change: 'Introduced layout-aware spatial embeddings.' },
                { version: 'v4.1.5-prod', date: '2026-05-01', author: 'ml-pipeline', change: 'Automated retraining trigger.' }
              ].map(v => (
                <div key={v.version} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ color: 'var(--text-muted)', paddingTop: '2px' }}><GitCommit size={16} /></div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.version}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.date} by {v.author}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
