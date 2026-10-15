import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Key, Lock, Eye, AlertOctagon, Activity } from 'lucide-react';

export default function SecurityOperationsView() {
  const [activeTab, setActiveTab] = useState('events');
  const [secMetrics, setSecMetrics] = useState({
    security_score: 98,
    active_threats: 1,
    api_block_rate: "0.4%",
    keys_rotated_30d: 14
  });
  const [threatEvents, setThreatEvents] = useState([
    { id: 'EVT-992', severity: 'High', type: 'Rate Limit Exceeded', source: '192.168.1.104', target: '/api/v1/extract', time: '10 mins ago', status: 'Blocked' },
    { id: 'EVT-991', severity: 'Medium', type: 'Failed Login Burst', source: '45.22.11.9', target: '/auth/login', time: '1 hour ago', status: 'Throttled' },
    { id: 'EVT-990', severity: 'Low', type: 'Anomalous User Agent', source: '10.0.4.5', target: '/api/v1/documents', time: '3 hours ago', status: 'Logged' },
    { id: 'EVT-989', severity: 'Critical', type: 'Suspicious Payload', source: '112.55.3.1', target: '/api/v1/upload', time: '5 hours ago', status: 'Blocked & Alerted' },
  ]);

  useEffect(() => {
    const fetchSecurityTelemetry = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/security-ops', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.events) {
            setThreatEvents(data.events.map(ev => ({
              id: ev.id,
              severity: ev.severity === 'CRITICAL' ? 'Critical' : ev.severity === 'HIGH' ? 'High' : ev.severity === 'MEDIUM' ? 'Medium' : 'Low',
              type: ev.type,
              source: ev.source,
              target: ev.target,
              time: ev.time,
              status: ev.action === 'BLOCKED' ? 'Blocked & Alerted' : ev.action === 'THROTTLED' ? 'Throttled' : 'Allowed'
            })));
          }
          setSecMetrics({
            security_score: data.soc_score || 98,
            active_threats: data.active_threats || 0,
            api_block_rate: data.block_rate || "0.4%",
            keys_rotated_30d: data.keys_rotated_30d || 14
          });
        }
      } catch (err) {
        console.error("Failed to load security telemetry", err);
      }
    };
    fetchSecurityTelemetry();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Security Operations Center (SOC)</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor active threats, API security, and authentication telemetry.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}><Lock size={16} /> Force Key Rotation</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Security Score</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{secMetrics.security_score}/100</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-red)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Active Threats</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>{secMetrics.active_threats}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>API Block Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{secMetrics.api_block_rate}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Keys Rotated (30d)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{secMetrics.keys_rotated_30d}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)' }}>
        <button onClick={() => setActiveTab('events')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', color: activeTab === 'events' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'events' ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}>Threat Timeline</button>
        <button onClick={() => setActiveTab('audit')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', color: activeTab === 'audit' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'audit' ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}>API Audit Log</button>
        <button onClick={() => setActiveTab('keys')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', color: activeTab === 'keys' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'keys' ? '2px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}>Key Management</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'events' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Severity</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Source IP</th>
                <th style={{ padding: '0.75rem' }}>Target</th>
                <th style={{ padding: '0.75rem' }}>Action Taken</th>
                <th style={{ padding: '0.75rem' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {threatEvents.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>{e.id}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span className="badge" style={{ 
                      background: e.severity === 'Critical' ? 'rgba(255,0,0,0.1)' : e.severity === 'High' ? 'rgba(255,100,0,0.1)' : 'rgba(255,255,255,0.1)',
                      color: e.severity === 'Critical' ? '#ff3b30' : e.severity === 'High' ? '#ff9500' : 'var(--text-muted)'
                    }}>{e.severity}</span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>{e.type}</td>
                  <td style={{ padding: '1rem 0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{e.source}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{e.target}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span style={{ color: e.status.includes('Blocked') ? 'var(--accent-red)' : 'var(--text-muted)' }}>{e.status}</span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{e.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
