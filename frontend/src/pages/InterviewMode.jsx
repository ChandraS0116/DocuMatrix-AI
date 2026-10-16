import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, ArrowLeft, RefreshCw, Eye, Code, Briefcase, Zap, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InterviewMode() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [viewMode, setViewMode] = useState('executive'); // 'executive' or 'technical'
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const steps = [
    { 
      id: 'intro',
      title: "Platform Overview", 
      execDesc: "Transform unstructured documents into actionable business intelligence.", 
      techDesc: "React/FastAPI monolith with distilBERT & Claude 3.5 extraction pipelines.",
      action: null 
    },
    { 
      id: 'ingestion',
      title: "Intelligent Ingestion", 
      execDesc: "Securely upload and digitize documents at scale.", 
      techDesc: "Chunked 8MB uploads with SHA-256 validation and async S3 storage.",
      action: { type: 'route', path: '/' }
    },
    { 
      id: 'workflow',
      title: "Visual Workflow Studio", 
      execDesc: "Drag-and-drop orchestration of AI models and human teams.", 
      techDesc: "React Flow canvas with Directed Acyclic Graph (DAG) state management.",
      action: { type: 'route', path: '/workflows' }
    },
    { 
      id: 'extraction',
      title: "Automated Data Extraction", 
      execDesc: "AI reads the document and extracts structured data with confidence scores.", 
      techDesc: "Tesseract OCR followed by LLM-based Named Entity Recognition (NER).",
      action: { type: 'route', path: '/review/mock-id', query: '?tab=entities' }
    },
    { 
      id: 'risk',
      title: "Business Action Engine", 
      execDesc: "Automatically detects anomalies and flags high-risk vendors.", 
      techDesc: "Heuristic rules engine checking historical baselines stored in PostgreSQL.",
      action: { type: 'route', path: '/review/mock-id', query: '?tab=risk' }
    },
    { 
      id: 'monitor',
      title: "Live Operations Monitor", 
      execDesc: "Real-time visibility into processing speeds, bottlenecks, and costs.", 
      techDesc: "Simulated WebSockets feeding a live React component array.",
      action: { type: 'route', path: '/monitor' }
    },
    { 
      id: 'search',
      title: "Semantic Intelligence", 
      execDesc: "Search across millions of documents using natural language.", 
      techDesc: "Vector embeddings generated via sentence-transformers stored in Elasticsearch.",
      action: { type: 'route', path: '/search' }
    }
  ];

  // Auto-play logic
  useEffect(() => {
    let timer;
    if (isAutoPlaying) {
      timer = setTimeout(() => {
        if (step < steps.length - 1) {
          handleNext();
        } else {
          setIsAutoPlaying(false);
        }
      }, 5000); // 5 seconds per slide
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, step]);

  const handleNext = () => {
    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    executeAction(steps[nextStep].action);
  };
  
  const handlePrev = () => {
    const prevStep = Math.max(step - 1, 0);
    setStep(prevStep);
    executeAction(steps[prevStep].action);
  };
  
  const handleRestart = () => {
    setStep(0);
    setIsAutoPlaying(false);
  };

  const executeAction = (action) => {
    if (action && action.type === 'route') {
       // In a real demo, we might dispatch an event to open an iframe or navigate. 
       // For this view, we'll keep it within the presenter screen to avoid losing state,
       // or we could show a preview image. We'll just update the visual representation below.
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Top Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, fontSize: '1.8rem' }}>
            <MonitorPlay color="var(--accent-blue)" /> Guided Demo Presenter
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Step {step + 1} of {steps.length} • {steps[step].title}</p>
        </div>
        
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-panel)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setViewMode('executive')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
              background: viewMode === 'executive' ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === 'executive' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <Briefcase size={16} /> Executive View
          </button>
          <button 
            onClick={() => setViewMode('technical')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer',
              background: viewMode === 'technical' ? 'var(--accent-blue)' : 'transparent',
              color: viewMode === 'technical' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <Code size={16} /> Technical View
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '3rem' }}>
        {steps.map((_, idx) => (
          <div key={idx} style={{ 
            flex: 1, height: '6px', borderRadius: '3px', cursor: 'pointer',
            background: idx < step ? 'var(--accent-blue)' : idx === step ? 'var(--accent-blue)' : 'var(--border-light)',
            transition: 'background 0.3s ease'
          }} onClick={() => setStep(idx)} />
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', gap: '2rem' }}>
        
        {/* Presenter Notes */}
        <div className="glass-panel" style={{ flex: 1, padding: '3rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={step + viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'var(--accent-blue)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
                {viewMode} Annotation
              </div>
              
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{steps[step].title}</h2>
              
              <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {viewMode === 'executive' ? steps[step].execDesc : steps[step].techDesc}
              </p>
              
              {/* Highlight Box for Technical View */}
              {viewMode === 'technical' && steps[step].action && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-blue)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Action: navigate("{steps[step].action.path}")
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live Preview / Screenshot Placeholder */}
        <div className="glass-panel" style={{ width: '400px', padding: '1rem', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
            <Eye size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Platform View</span>
          </div>
          
          <div style={{ flex: 1, border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', position: 'relative', overflow: 'hidden' }}>
             <Zap size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
             <p style={{ textAlign: 'center', padding: '0 2rem' }}>
               Visualizer active.<br/>In a live demo, this pane renders the actual route: <br/><strong style={{ color: 'var(--accent-blue)' }}>{steps[step].action?.path || '/'}</strong>
             </p>
             
             {/* Jump Button */}
             {steps[step].action && (
               <button 
                 onClick={() => navigate(steps[step].action.path)}
                 className="btn-primary" 
                 style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
               >
                 Jump to View
               </button>
             )}
          </div>
        </div>

      </div>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={handleRestart} disabled={step === 0}>
            <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Restart
          </button>
          <button className="btn-secondary" onClick={handlePrev} disabled={step === 0}>
            <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Previous
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            style={{ color: isAutoPlaying ? 'var(--accent-green)' : 'inherit', borderColor: isAutoPlaying ? 'var(--accent-green)' : 'var(--border-light)' }}
          >
            {isAutoPlaying ? 'Pause Auto-Play' : 'Auto-Play (5s)'}
          </button>
          <button className="btn-primary" onClick={handleNext} disabled={step === steps.length - 1}>
            Next Step <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
