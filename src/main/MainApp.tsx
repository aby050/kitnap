import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import HomeScreen from './HomeScreen';
import MyAppsScreen from './MyAppsScreen';
import ProfileScreen from './ProfileScreen';
import MilestonesScreen from './MilestonesScreen';
import SettingsScreen from './SettingsScreen';
import TimerScreen from './TimerScreen';
import ReflectionScreen from './ReflectionScreen';
import EssentialsScreen from './EssentialsScreen';
// World feature — deprioritized per product decision (Opal-style apps don't
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
import ShieldScreen from '../shield/ShieldScreen';
import GateScreen from '../shield/GateScreen';
import GrantScreen from '../shield/GrantScreen';
import LiveActivityBar from '../shield/LiveActivityBar';
import { getIntensity, getTheme, IntensityKey, ThemeKey } from '../data/themes';
import { EMPTY_GOAL, GoalData } from '../data/goal';
import { DEFAULT_STATE, PersistedState } from '../data/store';
import { colors } from '../theme';

type Tab = 'home' | 'apps' | 'together' | 'reflect' | 'timer';
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
  | 'guardian'
  | 'waitingRoom'
  | 'blockScreens'
  | 'autofocus'
  | 'schedules'
  | 'pin'
  | 'account'
  | 'futureSelf';
type Block = null | 'shield' | 'gate' | 'grant' | 'emergency';
type TimerPreset = { minutes: number; label: string; autoStart: boolean };

const TABS: { key: Tab; glyph: string; label: string }[] = [
  { key: 'home', glyph: '◯', label: 'Home' },
  { key: 'apps', glyph: '⣿', label: 'Apps' },
  { key: 'together', glyph: '🤝', label: 'Together' },
  { key: 'reflect', glyph: '◔', label: 'Reflect' },
  { key: 'timer', glyph: '▶', label: 'Timer' },
];

export default function MainApp({
  themeKey = 'quiet',
  intensityKey = 'steady',
  futureSelfMessage = '',
  goal = EMPTY_GOAL,
  persisted = DEFAULT_STATE,
  onPatch = () => {},
}: {
  themeKey?: ThemeKey;
  intensityKey?: IntensityKey;
  futureSelfMessage?: string;
  goal?: GoalData;
  persisted?: PersistedState;
  onPatch?: (partial: Partial<PersistedState>) => void;
}) {
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [block, setBlock] = useState<Block>(null);
  const [grantMinutes, setGrantMinutes] = useState(5);
  const [grantExpiresAt, setGrantExpiresAt] = useState<number | null>(null);
  const [grantIsEmergency, setGrantIsEmergency] = useState(false);
  const [activeThemeKey, setActiveThemeKey] = useState<ThemeKey>(themeKey);
  const [timerPreset, setTimerPreset] = useState<TimerPreset>({ minutes: 25, label: 'Focus Timer', autoStart: false });
  // Once verified this session, Settings stays unlocked until the app is reloaded.
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);

  const [hoursReclaimed, setHoursReclaimed] = useState(persisted.hoursReclaimed);
  const [reclaimedToday, setReclaimedToday] = useState(persisted.reclaimedToday);
  const [unlockNumber, setUnlockNumber] = useState(persisted.unlockNumber);
  const [futureSelf, setFutureSelf] = useState(futureSelfMessage);
  const [accountName, setAccountName] = useState('');
  const [guardian, setGuardian] = useState(persisted.guardian);
  const [pin, setPin] = useState(persisted.pin);
  const dayNumber = persisted.dayNumber;

  useEffect(() => {
    onPatch({ hoursReclaimed, reclaimedToday, unlockNumber });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoursReclaimed, reclaimedToday, unlockNumber]);

  useEffect(() => {
    onPatch({ themeKey: activeThemeKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThemeKey]);

  const theme = getTheme(activeThemeKey);
  const intensity = getIntensity(intensityKey);
  const ladderActive = unlockNumber >= intensity.ladderStartsAt;

  // The block flow is a full-screen takeover, exactly as the real shield would be.
  if (block === 'shield') {
    return (
      <ShieldScreen
        theme={theme}
        goal={goal}
        unlockNumber={unlockNumber}
        ladderActive={ladderActive}
        onNotNow={() => {
          // Closing without unlocking is what actually credits the world.
          setHoursReclaimed((h) => h + 0.05);
          setReclaimedToday((m) => m + 3);
          setBlock(null);
        }}
        onNeedIt={() => setBlock(ladderActive ? 'gate' : 'grant')}
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
        unlockNumber={unlockNumber}
        intensity={intensity}
        futureSelfMessage={futureSelf}
        goalLine={goal.line}
        onGranted={(m) => {
          setGrantMinutes(m);
          setGrantIsEmergency(false);
          setGrantExpiresAt(Date.now() + m * 60000);
          setUnlockNumber((n) => n + 1);
          setBlock('grant');
        }}
        onAbandoned={() => {
          setUnlockNumber((n) => n + 1);
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
        onDone={() => {
          setBlock(null);
          setGrantExpiresAt(null);
        }}
        onMinimize={() => setBlock(null)}
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
          onOpenFutureSelf={() => setOverlay('futureSelf')}
          pinEnabled={!!pin}
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
    if (overlay === 'schedules') return <ScheduleEditorScreen onBack={() => setOverlay('settings')} />;
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
    if (overlay === 'milestones') return <MilestonesScreen onBack={() => setOverlay('profile')} />;
    if (overlay === 'essentials') return <EssentialsScreen onBack={() => setOverlay(null)} />;
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
                setTimerPreset({ minutes: 25, label: 'Focus Timer', autoStart: true });
                setTab('timer');
              }}
              onStartRest={() => {
                setTimerPreset({ minutes: 10, label: 'Rest Timer', autoStart: true });
                setTab('timer');
              }}
              onOpenSleepSchedule={() => setOverlay('schedules')}
              unlockNumber={unlockNumber}
            />
          )}
          {tab === 'apps' && <MyAppsScreen />}
          {tab === 'together' && (
            <TogetherScreen
              guardian={guardian}
              hoursReclaimed={hoursReclaimed}
              onOpenGuardian={() => setOverlay('guardian')}
              onInvite={() => setOverlay('guardian')}
            />
          )}
          {tab === 'reflect' && <ReflectionScreen />}
          {tab === 'timer' && (
            <TimerScreen
              key={`${timerPreset.minutes}-${timerPreset.label}`}
              initialMinutes={timerPreset.minutes}
              label={timerPreset.label}
              autoStart={timerPreset.autoStart}
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
                  onPress={() => setTab(t.key)}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                >
                  <Text style={[styles.tabGlyph, active && styles.tabGlyphActive]}>{t.glyph}</Text>
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
          onExpire={() => setGrantExpiresAt(null)}
          onPress={() => setBlock(grantIsEmergency ? 'emergency' : 'grant')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: { position: 'absolute', left: 0, right: 0, bottom: 26, alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(32,32,32,0.95)',
    borderRadius: 32,
    padding: 5,
    gap: 2,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 26,
  },
  tabItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabGlyph: { color: colors.textDim, fontSize: 14 },
  tabGlyphActive: { color: colors.text },
  tabLabel: { color: colors.textDim, fontSize: 12.5, fontWeight: '600' },
  tabLabelActive: { color: colors.text },
});
