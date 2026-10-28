import { createMMKV } from 'react-native-mmkv';

/**
 * Which colour scheme the app is painted in.
 *
 * Distinct from `ThemeKey` in `src/data/themes.ts` — that one picks the
 * Shield's *voice* and block-screen gradient (Deep Work, Health, Quiet…).
 * This picks the accent and ground colours for the whole app.
 */
export type Appearance = 'blue' | 'green' | 'forest';

export const APPEARANCES: { key: Appearance; name: string; blurb: string; swatch: string }[] = [
  { key: 'forest', name: 'Forest', blurb: 'Deep canopy green, leaf accent', swatch: '#8FD694' },
  { key: 'green', name: 'Kitnap', blurb: 'The mark’s own blue and mint', swatch: '#17D3D0' },
  { key: 'blue', name: 'Midnight', blurb: 'Electric blue on black', swatch: '#3B4FF2' },
];

/**
 * MMKV, not AsyncStorage, for exactly one reason: this value has to be
 * readable **synchronously at module-evaluation time**.
 *
 * Every screen calls `StyleSheet.create({ … palette.accent … })` at import,
 * which captures the colour once and never looks again — 1,052 references
 * across 79 files. So the palette must already hold the right values before
 * the first screen module is imported, which rules out anything async:
 * AsyncStorage resolves a tick later, long after the styles are frozen.
 *
 * The same fact is why changing this requires a reload rather than a
 * re-render. See `setAppearance`.
 */
// MMKV 4 is factory-based (`createMMKV`), not `new MMKV()` — the v3 API.
const store = createMMKV({ id: 'byre.appearance' });
const KEY = 'appearance';

function read(): Appearance {
  try {
    const v = store.getString(KEY);
    return v === 'blue' || v === 'green' ? v : 'forest';
  } catch {
    // A corrupt or unavailable store must never stop the app booting.
    return 'forest';
  }
}

/** Resolved once, at import. Everything downstream reads this constant. */
export const appearance: Appearance = read();

/** Persists the choice. The caller is responsible for reloading — see
 *  `SettingsScreen`, which reloads via `reloadAppAsync` from `expo`. */
export function persistAppearance(next: Appearance): void {
  try {
    store.set(KEY, next);
  } catch {
    // Non-fatal: the app keeps its current look for this session.
  }
}
