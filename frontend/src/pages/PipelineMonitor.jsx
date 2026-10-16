import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Server, Cpu, Clock, CheckCircle, AlertTriangle, XCircle, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDesignSystem } from '../design/ThemeProvider';

export default function PipelineMonitor() {
  const { theme } = useDesignSystem();
  
  // Mock live data stream
  const [jobs, setJobs] = useState([
    { id: 'JOB-9021', type: 'Invoice', status: 'processing', progress: 45, time: '10:42:01', tenant: 'Apex Global' },
    { id: 'JOB-9020', type: 'Contract', status: 'completed', progress: 100, time: '10:41:15', tenant: 'CyberDyne' },
    { id: 'JOB-9019', type: 'Healthcare', status: 'failed', progress: 12, time: '10:40:55', tenant: 'MedCorp' },
    { id: 'JOB-9018', type: 'Invoice', status: 'completed', progress: 100, time: '10:39:20', tenant: 'Apex Global' },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prev => {
        const newJobs = [...prev];
        const processingJob = newJobs.find(j => j.status === 'processing');
        if (processingJob) {
          processingJob.progress += Math.floor(Math.random() * 15) + 5;
          if (processingJob.progress >= 100) {
            processingJob.progress = 100;
            processingJob.status = 'completed';
          }
        } else if (Math.random() > 0.5) {
          // Add new job
          newJobs.unshift({
            id: `JOB-${9022 + Math.floor(Math.random() * 100)}`,
            type: ['Invoice', 'Contract', 'PO'][Math.floor(Math.random() * 3)],
            status: 'processing',
            progress: 0,
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            tenant: ['Apex Global', 'CyberDyne', 'MedCorp'][Math.floor(Math.random() * 3)]
          });
          if (newJobs.length > 8) newJobs.pop();
        }
        return newJobs;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Live Pipeline Monitor</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time execution telemetry and worker health.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-panel)', width: '250px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Search jobs or tenants..." style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }} />
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KpiCard title="Processing Rate" value="124 docs/min" subtext="↑ 12% vs last hour" icon={<Activity />} color="var(--accent-blue)" />
        <KpiCard title="Avg Latency" value="1.8s" subtext="SLA limit: 3.0s" icon={<Clock />} color="var(--accent-green)" />
        <KpiCard title="Active Workers" value="48 / 50" subtext="96% Utilization" icon={<Server />} color="var(--accent-blue)" />
        <KpiCard title="Failure Rate" value="0.4%" subtext="4 failed in last hour" icon={<AlertTriangle />} color="var(--accent-yellow)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        
        {/* Active Jobs Stream */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>Execution Stream</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.5rem' }}>Job ID</th>
                <th style={{ padding: '0.5rem' }}>Tenant</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Time</th>
                <th style={{ padding: '0.5rem', width: '30%' }}>Gantt Timeline</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                    <Link to={`/trace/${job.id}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>{job.id}</Link>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>{job.tenant}</td>
                  <td style={{ padding: '1rem 0.5rem' }}><span className="badge" style={{ background: 'var(--bg-deep)' }}>{job.type}</span></td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {job.status === 'processing' && <Activity size={14} color="var(--accent-blue)" />}
                      {job.status === 'completed' && <CheckCircle size={14} color="var(--accent-green)" />}
                      {job.status === 'failed' && <XCircle size={14} color="var(--accent-red)" />}
                      <span style={{ 
                        color: job.status === 'processing' ? 'var(--accent-blue)' : 
                               job.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-red)',
                        textTransform: 'capitalize', fontSize: '0.85rem'
                      }}>{job.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{job.time}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ 
                          height: '100%', 
                          background: job.status === 'processing' ? 'var(--accent-blue)' : 
                                      job.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-red)' 
                        }} 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resource Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Cpu size={18} color="var(--accent-blue)"/> Resource Usage</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GPU Utilization (A100)</span>
                <span style={{ fontWeight: 600 }}>82%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-deep)', borderRadius: '3px' }}>
                <div style={{ width: '82%', height: '100%', background: 'var(--accent-blue)', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Memory (RAM)</span>
                <span style={{ fontWeight: 600 }}>64%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-deep)', borderRadius: '3px' }}>
                <div style={{ width: '64%', height: '100%', background: 'var(--accent-blue)', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>System Alerts</h3>
             <div style={{ padding: '0.75rem', background: 'rgba(255, 234, 0, 0.1)', borderLeft: '3px solid var(--accent-yellow)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
               <strong>Warning:</strong> MedCorp tenant approaching rate limit (95%). Consider scaling worker pool.
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, subtext, icon, color }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ padding: '1rem', background: `rgba(255,255,255,0.05)`, borderRadius: 'var(--radius-md)', color: color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: color }}>{subtext}</div>
      </div>
    </div>
  );
}
