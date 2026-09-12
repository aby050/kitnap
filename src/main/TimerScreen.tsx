import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button, Card, Divider, Editorial, IconButton, Pill, Ring, Row, Screen } from '../design/primitives';
import Icon, { IconName } from '../ui/Icon';
import AppGlyph from '../ui/AppGlyph';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import BlockedAppsPill from '../components/BlockedAppsPill';
import BlockedListSheet from '../components/BlockedListSheet';
import BlockedSelection from '../components/BlockedSelection';
import EmergencyDialer from '../components/EmergencyDialer';
import { ESSENTIALS, EssentialKey } from '../data/gateQuestions';
import { hasBlockedSelection } from '../data/iosScreenTime';
import { FocusSession } from '../data/store';
import { fonts, gradients, motion, palette, radius, space, type } from '../design/tokens';
import Toggle from '../design/Toggle';

const { width } = Dimensions.get('window');

// Duration bounds — adjusted in 15-minute steps by the ± controls.
const SLIDER_MIN = 5;
const SLIDER_MAX = 720;
const SLIDER_STEP = 15;

// Slide-to-start geometry.
const SLIDE_BTN = 54;
const SLIDE_TRACK_H = 62;
const SLIDE_PAD = 4;

/** Small square tile for a per-feature toggle inside the block sheet — a
 *  semantic icon, never a fake brand mark. */
function FeatureTile({ name }: { name: IconName }) {
  return (
    <View style={styles.featureTile}>
      <Icon name={name} size={16} color={palette.textSecondary} strokeWidth={1.6} />
    </View>
  );
}


export default function TimerScreen({
  initialMinutes = 30,
  essentials,
  session = null,
  onStartSession,
  onEndSession,
  hardMode = false,
  label = 'Timer',
  motivationLine,
  onFocusComplete,
  onOpenEssentials,
  onOpenShield,
  onEmergency,
  tokenBalance = 0,
  onSpendTokenToCancel,
  onOpenTokenInfo,
  blockedPackages = [],
  onUpdateBlockedPackages,
}: {
  initialMinutes?: number;
  /** The live session, owned by MainApp and persisted. Held here as an end
   *  timestamp rather than a countdown so navigating away — or force-quitting
   *  — can't wipe it. */
  /** Which essential categories the user left switched on. */
  essentials?: Record<EssentialKey, boolean>;
  session?: FocusSession | null;
  onStartSession?: (minutes: number, label: string, hardMode: boolean) => void;
  onEndSession?: () => void;
  /** Hard mode: the session cannot be ended with a Bailout. Emergency access stays. */
  hardMode?: boolean;
  label?: string;
  onOpenEssentials?: () => void;
  onOpenShield?: () => void;
  /** Break-glass. Must be the SAME handler the Shield and the Gate use —
   *  see the Emergency button below. */
  onEmergency?: () => void;
  motivationLine?: string;
  onFocusComplete?: (minutes: number) => void;
  tokenBalance?: number;
  onSpendTokenToCancel?: () => void;
  /** Opens the "what are emergency tokens" explainer + store screen. */
  onOpenTokenInfo?: () => void;
  blockedPackages?: string[];
  onUpdateBlockedPackages?: (packages: string[]) => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAppSelectModal, setShowAppSelectModal] = useState(false);
  const [showPickPrompt, setShowPickPrompt] = useState(false);
  // Mid-session the timer is the point; the controls around it are not. Tapping
  // anywhere reveals them and they fade back out, so a locked screen stays calm
  // without hiding the way out.
  const [chromeVisible, setChromeVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Category toggle states (mirrored into the parent's blockedPackages on start).
  const [ytBlocked, setYtBlocked] = useState(true);
  const [ytShorts, setYtShorts] = useState(false);
  const [ytHomepage, setYtHomepage] = useState(false);
  const [ytChannels, setYtChannels] = useState(false);

  const [browserBlocked, setBrowserBlocked] = useState(true);
  const [browserAdult, setBrowserAdult] = useState(false);
  const [browserDistracting, setBrowserDistracting] = useState(false);

  const [distractingAppsState, setDistractingAppsState] = useState<Record<string, boolean>>({});
  const [distractingCollapsed, setDistractingCollapsed] = useState(false);

  const syncModalStateFromProps = useCallback(() => {
    if (blockedPackages) {
      const state: Record<string, boolean> = {};
      const isYtBlocked = blockedPackages.includes('com.google.android.youtube');
      setYtBlocked(isYtBlocked);

      DEFAULT_BLOCKED_APPS.forEach((app) => {
        if (app.packageName !== 'com.google.android.youtube') {
          state[app.packageName] = blockedPackages.includes(app.packageName);
        }
      });
      setDistractingAppsState(state);
    }
  }, [blockedPackages]);

  useEffect(() => {
    if (showAppSelectModal) syncModalStateFromProps();
  }, [showAppSelectModal, syncModalStateFromProps]);

  // ── Timer state ──
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  // Locked-session sheets: the icon grid, and the per-app unlock confirm.
  const [showLockedApps, setShowLockedApps] = useState(false);
  const [showEssentials, setShowEssentials] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{ name: string; packageName: string } | null>(null);
  const secsLeft = (sn: FocusSession | null) =>
    sn ? Math.max(0, Math.ceil((sn.endsAt - Date.now()) / 1000)) : 0;
  const [remaining, setRemaining] = useState(() => secsLeft(session));
  const running = !!session && remaining > 0;
  const prevRemaining = useRef(remaining);

  // Recomputed from the clock every tick rather than decremented, so a session
  // stays correct across backgrounding, where timers stop firing.
  useEffect(() => {
    setRemaining(secsLeft(session));
    if (!session) return;
    const id = setInterval(() => setRemaining(secsLeft(session)), 1000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (session && remaining <= 0) onEndSession?.();
  }, [session, remaining, onEndSession]);

  // Completion callback — rest sessions don't award focus credit.
  useEffect(() => {
    if (prevRemaining.current > 0 && remaining === 0) {
      const isRest = /rest/i.test(label);
      if (!isRest) onFocusComplete?.(selectedMinutes);
    }
    prevRemaining.current = remaining;
  }, [remaining, selectedMinutes, label, onFocusComplete]);

  // ── Time display ──
  const totalSec = running || remaining > 0 ? remaining : selectedMinutes * 60;
  const dispH = Math.floor(totalSec / 3600);
  const dispM = Math.floor((totalSec % 3600) / 60);
  const dispS = totalSec % 60;
  const showHours = selectedMinutes >= 60 || dispH > 0;
  const lcdLeft = showHours ? String(dispH).padStart(2, '0') : String(dispM).padStart(2, '0');
  const lcdRight = showHours ? String(dispM).padStart(2, '0') : String(dispS).padStart(2, '0');
  const progress =
    (running || remaining > 0) && selectedMinutes > 0
      ? Math.max(0, Math.min(1, remaining / (selectedMinutes * 60)))
      : 0;

  const handleStep = (dir: number) => {
    if (running) return;
    const next = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, selectedMinutes + dir * SLIDER_STEP));
    setSelectedMinutes(next);
  };

  // ── Slide-to-start gesture ──
  const maxSlideX = width - space.gutter * 2 - SLIDE_BTN - SLIDE_PAD * 2;
  const slideX = useSharedValue(0);
  /** 1 while a finger is on the thumb — drives the live "current" pulse, so the
   *  track only crackles while it is actually being charged. */
  const charging = useSharedValue(0);
  const pulse = useSharedValue(0);
  /** Last charge notch that fired a tick, so each one only fires once. */
  const lastNotch = useRef(-1);

  // Twelve notches across the track. Ticking on each one — light at the start,
  // firmer past the commit point — reads in the hand like something filling up
  // rather than a single click at the end.
  const chargeTick = useCallback((notch: number, committed: boolean) => {
    if (notch === lastNotch.current) return;
    const rising = notch > lastNotch.current;
    lastNotch.current = notch;
    if (!rising) return;
    Haptics.impactAsync(
      committed ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
  }, []);

  const resetNotch = useCallback(() => {
    lastNotch.current = -1;
  }, []);

  const chargeDone = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);

  const triggerStart = useCallback(() => {
    onStartSession?.(selectedMinutes, label, hardMode);
  }, [onStartSession, selectedMinutes, label, hardMode]);

  useEffect(() => {
    if (running) {
      const t = setTimeout(() => {
        slideX.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      }, 400);
      return () => clearTimeout(t);
    }
    // Idle: park it at the start. Left at the far end after a completed slide,
    // the control looked live but had nowhere left to travel.
    slideX.value = 0;
  }, [running, slideX]);

  // Rendered outside the running/idle split: the slider that opens it lives in
  // the idle tree, and the sheet used to be defined only in the running one.
  const pickPrompt = (
    <Modal
      visible={showPickPrompt}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPickPrompt(false)}
    >
      <View style={styles.lockedSheetScrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowPickPrompt(false)}
          accessibilityLabel="Dismiss"
        />
        <View style={styles.lockedSheet}>
          <View style={styles.lockedSheetHandle} />
          <Text style={styles.lockedSheetTitle}>Nothing to block yet</Text>
          <Text style={styles.lockedSheetSub}>
            Pick the apps this block should cover — a session with nothing selected holds nothing
            back.
          </Text>
          <BlockedSelection onChanged={() => setShowPickPrompt(false)} />
        </View>
      </View>
    </Modal>
  );


  // On iOS the app-select sheet below is meaningless: it lists Android package
  // names, its search can never match (iOS gives no installed-app list), and
  // what actually gets blocked is Apple's own picker selection. So the slide
  // starts the session directly there, which is also why it looked stuck —
  // the sheet opened onto a list that could do nothing.
  const handleSlideComplete = () => {
    if (Platform.OS === 'ios') {
      // Starting with an empty selection blocks nothing at all, and used to do
      // so silently — send them to the picker instead of running a timer that
      // enforces nothing.
      if (!hasBlockedSelection()) {
        setShowPickPrompt(true);
        return;
      }
      triggerStart();
      return;
    }
    setShowAppSelectModal(true);
  };

  const handleCancelStart = () => {
    setShowAppSelectModal(false);
    slideX.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
  };

  const handleConfirmAndStart = () => {
    const nextPackages: string[] = [];
    if (ytBlocked) nextPackages.push('com.google.android.youtube');
    Object.keys(distractingAppsState).forEach((pkg) => {
      if (distractingAppsState[pkg]) nextPackages.push(pkg);
    });
    onUpdateBlockedPackages?.(nextPackages);
    setShowAppSelectModal(false);
    triggerStart();
  };

  const slideTap = Gesture.Tap().onEnd((_e, ok) => {
    'worklet';
    if (!ok) return;
    slideX.value = withTiming(maxSlideX, { duration: 220, easing: Easing.out(Easing.cubic) });
    runOnJS(chargeDone)();
    runOnJS(handleSlideComplete)();
  });

  const slidePan = Gesture.Pan()
    // The slider lives inside a vertical ScrollView, which was winning the
    // gesture race: a drag that wasn't perfectly horizontal became a scroll,
    // so the thumb buzzed on touch and then went nowhere.
    .activeOffsetX([-12, 12])
    .failOffsetY([-18, 18])
    .onBegin(() => {
      'worklet';
      charging.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((e) => {
      'worklet';
      slideX.value = Math.max(0, Math.min(e.translationX, maxSlideX));
      const t = maxSlideX > 0 ? slideX.value / maxSlideX : 0;
      runOnJS(chargeTick)(Math.floor(t * 12), t > 0.65);
    })
    .onEnd((e) => {
      'worklet';
      // No spring: releasing halfway used to bounce, which felt like the
      // control fighting the user. It now glides to whichever end it committed
      // to, at a speed that reads as deliberate.
      // Half the track, or a decisive flick. Two-thirds meant an ordinary
      // confident swipe still snapped back.
      if (slideX.value > maxSlideX * 0.5 || e.velocityX > 900) {
        slideX.value = withTiming(maxSlideX, { duration: 180, easing: Easing.out(Easing.cubic) });
        runOnJS(chargeDone)();
        runOnJS(handleSlideComplete)();
      } else {
        slideX.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      }
      charging.value = withTiming(0, { duration: 260 });
      runOnJS(resetNotch)();
    });

  // Pan wins when there's real movement; the tap covers everything else.
  const slideGesture = Gesture.Exclusive(slidePan, slideTap);

  const slideAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  // The track charges up behind the thumb: the further you push, the brighter
  // and more saturated the trail, so the gesture feels like it is building
  // something rather than just dragging a handle across.
  const slideFillStyle = useAnimatedStyle(() => ({
    width: slideX.value + SLIDE_BTN + SLIDE_PAD * 2,
  }));
  const slideGlowStyle = useAnimatedStyle(() => {
    const t = maxSlideX > 0 ? slideX.value / maxSlideX : 0;
    const flicker = 0.7 + pulse.value * 0.3 * charging.value;
    return {
      opacity: t * 0.85 * flicker,
      transform: [{ translateX: slideX.value }, { scale: 0.8 + t * 0.5 }],
    };
  });
  const slideLabelStyle = useAnimatedStyle(() => {
    const t = maxSlideX > 0 ? slideX.value / maxSlideX : 0;
    return { opacity: Math.max(0, 1 - t * 2.2) };
  });

  // ─────────────────────────────────────────────────────────────
  // Locked full-screen mode — running can't be paused or backed out
  // of for free. The only exit is Bailout, which is confirmed explicitly.
  // ─────────────────────────────────────────────────────────────
  if (running) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Pressable
          style={styles.lockedRoot}
          onPress={() => setChromeVisible((v) => !v)}
          accessibilityLabel={chromeVisible ? 'Hide controls' : 'Show controls'}
        >

          {/* Shield on the left, Emergency alone on the right. They answer
              opposite questions — "what is being held" versus "let me out
              right now" — and sat side by side in the same corner, which read
              as one control group and put a calm informational button
              immediately next to the red one. */}
          <View style={[styles.cornerLeft, !chromeVisible && styles.chromeHidden]} pointerEvents={chromeVisible ? 'auto' : 'none'}>
            <IconButton
              name="shield"
              onPress={() => setShowLockedApps(true)}
              bordered
              accessibilityLabel="What's locked"
            />
          </View>

          <View style={[styles.cornerRight, !chromeVisible && styles.chromeHidden]} pointerEvents={chromeVisible ? 'auto' : 'none'}>
            {/* Straight to the dialer. Deliberately does not place a call —
                the user types the number, so the app can never dial emergency
                services by accident. */}
            {/* Break-glass, not a list.
                This used to open the local essentials sheet and nothing else:
                it showed the always-allowed categories and a dialer, but never
                lifted the block — while the identical red button on the Shield
                and the Gate ran `openEmergencyAccess`, which checks the
                lockdown window and the daily use, then actually unblocks for
                five minutes. So the one screen where the user is most locked
                in was the one where Emergency did least.
                It now calls the same handler as everywhere else; the
                essentials sheet stays reachable from inside the grant. */}
            <Pill
              label="Emergency"
              icon="phone"
              tone="danger"
              onPress={() => (onEmergency ? onEmergency() : setShowEssentials(true))}
            />
          </View>

          <View style={styles.lockedBody}>
            <Text style={[type.overline, styles.lockedLabel]}>{label}</Text>
            <Ring progress={progress} size={288} thickness={4}>
              <Text style={styles.bigTime}>
                {lcdLeft}
                <Text style={styles.colon}>:</Text>
                {lcdRight}
              </Text>
              <Text style={[type.unit, styles.unitLine]}>{showHours ? 'hours · minutes' : 'minutes · seconds'}</Text>
            </Ring>
            {motivationLine ? <Text style={[type.callout, styles.lockedMotivation]}>{motivationLine}</Text> : null}

            {/* What's being held back, as real icons — tap for the full list. */}
            {Platform.OS === 'ios' && (
              <Pressable
                onPress={() => setShowLockedApps(true)}
                style={[styles.lockedIcons, !chromeVisible && styles.chromeHidden]}
                pointerEvents={chromeVisible ? 'auto' : 'none'}
                accessibilityLabel="Blocked apps"
              >
                <BlockedSelection compact />
              </Pressable>
            )}
          </View>

          {/* A close button, not a "Bailout" button. Naming the currency up
              front advertises the way out; this asks to leave first and only
              then says what leaving costs.
              Bottom centre rather than the top-left corner: it is the one
              deliberate action on a screen whose whole point is that there is
              no casual way out, so it belongs under the thumb and below the
              timer — not sharing the top rail with Emergency, where it read as
              a dismiss affordance for the screen itself. Hard mode has no
              paid exit at all, so it simply has no button. */}
          {!hardMode && (
            <View
              style={[styles.cornerBottom, !chromeVisible && styles.chromeHidden]}
              pointerEvents={chromeVisible ? 'auto' : 'none'}
            >
              <UnlockControl onReveal={() => setShowCancelConfirm(true)} />
            </View>
          )}
        </Pressable>


        {pickPrompt}

        {Platform.OS === 'ios' && (
          <BlockedListSheet
            visible={showLockedApps}
            running
            onClose={() => setShowLockedApps(false)}
          />
        )}

        <EssentialsSheet
          visible={showEssentials}
          enabled={essentials}
          onClose={() => setShowEssentials(false)}
        />

        <LockedAppsSheet
          visible={showLockedApps && Platform.OS !== 'ios'}
          packages={blockedPackages}
          onClose={() => setShowLockedApps(false)}
          onPick={(app) => {
            setShowLockedApps(false);
            setUnlockTarget(app);
          }}
        />

        <UnlockAppConfirm
          app={unlockTarget}
          tokenBalance={tokenBalance}
          hardMode={hardMode}
          onClose={() => setUnlockTarget(null)}
          onSpend={() => {
            if (tokenBalance <= 0) return;
            setUnlockTarget(null);
            onEndSession?.();
            onSpendTokenToCancel?.();
          }}
          onOpenTokenInfo={onOpenTokenInfo}
        />

        <CancelConfirm
          visible={showCancelConfirm}
          remainingLabel={`${lcdLeft}:${lcdRight}`}
          remainingUnits={showHours ? 'hours · minutes' : 'minutes · seconds'}
          tokenBalance={tokenBalance}
          onClose={() => setShowCancelConfirm(false)}
          onSpend={() => {
            if (tokenBalance <= 0) return;
            setShowCancelConfirm(false);
            onEndSession?.();
            onSpendTokenToCancel?.();
          }}
          onOpenTokenInfo={
            onOpenTokenInfo
              ? () => {
                  setShowCancelConfirm(false);
                  onOpenTokenInfo();
                }
              : undefined
          }
        />
      </Screen>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Idle / setup mode
  // ─────────────────────────────────────────────────────────────
  return (
    <Screen edges={['top']} bloom>
      {/* Scrollable: the body sizes itself to the viewport via the flex spacer
          below, but on shorter screens (or once the access cards are present)
          it overflows, and a plain View left everything past the fold
          unreachable. flexGrow rather than flex on the content container so
          the spacer still distributes slack when there is room to spare. */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Text style={styles.sessionLabel}>{label.toUpperCase()}</Text>
        </View>
        <Animated.View entering={FadeInDown.duration(motion.transition)}>
          <Editorial
            lead="Set the length,"
            emphasis="then commit to it."
            style={styles.voice}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(motion.transition)} style={styles.hero}>
          <Ring progress={progress} size={272} thickness={4}>
            <Text style={[type.overline, styles.heroCap]}>Session length</Text>
            <Text style={styles.bigTime}>
              {lcdLeft}
              <Text style={styles.colon}>:</Text>
              {lcdRight}
            </Text>
            <Text style={[type.unit, styles.unitLine]}>{showHours ? 'hours · minutes' : 'minutes' }</Text>
          </Ring>

          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => handleStep(-1)} hitSlop={8}>
              <Icon name="minus" size={20} color={palette.text} />
            </Pressable>
            <Text style={[type.caption, styles.stepHint]}>15-min steps</Text>
            <Pressable style={styles.stepBtn} onPress={() => handleStep(1)} hitSlop={8}>
              <Icon name="plus" size={20} color={palette.text} />
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.spacer} />

        {/* Slide to start */}
        <GestureDetector gesture={slideGesture}>
        <View style={styles.slideTrack}>
          {/* Charge trail: dim at the start, blazing at the thumb. */}
          <Animated.View style={[styles.slideFill, slideFillStyle]} pointerEvents="none">
            <LinearGradient
              colors={[
                'rgba(71,107,235,0.04)',
                'rgba(71,107,235,0.22)',
                'rgba(71,107,235,0.55)',
                'rgba(150,255,205,0.95)',
              ]}
              locations={[0, 0.45, 0.82, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View style={[styles.slideGlow, slideGlowStyle]} pointerEvents="none" />
          <Animated.Text style={[styles.slideLabel, slideLabelStyle]}>Slide to start</Animated.Text>
          <Animated.View style={[styles.slideThumb, slideAnimStyle]}>
            <Icon name="chevronRight" size={22} color={palette.textInverse} strokeWidth={2.2} />
          </Animated.View>
        </View>
        </GestureDetector>

        {/* Right under the start control: what this session will hold back. */}
        <BlockedAppsPill style={styles.blockedPill} />

        {onOpenEssentials && (
          <Card onPress={onOpenEssentials} style={styles.accessCard}>
            <View style={styles.accessRow}>
              <View style={styles.accessIcon}>
                <Icon name="shield" size={18} color={palette.accent} strokeWidth={1.7} />
              </View>
              <View style={styles.shrink}>
                <Text style={type.bodyStrong}>Essentials & emergency access</Text>
                <Text style={[type.sub, styles.accessSub]}>Never blocked. Never charged.</Text>
              </View>
              <Icon name="chevronRight" size={18} color={palette.textQuaternary} />
            </View>
          </Card>
        )}

        {onOpenTokenInfo && (
          <Card onPress={onOpenTokenInfo} style={styles.accessCardTight}>
            <View style={styles.accessRow}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>{tokenBalance}</Text>
              </View>
              <View style={styles.shrink}>
                <Text style={type.bodyStrong}>Bailouts</Text>
                <Text style={[type.sub, styles.accessSub]}>Use one to leave a locked timer early.</Text>
              </View>
              <Icon name="chevronRight" size={18} color={palette.textQuaternary} />
            </View>
          </Card>
        )}

        {/* Same door as on Home. A locked timer is exactly when someone
            reaches for a blocked app, so the way through belongs here too. */}
        {onOpenShield && (
          <Card tone="accent" onPress={onOpenShield} style={styles.accessCardTight}>
            <View style={styles.accessRow}>
              <View style={styles.shrink}>
                <Text style={type.bodyStrong}>Open a blocked app</Text>
                <Text style={[type.sub, styles.accessSub]}>Earn your way in, or spend a Bailout.</Text>
              </View>
              <Icon name="chevronRight" size={18} color={palette.textQuaternary} />
            </View>
          </Card>
        )}
      </ScrollView>

      {pickPrompt}

      {/* Select-apps sheet */}
      {showAppSelectModal &&
        (() => {
          const distractingAppsList = DEFAULT_BLOCKED_APPS.filter(
            (app) => app.packageName !== 'com.google.android.youtube',
          );
          const filteredDistractingApps = distractingAppsList.filter((app) =>
            app.name.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          const isAnyDistractingChecked = distractingAppsList.some((app) => distractingAppsState[app.packageName]);

          const handleToggleDistractingMaster = (val: boolean) => {
            const nextState: Record<string, boolean> = {};
            distractingAppsList.forEach((app) => {
              nextState[app.packageName] = val;
            });
            setDistractingAppsState(nextState);
          };

          const q = searchQuery.toLowerCase();

          return (
            <Modal visible transparent animationType="slide" onRequestClose={handleCancelStart}>
              <KeyboardAvoider style={styles.modalOverlay}>
                <SafeAreaView style={styles.modalSheet} edges={['bottom']}>
                  <View style={styles.grabber} />
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={type.title2}>Block during this session</Text>
                      <Text style={[type.sub, styles.modalHeaderSub]}>What stays out of reach until the timer ends.</Text>
                    </View>
                    <IconButton name="close" onPress={handleCancelStart} color={palette.textSecondary} bordered accessibilityLabel="Close" />
                  </View>

                  <View style={styles.searchBar}>
                    <Icon name="search" size={16} color={palette.textTertiary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search apps"
                      placeholderTextColor={palette.textTertiary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      clearButtonMode="while-editing"
                    />
                  </View>

                  <ScrollView
                    {...keyboardScrollProps}
                    style={styles.modalScroll}
                    contentContainerStyle={styles.modalScrollBody}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* YouTube */}
                    {('youtube'.includes(q) || q === '') && (
                      <View style={styles.groupCard}>
                        <View style={styles.groupHeadRow}>
                          <AppGlyph name="YouTube" packageName="com.google.android.youtube" size={40} />
                          <View style={styles.groupHeadText}>
                            <Text style={type.bodyStrong}>YouTube</Text>
                            <Text style={[type.sub, styles.accessSub]}>Blocked completely</Text>
                          </View>
                          <Toggle value={ytBlocked} onValueChange={setYtBlocked} />
                        </View>
                        <Divider inset={0} />
                        <View style={styles.subList}>
                          {[
                            { icon: 'play' as IconName, label: 'Block Shorts', value: ytShorts, set: setYtShorts },
                            { icon: 'home' as IconName, label: 'Block homepage', value: ytHomepage, set: setYtHomepage },
                            { icon: 'list' as IconName, label: 'Block distracting channels', value: ytChannels, set: setYtChannels },
                          ].map((o) => (
                            <View key={o.label} style={styles.subRow}>
                              <FeatureTile name={o.icon} />
                              <Text style={styles.subLabel}>{o.label}</Text>
                              <Toggle value={o.value} onValueChange={o.set} />
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Browsers */}
                    {('browser chrome internet'.includes(q) || q === '') && (
                      <View style={styles.groupCard}>
                        <View style={styles.groupHeadRow}>
                          <View style={styles.browserTile}>
                            <Icon name="globe" size={22} color={palette.textSecondary} strokeWidth={1.6} />
                          </View>
                          <View style={styles.groupHeadText}>
                            <Text style={type.bodyStrong}>Browser apps</Text>
                            <Text style={[type.sub, styles.accessSub]}>Blocked completely</Text>
                          </View>
                          <Toggle value={browserBlocked} onValueChange={setBrowserBlocked} />
                        </View>
                        <Divider inset={0} />
                        <View style={styles.subList}>
                          {[
                            { icon: 'eyeOff' as IconName, label: 'Block adult content', value: browserAdult, set: setBrowserAdult },
                            { icon: 'globe' as IconName, label: 'Block distracting sites', value: browserDistracting, set: setBrowserDistracting },
                          ].map((o) => (
                            <View key={o.label} style={styles.subRow}>
                              <FeatureTile name={o.icon} />
                              <Text style={styles.subLabel}>{o.label}</Text>
                              <Toggle value={o.value} onValueChange={o.set} />
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Distracting apps */}
                    {filteredDistractingApps.length > 0 && (
                      <View style={styles.groupCard}>
                        <View style={styles.categoryHead}>
                          <Pressable
                            onPress={() => setDistractingCollapsed(!distractingCollapsed)}
                            style={styles.collapseToggle}
                            hitSlop={6}
                          >
                            <Icon name={distractingCollapsed ? 'chevronRight' : 'chevronDown'} size={18} color={palette.textTertiary} />
                            <Text style={type.bodyStrong}>Distracting apps</Text>
                          </Pressable>
                          <Toggle
                            value={isAnyDistractingChecked}
                            onValueChange={handleToggleDistractingMaster}
                          />
                        </View>
                        {!distractingCollapsed && (
                          <>
                            <Divider inset={0} />
                            <View style={styles.subList}>
                              {filteredDistractingApps.map((app) => (
                                <View key={app.packageName} style={styles.appRow}>
                                  <AppGlyph name={app.name} packageName={app.packageName} size={34} />
                                  <Text style={styles.appLabel}>{app.name}</Text>
                                  <Toggle
                                    value={!!distractingAppsState[app.packageName]}
                                    onValueChange={(val) =>
                                      setDistractingAppsState((prev) => ({ ...prev, [app.packageName]: val }))
                                    }
                                  />
                                </View>
                              ))}
                            </View>
                          </>
                        )}
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.modalCta}>
                    <Button label="Start focus" icon="shield" variant="accent" onPress={handleConfirmAndStart} />
                  </View>
                </SafeAreaView>
              </KeyboardAvoider>
            </Modal>
          );
        })()}
    </Screen>
  );
}

/** End-session-early confirm. A Bailout is the only way out of a locked timer. */
/** The break-glass list, and only what the user left switched on. Kept to a
 *  handful of categories on purpose: an essentials list long enough to browse
 *  is just another feed. */
function EssentialsSheet({
  visible,
  enabled,
  onClose,
}: {
  visible: boolean;
  enabled?: Record<EssentialKey, boolean>;
  onClose: () => void;
}) {
  const live = ESSENTIALS.filter((e) => enabled?.[e.key]);
  const [dialerOpen, setDialerOpen] = useState(false);
  return (
    <>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lockedSheetScrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.lockedSheet}>
          <View style={styles.lockedSheetHandle} />
          <Text style={styles.lockedSheetTitle}>Emergency</Text>
          <Text style={styles.lockedSheetSub}>
            {live.length === 0
              ? 'You have switched every essential off. Turn some back on in Settings → Essentials.'
              : 'Always available. Never counted, never charged.'}
          </Text>
          {live.map((e, i) => (
            <View key={e.key}>
              {i > 0 && <Divider inset={54} />}
              <Row
                icon={e.mark}
                iconColor={palette.accent}
                title={e.name}
                subtitle={e.note}
                onPress={
                  // `tel:` with no number is a no-op on iOS, so Call opens our
                  // own keypad and dials from there instead of dead-ending.
                  e.key === 'call'
                    ? () => {
                        onClose();
                        // Straight into the real Phone app. Android takes
                        // `tel:` with no number; on iOS `mobilephone:` is the
                        // scheme the Phone app registers — it is undocumented,
                        // so if the OS refuses it we fall back to our own
                        // keypad rather than leaving the button dead.
                        if (Platform.OS === 'android') {
                          Linking.openURL('tel:').catch(() => {});
                          return;
                        }
                        Linking.openURL('mobilephone:').catch(() => {
                          setTimeout(() => setDialerOpen(true), 200);
                        });
                      }
                    : e.url
                      ? () => {
                          onClose();
                          Linking.openURL(e.url as string).catch(() => {});
                        }
                      : undefined
                }
              />
            </View>
          ))}
        </View>
      </View>
    </Modal>
    {/* Sibling, not nested: a Modal inside a Modal doesn't reliably present
        on iOS. */}
    <EmergencyDialer
      visible={dialerOpen}
      onClose={() => {
        setDialerOpen(false);
        onClose();
      }}
    />
    </>
  );
}

/** What's locked right now, as icons. A glance, not a settings screen — the
 *  full blocked-apps editor is deliberately unreachable mid-session, since
 *  editing the list would be a way around the block. */
function LockedAppsSheet({
  visible,
  packages,
  onClose,
  onPick,
}: {
  visible: boolean;
  packages: string[];
  onClose: () => void;
  onPick: (app: { name: string; packageName: string }) => void;
}) {
  const apps = packages.map((pkg) => ({
    packageName: pkg,
    name: DEFAULT_BLOCKED_APPS.find((a) => a.packageName === pkg)?.name ?? pkg,
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lockedSheetScrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={styles.lockedSheet}>
          <View style={styles.lockedSheetHandle} />
          <Text style={styles.lockedSheetTitle}>Locked right now</Text>
          {Platform.OS === 'ios' ? (
            // The real selection, drawn by iOS. There is no per-app unlock on
            // iOS — the shield covers the whole selection — so these are shown
            // rather than offered as buttons.
            <>
              <Text style={styles.lockedSheetSub}>
                Chosen in Apple's picker. Unlocking lifts the whole block, not one app.
              </Text>
              <BlockedSelection compact />
            </>
          ) : (
            <>
              <Text style={styles.lockedSheetSub}>
                {apps.length === 0
                  ? 'Nothing is on your blocked list yet.'
                  : 'Tap one if you need it back before the timer ends.'}
              </Text>
              <View style={styles.lockedGrid}>
                {apps.map((app) => (
                  <Pressable key={app.packageName} style={styles.lockedGridItem} onPress={() => onPick(app)}>
                    <AppGlyph name={app.name} packageName={app.packageName} size={54} />
                    <Text style={styles.lockedGridLabel} numberOfLines={1}>{app.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Unlocking one app ends the whole session — there is no per-app escape, and
 *  it costs a Bailout either way. Saying so plainly beats letting someone tap
 *  through expecting a partial unlock. */
function UnlockAppConfirm({
  app,
  tokenBalance,
  hardMode,
  onClose,
  onSpend,
  onOpenTokenInfo,
}: {
  app: { name: string; packageName: string } | null;
  tokenBalance: number;
  hardMode: boolean;
  onClose: () => void;
  onSpend: () => void;
  onOpenTokenInfo?: () => void;
}) {
  if (!app) return null;
  const noun = tokenBalance === 1 ? 'Bailout' : 'Bailouts';
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmOverlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
          <View style={styles.unlockGlyphWrap}>
            <AppGlyph name={app.name} packageName={app.packageName} size={56} />
          </View>
          <Text style={styles.confirmTitle}>Unlock {app.name}?</Text>
          <Text style={styles.confirmBody}>
            {hardMode
              ? 'This session was started in hard mode. A Bailout will not end it — it runs to the end.'
              : (
                  <>
                    This ends the whole session, not just this app, and costs{' '}
                    <Text style={styles.confirmAccent}>1 Bailout</Text>.{'\n'}You have {tokenBalance} {noun}.
                  </>
                )}
          </Text>
          {!hardMode && (
            <Button
              label={tokenBalance <= 0 ? 'No Bailouts left' : `Use 1 Bailout and unlock`}
              variant="danger"
              disabled={tokenBalance <= 0}
              onPress={onSpend}
            />
          )}
          <Button label="Keep going" variant="ghost" onPress={onClose} />
          {onOpenTokenInfo && tokenBalance <= 0 && (
            <Pressable onPress={onOpenTokenInfo} hitSlop={8}>
              <Text style={styles.confirmInfoLink}>What is a Bailout?</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Two ways out and no third: wait, or spend. Leading with the time left makes
 *  waiting the obvious default rather than burying it under the paid option. */
function CancelConfirm({
  visible,
  remainingLabel,
  remainingUnits,
  tokenBalance,
  onClose,
  onSpend,
  onOpenTokenInfo,
}: {
  visible: boolean;
  remainingLabel?: string;
  remainingUnits?: string;
  tokenBalance: number;
  onClose: () => void;
  onSpend: () => void;
  onOpenTokenInfo?: () => void;
}) {
  const noun = tokenBalance === 1 ? 'Bailout' : 'Bailouts';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmOverlay}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>End this session?</Text>
          {!!remainingLabel && (
            <View style={styles.confirmWaitWrap}>
              <Text style={styles.confirmWaitValue}>{remainingLabel}</Text>
              <Text style={styles.confirmWaitUnits}>{remainingUnits} left</Text>
            </View>
          )}
          <Text style={styles.confirmBody}>
            You can wait it out, or end it now for{' '}
            <Text style={styles.confirmAccent}>1 Bailout</Text>.{'\n'}You have {tokenBalance} {noun}.
          </Text>
          <Button label="Wait it out" variant="accent" onPress={onClose} />
          <Button
            label={tokenBalance <= 0 ? 'No Bailouts left' : 'End now · 1 Bailout'}
            variant="ghost"
            disabled={tokenBalance <= 0}
            onPress={onSpend}
          />
          {onOpenTokenInfo && (
            <Pressable onPress={onOpenTokenInfo} hitSlop={8}>
              <Text style={styles.confirmInfoLink}>What is a Bailout?</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * The end-session control on a running timer.
 *
 * At rest it is a bare cross — the smallest possible acknowledgement that a
 * way out exists. Touching it does not act: the circle grows smoothly into a
 * pill that then has to be *held*, charging left to right, before the ways
 * out are shown.
 *
 * It deliberately speaks the same language as `HoldButton` (fill from the
 * left, accelerating haptic ticks, drain rather than snap on release) so this
 * reads as the same commitment gesture used to loosen a block or delete an
 * account, rather than a new one invented for this screen. It is not that
 * component because that one is a fixed-width pill: the morph from a 44pt
 * circle is the whole point here, and animating a shared CTA's width would
 * complicate every other caller.
 *
 * HOLD_MS sits at the top of the app's scale (loosening is 2600, delete is
 * 2600): ending a locked session early is the heaviest thing this screen can
 * do, so it asks for the longest hold.
 */
function UnlockControl({ onReveal }: { onReveal: () => void }) {
  // 0 = resting circle, 1 = fully formed pill. Drives width and both
  // cross-fades from one value so they can never disagree.
  const open = useSharedValue(0);
  const progress = useSharedValue(0);
  const [expanded, setExpanded] = useState(false);

  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  const stopTicks = useCallback(() => {
    if (tickTimer.current) {
      clearTimeout(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  // Same accelerating ramp as HoldButton: a self-rescheduling timeout, so each
  // gap can be shorter than the last. An interval can only tick evenly, which
  // reads as a metronome rather than a charge.
  const scheduleTick = useCallback(() => {
    const t = Math.min(1, (Date.now() - startedAt.current) / HOLD_MS);
    tickTimer.current = setTimeout(
      () => {
        Haptics.impactAsync(
          t > 0.75
            ? Haptics.ImpactFeedbackStyle.Medium
            : t > 0.4
              ? Haptics.ImpactFeedbackStyle.Light
              : Haptics.ImpactFeedbackStyle.Soft,
        ).catch(() => {});
        scheduleTick();
      },
      TICK_START_MS + (TICK_END_MS - TICK_START_MS) * t,
    );
  }, []);

  const finish = useCallback(() => {
    stopTicks();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onReveal();
  }, [onReveal, stopTicks]);

  const onPressIn = () => {
    setExpanded(true);
    startedAt.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    scheduleTick();
    open.value = withTiming(1, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) });
    // Delayed by the morph so the charge starts from a formed pill rather than
    // filling a circle that is still growing underneath it.
    progress.value = withDelay(
      MORPH_MS,
      withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (done) => {
        if (done) runOnJS(finish)();
      }),
    );
  };

  const onPressOut = () => {
    stopTicks();
    // Drain rather than snap: an instant reset reads as a glitch, a drain
    // reads as the charge you just gave up on.
    progress.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
    open.value = withTiming(0, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) runOnJS(setExpanded)(false);
    });
  };

  useEffect(() => stopTicks, [stopTicks]);

  const shell = useAnimatedStyle(() => ({
    width: COLLAPSED_W + (EXPANDED_W - COLLAPSED_W) * open.value,
  }));
  const crossStyle = useAnimatedStyle(() => ({ opacity: 1 - open.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: open.value }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: open.value * (0.15 + progress.value * 0.6) }));

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel="End session"
      accessibilityHint="Press and hold for three seconds to see the ways out of this session"
    >
      <Animated.View style={[styles.unlockShell, shell]}>
        {/* Clipped by the shell's overflow, so the pill itself charges rather
            than carrying a progress bar drawn on top of it. */}
        <Animated.View style={[styles.unlockFillClip, fillStyle]}>
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.unlockFill}
          />
        </Animated.View>
        <Animated.View style={[styles.unlockGlow, glowStyle]} pointerEvents="none" />

        <Animated.View style={[styles.unlockCentered, crossStyle]} pointerEvents="none">
          <Icon name="close" size={20} color={palette.text} />
        </Animated.View>
        <Animated.View style={[styles.unlockCentered, labelStyle]} pointerEvents="none">
          {/* Mounted only while expanded: a Text under an opacity-0 layer is
              still read aloud by VoiceOver, which would announce it on a
              resting cross. */}
          {expanded && <Text style={styles.unlockLabel}>keep holding…</Text>}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Resting diameter — matches IconButton so the control looks untouched. */
const COLLAPSED_W = 44;
const EXPANDED_W = 210;
const MORPH_MS = 260;
/** The app's longest hold. See the note above. */
const HOLD_MS = 3000;
const TICK_START_MS = 150;
const TICK_END_MS = 40;

const styles = StyleSheet.create({
  shrink: { flex: 1, minWidth: 0 },
  content: { flexGrow: 1, paddingHorizontal: space.gutter, paddingBottom: space.tabClearance },

  headerRow: { minHeight: 44, justifyContent: 'flex-end' },
  sessionLabel: { ...type.overline, color: palette.textTertiary },
  voice: { marginTop: space.base },

  hero: { alignItems: 'center', marginTop: space.xl },
  heroCap: { marginBottom: space.sm, color: palette.textTertiary },
  bigTime: { ...type.hero, fontSize: 60, letterSpacing: -2, color: palette.text },
  colon: { color: palette.textTertiary },
  unitLine: { marginTop: space.xs },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg, marginTop: space.xl },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHint: { minWidth: 76, textAlign: 'center', color: palette.textTertiary },

  spacer: { flex: 1, minHeight: space.xl },

  slideFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: SLIDE_TRACK_H / 2,
    overflow: 'hidden',
  },

  // A halo behind the thumb, deliberately wider than it so it never touches
  // the thumb's own outline — the previous version was the same size and
  // colour, which softened the edge and made the button read as smudged.
  slideGlow: {
    position: 'absolute',
    left: SLIDE_PAD - 11,
    width: SLIDE_BTN + 22,
    height: SLIDE_BTN + 22,
    top: (SLIDE_TRACK_H - (SLIDE_BTN + 22)) / 2,
    borderRadius: (SLIDE_BTN + 22) / 2,
    backgroundColor: 'rgba(71,107,235,0.22)',
    zIndex: 0,
  },
  slideTrack: {
    width: '100%',
    height: SLIDE_TRACK_H,
    borderRadius: SLIDE_TRACK_H / 2,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SLIDE_PAD,
    marginBottom: space.sm,
  },
  slideThumb: {
    width: SLIDE_BTN,
    height: SLIDE_BTN,
    borderRadius: SLIDE_BTN / 2,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    // Shadow only — no ring. The disc has to stay a plain circle; a border
    // just reads as a second shape stacked on the button.
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  slideLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    ...type.overline,
    color: palette.textTertiary,
  },

  accessCard: { marginTop: space.base },
  accessCardTight: { marginTop: space.sm },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  accessIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessSub: { marginTop: space.xxs },
  tokenBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBadgeText: { ...type.bodyStrong, color: palette.accent },

  // ── Locked mode ──
  lockedRoot: { flex: 1 },
  // Bottom-centre slot for the end-session control. Absolute so it stays put
  // regardless of how tall the ring and its caption end up on a given device.
  cornerLeft: { position: 'absolute', top: space.sm, left: space.gutter, zIndex: 5 },
  unlockShell: {
    height: 44,
    overflow: 'hidden',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Anchored left explicitly: a centred absolute fill would grow from the
  // middle rather than charging across.
  unlockFillClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  // Fixed width inside a growing clip, so the gradient stays put instead of
  // squashing as the fill advances.
  unlockFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: EXPANDED_W },
  unlockGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  // Both faces occupy the same box so the cross-fade happens in place rather
  // than sliding; absolute keeps the pill's width driven by the animation
  // alone, not by whichever label is currently mounted.
  unlockCentered: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockLabel: {
    color: palette.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cornerBottom: {
    position: 'absolute',
    bottom: space.xxxl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  cornerRight: { position: 'absolute', top: space.sm, right: space.gutter, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  lockedBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xxl },
  lockedLabel: { color: palette.textTertiary },
  lockedMotivation: { color: palette.textSecondary, textAlign: 'center', maxWidth: 300 },

  // ── Cancel confirm ──
  blockedPill: { marginTop: 14 },
  chromeHidden: { opacity: 0 },
  lockedIcons: { marginTop: 22, alignItems: 'center' },
  lockedSheetScrim: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'flex-end' },
  lockedSheet: {
    backgroundColor: palette.surfaceRaised,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxl,
  },
  lockedSheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: space.md,
  },
  lockedSheetTitle: { ...type.title3, marginBottom: space.xxs },
  lockedSheetSub: { ...type.sub, marginBottom: space.lg },
  lockedGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg },
  lockedGridItem: { width: '25%', alignItems: 'center', gap: space.xs },
  lockedGridLabel: { ...type.caption, color: palette.textTertiary, maxWidth: '92%', textAlign: 'center' },
  unlockGlyphWrap: { alignItems: 'center', marginBottom: space.md },
  confirmWaitWrap: { alignItems: 'center', marginTop: space.sm, marginBottom: space.xs },
  confirmWaitValue: { ...type.title1, color: palette.text },
  confirmWaitUnits: { ...type.caption, color: palette.textTertiary },
  confirmOverlay: { flex: 1, backgroundColor: palette.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl },
  confirmBox: {
    width: '100%',
    maxWidth: 344,
    backgroundColor: palette.surfaceRaised,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xxl,
    padding: space.xl,
    gap: space.md,
  },
  confirmTitle: { ...type.title3, textAlign: 'center' },
  confirmBody: { ...type.callout, textAlign: 'center', lineHeight: 21, marginBottom: space.xs },
  confirmAccent: { color: palette.accent, fontWeight: '700' },
  confirmInfoLink: { ...type.sub, textAlign: 'center', textDecorationLine: 'underline', marginTop: space.xs },

  // ── App-select sheet ──
  modalOverlay: { flex: 1, backgroundColor: palette.scrim, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    height: '92%',
    paddingTop: space.sm,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.borderStrong, marginBottom: space.sm },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: space.gutter, paddingVertical: space.md, gap: space.md },
  modalHeaderSub: { marginTop: space.xxs, maxWidth: 240 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: palette.glass,
    borderRadius: radius.md,
    marginHorizontal: space.gutter,
    marginBottom: space.base,
    paddingHorizontal: space.md,
    height: 46,
  },
  searchInput: { flex: 1, ...type.body, paddingVertical: 0 },
  modalScroll: { flex: 1 },
  // The CTA is absolutely positioned over the sheet and stands ~96pt tall, so
  // the old 48pt reserve left the last apps hidden underneath it.
  modalScrollBody: { paddingHorizontal: space.gutter, paddingBottom: 132, gap: space.base },
  groupCard: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: space.base,
    gap: space.md,
  },
  groupHeadRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  groupHeadText: { flex: 1, minWidth: 0 },
  browserTile: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subList: { gap: space.sm },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xxs },
  featureTile: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabel: { flex: 1, ...type.callout, color: palette.textSecondary },
  categoryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collapseToggle: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1, paddingVertical: space.xxs },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xxs },
  appLabel: { flex: 1, ...type.body },
  modalCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: Platform.OS === 'ios' ? space.xxl : space.lg,
  },
});
