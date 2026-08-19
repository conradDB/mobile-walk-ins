'use client';

import { SavedLeadField, fieldId } from '../../lib/cmsLead';
import { LEAD_SECTIONS } from '../../lib/leadFields';

function Req() {
  return <span className="req">*</span>;
}

export default function LeadFormRenderer({
  fields,
  values,
  onChange,
}: {
  fields: SavedLeadField[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
}) {
  const bySection = new Map<string, SavedLeadField[]>();
  for (const f of fields) {
    const section = f.section || 'Other';
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push(f);
  }
  const orderedSections = [...LEAD_SECTIONS, 'Other'].filter((s) => bySection.has(s));

  return (
    <>
      {orderedSections.map((section, i) => (
        <div key={section}>
          <div className="section-label" style={i === 0 ? { marginTop: 0, paddingTop: 0, borderTop: 'none' } : undefined}>
            {section}
          </div>
          <div className="grid">
            {bySection.get(section)!.map((f) => {
              const id = fieldId(f.node, f.key);
              const value = values[id];

              if (f.inputType === 'checkbox') {
                return (
                  <label key={id} className="lead-checkbox">
                    <input type="checkbox" checked={!!value} onChange={(e) => onChange(id, e.target.checked)} />
                    {f.label} {f.required && <Req />}
                  </label>
                );
              }

              const isFull = f.inputType === 'textarea';
              return (
                <div className={`field${isFull ? ' full' : ''}`} key={id}>
                  <label>
                    {f.label} {f.required && <Req />}
                  </label>
                  {f.inputType === 'select' ? (
                    <select value={value || ''} onChange={(e) => onChange(id, e.target.value)}>
                      <option value="">Select…</option>
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.inputType === 'textarea' ? (
                    <textarea
                      value={value || ''}
                      onChange={(e) => onChange(id, e.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  ) : (
                    <input
                      type={
                        f.inputType === 'datetime'
                          ? 'datetime-local'
                          : f.inputType === 'date'
                          ? 'date'
                          : f.inputType === 'number'
                          ? 'number'
                          : f.inputType === 'email'
                          ? 'email'
                          : f.inputType === 'tel'
                          ? 'tel'
                          : 'text'
                      }
                      value={value || ''}
                      onChange={(e) => onChange(id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
