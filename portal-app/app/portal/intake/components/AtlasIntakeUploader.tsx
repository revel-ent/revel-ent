'use client';

import { useState } from 'react';

import { ATLAS_EVENT_FOLDERS, type AtlasFileDomain } from '@/lib/atlas-event-files';

interface IntakeResult {
  ok: boolean;
  eventId: string;
  storageBucket: string;
  storageRelativePath: string;
  extracted: {
    summary: string;
    confidence: number;
    extractedDates: string[];
    extractedAmounts: string[];
    extractedPercentages: string[];
    keywordSignals: string[];
  };
  nextBestActions: string[];
}

function toFriendlyPersistenceMessage(errorCode: string): string {
  if (errorCode === 'persistence_unavailable' || errorCode === 'persistence_not_configured') {
    return 'Persistence is not configured yet for this environment. Add Supabase env vars and run migrations to enable durable intake uploads.';
  }

  return errorCode;
}

export default function AtlasIntakeUploader() {
  const [domain, setDomain] = useState<AtlasFileDomain>('contracts');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Select a file before uploading.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.set('domain', domain);
      formData.set('file', file);

      const response = await fetch('/api/ai/intake-document', {
        method: 'POST',
        body: formData
      });

      const data = (await response.json()) as IntakeResult | { error?: string };

      if (!response.ok) {
        const errorCode = 'error' in data && data.error ? data.error : 'Upload failed.';
        throw new Error(toFriendlyPersistenceMessage(errorCode));
      }

      setResult(data as IntakeResult);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <article className="card">
      <div className="card-header">
        <h3>ATLAS Intake Uploader</h3>
        <span className="chip">Planner/Admin</span>
      </div>
      <p>
        Upload contracts, transcripts, emails, and vendor files so ATLAS can extract payment milestones, dates, and
        workflow signals.
      </p>

      <div className="alert">
        Uploads are stored in private Supabase Storage and linked to this event. Signed access links are temporary.
      </div>

      <form className="tool-form" onSubmit={onSubmit}>
        <label htmlFor="domain">Document category</label>
        <select id="domain" name="domain" value={domain} onChange={(event) => setDomain(event.target.value as AtlasFileDomain)}>
          {ATLAS_EVENT_FOLDERS.map((folder) => (
            <option key={folder.key} value={folder.key}>
              {folder.label} ({folder.key})
            </option>
          ))}
        </select>

        <label htmlFor="intakeFile">Select file</label>
        <input
          id="intakeFile"
          name="intakeFile"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          required
        />

        <button className="btn primary" type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload and Extract'}
        </button>
      </form>

      {error ? <p className="alert error">{error}</p> : null}

      {result ? (
        <div className="tool-result">
          <div className="data-row">
            <strong className="item-title">Stored file path</strong>
            <p className="item-meta">
              {result.storageBucket}/{result.storageRelativePath}
            </p>
          </div>
          <div className="data-row">
            <strong className="item-title">Extraction summary</strong>
            <p className="item-meta">{result.extracted.summary}</p>
            <p className="item-note">Confidence: {Math.round(result.extracted.confidence * 100)}%</p>
          </div>
          <div className="data-row">
            <strong className="item-title">Detected Dates</strong>
            <p className="item-meta">{result.extracted.extractedDates.join(' | ') || 'None detected'}</p>
          </div>
          <div className="data-row">
            <strong className="item-title">Detected Amounts / Percentages</strong>
            <p className="item-meta">
              {result.extracted.extractedAmounts.join(' | ') || 'No amount signals'}
              {result.extracted.extractedPercentages.length > 0
                ? ` | Percentages: ${result.extracted.extractedPercentages.join(', ')}`
                : ''}
            </p>
          </div>
          <div className="data-row">
            <strong className="item-title">Workflow keywords</strong>
            <p className="item-meta">{result.extracted.keywordSignals.join(', ') || 'No workflow keywords detected'}</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
