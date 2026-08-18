'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';

type Dealer = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [nameErr, setNameErr] = useState(false);
  const [keyErr, setKeyErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [origin, setOrigin] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

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
      const res = await fetch('/api/dealers');
      const data = await res.json();
      setDealers(data.dealers || []);
    } catch (e) {
      toast('Could not load dealers');
    } finally {
      setLoading(false);
    }
  }

  async function addDealer() {
    const trimmedName = name.trim();
    const trimmedKey = key.trim();
    setNameErr(!trimmedName);
    setKeyErr(!trimmedKey);
    if (!trimmedName || !trimmedKey) {
      toast('Type a dealer name and key into the boxes');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, dealerSettingKey: trimmedKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not add dealer');
        return;
      }
      setName('');
      setKey('');
      setNameErr(false);
      setKeyErr(false);
      toast('Dealer added');
      await load();
    } catch (e) {
      toast('Network error while saving');
    } finally {
      setSaving(false);
    }
  }

  async function removeDealer(id: string) {
    if (!confirm('Remove this dealer? Its kiosk link will stop working.')) return;
    try {
      await fetch(`/api/dealers/${id}`, { method: 'DELETE' });
      setDealers((prev) => prev.filter((d) => d.id !== id));
      toast('Dealer removed');
    } catch (e) {
      toast('Could not remove dealer');
    }
  }

  async function uploadLogo(id: string, file: File) {
    setUploadingId(id);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`/api/dealers/${id}/logo`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not upload logo');
        return;
      }
      setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, logo_url: data.dealer.logo_url } : d)));
      toast('Logo updated');
    } catch (e) {
      toast('Network error while uploading');
    } finally {
      setUploadingId(null);
    }
  }

  async function removeLogo(id: string) {
    setUploadingId(id);
    try {
      const res = await fetch(`/api/dealers/${id}/logo`, { method: 'DELETE' });
      if (!res.ok) {
        toast('Could not remove logo');
        return;
      }
      setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, logo_url: null } : d)));
      toast('Logo removed');
    } catch (e) {
      toast('Network error while removing logo');
    } finally {
      setUploadingId(null);
    }
  }

  async function saveColor(id: string, field: 'primary_color', value: string) {
    try {
      const res = await fetch(`/api/dealers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not save colour');
        return;
      }
      setDealers((prev) => prev.map((d) => (d.id === id ? { ...d, ...data.dealer } : d)));
    } catch (e) {
      toast('Network error while saving colour');
    }
  }

  function linkFor(d: Dealer) {
    return `${origin}/book/${d.slug || d.id}`;
  }

  async function copyLink(d: Dealer) {
    try {
      await navigator.clipboard.writeText(linkFor(d));
      toast('Link copied');
    } catch (e) {
      toast('Copy failed — select and copy manually');
    }
  }

  const filteredDealers = dealers.filter((d) =>
    d.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <Header
        eyebrow="Workshop Bookings"
        title="Dealer Setup"
        right={<span className="pill">{dealers.length} {dealers.length === 1 ? 'dealer' : 'dealers'}</span>}
      />

      <div className="wrap">
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Add a Dealer</h3>
          <p className="hint" style={{ marginBottom: 16 }}>
            Each dealer gets a DealerSettingKey from CMS. Add it here to generate a walk-in
            link for that branch&apos;s counter tablet.
          </p>
          <div className="admin-form">
            <div className="field">
              <label>Dealer Name</label>
              <input
                className={nameErr ? 'field-error' : ''}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Randburg Branch"
              />
            </div>
            <div className="field">
              <label>DealerSettingKey</label>
              <input
                className={keyErr ? 'field-error' : ''}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. TEST"
              />
            </div>
            <button onClick={addDealer} disabled={saving}>
              {saving ? 'Saving…' : 'Generate Link'}
            </button>
          </div>
        </div>

        {dealers.length > 0 && (
          <div className="search-field">
            <span className="search-icon">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dealers by name…"
            />
          </div>
        )}

        <div className="dealer-list">
          {!loading &&
            filteredDealers.map((d) => (
              <div className="dealer-row" key={d.id}>
                <img
                  className="dealer-logo"
                  src={d.logo_url || '/cms-logo-icon.png'}
                  alt={`${d.name} logo`}
                />
                <div className="info">
                  <div className="name">{d.name}</div>
                  <div className="link mono" title={linkFor(d)}>{linkFor(d)}</div>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  ref={(el) => { fileInputs.current[d.id] = el; }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(d.id, file);
                    e.target.value = '';
                  }}
                />
                <button
                  className="row-btn"
                  disabled={uploadingId === d.id}
                  onClick={() => fileInputs.current[d.id]?.click()}
                >
                  {uploadingId === d.id ? 'Uploading…' : d.logo_url ? 'Change Logo' : 'Upload Logo'}
                </button>
                {d.logo_url && (
                  <button className="row-btn" disabled={uploadingId === d.id} onClick={() => removeLogo(d.id)}>
                    Reset to CMS
                  </button>
                )}
                <input
                  className="color-swatch"
                  type="color"
                  title="Brand colour"
                  value={d.primary_color || '#31459C'}
                  onChange={(e) => saveColor(d.id, 'primary_color', e.target.value)}
                />
                <button className="row-btn primary" onClick={() => copyLink(d)}>
                  Copy Link
                </button>
                <a className="row-btn" href={`/book/${d.slug || d.id}`} target="_blank" rel="noreferrer">
                  Open
                </a>
                <button className="row-btn danger" onClick={() => removeDealer(d.id)}>
                  Remove
                </button>
              </div>
            ))}
        </div>

        {!loading && dealers.length === 0 && (
          <div className="empty">
            No dealers configured yet — add one above to generate its walk-in kiosk link.
          </div>
        )}

        {!loading && dealers.length > 0 && filteredDealers.length === 0 && (
          <div className="empty">No dealers match &quot;{query}&quot;.</div>
        )}

        <div className="note">
          <strong>No login yet:</strong> this admin page is open to anyone with the URL for
          now. Add authentication before sharing this link outside your team.
        </div>

        <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
