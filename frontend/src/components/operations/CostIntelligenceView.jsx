import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Download } from 'lucide-react';

export default function CostIntelligenceView() {
  const [timeframe, setTimeframe] = useState('7d');
  const [costData, setCostData] = useState([
    { name: 'Mon', llm: 400, gpu: 240, storage: 150 },
    { name: 'Tue', llm: 300, gpu: 220, storage: 150 },
    { name: 'Wed', llm: 550, gpu: 280, storage: 155 },
    { name: 'Thu', llm: 480, gpu: 250, storage: 155 },
    { name: 'Fri', llm: 600, gpu: 300, storage: 160 },
    { name: 'Sat', llm: 200, gpu: 120, storage: 160 },
    { name: 'Sun', llm: 250, gpu: 140, storage: 165 },
  ]);
  const [spendMetrics, setSpendMetrics] = useState({
    mtd_spend: 14204.50,
    forecast_spend: 18450.00,
    savings_captured: 4120.00,
    active_anomalies: 0
  });

  useEffect(() => {
    const fetchCostTelemetry = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/v1/control-tower/cost-intelligence', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.daily_breakdown) setCostData(data.daily_breakdown);
          setSpendMetrics({
            mtd_spend: data.mtd_spend || 14204.50,
            forecast_spend: data.forecast_spend || 18450.00,
            savings_captured: data.savings_captured || 4120.00,
            active_anomalies: data.active_anomalies || 0
          });
        }
      } catch (err) {
        console.error("Failed to load cost intelligence", err);
      }
    };
    fetchCostTelemetry();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{label}</p>
          {payload.map(p => (
            <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              <span style={{ color: p.color, textTransform: 'uppercase' }}>{p.dataKey}</span>
              <span>\${p.value.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
            <span>Total</span>
            <span>\${payload.reduce((sum, p) => sum + p.value, 0).toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Cost Intelligence</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time forecasting and expenditure analysis across infrastructure.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-panel)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          {['24h', '7d', '30d', 'YTD'].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} style={{ background: timeframe === t ? 'var(--bg-deep)' : 'transparent', border: timeframe === t ? '1px solid var(--border-light)' : '1px solid transparent', padding: '0.25rem 0.75rem', borderRadius: '4px', color: timeframe === t ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>MTD Total Spend</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>\$14,204.50</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-red)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <TrendingUp size={12} /> +12.5% vs last month
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Cost Per Document</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>\$0.042</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-green)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <TrendingDown size={12} /> -5.2% via quantization
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>LLM Token Cost</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>\$8,102.00</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            58% of total expenditure
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Projected EOM</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>\$28,500</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-yellow)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Approaching \$30k budget limit
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flex: 1, minHeight: '400px' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Burn Rate & Forecasting</h3>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem' }}><Download size={14} /></button>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLlm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="llm" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorLlm)" stackId="1" />
                <Area type="monotone" dataKey="gpu" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorGpu)" stackId="1" />
                <Area type="monotone" dataKey="storage" stroke="var(--accent-green)" fillOpacity={0.1} fill="var(--accent-green)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Department Allocation</h3>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Legal', value: 12400 },
                { name: 'Finance', value: 8200 },
                { name: 'HR', value: 3100 },
                { name: 'Ops', value: 4800 }
              ]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'var(--bg-deep)', border: '1px solid var(--border-light)'}} itemStyle={{color: 'var(--accent-blue)'}} />
                <Bar dataKey="value" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
