// The only URLs the app will hand to the system browser. Exact-string matching:
// no prefixes, no hosts, no schemes other than the listed https links.

export const APPROVED_LINKS = Object.freeze([
  'https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf',
  'https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf',
  'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html',
]);

export function isApprovedLink(url) {
  return typeof url === 'string' && APPROVED_LINKS.includes(url);
}
