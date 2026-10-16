import React, { useState } from 'react';
import { 
  Server, Cpu, Activity, ShieldAlert, DollarSign, Database, 
  GitMerge, Users, Zap, Terminal, CheckCircle, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components will be imported or defined below
import JobOrchestrationView from '../components/operations/JobOrchestrationView';
import CostIntelligenceView from '../components/operations/CostIntelligenceView';
import ModelGovernanceView from '../components/operations/ModelGovernanceView';
import SecurityOperationsView from '../components/operations/SecurityOperationsView';
import ComplianceCenterView from '../components/operations/ComplianceCenterView';
import IncidentManagementView from '../components/operations/IncidentManagementView';
import TenantAdminView from '../components/operations/TenantAdminView';
import PerformanceBenchmarksView from '../components/operations/PerformanceBenchmarksView';

export default function ControlTower() {
  const [activeTab, setActiveTab] = useState('jobs');

  const tabs = [
    { id: 'jobs', label: 'Job Orchestration', icon: <Server size={18} /> },
    { id: 'models', label: 'AI Governance', icon: <Cpu size={18} /> },
    { id: 'cost', label: 'Cost Intelligence', icon: <DollarSign size={18} /> },
    { id: 'security', label: 'Security (SOC)', icon: <ShieldAlert size={18} /> },
    { id: 'compliance', label: 'Compliance', icon: <CheckCircle size={18} /> },
    { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={18} /> },
    { id: 'tenants', label: 'Tenant Admin', icon: <Users size={18} /> },
    { id: 'benchmarks', label: 'Benchmarks', icon: <Zap size={18} /> },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'jobs': return <JobOrchestrationView />;
      case 'cost': return <CostIntelligenceView />;
      case 'models': return <ModelGovernanceView />;
      case 'security': return <SecurityOperationsView />;
      case 'compliance': return <ComplianceCenterView />;
      case 'incidents': return <IncidentManagementView />;
      case 'tenants': return <TenantAdminView />;
      case 'benchmarks': return <PerformanceBenchmarksView />;
      default: return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Terminal size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
          <p>This module is initialized and awaiting telemetry stream.</p>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', margin: '-2rem' }}>
      
      {/* SRE Navigation Sidebar */}
      <div style={{ 
        width: '260px', 
        background: 'var(--bg-panel)', 
        borderRight: '1px solid var(--border-light)',
        display: 'flex', 
        flexDirection: 'column',
        padding: '1.5rem 1rem'
      }}>
        <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', marginBottom: '0.5rem' }}>
            Operations & SRE
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="var(--accent-blue)" /> Control Tower
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                background: activeTab === tab.id ? 'var(--bg-deep)' : 'transparent',
                border: activeTab === tab.id ? '1px solid var(--border-light)' : '1px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <div style={{ color: activeTab === tab.id ? 'var(--accent-blue)' : 'inherit' }}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Global Status</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>All Systems Go</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Active Alerts</span>
            <span style={{ color: 'var(--text-primary)' }}>0</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg-deep)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
