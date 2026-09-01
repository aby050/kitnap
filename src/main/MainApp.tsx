import React, { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import HomeScreen from './HomeScreen';
import MyAppsScreen from './MyAppsScreen';
import ProfileScreen from './ProfileScreen';
import MilestonesScreen from './MilestonesScreen';
import SettingsScreen from './SettingsScreen';
import TimerScreen from './TimerScreen';
import EmergencyTokensScreen from './EmergencyTokensScreen';
import DeleteAccountScreen from './DeleteAccountScreen';
import ReflectionScreen from './ReflectionScreen';
import EssentialsScreen from './EssentialsScreen';
// World feature — deprioritized per product decision (Wend-style apps don't
// have a "world" concept; focus is the core Shield/Gate/timer loop instead).
// Code kept, commented, in case we revisit it later.
// import WorldScreen from './WorldScreen';
// import TimeLedgerScreen from './TimeLedgerScreen';
// import LandmarksScreen from './LandmarksScreen';
// import SeasonsScreen from './SeasonsScreen';
import GuardianScreen from './GuardianScreen';
import WaitingRoomScreen from './WaitingRoomScreen';
import BlockScreensScreen from './BlockScreensScreen';
import AutofocusScreen from './AutofocusScreen';
import ScheduleEditorScreen from './ScheduleEditorScreen';
import PinAccessScreen from './PinAccessScreen';
import AccountScreen from './AccountScreen';
import TogetherScreen from './TogetherScreen';
import FutureSelfScreen from '../onboarding/FutureSelfScreen';
import IntensityScreen from '../onboarding/IntensityScreen';
import BlockedAppsScreen from './BlockedAppsScreen';
import BlocksScreen from './BlocksScreen';
import ShieldScreen from '../shield/ShieldScreen';
import GateScreen from '../shield/GateScreen';
import GrantScreen from '../shield/GrantScreen';
import { alertGrantEnded, cancelGrantEndedNotification, scheduleGrantEndedNotification } from '../data/grantNotify';
import LiveActivityBar from '../shield/LiveActivityBar';
import { getIntensity, getTheme, IntensityKey, ThemeKey } from '../data/themes';
import { isHealthLimited } from '../data/gateQuestions';
import { computeRepTarget, parseAge, parseLifeChange } from '../data/activityDifficulty';
import { ActivityKind, ActivitySessionResult } from '../shield/activity/types';
import { EMPTY_GOAL, GoalData } from '../data/goal';
import { Account, DEFAULT_STATE, PersistedState, AppLimit, startingEmergencyTokens } from '../data/store';
import { ProgressEvent, ProgressState, dateKey, daysSinceJoin, getDay, globalPercentile, recordEvents, sumRange, totals, unlockAchievements, weeklyWindows } from '../data/progress';
import { useTodayUsage } from '../data/useTodayUsage';
import { recordGateReflection, recordActivitySession } from '../data/store';
import { DEFAULT_BEDTIME, isWithinBedtime } from '../data/bedtime';
import { shouldShowCheckIn } from '../data/checkin';
import CheckInScreen from './CheckInScreen';
import ProgressPhotosScreen from './ProgressPhotosScreen';
import { ProgressPhoto } from '../data/progressPhotos';
import CalendarScreen from './CalendarScreen';
import WeeklyInsight from './WeeklyInsight';
import RealUsageScreen from './RealUsageScreen';
import { configureShield, grantTemporaryAccess, hasBlockedSelection, isCurrentlyShielded } from '../data/iosScreenTime';
import { palette, space } from '../design/tokens';
import { Screen, ScreenHeader } from '../design/primitives';
import Icon, { IconName } from '../ui/Icon';

type Tab = 'home' | 'apps' | 'reflect' | 'timer';
type Overlay =
  | null
  | 'profile'
  | 'milestones'
  | 'settings'
  | 'settingsLocked'
  | 'essentials'
  // | 'ledger'
  // | 'landmarks'
  // | 'seasons'
  | 'together'
  | 'guardian'
  | 'waitingRoom'
  | 'blockScreens'
  | 'autofocus'
  | 'schedules'
  | 'pin'
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
  | 'deleteAccount';
type Block = null | 'shield' | 'gate' | 'grant' | 'emergency';
type TimerPreset = { minutes: number; label: string; autoStart: boolean; hardMode?: boolean };

const TABS: { key: Tab; label: string; mark: IconName }[] = [
  { key: 'home', label: 'Home', mark: 'home' },
  { key: 'apps', label: 'My apps', mark: 'grid' },
  { key: 'reflect', label: 'Reflect', mark: 'chart' },
  { key: 'timer', label: 'Timer', mark: 'timer' },
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
  onDeleteAccount = async () => {},
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
  /** Wipes all local data and returns the app to onboarding — owned by
   *  App.tsx since it has to reset top-level state this component doesn't. */
  onDeleteAccount?: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [block, setBlock] = useState<Block>(null);
  const [grantMinutes, setGrantMinutes] = useState(5);
  const [grantExpiresAt, setGrantExpiresAt] = useState<number | null>(null);
  const [grantIsEmergency, setGrantIsEmergency] = useState(false);
  const [activeThemeKey, setActiveThemeKey] = useState<ThemeKey>(themeKey);
  const [activeIntensityKey, setActiveIntensityKey] = useState<IntensityKey>(intensityKey);
  const [timerPreset, setTimerPreset] = useState<TimerPreset>({ minutes: 25, label: 'Focus Timer', autoStart: false });
  // Once verified this session, Settings stays unlocked until the app is reloaded.
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);

  const [hoursReclaimed, setHoursReclaimed] = useState(persisted.hoursReclaimed);
  const [reclaimedToday, setReclaimedToday] = useState(persisted.reclaimedToday);
  const [unlockNumber, setUnlockNumber] = useState(persisted.unlockNumber);
  const [progress, setProgress] = useState<ProgressState>(persisted.progress);
  const [futureSelf, setFutureSelf] = useState(futureSelfMessage);
  const [accountName, setAccountName] = useState(persisted.account?.name ?? '');
  const [account, setAccount] = useState<Account | null>(persisted.account);
  const [guardian, setGuardian] = useState(persisted.guardian);
  const [pin, setPin] = useState(persisted.pin);
  const joinedDays = daysSinceJoin(persisted.firstOpenDate);
  // Computed once at mount so finishing (or skipping) the check-in doesn't
  // immediately re-trigger it within the same session.
  const [checkInDue, setCheckInDue] = useState(() =>
    shouldShowCheckIn(persisted.lastCheckInDate, persisted.firstOpenDate),
  );
  const [checkIns, setCheckIns] = useState(persisted.checkIns);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(persisted.progressPhotos);
  const [blockedPackages, setBlockedPackagesState] = useState<string[]>(persisted.blockedPackages);
  const [schedules, setSchedules] = useState(persisted.schedules);
  const [gateReflections, setGateReflections] = useState(persisted.gateReflections);
  const [activitySessions, setActivitySessions] = useState(persisted.activitySessions ?? []);
  const [appLimits, setAppLimits] = useState<AppLimit[]>(persisted.appLimits ?? []);
  const [emergencyTokens, setEmergencyTokens] = useState(persisted.emergencyTokens ?? startingEmergencyTokens());
  // Held until the gate resolves, so we can record whether they actually
  // went through with the unlock alongside what they wrote.
  const [pendingReflection, setPendingReflection] = useState<{ prompt: string; text: string } | null>(null);
  const usage = useTodayUsage();

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

  /** Adaptive rep target, resolved per movement when the gate picks one. */
  const repsFor = (activity: ActivityKind) =>
    computeRepTarget({
      activity,
      age: parseAge(persisted.onboardingAnswers?.age?.value),
      history: activitySessions,
      now: new Date(),
      lifeChange: parseLifeChange(persisted.onboardingAnswers?.lifeChange?.value),
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
  const rank = globalPercentile(progress);
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
      setBlock('shield');
      setOverlay(null);
      onShieldConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingShieldPackage]);

  // iOS equivalent: Apple's own Shield UI is what the user actually sees
  // over a blocked app (not our RN ShieldScreen — Apple doesn't allow custom
  // UI inside that extension). Its button opens Wend, so on foreground we
  // check whether a shield is currently active and, if so, skip straight to
  // the Gate — the "I need it" step already happened on Apple's screen.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    configureShield(
      theme.lines[0] ?? 'Take a moment.',
      goal.line ? `You said you wanted ${goal.line}.` : theme.forWho,
    );
    const checkShield = () => {
      if (isCurrentlyShielded() && block === null) {
        setBlock('gate');
        setOverlay(null);
      }
    };
    checkShield();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkShield();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkInDue && block === null) {
    return (
      <CheckInScreen
        onboardingAnswers={persisted.onboardingAnswers}
        previousCheckIns={checkIns}
        progress={progress}
        currentIntensityKey={activeIntensityKey}
        onAdoptIntensity={setActiveIntensityKey}
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

  // The block flow is a full-screen takeover, exactly as the real shield would be.
  if (block === 'shield') {
    return (
      <ShieldScreen
        theme={theme}
        goal={goal}
        unlockNumber={unlockNumber}
        isBedtime={isBedtime}
        onNotNow={() => {
          // Closing without unlocking is what actually credits the world.
          setReclaimedToday((m) => m + 3);
          applyProgress([
            { type: 'saved', minutes: 3 },
            { type: 'blocked' },
          ]);
          setBlock(null);
        }}
        onNeedIt={() => setBlock('gate')}
        onEmergency={() => {
          setGrantIsEmergency(true);
          setGrantExpiresAt(Date.now() + 15 * 60000);
          setBlock('emergency');
        }}
      />
    );
  }

  if (block === 'gate') {
    return (
      <GateScreen
        intensity={intensity}
        futureSelfMessage={futureSelf}
        healthLimited={isHealthLimited(persisted.onboardingAnswers?.healthLimit?.value)}
        repsFor={repsFor}
        onActivityComplete={commitActivitySession}
        tokenBalance={emergencyTokens}
        onSkipWithToken={() => {
          const nextTokens = Math.max(0, emergencyTokens - 1);
          setEmergencyTokens(nextTokens);
          onPatch({ emergencyTokens: nextTokens });
          if (Platform.OS === 'ios' && hasBlockedSelection()) grantTemporaryAccess(intensity.grantMinutes);
          setGrantMinutes(intensity.grantMinutes);
          setGrantIsEmergency(false);
          setGrantExpiresAt(Date.now() + intensity.grantMinutes * 60000);
          setUnlockNumber((n) => n + 1);
          applyProgress([{ type: 'hardUnlock' }]);
          setBlock('grant');
        }}
        onGranted={(m) => {
          if (Platform.OS === 'ios' && hasBlockedSelection()) grantTemporaryAccess(m);
          setGrantMinutes(m);
          setGrantIsEmergency(false);
          setGrantExpiresAt(Date.now() + m * 60000);
          setUnlockNumber((n) => n + 1);
          applyProgress([{ type: 'hardUnlock' }]);
          setBlock('grant');
        }}
        onAbandoned={() => {
          setUnlockNumber((n) => n + 1);
          applyProgress([{ type: 'lockSession' }, { type: 'blocked' }]);
          setBlock(null);
        }}
        onEmergency={() => {
          setGrantIsEmergency(true);
          setGrantExpiresAt(Date.now() + 15 * 60000);
          setBlock('emergency');
        }}
      />
    );
  }

  if (block === 'grant' || block === 'emergency') {
    return (
      <GrantScreen
        minutes={block === 'emergency' ? 15 : grantMinutes}
        emergency={block === 'emergency'}
        expiresAt={grantExpiresAt ?? Date.now()}
        bailoutBalance={emergencyTokens}
        onDone={() => {
          void cancelGrantEndedNotification();
          if (!grantIsEmergency) {
            const next = Math.max(0, emergencyTokens - 1);
            setEmergencyTokens(next);
            onPatch({ emergencyTokens: next });
          }
          setBlock(null);
          setGrantExpiresAt(null);
        }}
        onMinimize={() => {
          if (grantExpiresAt) void scheduleGrantEndedNotification(grantExpiresAt);
          setBlock(null);
        }}
      />
    );
  }

  function openSettings() {
    if (pin && !settingsUnlocked) setOverlay('settingsLocked');
    else setOverlay('settings');
  }

  function renderMain(): React.ReactNode {
    if (overlay === 'settingsLocked')
      return (
        <PinAccessScreen
          existingPin={pin}
          onBack={() => setOverlay('profile')}
          onVerified={() => {
            setSettingsUnlocked(true);
            setOverlay('settings');
          }}
        />
      );
    if (overlay === 'settings')
      return (
        <SettingsScreen
          onBack={() => setOverlay('profile')}
          onOpenGuardian={() => setOverlay('guardian')}
          onOpenWaitingRoom={() => setOverlay('waitingRoom')}
          onOpenBlockScreens={() => setOverlay('blockScreens')}
          onOpenAutofocus={() => setOverlay('autofocus')}
          onOpenSchedules={() => setOverlay('schedules')}
          onOpenPin={() => setOverlay('pin')}
          onOpenAccount={() => setOverlay('account')}
          accountLabel={account ? account.identifier : undefined}
          onOpenFutureSelf={() => setOverlay('futureSelf')}
          onOpenTogether={() => setOverlay('together')}
          onOpenBlockedApps={() => setOverlay('blockedApps')}
          onOpenDifficulty={() => setOverlay('difficulty')}
          onOpenDeleteAccount={() => setOverlay('deleteAccount')}
          difficultyLabel={intensity.name}
          pinEnabled={!!pin}
        />
      );
    if (overlay === 'deleteAccount')
      return (
        <DeleteAccountScreen
          onBack={() => setOverlay('settings')}
          onConfirmDelete={onDeleteAccount}
        />
      );
    if (overlay === 'blockedApps')
      return (
        <BlockedAppsScreen
          blockedPackages={blockedPackages}
          onChange={(next) => {
            setBlockedPackagesState(next);
            onPatch({ blockedPackages: next });
          }}
          onBack={() => setOverlay('settings')}
        />
      );
    if (overlay === 'blocks')
      return (
        <BlocksScreen
          appLimits={appLimits}
          onSaveLimits={(next) => {
            setAppLimits(next);
          }}
          onBack={() => setOverlay(null)}
        />
      );
    if (overlay === 'emergencyTokens')
      return (
        <EmergencyTokensScreen
          tokenBalance={emergencyTokens}
          onBack={() => setOverlay(null)}
        />
      );
    if (overlay === 'difficulty')
      return (
        <IntensityScreen
          recommended={activeIntensityKey}
          onContinue={(k) => {
            setActiveIntensityKey(k);
            setOverlay('settings');
          }}
        />
      );
    if (overlay === 'together')
      return (
        <TogetherScreen
          guardian={guardian}
          hoursReclaimed={hoursReclaimed}
          onOpenGuardian={() => setOverlay('guardian')}
          onInvite={() => setOverlay('guardian')}
          onBack={() => setOverlay('settings')}
        />
      );
    if (overlay === 'guardian')
      return (
        <GuardianScreen
          initial={guardian}
          onBack={() => setOverlay('settings')}
          onSave={(g) => {
            setGuardian(g);
            onPatch({ guardian: g });
          }}
        />
      );
    if (overlay === 'waitingRoom') return <WaitingRoomScreen onBack={() => setOverlay('settings')} />;
    if (overlay === 'blockScreens')
      return (
        <BlockScreensScreen
          themeKey={activeThemeKey}
          onSelectTheme={setActiveThemeKey}
          onBack={() => setOverlay('settings')}
        />
      );
    if (overlay === 'autofocus') return <AutofocusScreen onBack={() => setOverlay('settings')} />;
    if (overlay === 'schedules')
      return (
        <ScheduleEditorScreen
          schedules={schedules}
          onChange={(next) => {
            setSchedules(next);
            onPatch({ schedules: next });
          }}
          onBack={() => setOverlay(null)}
        />
      );
    if (overlay === 'pin')
      return (
        <PinAccessScreen
          existingPin={null}
          onBack={() => setOverlay('settings')}
          onSet={(p) => {
            setPin(p);
            setSettingsUnlocked(true);
            onPatch({ pin: p });
          }}
        />
      );
    if (overlay === 'account')
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
    if (overlay === 'futureSelf')
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
    if (overlay === 'milestones')
      return <MilestonesScreen onBack={() => setOverlay('profile')} progress={progress} firstOpenDate={persisted.firstOpenDate} />;
    if (overlay === 'essentials') return <EssentialsScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'progressPhotos')
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
    if (overlay === 'calendar') return <CalendarScreen progress={progress} onBack={() => setOverlay('profile')} />;
    if (overlay === 'weeklyInsight')
      return (
        <Screen edges={['top']}>
          <ScreenHeader title="Weekly insight" onBack={() => setOverlay('profile')} />
          <ScrollView contentContainerStyle={styles.insightScroll} showsVerticalScrollIndicator={false}>
            <WeeklyInsight progress={progress} goalLine={goal.line} heading="This week" />
          </ScrollView>
        </Screen>
      );
    if (overlay === 'realUsage') return <RealUsageScreen onBack={() => setOverlay('profile')} />;
    // World feature — deprioritized, code kept for later.
    // if (overlay === 'ledger')
    //   return <TimeLedgerScreen hoursReclaimed={hoursReclaimed} onBack={() => setOverlay(null)} />;
    // if (overlay === 'landmarks')
    //   return (
    //     <LandmarksScreen hoursReclaimed={hoursReclaimed} dayNumber={dayNumber} onBack={() => setOverlay(null)} />
    //   );
    // if (overlay === 'seasons') return <SeasonsScreen onBack={() => setOverlay(null)} />;
    if (overlay === 'profile') {
      return (
        <ProfileScreen
          onBack={() => setOverlay(null)}
          onOpenSettings={openSettings}
          onOpenMilestones={() => setOverlay('milestones')}
          onOpenProgressPhotos={() => setOverlay('progressPhotos')}
          onOpenCalendar={() => setOverlay('calendar')}
          onOpenRealUsage={() => setOverlay('realUsage')}
          onOpenWeeklyInsight={() => setOverlay('weeklyInsight')}
          progress={progress}
          username={accountName || account?.name || 'You'}
          firstOpenDate={persisted.firstOpenDate}
          goalLine={goal.line}
        />
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <Animated.View key={tab} entering={FadeIn.duration(260)} style={{ flex: 1 }}>
          {tab === 'home' && (
            <HomeScreen
              onOpenProfile={() => setOverlay('profile')}
              onOpenApps={() => setTab('apps')}
              onTriggerShield={() => setBlock('shield')}
              onOpenEssentials={() => setOverlay('essentials')}
              onStartFocus={() => {
                setTimerPreset({ minutes: 25, label: 'Focus Timer', autoStart: false });
                setTab('timer');
              }}
              onStartRest={() => {
                setTimerPreset({ minutes: 10, label: 'Rest Timer', autoStart: false });
                setTab('timer');
              }}
              onStartPreset={(minutes, label, hardMode) => {
                setTimerPreset({ minutes, label, autoStart: true, hardMode: !!hardMode });
                setTab('timer');
              }}
              onOpenSleepSchedule={() => setOverlay('schedules')}
              onOpenBlockedApps={() => setOverlay('blockedApps')}
              blockedPackages={blockedPackages}
              unlockNumber={unlockNumber}
              streakDays={progress.currentStreak}
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
              blockedPackages={blockedPackages}
              intensityKey={activeIntensityKey}
              schedules={schedules}
              onUnblockPackage={(pkg) => {
                const next = blockedPackages.filter((p) => p !== pkg);
                setBlockedPackagesState(next);
                onPatch({ blockedPackages: next });
              }}
              onOpenBlockedApps={() => setOverlay('blockedApps')}
              onOpenSchedules={() => setOverlay('schedules')}
              onOpenEssentials={() => setOverlay('essentials')}
              onOpenBlocks={() => setOverlay('blocks')}
            />
          )}
          {tab === 'reflect' && (
            <ReflectionScreen progress={progress} gateReflections={gateReflections} />
          )}
          {tab === 'timer' && (
            <TimerScreen
              key={`${timerPreset.minutes}-${timerPreset.label}`}
              initialMinutes={timerPreset.minutes}
              label={timerPreset.label}
              motivationLine={goal.line ? `Protecting: ${goal.line}` : theme.forWho}
              autoStart={timerPreset.autoStart}
              hardMode={!!timerPreset.hardMode}
              onOpenEssentials={() => setOverlay('essentials')}
              onFocusComplete={(mins) => {
                applyProgress([{ type: 'focus', minutes: mins }, { type: 'lockSession' }]);
              }}
              blockedPackages={blockedPackages}
              onUpdateBlockedPackages={(next) => {
                setBlockedPackagesState(next);
                onPatch({ blockedPackages: next });
              }}
              tokenBalance={emergencyTokens}
              onSpendTokenToCancel={() => {
                const next = Math.max(0, emergencyTokens - 1);
                setEmergencyTokens(next);
                onPatch({ emergencyTokens: next });
              }}
              onOpenShield={() => setOverlay('blockedApps')}
              onOpenTokenInfo={() => setOverlay('emergencyTokens')}
            />
          )}
        </Animated.View>

        <View style={styles.tabBarWrap}>
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => {
                    if (t.key === 'timer' && tab !== 'timer') {
                      // Opening the tab from elsewhere always lands on slide-to-start,
                      // never the locked in-session screen.
                      setTimerPreset({ minutes: 25, label: 'Focus Timer', autoStart: false });
                    }
                    setTab(t.key);
                  }}
                  style={styles.tabItem}
                >
                  <View style={[styles.tabIconPill, active && styles.tabIconPillActive]}>
                    <Icon
                      name={t.mark}
                      size={21}
                      color={active ? palette.accent : palette.textTertiary}
                      strokeWidth={active ? 1.9 : 1.7}
                    />
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
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
            alertGrantEnded();
          }}
          onPress={() => setBlock(grantIsEmergency ? 'emergency' : 'grant')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  insightScroll: { paddingHorizontal: space.gutter, paddingTop: space.sm, paddingBottom: space.tabClearance },
  tabBarWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: palette.base },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.base,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    paddingBottom: 28,
    paddingTop: 8,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  tabIconPillActive: {
    backgroundColor: palette.accentSoft,
  },
  tabLabel: {
    color: palette.textTertiary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: palette.accent,
    fontWeight: '700',
  },
});
