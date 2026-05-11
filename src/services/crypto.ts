// Mirrors CQUPTRollcall/Services/CryptoUtil.swift CryptoUtil.encryptPassword
//
// AES-128-CBC with PKCS7 padding. Key & IV derive from the provided salt.
// Plaintext is `randomString(64) + password` (NOT hex random — visible chars
// from the same charset as randomString) before AES.
//
// MUST byte-perfect match the Swift / Go / Python upstream impls.

import CryptoJS from 'crypto-js';

const CHARSET = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';

function randomString(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return out;
}

/**
 * AES-128-CBC encrypt password with salt key, returns base64 ciphertext.
 * If `key` is empty, returns the password as-is (matches Swift behavior).
 */
export function encryptPassword(password: string, key: string): string {
  if (!key) return password;

  const iv = randomString(16);
  const padding = randomString(64);
  const plaintext = padding + password;

  // CryptoJS expects WordArrays. Use Utf8 encoding for key/iv/plaintext.
  const keyWA = CryptoJS.enc.Utf8.parse(key);
  const ivWA = CryptoJS.enc.Utf8.parse(iv);
  const plaintextWA = CryptoJS.enc.Utf8.parse(plaintext);

  const encrypted = CryptoJS.AES.encrypt(plaintextWA, keyWA, {
    iv: ivWA,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}
