// The Cal Poly Rose Float archive used by the opening film and the hub: five
// historical photographs, bundled byte for byte as supplied with the
// October 31, 2026 brief (docs/brief/2026-10-31-revision-4/SOURCES.md), with
// their captions, credits and sources, and the short grounded facts the film
// narrates. Public availability is not a reuse licence; check the image-use
// terms before public distribution.

export const ARCHIVE_DIR = 'assets/archive/';

const RIGHTS = 'Reference inclusion; redistribution license not established.';

export const ARCHIVE_PHOTOS = Object.freeze([
  Object.freeze({
    id: 'h', file: 'H_1949_Rocking_Horse.png', year: 1949, title: 'Rocking Horse', award: 'Award of Merit',
    credit: 'Information Technology Services, Special Collections and Archives, Cal Poly; via Cal Poly Magazine',
    sourcePage: 'https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/',
    imageUrl: 'https://magazine.calpoly.edu/wp-content/uploads/2024/05/ss24_rose-inset-rocking-horse-750x500.jpg',
    rights: RIGHTS, sha256: 'c1c4ca43e7950173b26fdfdec4f61368f53d4d130e16ee2656da14277003d6c7',
  }),
  Object.freeze({
    id: 'i', file: 'I_1978_Grin_And_Bear_It.png', year: 1978, title: 'Grin and Bear It', award: 'an early computer-controlled animation milestone',
    credit: 'Cal Poly Magazine; individual photographer not identified in the timeline caption',
    sourcePage: 'https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/',
    imageUrl: 'https://magazine.calpoly.edu/wp-content/uploads/2024/05/ss24_rose-float-timeline_grin-and-bear-it-750x500.jpg',
    rights: RIGHTS, sha256: 'f1598c5b70fb9b087295357990759dcc9dbf3e9f121af6de7a8e4ec1348af850',
  }),
  Object.freeze({
    id: 'j', file: 'J_2024_Shock_N_Roll.png', year: 2024, title: 'Shock n’ Roll: Powering the Musical Current', award: 'Crown City Innovator Award',
    credit: 'Tom Zasadzinski, Cal Poly Pomona; via Cal Poly News',
    sourcePage: 'https://www.calpoly.edu/news/cal-poly-float-wins-crown-city-innovator-award-2024-rose-parade',
    imageUrl: 'https://www.calpoly.edu/sites/default/files/styles/width_2048px/public/2024-01/news_rose-parade_hero_2.jpg?itok=qxlchNVX',
    rights: RIGHTS, sha256: 'd7882c8ae5cb3425588a01c6150cdfbd3eebc7def904c438121421499bede718',
  }),
  Object.freeze({
    id: 'k', file: 'K_2025_Nessies_Lakeside_Laughs.png', year: 2025, title: 'Nessie’s Lakeside Laughs', award: 'Leishman Public Spirit Award',
    credit: 'Cal Poly Pomona / CPP News; individual photographer not identified on the source page',
    sourcePage: 'https://www.cpp.edu/news/content/2025/01/cal-poly-universities-win-leishman-public-spirit-award-for-76th-rose-float/index.shtml',
    imageUrl: 'https://www.cpp.edu/news/img/news/2025/01/25rose-float-parade-pasadena.jpg',
    rights: RIGHTS, sha256: '1aa25f8123e26580f2180979f18204728bdd6a95487dec0cdd6945c2eec279d9',
  }),
  Object.freeze({
    id: 'l', file: 'L_2026_Jungle_Jumpstart.png', year: 2026, title: 'Jungle Jumpstart', award: 'Sweepstakes Award',
    credit: 'Tom Zasadzinski, Cal Poly Pomona; via Cal Poly News',
    sourcePage: 'https://www.calpoly.edu/news/cal-poly-float-wins-sweepstakes-award-2026-rose-parade',
    imageUrl: 'https://www.calpoly.edu/sites/default/files/styles/width_2048px/public/2026-01/26rose-parade1-lead-crop.jpg?itok=QimLHajG',
    rights: RIGHTS, sha256: '70b59eb9a893cf8297ba4dff0a2c2c2f8f9951256fbd3caae2c59ee038aab6f1',
  }),
]);

export const ARCHIVE_BY_ID = Object.freeze(Object.fromEntries(ARCHIVE_PHOTOS.map((p) => [p.id, p])));

export function archiveCaption(photo) {
  return `${photo.year} · ${photo.title} · ${photo.award}`;
}

// Researched October 31, 2026 (brief §12). Dates and verified names; no award totals, no "first ever" claims.
export const PROGRAM_FACTS = Object.freeze([
  Object.freeze({ id: 'joint', text: 'Students at Cal Poly Pomona and Cal Poly San Luis Obispo collaborate on the Rose Parade entry.', sourceUrl: 'https://www.rosefloat.org/cal-poly-rose-float' }),
  Object.freeze({ id: '1949', text: 'The first entry, “Rocking Horse,” won the Award of Merit in 1949.', sourceUrl: 'https://www.rosefloat.org/our-history' }),
  Object.freeze({ id: 'partnership', text: 'Pomona initially led much of the design and construction, with San Luis Obispo fundraising and decoration support; the cooperation continued after the campuses separated in 1966.', sourceUrl: 'https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/' }),
  Object.freeze({ id: '1978', text: '“Grin and Bear It” (1978) is identified by the university’s history as an early milestone introducing computer-controlled animation to the parade.', sourceUrl: 'https://magazine.calpoly.edu/spring-summer-2024/75-years-of-rose-float/' }),
  Object.freeze({ id: '2024', text: '“Shock n’ Roll: Powering the Musical Current” (2024) won the Crown City Innovator Award.', sourceUrl: 'https://www.cpp.edu/news/content/2024/01/cal-poly-universities-75th-rose-float-wins-innovator-award/' }),
  Object.freeze({ id: '2025', text: '“Nessie’s Lakeside Laughs” (2025) won the Leishman Public Spirit Award. Its animated scenes included moving characters.', sourceUrl: 'https://www.cpp.edu/news/content/2025/01/cal-poly-universities-win-leishman-public-spirit-award-for-76th-rose-float/index.shtml' }),
  Object.freeze({ id: '2026', text: '“Jungle Jumpstart” (2026), featuring a rainforest robot, won the Sweepstakes Award.', sourceUrl: 'https://www.calpoly.edu/news/cal-poly-float-wins-sweepstakes-award-2026-rose-parade' }),
]);
