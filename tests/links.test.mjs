import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_LINKS, isApprovedLink } from '../src/main/links.mjs';

test('the two manufacturer manuals and the Cisco subnet page are approved', () => {
  const expected = [
    'https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf',
    'https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf',
    'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html',
  ];
  for (const url of expected) {
    assert.ok(APPROVED_LINKS.includes(url), `${url} should be listed`);
    assert.equal(isApprovedLink(url), true);
  }
});

test('local files, scripts, look-alike hosts, and other paths are rejected', () => {
  const rejected = [
    'file:///C:/Windows/system.ini',
    'javascript:alert(1)',
    'https://gilderfluke.com.evil.example/wp-content/uploads/2019/11/PCMACs_Manual.pdf',
    'https://gilderfluke.com/wp-content/uploads/2019/11/Other.pdf',
    'http://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf',
    '',
    null,
    undefined,
    42,
  ];
  for (const url of rejected) {
    assert.equal(isApprovedLink(url), false, `${String(url)} should be rejected`);
  }
});
