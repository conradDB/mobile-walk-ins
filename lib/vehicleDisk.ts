// South African motor vehicle licence disc PDF417 barcode — best-effort reader.
//
// Unlike the driver's licence (lib/sadl.ts), there is no publicly documented
// field-level spec for this barcode's contents, so we deliberately do NOT
// claim to reliably extract Make/Model/Registration by fixed position. Instead:
//  1. Check whether the payload is plain, mostly-printable text (plausible —
//     a vehicle disc carries far less fraud risk than an identity document).
//  2. If not, note that as "encrypted/binary — unverified" rather than guessing.
//  3. Pattern-match a VIN (a strict, standardised 17-character format) out of
//     whatever text is available, since that's identifiable with confidence.
//  4. Always return the readable raw text so the operator can see/copy
//     anything the pattern match missed (engine number, make, model, etc.)
//     into the booking themselves.

const VIN_PATTERN = /\b([A-HJ-NPR-Z0-9]{17})\b/; // ISO 3779: no I, O, Q

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

export type VehicleDiskResult = {
  /** True if the payload looked like plain text rather than binary/encrypted data. */
  isPlainText: boolean;
  /** Best-effort readable rendering of the payload, for the operator to review. */
  rawText: string;
  /** VIN extracted via pattern match, if a confident match was found. */
  vin: string | null;
};

export function readVehicleDisk(rawBytes: Uint8Array): VehicleDiskResult {
  const ratio = printableRatio(rawBytes);
  const isPlainText = ratio > 0.85;
  const rawText = toText(rawBytes);
  const vinMatch = rawText.match(VIN_PATTERN);
  return {
    isPlainText,
    rawText,
    vin: vinMatch ? vinMatch[1] : null,
  };
}
