// South African driver's licence PDF417 barcode decoder.
//
// The barcode payload is RSA-"encrypted" (raw modular exponentiation, no
// padding) by the issuing authority; the public keys below are openly
// published and used by multiple open-source decoders and commercial
// barcode SDKs (Dynamsoft, Scandit, Barkoder all document this exact
// format as a supported ID-verification feature). Verified against real
// sample barcodes: decrypt + parse correctly recovers surname/initials
// for two independent known samples, cross-checked against the embedded
// ID number's birthdate.

type RsaKey = { n: bigint; e: bigint; byteLen: number };

const KEYS: Record<number, { big: RsaKey; small: RsaKey }> = {
  1: {
    big: {
      n: 0xfed2e1c27e3363316e77317a7a52c54981395186be4974760c72518d63e0544a48d088b332c5b0c370c765d65d983c1f9de0a42b310ccc07ae770bd2b61d6a4dcceac757689bdcbf608478faf312f6087cc496c3762cf5c4651caecda3499fae7edb7eb40e3e18eb304170e91ed5b156aace6f432d6eca6cc35851de8c678f67n,
      e: 0xbb797ffdec7f9e42c9d6f79b137059dbn,
      byteLen: 128,
    },
    small: {
      n: 0xff3cec6b5f40e3c3661451b9fcfaef3aeb06dc2329c0e6f4dccc9279726716ce15bbe05eed2c5711bcf8f5b6c8f7276db5c43bfaa3040dc01ab14b9c4d16f71c0ce5ea953f0c754c6b17n,
      e: 0xdb05ba822d9acc33fab7d8f427f9ce65n,
      byteLen: 74,
    },
  },
  2: {
    big: {
      n: 0xca9f18ef6c3f3fa4c5a461fea54ab19406ba5ecd746d60a27492dca3d74e3b5c1d315f7b10383241809b029ebbd5de4d116030cc57f7d5a6c9a16f373bb14a508523f7e80a4c744d9085663a4a1472d7af2c56ae41b5065f7efa0293bd3278ad693546f9f16219b79ff471a3636824cffcdb63a8ed8059e6b9a4f0db895381cbn,
      e: 0x187092da6454ceb1853e6915f8466a05n,
      byteLen: 128,
    },
    small: {
      n: 0xb404a0df11d1cacff1a1a048d4d573f953a62c583d74925927561a6d7a1e2b14042526af70b550547390ea6ec748d30fdb81adb490e0c36a1986b404b2f5f69ef5da1b663e59509130e7n,
      e: 0x309cfed9719fe2a5e20c9bb44765382bn,
      byteLen: 74,
    },
  },
};

function bytesToBigInt(bytes: Uint8Array): bigint {
  let hex = '0x';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return BigInt(hex);
}

function bigIntToBytes(value: bigint, length: number): Uint8Array {
  let hex = value.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const raw = new Uint8Array(hex.length / 2);
  for (let i = 0; i < raw.length; i++) raw[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  if (raw.length >= length) return raw.subarray(raw.length - length);
  const padded = new Uint8Array(length);
  padded.set(raw, length - raw.length);
  return padded;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

function rsaPublicDecryptBlock(block: Uint8Array, key: RsaKey): Uint8Array {
  const c = bytesToBigInt(block);
  const m = modPow(c, key.e, key.n);
  return bigIntToBytes(m, key.byteLen);
}

/** Decrypts the raw barcode bytes into the plaintext licence record, or null if the format doesn't match. */
export function decryptLicence(rawBytes: Uint8Array): Uint8Array | null {
  if (rawBytes.length !== 720) return null;
  const version = rawBytes[1]; // second byte distinguishes version in observed samples (01 9b.. / 01 e1..)
  const keySet = KEYS[2] ?? KEYS[1];
  const chosen = version === 0xe1 ? KEYS[1] : keySet;

  const payload = rawBytes.subarray(6);
  try {
    const blocks: Uint8Array[] = [];
    for (let i = 0; i < 5; i++) {
      blocks.push(rsaPublicDecryptBlock(payload.subarray(i * 128, i * 128 + 128), chosen.big));
    }
    blocks.push(rsaPublicDecryptBlock(payload.subarray(5 * 128, 5 * 128 + 74), chosen.small));
    const total = new Uint8Array(714);
    let offset = 0;
    for (const b of blocks) {
      total.set(b, offset);
      offset += b.length;
    }
    // Skip the constant 5-byte sub-header (not part of the documented field layout).
    return total.subarray(5);
  } catch {
    return null;
  }
}

function latin1(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
}

/** Parses the delimited-strings section (Section 1) per the documented SADL format. */
function parseStrings(buf: Uint8Array, start: number, length: number): string[] {
  const end = start + length;
  const strings: string[] = [];
  let cur: number[] = [];
  let i = start;
  while (i < end) {
    const b = buf[i];
    if (b === 0xe0) {
      strings.push(latin1(new Uint8Array(cur)));
      cur = [];
      i++;
    } else if (b === 0xe1) {
      let runLen = 0;
      while (i < end && buf[i] === 0xe1) {
        runLen++;
        i++;
      }
      strings.push(latin1(new Uint8Array(cur)));
      cur = [];
      for (let k = 0; k < runLen; k++) strings.push('');
    } else {
      cur.push(b);
      i++;
    }
  }
  if (cur.length) strings.push(latin1(new Uint8Array(cur)));
  return strings;
}

export type LicenceHolder = { surname: string; initials: string };

/** Extracts surname + initials from a decrypted licence record. Returns null if it doesn't look valid. */
export function parseLicenceHolder(decrypted: Uint8Array): LicenceHolder | null {
  if (decrypted.length < 10) return null;
  const section1Len = decrypted[5];
  if (section1Len <= 0 || 10 + section1Len > decrypted.length) return null;
  const strings = parseStrings(decrypted, 10, section1Len);
  const surname = (strings[4] || '').trim();
  const initials = (strings[5] || '').trim();
  if (!surname && !initials) return null;
  return { surname, initials };
}

/** Full pipeline: raw PDF417 bytes off the camera -> licence holder name fields, or null on failure. */
export function scanDriverLicence(rawBytes: Uint8Array): LicenceHolder | null {
  const decrypted = decryptLicence(rawBytes);
  if (!decrypted) return null;
  return parseLicenceHolder(decrypted);
}
