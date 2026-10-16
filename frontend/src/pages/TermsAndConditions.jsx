import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle, Scale, ShieldAlert, Clock } from 'lucide-react';

export default function TermsAndConditions() {
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
          Effective Date: October 15, 2026 | Enterprise Service Agreement v3.1
        </span>
      </div>

      {/* Main Document Panel */}
      <div className="glass-panel" style={{ padding: '3rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Scale size={28} color="var(--accent-blue)" />
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Terms and Conditions & Enterprise SLA</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0', lineHeight: 1.6 }}>
            DocuMatrix AI Enterprise Master Services Agreement, Operational Service Level Guarantees, and Usage Terms.
          </p>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            1. Authorized Enterprise Use & Licensing
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            DocuMatrix AI grants customer a non-exclusive, worldwide, subscription-based license to access and operate the DocuMatrix automated document intelligence platform, including chunked ingestion pipelines, OCR extraction engines, classification algorithms, and human-in-the-loop audit review modules according to the contracted subscription tier.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Customer agrees not to reverse engineer, decompile, or attempt to extract source code from proprietary heuristics, reinforcement learning routing controllers, or underlying execution models.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            2. Customer Data Ownership & IP Rights
          </h2>
          <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent-green)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <CheckCircle size={16} /> 100% Customer Intellectual Property Ownership
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
              The customer retains exclusive ownership and all intellectual property rights in and to all uploaded documents, processed outputs, structured JSON schema extractions, and derived business intelligence records.
            </p>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            DocuMatrix AI asserts zero ownership claim over any customer artifacts, schema definitions, or document classifications generated through our ingestion APIs.
          </p>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            3. Service Level Agreement (SLA) & Uptime Commitment
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            DocuMatrix AI guarantees monthly service availability and pipeline processing uptime:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>
                <Clock size={16} /> 99.99% Core API Availability
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Measured monthly, excluding scheduled maintenance windows announced at least 72 hours in advance.
              </p>
            </div>
            <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>
                <ShieldAlert size={16} /> SLA Credit Remedy
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                If monthly uptime drops below 99.9%, customers are eligible for prorated service credits up to 30% of monthly billing fees.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            4. Rate Limiting, API Quotas & System Safety
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
            To protect infrastructure stability, API requests are subject to tiered concurrency and token rate limits. Automated chunking engines handle parallel uploads up to 500 MB per file. Attempts to circumvent rate limiting or execute denial-of-service payloads will result in immediate API key suspension.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            5. Limitation of Liability
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            To the maximum extent permitted by applicable law, in no event shall DocuMatrix AI Inc. be liable for any indirect, punitive, incidental, or consequential damages. In all circumstances, total cumulative liability under this agreement shall be limited to the total subscription fees paid by customer in the preceding twelve (12) month period.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            6. Governing Law & Dispute Resolution
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles. Any arbitration or legal proceeding arising out of or relating to this Agreement shall be conducted in San Francisco County, California.
          </p>
        </section>
      </div>
    </div>
  );
}
