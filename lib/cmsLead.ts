import { LeadFieldDef, LeadFieldNode } from './leadFields';

/** A field as stored in lead_forms.fields (catalog def + admin's required/label choices). */
export type SavedLeadField = Pick<
  LeadFieldDef,
  'node' | 'key' | 'apiKey' | 'inputType' | 'valueMap' | 'boolAsNative' | 'locked' | 'options' | 'section'
> & { label: string; required: boolean };

export function fieldId(node: LeadFieldNode, key: string): string {
  return `${node}:${key}`;
}

function encodeValue(field: SavedLeadField, raw: unknown): unknown {
  if (field.inputType === 'checkbox') {
    const truthy = raw === true || raw === 'true' || raw === '1' || raw === 'on';
    return field.boolAsNative ? truthy : truthy ? '1' : '0';
  }
  // <input type="datetime-local"> yields "yyyy-MM-ddTHH:mm" — CMS wants
  // "yyyy-MM-dd HH:mm:ss".
  if (field.inputType === 'datetime' && typeof raw === 'string' && raw.includes('T')) {
    const [datePart, timePart] = raw.split('T');
    return `${datePart} ${timePart}${timePart.length === 5 ? ':00' : ''}`;
  }
  if (typeof raw === 'string' && field.valueMap && field.valueMap[raw] !== undefined) {
    return field.valueMap[raw];
  }
  return raw;
}

export type UtmValues = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

/**
 * Builds the nested CMS "lead" payload from a flat submitted-values map
 * (keyed by fieldId(node,key)). Node casing is deliberately inconsistent
 * here to match the spec's own example payload byte-for-byte: contact,
 * seeks, referrer, options stay lowercase-first; TradeIns, Appointment,
 * DepositReservation, UTMParams are PascalCase.
 */
export function buildLeadPayload(
  fields: SavedLeadField[],
  values: Record<string, unknown>,
  dealer: { dealer_ref: string; dealer_floor: string },
  source: string,
  utm?: UtmValues
) {
  const byNode: Record<string, Record<string, unknown>> = {};

  for (const field of fields) {
    const raw = values[fieldId(field.node, field.key)];
    if (raw === undefined || raw === null || raw === '') continue;
    const jsonKey = field.apiKey ?? field.key;
    const val = encodeValue(field, raw);
    (byNode[field.node] ??= {})[jsonKey] = val;
  }

  const lead: Record<string, unknown> = {
    dealerRef: dealer.dealer_ref,
    dealerFloor: dealer.dealer_floor,
    source,
    ...(byNode.lead || {}),
    contact: byNode.contact || {},
    seeks: byNode.seeks || {},
  };
  if (byNode.referrer) lead.referrer = byNode.referrer;
  if (byNode.tradeIn) lead.TradeIns = [byNode.tradeIn];
  if (byNode.appointment) lead.Appointment = byNode.appointment;
  if (byNode.depositReservation) lead.DepositReservation = byNode.depositReservation;

  if (utm && (utm.source || utm.medium || utm.campaign || utm.term || utm.content)) {
    lead.UTMParams = {
      ...(utm.source && { UtmSource: utm.source }),
      ...(utm.medium && { UtmMedium: utm.medium }),
      ...(utm.campaign && { UtmCampaign: utm.campaign }),
      ...(utm.term && { UtmTerm: utm.term }),
      ...(utm.content && { UtmContent: utm.content }),
    };
  }

  return { lead };
}

export type CmsLeadResponse = {
  code?: string;
  leadReference?: string;
  status?: string;
  message?: string;
};

export async function submitLeadToCms(
  payload: unknown
): Promise<{ ok: boolean; httpStatus: number; data: CmsLeadResponse | null }> {
  const token = process.env.CMS_LEAD_API_TOKEN;
  if (!token) {
    throw new Error('Missing CMS_LEAD_API_TOKEN environment variable on this deployment.');
  }
  const res = await fetch('https://leadsv3.cmscloud.co.za/api/lead/saveleadasync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(payload),
  });
  let data: CmsLeadResponse | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, httpStatus: res.status, data };
}
