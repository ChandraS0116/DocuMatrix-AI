import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Activity, LifeBuoy } from 'lucide-react';

export default function IncidentManagementView() {
  const [incidents, setIncidents] = useState([
    { id: 'INC-2041', title: 'OCR Engine Latency Spike', status: 'Investigating', severity: 'Sev2', duration: '45m', team: 'ML Ops' },
    { id: 'INC-2040', title: 'S3 Event Delivery Delay', status: 'Resolved', severity: 'Sev3', duration: '1h 15m', team: 'Platform' },
    { id: 'INC-2039', title: 'Webhook Delivery Failures (Apex)', status: 'Resolved', severity: 'Sev2', duration: '22m', team: 'Integration' },
  ]);
  const [subsystems, setSubsystems] = useState([
    { name: 'FastAPI Core Gateway', status: 'Operational', color: 'var(--accent-green)' },
    { name: 'Celery Asynchronous Workers', status: 'Operational', color: 'var(--accent-green)' },
    { name: 'Elasticsearch 8 Cluster', status: 'Operational', color: 'var(--accent-green)' },
    { name: 'PostgreSQL 15 Primary', status: 'Operational', color: 'var(--accent-green)' },
    { name: 'MinIO S3 Storage Pool', status: 'Operational', color: 'var(--accent-green)' },
    { name: 'Redis Distributed Cache', status: 'Operational', color: 'var(--accent-green)' },
  ]);
  const [incMetrics, setIncMetrics] = useState({
    active_incidents: 0,
    mttr: "18m",
    uptime_30d: "99.98%",
    on_call: "Lead SRE Team Alpha"
  });

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/incidents', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          setIncMetrics({
            active_incidents: data.active_incidents ?? 0,
            mttr: data.mttr || "18m",
            uptime_30d: data.uptime_30d || "99.98%",
            on_call: data.on_call || "Lead SRE Team Alpha"
          });
          if (data.subsystems) {
            setSubsystems(data.subsystems.map(s => ({
              name: s.name,
              status: s.status === 'OPERATIONAL' ? 'Operational' : 'Degraded',
              color: s.status === 'OPERATIONAL' ? 'var(--accent-green)' : 'var(--accent-yellow)'
            })));
          }
          if (data.recent_incidents && data.recent_incidents.length > 0) {
            setIncidents(data.recent_incidents.map(inc => ({
              id: inc.id,
              title: inc.title,
              status: inc.status === 'RESOLVED' ? 'Resolved' : 'Active',
              severity: inc.severity,
              duration: inc.duration,
              team: 'Core Platform'
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch incidents", err);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Incident Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time service status, active incidents, and postmortems.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--accent-red)' }}>Declare Incident</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: incMetrics.active_incidents > 0 ? '4px solid var(--accent-red)' : '4px solid var(--accent-green)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Active Incidents</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: incMetrics.active_incidents > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{incMetrics.active_incidents}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>MTTR (30d)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{incMetrics.mttr}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Global Uptime</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{incMetrics.uptime_30d}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>On-Call</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <LifeBuoy size={18} color="var(--accent-blue)" /> {incMetrics.on_call}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', flex: 1 }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Subsystem Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {subsystems.map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                <span style={{ color: s.color, fontWeight: 500 }}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Incidents</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Title</th>
                <th style={{ padding: '0.75rem' }}>Severity</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Duration</th>
                <th style={{ padding: '0.75rem' }}>Team</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>{inc.id}</td>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 500 }}>{inc.title}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span className="badge" style={{ background: inc.severity === 'Sev2' ? 'rgba(255,100,0,0.1)' : 'rgba(255,255,255,0.1)', color: inc.severity === 'Sev2' ? '#ff9500' : 'var(--text-muted)' }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    {inc.status === 'Resolved' ? (
                      <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Resolved</span>
                    ) : (
                      <span style={{ color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Activity size={14} /> Investigating</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{inc.duration}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{inc.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
