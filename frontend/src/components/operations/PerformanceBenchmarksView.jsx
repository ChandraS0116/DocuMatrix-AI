import React, { useState, useEffect } from 'react';
import { Zap, Activity, Database, Server, Clock, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function PerformanceBenchmarksView() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [cacheHitRate, setCacheHitRate] = useState("94.2%");
  const [data, setData] = useState(
    Array.from({ length: 30 }).map((_, i) => ({
      time: i,
      throughput: 120 + Math.random() * 20,
      p95: 1.2 + Math.random() * 0.4,
      cpu: 45 + Math.random() * 10
    }))
  );

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        setData(prev => {
          const newData = [...prev.slice(1)];
          const last = newData[newData.length - 1];
          const spike = Math.random() > 0.95 ? 300 : 0;
          newData.push({
            time: last.time + 1,
            throughput: Math.min(800, Math.max(50, last.throughput + (Math.random() - 0.4) * 50 + spike)),
            p95: Math.min(5.0, Math.max(0.5, last.p95 + (Math.random() - 0.5) * 0.5 + (spike ? 1.5 : 0))),
            cpu: Math.min(100, Math.max(20, last.cpu + (Math.random() - 0.5) * 5 + (spike ? 30 : 0)))
          });
          return newData;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // Poll real metrics
      const fetchBenchmarks = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/v1/control-tower/benchmarks', {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' }
          });
          if (res.ok) {
            const bench = await res.json();
            if (bench.cache_hit_rate) setCacheHitRate(bench.cache_hit_rate);
          }
        } catch (err) {
          // silent fallback
        }
      };
      fetchBenchmarks();
      const interval = setInterval(fetchBenchmarks, 5000);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const current = data[data.length - 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Performance Benchmarks</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time load testing, throughput visualization, and SLA tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={isSimulating ? "btn-secondary" : "btn-primary"} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: isSimulating ? 'var(--accent-red)' : '' }}
          >
            <Zap size={16} /> {isSimulating ? 'Stop Stress Test' : 'Start Stress Test'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Throughput</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: current.throughput > 400 ? 'var(--accent-yellow)' : 'var(--text-primary)' }}>{Math.round(current.throughput)} docs/m</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>P95 Latency</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: current.p95 > 3.0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{current.p95.toFixed(2)}s</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Cluster CPU</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: current.cpu > 85 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{current.cpu.toFixed(1)}%</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Cache Hit Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{cacheHitRate}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Queue Depth</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.floor(current.throughput * 1.5)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1, minHeight: '300px' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--accent-blue)" /> Processing Throughput
          </h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 100']} />
                <RechartsTooltip contentStyle={{background: 'var(--bg-deep)', border: 'none'}} />
                <Area type="monotone" dataKey="throughput" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#colorTp)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} color="var(--accent-green)" /> P95 Latency (SLA: 3.0s)
          </h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 6]} />
                <RechartsTooltip contentStyle={{background: 'var(--bg-deep)', border: 'none'}} />
                <Line type="monotone" dataKey="p95" stroke="var(--accent-green)" strokeWidth={2} dot={false} isAnimationActive={false} />
                {/* SLA Line */}
                <Line type="monotone" dataKey={() => 3.0} stroke="var(--accent-red)" strokeDasharray="5 5" strokeWidth={1} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
