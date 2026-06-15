'use client';
import { useState } from 'react';
import { uploadFromUrl, DOCUMENT_TYPES, type UploadResult } from '@/lib/api';

const SAMPLE_PDF = 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';

export default function DocumentsPage() {
  const [patientId, setPatientId] = useState('');
  const [documentType, setDocumentType] = useState<string>('intake-forms');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await uploadFromUrl({
        patientId: patientId.trim(),
        documentType,
        url: url.trim(),
        fileName: fileName.trim() || undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null); setError('');
    setPatientId(''); setUrl(''); setFileName(''); setDocumentType('intake-forms');
  };

  const sizeBytes = result?.userDocument?.sizeBytes;
  const sizeKb = sizeBytes != null ? `${(sizeBytes / 1024).toFixed(1)} KB` : '—';

  return (
    <div className="container">
      <h1>Upload Document from URL</h1>
      <p className="subtitle">
        Hand Wizlo a public file URL and a patient — the server fetches the file, stores it,
        and links it to the patient&apos;s profile. Useful for pulling signed PDFs from external
        intake / lab providers without proxying the bytes yourself.
      </p>

      {!result ? (
        <div className="card">
          <span className="badge">POST /clients-documents/:id/upload-url/:documentType</span>
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Patient ID (UUID) *</label>
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)}
                placeholder="a8912dbe-137c-4d9e-8785-84bd1ef298f3" required />
              <span className="hint">The client/patient the document attaches to (path param <code>id</code>).</span>
            </div>
            <div className="form-group">
              <label>Document Type *</label>
              <select value={documentType} onChange={e => setDocumentType(e.target.value)}>
                {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="hint">Path param <code>documentType</code> — controls allowed MIME types server-side.</span>
            </div>
            <div className="form-group">
              <label>Source URL *</label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/intake.pdf" required />
              <button type="button" className="btn btn-secondary" style={{ marginTop: 8, padding: '6px 12px', fontSize: '0.8125rem' }}
                onClick={() => setUrl(SAMPLE_PDF)}>
                Use sample PDF
              </button>
            </div>
            <div className="form-group">
              <label>File Name</label>
              <input type="text" value={fileName} onChange={e => setFileName(e.target.value)}
                placeholder="intake_form_2025.pdf (optional)" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Uploading…' : 'Upload from URL →'}
            </button>
          </form>
          {error && <div className="error-box">{error}</div>}
        </div>
      ) : (
        <div className="card">
          <div className="success-box">{result.message}</div>
          <div className="summary-row"><span className="summary-label">Document ID</span><span className="summary-value mono">{result.documentId}</span></div>
          <div className="summary-row"><span className="summary-label">Type</span><span className="summary-value">{result.userDocument?.docType}</span></div>
          <div className="summary-row"><span className="summary-label">File name</span><span className="summary-value">{result.userDocument?.fileName}</span></div>
          <div className="summary-row"><span className="summary-label">Content type</span><span className="summary-value">{result.userDocument?.contentType}</span></div>
          <div className="summary-row"><span className="summary-label">Size</span><span className="summary-value">{sizeKb}</span></div>
          <div className="summary-row">
            <span className="summary-label">Stored file</span>
            <span className="summary-value"><a href={result.fileUrl} target="_blank" rel="noreferrer">Open signed URL ↗</a></span>
          </div>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '13px' }}>Full response JSON</summary>
            <div className="result-box" style={{ marginTop: 8 }}><pre>{JSON.stringify(result, null, 2)}</pre></div>
          </details>

          <div style={{ marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={reset}>+ Upload Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
