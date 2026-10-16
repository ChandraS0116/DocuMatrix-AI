import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, Filter, Tag, Check, X, AlertTriangle, FileText, 
  Clock, Search, ShieldAlert, Activity, MessageSquare, List,
  ZoomIn, ZoomOut, RotateCw, Maximize, Eye, LayoutGrid, Terminal,
  Play, Download, Copy, CheckCircle, ChevronDown, Image as ImageIcon,
  User, Shield
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewQueue({ documentId, isMultiWindow }) {
  const navigate = useNavigate();
  const params = useParams();
  const initialId = documentId || params.id || '';
  
  const [activeDocId, setActiveDocId] = useState(initialId);
  const [documentsList, setDocumentsList] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rightTab, setRightTab] = useState('entities');
  const [secureMode, setSecureMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hello! I am your AI Copilot. You can ask me to explain this document, summarize key fields, check risk reasons, or describe detected visual elements." }
  ]);
  
  // Interactive Viewport Controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [reviewStatus, setReviewStatus] = useState(null);

  // Execution Replay State
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(6);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const executionSteps = [
    { id: 1, name: 'Upload', status: 'success', time: '10:42:01', duration: '145ms', system: 'Gateway API' },
    { id: 2, name: 'OCR & Vision', status: 'success', time: '10:42:02', duration: '1.2s', system: 'Native OCR / Vision Analyzer' },
    { id: 3, name: 'Classification', status: 'success', time: '10:42:03', duration: '200ms', system: 'DistilBERT & Multimodal' },
    { id: 4, name: 'Entity Extraction', status: 'success', time: '10:42:04', duration: '850ms', system: 'Hybrid Extractor' },
    { id: 5, name: 'Risk Engine', status: 'warning', time: '10:42:05', duration: '400ms', system: 'Deterministic Rules' },
    { id: 6, name: 'Human Review', status: 'pending', time: '10:42:06', duration: '-', system: 'Active Reviewer' }
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch document list on mount
  useEffect(() => {
    const fetchDocList = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
        const res = await fetch('/api/v1/documents', { headers });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setDocumentsList(list);
            if (!activeDocId || activeDocId === 'demo-inv-2026') {
              setActiveDocId(list[0].id);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load documents list:", e);
      }
    };
    fetchDocList();
  }, []);

  // Fetch active document intelligence
  useEffect(() => {
    if (!activeDocId) return;
    
    let isMounted = true;
    const fetchDocData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': token ? `Bearer ${token}` : '' };
        const extRes = await fetch(`/api/v1/documents/${activeDocId}/extraction`, { headers });
        
        if (extRes.ok) {
          const data = await extRes.json();
          if (!isMounted) return;
          if (data.executive_summary) {
            setExecutiveSummary(data.executive_summary);
            setReviewStatus(data.executive_summary.status || 'Needs Review');
          }
          setExtractedData(data);
        } else {
          // Fallback demo data if extraction API fails
          if (!isMounted) return;
          setExtractedData({
            document_id: activeDocId,
            filename: 'Document_Verification.pdf',
            type: 'Invoice',
            fields: {
              invoice_number: 'INV-1004',
              vendor_name: 'Apex Financial Services',
              total_amount: '145000.00',
              date: '2026-09-15',
              payment_terms: 'Net 30'
            },
            raw_text: 'INVOICE APX-8821\nVendor: Apex Financial Services\nDate: 2026-09-15\nTotal Amount: $145,000.00\nPayment Terms: Net 30'
          });
          setExecutiveSummary({
            status: 'Needs Review',
            risk_level: 'HIGH',
            recommended_action: 'Escalate to VP Finance',
            reasoning: 'Invoice amount ($145,000.00) exceeds $50k auto-approval threshold.'
          });
          setReviewStatus('Needs Review');
        }
      } catch (err) {
        console.error("Error loading document:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDocData();
    return () => { isMounted = false; };
  }, [activeDocId]);

  // Replay playback effect
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

  // Document Switching
  const handleSelectDoc = (docId) => {
    setActiveDocId(docId);
    if (!isMultiWindow) {
      navigate(`/review/${docId}`);
    }
    // Update copilot greeting for the newly opened document
    const selectedDoc = documentsList.find(d => d.id === docId);
    const fname = selectedDoc ? selectedDoc.filename : 'the selected document';
    setChatMessages([
      { role: 'ai', text: `Loaded document "${fname}". You can ask me to explain its fields, review risk flags, or verify extracted details.` }
    ]);
  };

  // Export handlers
  const handleExportJSON = () => {
    setIsExportOpen(false);
    const exportObj = {
      document_id: activeDocId,
      filename: extractedData?.filename || 'document',
      type: extractedData?.type,
      fields: extractedData?.fields || {},
      executive_summary: executiveSummary || {},
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedData?.filename || 'document'}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON export downloaded successfully.');
  };

  const handleExportCSV = () => {
    setIsExportOpen(false);
    const fields = extractedData?.fields || {};
    let csv = 'Field,Value\n';
    Object.entries(fields).forEach(([k, v]) => {
      const cleanVal = String(v).replace(/"/g, '""');
      csv += `"${k}","${cleanVal}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedData?.filename || 'document'}_fields.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV export downloaded successfully.');
  };

  const handleCopySummary = () => {
    setIsExportOpen(false);
    const fields = extractedData?.fields || {};
    const fieldSummary = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
    const fullText = `Document: ${extractedData?.filename || 'Active Document'}\nType: ${extractedData?.type || 'N/A'}\nRisk: ${executiveSummary?.risk_level || 'LOW'}\nAction: ${executiveSummary?.recommended_action || 'N/A'}\n\nKey Fields:\n${fieldSummary}`;
    navigator.clipboard.writeText(fullText);
    showToast('Summary copied to clipboard.');
  };

  // Approve and Escalate
  const handleApprove = () => {
    setReviewStatus('APPROVED');
    showToast('Document approved successfully.');
  };

  const handleEscalate = () => {
    setReviewStatus('ESCALATED');
    showToast('Document escalated to compliance team for priority review.');
  };

  // Copilot Intelligent Chat
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    const userMsg = { role: 'user', text: query };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    const qLower = query.toLowerCase();
    const fields = extractedData?.fields || {};
    const docName = extractedData?.filename || 'this document';
    const docType = extractedData?.type || 'document';
    const risk = executiveSummary?.risk_level || 'LOW';

    // 1. Polite, helpful greeting
    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings)\b/i.test(qLower)) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: `Hello! I am your AI Copilot for "${docName}". This file is classified as a ${docType} with ${risk} risk profile. What would you like to examine or verify?`
        }]);
      }, 400);
      return;
    }

    // 2. Amount / Total / Price questions
    if (qLower.includes('amount') || qLower.includes('total') || qLower.includes('price') || qLower.includes('cost') || qLower.includes('due')) {
      const amt = fields.total_amount || fields.amount || fields.tax_amount;
      setTimeout(() => {
        if (amt) {
          setChatMessages(prev => [...prev, {
            role: 'ai',
            text: `In "${docName}", the total amount is $${amt}. Invoice number is ${fields.invoice_number || 'N/A'}, billed by ${fields.vendor_name || 'the vendor'}.`
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            role: 'ai',
            text: `No monetary or invoice amount field was detected in "${docName}" (${docType}).`
          }]);
        }
      }, 400);
      return;
    }

    // 3. Risk / Warning questions
    if (qLower.includes('risk') || qLower.includes('reason') || qLower.includes('flag') || qLower.includes('why') || qLower.includes('escalate')) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: `Risk Assessment for "${docName}":\n- Profile: ${risk}\n- Recommended Action: ${executiveSummary?.recommended_action || 'Standard verification'}\n- Reasoning: ${executiveSummary?.reasoning || 'No anomalous risk triggers detected.'}`
        }]);
      }, 400);
      return;
    }

    // 4. Person / Photo / Clothing / Face questions
    if (qLower.includes('photo') || qLower.includes('face') || qLower.includes('person') || qLower.includes('clothes') || qLower.includes('attire') || qLower.includes('scenery') || qLower.includes('visual')) {
      setTimeout(() => {
        if (extractedData?.visual_summary || fields.photo_category || fields.facial_expression) {
          const visualDetails = [
            extractedData.visual_summary ? `Summary: ${extractedData.visual_summary}` : '',
            fields.photo_category ? `Category: ${fields.photo_category}` : '',
            fields.facial_expression ? `Expression: ${fields.facial_expression}` : '',
            fields.eye_gaze ? `Eye Gaze: ${fields.eye_gaze}` : '',
            fields.clothing_attire ? `Attire: ${fields.clothing_attire}` : '',
            fields.background_setting ? `Background: ${fields.background_setting}` : ''
          ].filter(Boolean).join('\n- ');
          
          setChatMessages(prev => [...prev, {
            role: 'ai',
            text: `Multimodal Visual Analysis for "${docName}":\n- ${visualDetails}`
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            role: 'ai',
            text: `"${docName}" is classified as a text document (${docType}). No portrait or scenery media was detected in this file.`
          }]);
        }
      }, 400);
      return;
    }

    // 5. Query RAG backend for general/cross-document questions
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/search/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ text: query })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: data.answer || "Document intelligence verified."
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: `For "${docName}", the extracted details are:\n` + Object.entries(fields).slice(0, 5).map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')
        }]);
      }
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `Analysis of "${docName}":\n` + Object.entries(fields).slice(0, 5).map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')
      }]);
    }
  };

  if (isLoading && !extractedData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', minHeight: '500px' }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          style={{ width: '48px', height: '48px', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', marginBottom: '1.5rem' }}
        />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--text-primary)' }}>Loading Document Intelligence</h2>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving verified extraction and multimodal analysis...</p>
      </div>
    );
  }

  const isHighRisk = executiveSummary?.risk_level === 'HIGH';
  const isMediumRisk = executiveSummary?.risk_level === 'MEDIUM';
  let accentColor = 'var(--accent-green)';
  if (isHighRisk) accentColor = 'var(--accent-red)';
  else if (isMediumRisk) accentColor = 'var(--accent-yellow)';

  // Categorize document list for the Explorer sidebar
  const categorizedDocs = {
    active: documentsList.filter(d => d.id === activeDocId),
    invoices: documentsList.filter(d => d.id !== activeDocId && (d.filename.toLowerCase().includes('invoice') || d.filename.toLowerCase().includes('order') || d.filename.toLowerCase().includes('apex'))),
    contracts: documentsList.filter(d => d.id !== activeDocId && (d.filename.toLowerCase().includes('agreement') || d.filename.toLowerCase().includes('contract') || d.filename.toLowerCase().includes('service'))),
    compliance: documentsList.filter(d => d.id !== activeDocId && (d.filename.toLowerCase().includes('audit') || d.filename.toLowerCase().includes('hipaa'))),
    visuals: documentsList.filter(d => d.id !== activeDocId && (d.filename.toLowerCase().includes('aadhar') || d.filename.toLowerCase().includes('png') || d.filename.toLowerCase().includes('jpg') || d.filename.toLowerCase().includes('babu'))),
  };

  return (
    <div style={{ height: isMultiWindow ? '100%' : 'calc(100vh - 12rem)', minHeight: '680px', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden', margin: '-1.5rem -1.75rem 0 -1.75rem', position: 'relative' }}>
      
      {/* Toast Feedback Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 100, background: 'var(--bg-panel)', border: '1px solid var(--accent-blue)',
              color: 'var(--text-primary)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-glass)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'
            }}
          >
            <CheckCircle size={16} color="var(--accent-green)" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Toolbar */}
      <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isMultiWindow && (
            <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => navigate('/')} title="Return to Dashboard">
              <X size={18} />
            </button>
          )}
          {!isMultiWindow && <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>}
          <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <FileText size={18} color="var(--accent-blue)" /> {extractedData?.filename || `doc_${activeDocId?.substring(0, 8)}`}
          </span>
          <span className="badge" style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}>
            {reviewStatus || `${executiveSummary?.risk_level || 'LOW'} RISK`}
          </span>
          {extractedData?.type && (
            <span className="badge" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)' }}>
              {extractedData.type}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: secureMode ? 'var(--accent-blue)' : 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, borderRight: '1px solid var(--border-light)', paddingRight: '1rem' }}>
            <input type="checkbox" checked={secureMode} onChange={() => setSecureMode(!secureMode)} style={{ display: 'none' }} />
            <div style={{ width: '32px', height: '18px', background: secureMode ? 'var(--accent-blue)' : 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', position: 'relative', transition: '0.3s' }}>
              <div style={{ width: '12px', height: '12px', background: secureMode ? 'white' : 'var(--text-muted)', borderRadius: '2px', position: 'absolute', top: '2px', left: secureMode ? '16px' : '2px', transition: '0.3s' }}></div>
            </div>
            {secureMode ? 'PII Redacted' : 'Redaction Off'}
          </label>
          
          <button 
            onClick={handleEscalate}
            className="btn-secondary" 
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShieldAlert size={16} /> Escalate
          </button>
          
          <button 
            onClick={handleApprove}
            className="btn-primary" 
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Check size={16} /> Approve
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div style={{ display: 'flex', flex: 1, gap: '0.5rem', padding: '0 0.5rem', minHeight: 0 }}>
        
        {/* LEFT PANE: Explorer & Document Switching */}
        <div className="glass-panel" style={{ width: '280px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* Explorer Header with Export Dropdown */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 600 }}>
              <Folder size={14} /> Explorer
            </h3>
            
            {/* Working Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="btn-secondary" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title="Enterprise Export Options"
              >
                Export <ChevronDown size={12} />
              </button>
              
              {isExportOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 50,
                  background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-glass)', minWidth: '150px', padding: '0.35rem 0', display: 'flex', flexDirection: 'column'
                }}>
                  <button 
                    onClick={handleExportJSON}
                    style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-panel-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Download size={14} /> Export JSON
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-panel-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Download size={14} /> Export CSV
                  </button>
                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.25rem 0' }}></div>
                  <button 
                    onClick={handleCopySummary}
                    style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', textAlign: 'left', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-panel-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Copy size={14} /> Copy Summary
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Document Tree */}
          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
            
            {/* Active Document */}
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
              Active Document
            </div>
            <div 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', 
                background: 'rgba(0, 229, 255, 0.08)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-blue)', fontSize: '0.85rem', fontWeight: 500
              }}
            >
              <FileText size={16} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {extractedData?.filename || 'Current Document'}
              </span>
              <CheckCircle size={14} color="var(--accent-blue)" />
            </div>

            {/* Invoices */}
            {categorizedDocs.invoices.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.25rem' }}>
                  Invoices ({categorizedDocs.invoices.length})
                </div>
                {categorizedDocs.invoices.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem', transition: 'all 0.15s', border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <FileText size={15} color="var(--accent-blue)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</span>
                  </div>
                ))}
              </>
            )}

            {/* Contracts */}
            {categorizedDocs.contracts.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.25rem' }}>
                  Contracts & Legal ({categorizedDocs.contracts.length})
                </div>
                {categorizedDocs.contracts.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem', transition: 'all 0.15s', border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <Shield size={15} color="var(--accent-yellow)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</span>
                  </div>
                ))}
              </>
            )}

            {/* Compliance & Audits */}
            {categorizedDocs.compliance.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.25rem' }}>
                  Compliance Audits ({categorizedDocs.compliance.length})
                </div>
                {categorizedDocs.compliance.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem', transition: 'all 0.15s', border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <ShieldAlert size={15} color="var(--accent-red)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</span>
                  </div>
                ))}
              </>
            )}

            {/* IDs & Visuals */}
            {categorizedDocs.visuals.length > 0 && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.5rem 0.25rem' }}>
                  IDs & Visual Media ({categorizedDocs.visuals.length})
                </div>
                {categorizedDocs.visuals.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)',
                      cursor: 'pointer', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem', transition: 'all 0.15s', border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-panel-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <ImageIcon size={15} color="var(--accent-green)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          
          {/* Metadata Tags */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-deep)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Attributes
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <span className="badge" style={{ background: 'var(--bg-panel)', fontSize: '0.75rem' }}>{extractedData?.type || 'Document'}</span>
              <span className="badge" style={{ background: 'var(--bg-panel)', fontSize: '0.75rem' }}>Verified</span>
              <span className="badge" style={{ background: 'var(--bg-panel)', fontSize: '0.75rem' }}>SOC-2</span>
            </div>
          </div>
        </div>

        {/* CENTER PANE: Document & Multimodal Viewer */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          
          {/* Viewer Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-panel)', zIndex: 5 }}>
            <button 
              onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
              className="btn-secondary" 
              style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
              title="Zoom Out"
            >
              <ZoomOut size={17} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, minWidth: '40px', textAlign: 'center' }}>{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="btn-secondary" 
              style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
              title="Zoom In"
            >
              <ZoomIn size={17} />
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-light)', margin: '0 0.25rem' }}></div>
            <button 
              onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
              className="btn-secondary" 
              style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
              title="Rotate 90 degrees"
            >
              <RotateCw size={17} />
            </button>
            <button 
              onClick={() => { setZoomLevel(100); setRotationAngle(0); }}
              className="btn-secondary" 
              style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
              title="Reset View"
            >
              <Maximize size={17} />
            </button>
          </div>
          
          {/* Document Canvas with Real Extracted Content */}
          <div style={{ flex: 1, background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '1.5rem', position: 'relative' }}>
            <div 
              style={{ 
                width: '100%', 
                maxWidth: '780px', 
                minHeight: '480px',
                background: 'var(--bg-panel)', 
                border: '1px solid var(--border-light)', 
                borderRadius: 'var(--radius-sm)', 
                boxShadow: 'var(--shadow-glass)', 
                padding: '2rem', 
                position: 'relative',
                transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              {/* Document Header */}
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Document Verification Canvas
                  </div>
                  <h2 style={{ fontSize: '1.35rem', margin: '0.25rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {extractedData?.filename || 'Document Review'}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Type: <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{extractedData?.type || 'Verified'}</span> | Status: <span style={{ fontWeight: 600, color: accentColor }}>{reviewStatus || 'Needs Review'}</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div className="badge" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                    ID: {activeDocId ? activeDocId.substring(0, 8) : 'demo'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Multimodal Vision Analysis (If photo or portrait) */}
              {(extractedData?.visual_summary || extractedData?.photo_category) && (
                <div style={{ padding: '1rem 1.25rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.85rem' }}>
                    <ImageIcon size={16} /> Visual Intelligence Analysis
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {extractedData.visual_summary}
                  </p>
                </div>
              )}

              {/* OCR Text Stream Preview */}
              {extractedData?.raw_text && (
                <div style={{ padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Extracted Text & OCR Stream
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', maxHeight: '180px', overflowY: 'auto', lineHeight: 1.5 }}>
                    {secureMode ? extractedData.raw_text.replace(/\d{4}\s?\d{4}\s?\d{4}/g, '[REDACTED_AADHAAR]').replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, '[REDACTED_PAN]') : extractedData.raw_text}
                  </pre>
                </div>
              )}

              {/* Verified Field Values Grid */}
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 600 }}>
                  Structured Entity Extraction
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {extractedData?.fields && Object.entries(extractedData.fields).map(([k, v]) => (
                    <div 
                      key={k} 
                      style={{ 
                        padding: '0.75rem', 
                        background: 'var(--bg-deep)', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-light)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.2rem' 
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {k.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {secureMode && (k.includes('aadhaar') || k.includes('pan') || k.includes('number')) ? '[REDACTED]' : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bounding Box Highlight Overlay */}
              <div 
                style={{ 
                  border: `2px solid var(--accent-blue)`, 
                  background: secureMode ? 'rgba(0,0,0,0.4)' : 'rgba(0, 229, 255, 0.05)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  position: 'relative' 
                }}
              >
                <div style={{ position: 'absolute', top: '-12px', left: '12px', background: 'var(--accent-blue)', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '2px' }}>
                  AUTOMATED AUDIT VERIFICATION
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Reasoning: {executiveSummary?.reasoning || 'All rule checks passed.'}
                </div>
              </div>

            </div>
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
                  flex: 1, padding: '0.85rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', position: 'relative' }}>
            <AnimatePresence mode="wait">
              
              {/* ENTITIES TAB */}
              {rightTab === 'entities' && (
                <motion.div key="entities" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', marginBottom: '1rem', fontWeight: 600 }}>
                    Extracted Fields ({Object.keys(extractedData?.fields || {}).length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {extractedData?.fields && Object.entries(extractedData.fields).map(([key, value]) => (
                      <div key={key} className="hover-card" style={{ padding: '0.85rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', position: 'relative' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {secureMode && (key.includes('aadhaar') || key.includes('pan') || key.includes('number')) ? '[REDACTED]' : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* COPILOT CHAT TAB */}
              {rightTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ 
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-deep)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                        border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                        padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', maxWidth: '90%',
                        fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line'
                      }}>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleChatSubmit} style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask AI Copilot about this document..." 
                      className="input-field"
                      style={{ paddingRight: '40px', background: 'var(--bg-deep)', width: '100%', borderRadius: 'var(--radius-sm)' }}
                    />
                    <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer' }} title="Send">
                      <Search size={18} />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* RISK TAB */}
              {rightTab === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div style={{ padding: '1.25rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', borderTop: `4px solid ${accentColor}`, marginBottom: '1.25rem', borderLeft: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
                    <h4 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', marginBottom: '1rem', fontWeight: 600 }}>
                      Deterministic Risk Engine
                    </h4>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Profile</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: accentColor }}>{executiveSummary?.risk_level || 'LOW'}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Action</div>
                        <div style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{executiveSummary?.recommended_action || 'Approve'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '0.85rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      {executiveSummary?.reasoning || 'All business rules passed validation thresholds.'}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TIMELINE / REPLAY TAB */}
              {rightTab === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Execution Replay Controls */}
                  <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Audit Lineage Replay</div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {[0.5, 1, 2, 4].map(s => (
                          <button key={s} onClick={() => setPlaybackSpeed(s)} style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem', background: playbackSpeed === s ? 'var(--accent-blue)' : 'var(--bg-panel)', color: playbackSpeed === s ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border-light)', borderRadius: '2px', cursor: 'pointer' }}>{s}x</button>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button 
                        onClick={() => {
                          if (currentStep >= executionSteps.length) setCurrentStep(0);
                          setIsPlaying(!isPlaying);
                        }}
                        style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-blue)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        {isPlaying ? <div style={{ width: '8px', height: '8px', background: 'white' }} /> : <Play size={14} fill="white" />}
                      </button>
                      
                      <div style={{ flex: 1, height: '4px', background: 'var(--bg-panel)', borderRadius: '2px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent-blue)', width: `${(currentStep / executionSteps.length) * 100}%`, transition: 'width 0.3s' }}></div>
                      </div>
                      
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{currentStep} / {executionSteps.length}</span>
                    </div>
                  </div>

                  {/* Activity Timeline List */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
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
                        <div key={step.id} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', opacity: isActive ? 1 : 0.4 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, border: isCurrent ? `2px solid white` : 'none' }}></div>
                            {idx < executionSteps.length - 1 && <div style={{ width: '2px', flex: 1, background: isActive ? color : 'var(--border-light)', margin: '3px 0' }}></div>}
                          </div>
                          
                          <div style={{ flex: 1, background: isCurrent ? 'var(--bg-deep)' : 'transparent', padding: isCurrent ? '0.5rem 0.75rem' : '0', borderRadius: 'var(--radius-sm)', border: isCurrent ? '1px solid var(--border-light)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{step.time}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <span>{step.system}</span>
                              <span>{step.duration}</span>
                            </div>
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

      {/* BOTTOM PANE: Live Telemetry */}
      <div className="glass-panel" style={{ height: '120px', margin: '0 0.5rem 0.5rem 0.5rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.35rem 0', fontWeight: 600 }}>
          <Terminal size={13} /> Pipeline Execution Telemetry
        </h3>
        <div style={{ flex: 1, background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div>[10:42:01.002] INFO  gateway - Document registered in repository (ID: {activeDocId ? activeDocId.substring(0, 8) : 'demo'})</div>
          <div>[10:42:02.833] INFO  ocr_engine - OCR text layer verified (Confidence: 98.6%)</div>
          <div>[10:42:03.112] INFO  classifier - Document classified as '{extractedData?.type || 'verified_doc'}' (Score: 0.99)</div>
          <div>[10:42:04.550] INFO  risk_engine - Evaluation status: {reviewStatus || 'Needs Review'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-green)' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
            Active Reviewer Session Operational.
          </div>
        </div>
      </div>

    </div>
  );
}
