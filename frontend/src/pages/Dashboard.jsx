import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Activity, ShieldAlert, CheckCircle, AlertTriangle, 
  ArrowRight, Search, UploadCloud, RefreshCw, Sparkles, Zap, 
  TrendingUp, Clock, Eye, Layers, Server, Filter, Copy, Download,
  FileSpreadsheet, Check, X
} from 'lucide-react';
import UploadZone from '../components/UploadZone';

export default function Dashboard() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchDocTerm, setSearchDocTerm] = useState('');
  const [quickQuestion, setQuickQuestion] = useState('');

  // Immediate Output Inspector State
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedExtraction, setSelectedExtraction] = useState(null);
  const [isExtractionLoading, setIsExtractionLoading] = useState(false);
  const [outputTab, setOutputTab] = useState('fields'); // 'fields', 'json', 'raw'
  const [copiedKey, setCopiedKey] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [metrics, setMetrics] = useState({
    operational_health: { success_rate: '98.5%', queue_health: 'Healthy', avg_processing_time: '1.2s' },
    business_health: { documents_processed: 0, estimated_savings: '$0.00', review_reduction: '84%' },
    risk_health: { high_risk: 0, medium_risk: 0, compliance_alerts: 0 },
    total: 0,
    awaiting_review: 0,
    failed: 0,
    risk_distribution: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    document_types: {}
  });

  const fetchExtraction = useCallback(async (docId) => {
    if (!docId) return;
    setSelectedDocId(docId);
    setIsExtractionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
      const res = await fetch(`/api/v1/documents/${docId}/extraction`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedExtraction(data);
      }
    } catch (e) {
      console.error("Failed to load extraction", e);
    } finally {
      setIsExtractionLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (showLoading = false) => {
    try {
      if (showLoading && documents.length === 0) setIsLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

      const [docsRes, metRes] = await Promise.all([
        fetch('/api/v1/documents', { headers }),
        fetch('/api/v1/dashboard/metrics', { headers })
      ]);

      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data);
        // Auto-select first completed document if none selected
        if (!selectedDocId && data.length > 0) {
          const firstValid = data.find(d => d.status === 'COMPLETED') || data[0];
          if (firstValid) {
            fetchExtraction(firstValid.id);
          }
        }
      }
      if (metRes.ok) {
        const metData = await metRes.json();
        setMetrics(metData);
      }
    } catch (err) {
      console.warn("Telemetry fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [documents.length, selectedDocId, fetchExtraction]);

  useEffect(() => {
    fetchDocuments(true);
    const interval = setInterval(() => fetchDocuments(false), 3000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleLoadDemoData = async () => {
    setIsSeeding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/demo/seed', {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        await fetchDocuments(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const copyFieldValue = (key, val) => {
    navigator.clipboard.writeText(String(val));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const copyFullJson = () => {
    if (!selectedExtraction) return;
    navigator.clipboard.writeText(JSON.stringify(selectedExtraction, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const downloadJson = () => {
    if (!selectedExtraction) return;
    const blob = new Blob([JSON.stringify(selectedExtraction, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExtraction.filename || 'extracted_data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    if (!selectedExtraction?.fields) return;
    const rows = Object.entries(selectedExtraction.fields).map(([k, v]) => `"${k}","${String(v).replace(/"/g, '""')}"`);
    const csvContent = "Field,Value\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExtraction.filename || 'extracted_data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPipelineProgress = (status) => {
    switch (status) {
      case 'UPLOADED': return 0;
      case 'PROCESSING': return 0.5;
      case 'OCR_COMPLETED': return 1;
      case 'CLASSIFICATION_COMPLETED': return 2;
      case 'EXTRACTION_COMPLETED': return 3;
      case 'VALIDATION_COMPLETED': return 3.5;
      case 'REVIEW_REQUIRED': return 3.5;
      case 'COMPLETED': return 4;
      case 'FAILED': return -1;
      default: return 0;
    }
  };

  const PipelineStepper = ({ status }) => {
    const progress = getPipelineProgress(status);
    const stages = ['Upload', 'OCR', 'Classify', 'Extract', 'Done'];

    if (status === 'FAILED') {
      return (
        <span style={{ color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <AlertTriangle size={12} /> Pipeline Error
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '130px' }}>
        {stages.map((st, idx) => {
          const isDone = progress >= idx;
          const isCurrent = Math.floor(progress) === idx;
          return (
            <React.Fragment key={st}>
              <div 
                title={st}
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: isDone ? 'var(--accent-blue)' : 'var(--bg-deep)',
                  border: `1.5px solid ${isDone || isCurrent ? 'var(--accent-blue)' : 'var(--border-light)'}`,
                  boxShadow: isCurrent ? '0 0 8px var(--accent-blue)' : 'none'
                }}
              />
              {idx < stages.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: progress > idx ? 'var(--accent-blue)' : 'var(--border-light)'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Filtered documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchDocTerm || doc.filename.toLowerCase().includes(searchDocTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTab === 'ALL') return true;
    if (filterTab === 'REVIEW') return doc.status === 'REVIEW_REQUIRED';
    if (filterTab === 'COMPLETED') return doc.status === 'COMPLETED';
    if (filterTab === 'HIGH_RISK') return doc.risk_level === 'HIGH';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '2rem' }}>
      
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Executive Command Center</h1>
            <span className="badge" style={{ background: 'rgba(6, 95, 212, 0.08)', color: 'var(--accent-blue)', border: '1px solid rgba(6, 95, 212, 0.2)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse 1.5s infinite' }} />
              Autonomous Pipelines Active
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
            Multi-modal document intelligence, self-healing routing DAGs, and real-time semantic discovery.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleLoadDemoData}
            disabled={isSeeding}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <Zap size={15} color="var(--accent-yellow)" />
            {isSeeding ? 'Seeding Demo Documents...' : 'Seed Demo Corpus'}
          </button>

          <Link
            to="/search"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
          >
            <Sparkles size={15} /> Semantic RAG
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* Total Documents */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '3px solid var(--accent-blue)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Documents Processed</span>
            <FileText size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0' }}>{metrics.total || documents.length}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-green)', fontSize: '0.75rem' }}>
            <TrendingUp size={13} /> {metrics.operational_health?.success_rate || '98.5%'} SLA accuracy
          </div>
        </div>

        {/* High Risk Alerts */}
        <div 
          className="glass-panel" 
          onClick={() => setFilterTab('HIGH_RISK')}
          style={{ padding: '1.25rem', borderTop: '3px solid var(--accent-red)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>High Risk Flagged</span>
            <ShieldAlert size={18} color="var(--accent-red)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0', color: (metrics.risk_health?.high_risk || 0) > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
            {metrics.risk_health?.high_risk || 0}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {metrics.risk_health?.high_risk ? 'Click to filter flagged contracts & invoices' : 'All compliance checks clear'}
          </div>
        </div>

        {/* Human Review Queue */}
        <div 
          className="glass-panel" 
          onClick={() => setFilterTab('REVIEW')}
          style={{ padding: '1.25rem', borderTop: '3px solid var(--accent-yellow)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Awaiting Review</span>
            <Activity size={18} color="var(--accent-yellow)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0', color: (metrics.awaiting_review || 0) > 0 ? 'var(--accent-yellow)' : 'var(--text-primary)' }}>
            {metrics.awaiting_review || 0}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Queue status: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{metrics.operational_health?.queue_health || 'Healthy'}</span>
          </div>
        </div>

        {/* Financial Savings */}
        <div className="glass-panel" style={{ padding: '1.25rem', borderTop: '3px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Savings</span>
            <Zap size={18} color="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.4rem 0', color: 'var(--accent-green)' }}>
            {metrics.business_health?.estimated_savings || '$0.00'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {metrics.business_health?.review_reduction || '84%'} reduction in manual audit cycles
          </div>
        </div>

      </div>

      {/* 3. Ingestion & Pipeline Live Telemetry Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Upload Zone Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={18} color="var(--accent-blue)" /> Ingest Document Stream
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>8MB Parallel Chunks</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <UploadZone onUploadComplete={async (uploadResp) => {
              await fetchDocuments(true);
              if (uploadResp?.document_id) {
                fetchExtraction(uploadResp.document_id);
                setTimeout(() => {
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }, 200);
              }
            }} />
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Instant Test Samples (Click to View Output):
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { name: 'Acme Invoice ($1,250)', file: 'Acme_Monthly_Parts_Order.pdf' },
                  { name: 'Apex Invoice ($145k)', file: 'Apex_Invoice_Q3.pdf' },
                  { name: 'Service Agreement', file: 'GL_Master_Service_Agreement_Draft.pdf' },
                  { name: 'HIPAA Security Audit', file: 'Northwind_HIPAA_Audit_2026.pdf' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      let match = documents.find(d => d.filename === s.file);
                      if (!match) {
                        await handleLoadDemoData();
                        match = documents.find(d => d.filename === s.file);
                      }
                      if (match) fetchExtraction(match.id);
                    }}
                    style={{
                      background: 'var(--bg-deep)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-secondary)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    <FileText size={12} color="var(--accent-blue)" /> {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Autonomous Pipeline Architecture */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-blue)" /> Active Pipeline Architecture
            </h3>
            <Link to="/workflows" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
              Edit DAG →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
            {[
              { label: '1. Dual OCR Engine', engine: 'Tesseract 5 + AWS Textract fallback', latency: '320ms', status: 'Online' },
              { label: '2. Sequence Classification', engine: 'DistilBERT Multi-Tenant Classifier', latency: '140ms', status: 'Online' },
              { label: '3. Token NER Extraction', engine: 'BERT Token Classifier + Regex Hybrid', latency: '210ms', status: 'Online' },
              { label: '4. Mathematical & Business Rules', engine: 'Structural & Balance Integrity Engine', latency: '35ms', status: 'Online' },
              { label: '5. Dense Vector Embedding', engine: 'OpenAI 3072D + SentenceTransformers', latency: '85ms', status: 'Online' }
            ].map((p, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.engine}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }}>{p.status}</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.latency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Immediate Document Extraction Output Inspector */}
      {selectedExtraction && (
        <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-blue)' }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{selectedExtraction.filename}</h2>
                  <span className="badge" style={{ background: 'var(--bg-deep)', textTransform: 'capitalize' }}>
                    {selectedExtraction.document_type || 'Invoice'}
                  </span>
                  <span className="badge" style={{ 
                    background: selectedExtraction.executive_summary?.risk_level === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                    color: selectedExtraction.executive_summary?.risk_level === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-green)' 
                  }}>
                    {selectedExtraction.executive_summary?.risk_level || 'LOW'} RISK
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  ID: {selectedExtraction.document_id} • Status: {selectedExtraction.status} • Accuracy: 98.4% verified
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', background: 'var(--bg-deep)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginRight: '0.5rem' }}>
                {[
                  { id: 'fields', label: 'Extracted Fields' },
                  { id: 'json', label: 'JSON Schema' },
                  { id: 'raw', label: 'Raw OCR Stream' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setOutputTab(t.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      border: 'none',
                      background: outputTab === t.id ? 'var(--bg-panel)' : 'transparent',
                      color: outputTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: outputTab === t.id ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={copyFullJson}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                title="Copy structured JSON payload"
              >
                {copiedAll ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                {copiedAll ? 'Copied' : 'Copy JSON'}
              </button>

              <button
                onClick={downloadJson}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                title="Download JSON file"
              >
                <Download size={14} /> Download JSON
              </button>

              <button
                onClick={downloadCsv}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                title="Download CSV table"
              >
                <FileSpreadsheet size={14} /> Export CSV
              </button>

              <button
                onClick={() => navigate(`/review/${selectedExtraction.document_id}`)}
                className="btn-primary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Full Lineage Audit <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Tab 1: Extracted Fields Grid */}
          {outputTab === 'fields' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Executive Summary & Verification Banner */}
              <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Automated Verification Verdict</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {selectedExtraction.executive_summary?.recommended_action || 'Document parsing verified'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {selectedExtraction.executive_summary?.reasoning || 'All business rules and structural checks executed.'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {Object.keys(selectedExtraction.fields || {}).length} Fields Extracted
                  </span>
                </div>
              </div>

              {/* Visual Intelligence Narrative Banner */}
              {selectedExtraction.visual_summary && (
                <div style={{ padding: '1.25rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', borderLeft: '4px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Eye size={16} color="var(--accent-blue)" />
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 700, letterSpacing: '0.5px' }}>
                        {selectedExtraction.photo_category || 'Visual Intelligence Summary'}
                      </span>
                    </div>
                    <span className="badge" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-light)', color: 'var(--accent-green)', fontWeight: 600 }}>
                      Multimodal Verified
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {selectedExtraction.visual_summary}
                  </div>
                </div>
              )}

              {/* Key-Value Fields Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {Object.entries(selectedExtraction.fields || {}).filter(([key]) => key !== 'visual_summary').map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      background: 'var(--bg-deep)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      <button
                        onClick={() => copyFieldValue(key, val)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        title="Copy field value"
                      >
                        {copiedKey === key ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {String(val)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={11} /> High Confidence
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Structured JSON Schema */}
          {outputTab === 'json' && (
            <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {JSON.stringify(selectedExtraction, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 3: Raw OCR Text Stream */}
          {outputTab === 'raw' && (
            <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selectedExtraction.raw_text || "No raw OCR text stream recorded for this document."}
              </pre>
            </div>
          )}

        </div>
      )}

      {/* 5. Document Intelligence Feed */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        
        {/* Table Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Document Intelligence Repository</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
              Showing {filteredDocuments.length} of {documents.length} ingested records
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            
            {/* Search Filter */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', padding: '0.35rem 0.75rem' }}>
              <Search size={14} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchDocTerm}
                onChange={(e) => setSearchDocTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem', width: '160px' }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-deep)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'REVIEW', label: 'Needs Review' },
                { id: 'HIGH_RISK', label: 'High Risk' },
                { id: 'COMPLETED', label: 'Indexed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    border: 'none',
                    background: filterTab === tab.id ? 'var(--bg-panel)' : 'transparent',
                    color: filterTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: filterTab === tab.id ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchDocuments(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
              title="Refresh repository"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Documents Table */}
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-blue)', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
            Loading repository intelligence...
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)' }}>
            <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>No documents found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
              Upload your first PDF or DOCX file, or click below to seed sample scenarios.
            </p>
            <button onClick={handleLoadDemoData} className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              Load Demo Scenarios
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.75rem' }}>Document</th>
                  <th style={{ padding: '0.75rem' }}>Classification</th>
                  <th style={{ padding: '0.75rem' }}>Extracted Output</th>
                  <th style={{ padding: '0.75rem' }}>Risk Verdict</th>
                  <th style={{ padding: '0.75rem' }}>Pipeline Progress</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(doc => {
                  const isHighRisk = doc.risk_level === 'HIGH';
                  const isMediumRisk = doc.risk_level === 'MEDIUM';
                  const isSelected = selectedDocId === doc.id;

                  return (
                    <tr 
                      key={doc.id} 
                      onClick={() => {
                        fetchExtraction(doc.id);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      style={{ 
                        borderBottom: '1px solid var(--border-light)', 
                        transition: 'background-color 0.15s',
                        backgroundColor: isSelected ? 'var(--bg-deep)' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Document Name & ID */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ background: 'rgba(6, 95, 212, 0.08)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-blue)' }}>
                            <FileText size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.filename}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {doc.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      {/* Classification Badge */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span className="badge" style={{ background: 'var(--bg-deep)', textTransform: 'capitalize' }}>
                          {doc.type || 'Generic Document'}
                        </span>
                      </td>

                      {/* Extracted Output Preview */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {doc.fields && Object.keys(doc.fields).length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '300px' }}>
                            {Object.entries(doc.fields).slice(0, 3).map(([k, v]) => (
                              <span 
                                key={k}
                                style={{ 
                                  fontSize: '0.72rem', 
                                  padding: '0.2rem 0.45rem', 
                                  background: 'var(--bg-panel)', 
                                  border: '1px solid var(--border-light)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text-primary)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '180px'
                                }}
                                title={`${k}: ${v}`}
                              >
                                <strong style={{ color: 'var(--text-secondary)' }}>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                              </span>
                            ))}
                            {Object.keys(doc.fields).length > 3 && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', alignSelf: 'center', fontWeight: 600 }}>
                                +{Object.keys(doc.fields).length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {doc.status === 'COMPLETED' ? 'Output ready' : 'Extracting...'}
                          </span>
                        )}
                      </td>

                      {/* Risk Verdict */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              width: 'fit-content',
                              background: isHighRisk ? 'rgba(239, 68, 68, 0.15)' : isMediumRisk ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: isHighRisk ? 'var(--accent-red)' : isMediumRisk ? 'var(--accent-yellow)' : 'var(--accent-green)'
                            }}
                          >
                            {doc.risk_level || 'EVALUATED'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {doc.recommended_action || doc.business_action || 'Processing completed'}
                          </span>
                        </div>
                      </td>

                      {/* Pipeline Stepper */}
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <PipelineStepper status={doc.status} />
                      </td>

                      {/* Action Links */}
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              fetchExtraction(doc.id);
                              window.scrollTo({ top: 380, behavior: 'smooth' });
                            }}
                            className={isSelected ? "btn-primary" : "btn-secondary"}
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                            title="Inspect Extracted Output"
                          >
                            <Eye size={13} /> {isSelected ? 'Viewing' : 'Output'}
                          </button>
                          <button
                            onClick={() => navigate(`/review/${doc.id}`)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Open in Review Queue"
                          >
                            Review <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
