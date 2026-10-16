import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck, Lock, Globe, Server, UserCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ComplianceCenterView() {
  const [complianceScore, setComplianceScore] = useState(96);
  const [frameworks, setFrameworks] = useState([
    { name: 'SOC 2 Type II', status: 'Compliant', score: 100, lastAudit: '2026-03-15' },
    { name: 'GDPR', status: 'Compliant', score: 98, lastAudit: '2026-05-01' },
    { name: 'HIPAA', status: 'Compliant', score: 96, lastAudit: '2026-01-10' },
    { name: 'ISO 27001', status: 'Compliant', score: 95, lastAudit: '2025-11-20' },
  ]);

  const [piiData, setPiiData] = useState([
    { name: 'Names', value: 45000, color: 'var(--accent-blue)' },
    { name: 'Addresses', value: 32000, color: 'var(--accent-blue)' },
    { name: 'SSNs', value: 8500, color: 'var(--accent-red)' },
    { name: 'Financial', value: 12400, color: 'var(--accent-yellow)' },
  ]);

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/compliance', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.compliance_score) setComplianceScore(data.compliance_score);
          if (data.frameworks) {
            setFrameworks(data.frameworks.map(f => ({
              name: f.name,
              status: f.status === 'COMPLIANT' ? 'Compliant' : 'Partial',
              score: f.score,
              lastAudit: 'Continuous Live'
            })));
          }
          if (data.pii_breakdown) {
            const colors = ['var(--accent-blue)', 'var(--accent-blue)', 'var(--accent-red)', 'var(--accent-yellow)'];
            setPiiData(data.pii_breakdown.map((item, idx) => ({
              name: item.name,
              value: item.value,
              color: colors[idx % colors.length]
            })));
          }
        }
      } catch (err) {
        console.error("Failed to fetch compliance data", err);
      }
    };
    fetchCompliance();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Compliance & Privacy Center</h2>
          <p style={{ color: 'var(--text-muted)' }}>Automated continuous compliance monitoring and PII inventory.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>Generate Audit Report</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
        
        {/* Overall Score */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--accent-green)" style={{ marginBottom: '1rem' }} />
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-green)', lineHeight: 1 }}>{complianceScore}</div>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', marginTop: '0.5rem', letterSpacing: '1px' }}>Global Compliance Score</div>
          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--accent-yellow)' }}>3 recommendations available</div>
        </div>

        {/* Frameworks */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Frameworks</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {frameworks.map(f => (
              <div key={f.name} style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{f.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Audit: {f.lastAudit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: f.score >= 95 ? 'var(--accent-green)' : 'var(--accent-yellow)', fontWeight: 'bold', fontSize: '1.25rem' }}>{f.score}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1 }}>
        
        {/* PII Inventory */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} color="var(--accent-blue)" /> Detected PII Inventory
          </h3>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
            <div style={{ width: '200px', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={piiData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {piiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background: 'var(--bg-deep)', border: '1px solid var(--border-light)'}} itemStyle={{color: 'var(--text-primary)'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem' }}>
              {piiData.map(p => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color }}></div>
                    <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Residency */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={16} color="var(--accent-blue)" /> Data Residency Rules
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { region: 'EU (Frankfurt)', type: 'Strict Isolation', active: true },
              { region: 'US East (N. Virginia)', type: 'Standard', active: true },
              { region: 'US West (Oregon)', type: 'Standard', active: true },
              { region: 'AP (Sydney)', type: 'Strict Isolation', active: false },
            ].map(r => (
              <div key={r.region} style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Server size={16} color={r.active ? "var(--accent-blue)" : "var(--text-muted)"} />
                  <span style={{ fontWeight: 500, color: r.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{r.region}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.type}</span>
                  {r.active ? (
                    <span className="badge" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent-blue)' }}>Enforced</span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>Inactive</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
