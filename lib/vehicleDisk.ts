// South African motor vehicle licence disc PDF417 barcode reader.
//
// Format confirmed from a real scanned sample (154 bytes, plain text, '%'
// delimited fields — see the field map below). Unlike the driver's licence,
// this payload is NOT encrypted:
//
//   %MVL1CC19%0154%4046E06D%1%4046048XBW0D%LN88YHGP%KFF593L%
//   Station wagon / Stasiewa%TOYOTA%COROLLA CROSS%Grey / Grys%
//   AHTKFAAG900643247%2ZR6D71820%2026-01-31%
//
// Header fields (position/length can vary) are followed by a fixed run of
// data fields ending in VIN, Engine Number, Expiry date — in that order.
// Since the VIN is identifiable with certainty (strict ISO 3779 format),
// it's used as an anchor: the fields around it are read by their offset
// from the VIN rather than from the start of the payload, so this still
// works if the header fields (disc/reference numbers) vary in length
// between vehicles.
//
// Only verified against one real sample so far. If a field looks wrong
// shaped for what it should be (e.g. "Make" isn't letters), it's left out
// rather than auto-filled with garbage — the operator fills it manually.

const VIN_EXACT = /^[A-HJ-NPR-Z0-9]{17}$/; // ISO 3779: no I, O, Q
const VIN_LOOSE = /\b([A-HJ-NPR-Z0-9]{17})\b/;

function printableRatio(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  let printable = 0;
  for (const b of bytes) {
    if ((b >= 0x20 && b <= 0x7e) || b === 0x0a || b === 0x0d || b === 0x09) printable++;
  }
  return printable / bytes.length;
}

function toText(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) {
    // Keep printable ASCII and common separators; render everything else as a
    // middle dot so structure is still visible without corrupting the string.
    s += (b >= 0x20 && b <= 0x7e) ? String.fromCharCode(b) : b === 0x0a || b === 0x0d ? '\n' : '·';
  }
  return s;
}

function splitFields(rawText: string): string[] {
  return rawText.split('%').map((f) => f.trim()).filter((f) => f.length > 0);
}

function firstOf(field: string | undefined): string | null {
  // Bilingual fields are "English / Afrikaans" — keep just the English part.
  if (!field) return null;
  return field.split('/')[0].trim() || null;
}

const REGISTRATION_SHAPE = /^[A-Z0-9]{4,10}$/i;
const MAKE_SHAPE = /^[A-Z][A-Z .-]{1,29}$/i;
const MODEL_SHAPE = /^[A-Z0-9][A-Z0-9 .-]{0,39}$/i;
const ENGINE_SHAPE = /^[A-Z0-9]{5,20}$/i;

function checked(value: string | null, shape: RegExp): string | null {
  return value && shape.test(value) ? value : null;
}

export type VehicleDiskResult = {
  /** True if the payload looked like plain text rather than binary/encrypted data. */
  isPlainText: boolean;
  /** Best-effort readable rendering of the payload, for the operator to review. */
  rawText: string;
  vin: string | null;
  engineNumber: string | null;
  make: string | null;
  model: string | null;
  registration: string | null;
};

export function readVehicleDisk(rawBytes: Uint8Array): VehicleDiskResult {
  const ratio = printableRatio(rawBytes);
  const isPlainText = ratio > 0.85;
  const rawText = toText(rawBytes);

  let vin: string | null = null;
  let engineNumber: string | null = null;
  let make: string | null = null;
  let model: string | null = null;
  let registration: string | null = null;

  if (isPlainText) {
    const fields = splitFields(rawText);
    const vinIndex = fields.findIndex((f) => VIN_EXACT.test(f));
    if (vinIndex !== -1) {
      vin = fields[vinIndex];
      engineNumber = checked(fields[vinIndex + 1] ?? null, ENGINE_SHAPE);
      model = checked(firstOf(fields[vinIndex - 2]), MODEL_SHAPE);
      make = checked(firstOf(fields[vinIndex - 3]), MAKE_SHAPE);
      registration = checked(fields[vinIndex - 6] ?? null, REGISTRATION_SHAPE);
    }
  }

  if (!vin) {
    const loose = rawText.match(VIN_LOOSE);
    if (loose) vin = loose[1];
  }

  return { isPlainText, rawText, vin, engineNumber, make, model, registration };
}

function toHex(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.subarray(i, i + 16);
    const hex = Array.from(chunk, (b) => b.toString(16).padStart(2, '0')).join(' ');
    const offset = i.toString(16).padStart(4, '0');
    lines.push(`${offset}  ${hex}`);
  }
  return lines.join('\n');
}

/**
 * Full, untruncated dump of a scanned disk payload — kept around so further
 * real-world samples (different vehicle types) can confirm the field layout
 * above holds before the debug view gets removed.
 */
export function debugDumpDisk(rawBytes: Uint8Array): string {
  const ratio = printableRatio(rawBytes);
  const rawText = toText(rawBytes);
  const vinMatch = rawText.match(VIN_LOOSE);
  return [
    `Length: ${rawBytes.length} bytes`,
    `Printable ratio: ${(ratio * 100).toFixed(0)}%`,
    `VIN match: ${vinMatch ? vinMatch[1] : '(none)'}`,
    '',
    '--- Text ---',
    rawText,
    '',
    '--- Hex ---',
    toHex(rawBytes),
  ].join('\n');
}
