'use client';

import { useEffect, useMemo, useState } from 'react';
import LeadFormRenderer from './LeadFormRenderer';
import { LEAD_FIELD_CATALOG, LEAD_SECTIONS, LeadFieldDef } from '../../lib/leadFields';
import { LEAD_FORM_TEMPLATES, fieldsForTemplate } from '../../lib/leadFormTemplates';
import { SavedLeadField, fieldId } from '../../lib/cmsLead';

type FieldState = {
  included: boolean;
  required: boolean;
  label: string;
};

function stateFromFields(fields?: SavedLeadField[]): Record<string, FieldState> {
  const saved = new Map((fields || []).map((f) => [fieldId(f.node, f.key), f]));
  const state: Record<string, FieldState> = {};
  for (const f of LEAD_FIELD_CATALOG) {
    const id = fieldId(f.node, f.key);
    const savedField = saved.get(id);
    state[id] = savedField
      ? { included: true, required: savedField.required, label: savedField.label }
      : { included: !!f.locked, required: !!f.locked, label: f.label };
  }
  return state;
}

/**
 * Self-contained template picker + field catalog + live preview, shared by
 * the "create" and "edit" lead-form admin pages. Owns its own field-selection
 * state; reports the resulting field list up to the parent whenever it changes.
 */
export default function LeadFieldBuilder({
  initialFields,
  onChange,
}: {
  initialFields?: SavedLeadField[];
  onChange: (fields: SavedLeadField[]) => void;
}) {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [fieldState, setFieldState] = useState<Record<string, FieldState>>(() => stateFromFields(initialFields));
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

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

  useEffect(() => {
    onChange(selectedFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFields]);

  return (
    <>
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
    </>
  );
}
