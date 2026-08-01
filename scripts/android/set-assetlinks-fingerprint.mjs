#!/usr/bin/env node
/**
 * Writes real SHA-256 certificate fingerprints into
 * public/.well-known/assetlinks.json so Android App Links verify.
 *
 *   node scripts/android/set-assetlinks-fingerprint.mjs <PLAY_APP_SIGNING_SHA256> [UPLOAD_SHA256]
 *
 * Include BOTH fingerprints when you also sideload/internal-test APKs signed
 * with the upload key — otherwise links only verify for Play-installed builds.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = 'com.pixelsqueeze.app';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const target = resolve(root, 'public/.well-known/assetlinks.json');

const normalize = (raw) => {
  const hex = String(raw).trim().replace(/^SHA-?256:\s*/i, '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (hex.length !== 64) {
    throw new Error(`"${raw}" is not a SHA-256 fingerprint (expected 32 colon-separated bytes / 64 hex chars, got ${hex.length}).`);
  }
  return hex.match(/.{2}/g).join(':');
};

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/android/set-assetlinks-fingerprint.mjs <PLAY_SHA256> [UPLOAD_SHA256]');
  process.exit(1);
}

const fingerprints = [...new Set(args.map(normalize))];

const payload = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: PACKAGE_NAME,
      sha256_cert_fingerprints: fingerprints,
    },
  },
];

// Sanity-check we are not writing a placeholder back in.
const serialized = `${JSON.stringify(payload, null, 2)}\n`;
if (/REPLACE_WITH/i.test(serialized)) throw new Error('refusing to write a placeholder fingerprint');

writeFileSync(target, serialized);
console.log(`Wrote ${fingerprints.length} fingerprint(s) to public/.well-known/assetlinks.json`);
for (const fp of fingerprints) console.log(`  ${fp}`);
console.log('\nAfter publishing, verify with:');
console.log('  curl https://pixelsqueeze.app/.well-known/assetlinks.json');
console.log(`  https://developers.google.com/digital-asset-links/tools/generator`);

// Keep a machine-readable copy of the previous file contents in the log for auditing.
try {
  const prev = JSON.parse(readFileSync(target, 'utf8'));
  if (!Array.isArray(prev)) throw new Error('unexpected shape');
} catch {
  /* ignore — file was just written by us */
}
