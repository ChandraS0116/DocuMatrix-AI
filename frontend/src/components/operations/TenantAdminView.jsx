import React, { useState, useEffect } from 'react';
import { Users, Search, CreditCard, Box, Settings, Sliders, Shield } from 'lucide-react';

export default function TenantAdminView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tenantStats, setTenantStats] = useState({
    active_tenants: 142,
    total_arr: "$8.4M",
    isolated_clusters: 24,
    over_quota: 0
  });
  const [tenants, setTenants] = useState([
    { id: 'T-Apex', name: 'Apex Global', plan: 'Enterprise', mrr: 12500, users: 450, storage: '1.2 TB', models: 3, isolation: 'Strict' },
    { id: 'T-Cybr', name: 'CyberDyne Systems', plan: 'Enterprise', mrr: 28000, users: 1200, storage: '4.8 TB', models: 5, isolation: 'Strict' },
    { id: 'T-Med', name: 'MedCorp Health', plan: 'Enterprise', mrr: 18500, users: 800, storage: '2.1 TB', models: 2, isolation: 'Strict (HIPAA)' },
    { id: 'T-Strt', name: 'Startup Inc', plan: 'Pro', mrr: 999, users: 12, storage: '45 GB', models: 1, isolation: 'Shared' },
  ]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/tenants', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.tenants && data.tenants.length > 0) {
            setTenants(data.tenants.map(t => ({
              id: t.id,
              name: t.name,
              plan: t.plan || 'Enterprise',
              mrr: 12000,
              users: t.documents || 45,
              storage: `${t.storage_mb || 100} MB`,
              models: 2,
              isolation: t.isolation || 'K8s Dedicated Namespace'
            })));
          }
          setTenantStats({
            active_tenants: data.active_tenants || 142,
            total_arr: data.total_arr || "$8.4M",
            isolated_clusters: data.isolated_clusters || 24,
            over_quota: data.over_quota || 0
          });
        }
      } catch (err) {
        console.error("Failed to load tenants", err);
      }
    };
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Tenant Administration</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage multi-tenant isolation, billing limits, and RBAC policies.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-panel)', width: '250px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%' }} 
            />
          </div>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Provision Tenant</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Active Tenants</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{tenantStats.active_tenants}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total ARR</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{tenantStats.total_arr}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Isolated Clusters</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{tenantStats.isolated_clusters}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Over Quota</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-yellow)' }}>{tenantStats.over_quota}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '0.75rem' }}>Tenant Name</th>
              <th style={{ padding: '0.75rem' }}>Plan / MRR</th>
              <th style={{ padding: '0.75rem' }}>Users</th>
              <th style={{ padding: '0.75rem' }}>Storage</th>
              <th style={{ padding: '0.75rem' }}>Isolation</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.id}</div>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <span className="badge" style={{ background: t.plan === 'Enterprise' ? 'rgba(187,134,252,0.1)' : 'rgba(255,255,255,0.1)', color: t.plan === 'Enterprise' ? 'var(--accent-purple)' : 'var(--text-primary)', marginBottom: '0.25rem', display: 'inline-block' }}>{t.plan}</span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>\${t.mrr.toLocaleString()}/mo</div>
                </td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-primary)' }}>{t.users}</td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-primary)' }}>{t.storage}</td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.isolation}</td>
                <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem' }} title="Feature Flags"><Sliders size={14} /></button>
                    <button className="btn-secondary" style={{ padding: '0.5rem' }} title="RBAC Policy"><Shield size={14} /></button>
                    <button className="btn-secondary" style={{ padding: '0.5rem' }} title="Settings"><Settings size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
