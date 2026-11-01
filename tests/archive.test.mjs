import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ARCHIVE_DIR, ARCHIVE_PHOTOS, PROGRAM_FACTS } from '../src/renderer/content/archive.mjs';
import { isApprovedLink } from '../src/main/links.mjs';

test('five archive photos in year order with captions, credits and sources', () => {
  assert.equal(ARCHIVE_DIR, 'assets/archive/');
  assert.deepEqual(ARCHIVE_PHOTOS.map((p) => p.year), [1949, 1978, 2024, 2025, 2026]);
  assert.deepEqual(ARCHIVE_PHOTOS.map((p) => p.id), ['h', 'i', 'j', 'k', 'l']);
  assert.equal(ARCHIVE_PHOTOS.find((p) => p.year === 2025).award, 'Leishman Public Spirit Award');
  assert.equal(ARCHIVE_PHOTOS.find((p) => p.year === 2026).award, 'Sweepstakes Award');
  assert.equal(ARCHIVE_PHOTOS.find((p) => p.year === 1949).credit, 'Information Technology Services, Special Collections and Archives, Cal Poly; via Cal Poly Magazine');
  for (const p of ARCHIVE_PHOTOS) {
    assert.ok(p.rights.includes('not established'), `${p.id} carries the rights note`);
    assert.ok(/^[0-9a-f]{64}$/.test(p.sha256));
    assert.ok(p.file.endsWith('.png') && p.title && p.sourcePage && p.imageUrl);
  }
});

test('the bundled archive files are the supplied bytes', async () => {
  for (const p of ARCHIVE_PHOTOS) {
    const bytes = await fs.readFile(new URL(`../src/renderer/${ARCHIVE_DIR}${p.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), p.sha256, p.file);
  }
});

test('every archive source page and program fact is an approved link', () => {
  assert.equal(PROGRAM_FACTS.length, 7);
  for (const p of ARCHIVE_PHOTOS) assert.ok(isApprovedLink(p.sourcePage), p.sourcePage);
  for (const f of PROGRAM_FACTS) {
    assert.ok(isApprovedLink(f.sourceUrl), f.sourceUrl);
    assert.ok(f.text.length > 20);
  }
  assert.ok(PROGRAM_FACTS.some((f) => f.text.includes('San Luis Obispo')), 'the partner campus is credited');
});
