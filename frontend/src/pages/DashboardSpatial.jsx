import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';

export default function DashboardSpatial() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    operational_health: { success_rate: '0%', queue_health: 'Healthy', avg_processing_time: '0s' },
    business_health: { documents_processed: 0, estimated_savings: '$0', review_reduction: '0%' },
    risk_health: { high_risk: 0, medium_risk: 0, compliance_alerts: 0 },
    total: 0,
    awaiting_review: 0,
    failed: 0,
    risk_distribution: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    document_types: {}
  });

  const [isSeeding, setIsSeeding] = useState(false);

  const fetchDocuments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && documents.length === 0) setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/documents', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
      
      const metRes = await fetch('/api/v1/dashboard/metrics', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (metRes.ok) {
        const metData = await metRes.json();
        setMetrics(metData);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  }, [documents.length]);

  useEffect(() => {
    fetchDocuments(true);
    const interval = setInterval(() => {
      fetchDocuments(false); // poll silently
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const getPipelineProgress = (status) => {
    if (status === 'UPLOADED') return 0;
    if (status === 'PROCESSING') return 0.5;
    if (status === 'OCR_COMPLETED') return 1;
    if (status === 'CLASSIFICATION_COMPLETED') return 2;
    if (status === 'EXTRACTION_COMPLETED') return 3;
    if (status === 'REVIEW_REQUIRED') return 3.5;
    if (status === 'COMPLETED') return 4;
    if (status === 'FAILED') return -1;
    return 0;
  };

  const PipelineStepper = ({ status }) => {
    const progress = getPipelineProgress(status);
    const stages = ['Upload', 'OCR', 'Classify', 'Extract', 'Done'];
    
    if (status === 'FAILED') {
      return <div style={{ color: 'var(--accent-red)', fontWeight: 500, fontSize: '0.85rem' }}>Pipeline Failed</div>;
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%', minWidth: '150px' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {stages.map((stage, idx) => {
            const isCompleted = progress >= idx;
            const isCurrent = Math.floor(progress) === idx || (progress === 3.5 && idx === 3);
            const isBlinking = isCurrent && !Number.isInteger(progress) && status !== 'REVIEW_REQUIRED';
            
            return (
              <React.Fragment key={stage}>
                <div 
                  title={stage}
                  style={{
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--accent-blue)' : 'var(--bg-deep)',
                    border: `2px solid ${isCompleted || isCurrent ? 'var(--accent-blue)' : 'var(--border-light)'}`,
                    boxShadow: isBlinking ? '0 0 8px var(--accent-blue)' : 'none',
                    animation: isBlinking ? 'pulse 1.5s infinite' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }} 
                />
                {idx < stages.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: progress > idx ? 'var(--accent-blue)' : 'var(--border-light)',
                    transition: 'all 0.3s ease'
                  }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>Start</span>
          <span style={{ color: status === 'REVIEW_REQUIRED' ? 'var(--accent-yellow)' : 'inherit' }}>
            {status === 'REVIEW_REQUIRED' ? 'Needs Review' : status.replace('_COMPLETED', '')}
          </span>
          <span>End</span>
        </div>
        <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; } }`}</style>
      </div>
    );
  };


  const handleLoadDemoData = async () => {
    setIsSeeding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/demo/seed', {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        fetchDocuments(true);
      } else {
        alert("Failed to load demo data.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsSeeding(false);
    }
  };


  // Styling for the panels
  const panelStyle = {
    width: '320px',
    padding: '1.5rem',
    pointerEvents: 'auto',
    backdropFilter: 'blur(12px)',
    background: 'var(--bg-panel)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid var(--border-light)',
    userSelect: 'none'
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40, padding: '2rem' }}>
      
      {/* Title / Header - Top Center */}
      <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto', width: '600px' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)', textShadow: '0 0 20px rgba(0,0,0,0.8)' }}>Executive Command Center</h1>
        <p style={{ color: 'var(--accent-blue)', margin: '0.5rem 0 1.5rem 0', fontSize: '1.1rem', textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>Real-time spatial intelligence</p>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-105 mx-auto" onClick={handleLoadDemoData} disabled={isSeeding} style={{ background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)', color: 'var(--text-primary)', boxShadow: '0 0 15px rgba(0, 102, 255, 0.3)' }}>
          {isSeeding ? "Loading Demo..." : "⚡ Load Demo Scenarios"}
        </button>
      </div>

      {/* Left Column */}
      <div style={{ position: 'absolute', top: '50%', left: '3rem', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Operational Health */}
        <div style={{ ...panelStyle, borderTop: '4px solid var(--accent-blue)' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Success Rate</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>{metrics.operational_health?.success_rate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Queue Status</span>
              <span style={{ fontWeight: 'bold', color: metrics.operational_health?.queue_health === 'Healthy' ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{metrics.operational_health?.queue_health}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Avg Processing</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{metrics.operational_health?.avg_processing_time}</span>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div style={{ width: '320px', pointerEvents: 'auto' }}>
           <UploadZone onUploadComplete={() => fetchDocuments(true)} />
        </div>
      </div>

      {/* Right Column */}
      <div style={{ position: 'absolute', top: '50%', right: '3rem', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Business Impact */}
        <div style={{ ...panelStyle, borderTop: '4px solid var(--accent-purple)' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Business Impact</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Processed</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{metrics.business_health?.documents_processed}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Savings</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>{metrics.business_health?.estimated_savings}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Review Reduction</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-purple)' }}>{metrics.business_health?.review_reduction}</span>
            </div>
          </div>
        </div>

        {/* Risk Overview */}
        <div style={{ ...panelStyle, borderTop: '4px solid var(--accent-red)' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Risk Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>High Risk</span>
              <span style={{ fontWeight: 'bold', color: metrics.risk_health?.high_risk > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{metrics.risk_health?.high_risk}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Medium Risk</span>
              <span style={{ fontWeight: 'bold', color: metrics.risk_health?.medium_risk > 0 ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>{metrics.risk_health?.medium_risk}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Compliance Alerts</span>
              <span style={{ fontWeight: 'bold', color: metrics.risk_health?.compliance_alerts > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{metrics.risk_health?.compliance_alerts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Findings (Recent Documents) - Bottom Center */}
      <div style={{ 
        position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
        width: '800px', 
        maxHeight: '280px', 
        overflowY: 'auto', 
        pointerEvents: 'auto',
        backdropFilter: 'blur(12px)',
        background: 'rgba(10, 10, 20, 0.7)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid var(--border-light)',
        padding: '1.5rem',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--accent-blue) transparent'
      }}>
        <h2 style={{ marginBottom: '1.5rem', marginTop: 0, fontSize: '1.4rem' }}>Recent Intelligence Findings</h2>
        
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading intelligence data...</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', opacity: 0.5, marginBottom: '0.5rem' }}>📥</div>
            <p style={{ color: 'var(--text-muted)' }}>No intelligence data available.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {documents.map(doc => {
              const isHighRisk = doc.risk_level === 'HIGH';
              const isMediumRisk = doc.risk_level === 'MEDIUM';
              let cardAccent = 'var(--border-light)';
              if (isHighRisk) cardAccent = 'var(--accent-red)';
              else if (isMediumRisk) cardAccent = 'var(--accent-yellow)';
              else if (doc.status === 'COMPLETED') cardAccent = 'var(--accent-green)';
              
              return (
                <div key={doc.id} className="glass-panel hover-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', borderTop: `3px solid ${cardAccent}`, background: 'var(--bg-panel)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className="badge" style={{ textTransform: 'capitalize', background: 'var(--bg-deep)', fontSize: '0.7rem' }}>
                      {doc.type || 'Document'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.id.substring(0, 8)}</span>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</h3>
                  
                  <div style={{ margin: '0.5rem 0', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Action</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: isHighRisk ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                      {doc.recommended_action || doc.business_action || 'Processing...'}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ marginBottom: '0.75rem', transform: 'scale(0.9)', transformOrigin: 'left' }}>
                      <PipelineStepper status={doc.status} />
                    </div>
                    <button 
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-105" 
                      style={{ background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)', color: 'var(--text-primary)', boxShadow: '0 0 15px rgba(0, 102, 255, 0.3)', width: '100%', fontSize: '0.8rem', justifyContent: 'center' }} 
                      onClick={() => navigate(`/review/${doc.id}`)}
                    >
                      Open
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
