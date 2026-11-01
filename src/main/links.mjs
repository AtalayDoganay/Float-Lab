// The only URLs the app will hand to the system browser. Exact-string matching:
// no prefixes, no hosts, no schemes other than the listed https links.

export const APPROVED_LINKS = Object.freeze([
  'https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf',
  'https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf',
  'https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html',
  // Sources of the Rose Float archive photos and program facts (content/archive.mjs).
  'https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/',
  'https://www.calpoly.edu/news/cal-poly-float-wins-crown-city-innovator-award-2024-rose-parade',
  'https://www.cpp.edu/news/content/2025/01/cal-poly-universities-win-leishman-public-spirit-award-for-76th-rose-float/index.shtml',
  'https://www.calpoly.edu/news/cal-poly-float-wins-sweepstakes-award-2026-rose-parade',
  'https://www.rosefloat.org/cal-poly-rose-float',
  'https://www.rosefloat.org/our-history',
  'https://www.cpp.edu/news/content/2024/01/cal-poly-universities-75th-rose-float-wins-innovator-award/',
]);

export function isApprovedLink(url) {
  return typeof url === 'string' && APPROVED_LINKS.includes(url);
}
