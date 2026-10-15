import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, Activity, Pause, Play, RotateCcw, XCircle, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function JobOrchestrationView() {
  const [activeTab, setActiveTab] = useState('workers');
  const [workers, setWorkers] = useState([
    { id: 'w-gpu-01', type: 'GPU (A100)', status: 'busy', load: 88, uptime: '14d 2h', currentJob: 'JOB-9021' },
    { id: 'w-gpu-02', type: 'GPU (A100)', status: 'busy', load: 92, uptime: '14d 2h', currentJob: 'JOB-9022' },
    { id: 'w-cpu-01', type: 'CPU (c6g.4xl)', status: 'idle', load: 12, uptime: '5d 10h', currentJob: '-' },
    { id: 'w-cpu-02', type: 'CPU (c6g.4xl)', status: 'busy', load: 76, uptime: '5d 10h', currentJob: 'JOB-9024' },
  ]);

  const [dlq, setDlq] = useState([
    { id: 'JOB-8842', type: 'Invoice Extraction', error: 'CUDA Out of Memory', retries: 3, time: '2 hours ago' },
    { id: 'JOB-8810', type: 'Risk Analysis', error: 'Rules Engine Timeout', retries: 3, time: '5 hours ago' },
  ]);

  const [stats, setStats] = useState({
    queued_jobs: 1402,
    active_workers: 48,
    total_workers: 50,
    dead_letters: 12,
    avg_wait_ms: 420
  });

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/workers', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.workers) setWorkers(data.workers);
          if (data.dlq) setDlq(data.dlq);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load control tower workers", err);
      }
    };
    fetchTelemetry();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Job Orchestration & DLQ</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage worker pools, job queues, and dead letters.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}><Pause size={16} /> Pause Queue</button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}><RotateCcw size={16} /> Retry Failed</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Queued Jobs</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.queued_jobs.toLocaleString()}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Active Workers</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{stats.active_workers} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats.total_workers}</span></div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--accent-red)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Dead Letter Queue</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>{stats.dead_letters}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Avg Wait Time</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.avg_wait_ms}ms</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-light)' }}>
        <button onClick={() => setActiveTab('workers')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', color: activeTab === 'workers' ? 'var(--accent-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'workers' ? '2px solid var(--accent-blue)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}>Worker Pool</button>
        <button onClick={() => setActiveTab('dlq')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', color: activeTab === 'dlq' ? 'var(--accent-red)' : 'var(--text-muted)', borderBottom: activeTab === 'dlq' ? '2px solid var(--accent-red)' : '2px solid transparent', cursor: 'pointer', fontWeight: 600 }}>Dead Letter Queue ({stats.dead_letters})</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'workers' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.75rem' }}>Worker ID</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Load</th>
                <th style={{ padding: '0.75rem' }}>Current Job</th>
                <th style={{ padding: '0.75rem' }}>Uptime</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Server size={14} color={w.status === 'busy' ? 'var(--accent-blue)' : 'var(--text-muted)'} /> {w.id}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{w.type}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span className="badge" style={{ background: w.status === 'busy' ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.1)', color: w.status === 'busy' ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '60px', height: '4px', background: 'var(--bg-deep)', borderRadius: '2px' }}>
                        <div style={{ width: `${w.load}%`, height: '100%', background: w.load > 90 ? 'var(--accent-red)' : 'var(--accent-blue)', borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.load}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>{w.currentJob}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{w.uptime}</td>
                  <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Restart</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'dlq' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.75rem' }}>Job ID</th>
                <th style={{ padding: '0.75rem' }}>Type</th>
                <th style={{ padding: '0.75rem' }}>Error / Exception</th>
                <th style={{ padding: '0.75rem' }}>Retries</th>
                <th style={{ padding: '0.75rem' }}>Failed At</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dlq.map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-red)' }}>
                    <Link to={`/trace/${j.id}`} style={{ color: 'var(--accent-red)', textDecoration: 'none' }}>{j.id}</Link>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{j.type}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <AlertOctagon size={14} color="var(--accent-red)" /> {j.error}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{j.retries} / 3</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{j.time}</td>
                  <td style={{ padding: '1rem 0.75rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Play size={12} /> Requeue</button>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--accent-red)' }}><XCircle size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
