import React, { useState, useEffect } from 'react';
import { Activity, FileText, Search, ShieldAlert, CheckCircle, Database } from 'lucide-react';

export default function Simulation() {
  const [stage, setStage] = useState(-1);
  const [isActive, setIsActive] = useState(false);

  const stages = [
    { name: 'Document Ingestion', icon: <FileText />, time: 1000 },
    { name: 'Computer Vision & OCR', icon: <Activity />, time: 3000 },
    { name: 'Machine Learning Classification', icon: <Database />, time: 2000 },
    { name: 'Entity Extraction Engine', icon: <Search />, time: 3000 },
    { name: 'Risk & Anomaly Detection', icon: <ShieldAlert />, time: 2500 },
    { name: 'Vector Search Indexing', icon: <Database />, time: 2000 },
    { name: 'Executive Summary Generation', icon: <CheckCircle />, time: 1500 }
  ];

  useEffect(() => {
    if (!isActive) return;
    
    let currentStage = 0;
    setStage(currentStage);
    let timerId = null;
    
    const runStage = () => {
      if (currentStage >= stages.length) {
        setIsActive(false);
        return;
      }
      
      const duration = stages[currentStage] ? stages[currentStage].time : 1000;
      timerId = setTimeout(() => {
        currentStage++;
        setStage(currentStage);
        runStage();
      }, duration);
    };
    
    runStage();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isActive]);

  const progressPercentage = Math.min(((stage) / stages.length) * 100, 100);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>Live Processing Engine</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Experience the end-to-end Document Intelligence pipeline in real-time.</p>
        
        <button 
          className="btn-primary" 
          style={{ marginTop: '2rem', fontSize: '1.2rem', padding: '1rem 2rem' }}
          onClick={() => setIsActive(true)}
          disabled={isActive || stage === stages.length}
        >
          {stage === stages.length ? "Simulation Complete" : isActive ? "Processing..." : "Start Simulation"}
        </button>
        
        {stage === stages.length && (
          <button 
            className="btn-secondary" 
            style={{ marginTop: '2rem', marginLeft: '1rem', fontSize: '1.2rem', padding: '1rem 2rem' }}
            onClick={() => { setStage(-1); setIsActive(false); }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ 
          position: 'absolute', top: 0, left: 0, height: '4px', background: 'var(--accent-blue)', 
          width: `${Math.max(0, progressPercentage)}%`, transition: 'width 0.5s ease-out' 
        }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {stages.map((s, idx) => {
            const isCompleted = stage > idx;
            const isCurrent = stage === idx;
            const isWaiting = stage < idx;
            
            let color = 'var(--text-muted)';
            if (isCompleted) color = 'var(--accent-green)';
            if (isCurrent) color = 'var(--accent-blue)';
            
            return (
              <div key={idx} style={{ 
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                padding: '1rem', borderRadius: 'var(--radius-md)',
                background: isCurrent ? 'rgba(0, 163, 255, 0.05)' : 'transparent',
                border: `1px solid ${isCurrent ? 'var(--accent-blue)' : 'transparent'}`,
                transition: 'all 0.3s ease',
                opacity: isWaiting ? 0.4 : 1
              }}>
                <div style={{ 
                  color: color, 
                  animation: isCurrent ? 'pulse 2s infinite' : 'none' 
                }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: color, fontSize: '1.2rem' }}>{s.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {isCompleted ? "Completed successfully" : isCurrent ? "Processing..." : "Waiting..."}
                  </div>
                </div>
                <div>
                  {isCompleted && <CheckCircle color="var(--accent-green)" size={20} />}
                  {isCurrent && <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
