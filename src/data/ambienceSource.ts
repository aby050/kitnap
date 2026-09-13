/**
 * Where the streamed room loops live.
 *
 * Its own module so `ambienceMedia` (which resolves a room to a playable
 * source) and `ambiencePrefetch` (which downloads them) can both read it
 * without importing each other — they did, and the cycle was real enough for
 * Metro to warn about it.
 *
 * Cloudflare R2, public bucket `byre-ambience`. Zero egress cost, which is
 * the entire cost of serving video anywhere else.
 */
export const REMOTE_BASE = 'https://pub-a0c8c1ef09be4cfa8fbe24f7014fb46c.r2.dev';

/** Rooms whose loop streams rather than shipping in the binary. */
export const REMOTE_KEYS = [
  'breathe',
  'meditate',
  'morning',
  'reading',
  'think',
  'family',
  'study',
  'night',
];

export function remoteVideoUrl(key: string): string {
  return `${REMOTE_BASE}/${key}.mp4`;
}
