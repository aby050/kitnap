import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import HomeScreen from './HomeScreen';
import MyAppsScreen from './MyAppsScreen';
import ProfileScreen from './ProfileScreen';
import MilestonesScreen from './MilestonesScreen';
import SettingsScreen from './SettingsScreen';
import TimerScreen from './TimerScreen';
import EmergencyTokensScreen from './EmergencyTokensScreen';
import DeleteAccountScreen from './DeleteAccountScreen';
import AppearanceScreen from './AppearanceScreen';
import EssentialsScreen from './EssentialsScreen';
// World feature — deprioritized per product decision (Byre-style apps don't
// have a "world" concept; focus is the core Shield/Gate/timer loop instead).
// Code kept, commented, in case we revisit it later.
// import WorldScreen from './WorldScreen';
// import TimeLedgerScreen from './TimeLedgerScreen';
// import LandmarksScreen from './LandmarksScreen';
// import SeasonsScreen from './SeasonsScreen';
import GuardianScreen from './GuardianScreen';
import WaitingRoomScreen from './WaitingRoomScreen';
import BlockScreensScreen from './BlockScreensScreen';
import ScheduleEditorScreen from './ScheduleEditorScreen';
import AccountScreen from './AccountScreen';
import FutureSelfScreen from '../onboarding/FutureSelfScreen';
import IntensityScreen from '../onboarding/IntensityScreen';
import BlockedAppsScreen from './BlockedAppsScreen';
import BlocksScreen from './BlocksScreen';
import ShieldScreen from '../shield/ShieldScreen';
import GateScreen from '../shield/GateScreen';
import GrantScreen from '../shield/GrantScreen';
import { alertGrantEnded, cancelGrantEndedNotification, scheduleGrantEndedNotification } from '../data/grantNotify';
import LiveActivityBar from '../shield/LiveActivityBar';
import TabBar from './TabBar';
import { getIntensity, getTheme, IntensityKey, ThemeKey } from '../data/themes';
import { computeRepTarget, parseAge, parseLifeChange } from '../data/activityDifficulty';
import { ActivityKind, ActivitySessionResult } from '../shield/activity/types';
import { EMPTY_GOAL, GoalData } from '../data/goal';
import { Account, DEFAULT_STATE, PersistedState, AppLimit, FocusSession, startingEmergencyTokens } from '../data/store';
import { activeLockdown } from '../data/scheduleEnforcer';
import { CustomerInfo, PurchasesPackage, PurchasesStoreProduct } from 'react-native-purchases';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../data/purchases';
import SubscriptionScreen from './SubscriptionScreen';
import AboutScreen from './AboutScreen';
import WebDocScreen from './WebDocScreen';
import TrialTimelineScreen from '../onboarding/TrialTimelineScreen';
import { ProgressEvent, ProgressState, dateKey, daysSinceJoin, getDay, focusScore, recordEvents, sumRange, totals, unlockAchievements, weeklyWindows } from '../data/progress';
import {
  endGrantNow as endAndroidGrantNow,
  grantTemporaryAccess as grantAndroidAccess,
  grantedUntil as androidGrantedUntil,
  startSessionNotification,
  stopSessionNotification,
  setLockdown,
  setShieldCopy,
  hideShieldOverlay,
} from 'device-permissions';
import { momentLine } from '../data/moments';
import { pickShieldMessage } from '../data/shieldMessages';
import { SoundKey } from '../data/sounds';
import { GateKey, missingBlockingPermissions } from '../data/permissionGate';
import PermissionBoardingPassScreen from '../onboarding/PermissionBoardingPassScreen';
import NoBailoutConfirm from '../components/NoBailoutConfirm';
import ProGateDialog from '../components/ProGateDialog';
import { useTodayUsage } from '../data/useTodayUsage';
import ScreenTimeDiagnostics from './ScreenTimeDiagnostics';
import { EssentialKey } from '../data/gateQuestions';
import { buildDemoState, clearDemoState } from '../data/demoData';
import { recordGateReflection, recordActivitySession } from '../data/store';
import { limitExceededPackages, newlyExceededLimits } from '../data/appLimitEnforcer';
import { DEFAULT_BEDTIME, isWithinBedtime } from '../data/bedtime';
import { shouldShowCheckIn } from '../data/checkin';
import CheckInScreen from './CheckInScreen';
import ProgressPhotosScreen from './ProgressPhotosScreen';
import { ProgressPhoto, nextPhotoDue } from '../data/progressPhotos';
import CalendarScreen from './CalendarScreen';
import WeeklyStoryScreen from './WeeklyStoryScreen';
import RealUsageScreen from './RealUsageScreen';
import AmbienceSessionScreen from './AmbienceSessionScreen';
import { Ambience } from '../data/ambiences';
import { endLiveTimer, startLiveTimer } from 'live-timer';
import {
  blockSelectedApps,
  configureShield,
  endGrantNow,
  enforcePersistentBlock,
  getBlockState,
  grantRemainingMs,
  getSelectionCounts,
  grantTemporaryAccess,
  hasBlockedSelection,
  isCurrentlyShielded,
  resetAllBlocks,
} from '../data/iosScreenTime';
import { palette, space } from '../design/tokens';
import { useEntrance } from '../design/motion';
import { daysOnLevel, isLoosening, requestIntensityChange, settleIntensity } from '../data/intensityChange';
import GuardianVerifyScreen, { GuardedIntent, GUARDIAN_RELEASE_COST } from './GuardianVerifyScreen';
import { Screen, ScreenHeader } from '../design/primitives';
import Icon, { IconName } from '../ui/Icon';
import { tapLight } from '../ui/haptics';

type Tab = 'home' | 'apps' | 'timer';
type Overlay =
  | null
  | 'profile'
  | 'milestones'
  | 'settings'
  | 'essentials'
  // | 'ledger'
  // | 'landmarks'
  // | 'seasons'
  | 'guardian'
  | 'guardianVerify'
  | 'waitingRoom'
  | 'blockScreens'
  | 'appearance'
  | 'schedules'
  | 'account'
  | 'futureSelf'
  | 'progressPhotos'
  | 'calendar'
  | 'realUsage'
  | 'blockedApps'
  | 'difficulty'
  | 'weeklyInsight'
  | 'blocks'
  | 'emergencyTokens'
  | 'subscription'
  | 'plans'
  | 'about'
  | 'terms'
  | 'privacy'
  | 'deleteAccount'
  | 'screenTimeDiagnostics';
type Block = null | 'shield' | 'gate' | 'grant' | 'emergency';

/** Break-glass length. Short on purpose — see openEmergencyAccess. Also the
 *  only number GrantScreen may show for an emergency; it used to hardcode 15
 *  while the grant itself was 3. */
const EMERGENCY_MINUTES = 5;

/** Earned unlocks allowed per day. Without a ceiling the challenge is only a
 *  toll, not a limit — you could pay it all day. Emergency access is separate
 *  and does not count against this. */
const DAILY_UNLOCK_LIMIT = 3;


/** The only overlays reachable while a session is locked — each is a door the
 *  locked timer screen itself puts on screen (essentials/emergency access, the
 *  blocked-app list, and the Bailout store). */
const SESSION_OVERLAYS: Overlay[] = ['essentials', 'blockedApps', 'emergencyTokens'];
type TimerPreset = { minutes: number; label: string; autoStart: boolean; hardMode?: boolean; nonce?: number };

/**
 * The bar read Home / My apps / Timer — which is, word for word and in the
 * same order, the tab bar of the app this one keeps getting compared to. Three
 * matching labels is not a coincidence a reviewer has to think hard about.
 *
 * The names now describe what Byre actually has. `apps` is the blocklist, so
 * it says Blocked — shorter, and the thing the app is for. `timer` stopped
 * being a timer when the dial came out: it is ten rooms you pick between, so
 * it says Rooms. Home / Blocked / Rooms also reads as one place rather than
 * three features, which suits an app named after a shelter.
 *
 * Keys are untouched — they persist in saved state and in every `setTab` call.
 */
const TABS: { key: Tab; label: string; mark: IconName }[] = [
  { key: 'home', label: 'Home', mark: 'home' },
  { key: 'apps', label: 'Blocked', mark: 'shield' },
  { key: 'timer', label: 'Rooms', mark: 'leaf' },
];

export default function MainApp({
  themeKey = 'quiet',
  intensityKey = 'steady',
  futureSelfMessage = '',
  goal = EMPTY_GOAL,
  persisted = DEFAULT_STATE,
  onPatch = () => {},
  pendingShieldPackage = null,
  onShieldConsumed = () => {},
  pendingIOSUnlock = false,
  onIOSUnlockConsumed = () => {},
  onDeleteAccount = async () => {},
  bailoutProducts = [],
  isPro = false,
  customerInfo = null,
  offering = null,
  onPurchasedPlan,
}: {
  themeKey?: ThemeKey;
  intensityKey?: IntensityKey;
  futureSelfMessage?: string;
  goal?: GoalData;
  persisted?: PersistedState;
  onPatch?: (partial: Partial<PersistedState>) => void;
  /** Set by App.tsx when the Accessibility Service deep-links in because a
   *  blocked app just opened — forces the Shield flow regardless of what
   *  tab/overlay was showing. */
  pendingShieldPackage?: string | null;
  onShieldConsumed?: () => void;
  /** Set by App.tsx when Apple's shield "Let me in" button reopens Byre via
   *  the device-activity:// scheme. There's no per-app payload — Family
   *  Controls tokens are opaque — so unlike pendingShieldPackage this jumps
   *  straight to the Gate, skipping the RN ShieldScreen entirely (Apple's
   *  own shield already showed the "I need it" moment). */
  pendingIOSUnlock?: boolean;
  onIOSUnlockConsumed?: () => void;
  /** Live bailout consumables, forwarded to the Bailouts store screen. */
  bailoutProducts?: PurchasesStoreProduct[];
  /** Active `pro` entitlement, from RevenueCat. */
  isPro?: boolean;
  customerInfo?: CustomerInfo | null;
  /** Live plans, so Settings can sell rather than only describe. */
  offering?: { availablePackages: PurchasesPackage[] } | null;
  onPurchasedPlan?: (bailouts: number) => void;
  /** Wipes all local data and returns the app to onboarding — owned by
   *  App.tsx since it has to reset top-level state this component doesn't. */
  onDeleteAccount?: () => Promise<void>;
}) {
  // Relaunching mid-session must land back on the locked screen, not on Home
  // — otherwise force-quitting is a way to browse the app during a block.
  const [tab, setTab] = useState<Tab>(() =>
    persisted.session && persisted.session.endsAt > Date.now() ? 'timer' : 'home',
  );
  const [overlay, setOverlay] = useState<Overlay>(null);
  // Where to land after the Difficulty screen — it's reachable from both
  // Settings and Home now, and hardcoding "back to Settings" sent people
  // who opened it from Home somewhere they never came from.
  const [difficultyOrigin, setDifficultyOrigin] = useState<Overlay>('settings');
  const openDifficulty = (from: Overlay) => {
    setDifficultyOrigin(from);
    setOverlay('difficulty');
  };
  const [block, setBlock] = useState<Block>(null);
  const [grantMinutes, setGrantMinutes] = useState(5);
  const [grantExpiresAt, setGrantExpiresAt] = useState<number | null>(null);
  const [grantIsEmergency, setGrantIsEmergency] = useState(false);
  // Break-glass, not a second unlock button: short, and once a day. Fifteen
  // minutes was long enough to be worth reaching for on purpose; five is
  // enough to deal with something and not enough to become the way in.
  const [emergencyUsedOn, setEmergencyUsedOn] = useState<string | null>(
    persisted.emergencyUsedOn ?? null,
  );
  // Why emergency access was refused, shown at the gate. This used to be a
  // boolean nothing ever read: hitting the daily limit set a flag, no screen
  // rendered it, and the button simply did nothing with no explanation.
  const [emergencyRefusal, setEmergencyRefusal] = useState<string | null>(null);
  // Rolls over on a real calendar day, same as emergencyUsedOn.
  const [unlocksUsedToday, setUnlocksUsedToday] = useState(
    persisted.unlocksUsedOn === new Date().toDateString() ? (persisted.unlocksUsedToday ?? 0) : 0,
  );
  const unlocksLeftToday = Math.max(0, DAILY_UNLOCK_LIMIT - unlocksUsedToday);

  /** The schedule sealing the exits right now, or null.
   *
   *  Read from `persisted` rather than the `schedules` state below because the
   *  handlers that call this are declared above it — and because `persisted` is
   *  the copy that actually gets written to disk. */
  const currentLockdown = () => activeLockdown(persisted.schedules ?? []);

  /** Spends a Bailout and opens the door with no challenge. Used by the
   *  Gate's skip and by the Shield past the daily cap — past four, this is
   *  the only way through. */
  const unlockWithBailout = () => {
    if (emergencyTokens <= 0) return;
    // A lockdown window has no bailout. The UI hides the button, so reaching
    // here means something got through anyway — refuse rather than trust the
    // screen to have been right.
    if (currentLockdown()) return;
    const nextTokens = Math.max(0, emergencyTokens - 1);
    setEmergencyTokens(nextTokens);
    onPatch({ emergencyTokens: nextTokens });
    spendDailyUnlock();
    startGrant(intensity.grantMinutes);
    setGrantMinutes(intensity.grantMinutes);
    setGrantIsEmergency(false);
    setGrantExpiresAt(Date.now() + intensity.grantMinutes * 60000);
    setUnlockNumber((n) => n + 1);
    applyProgress([{ type: 'hardUnlock' }]);
    setBlock('grant');
  };

  /** Books one of the day's unlocks. Returns false when they're all spent, or
   *  when a lockdown window is in force and there are none to book. */
  const spendDailyUnlock = (): boolean => {
    if (currentLockdown()) return false;
    const today = new Date().toDateString();
    const used = persisted.unlocksUsedOn === today ? (persisted.unlocksUsedToday ?? 0) : 0;
    if (used >= DAILY_UNLOCK_LIMIT) return false;
    setUnlocksUsedToday(used + 1);
    onPatch({ unlocksUsedOn: today, unlocksUsedToday: used + 1 });
    return true;
  };
  const [activeThemeKey, setActiveThemeKey] = useState<ThemeKey>(themeKey);
  const [activeIntensityKey, setActiveIntensityKey] = useState<IntensityKey>(intensityKey);
  const [intensitySince, setIntensitySince] = useState<string | null>(
    persisted.intensitySince ?? null,
  );
  const [pendingIntensity, setPendingIntensity] = useState<{
    key: IntensityKey;
    at: number;
  } | null>(
    persisted.pendingIntensityKey && persisted.pendingIntensityAt
      ? { key: persisted.pendingIntensityKey, at: persisted.pendingIntensityAt }
      : null,
  );

  /** The only way the level changes. Tightening lands now; loosening waits a
   *  day unless the weekly check-in earned it — see intensityChange.ts. */
  const changeIntensity = (next: IntensityKey, earned = false) => {
    const result = requestIntensityChange(
      {
        intensityKey: activeIntensityKey,
        intensitySince,
        pendingIntensityKey: pendingIntensity?.key ?? null,
        pendingIntensityAt: pendingIntensity?.at ?? null,
      },
      next,
      { earned },
    );
    if (result.kind === 'noop') return result;
    if (result.kind === 'applied') {
      setActiveIntensityKey(result.patch.intensityKey);
      setIntensitySince(result.patch.intensitySince ?? null);
      setPendingIntensity(null);
    } else {
      setPendingIntensity({ key: result.patch.pendingIntensityKey!, at: result.at });
    }
    onPatch(result.patch);
    return result;
  };

  // A scheduled loosening has to survive the app being closed, so it's a
  // stored deadline landed on foreground rather than a timer.
  useEffect(() => {
    const settle = () => {
      const landed = settleIntensity({
        intensityKey: activeIntensityKey,
        intensitySince,
        pendingIntensityKey: pendingIntensity?.key ?? null,
        pendingIntensityAt: pendingIntensity?.at ?? null,
      });
      if (!landed) return;
      setActiveIntensityKey(landed.intensityKey);
      setIntensitySince(landed.intensitySince ?? null);
      setPendingIntensity(null);
      onPatch(landed);
    };
    settle();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') settle();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntensity, activeIntensityKey]);
  // The live session lives here, not in TimerScreen: it has to survive opening
  // an overlay (checking which apps are blocked used to unmount the timer and
  // silently end the lock) and survive the app being killed.
  const [session, setSession] = useState<FocusSession | null>(persisted.session ?? null);
  const timerRunning = !!session && session.endsAt > Date.now();
  /** The timer's always-on face is up, so the tab bar gets out of its way. */
  const [timerDimmed, setTimerDimmed] = useState(false);
  /** A Pro-only feature the user just reached for. */
  const [proGate, setProGate] = useState<
    { title: string; body: string; icon?: IconName } | null
  >(null);
  /**
   * Where the plans screen should go when it closes.
   *
   * It used to always return to 'subscription', which is why backing out of
   * plans landed the user in Settings no matter where they came from — they
   * opened plans from Blocked and were returned somewhere they had never
   * been. Recorded at the moment plans is opened instead.
   */
  const [plansReturn, setPlansReturn] = useState<Overlay>('subscription');
  /** Remembered across sessions: someone who picked rain last time wants rain
   *  again, and re-choosing it every session is the kind of small friction
   *  that gets a feature abandoned. */
  const [sessionSound, setSessionSound] = useState<SoundKey | null>(
    persisted.sessionSound ?? null,
  );

  /**
   * Lockdown is a flag held natively, outside the JS runtime, so it survives
   * the app being force-killed — which is exactly the case that could leave a
   * phone shielding everything with no session left to end it. Reconciled on
   * every start against the session that actually exists: no session, no
   * lockdown, whatever the flag said.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setLockdown(timerRunning);
  }, [timerRunning]);

  /**
   * A running session whose enforcement has gone away.
   *
   * startSession checks permissions before it locks anything, but a session
   * outlives the process: it is restored from disk on launch, and that path
   * never asked. So a grant revoked in Settings — or never given, on a phone
   * where the app was reinstalled — produced the worst version of this app:
   * a countdown, a lockdown flag set natively, and an accessibility service
   * switched off, which is to say a timer running over nothing at all.
   *
   * Checked on every foreground too, since that is when someone comes back
   * from having just turned it off.
   */
  useEffect(() => {
    if (Platform.OS !== 'android' || !timerRunning) return;
    let cancelled = false;
    const check = async () => {
      const missing = await missingBlockingPermissions();
      if (!cancelled && missing.length > 0) setGateKeys(missing);
    };
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [timerRunning]);


  /** The one place that knows how a grant is expressed on each platform:
   *  Family Controls on iOS, the Accessibility Service's stand-down window on
   *  Android. Both sides have to be told, or the half that isn't told keeps
   *  enforcing — which on Android meant the shield came straight back after a
   *  passed challenge. */
  /**
   * Opens the door for `minutes`, and says whether it actually managed to.
   *
   * The `hasBlockedSelection()` guard used to fail silently, and that produced
   * the worst possible outcome: a countdown on screen for access that was
   * never granted. Emergency in particular — the one moment the user has no
   * patience for a lie — showed "you have five minutes" while every app
   * stayed shut.
   *
   * The gap is Apple's orphaned shield. Reinstalling Byre wipes the App Group
   * holding the selection record, but the OS keeps enforcing the shield
   * independently (deliberately — otherwise a child escapes a block by
   * deleting the controlling app). So the apps are blocked, and the thing we
   * would point an unblock call at is gone. `resetAllBlocks` exists for
   * exactly this: it clears the OS-level state without needing the tokens.
   *
   * @returns false when nothing could be opened, so the caller shows the
   *          truth instead of a countdown.
   */
  const startGrant = (minutes: number): boolean => {
    if (Platform.OS !== 'ios') {
      grantAndroidAccess(minutes);
      // The Android cover is drawn by the accessibility service, which only
      // re-evaluates on the next foreground event — so a grant earned while
      // it is up has to take it down here, or the user passes the challenge
      // and is handed straight back to the shield.
      hideShieldOverlay();
      return true;
    }
    if (hasBlockedSelection()) {
      grantTemporaryAccess(minutes);
      return true;
    }
    if (isCurrentlyShielded()) {
      // Orphaned shield: no selection to time-limit, so the only honest move
      // is to lift it outright. Blocking cannot resume by itself afterwards —
      // there is nothing left describing what to block — so the caller tells
      // the user to pick their apps again.
      resetAllBlocks();
      return true;
    }
    // Nothing is blocked at all. Not an error; there is simply no door.
    return true;
  };

  const endGrantEverywhere = () => {
    if (Platform.OS === 'ios') endGrantNow();
    else endAndroidGrantNow();
  };

  /** Epoch millis of a grant that is still running, or null. Read from the
   *  native side rather than from state so it survives a cold start. */
  const runningGrantUntil = (): number | null => {
    if (Platform.OS === 'ios') {
      const state = getBlockState();
      return state.kind === 'granted' ? state.until : null;
    }
    const until = androidGrantedUntil();
    return until > Date.now() ? until : null;
  };

  /** Entry point for every "unlock this" trigger (Home's Focus lock CTA,
   *  the Blocked Apps pill, "Let me in" reopening from Apple's shield).
   *  Without this check, coming back to any of those while a grant was
   *  still running re-ran the whole challenge from scratch — the countdown
   *  screen you "Continue in app"'d out of a minute ago never came back,
   *  so it looked like the challenge had to be redone every time. */
  const openUnlockFlow = () => {
    const until = runningGrantUntil();
    if (until !== null) {
      setGrantExpiresAt(until);
      setGrantIsEmergency(false);
      setBlock('grant');
      return;
    }
    setBlock('shield');
  };

  /** Emergency access: five minutes, once a day, and never during a lockdown
   *  window. Long enough to deal with whatever it is, short enough that it
   *  can't quietly become the way in. */
  const openEmergencyAccess = () => {
    /* A refusal has to land somewhere.
     *
     * `emergencyRefusal` is rendered inline by the Gate and by nothing else,
     * so on the locked timer — the one screen where someone is most stuck —
     * tapping Emergency during a lockdown window, or after today's has been
     * used, set the message and returned in silence. The button looked dead.
     * Anywhere the Gate is not on screen, say it out loud. */
    const refuse = (message: string) => {
      setEmergencyRefusal(message);
      if (block !== 'gate') Alert.alert('Emergency access', message, [{ text: 'OK' }]);
    };

    const lock = currentLockdown();
    if (lock) {
      refuse(`${lock.name} is on until ${lock.end}. No emergency access inside it.`);
      return;
    }
    const today = new Date().toDateString();
    if (emergencyUsedOn === today) {
      refuse("You've already used today's emergency access. It comes back tomorrow.");
      return;
    }
    setEmergencyRefusal(null);
    // Emergency is still a grant. It used to show the countdown without ever
    // telling the OS side to stand down, so break-glass put a timer on screen
    // and left the apps every bit as blocked as before.
    const orphaned = Platform.OS === 'ios' && !hasBlockedSelection() && isCurrentlyShielded();
    startGrant(EMERGENCY_MINUTES);
    if (orphaned) {
      // The shield outlived its selection (a reinstall), so it has been lifted
      // outright rather than for five minutes — there is nothing left
      // describing what to re-block. Say so, and do not burn today's
      // emergency on it: the user got no timed access, and being told "you've
      // used today's emergency" after a bug would be indefensible.
      Alert.alert(
        'Blocks cleared',
        'Your apps were still blocked by iOS from a previous install, with no record of which ones. That block has been lifted completely — pick your apps again in Blocked to start over.',
        [{ text: 'OK' }],
      );
      return;
    }
    setEmergencyUsedOn(today);
    onPatch({ emergencyUsedOn: today });
    setGrantIsEmergency(true);
    setGrantExpiresAt(Date.now() + EMERGENCY_MINUTES * 60000);
    setBlock('emergency');
  };

  /** The focus room currently open over the app, if any. Closing it leaves
   *  the block running — the room is a place to look, not the block itself. */
  const [room, setRoom] = useState<{ ambience: Ambience; endsAt: number } | null>(null);

  const startAmbience = (ambience: Ambience) => {
    const endsAt = Date.now() + ambience.minutes * 60 * 1000;
    startSession(ambience.minutes, ambience.title, false);
    setRoom({ ambience, endsAt });
  };

  /**
   * A session the user asked for that is waiting on a permission grant.
   * Held rather than dropped, so granting lands them in the lock they wanted
   * instead of back on Home wondering what happened to their tap.
   */
  const [pendingStart, setPendingStart] = useState<
    { minutes: number; label: string; hardMode: boolean } | null
  >(null);
  const [gateKeys, setGateKeys] = useState<GateKey[] | null>(null);
  /** A session held back by the no-bailout warning rather than a permission. */
  const [noBailoutStart, setNoBailoutStart] = useState<
    { minutes: number; label: string; hardMode: boolean } | null
  >(null);

  const startSession = (minutes: number, label: string, hardMode: boolean) => {
    // Ask before locking, not after. Onboarding can be cut short or a grant
    // revoked in Settings later; starting anyway would draw a countdown over
    // a block that was never actually in place.
    void (async () => {
      const missing = await missingBlockingPermissions();
      if (missing.length > 0) {
        setPendingStart({ minutes, label, hardMode });
        setGateKeys(missing);
        return;
      }
      // Starting with nothing in hand means there is genuinely no way out
      // until the timer ends — Bailouts ARE the way out. That is a fair thing
      // to commit to, and an unfair thing to discover afterwards, so it is
      // said plainly before the lock rather than at the moment someone needs
      // to leave. Hard mode is excluded: it has its own, louder confirmation,
      // and no Bailout would help there anyway.
      if (emergencyTokens <= 0 && !hardMode) {
        setNoBailoutStart({ minutes, label, hardMode });
        return;
      }
      reallyStartSession(minutes, label, hardMode);
    })();
  };

  const reallyStartSession = (minutes: number, label: string, hardMode: boolean) => {
    const next: FocusSession = {
      endsAt: Date.now() + minutes * 60 * 1000,
      totalSec: minutes * 60,
      label,
      hardMode,
    };
    setSession(next);
    onPatch({ session: next });
    // nonce always bumps, even when minutes/label match the previous
    // session — TimerScreen's `key` is built from these three fields
    // specifically so a new session always remounts it. Without a change
    // here, starting back-to-back sessions at the same length produced an
    // identical key, skipped the remount, and left `remaining` frozen at
    // its first-mount value (a plain useState, not derived from `session`)
    // — the slide-to-start looked like it did nothing.
    setTimerPreset((p) => ({ ...p, minutes, label, hardMode, autoStart: false, nonce: (p.nonce ?? 0) + 1 }));
    setTab('timer');
    // Actually apply the block. Without this the session was only ever a
    // countdown in JS — the OS was never told to shield anything, which is
    // why blocked apps still opened normally on iOS.
    if (Platform.OS === 'ios' && hasBlockedSelection()) blockSelectedApps();
    // The countdown outlives the app from here: iOS renders and ticks it on
    // the Lock Screen, in the Dynamic Island and on the always-on display.
    const blockedCount = getSelectionCounts()?.apps ?? blockedPackages.length;
    if (Platform.OS === 'ios') startLiveTimer(next.endsAt, label, blockedCount);
    else {
      startSessionNotification(next.endsAt, label, blockedCount);
      // For the length of the session, everything is shielded except calls
      // (plus launcher, System UI, Settings, SMS and alarms — see
      // LockdownStore). iOS has no equivalent: Family Controls shields the
      // selection the user authorised and nothing wider.
      setLockdown(true);
    }
  };

  const endSession = () => {
    setSession(null);
    onPatch({ session: null });
    // Ending a session does NOT open the apps back up — the block is the
    // resting state, and a session is only a stricter stretch on top of it.
    if (Platform.OS === 'ios') enforcePersistentBlock();
    endLiveTimer();
    stopSessionNotification();
    // Back to the ordinary blocklist. Left on, this would shield the whole
    // device indefinitely.
    setLockdown(false);
  };
  const [timerPreset, setTimerPreset] = useState<TimerPreset>({ minutes: 25, label: 'Focus Timer', autoStart: false });
  // Once verified this session, Settings stays unlocked until the app is reloaded.

  const [hoursReclaimed, setHoursReclaimed] = useState(persisted.hoursReclaimed);
  const [reclaimedToday, setReclaimedToday] = useState(persisted.reclaimedToday);
  const [unlockNumber, setUnlockNumber] = useState(persisted.unlockNumber);
  const [progress, setProgress] = useState<ProgressState>(persisted.progress);
  const [futureSelf, setFutureSelf] = useState(futureSelfMessage);
  const [accountName, setAccountName] = useState(persisted.account?.name ?? '');
  const [account, setAccount] = useState<Account | null>(persisted.account);
  const [guardian, setGuardian] = useState(persisted.guardian);
  const [pendingGuardianTarget, setPendingGuardianTarget] = useState<IntensityKey | null>(null);

  /**
   * An action waiting behind the guardian code.
   *
   * Guardian used to guard exactly one thing — stepping the intensity down —
   * while the three bigger escape hatches stayed open: taking an app off the
   * blocklist, deleting a schedule, and wiping the account. Removing the app
   * you are trying not to open is a far cheaper way out than dropping Strict
   * to Steady, so guarding only the dial was guarding the wrong door.
   *
   * Held as a thunk rather than a discriminated union of intents: each caller
   * already knows how to do its own work, and a union would mean re-deriving
   * that here for every new guarded action.
   */
  const [guardedAction, setGuardedAction] = useState<{
    run: () => void;
    back: Overlay;
    /** Named so the verify screen can say which door this is — it guards five
     *  of them, and a generic prompt is what made the feature unreadable. */
    intent: GuardedIntent;
  } | null>(null);

  /** Runs `action` now, or behind the code when a guardian is set. */
  const requireGuardian = useCallback(
    (action: () => void, back: Overlay, intent: GuardedIntent) => {
      if (!guardian?.enabled) {
        action();
        return;
      }
      // The extra arrow is not noise: setState treats a bare function as an
      // updater and would call it immediately, which is the exact thing this
      // is supposed to defer.
      setGuardedAction({ run: action, back, intent });
      setOverlay('guardianVerify');
    },
    [guardian],
  );
  /** The single entry point into Guardian, wherever it is offered from.
   *
   *  Home, Blocked and Settings all open it; defining the route once means the
   *  Pro gate and the "reaching Guardian needs the code" rule cannot drift
   *  between them — an unguarded third door would have made the other two
   *  pointless. */
  const openGuardian = () => {
    if (isPro) {
      requireGuardian(() => setOverlay('guardian'), 'settings', 'settings');
      return;
    }
    // Styled rather than Alert.alert — see ProGateDialog. "See plans" goes to
    // the plans themselves, not to the Settings screen that lists a row
    // leading to them: the user asked to see prices, so show prices.
    setProGate({
      title: 'Guardian is part of Byre Pro',
      body:
        'Someone you trust holds the code that loosens Strict mode, so you cannot quietly undo it yourself.',
      icon: 'shield',
    });
  };

  /** Runs whatever was waiting behind the code and returns to where it came
   *  from. Shared by the code path and the bailout path so the two can never
   *  drift — a key has to open exactly the same door the code does. */
  const runGuarded = useCallback(() => {
    if (guardedAction) {
      const { run, back } = guardedAction;
      setGuardedAction(null);
      run();
      setOverlay(back);
      return;
    }
    if (pendingGuardianTarget) changeIntensity(pendingGuardianTarget);
    setPendingGuardianTarget(null);
    setOverlay(difficultyOrigin);
  }, [guardedAction, pendingGuardianTarget]);

  const joinedDays = daysSinceJoin(persisted.firstOpenDate);

  // Demo data (__DEV__ only, see SettingsScreen): writes the persisted copy
  // *and* the local mirrors this component keeps, so the populated screens
  // appear immediately instead of after a relaunch.
  const applyDevState = (next: Partial<PersistedState>) => {
    onPatch(next);
    if (next.progress) setProgress(next.progress);
    if (next.hoursReclaimed !== undefined) setHoursReclaimed(next.hoursReclaimed);
    if (next.reclaimedToday !== undefined) setReclaimedToday(next.reclaimedToday);
    if (next.unlockNumber !== undefined) setUnlockNumber(next.unlockNumber);
    if (next.gateReflections) setGateReflections(next.gateReflections);
    if (next.checkIns) setCheckIns(next.checkIns);
    if (next.activitySessions) setActivitySessions(next.activitySessions);
    setOverlay(null);
    setTab('home');
  };
  // Computed once at mount so finishing (or skipping) the check-in doesn't
  // immediately re-trigger it within the same session.
  const [checkInDue, setCheckInDue] = useState(() =>
    shouldShowCheckIn(persisted.lastCheckInDate, persisted.firstOpenDate),
  );
  const [checkIns, setCheckIns] = useState(persisted.checkIns);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(persisted.progressPhotos);
  const [blockedPackages, setBlockedPackagesState] = useState<string[]>(persisted.blockedPackages);

  /**
   * Is there actually anything being held back right now?
   *
   * "Your timed access is over, distracting apps are blocked again" is a lie
   * on a phone with an empty blocklist and no session running — it announced
   * a consequence that did not exist, which is the fastest way to teach
   * someone to ignore this app's notifications. A grant can still be taken
   * out in that state (the emergency button does not check first), so the
   * check belongs on the announcement rather than on the grant.
   */
  const somethingIsBlocked = useCallback(() => {
    if (Platform.OS === 'ios') return hasBlockedSelection();
    return blockedPackages.length > 0 || timerRunning;
  }, [blockedPackages, timerRunning]);

  const [blockedAppModes, setBlockedAppModes] = useState(persisted.blockedAppModes ?? {});
  const [essentials, setEssentials] = useState<Record<EssentialKey, boolean>>(
    persisted.essentials ?? DEFAULT_STATE.essentials,
  );
  const [schedules, setSchedules] = useState(persisted.schedules);
  const [gateReflections, setGateReflections] = useState(persisted.gateReflections);
  const [waitingRoomFamilies, setWaitingRoomFamilies] = useState(persisted.waitingRoomFamilies);
  const [activitySessions, setActivitySessions] = useState(persisted.activitySessions ?? []);
  const [appLimits, setAppLimits] = useState<AppLimit[]>(persisted.appLimits ?? []);
  const [emergencyTokens, setEmergencyTokens] = useState(persisted.emergencyTokens ?? startingEmergencyTokens());
  // Cheapest pack, by the store's own numeric price — comparing priceString
  // would sort by currency symbol and give the wrong answer outside INR.
  const cheapestBailoutPrice =
    bailoutProducts.length === 0
      ? null
      : bailoutProducts.reduce((a, b) => (a.price <= b.price ? a : b)).priceString;
  // Held until the gate resolves, so we can record whether they actually
  // went through with the unlock alongside what they wrote.
  const [pendingReflection, setPendingReflection] = useState<{ prompt: string; text: string } | null>(null);
  const usage = useTodayUsage();

  // Track the previous usage snapshot so we can detect newly-crossed limits
  // without alerting on every refresh.
  const prevUsageAppsRef = useRef<typeof usage.apps>([]);

  // App-limit enforcement: when a per-app limit is first crossed, add the
  // package to the blocked set and show a one-time in-app alert. Android-only
  // — useTodayUsage returns available:false on iOS.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!usage.available || !usage.granted) return;
    if (!appLimits || appLimits.length === 0) return;

    const newly = newlyExceededLimits(appLimits, prevUsageAppsRef.current, usage.apps);
    prevUsageAppsRef.current = usage.apps;

    if (newly.length === 0) return;

    // Add newly-exceeded packages to the blocked list if not already there.
    const exceeded = limitExceededPackages(appLimits, usage.apps);
    const toAdd = [...exceeded].filter((pkg) => !blockedPackages.includes(pkg));
    if (toAdd.length > 0) {
      const next = [...blockedPackages, ...toAdd];
      setBlockedPackagesState(next);
      onPatch({ blockedPackages: next });
    }

    // One-time alert per batch of newly-crossed limits.
    const names = newly.map((l) => l.appName || l.packageName).join(', ');
    Alert.alert(
      'Daily limit reached',
      `You've hit your limit for ${names}. ${names.includes(',') ? 'These apps are' : 'This app is'} now blocked for the rest of the day.`,
      [{ text: 'Got it' }],
    );
  }, [usage.apps]);

  function commitReflection(unlocked: boolean) {
    if (!pendingReflection) return;
    const next = recordGateReflection(gateReflections, {
      date: new Date().toISOString(),
      prompt: pendingReflection.prompt,
      text: pendingReflection.text,
      unlocked,
    });
    setGateReflections(next);
    onPatch({ gateReflections: next });
    setPendingReflection(null);
  }

  function commitActivitySession(session: ActivitySessionResult) {
    const next = recordActivitySession(activitySessions, session);
    setActivitySessions(next);
    onPatch({ activitySessions: next });
  }

  /** Maps the onboarding answer ("Push-ups") onto the engine's ActivityKind
   *  ("push-ups"). Kept here rather than in questions.ts so the user-facing
   *  wording can change without touching the rep engine's union. */
  const matchesChosenMovement = (activity: ActivityKind, picked?: string) =>
    !!picked && picked.toLowerCase() === activity.toLowerCase();

  /** Adaptive rep target, resolved per movement when the gate picks one. */
  const repsFor = (activity: ActivityKind) =>
    computeRepTarget({
      activity,
      age: parseAge(persisted.onboardingAnswers?.age?.value),
      history: activitySessions,
      now: new Date(),
      lifeChange: parseLifeChange(persisted.onboardingAnswers?.lifeChange?.value),
      // Only counts for the movement they actually picked — a push-up
      // baseline says nothing about their squats.
      baseline:
        matchesChosenMovement(activity, persisted.onboardingAnswers?.movement?.value)
          ? Number(persisted.onboardingAnswers?.repBaseline?.value)
          : undefined,
    }).reps;

  useEffect(() => {
    setProgress((p) => ({ ...p, achievements: unlockAchievements(p, joinedDays) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyProgress(events: ProgressEvent[]) {
    setProgress((prev) => {
      const next = recordEvents(prev, events, { joinedDays });
      const t = totals(next);
      setHoursReclaimed(t.savedMinutes / 60);
      setReclaimedToday(getDay(next, dateKey()).savedMinutes);
      return next;
    });
  }

  useEffect(() => {
    onPatch({ hoursReclaimed, reclaimedToday, unlockNumber, progress });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoursReclaimed, reclaimedToday, unlockNumber, progress]);

  useEffect(() => {
    onPatch({ themeKey: activeThemeKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThemeKey]);

  useEffect(() => {
    onPatch({ intensityKey: activeIntensityKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIntensityKey]);

  useEffect(() => {
    onPatch({ appLimits });
  }, [appLimits]);

  const theme = getTheme(activeThemeKey);
  const intensity = getIntensity(activeIntensityKey);
  const isBedtime = isWithinBedtime(new Date(), persisted.bedtime ?? DEFAULT_BEDTIME);

  // Real Home-screen figures, replacing what used to be hardcoded copy.
  const rank = focusScore(progress);
  const homeWindows = weeklyWindows(dateKey());
  const thisWeek = sumRange(progress, homeWindows.thisStart, dateKey());
  const priorWeek = sumRange(progress, homeWindows.prevStart, homeWindows.prevEnd);
  const scoreTrendUp = thisWeek.savedMinutes >= priorWeek.savedMinutes;
  // Length of the configured sleep window, wrapping past midnight.
  const sleepWindowHours = (() => {
    const sleep = schedules.find((s) => /sleep/i.test(s.name));
    if (!sleep) return 0;
    const [sh, sm] = sleep.start.split(':').map(Number);
    const [eh, em] = sleep.end.split(':').map(Number);
    if (![sh, sm, eh, em].every(Number.isFinite)) return 0;
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const span = endMin > startMin ? endMin - startMin : 24 * 60 - startMin + endMin;
    return Math.round(span / 60);
  })();

  // A real blocked-app detection always wins — it should interrupt whatever
  // else was on screen (including the check-in), same as the real apps this
  // category is modeled on.
  useEffect(() => {
    if (pendingShieldPackage) {
      // The service should already be standing down during a grant, but a
      // deep link can still be in flight from just before it started. Landing
      // on the countdown beats re-running a challenge the user just passed.
      const until = runningGrantUntil();
      if (until !== null) {
        setGrantExpiresAt(until);
        setGrantIsEmergency(false);
        setBlock('grant');
      } else {
        setBlock('shield');
      }
      setOverlay(null);
      onShieldConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingShieldPackage]);

  // "Let me in" reopening Byre used to land on whatever tab was showing —
  // the button did nothing visible because there was no challenge screen to
  // route to. This is that route: straight to the Gate, same as the moment
  // right after Apple's shield.
  useEffect(() => {
    if (pendingIOSUnlock) {
      const state = getBlockState();
      if (state.kind === 'granted') {
        setGrantExpiresAt(state.until);
        setGrantIsEmergency(false);
        setBlock('grant');
      } else {
        setBlock('gate');
      }
      setOverlay(null);
      onIOSUnlockConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIOSUnlock]);

  // iOS equivalent: Apple's own Shield UI is what the user actually sees
  // over a blocked app (not our RN ShieldScreen — Apple doesn't allow custom
  // UI inside that extension). Its button opens Byre, so on foreground we
  // check whether a shield is currently active and, if so, skip straight to
  // the Gate — the "I need it" step already happened on Apple's screen.
  useEffect(() => {
    // Android's cover is drawn in Kotlin before RN is running, so it cannot
    // read any of this at the moment it appears — push the current lines to
    // disk so the two platforms say the same thing.
    //
    // This used to sit below an `if (Platform.OS !== 'ios') return`, which
    // meant it never ran on Android at all: every block on the platform the
    // overlay exists for showed ShieldCopyStore's plain install defaults, and
    // the rotating voice, the theme and the user's own stated reason reached
    // exactly nobody.
    if (Platform.OS === 'android') {
      // Seeded by the day, not the render: the cover is written to disk here
      // and read by the service later, so it should read the same all day
      // rather than depending on whenever Byre last happened to be open.
      const line = pickShieldMessage(themeKey, Math.floor(Date.now() / 86400000));
      setShieldCopy(
        line.lead,
        line.emphasis ?? '',
        goal.line
          ? `You said you wanted ${goal.line}.`
          : 'You asked Byre to keep this shut.',
        'Let me in',
      );
      return;
    }
    if (Platform.OS !== 'ios') return;
    configureShield(
      theme.lines[0] ?? 'Take a moment.',
      goal.line ? `You said you wanted ${goal.line}.` : undefined,
    );
    // Blocking is always on now, so "is a shield active?" is true for the
    // whole life of the app and can no longer mean "the user just hit one" —
    // routing straight to the Gate on that would trap every launch. What
    // foregrounding is actually good for is repairing state: put the shield
    // back if a grant ran out while Byre was closed.
    // Repair on every foreground: the window may have run out while Byre
    // was closed, in which case the door has to shut before anything else
    // draws.
    const onForeground = () => {
      configureShield(undefined, goal.line ? `You said you wanted ${goal.line}.` : undefined);
      const left = grantRemainingMs();
      if (left <= 0) {
        endGrantNow();
        setGrantExpiresAt(null);
        return;
      }
      setGrantExpiresAt(Date.now() + left);
    };
    onForeground();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onForeground();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android's half of the same repair: adopt a grant that outlived the JS
  // process so the countdown bar and the Gate agree with what the
  // Accessibility Service is actually doing.
  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const adopt = () => setGrantExpiresAt(runningGrantUntil());
    adopt();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') adopt();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shuts the door the moment a grant runs out with Byre in the foreground.
  // The native usage threshold in startGrantWindow covers the app-is-closed
  // case; this covers the case where the user is watching the countdown.
  useEffect(() => {
    if (grantExpiresAt === null) return;
    const remaining = grantExpiresAt - Date.now();
    if (remaining <= 0) {
      endGrantEverywhere();
      setGrantExpiresAt(null);
      return;
    }
    const id = setTimeout(() => {
      endGrantEverywhere();
      setGrantExpiresAt(null);
      setBlock(null);
    }, remaining);
    return () => clearTimeout(id);
  }, [grantExpiresAt]);

  // The block is the resting state: apply it as soon as there is a selection,
  // not only when a session starts.
  useEffect(() => {
    if (Platform.OS === 'ios') enforcePersistentBlock();
  }, []);

  if (checkInDue && block === null) {
    return (
      <CheckInScreen
        onboardingAnswers={persisted.onboardingAnswers}
        previousCheckIns={checkIns}
        progress={progress}
        currentIntensityKey={activeIntensityKey}
        onAdoptIntensity={(k) => changeIntensity(k, true)}
        onComplete={(checkIn) => {
          const nextCheckIns = [...checkIns, checkIn];
          setCheckIns(nextCheckIns);
          onPatch({ checkIns: nextCheckIns, lastCheckInDate: checkIn.date });
          setCheckInDue(false);
        }}
        onSkip={() => {
          // A skip still resets the 7-day clock — otherwise it would prompt
          // again on every single open until answered.
          const skippedDate = new Date().toISOString();
          onPatch({ lastCheckInDate: skippedDate });
          setCheckInDue(false);
        }}
      />
    );
  }

  // Recomputed on every render of the block flow rather than held in state: the
  // shield and gate are transient screens, and a stale window here would either
  // seal a door that has just opened or open one that has just sealed.
  const lockdown = activeLockdown(schedules);

  // The block flow is a full-screen takeover, exactly as the real shield would be.
  if (block === 'shield') {
    return (
      <ShieldScreen
        theme={theme}
        goal={goal}
        unlockNumber={unlocksUsedToday + 1}
        dayNumber={persisted.dayNumber}
        unlocksLeftToday={unlocksLeftToday}
        bailoutBalance={emergencyTokens}
        onUseBailout={unlockWithBailout}
        isBedtime={isBedtime}
        lockdown={lockdown}
        onNotNow={() => {
          // Credit the time actually saved: on Android we can read the
          // blocked app's real usage from UsageStatsManager; on iOS Apple
          // gives no equivalent read access, so we record nothing rather
          // than inventing a number.
          const savedMinutes = (() => {
            if (Platform.OS !== 'android') return 0;
            if (!usage?.available || !usage?.granted) return 0;
            // Find the pending package in today's usage and use its per-minute
            // figure as a proxy for "time that would have been spent". If the
            // package isn't in the list yet (first open of the day) we record
            // nothing — a zero is honest, a fabricated constant is not.
            const pkg = pendingShieldPackage;
            if (!pkg) return 0;
            const entry = usage.apps.find((a) => a.packageName === pkg);
            return entry ? Math.max(0, entry.minutes) : 0;
          })();
          if (savedMinutes > 0) {
            applyProgress([
              { type: 'saved', minutes: savedMinutes },
              { type: 'blocked' },
            ]);
          } else {
            // Still credit the block even when we can't measure the time.
            applyProgress([{ type: 'blocked' }]);
          }
          setBlock(null);
        }}
        onNeedIt={() => setBlock('gate')}
        onEmergency={openEmergencyAccess}
      />
    );
  }

  if (block === 'gate') {
    return (
      <GateScreen
        intensity={intensity}
        futureSelfMessage={futureSelf}
        healthLimitRaw={persisted.onboardingAnswers?.healthLimit?.value}
        repsFor={repsFor}
        activitySessions={activitySessions}
        onActivityComplete={commitActivitySession}
        tokenBalance={emergencyTokens}
        lockdown={lockdown}
        emergencyRefusal={emergencyRefusal}
        onSkipWithToken={unlockWithBailout}
        onReflectionChange={(prompt, text) => setPendingReflection({ prompt, text })}
        waitingRoomFamilies={waitingRoomFamilies}
        onGranted={(m) => {
          commitReflection(true);
          // The return value used to be discarded, so passing the challenge
          // opened the door regardless of the daily cap — and would now also
          // ignore a lockdown window that opened mid-challenge. Bounce back to
          // the shield instead, which explains which limit was hit.
          if (!spendDailyUnlock()) {
            setBlock('shield');
            return;
          }
          startGrant(m);
          setGrantMinutes(m);
          setGrantIsEmergency(false);
          setGrantExpiresAt(Date.now() + m * 60000);
          setUnlockNumber((n) => n + 1);
          applyProgress([{ type: 'hardUnlock' }]);
          setBlock('grant');
        }}
        onAbandoned={() => {
          // Abandoning the gate is a distraction blocked, not a completed
          // focus session — firing lockSession here inflated the "sessions"
          // counter and made ReflectionScreen labels inaccurate.
          commitReflection(false);
          setUnlockNumber((n) => n + 1);
          applyProgress([{ type: 'blocked' }]);
          setBlock(null);
        }}
        onEmergency={openEmergencyAccess}
      />
    );
  }

  if (block === 'grant' || block === 'emergency') {
    return (
      <GrantScreen
        minutes={block === 'emergency' ? EMERGENCY_MINUTES : grantMinutes}
        emergency={block === 'emergency'}
        expiresAt={grantExpiresAt ?? Date.now()}
        onDone={() => {
          void cancelGrantEndedNotification();
          // "Done early" means the door shuts now, not that it stays open
          // until the countdown would have run out.
          endGrantEverywhere();
          setBlock(null);
          setGrantExpiresAt(null);
        }}
        onMinimize={() => {
          // Nothing blocked means nothing to announce the return of.
          if (grantExpiresAt && somethingIsBlocked()) {
            void scheduleGrantEndedNotification(grantExpiresAt);
          }
          setBlock(null);
        }}
      />
    );
  }

  function openSettings() {
    setOverlay('settings');
  }

  function renderMain(): React.ReactNode {
    // A running session is a locked screen, so only the doors that screen
    // itself offers stay open. Everything else — Settings, Profile, and the
    // whole tree behind them — is unreachable until the block ends. Without
    // this, opening "which apps are blocked" and pressing back walked you out
    // of the session entirely.
    const ov = timerRunning && overlay && !SESSION_OVERLAYS.includes(overlay) ? null : overlay;
    if (ov === 'settings')
      return (
        <SettingsScreen
          onBack={() => setOverlay('profile')}
          /* Guardian is a Pro feature — PlanCompareScreen lists it as
             "free: —, Pro: Yes" and nothing enforced it. Free users get the
             offer rather than a dead row, so the door is visible and the
             price is stated. */
          /* Reaching the Guardian screen at all needs the code, once one is
             set. Without this the whole feature was theatre: the screen has
             a "Generate a new code" button and an off switch, so anyone who
             wanted out could simply replace their guardian's code with one
             of their own — no memorising required. Guarding the door is the
             only thing that makes what is behind it mean anything. */
          onOpenGuardian={openGuardian}
          onOpenWaitingRoom={() => setOverlay('waitingRoom')}
          onOpenBlockScreens={() => setOverlay('blockScreens')}
          onOpenAppearance={() => setOverlay('appearance')}
          onOpenSchedules={() => setOverlay('schedules')}
          onOpenAccount={() => setOverlay('account')}
          accountLabel={account ? account.identifier : undefined}
          onOpenFutureSelf={() => setOverlay('futureSelf')}
          onOpenBlockedApps={() => setOverlay('blockedApps')}
          onOpenSubscription={() => setOverlay('subscription')}
          onOpenDifficulty={() => openDifficulty('settings')}
          /* The biggest door of the three: deleting the account takes the
             blocklist, the schedules and the guardian with it. Guarded on the
             way in rather than at the confirm — `onConfirmDelete` has to
             return the promise the screen awaits before it navigates away,
             and deferring inside it would let the screen carry on as though
             the account were gone. */
          onOpenDeleteAccount={() =>
            requireGuardian(() => setOverlay('deleteAccount'), 'settings', 'deleteAccount')
          }
          onOpenAbout={() => setOverlay('about')}
          onOpenTerms={() => setOverlay('terms')}
          onOpenPrivacy={() => setOverlay('privacy')}
          difficultyLabel={intensity.name}
        />
      );
    if (ov === 'screenTimeDiagnostics')
      return (
        <ScreenTimeDiagnostics
          onBack={() => setOverlay('settings')}
          onAddBailouts={(count) => {
            const next = emergencyTokens + count;
            setEmergencyTokens(next);
            onPatch({ emergencyTokens: next });
          }}
        />
      );
    if (ov === 'appearance')
      return <AppearanceScreen onBack={() => setOverlay('settings')} />;
    if (ov === 'deleteAccount')
      return (
        <DeleteAccountScreen
          onBack={() => setOverlay('settings')}
          onConfirmDelete={onDeleteAccount}
        />
      );
    if (ov === 'blockedApps')
      return (
        <BlockedAppsScreen
          /* Android only: iOS has no way to interpose on an app launch, so
             the whole section is absent rather than present and inert. */
          pausedPackages={Platform.OS === 'android' ? persisted.pausedPackages : undefined}
          onChangePaused={
            Platform.OS === 'android'
              ? (next) => onPatch({ pausedPackages: next })
              : undefined
          }
          pauseSeconds={persisted.pauseSeconds}
          onChangePauseSeconds={
            Platform.OS === 'android'
              ? (seconds) => onPatch({ pauseSeconds: seconds })
              : undefined
          }
          blockedPackages={blockedPackages}
          onChange={(next) => {
            /* Adding is free; taking something off is the loosening. Guarding
               both would make the guardian a tax on tightening, which is the
               opposite of the point. */
            const loosening = next.length < blockedPackages.length;
            const apply = () => {
              setBlockedPackagesState(next);
              onPatch({ blockedPackages: next });
            };
            if (loosening) requireGuardian(apply, 'blockedApps', 'blockedApps');
            else apply();
          }}
          appModes={blockedAppModes}
          onChangeModes={(next) => {
            /* Per-app Strict → Steady is exactly the loosening the global
               dial asks for a code before allowing. Leaving it free here made
               the guarded dial pointless: drop every app to Steady one at a
               time and you have loosened everything without ever touching it. */
            const wasStrict = (m?: Record<string, string>) =>
              Object.values(m ?? {}).filter((v) => v === 'strict').length;
            const loosening = wasStrict(next) < wasStrict(blockedAppModes);
            const apply = () => {
              setBlockedAppModes(next);
              onPatch({ blockedAppModes: next });
            };
            if (loosening) requireGuardian(apply, 'blockedApps', 'blockedApps');
            else apply();
          }}
          defaultMode={activeIntensityKey}
          onBack={() => setOverlay('settings')}
        />
      );
    if (ov === 'blocks')
      return (
        <BlocksScreen
          appLimits={appLimits}
          onSaveLimits={(next) => {
            /* Two ways to loosen a limit: delete it, or give yourself more
               minutes on it. Both are the same act as taking an app off the
               blocklist, so both cost the same. */
            const byPkg = new Map(appLimits.map((l) => [l.packageName, l]));
            const loosening =
              next.length < appLimits.length ||
              next.some((l) => {
                const before = byPkg.get(l.packageName);
                return !!before && l.limitMinutes > before.limitMinutes;
              });
            const apply = () => setAppLimits(next);
            if (loosening) requireGuardian(apply, 'blocks', 'schedules');
            else apply();
          }}
          onBack={() => setOverlay(null)}
          /* A limit only means anything for an app that is otherwise open.
             The screen needs to know which apps are already shut all day so
             it can say so instead of offering a setting that would do
             nothing. */
          blockedPackages={blockedPackages}
          onUnblock={(pkg) =>
            requireGuardian(
              () => {
                const next = blockedPackages.filter((p) => p !== pkg);
                setBlockedPackagesState(next);
                onPatch({ blockedPackages: next });
              },
              'blocks',
              'blockedApps',
            )
          }
        />
      );
    if (ov === 'emergencyTokens')
      return (
        <EmergencyTokensScreen
          tokenBalance={emergencyTokens}
          onBack={() => setOverlay(null)}
          products={bailoutProducts}
          onGrant={(quantity) => {
            const next = emergencyTokens + quantity;
            setEmergencyTokens(next);
            onPatch({ emergencyTokens: next });
          }}
        />
      );
    if (ov === 'difficulty')
      return (
        <IntensityScreen
          recommended={activeIntensityKey}
          current={activeIntensityKey}
          daysOnLevel={daysOnLevel(intensitySince)}
          pending={pendingIntensity}
          onContinue={(k) => {
            if (guardian?.enabled && isLoosening(activeIntensityKey, k)) {
              setPendingGuardianTarget(k);
              setOverlay('guardianVerify');
              return;
            }
            changeIntensity(k);
            setOverlay(difficultyOrigin);
          }}
        />
      );
    if (ov === 'guardian')
      return (
        <GuardianScreen
          initial={guardian}
          hoursReclaimed={hoursReclaimed}
          onBack={() => setOverlay('settings')}
          onSave={(g) => {
            setGuardian(g);
            onPatch({ guardian: g });
          }}
          /* Turning Guardian off is the sixth door, and it used to be the
             only unguarded one — five actions behind a code, defeated by a
             single toggle. It now goes through the same screen as the rest:
             the code, or three bailouts. */
          onRequestDisable={
            guardian?.enabled
              ? () =>
                  requireGuardian(
                    () => {
                      setGuardian(null);
                      onPatch({ guardian: null });
                      setOverlay('settings');
                    },
                    'settings',
                    'settings',
                  )
              : undefined
          }
        />
      );
    if (ov === 'guardianVerify' && guardian)
      return (
        <GuardianVerifyScreen
          guardian={guardian}
          intent={guardedAction?.intent ?? 'intensity'}
          bailouts={emergencyTokens}
          /* One key buys one guarded action — never Guardian itself. A key
             that deleted the feature would put a one-dollar ceiling on the
             whole commitment system, so removing Guardian stays code-or-wait.
             Deleting the account is excluded too: charging for that is a
             bizarre thing to do and reads as holding data hostage. */
          onSpendBailout={() => {
            if (emergencyTokens < GUARDIAN_RELEASE_COST) return;
            const next = Math.max(0, emergencyTokens - GUARDIAN_RELEASE_COST);
            setEmergencyTokens(next);
            // Guardian goes with it. This is the emergency exit for a lost
            // code or a guardian who has gone quiet — it removes the lock,
            // not just this one door, because a per-door price would mean
            // paying again every time and would trap the same user twice.
            setGuardian(null);
            onPatch({ emergencyTokens: next, guardian: null });
            runGuarded();
          }}
          onBuyBailouts={() => setOverlay('emergencyTokens')}
          onVerified={runGuarded}
          onCancel={() => {
            if (guardedAction) {
              const { back } = guardedAction;
              setGuardedAction(null);
              setOverlay(back);
              return;
            }
            setPendingGuardianTarget(null);
            setOverlay('difficulty');
          }}
        />
      );
    if (ov === 'waitingRoom')
      return (
        <WaitingRoomScreen
          onBack={() => setOverlay('settings')}
          initial={waitingRoomFamilies}
          onSave={(families) => {
            setWaitingRoomFamilies(families);
            onPatch({ waitingRoomFamilies: families });
          }}
        />
      );
    if (ov === 'subscription')
      return (
        <SubscriptionScreen
          info={customerInfo}
          isPro={isPro}
          bailouts={emergencyTokens}
          onBack={() => setOverlay('settings')}
          onBuyBailouts={() => setOverlay('emergencyTokens')}
          onUpgrade={() => {
            setPlansReturn('subscription');
            setOverlay('plans');
          }}
        />
      );
    /* Plans, reachable from Settings.
     *
     *  This is the same screen the onboarding funnel uses, deliberately: one
     *  purchase implementation, one set of 3.1.2 disclosures, one restore
     *  button. A second bespoke buy sheet in Settings would be two things to
     *  keep correct and two things for App Review to disagree with. */
    if (ov === 'about') return <AboutScreen onBack={() => setOverlay('settings')} />;
    if (ov === 'terms')
      return (
        <WebDocScreen
          title="Terms of Use"
          url={TERMS_URL}
          onBack={() => setOverlay('settings')}
        />
      );
    if (ov === 'privacy')
      return (
        <WebDocScreen
          title="Privacy Policy"
          url={PRIVACY_POLICY_URL}
          onBack={() => setOverlay('settings')}
        />
      );
    if (ov === 'plans')
      return (
        <TrialTimelineScreen
          offering={offering}
          onPurchased={onPurchasedPlan}
          onStart={() => setOverlay(plansReturn)}
          onClose={() => setOverlay(plansReturn)}
        />
      );
    if (ov === 'blockScreens')
      return (
        <BlockScreensScreen
          themeKey={activeThemeKey}
          onSelectTheme={setActiveThemeKey}
          onBack={() => setOverlay('settings')}
        />
      );
    if (ov === 'schedules')
      return (
        <ScheduleEditorScreen
          schedules={schedules}
          slipWindow={persisted.onboardingAnswers?.slipWindow?.label ?? null}
          onChange={(next) => {
            const apply = () => {
              setSchedules(next);
              onPatch({ schedules: next });
            };
            /* Removing a window is the loosening. Adding or editing one is
               not, so the code is only asked for on the way down. */
            if (next.length < schedules.length) requireGuardian(apply, 'schedules', 'schedules');
            else apply();
          }}
          onBack={() => setOverlay(null)}
          isPro={isPro}
          onUpgrade={() => {
            // Prices, and then back to the schedules the user was editing.
            setPlansReturn('schedules');
            setOverlay('plans');
          }}
        />
      );
    if (ov === 'account')
      return (
        <AccountScreen
          name={accountName}
          onSaveName={setAccountName}
          account={account}
          onSignIn={(a) => {
            setAccount(a);
            onPatch({ account: a });
          }}
          onSignOut={() => {
            setAccount(null);
            onPatch({ account: null });
          }}
          onBack={() => setOverlay('settings')}
        />
      );
    if (ov === 'futureSelf')
      return (
        <FutureSelfScreen
          editing
          initialMessage={futureSelf}
          onBack={() => setOverlay('settings')}
          onContinue={(m) => {
            setFutureSelf(m);
            onPatch({ futureSelfMessage: m });
            setOverlay('settings');
          }}
        />
      );
    if (ov === 'milestones')
      return <MilestonesScreen onBack={() => setOverlay('profile')} progress={progress} firstOpenDate={persisted.firstOpenDate} />;
    if (ov === 'essentials')
      return (
        <EssentialsScreen
          enabled={essentials}
          onChange={(next) => {
            setEssentials(next);
            onPatch({ essentials: next });
          }}
          onBack={() => setOverlay(null)}
        />
      );
    if (ov === 'progressPhotos')
      return (
        <ProgressPhotosScreen
          photos={progressPhotos}
          firstOpenDate={persisted.firstOpenDate}
          onAddPhoto={(photo) => {
            const next = [...progressPhotos, photo];
            setProgressPhotos(next);
            onPatch({ progressPhotos: next });
          }}
          onBack={() => setOverlay('profile')}
        />
      );
    if (ov === 'calendar') return <CalendarScreen progress={progress} onBack={() => setOverlay('profile')} />;
    if (ov === 'weeklyInsight')
      return (
        <WeeklyStoryScreen
          progress={progress}
          goalLine={goal.line}
          onClose={() => setOverlay('profile')}
        />
      );
    if (ov === 'realUsage') return <RealUsageScreen onBack={() => setOverlay('profile')} />;
    // World feature — deprioritized, code kept for later.
    // if (ov === 'ledger')
    //   return <TimeLedgerScreen hoursReclaimed={hoursReclaimed} onBack={() => setOverlay(null)} />;
    // if (ov === 'landmarks')
    //   return (
    //     <LandmarksScreen hoursReclaimed={hoursReclaimed} dayNumber={dayNumber} onBack={() => setOverlay(null)} />
    //   );
    // if (ov === 'seasons') return <SeasonsScreen onBack={() => setOverlay(null)} />;
    if (ov === 'profile') {
      return (
        <ProfileScreen
          onBack={() => setOverlay(null)}
          onOpenSettings={openSettings}
          onOpenMilestones={() => setOverlay('milestones')}
          onOpenProgressPhotos={() => setOverlay('progressPhotos')}
          progressPhotos={progressPhotos}
          onOpenCalendar={() => setOverlay('calendar')}
          // Android only: the screen reads UsageStatsManager, which does not
          // exist on iOS — there it rendered an empty state under a row
          // literally subtitled "Android screen time".
          onOpenRealUsage={Platform.OS === 'android' ? () => setOverlay('realUsage') : undefined}
          onOpenWeeklyInsight={() => setOverlay('weeklyInsight')}
          gateReflections={gateReflections}
          progress={progress}
          username={accountName || account?.name || 'You'}
          firstOpenDate={persisted.firstOpenDate}
          goalLine={goal.line}
        />
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <ScreenSwap key={tab}>
          {tab === 'home' && (
            <HomeScreen
              onOpenProfile={() => setOverlay('profile')}
              onOpenApps={() => setTab('apps')}
              onTriggerShield={openUnlockFlow}
              onOpenRooms={() => setTab('timer')}
              onOpenGuardian={openGuardian}
              guardianName={guardian?.enabled ? guardian.name : null}
              onOpenProgressPhotos={() => setOverlay('progressPhotos')}
              progressPhotos={progressPhotos}
              photoDue={nextPhotoDue(progressPhotos, persisted.firstOpenDate)}
              sessionRunning={timerRunning}
              onStartBlock={(minutes) => startSession(minutes, 'Focus Timer', false)}
              onStartRest={() => {
                setTimerPreset({ minutes: 10, label: 'Rest Timer', autoStart: false });
                setTab('timer');
              }}
              onStartPreset={(minutes, label, hardMode) => startSession(minutes, label, !!hardMode)}
              onOpenSleepSchedule={() => setOverlay('schedules')}
              onOpenBlockedApps={() => setOverlay('blockedApps')}
              bailoutBalance={emergencyTokens}
              bailoutFromPrice={cheapestBailoutPrice}
              onOpenDifficulty={() => openDifficulty(null)}
              onBuyBailouts={() => setOverlay('emergencyTokens')}
              intensityKey={activeIntensityKey}
              progress={progress}
              goalLine={goal.line}
              blockedPackages={blockedPackages}
              unlockNumber={unlockNumber}
              score={rank.percent}
              scoreTrendUp={scoreTrendUp}
              focusPresetMinutes={25}
              restPresetMinutes={10}
              sleepHours={sleepWindowHours}
              usage={usage}
            />
          )}
          {tab === 'apps' && (
            <MyAppsScreen
              onOpenGuardian={openGuardian}
              guardianName={guardian?.enabled ? guardian.name : null}
              hardBlocks={persisted.hardBlocks ?? []}
              blockedPackages={blockedPackages}
              intensityKey={activeIntensityKey}
              schedules={schedules}
              onUnblockPackage={(pkg) => {
                // Guarded like every other unblock. This one was not, which
                // made the tidiest route out of Byre a single tap on the very
                // screen listing what you asked to be protected from — and it
                // bypassed a guardian entirely.
                const next = blockedPackages.filter((p) => p !== pkg);
                const apply = () => {
                  setBlockedPackagesState(next);
                  onPatch({ blockedPackages: next });
                };
                requireGuardian(apply, null, 'blockedApps');
              }}
              onOpenBlockedApps={() => setOverlay('blockedApps')}
              onOpenSchedules={() => setOverlay('schedules')}
              onOpenEssentials={() => setOverlay('essentials')}
              onOpenBlocks={() => setOverlay('blocks')}
              onOpenDifficulty={() => openDifficulty(null)}
            />
          )}
          {tab === 'timer' && (
            <TimerScreen
              key={`${timerPreset.minutes}-${timerPreset.label}-${timerPreset.nonce ?? 0}`}
              initialMinutes={timerPreset.minutes}
              label={timerPreset.label}
              motivationLine={goal.line ? `Protecting: ${goal.line}` : momentLine()}
              essentials={essentials}
              session={session}
              onStartSession={startSession}
              onEndSession={endSession}
              onStartAmbience={startAmbience}
              hardMode={!!timerPreset.hardMode}
              onFocusComplete={(mins) => {
                applyProgress([{ type: 'focus', minutes: mins }, { type: 'lockSession' }]);
              }}
              blockedPackages={blockedPackages}
              onUpdateBlockedPackages={(next) => {
                const apply = () => {
                  setBlockedPackagesState(next);
                  onPatch({ blockedPackages: next });
                };
                if (next.length < blockedPackages.length) requireGuardian(apply, null, 'blockedApps');
                else apply();
              }}
              tokenBalance={emergencyTokens}
              onSpendTokenToCancel={() => {
                if (emergencyTokens <= 0) return;
                const next = Math.max(0, emergencyTokens - 1);
                setEmergencyTokens(next);
                onPatch({ emergencyTokens: next });
              }}
              onOpenShield={openUnlockFlow}
              onEmergency={openEmergencyAccess}
              onOpenTokenInfo={() => setOverlay('emergencyTokens')}
              onDimChange={setTimerDimmed}
              sessionSound={sessionSound}
              /* Session sound is built and working, but parked: without
                 `onChangeSessionSound` the card does not render and nothing
                 plays. Restore this handler to bring it back — the reason it
                 is off is the background-audio declaration it would need
                 (see SessionSoundCard's note on the 2.5.4 rejection).
              onChangeSessionSound={(key) => {
                setSessionSound(key);
                onPatch({ sessionSound: key });
              }} */
            />
          )}
        </ScreenSwap>

        {/* A running session takes the whole screen. There is one way out of
            the timer and it is the call button on the timer itself; a tab bar
            beside it would be a second, quieter one. Also hidden behind the
            always-on face, where a lit bar across the bottom of a black page
            just looks broken. */}
        {!timerRunning && !timerDimmed && (
          <TabBar
            tabs={TABS}
            active={tab}
            onSelect={(key) => {
              if (key === 'timer' && tab !== 'timer') {
                // Opening the tab from elsewhere always lands on slide-to-start,
                // never the locked in-session screen.
                setTimerPreset({ minutes: 25, label: 'Focus Timer', autoStart: false });
              }
              setTab(key);
            }}
          />
        )}
      </View>
    );
  }

  const showBar = grantExpiresAt !== null && grantExpiresAt > Date.now();

  return (
    <View style={{ flex: 1 }}>
      {renderMain()}
      {showBar && grantExpiresAt !== null && (
        <LiveActivityBar
          expiresAt={grantExpiresAt}
          emergency={grantIsEmergency}
          onExpire={() => {
            setGrantExpiresAt(null);
            void cancelGrantEndedNotification();
            if (somethingIsBlocked()) alertGrantEnded();
          }}
          onPress={() => setBlock(grantIsEmergency ? 'emergency' : 'grant')}
        />
      )}
      {/* No Bailouts in hand. Said before the lock, not when they try to
          leave — "you cannot get out until this ends" is a commitment someone
          should make knowingly. Both ways out are offered: buy a Bailout, or
          start anyway with eyes open. */}
      {/* Pro gates, in the app's own voice rather than the platform's. */}
      <ProGateDialog
        visible={!!proGate}
        title={proGate?.title ?? ''}
        body={proGate?.body ?? ''}
        icon={proGate?.icon}
        onDismiss={() => setProGate(null)}
        onSeePlans={() => {
          setProGate(null);
          // Straight to the prices, and back to whatever screen asked.
          setPlansReturn(overlay ?? null);
          setOverlay('plans');
        }}
      />
      {noBailoutStart && (
        <NoBailoutConfirm
          visible
          balance={emergencyTokens}
          onGet={() => {
            setNoBailoutStart(null);
            setOverlay('emergencyTokens');
          }}
          onStartAnyway={() => {
            const held = noBailoutStart;
            setNoBailoutStart(null);
            if (held) reallyStartSession(held.minutes, held.label, held.hardMode);
          }}
          onDismiss={() => setNoBailoutStart(null)}
        />
      )}
      {/* The pre-flight permission ask. Over everything, because a half-granted
          app that lets you keep tapping around is exactly how a session gets
          started with nothing behind it. On continue the gate re-checks rather
          than trusting that the Settings trip worked — the user can always
          back out of one — and only the grants that are actually in place let
          the held session through. */}
      {gateKeys && (
        <View style={StyleSheet.absoluteFill}>
          <PermissionBoardingPassScreen
            only={gateKeys}
            onContinue={() => {
              void (async () => {
                const held = pendingStart;
                const stillMissing = await missingBlockingPermissions();
                setGateKeys(null);
                setPendingStart(null);
                if (held && stillMissing.length === 0) {
                  reallyStartSession(held.minutes, held.label, held.hardMode);
                } else if (held) {
                  // They skipped past a grant. Saying so beats starting a lock
                  // that cannot lock, and beats the tap appearing to do nothing.
                  Alert.alert(
                    'Not locked',
                    'Byre still needs that permission before it can hold anything back. Nothing was started — grant it and try again.',
                  );
                }
              })();
            }}
          />
        </View>
      )}
      {/* Over everything, including the tab bar: a room is the whole screen
          or it is not a room. Dismissing it only closes the view — the block
          it started keeps running, which is what the footnote inside says. */}
      {room && (
        <AmbienceSessionScreen
          ambience={room.ambience}
          endsAt={room.endsAt}
          onClose={() => setRoom(null)}
          /* Ran its full length. Nothing is owed, and the room hands back to
             Home rather than to a timer the user is finished with. */
          onEnd={() => {
            setRoom(null);
            setTab('home');
          }}
          tokenBalance={emergencyTokens}
          onOpenTokenInfo={() => {
            setRoom(null);
            setOverlay('emergencyTokens');
          }}
          /* Left early. The room charges exactly what the locked timer
             charges — one Bailout — and then puts the user on Home, not on
             the timer for a session that no longer exists. */
          onBailout={() => {
            if (emergencyTokens <= 0) return;
            const next = Math.max(0, emergencyTokens - 1);
            setEmergencyTokens(next);
            onPatch({ emergencyTokens: next });
            endSession();
            setRoom(null);
            setTab('home');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  insightScroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.tabClearance },
});

/**
 * Tab content, arriving. Mounted with `key={tab}`, so switching tabs remounts
 * this and replays the entrance.
 *
 * Deliberately entrance-only: an `exiting` animation here keeps the outgoing
 * screen's box alive on React Native Web while the next one lays out, which is
 * the cause of the onboarding text-overlap bug this codebase kept hitting. A
 * fade up on the incoming screen alone reads as a transition anyway.
 */
function ScreenSwap({ children }: { children: React.ReactNode }) {
  const style = useEntrance({ rise: 10 });
  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
