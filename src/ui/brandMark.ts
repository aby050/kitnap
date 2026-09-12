import { appearance } from '../design/appearance';

/**
 * The Byre mark, in the colourway of the active scheme.
 *
 * Two literal `require`s rather than a built path: Metro resolves asset
 * requires statically at bundle time, so `require(\`../../assets/${name}.png\`)`
 * is not just slower — it does not work at all.
 *
 * Both files are padded to the same aspect ratio, so either renders at
 * identical size inside a fixed `contain` box and the mark does not change
 * size when the scheme changes.
 */
export const brandMark =
  appearance === 'green'
    ? require('../../assets/byre-logo.png')
    : require('../../assets/byre-logo-blue.png');
