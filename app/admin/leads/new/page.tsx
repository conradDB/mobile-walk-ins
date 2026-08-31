'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import LeadFieldBuilder from '../../../components/LeadFieldBuilder';
import { slugify } from '../../../../lib/dealers';
import { SavedLeadField } from '../../../../lib/cmsLead';

type Dealer = {
  id: string;
  name: string;
  dealer_ref: string | null;
  dealer_floor: string | null;
};

export default function NewLeadFormPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [dealerId, setDealerId] = useState('');
  const [dealerRefInput, setDealerRefInput] = useState('');
  const [dealerFloorInput, setDealerFloorInput] = useState('');
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState('');
  const [selectedFields, setSelectedFields] = useState<SavedLeadField[]>([]);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dealers');
        const data = await res.json();
        setDealers(data.dealers || []);
      } finally {
        setLoadingDealers(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  }

  function selectDealer(id: string) {
    setDealerId(id);
    const d = dealers.find((x) => x.id === id);
    setDealerRefInput(d?.dealer_ref || '');
    setDealerFloorInput(d?.dealer_floor || '');
  }

  async function save() {
    if (!dealerId) return toast('Choose a dealer first');
    const dealerRef = dealerRefInput.trim();
    const dealerFloor = dealerFloorInput.trim();
    if (!dealerRef || !dealerFloor) return toast('Enter this dealer’s DealerRef and DealerFloor');
    if (!name.trim()) return toast('Give the form a name');
    if (!source.trim()) return toast('Enter a Source code (CMS-configured)');
    if (selectedFields.length === 0) return toast('Select at least one field');

    setSaving(true);
    try {
      const dealerRes = await fetch(`/api/dealers/${dealerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_ref: dealerRef, dealer_floor: dealerFloor }),
      });
      if (!dealerRes.ok) {
        const dealerErr = await dealerRes.json().catch(() => ({}));
        toast(dealerErr.error || 'Could not save this dealer’s CMS codes');
        return;
      }

      const res = await fetch('/api/lead-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId,
          name: name.trim(),
          source: source.trim(),
          slug: slug.trim(),
          fields: selectedFields,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not create lead form');
        return;
      }
      router.push('/admin/leads');
    } catch (e) {
      toast('Network error while saving');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header
        eyebrow="Workshop Bookings"
        title="Create Lead Form"
        right={
          <a className="row-btn" href="/admin/leads">
            ← Lead Forms
          </a>
        }
      />

      <div className="wrap admin-wrap">
        <div className="card">
          <div className="section-label" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            Basics
          </div>
          <div className="grid">
            <div className="field full">
              <label>Dealer <span className="req">*</span></label>
              <select value={dealerId} onChange={(e) => selectDealer(e.target.value)} disabled={loadingDealers}>
                <option value="">Select a dealer…</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Form Name <span className="req">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ranger Test Drive Campaign" />
            </div>
            <div className="field">
              <label>Source Code <span className="req">*</span></label>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. WEBSITE-TESTDRIVE" />
              <p className="hint">Must match a Source value already configured in CMS.</p>
            </div>
            <div className="field full">
              <label>Link Slug</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="ranger-test-drive"
              />
              <p className="hint">The public link will be /leads/{slug || '…'}</p>
            </div>
          </div>

          {dealerId && (
            <>
              <div className="section-label">Dealer&apos;s CMS Codes</div>
              <p className="hint" style={{ marginBottom: 14 }}>
                DealerRef and DealerFloor are provided by CMS and must match exactly what&apos;s
                configured on their side. Specific to this dealer, saved when you create the form —
                shown pre-filled if already set from an earlier lead form.
              </p>
              <div className="grid">
                <div className="field">
                  <label>DealerRef <span className="req">*</span></label>
                  <input value={dealerRefInput} onChange={(e) => setDealerRefInput(e.target.value)} placeholder="e.g. 123M" />
                </div>
                <div className="field">
                  <label>DealerFloor <span className="req">*</span></label>
                  <input value={dealerFloorInput} onChange={(e) => setDealerFloorInput(e.target.value)} placeholder="e.g. USED" />
                </div>
              </div>
            </>
          )}
        </div>

        <LeadFieldBuilder onChange={setSelectedFields} />

        <button className="cta" onClick={save} disabled={saving} style={{ marginTop: 20 }}>
          {saving ? 'Creating…' : 'Create Lead Form'}
        </button>

        <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
