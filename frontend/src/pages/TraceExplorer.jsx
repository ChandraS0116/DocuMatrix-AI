import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Server, FileText, CheckCircle, AlertTriangle, Layers, Cpu, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TraceExplorer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedSpan, setExpandedSpan] = useState(null);
  const [traceData, setTraceData] = useState(null);

  const traceId = id || 'TRC-a7f92b41';

  useEffect(() => {
    if (id) {
      fetch(`/api/v1/control-tower/document/${id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.spans) setTraceData(data);
        })
        .catch(err => console.warn("Live trace unavailable, using telemetry model", err));
    }
  }, [id]);

  const defaultSpans = [
    { id: 'span-1', name: 'POST /api/v1/documents', service: 'gateway', startTime: 0, duration: 1450, status: 'ok', type: 'http' },
    { id: 'span-2', name: 'S3_Upload', service: 'storage-svc', startTime: 10, duration: 240, status: 'ok', type: 'db', parent: 'span-1' },
    { id: 'span-3', name: 'Process_Pipeline', service: 'orchestrator', startTime: 260, duration: 1180, status: 'ok', type: 'internal', parent: 'span-1' },
    { id: 'span-4', name: 'OCR_Extraction', service: 'ocr-engine', startTime: 270, duration: 450, status: 'ok', type: 'internal', parent: 'span-3' },
    { id: 'span-5', name: 'Tesseract_Inference', service: 'worker-gpu-01', startTime: 280, duration: 430, status: 'ok', type: 'ai', parent: 'span-4' },
    { id: 'span-6', name: 'LLM_Classification', service: 'classifier-svc', startTime: 730, duration: 150, status: 'ok', type: 'ai', parent: 'span-3' },
    { id: 'span-7', name: 'LLM_Data_Extraction', service: 'extraction-svc', startTime: 890, duration: 380, status: 'warning', type: 'ai', parent: 'span-3' },
    { id: 'span-8', name: 'Vector_Embedding', service: 'embedding-svc', startTime: 1280, duration: 150, status: 'ok', type: 'ai', parent: 'span-3' },
    { id: 'span-9', name: 'ElasticSearch_Index', service: 'search-db', startTime: 1430, duration: 10, status: 'ok', type: 'db', parent: 'span-3' },
  ];

  const spans = traceData?.spans?.map((s, i) => ({
    id: `span-${i+1}`,
    name: s.name,
    service: s.service || 'pipeline',
    startTime: i * 180,
    duration: s.duration_ms || 200,
    status: s.status?.toLowerCase() || 'ok',
    type: s.service?.includes('ML') ? 'ai' : s.service?.includes('OCR') ? 'internal' : 'db',
    parent: i > 0 ? 'span-1' : null
  })) || defaultSpans;

  const totalDuration = 1450; // max duration

  const getServiceColor = (service) => {
    if (service === 'gateway') return '#9E9E9E';
    if (service.includes('svc')) return '#BB86FC';
    if (service.includes('gpu')) return '#00E5FF';
    if (service.includes('db')) return '#00E676';
    return '#FFEA00';
  };

  const getIcon = (type) => {
    switch(type) {
      case 'http': return <Server size={14} />;
      case 'db': return <Database size={14} />;
      case 'ai': return <Cpu size={14} />;
      default: return <Layers size={14} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-panel)' }}>
        <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Trace Explorer</h1>
            <span className="badge" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>{traceId}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
            Document Ingestion Pipeline • {totalDuration}ms • 9 spans
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
            <div style={{ color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> OK</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Waterfall Chart */}
        <div style={{ flex: 2, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border-light)' }}>
          
          {/* Timeline Header */}
          <div style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <div style={{ width: '300px' }}>Service & Span</div>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0 }}>0ms</span>
              <span style={{ position: 'absolute', left: '25%' }}>{totalDuration * 0.25}ms</span>
              <span style={{ position: 'absolute', left: '50%' }}>{totalDuration * 0.5}ms</span>
              <span style={{ position: 'absolute', left: '75%' }}>{totalDuration * 0.75}ms</span>
              <span style={{ position: 'absolute', right: 0 }}>{totalDuration}ms</span>
            </div>
          </div>

          {/* Spans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {spans.map((span, idx) => {
              const leftPercent = (span.startTime / totalDuration) * 100;
              const widthPercent = (span.duration / totalDuration) * 100;
              const indent = span.parent ? (span.parent === 'span-1' ? 1 : span.parent === 'span-3' ? 2 : 3) : 0;
              const color = getServiceColor(span.service);

              return (
                <div 
                  key={span.id}
                  onClick={() => setExpandedSpan(span)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '4px 0', 
                    cursor: 'pointer',
                    background: expandedSpan?.id === span.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ width: '300px', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: `${indent * 1.5}rem`, fontSize: '0.85rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }}></div>
                    <span style={{ color: 'var(--text-secondary)' }}>{span.service}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{span.name}</span>
                  </div>
                  
                  <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                    {/* Grid lines */}
                    <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                    
                    {/* Bar */}
                    <div style={{ 
                      position: 'absolute', 
                      left: `${leftPercent}%`, 
                      width: `${Math.max(widthPercent, 0.5)}%`, 
                      height: '12px', 
                      background: color, 
                      borderRadius: '2px',
                      opacity: 0.8
                    }}></div>
                    
                    <span style={{ position: 'absolute', left: `${leftPercent + widthPercent + 1}%`, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {span.duration}ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Span Details Pane */}
        {expandedSpan ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ flex: 1, background: 'var(--bg-deep)', padding: '1.5rem', overflowY: 'auto' }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: getServiceColor(expandedSpan.service) }}></div>
              {expandedSpan.name}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service</div>
                <div style={{ fontFamily: 'monospace' }}>{expandedSpan.service}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                <div>{expandedSpan.duration}ms</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status Code</div>
                <div style={{ color: expandedSpan.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{expandedSpan.status === 'ok' ? '200 OK' : 'Warning'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Span ID</div>
                <div style={{ fontFamily: 'monospace' }}>{expandedSpan.id}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem' }}>Tags</h4>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>http.method</td><td style={{ fontFamily: 'monospace' }}>POST</td></tr>
                  <tr><td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>http.url</td><td style={{ fontFamily: 'monospace' }}>/api/v1/internal/extract</td></tr>
                  <tr><td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>tenant_id</td><td style={{ fontFamily: 'monospace' }}>acme_corp</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem' }}>Logs / Events</h4>
              <div style={{ background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>[+{expandedSpan.startTime}ms] Span started</div>
                {expandedSpan.status === 'warning' && (
                  <div style={{ color: 'var(--accent-yellow)' }}>[+{expandedSpan.startTime + 200}ms] WARN: Fallback to heuristic parser (Confidence &lt; 90%)</div>
                )}
                <div style={{ color: 'var(--accent-green)' }}>[+{expandedSpan.startTime + expandedSpan.duration}ms] Span completed successfully</div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--bg-deep)' }}>
            Select a span to view details
          </div>
        )}

      </div>
    </div>
  );
}
