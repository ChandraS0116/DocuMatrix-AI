import React, { useState } from 'react';
import { Terminal, Save, Play, History, Check, Copy, Code, Sparkles, RefreshCw } from 'lucide-react';

const TEMPLATES = [
  {
    name: "Invoice & Receipt NER",
    prompt: "Extract the following entities from the document text:\n- vendor_name (Company/Org)\n- invoice_number (alphanumeric string)\n- total_amount (numeric float with currency)\n- due_date (YYYY-MM-DD)\n- line_items (array of description and subtotal)\n\nReturn strictly valid JSON without markdown tags."
  },
  {
    name: "Contract Risk Analyzer",
    prompt: "Analyze the legal agreement text for liability clauses:\n- effective_date\n- termination_conditions\n- governing_law\n- indemnification_cap_usd\n- auto_renewal (true/false)\n\nFlag risk_level as HIGH if indemnification is uncapped."
  },
  {
    name: "HIPAA / PII Sanitizer",
    prompt: "Detect protected health information (PHI) and PII:\n- patient_name\n- ssn_or_mrn\n- date_of_birth\n- diagnosis_codes\n\nGenerate redacting masks for identified span boundaries."
  }
];

export default function PromptStudio() {
  const [prompt, setPrompt] = useState(TEMPLATES[0].prompt);
  const [sampleInput, setSampleInput] = useState(
    "Apex Global Logistics Corp. 450 Commerce Blvd, Suite 800. Invoice #INV-2026-9042. Total Amount Due: $45,230.00. Payment Terms: Net 30. Due Date: 2026-11-15."
  );
  const [outputResult, setOutputResult] = useState({
    vendor_name: "Apex Global Logistics Corp",
    invoice_number: "INV-2026-9042",
    total_amount: 45230.00,
    currency: "USD",
    due_date: "2026-11-15",
    confidence_score: 0.992
  });
  const [version, setVersion] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRunTest = () => {
    setIsRunning(true);
    setTimeout(() => {
      // Simulate dynamic parsing based on input text
      const totalMatch = sampleInput.match(/\$[\d,]+(\.\d{2})?/);
      const invMatch = sampleInput.match(/(INV-[A-Z0-9-]+|#?[A-Z0-9-]{6,})/);
      
      setOutputResult({
        vendor_name: sampleInput.split('.')[0] || "Detected Vendor",
        invoice_number: invMatch ? invMatch[0] : "INV-EXTRACTED",
        total_amount: totalMatch ? parseFloat(totalMatch[0].replace(/[$,]/g, '')) : 1250.00,
        currency: "USD",
        due_date: "2026-11-15",
        confidence_score: 0.985,
        execution_latency_ms: 68
      });
      setIsRunning(false);
    }, 400);
  };

  const handleSaveVersion = () => {
    setVersion(v => v + 1);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Terminal color="var(--accent-blue)" size={24} /> Prompt Engineering & Versioning Studio
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
            Author, test, and hot-reload extraction prompts deployed to LayoutLM & DistilBERT inference workers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={16} /> Saved as v{version}!
            </span>
          )}
          <button 
            onClick={handleSaveVersion}
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Save size={15} /> Save New Version (v{version})
          </button>
        </div>
      </div>

      {/* Preset Template Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Templates:</span>
        {TEMPLATES.map((t, idx) => (
          <button
            key={idx}
            onClick={() => setPrompt(t.prompt)}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Main Split Editor */}
      <div style={{ display: 'flex', flex: 1, gap: '1.5rem', overflow: 'hidden' }}>
        
        {/* Left: Prompt Editor */}
        <div className="glass-panel" style={{ flex: 3, display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={16} color="var(--accent-blue)" /> System Prompt
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: Extraction Microservice v1.4</span>
          </div>

          <textarea 
            className="input-field"
            style={{ 
              flex: 1, 
              resize: 'none', 
              fontFamily: 'monospace', 
              fontSize: '0.95rem', 
              background: 'var(--bg-deep)', 
              color: 'var(--text-primary)', 
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              lineHeight: 1.6
            }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        {/* Right: Test Execution Bench */}
        <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '1.25rem', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Test Environment</h3>
            <button 
              onClick={handleRunTest}
              disabled={isRunning}
              className="btn-primary" 
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Play size={13} /> {isRunning ? "Executing..." : "Run Test"}
            </button>
          </div>

          {/* Sample Input Textarea */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
              Input Text Stream
            </div>
            <textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                resize: 'none',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Output JSON Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Parsed Entity Output</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check size={13} /> JSON Schema Valid
              </span>
            </div>
            
            <pre style={{ 
              flex: 1, 
              fontSize: '0.85rem', 
              color: 'var(--accent-green)', 
              background: 'var(--bg-deep)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-light)', 
              overflowX: 'auto', 
              margin: 0 
            }}>
              {JSON.stringify(outputResult, null, 2)}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
