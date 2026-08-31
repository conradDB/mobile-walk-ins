'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../components/Header';
import LeadFieldBuilder from '../../../../components/LeadFieldBuilder';
import { SavedLeadField } from '../../../../../lib/cmsLead';

type LeadForm = {
  id: string;
  name: string;
  slug: string;
  source: string;
  fields: SavedLeadField[];
  dealers: { name: string } | null;
};

export default function EditLeadFormPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [leadForm, setLeadForm] = useState<LeadForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [selectedFields, setSelectedFields] = useState<SavedLeadField[]>([]);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/lead-forms/${params.id}`);
        const data = await res.json();
        if (!res.ok) {
          toast(data.error || 'Could not load this lead form');
          return;
        }
        setLeadForm(data.leadForm);
        setName(data.leadForm.name);
        setSource(data.leadForm.source);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  }

  async function save() {
    if (!name.trim()) return toast('Give the form a name');
    if (!source.trim()) return toast('Enter a Source code (CMS-configured)');
    if (selectedFields.length === 0) return toast('Select at least one field');

    setSaving(true);
    try {
      const res = await fetch(`/api/lead-forms/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), source: source.trim(), fields: selectedFields }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not save changes');
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
        title="Edit Lead Form"
        right={
          <a className="row-btn" href="/admin/leads">
            ← Lead Forms
          </a>
        }
      />

      <div className="wrap admin-wrap">
        {loading && <div className="empty">Loading…</div>}

        {!loading && !leadForm && <div className="empty">This lead form could not be found.</div>}

        {!loading && leadForm && (
          <>
            <div className="card">
              <div className="section-label" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                Basics
              </div>
              <div className="grid">
                <div className="field full">
                  <label>Dealer</label>
                  <input value={leadForm.dealers?.name || ''} disabled />
                  <p className="hint">The dealer a form is linked to can&apos;t be changed after creation.</p>
                </div>
                <div className="field">
                  <label>Form Name <span className="req">*</span></label>
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Source Code <span className="req">*</span></label>
                  <input value={source} onChange={(e) => setSource(e.target.value)} />
                  <p className="hint">Must match a Source value already configured in CMS.</p>
                </div>
                <div className="field full">
                  <label>Link Slug</label>
                  <input value={leadForm.slug} disabled />
                  <p className="hint">
                    The public link (/leads/{leadForm.slug}) can&apos;t be changed — it may already be
                    shared or printed on a QR code.
                  </p>
                </div>
              </div>
            </div>

            <LeadFieldBuilder initialFields={leadForm.fields} onChange={setSelectedFields} />

            <button className="cta" onClick={save} disabled={saving} style={{ marginTop: 20 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}

        <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
