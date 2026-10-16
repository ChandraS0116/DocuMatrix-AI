import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, FileText, Database, CheckCircle, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem 4rem 1rem', color: 'var(--text-primary)' }}>
      {/* Navigation Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link 
          to="/" 
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Return to Pipeline
        </Link>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Effective Date: October 15, 2026 | Version 2.4 (SOC2 / GDPR / HIPAA Compliant)
        </span>
      </div>

      {/* Main Document Panel */}
      <div className="glass-panel" style={{ padding: '3rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Shield size={28} color="var(--accent-blue)" />
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Privacy Policy & Data Protection Charter</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0', lineHeight: 1.6 }}>
            DocuMatrix AI Inc. Enterprise Data Governance, Information Security Standards, and Zero-Data-Training Policy.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            1. Zero Customer Data Training Guarantee
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            DocuMatrix AI enforces a strict zero-retention foundation model training policy. Customer documents, optical character recognition (OCR) streams, schema extractions, vector embeddings, and human-in-the-loop review annotations are never utilized to train, retrain, fine-tune, or benchmark public foundation models or any multi-tenant machine learning weights.
          </p>
          <div style={{ background: 'rgba(0, 102, 255, 0.05)', border: '1px solid rgba(0, 102, 255, 0.2)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-blue)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <CheckCircle size={16} /> Contractual Isolation Guarantee
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
              All customer tenant processing boundaries are isolated at the database, storage, and runtime memory levels. Cross-tenant leakage is architecturally prohibited by row-level and cryptographic partition keys.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            2. Ingestion & Cryptographic Protection Standards
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            All binary files (PDF, TIFF, DOCX, PNG) and extracted metadata structures are protected using industry-standard cryptographic controls:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <li><strong>Data in Transit:</strong> Enforced TLS 1.3 encryption across all REST APIs, gRPC streaming channels, and chunked upload endpoints. Support for deprecated cipher suites is strictly blocked.</li>
            <li><strong>Data at Rest:</strong> AES-256 encryption using envelope key management via dedicated Hardware Security Modules (HSM) or customer-managed encryption keys (CMEK).</li>
            <li><strong>Vector Embeddings:</strong> Vector indices stored in isolated tenant vector partitions with zero cross-tenant query capabilities.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            3. Data Retention and Lifecycle Controls
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            Customers retain complete programmatic control over the document lifecycle:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-green)' }}>Configurable Retention</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Default retention is 30 days. Customers can configure hard purging to occur immediately post-extraction or retain data up to custom enterprise compliance intervals.
              </p>
            </div>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-green)' }}>Cryptographic Hard Purge</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                When a document deletion command is triggered via API or UI, the underlying object storage chunks, cache layers, and database records are shredded immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            4. Regulatory Compliance Frameworks
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            DocuMatrix AI maintains certified adherence to key regulatory governance frameworks:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <li><strong>SOC2 Type II:</strong> Annual third-party audits evaluating Security, Availability, Processing Integrity, Confidentiality, and Privacy.</li>
            <li><strong>HIPAA BAA Readiness:</strong> Business Associate Agreement execution available for healthcare clients processing Protected Health Information (PHI).</li>
            <li><strong>GDPR & CCPA:</strong> Full compliance with data subject rights, including Right of Access, Right to Rectification, Right to Erasure, and automated Data Portability exports.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            5. Security Operations & Contact
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            For privacy inquiries, Data Protection Officer (DPO) queries, or to request an enterprise SOC2 Type II report, contact our security office directly at:
          </p>
          <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
            <div><strong>Security & Privacy Office:</strong> DocuMatrix AI Enterprise Security Group</div>
            <div><strong>Email:</strong> privacy@documatrix.ai</div>
            <div><strong>Physical Address:</strong> 100 Montgomery St, Suite 1800, San Francisco, CA 94104</div>
          </div>
        </section>
      </div>
    </div>
  );
}
