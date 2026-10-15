import React, { useState, useEffect } from 'react';
import { 
  Folder, Filter, Tag, Check, X, AlertTriangle, FileText, 
  Clock, Search, ShieldAlert, Activity, MessageSquare, List,
  ZoomIn, ZoomOut, RotateCw, Maximize, Eye, LayoutGrid, Terminal,
  Play
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewQueue({ documentId, isMultiWindow }) {
  const navigate = useNavigate();
  const params = useParams();
  const id = documentId || params.id || 'demo-inv-2026';
  
  const [extractedData, setExtractedData] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rightTab, setRightTab] = useState('entities');
  const [secureMode, setSecureMode] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hello. I'm your AI Copilot. You can ask me to explain this document, compare it to past invoices, or detect anomalies." }
  ]);
  
  // Execution Replay State
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(6); // Assume all 6 steps complete initially
  const [isPlaying, setIsPlaying] = useState(false);
  
  const executionSteps = [
    { id: 1, name: 'Upload', status: 'success', time: '10:42:01', duration: '145ms', system: 'Gateway API' },
    { id: 2, name: 'OCR', status: 'success', time: '10:42:02', duration: '1.2s', system: 'Tesseract/Vision' },
    { id: 3, name: 'Classification', status: 'success', time: '10:42:03', duration: '200ms', system: 'BERT-base' },
    { id: 4, name: 'Extraction', status: 'success', time: '10:42:04', duration: '850ms', system: 'Claude 3.5' },
    { id: 5, name: 'Risk Analysis', status: 'warning', time: '10:42:05', duration: '400ms', system: 'Rules Engine' },
    { id: 6, name: 'Human Review', status: 'pending', time: '10:42:06', duration: '-', system: 'User (You)' }
  ];

  useEffect(() => {
    let interval;
    if (isPlaying && currentStep < executionSteps.length) {
      interval = setInterval(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500 / playbackSpeed);
    } else if (currentStep >= executionSteps.length) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, playbackSpeed]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': token ? `Bearer ${token}` : '' };

        const extRes = await fetch(`/api/v1/documents/${id}/extraction`, { headers });
        if (extRes.ok) {
          const data = await extRes.json();
          if (data.executive_summary) {
            setExecutiveSummary(data.executive_summary);
            delete data.executive_summary;
          }
          setExtractedData(data);
        } else {
          setExtractedData({
            fields: {
              invoice_number: "INV-1004",
              vendor_name: "Acme Corp",
              total_amount: "1250.00",
              date: "2026-06-24",
              tax_amount: "100.00"
            }
          });
          setExecutiveSummary({
            risk_level: 'HIGH',
            recommended_action: 'Escalate to Finance',
            reasoning: 'Anomalous vendor spend detected. Amount is 30% higher than historical average.'
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newMsg = { role: 'user', text: chatInput };
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
    
    // Mock AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: `Based on the extracted entities, the total amount of 1250.00 is significantly higher than the usual 800.00 seen for Acme Corp. This triggered the HIGH risk flag.` 
      }]);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          style={{ width: '48px', height: '48px', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', marginBottom: '1.5rem' }}
        />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Initializing Workspace</h2>
        <p>Loading AI models and connecting to live stream...</p>
      </div>
    );
  }

  const isHighRisk = executiveSummary?.risk_level === 'HIGH';
  const isMediumRisk = executiveSummary?.risk_level === 'MEDIUM';
  let accentColor = 'var(--accent-green)';
  if (isHighRisk) accentColor = 'var(--accent-red)';
  else if (isMediumRisk) accentColor = 'var(--accent-yellow)';

  return (
    <div style={{ height: isMultiWindow ? '100%' : 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
      
      {/* Top Toolbar */}
      <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isMultiWindow && (
            <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => navigate('/')}>
              <X size={18} />
            </button>
          )}
          {!isMultiWindow && <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>}
          <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--accent-blue)" /> doc_{id?.substring(0, 8)}
          </span>
          <span className="badge" style={{ background: `${accentColor}20`, color: accentColor }}>
            {executiveSummary?.risk_level} RISK
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: secureMode ? 'var(--accent-purple)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, borderRight: '1px solid var(--border-light)', paddingRight: '1rem' }}>
            <input type="checkbox" checked={secureMode} onChange={() => setSecureMode(!secureMode)} style={{ display: 'none' }} />
            <div style={{ width: '32px', height: '16px', background: secureMode ? 'var(--accent-purple)' : 'var(--bg-deep)', borderRadius: '16px', position: 'relative', transition: '0.3s' }}>
              <div style={{ width: '12px', height: '12px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: secureMode ? '18px' : '2px', transition: '0.3s' }}></div>
            </div>
            {secureMode ? 'Secure Mode ON' : 'Redaction OFF'}
          </label>
          <button className="btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} /> Escalate
          </button>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} /> Approve
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div style={{ display: 'flex', flex: 1, gap: '0.5rem', padding: '0 0.5rem', minHeight: 0 }}>
        
        {/* LEFT PANE: Tree & Filters (Hidden in Replay Mode if needed, but we keep it for now) */}
        <div className="glass-panel" style={{ width: '260px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Folder size={14} /> Explorer
            </h3>
            
            {/* Export Menu Mock */}
            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Enterprise Export">Export ▼</button>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <FileText size={16} color="var(--accent-blue)" />
              <span style={{ fontSize: '0.9rem' }}>Current Document</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
              <FileText size={16} />
              <span style={{ fontSize: '0.9rem' }}>Past Invoices (5)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
              <FileText size={16} />
              <span style={{ fontSize: '0.9rem' }}>Vendor Contracts (2)</span>
            </div>
          </div>
          
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Tag size={14} /> Tags
            </h3>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'var(--bg-deep)' }}>Finance</span>
            <span className="badge" style={{ background: 'var(--bg-deep)' }}>Q3 Review</span>
            <span className="badge" style={{ background: 'var(--bg-deep)' }}>Apex Global</span>
          </div>
        </div>

        {/* CENTER PANE: Document Viewer */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Viewer Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel)' }}>
            <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}><ZoomOut size={18} /></button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>100%</span>
            <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}><ZoomIn size={18} /></button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: 'auto 0' }}></div>
            <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}><RotateCw size={18} /></button>
            <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}><Maximize size={18} /></button>
          </div>
          
          {/* Document Canvas */}
          <div style={{ flex: 1, background: '#1e1e24', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ width: '60%', height: '85%', background: 'white', borderRadius: '4px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: '2rem', position: 'relative' }}
            >
              <div style={{ width: '30%', height: '24px', background: '#d0d0d0', marginBottom: '3rem' }}></div>
              <div style={{ width: '100%', height: '12px', background: '#e0e0e0', marginBottom: '0.75rem' }}></div>
              <div style={{ width: '100%', height: '12px', background: '#e0e0e0', marginBottom: '0.75rem' }}></div>
              <div style={{ width: '85%', height: '12px', background: '#e0e0e0', marginBottom: '3rem' }}></div>
              
              {/* Highlight Bounding Box */}
              <motion.div 
                animate={{ borderColor: ['rgba(0,229,255,0.4)', 'rgba(0,229,255,1)', 'rgba(0,229,255,0.4)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ border: `2px solid var(--accent-blue)`, background: secureMode ? '#000' : `rgba(0,229,255,0.1)`, padding: '1.5rem', marginBottom: '1.5rem', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: '-24px', left: '-2px', background: 'var(--accent-blue)', color: 'var(--bg-deep)', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px 4px 0 0' }}>
                  Total Amount (99%)
                </div>
                {secureMode ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16px', color: 'var(--accent-blue)', fontSize: '0.7rem', letterSpacing: '2px' }}>[REDACTED]</div>
                ) : (
                  <div style={{ width: '40%', height: '16px', background: 'rgba(0,0,0,0.2)' }}></div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT PANE: Tabs & Intelligence */}
        <div className="glass-panel" style={{ width: '380px', display: 'flex', flexDirection: 'column' }}>
          {/* Tab Headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
            {[
              { id: 'entities', icon: <List size={16}/>, label: 'Entities' },
              { id: 'chat', icon: <MessageSquare size={16}/>, label: 'Copilot' },
              { id: 'risk', icon: <ShieldAlert size={16}/>, label: 'Risk' },
              { id: 'timeline', icon: <Clock size={16}/>, label: 'Lineage' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                style={{
                  flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: rightTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                  borderBottom: rightTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', position: 'relative' }}>
            <AnimatePresence mode="wait">
              
              {/* ENTITIES TAB */}
              {rightTab === 'entities' && (
                <motion.div key="entities" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '1rem' }}>Extracted Fields (Step {currentStep})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: currentStep >= 4 ? 1 : 0.3 }}>
                    {extractedData?.fields && Object.entries(extractedData.fields).map(([key, value]) => (
                      <div key={key} className="hover-card" style={{ padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', position: 'relative' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</div>
                        <button style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <Eye size={16} className="hover-text-blue" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* COPILOT CHAT TAB */}
              {rightTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ 
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--bg-deep)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                        padding: '1rem', borderRadius: 'var(--radius-md)', maxWidth: '90%',
                        borderBottomRightRadius: msg.role === 'user' ? 0 : 'var(--radius-md)',
                        borderBottomLeftRadius: msg.role === 'ai' ? 0 : 'var(--radius-md)'
                      }}>
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleChatSubmit} style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask AI Copilot..." 
                      className="input-field"
                      style={{ paddingRight: '40px', background: 'var(--bg-deep)' }}
                    />
                    <button type="submit" style={{ position: 'absolute', right: '10px', top: '10px', background: 'transparent', border: 'none', color: 'var(--accent-purple)', cursor: 'pointer' }}>
                      <Search size={18} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* RISK TAB */}
              {rightTab === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div style={{ padding: '1.5rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', borderTop: `4px solid ${accentColor}`, marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '1rem' }}>Business Action Engine</h4>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Risk Profile</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: accentColor }}>{executiveSummary?.risk_level}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Action</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{executiveSummary?.recommended_action}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      {executiveSummary?.reasoning}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TIMELINE / REPLAY TAB */}
              {rightTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Execution Replay Controls */}
                  <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Execution Replay</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[0.5, 1, 2, 4].map(s => (
                          <button key={s} onClick={() => setPlaybackSpeed(s)} style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', background: playbackSpeed === s ? 'var(--accent-blue)' : 'var(--bg-panel)', color: playbackSpeed === s ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{s}x</button>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button 
                        onClick={() => {
                          if (currentStep >= executionSteps.length) setCurrentStep(0);
                          setIsPlaying(!isPlaying);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        {isPlaying ? <div style={{ width: '10px', height: '10px', background: 'white' }} /> : <Play size={16} fill="white" />}
                      </button>
                      
                      <div style={{ flex: 1, height: '4px', background: 'var(--bg-panel)', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent-blue)', width: `${(currentStep / executionSteps.length) * 100}%`, transition: 'width 0.3s' }}></div>
                      </div>
                      
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{currentStep} / {executionSteps.length}</span>
                    </div>
                  </div>

                  {/* Activity Timeline List */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {executionSteps.map((step, idx) => {
                      const isActive = idx < currentStep;
                      const isCurrent = idx === currentStep - 1;
                      let color = 'var(--text-muted)';
                      if (isActive) {
                        if (step.status === 'success') color = 'var(--accent-green)';
                        if (step.status === 'warning') color = 'var(--accent-yellow)';
                        if (step.status === 'pending') color = 'var(--accent-blue)';
                      }

                      return (
                        <div key={step.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', opacity: isActive ? 1 : 0.4 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: isCurrent ? `2px solid white` : 'none', boxShadow: isCurrent ? `0 0 10px ${color}` : 'none' }}></div>
                            {idx < executionSteps.length - 1 && <div style={{ width: '2px', flex: 1, background: isActive ? color : 'var(--border-light)', margin: '4px 0' }}></div>}
                          </div>
                          
                          <div style={{ flex: 1, background: isCurrent ? 'var(--bg-deep)' : 'transparent', padding: isCurrent ? '0.75rem' : '0', borderRadius: 'var(--radius-sm)', border: isCurrent ? '1px solid var(--border-light)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.time}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <span>System: {step.system}</span>
                              <span>{step.duration}</span>
                            </div>
                            
                            {/* State Snapshot for Current Step */}
                            {isCurrent && step.id === 4 && (
                              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#000', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-green)' }}>
                                {`{
  "vendor": "Acme Corp",
  "amount": 1250.00,
  "confidence": 0.98
}`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* BOTTOM PANE: Live Logs */}
      <div className="glass-panel" style={{ height: '140px', margin: '0 0.5rem 0.5rem 0.5rem', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={14} /> Pipeline Telemetry
        </h3>
        <div style={{ flex: 1, background: '#050505', borderRadius: '4px', padding: '0.75rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', color: '#00e676', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div>[10:42:01.002] INFO  gateway - Document uploaded via API (size: 2.4MB)</div>
          <div>[10:42:01.145] INFO  worker_pool - Assigned task to worker-node-4</div>
          <div>[10:42:02.833] INFO  ocr_engine - Tesseract extraction complete (Confidence: 98.2%)</div>
          <div>[10:42:03.112] INFO  classifier - Document classified as 'invoice' (Score: 0.99)</div>
          <div style={{ color: '#ffea00' }}>[10:42:04.550] WARN  risk_engine - Triggered rule: Vendor spend anomaly detected</div>
          <div>[10:42:05.201] INFO  embeddings - Vectors indexed into ElasticSearch (Chunks: 4)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', animation: 'pulse 1s infinite' }}></span> Waiting for human review...
          </div>
        </div>
      </div>

    </div>
  );
}
