import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Server, Activity, Users, FileText, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Dashboard from './Dashboard';
import ReviewQueue from './ReviewQueue';
import PipelineMonitor from './PipelineMonitor';
import TraceExplorer from './TraceExplorer';
import ControlTower from './ControlTower';
import SemanticSearch from './SemanticSearch';
import AppLayout from '../components/layout/AppLayout';

export default function ShowcaseMode() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      id: 'intro',
      title: 'Platform Overview',
      subtitle: 'Enterprise Document Intelligence',
      desc: 'Welcome to the Algoleap Document Intelligence Platform. This walkthrough demonstrates our full-stack architecture, from AI extraction to operational telemetry.',
      route: '/',
      duration: 5000,
      icon: <Server size={32} />
    },
    {
      id: 'workspace',
      title: 'Document Workspace',
      subtitle: 'AI-Powered Extraction',
      desc: 'Our React Flow-based workspace allows human-in-the-loop validation, execution replays, and spatial layout analysis.',
      route: '/review/mock',
      duration: 6000,
      icon: <FileText size={32} />
    },
    {
      id: 'pipeline',
      title: 'Live Pipeline Monitor',
      subtitle: 'Real-time Telemetry',
      desc: 'Monitor distributed worker nodes and live execution streams processing documents at scale.',
      route: '/monitor',
      duration: 5000,
      icon: <Activity size={32} />
    },
    {
      id: 'trace',
      title: 'Distributed Tracing',
      subtitle: 'OpenTelemetry Visualization',
      desc: 'Deep inspection into system latency, retries, and AI model inference times.',
      route: '/trace/JOB-9021',
      duration: 6000,
      icon: <Server size={32} />
    },
    {
      id: 'operations',
      title: 'SRE Control Tower',
      subtitle: 'Unified Operations',
      desc: 'The nerve center for SREs. Manage Dead Letter Queues, SOC alerts, Compliance, and Cost Intelligence all in one place.',
      route: '/operations',
      duration: 7000,
      icon: <Users size={32} />
    },
    {
      id: 'chat',
      title: 'AI Copilot',
      subtitle: 'RAG Knowledge Graph',
      desc: 'Query the entire indexed enterprise corpus using semantic search and large language models.',
      component: <SemanticSearch />,
      duration: 5000,
      icon: <Bot size={32} />
    }
  ];

  // Map route strings from earlier draft to actual components for rendering
  steps[0].component = <Dashboard />;
  steps[1].component = <ReviewQueue />;
  steps[2].component = <PipelineMonitor />;
  steps[3].component = <TraceExplorer />; // Note: trace explorer usually needs an ID, we'll just render it as is
  steps[4].component = <ControlTower />;

  useEffect(() => {
    if (!isPlaying) return;

    if (step < steps.length) {
      const currentStep = steps[step];
      const timer = setTimeout(() => {
        setStep(s => s + 1);
      }, currentStep.duration);
      
      return () => clearTimeout(timer);
    } else {
      setIsPlaying(false);
    }
  }, [step, isPlaying]);

  const currentStepData = steps[step] || steps[steps.length - 1];

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      
      {/* Background App Rendering */}
      <AppLayout>
        {currentStepData.component}
      </AppLayout>

      {/* Overlay Showcase UI */}
      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--accent-purple)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            width: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(187,134,252,0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ color: 'var(--accent-purple)' }}>{currentStepData.icon}</div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{currentStepData.subtitle}</div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>{currentStepData.title}</h3>
              </div>
            </div>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {currentStepData.desc}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {steps.map((s, i) => (
                <div key={s.id} style={{ 
                  width: '30px', height: '4px', borderRadius: '2px', 
                  background: i === step ? 'var(--accent-purple)' : i < step ? 'rgba(187,134,252,0.3)' : 'var(--bg-deep)'
                }}>
                  {i === step && isPlaying && (
                    <motion.div 
                      initial={{ width: '0%' }} 
                      animate={{ width: '100%' }} 
                      transition={{ duration: s.duration / 1000, ease: 'linear' }}
                      style={{ height: '100%', background: 'var(--accent-purple)', borderRadius: '2px' }} 
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {Math.min(step + 1, steps.length)} / {steps.length}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-deep)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ background: 'var(--accent-purple)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button 
          onClick={() => {
            if (step < steps.length - 1) {
              setStep(s => s + 1);
            } else {
              window.location.href = '/';
            }
          }}
          style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {step >= steps.length - 1 ? <X size={18} /> : <SkipForward size={18} />}
        </button>
      </div>
      </div>
    </div>
  );
}
