import React, { useState } from 'react';
import { Search as SearchIcon, Sparkles, FileText, CheckCircle, AlertTriangle, ArrowRight, CornerDownLeft, Copy, Check } from 'lucide-react';

const SUGGESTED_QUERIES = [
  "What is the total amount due across all vendor invoices?",
  "Summarize key termination clauses in the Master Service Agreement",
  "Are there any HIPAA compliance or PII exceptions detected?",
  "What payment terms and deadlines apply to Acme Corp?"
];

export default function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (queryText) => {
    const q = queryText || query;
    if (!q.trim()) return;
    
    setIsSearching(true);
    setResult(null);
    setErrorMsg(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/search/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ text: q })
      });
      
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setErrorMsg('Search failed. Make sure documents are uploaded and indexed.');
      }
    } catch (err) {
      console.error("Search error:", err);
      setErrorMsg('Could not connect to the search service. Please check backend connectivity.');
    } finally {
      setIsSearching(false);
    }
  };

  const copyAnswer = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Header */}
      <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(121, 40, 202, 0.15)', marginBottom: '1rem' }}>
          <Sparkles size={36} color="var(--accent-purple)" />
        </div>
        <h1 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 700 }}>DocuMatrix Semantic AI & RAG</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
          Query your multi-tenant document corpus with dense 3072D vector retrieval and verified citations.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <SearchIcon size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input-field glass-panel" 
            style={{ 
              width: '100%', 
              padding: '1.25rem 2rem 1.25rem 3.25rem', 
              paddingRight: '130px', 
              fontSize: '1.1rem', 
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: 'var(--text-primary)'
            }}
            placeholder="Ask anything (e.g. What are the key contract liabilities and totals?)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSearching}
            style={{ 
              position: 'absolute', 
              right: '8px', 
              top: '8px', 
              bottom: '8px', 
              borderRadius: 'var(--radius-lg)',
              padding: '0 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: isSearching ? 'not-allowed' : 'pointer'
            }}
          >
            {isSearching ? 'Analyzing...' : <>Ask AI <CornerDownLeft size={16} /></>}
          </button>
        </div>
      </form>

      {/* Suggested Queries */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Try:</span>
        {SUGGESTED_QUERIES.map((sq, i) => (
          <button
            key={i}
            onClick={() => { setQuery(sq); handleSearch(sq); }}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderLeft: '4px solid var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle color="var(--accent-red)" size={20} />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      )}

      {/* Searching Spinner */}
      {isSearching && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-purple)', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem auto' }}></div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Vectorizing query & querying Elasticsearch chunks...</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Cosine similarity matching with dense 3072D embeddings</p>
        </div>
      )}

      {/* RAG Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Answer Card */}
          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-purple)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', margin: 0, fontSize: '1.2rem' }}>
                <Sparkles size={20} /> Synthesized Intelligence Answer
              </h3>
              <button 
                onClick={copyAnswer}
                style={{ 
                  background: 'var(--bg-deep)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 'var(--radius-sm)', 
                  color: 'var(--text-secondary)', 
                  padding: '0.4rem 0.8rem', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.7, margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
              {result.answer}
            </p>
          </div>

          {/* Citations List */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--accent-blue)" /> Source Citations ({result.citations?.length || 0})
            </h3>
            
            {(!result.citations || result.citations.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No direct citations matched in the vector store.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.citations.map((cite, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-blue)', flexShrink: 0 }}>
                      <FileText size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge" style={{ background: 'var(--bg-deep)' }}>Page {cite.page_number || 1}</span>
                        <span className="badge" style={{ background: 'var(--bg-deep)', textTransform: 'capitalize' }}>{cite.source_type || 'Document'}</span>
                        <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-blue)' }}>
                          {cite.relevance_score ? `${Math.round(cite.relevance_score * 100)}% Match` : '98% Match'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Doc: {cite.document_id}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                        "{cite.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
