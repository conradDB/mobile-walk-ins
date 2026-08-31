'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '../../components/Header';

type LeadForm = {
  id: string;
  dealer_id: string;
  name: string;
  slug: string;
  source: string;
  fields: unknown[];
  active: boolean;
  created_at: string;
  leadCount: number;
  attemptCount: number;
  dealers: { name: string; slug: string | null; logo_url: string | null } | null;
};

type Dealer = {
  id: string;
  name: string;
  dealer_ref: string | null;
  dealer_floor: string | null;
};

export default function LeadFormsAdminPage() {
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealerCodesDraft, setDealerCodesDraft] = useState<Record<string, { ref: string; floor: string }>>({});
  const [savingDealerId, setSavingDealerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [origin, setOrigin] = useState('');
  const [qrForm, setQrForm] = useState<LeadForm | null>(null);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<any>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
    loadDealers();
  }, []);

  async function loadDealers() {
    try {
      const res = await fetch('/api/dealers');
      const data = await res.json();
      const list: Dealer[] = data.dealers || [];
      setDealers(list);
      setDealerCodesDraft(
        Object.fromEntries(list.map((d) => [d.id, { ref: d.dealer_ref || '', floor: d.dealer_floor || '' }]))
      );
    } catch {
      // Non-critical for this page — CMS codes card just won't populate.
    }
  }

  async function saveDealerCodes(id: string) {
    const draft = dealerCodesDraft[id];
    const dealerRef = (draft?.ref || '').trim();
    const dealerFloor = (draft?.floor || '').trim();
    if (!dealerRef || !dealerFloor) {
      toast('Both DealerRef and DealerFloor are required');
      return;
    }
    setSavingDealerId(id);
    try {
      const res = await fetch(`/api/dealers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_ref: dealerRef, dealer_floor: dealerFloor }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not save CMS codes');
        return;
      }
      setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...data.dealer } : d)));
      toast('CMS codes saved');
    } catch {
      toast('Network error while saving');
    } finally {
      setSavingDealerId(null);
    }
  }

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1800);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/lead-forms');
      const data = await res.json();
      setForms(data.leadForms || []);
    } catch (e) {
      toast('Could not load lead forms');
    } finally {
      setLoading(false);
    }
  }

  function linkFor(f: LeadForm) {
    return `${origin}/leads/${f.slug}`;
  }

  async function copyLink(f: LeadForm) {
    try {
      await navigator.clipboard.writeText(linkFor(f));
      toast('Link copied');
    } catch {
      toast('Copy failed — select and copy manually');
    }
  }

  async function toggleActive(f: LeadForm) {
    const nextActive = !f.active;
    setForms((prev) => prev.map((x) => (x.id === f.id ? { ...x, active: nextActive } : x)));
    try {
      const res = await fetch(`/api/lead-forms/${f.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) {
        setForms((prev) => prev.map((x) => (x.id === f.id ? { ...x, active: f.active } : x)));
        toast('Could not update form');
        return;
      }
      toast(nextActive ? 'Form activated' : 'Form deactivated');
    } catch {
      setForms((prev) => prev.map((x) => (x.id === f.id ? { ...x, active: f.active } : x)));
      toast('Network error while saving');
    }
  }

  async function removeForm(id: string) {
    if (!confirm('Remove this lead form? Its link will stop working.')) return;
    try {
      await fetch(`/api/lead-forms/${id}`, { method: 'DELETE' });
      setForms((prev) => prev.filter((f) => f.id !== id));
      toast('Lead form removed');
    } catch {
      toast('Could not remove lead form');
    }
  }

  useEffect(() => {
    if (!qrForm || !qrContainerRef.current) return;
    let cancelled = false;
    qrContainerRef.current.innerHTML = '';

    (async () => {
      const { default: QRCodeStyling } = await import('qr-code-styling');
      if (cancelled || !qrContainerRef.current) return;
      qrCodeRef.current = new QRCodeStyling({
        width: 2000,
        height: 2000,
        type: 'svg',
        data: linkFor(qrForm),
        image: qrForm.dealers?.logo_url || '/cms-logo-icon.png',
        margin: 50,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { type: 'rounded', color: '#000000' },
        backgroundOptions: { color: '#ffffff' },
        cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
        cornersDotOptions: { type: 'dot', color: '#000000' },
        imageOptions: { crossOrigin: 'anonymous', margin: 38, imageSize: 0.4, hideBackgroundDots: true },
      });
      qrCodeRef.current.append(qrContainerRef.current);
    })();

    return () => {
      cancelled = true;
    };
  }, [qrForm]);

  function downloadQrSvg() {
    if (!qrForm || !qrCodeRef.current) return;
    qrCodeRef.current.download({ name: qrForm.slug, extension: 'svg' });
  }

  function downloadQrPng() {
    if (!qrForm || !qrCodeRef.current) return;
    qrCodeRef.current.download({ name: qrForm.slug, extension: 'png' });
  }

  return (
    <>
      <Header
        eyebrow="Workshop Bookings"
        title="Lead Submission Forms"
        right={
          <>
            <a className="row-btn" href="/admin">
              ← All Tools
            </a>
            <a className="row-btn primary" href="/admin/leads/new">
              + Create Lead Form
            </a>
          </>
        }
        animateIcon
      />

      <div className="wrap admin-wrap">
        <details className="card" style={{ marginBottom: 20 }}>
          <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'var(--blue)' }}>
            Dealer CMS Codes
          </summary>
          <p className="hint" style={{ margin: '10px 0 16px' }}>
            DealerRef and DealerFloor are provided by CMS and are required before a dealer can have
            a lead form. Set them here — independent of Workshop Booking Links.
          </p>
          <div className="dealer-list">
            {dealers.map((d) => (
              <div className="dealer-row" key={d.id}>
                <div className="info">
                  <div className="name">{d.name}</div>
                </div>
                <input
                  className="catalog-label-input"
                  style={{ maxWidth: 140 }}
                  placeholder="DealerRef"
                  value={dealerCodesDraft[d.id]?.ref || ''}
                  onChange={(e) =>
                    setDealerCodesDraft((prev) => ({ ...prev, [d.id]: { ref: e.target.value, floor: prev[d.id]?.floor || '' } }))
                  }
                />
                <input
                  className="catalog-label-input"
                  style={{ maxWidth: 140 }}
                  placeholder="DealerFloor"
                  value={dealerCodesDraft[d.id]?.floor || ''}
                  onChange={(e) =>
                    setDealerCodesDraft((prev) => ({ ...prev, [d.id]: { ref: prev[d.id]?.ref || '', floor: e.target.value } }))
                  }
                />
                <button className="row-btn primary" onClick={() => saveDealerCodes(d.id)} disabled={savingDealerId === d.id}>
                  {savingDealerId === d.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            ))}
            {dealers.length === 0 && <div className="empty">No dealers yet.</div>}
          </div>
        </details>

        <div className="dealer-list">
          {!loading &&
            forms.map((f) => (
              <div className="dealer-row" key={f.id}>
                <img className="dealer-logo" src={f.dealers?.logo_url || '/cms-logo-icon.png'} alt="" />
                <div className="info">
                  <div className="name">
                    {f.name} <span className="hint" style={{ display: 'inline' }}>· {f.dealers?.name}</span>
                  </div>
                  <div className="link mono" title={linkFor(f)}>{linkFor(f)}</div>
                </div>
                <span
                  className="pill lead-count-pill"
                  title={
                    f.attemptCount > f.leadCount
                      ? `${f.attemptCount} submission attempt${f.attemptCount === 1 ? '' : 's'}, ${f.attemptCount - f.leadCount} failed`
                      : 'Successful submissions to CMS'
                  }
                >
                  {f.leadCount} {f.leadCount === 1 ? 'lead' : 'leads'}
                  {f.attemptCount > f.leadCount && (
                    <span className="lead-count-failed"> ({f.attemptCount - f.leadCount} failed)</span>
                  )}
                </span>
                <label className="scan-toggle" title="Accepting submissions">
                  <span className="switch">
                    <input type="checkbox" checked={f.active} onChange={() => toggleActive(f)} />
                    <span className="switch-slider" />
                  </span>
                  Active
                </label>
                <a className="row-btn" href={`/admin/leads/${f.id}/edit`}>
                  Edit
                </a>
                <button className="row-btn primary" onClick={() => copyLink(f)}>
                  Copy Link
                </button>
                <button className="row-btn" onClick={() => setQrForm(f)}>
                  QR Code
                </button>
                <a className="row-btn" href={`/leads/${f.slug}`} target="_blank" rel="noreferrer">
                  Open
                </a>
                <button className="row-btn danger" onClick={() => removeForm(f.id)}>
                  Remove
                </button>
              </div>
            ))}
        </div>

        {!loading && forms.length === 0 && (
          <div className="empty">
            No lead forms yet — click &quot;Create Lead Form&quot; above to build your first one.
          </div>
        )}

        <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
      </div>

      {qrForm && (
        <div className="modal-overlay" onClick={() => setQrForm(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, marginBottom: 2 }}>{qrForm.name}</h3>
            <p className="hint mono" style={{ marginBottom: 16, wordBreak: 'break-all' }}>
              {linkFor(qrForm)}
            </p>
            <div className="qr-frame" ref={qrContainerRef} />
            <div className="modal-actions">
              <button className="row-btn primary" onClick={downloadQrSvg}>
                Download SVG (Vector)
              </button>
              <button className="row-btn primary" onClick={downloadQrPng}>
                Download PNG
              </button>
            </div>
            <div className="modal-actions">
              <button className="row-btn" onClick={() => setQrForm(null)} style={{ flex: 'none', minWidth: 120, margin: '0 auto' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
