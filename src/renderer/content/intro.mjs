// The orientation film that plays once on every fresh launch (brief §13):
// eight beats, the narrator's lines verbatim, the archive photos in year
// order, and Rosie's cues. Timings are the storyboard's minimums; a longer
// narration stretches a beat, never cuts it. Skip>> is the UI's, not a beat.
import { ARCHIVE_BY_ID, archiveCaption } from './archive.mjs';

export const INTRO_TITLE = 'Roseflow — Cal Poly Rose Float Training';
export const INTRO_SUBLINE = 'Pomona × San Luis Obispo · Learn by Doing';

const label = (id) => archiveCaption(ARCHIVE_BY_ID[id]);

export const INTRO_FILM = Object.freeze({
  id: 'intro',
  beats: Object.freeze([
    {
      id: 'leader', visual: 'leader', minMs: 5000,
      say: 'Welcome to Roseflow. Behind every moving float is a team learning how to bring an idea to life.',
      rosie: { expression: 'wave' },
    },
    {
      id: 'campuses', visual: 'campuses', minMs: 8000,
      say: 'Cal Poly Pomona and Cal Poly San Luis Obispo work together to build a student-created Rose Parade float.',
      rosie: { expression: 'point' },
    },
    {
      id: '1949', visual: 'photo', photo: 'h', photoLabel: label('h'), minMs: 8000,
      say: 'The tradition began with Rocking Horse in 1949, an entry that earned the Award of Merit.',
      rosie: { expression: 'happy' },
    },
    {
      id: '1978-2024', visual: 'photo', photo: 'i', photoLabel: label('i'), minMs: 8000,
      say: 'Over the years, students developed new ways to animate their creations. That combination of creativity and engineering still defines the program.',
      rosie: { expression: 'happy' },
      actions: [{ at: 4500, photo: 'j', photoLabel: label('j') }],
    },
    {
      id: '2024-2025', visual: 'photo', photo: 'j', photoLabel: label('j'), minMs: 10000,
      say: 'Meet a few award-winning creations—and the teamwork behind them.',
      rosie: { expression: 'cheer' },
      actions: [
        { at: 4000, photo: 'k', photoLabel: label('k') },
        { at: 4000, rosie: { expression: 'point', line: 'Nessie, 2025. Look at her go!', chirp: 'excited' } },
      ],
    },
    {
      id: '2026', visual: 'photo', photo: 'l', photoLabel: label('l'), minMs: 6000,
      say: 'And the story continues.',
      rosie: { expression: 'happy' },
    },
    {
      id: 'practice', visual: 'timeline', minMs: 11000,
      say: 'Here, you’ll practice timing, digital channels, and the controls that organize a show. Watch a short example, try it yourself, and ask Rosie whenever you need help.',
      rosie: { expression: 'point' },
    },
    {
      id: 'ready', visual: 'ready', minMs: 4000,
      rosie: { expression: 'wave', line: 'Ready? Let’s make something move!', chirp: 'excited' },
    },
  ]),
});
