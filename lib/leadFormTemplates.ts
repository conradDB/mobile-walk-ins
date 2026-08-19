import { LEAD_FIELD_CATALOG, LeadFieldDef, LOCKED_FIELDS } from './leadFields';

export type LeadFormTemplate = {
  id: string;
  name: string;
  description: string;
  /** node:key pairs to pre-check, in addition to the always-locked fields. */
  fieldKeys: string[];
};

function fk(node: string, key: string) {
  return `${node}:${key}`;
}

export const LEAD_FORM_TEMPLATES: LeadFormTemplate[] = [
  {
    id: 'general-enquiry',
    name: 'General Enquiry',
    description: 'Name, contact details and which vehicle they’re interested in — the essentials.',
    fieldKeys: [
      fk('contact', 'title'),
      fk('contact', 'email'),
      fk('contact', 'preferredContactMethod'),
      fk('seeks', 'modelRange'),
      fk('seeks', 'colour'),
      fk('seeks', 'comments'),
    ],
  },
  {
    id: 'test-drive',
    name: 'Test Drive Request',
    description: 'General enquiry fields plus a preferred date/time and appointment type.',
    fieldKeys: [
      fk('contact', 'title'),
      fk('contact', 'email'),
      fk('contact', 'preferredContactMethod'),
      fk('seeks', 'modelRange'),
      fk('seeks', 'colour'),
      fk('seeks', 'testDrive'),
      fk('appointment', 'dateOfAppointment'),
      fk('appointment', 'partOfTheDay'),
      fk('appointment', 'appointmentType'),
    ],
  },
  {
    id: 'trade-in-valuation',
    name: 'Trade-In Valuation',
    description: 'Contact details plus the customer’s current vehicle for a valuation.',
    fieldKeys: [
      fk('contact', 'email'),
      fk('seeks', 'valuation'),
      fk('seeks', 'comments'),
      fk('tradeIn', 'make'),
      fk('tradeIn', 'model'),
      fk('tradeIn', 'variant'),
      fk('tradeIn', 'year'),
      fk('tradeIn', 'mileage'),
      fk('tradeIn', 'fuelType'),
    ],
  },
  {
    id: 'finance-reservation',
    name: 'Finance / Online Reservation',
    description: 'For online deposit/reservation enquiries with finance details.',
    fieldKeys: [
      fk('contact', 'email'),
      fk('seeks', 'finance'),
      fk('seeks', 'comments'),
      fk('depositReservation', 'enquiryType'),
      fk('depositReservation', 'depositReservationAmount'),
      fk('depositReservation', 'financeType'),
      fk('depositReservation', 'financeDownPayment'),
      fk('depositReservation', 'financeDuration'),
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch — just the fields CMS requires, add whatever else you need.',
    fieldKeys: [],
  },
];

/** Builds the initial field-selection state for the builder from a template. */
export function fieldsForTemplate(templateId: string): LeadFieldDef[] {
  const template = LEAD_FORM_TEMPLATES.find((t) => t.id === templateId);
  const keys = new Set(template?.fieldKeys || []);
  const locked = LOCKED_FIELDS;
  const extra = LEAD_FIELD_CATALOG.filter((f) => keys.has(fk(f.node, f.key)));
  return [...locked, ...extra];
}
