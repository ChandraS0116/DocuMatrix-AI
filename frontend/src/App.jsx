import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkspaceManager = lazy(() => import('./pages/WorkspaceManager'));
const SemanticSearch = lazy(() => import('./pages/SemanticSearch'));
const Simulation = lazy(() => import('./pages/Simulation'));
const InterviewMode = lazy(() => import('./pages/InterviewMode'));
const SettingsCenter = lazy(() => import('./pages/SettingsCenter'));
const WorkflowDesigner = lazy(() => import('./pages/WorkflowDesigner'));
const PipelineMonitor = lazy(() => import('./pages/PipelineMonitor'));
const ControlTower = lazy(() => import('./pages/ControlTower'));
const TraceExplorer = lazy(() => import('./pages/TraceExplorer'));
const ShowcaseMode = lazy(() => import('./pages/ShowcaseMode'));
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));
const BillingDashboard = lazy(() => import('./pages/BillingDashboard'));
const PromptStudio = lazy(() => import('./pages/PromptStudio'));
const ReviewQueue = lazy(() => import('./pages/ReviewQueue'));
import DashboardSpatial from './pages/DashboardSpatial';

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', color: 'var(--accent-purple)' }}>Loading DocuMatrix...</div>}>
        <Routes>
          <Route path="/showcase" element={<ShowcaseMode />} />
          <Route path="*" element={
            <AppLayout>
              <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading module...</div>}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/spatial" element={<DashboardSpatial />} />
                  <Route path="/review/:id" element={<WorkspaceManager />} />
                  <Route path="/queue" element={<ReviewQueue />} />
                  <Route path="/search" element={<SemanticSearch />} />
                  <Route path="/graph" element={<KnowledgeGraph />} />
                  <Route path="/workflows" element={<WorkflowDesigner />} />
                  <Route path="/prompts" element={<PromptStudio />} />
                  <Route path="/billing" element={<BillingDashboard />} />
                  <Route path="/monitor" element={<PipelineMonitor />} />
                  <Route path="/operations" element={<ControlTower />} />
                  <Route path="/simulation" element={<Simulation />} />
                  <Route path="/trace/:id" element={<TraceExplorer />} />
                  <Route path="/demo/interview" element={<InterviewMode />} />
                  <Route path="/settings" element={<SettingsCenter />} />
                </Routes>
              </Suspense>
            </AppLayout>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
