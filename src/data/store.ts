import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeKey, IntensityKey } from './themes';
import { GoalData, EMPTY_GOAL } from './goal';

const KEY = 'screentime.v1';

export type PersistedState = {
  onboardingComplete: boolean;
  themeKey: ThemeKey;
  intensityKey: IntensityKey;
  futureSelfMessage: string;
  goal: GoalData;
  hoursReclaimed: number;
  reclaimedToday: number;
  reclaimedTodayDate: string;
  unlockNumber: number;
  dayNumber: number;
  firstOpenDate: string;
  guardian: { enabled: boolean; name: string; contact: string } | null;
  pin: string | null;
};

export const DEFAULT_STATE: PersistedState = {
  onboardingComplete: false,
  themeKey: 'quiet',
  intensityKey: 'steady',
  futureSelfMessage: '',
  goal: EMPTY_GOAL,
  hoursReclaimed: 0,
  reclaimedToday: 0,
  reclaimedTodayDate: new Date().toDateString(),
  unlockNumber: 1,
  dayNumber: 1,
  firstOpenDate: new Date().toDateString(),
  guardian: null,
  pin: null,
};

export async function loadState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);

    // "Reclaimed today" and the day counter both roll over on a real calendar
    // day change — nothing about them should carry over silently.
    const today = new Date().toDateString();
    if (parsed.reclaimedTodayDate !== today) {
      const daysSinceFirst = parsed.firstOpenDate
        ? Math.max(1, Math.round((Date.now() - new Date(parsed.firstOpenDate).getTime()) / 86400000) + 1)
        : parsed.dayNumber;
      parsed.reclaimedToday = 0;
      parsed.unlockNumber = 1;
      parsed.reclaimedTodayDate = today;
      parsed.dayNumber = daysSinceFirst;
    }

    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Best-effort — losing a write should never crash the app.
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
