'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import LeadFormRenderer from '../../../components/LeadFormRenderer';
import { slugify } from '../../../../lib/dealers';
import { LEAD_FIELD_CATALOG, LEAD_SECTIONS, LeadFieldDef } from '../../../../lib/leadFields';
import { LEAD_FORM_TEMPLATES, fieldsForTemplate } from '../../../../lib/leadFormTemplates';
import { SavedLeadField, fieldId } from '../../../../lib/cmsLead';

type Dealer = {
  id: string;
  name: string;
  dealer_ref: string | null;
  dealer_floor: string | null;
};

type FieldState = {
  included: boolean;
  required: boolean;
  label: string;
};

function initialFieldState(): Record<string, FieldState> {
  const state: Record<string, FieldState> = {};
  for (const f of LEAD_FIELD_CATALOG) {
    const id = fieldId(f.node, f.key);
    state[id] = { included: !!f.locked, required: !!f.locked, label: f.label };
  }
  return state;
}

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
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [fieldState, setFieldState] = useState<Record<string, FieldState>>(initialFieldState);
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

  function applyTemplate(id: string) {
    setTemplateId(id);
    const templateFields = fieldsForTemplate(id);
    const includedIds = new Set(templateFields.map((f) => fieldId(f.node, f.key)));
    setFieldState((prev) => {
      const next: Record<string, FieldState> = {};
      for (const f of LEAD_FIELD_CATALOG) {
        const id2 = fieldId(f.node, f.key);
        const shouldInclude = f.locked || includedIds.has(id2);
        next[id2] = {
          included: shouldInclude,
          required: !!f.locked,
          label: prev[id2]?.label || f.label,
        };
      }
      return next;
    });
  }

  function toggleField(f: LeadFieldDef, included: boolean) {
    const id = fieldId(f.node, f.key);
    setFieldState((prev) => ({ ...prev, [id]: { ...prev[id], included } }));
  }

  function toggleRequired(f: LeadFieldDef, required: boolean) {
    const id = fieldId(f.node, f.key);
    setFieldState((prev) => ({ ...prev, [id]: { ...prev[id], required } }));
  }

  function updateLabel(f: LeadFieldDef, label: string) {
    const id = fieldId(f.node, f.key);
    setFieldState((prev) => ({ ...prev, [id]: { ...prev[id], label } }));
  }

  const selectedFields: SavedLeadField[] = useMemo(
    () =>
      LEAD_FIELD_CATALOG.filter((f) => fieldState[fieldId(f.node, f.key)]?.included).map((f) => {
        const s = fieldState[fieldId(f.node, f.key)];
        return {
          node: f.node,
          key: f.key,
          apiKey: f.apiKey,
          inputType: f.inputType,
          options: f.options,
          valueMap: f.valueMap,
          boolAsNative: f.boolAsNative,
          locked: f.locked,
          section: f.section,
          label: s.label,
          required: s.required,
        };
      }),
    [fieldState]
  );

  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

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

        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-label" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            Start From
          </div>
          <div className="template-grid">
            {LEAD_FORM_TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`template-card ${templateId === t.id ? 'active' : ''}`}
                onClick={() => applyTemplate(t.id)}
              >
                <div className="template-name">{t.name}</div>
                <div className="template-desc">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-label" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            Fields
          </div>
          <p className="hint" style={{ marginBottom: 14 }}>
            Check the fields this form should collect. Fields marked <strong>Required by CMS</strong>{' '}
            can&apos;t be removed. Labels are editable — customers see whatever you type here.
          </p>
          {LEAD_SECTIONS.map((section) => {
            const sectionFields = LEAD_FIELD_CATALOG.filter((f) => f.section === section);
            if (sectionFields.length === 0) return null;
            return (
              <details key={section} className="catalog-section" open={section === 'Contact Details' || section === 'Vehicle Interest'}>
                <summary>{section}</summary>
                <div className="catalog-rows">
                  {sectionFields.map((f) => {
                    const id = fieldId(f.node, f.key);
                    const s = fieldState[id];
                    return (
                      <div className="catalog-row" key={id}>
                        <label className="catalog-check">
                          <input
                            type="checkbox"
                            checked={s.included}
                            disabled={f.locked}
                            onChange={(e) => toggleField(f, e.target.checked)}
                          />
                        </label>
                        <input
                          className="catalog-label-input"
                          value={s.label}
                          disabled={!s.included}
                          onChange={(e) => updateLabel(f, e.target.value)}
                        />
                        <label className="catalog-required">
                          <input
                            type="checkbox"
                            checked={s.required}
                            disabled={f.locked || !s.included}
                            onChange={(e) => toggleRequired(f, e.target.checked)}
                          />
                          Required
                        </label>
                        {f.locked && <span className="pill locked-pill">Required by CMS</span>}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-label" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            Live Preview
          </div>
          <LeadFormRenderer
            fields={selectedFields}
            values={previewValues}
            onChange={(id, val) => setPreviewValues((prev) => ({ ...prev, [id]: val }))}
          />
        </div>

        <button className="cta" onClick={save} disabled={saving} style={{ marginTop: 20 }}>
          {saving ? 'Creating…' : 'Create Lead Form'}
        </button>

        <div className="brand-footer">CMS Systems — Smarter tools. Easy integration. Better results.</div>
      </div>

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </>
  );
}
