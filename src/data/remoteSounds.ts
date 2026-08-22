import { Directory, File, Paths } from 'expo-file-system';

/**
 * Placeholder — swap this for the real backend origin once it exists.
 * Expected contract: GET `${SOUND_API_BASE_URL}/sounds.json` returns
 * `RemoteSoundClip[]`. Nothing else in this file needs to change once a
 * real backend is live, as long as it matches that shape.
 */
export const SOUND_API_BASE_URL = 'https://YOUR_BACKEND_URL_HERE';

export type SoundCategory = 'focus' | 'sleep' | 'ambient' | 'breathe' | 'meditation';

export type RemoteSoundClip = {
  id: string;
  name: string;
  description: string;
  category: SoundCategory;
  /** Direct URL to the audio file (mp3/wav/m4a). */
  url: string;
};

const CACHE_DIR = new Directory(Paths.document, 'sounds');

function ensureCacheDir() {
  if (!CACHE_DIR.exists) CACHE_DIR.create({ intermediates: true });
}

function extFromUrl(url: string): string {
  const match = url.match(/\.(mp3|wav|m4a|aac|ogg)(\?|$)/i);
  return match ? match[1].toLowerCase() : 'mp3';
}

function cacheFileFor(clip: RemoteSoundClip): File {
  return new File(CACHE_DIR, `${clip.id}.${extFromUrl(clip.url)}`);
}

/** Fetches the clip list from the backend. Returns [] (never throws) if the
 *  backend isn't reachable yet — callers should treat an empty list as
 *  "nothing published yet", not as a crash. */
export async function fetchSoundManifest(): Promise<RemoteSoundClip[]> {
  try {
    const res = await fetch(`${SOUND_API_BASE_URL}/sounds.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(
      (c): c is RemoteSoundClip =>
        typeof c?.id === 'string' && typeof c?.name === 'string' && typeof c?.url === 'string',
    );
  } catch {
    return [];
  }
}

export function isSoundCached(clip: RemoteSoundClip): boolean {
  return cacheFileFor(clip).exists;
}

export function cachedSoundUri(clip: RemoteSoundClip): string | null {
  const file = cacheFileFor(clip);
  return file.exists ? file.uri : null;
}

/** Downloads once and caches to the document directory — survives app
 *  restarts, only re-downloads if the cached file was deleted. */
export async function downloadSound(clip: RemoteSoundClip): Promise<string> {
  ensureCacheDir();
  const destination = cacheFileFor(clip);
  if (destination.exists) return destination.uri;
  const result = await File.downloadFileAsync(clip.url, CACHE_DIR);
  // downloadFileAsync names the file from the URL's last path segment, which
  // may not match `${id}.${ext}` — normalize by moving it to our expected name.
  if (result.uri !== destination.uri) {
    await result.move(destination);
    return destination.uri;
  }
  return result.uri;
}

export function deleteCachedSound(clip: RemoteSoundClip) {
  const file = cacheFileFor(clip);
  if (file.exists) file.delete();
}
