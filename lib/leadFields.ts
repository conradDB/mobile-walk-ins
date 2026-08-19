import { COUNTRY_CODES } from './countryCodes';

// Catalog of customer-facing fields from the CMS LMS 3rd Party Lead Injection
// API (v3.17). Deliberately excludes fields that are back-office/integration
// only and have no place on a self-service customer form: transactionID,
// mmCode, modelCode, stockNr, extLeadRef, leadPostbackReference,
// depositStatus, depositTransactionId, vin, dealerSalesPerson. UTM params and
// CLID are also excluded here — those are captured automatically from the
// page URL at submit time (see lib/cmsLead.ts), not something a customer
// fills in.

export type LeadFieldInputType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'number';

export type LeadFieldNode = 'lead' | 'contact' | 'seeks' | 'tradeIn' | 'appointment' | 'depositReservation' | 'referrer';

export type LeadFieldDef = {
  node: LeadFieldNode;
  key: string;
  /** JSON property name CMS actually expects, when it differs from `key` (their casing
   * is inconsistent between nodes — verified against the spec's own example payload). */
  apiKey?: string;
  label: string;
  inputType: LeadFieldInputType;
  options?: string[];
  /** Maps a displayed option label to the literal string CMS expects, when they differ. */
  valueMap?: Record<string, string>;
  /** true/false booleans (CMS wants a native bool here, not the usual "1"/"0" string). */
  boolAsNative?: boolean;
  /** CMS hard-requires this field on any lead — always included, can't be unchecked. */
  locked?: boolean;
  section: string;
};

export const LEAD_SECTIONS = [
  'Contact Details',
  'Address',
  'Vehicle Interest',
  'Trade-In',
  'Appointment',
  'Finance & Deposit',
  'Marketing & Consent',
  'Referred By',
] as const;

const CONTACT_TITLES = ['Mr', 'Mrs', 'Ms', 'Dr', 'Miss'];
const CONTACT_METHODS = ['Email', 'Cellphone', 'Telephone', 'SMS', 'WhatsApp'];
const CREDIT_GRADINGS = ['Excellent', 'Good', 'Favourable', 'Average', 'Below Average', 'Unfavourable', 'Poor', 'Unknown'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const PART_OF_DAY = ['Morning', 'Afternoon', 'Evening'];
const COUNTRY_OPTIONS = COUNTRY_CODES.map((c) => `${c.code} - ${c.name}`);

export const LEAD_FIELD_CATALOG: LeadFieldDef[] = [
  // Contact Details
  { node: 'contact', key: 'title', label: 'Title', inputType: 'select', options: CONTACT_TITLES, section: 'Contact Details' },
  { node: 'contact', key: 'firstName', label: 'First Name', inputType: 'text', locked: true, section: 'Contact Details' },
  { node: 'contact', key: 'surname', label: 'Surname', inputType: 'text', locked: true, section: 'Contact Details' },
  { node: 'contact', key: 'email', label: 'Email', inputType: 'email', section: 'Contact Details' },
  { node: 'contact', key: 'cellPhone', label: 'Cell Phone', inputType: 'tel', locked: true, section: 'Contact Details' },
  { node: 'contact', key: 'officePhone', label: 'Office Phone', inputType: 'tel', section: 'Contact Details' },
  { node: 'contact', key: 'preferredContactMethod', label: 'Preferred Contact Method', inputType: 'select', options: CONTACT_METHODS, section: 'Contact Details' },
  { node: 'contact', key: 'preferredContactTime', label: 'Preferred Contact Time', inputType: 'datetime', section: 'Contact Details' },
  { node: 'contact', key: 'driversLicense', label: 'Has Driver’s License', inputType: 'checkbox', section: 'Contact Details' },
  { node: 'contact', key: 'idNo', label: 'ID Number', inputType: 'text', section: 'Contact Details' },
  { node: 'contact', key: 'birthDate', label: 'Date of Birth', inputType: 'date', section: 'Contact Details' },
  { node: 'contact', key: 'gender', label: 'Gender', inputType: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'], section: 'Contact Details' },
  { node: 'contact', key: 'citizenship', label: 'Citizenship', inputType: 'text', section: 'Contact Details' },
  { node: 'contact', key: 'homeLanguage', label: 'Home Language', inputType: 'text', section: 'Contact Details' },
  { node: 'contact', key: 'incomeBracket', label: 'Income Bracket', inputType: 'text', section: 'Contact Details' },
  { node: 'contact', key: 'creditGrading', label: 'Credit Grading', inputType: 'select', options: CREDIT_GRADINGS, section: 'Contact Details' },
  { node: 'contact', key: 'companyName', label: 'Company Name', inputType: 'text', section: 'Contact Details' },
  { node: 'contact', key: 'companyType', label: 'Company Type', inputType: 'text', section: 'Contact Details' },
  {
    node: 'lead',
    key: 'countryCode',
    label: 'Country',
    inputType: 'select',
    options: COUNTRY_OPTIONS,
    valueMap: Object.fromEntries(COUNTRY_OPTIONS.map((o, i) => [o, COUNTRY_CODES[i].code])),
    section: 'Contact Details',
  },

  // Address
  { node: 'contact', key: 'residentialAddressLine1', label: 'Residential Address Line 1', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'residentialAddressLine2', label: 'Residential Address Line 2', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'residentialAddressSuburb', label: 'Residential Suburb', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'residentialAddressCity', label: 'Residential City', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'residentialAddressPostalCode', label: 'Residential Postal Code', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'residentialAddressProvince', label: 'Residential Province', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'postalAddressLine1', label: 'Postal Address Line 1', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'postalAddressLine2', label: 'Postal Address Line 2', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'postalAddressSuburb', label: 'Postal Suburb', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'postalAddressCity', label: 'Postal City', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'postalAddressCode', label: 'Postal Code', inputType: 'text', section: 'Address' },
  { node: 'contact', key: 'postalAddressProvince', label: 'Postal Province', inputType: 'text', section: 'Address' },

  // Vehicle Interest
  {
    node: 'seeks',
    key: 'used',
    label: 'Vehicle Condition',
    inputType: 'select',
    options: ['New Vehicle', 'Used Vehicle'],
    valueMap: { 'New Vehicle': '0', 'Used Vehicle': '1' },
    locked: true,
    section: 'Vehicle Interest',
  },
  { node: 'seeks', key: 'brand', label: 'Make', inputType: 'text', locked: true, section: 'Vehicle Interest' },
  { node: 'seeks', key: 'modelRange', apiKey: 'modelrange', label: 'Model Range', inputType: 'text', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'model', label: 'Model', inputType: 'text', locked: true, section: 'Vehicle Interest' },
  { node: 'seeks', key: 'year', label: 'Year', inputType: 'text', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'colour', label: 'Colour', inputType: 'text', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'kms', label: 'Mileage (km)', inputType: 'text', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'powertrain', label: 'Powertrain', inputType: 'select', options: FUEL_TYPES, section: 'Vehicle Interest' },
  { node: 'seeks', key: 'registration', label: 'Registration Number', inputType: 'text', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'deposit', label: 'Deposit Offered', inputType: 'number', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'testDrive', label: 'Interested in a Test Drive', inputType: 'checkbox', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'finance', label: 'Interested in Finance', inputType: 'checkbox', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'tradeIn', label: 'Has a Trade-In', inputType: 'checkbox', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'valuation', label: 'Wants a Trade-In Valuation', inputType: 'checkbox', section: 'Vehicle Interest' },
  { node: 'seeks', key: 'comments', label: 'Comments', inputType: 'textarea', section: 'Vehicle Interest' },

  // Trade-In (single trade-in vehicle — sent as a one-item TradeIns array).
  // CMS's example payload uses PascalCase keys for this node specifically.
  { node: 'tradeIn', key: 'make', apiKey: 'Make', label: 'Trade-In Make', inputType: 'text', section: 'Trade-In' },
  { node: 'tradeIn', key: 'model', apiKey: 'Model', label: 'Trade-In Model', inputType: 'text', section: 'Trade-In' },
  { node: 'tradeIn', key: 'variant', apiKey: 'Variant', label: 'Trade-In Variant', inputType: 'text', section: 'Trade-In' },
  { node: 'tradeIn', key: 'year', apiKey: 'Year', label: 'Trade-In Year', inputType: 'text', section: 'Trade-In' },
  { node: 'tradeIn', key: 'mileage', apiKey: 'Mileage', label: 'Trade-In Mileage (km)', inputType: 'text', section: 'Trade-In' },
  { node: 'tradeIn', key: 'price', apiKey: 'Price', label: 'Trade-In Expected Value', inputType: 'number', section: 'Trade-In' },
  { node: 'tradeIn', key: 'fuelType', apiKey: 'FuelType', label: 'Trade-In Fuel Type', inputType: 'select', options: FUEL_TYPES, section: 'Trade-In' },
  { node: 'tradeIn', key: 'regNo', apiKey: 'RegNo', label: 'Trade-In Registration Number', inputType: 'text', section: 'Trade-In' },
  { node: 'tradeIn', key: 'isFinanced', apiKey: 'IsFinanced', label: 'Trade-In Still Under Finance', inputType: 'checkbox', boolAsNative: true, section: 'Trade-In' },

  // Appointment — PascalCase keys per the spec's example payload.
  { node: 'appointment', key: 'dateOfAppointment', apiKey: 'DateOfAppointment', label: 'Appointment Date & Time', inputType: 'datetime', section: 'Appointment' },
  { node: 'appointment', key: 'partOfTheDay', apiKey: 'PartOfTheDay', label: 'Part of Day', inputType: 'select', options: PART_OF_DAY, section: 'Appointment' },
  { node: 'appointment', key: 'appointmentType', apiKey: 'AppointmentType', label: 'Appointment Type', inputType: 'text', section: 'Appointment' },
  { node: 'appointment', key: 'consentEmail', apiKey: 'ConsentEmail', label: 'Consent to Email Reminders', inputType: 'checkbox', boolAsNative: true, section: 'Appointment' },
  { node: 'appointment', key: 'consentPhone', apiKey: 'ConsentPhone', label: 'Consent to Phone Reminders', inputType: 'checkbox', boolAsNative: true, section: 'Appointment' },
  { node: 'appointment', key: 'consentSMS', apiKey: 'ConsentSMS', label: 'Consent to SMS Reminders', inputType: 'checkbox', boolAsNative: true, section: 'Appointment' },

  // Finance & Deposit — PascalCase keys per the spec's example payload.
  { node: 'depositReservation', key: 'enquiryType', apiKey: 'EnquiryType', label: 'Enquiry Type', inputType: 'text', section: 'Finance & Deposit' },
  { node: 'depositReservation', key: 'vehicleURL', apiKey: 'VehicleURL', label: 'Vehicle Listing URL', inputType: 'text', section: 'Finance & Deposit' },
  { node: 'depositReservation', key: 'depositReservationAmount', apiKey: 'DepositReservationAmount', label: 'Deposit Amount', inputType: 'number', section: 'Finance & Deposit' },
  { node: 'depositReservation', key: 'financeType', apiKey: 'FinanceType', label: 'Finance Type', inputType: 'text', section: 'Finance & Deposit' },
  { node: 'depositReservation', key: 'financeDownPayment', apiKey: 'FinanceDownPayment', label: 'Finance Down Payment', inputType: 'number', section: 'Finance & Deposit' },
  { node: 'depositReservation', key: 'financeDuration', apiKey: 'FinanceDuration', label: 'Finance Duration (months)', inputType: 'text', section: 'Finance & Deposit' },
  { node: 'depositReservation', key: 'financeMonthlyFee', apiKey: 'FinanceMonthlyFee', label: 'Desired Monthly Payment', inputType: 'number', section: 'Finance & Deposit' },

  // Marketing & Consent
  { node: 'lead', key: 'promotionalCode', label: 'Promotional Code', inputType: 'text', section: 'Marketing & Consent' },
  { node: 'contact', key: 'marketingConsent', label: 'General Marketing Consent', inputType: 'checkbox', section: 'Marketing & Consent' },
  { node: 'contact', key: 'marketingConsentEmail', label: 'Marketing Consent — Email', inputType: 'checkbox', section: 'Marketing & Consent' },
  { node: 'contact', key: 'marketingConsentPhone', label: 'Marketing Consent — Phone', inputType: 'checkbox', section: 'Marketing & Consent' },
  { node: 'contact', key: 'marketingConsentSMS', label: 'Marketing Consent — SMS', inputType: 'checkbox', section: 'Marketing & Consent' },
  { node: 'contact', key: 'marketingConsentWhatsapp', label: 'Marketing Consent — WhatsApp', inputType: 'checkbox', section: 'Marketing & Consent' },

  // Referred By
  { node: 'referrer', key: 'firstName', label: 'Referrer First Name', inputType: 'text', section: 'Referred By' },
  { node: 'referrer', key: 'surname', label: 'Referrer Surname', inputType: 'text', section: 'Referred By' },
  { node: 'referrer', key: 'email', label: 'Referrer Email', inputType: 'email', section: 'Referred By' },
  { node: 'referrer', key: 'cellPhone', label: 'Referrer Cell Phone', inputType: 'tel', section: 'Referred By' },
];

export function findFieldDef(node: LeadFieldNode, key: string): LeadFieldDef | undefined {
  return LEAD_FIELD_CATALOG.find((f) => f.node === node && f.key === key);
}

export const LOCKED_FIELDS = LEAD_FIELD_CATALOG.filter((f) => f.locked);
