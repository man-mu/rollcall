// Mirrors QRUtil from CQUPTRollcall/Services/CryptoUtil.swift

const QR_HEX_RE = /^[a-f0-9]{42}$/i;
const URL_RE = /!3~([a-fA-F0-9]+)/;

/**
 * Extract 42-char hex QR data from raw scan. No timestamp validation —
 * server-side handles expiry. Empty string means invalid.
 */
export function extractQRData(rawData: string): string {
  let data = rawData;

  if (data.includes('!3~')) {
    const m = URL_RE.exec(data);
    if (m && m[1]) {
      data = m[1];
    } else {
      return '';
    }
  }

  data = data.toLowerCase();

  if (!QR_HEX_RE.test(data)) return '';

  return data;
}
