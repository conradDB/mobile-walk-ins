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
  dealers: { name: string; slug: string | null; logo_url: string | null } | null;
};

export default function LeadFormsAdminPage() {
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [origin, setOrigin] = useState('');
  const [qrForm, setQrForm] = useState<LeadForm | null>(null);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<any>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

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
                <label className="scan-toggle" title="Accepting submissions">
                  <span className="switch">
                    <input type="checkbox" checked={f.active} onChange={() => toggleActive(f)} />
                    <span className="switch-slider" />
                  </span>
                  Active
                </label>
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
