'use client';

import { useState } from 'react';
import LeadFormRenderer from '../../components/LeadFormRenderer';
import { SavedLeadField, fieldId } from '../../../lib/cmsLead';

export default function LeadForm({
  slug,
  formName,
  fields,
}: {
  slug: string;
  formName: string;
  fields: SavedLeadField[];
}) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [result, setResult] = useState<{ message: string } | null>(null);

  const isComplete = fields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[fieldId(f.node, f.key)];
      return f.inputType === 'checkbox' ? true : v !== undefined && v !== '';
    });

  async function submit() {
    setErrMsg('');
    if (!isComplete) {
      setErrMsg('Please fill in all required fields before submitting.');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      term: params.get('utm_term') || undefined,
      content: params.get('utm_content') || undefined,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values, utm }),
      });
      const data = await res.json();
      if (data.result) {
        setResult({ message: data.message });
      } else {
        setErrMsg(data.message || 'Could not submit your enquiry.');
      }
    } catch (e: any) {
      setErrMsg('Could not reach the lead service: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap">
      {!result && (
        <div className="card">
          <h1 style={{ fontSize: 19, color: 'var(--blue)', marginBottom: 4 }}>{formName}</h1>
          <p className="hint" style={{ marginBottom: 18 }}>
            Fill in your details below and we&apos;ll be in touch.
          </p>

          <LeadFormRenderer
            fields={fields}
            values={values}
            onChange={(id, val) => setValues((prev) => ({ ...prev, [id]: val }))}
          />

          <button className="cta" onClick={submit} disabled={submitting || !isComplete}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          {errMsg && <div className="msg err">{errMsg}</div>}
        </div>
      )}

      {result && (
        <div className="card result">
          <div className="badge">✓</div>
          <h2>Thank You</h2>
          <p>{result.message}</p>
        </div>
      )}

      <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
    </div>
  );
}
