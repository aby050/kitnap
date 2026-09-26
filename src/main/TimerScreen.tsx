import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
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
import HoldButton from '../components/HoldButton';
import CancelConfirm from '../components/CancelConfirm';
import { AmbienceShelf } from '../components/AmbienceCard';
import { Ambience } from '../data/ambiences';
import BlockedListSheet from '../components/BlockedListSheet';
import BlockedSelection from '../components/BlockedSelection';
import EmergencyDialer from '../components/EmergencyDialer';
import SessionSoundCard from '../components/SessionSoundCard';
import { ESSENTIALS, EssentialKey } from '../data/gateQuestions';
import { hasBlockedSelection } from '../data/iosScreenTime';
import { FocusSession } from '../data/store';
import { SoundKey } from '../data/sounds';
import { fonts, gradients, motion, palette, radius, space, type } from '../design/tokens';
import Toggle from '../design/Toggle';

const { width } = Dimensions.get('window');

// Duration bounds — adjusted in 15-minute steps by the ± controls.
/** Idle time before the locked screen steps back to the always-on face.
 *
 *  Was three seconds, matching the apps this imitates, and that turned out to
 *  be unusable: three seconds is shorter than reading the screen, so it kept
 *  blacking out mid-decision and every tap to get the controls back started
 *  the countdown again. Thirty seconds means it only arrives once the phone
 *  has genuinely been put down, which is the only moment it is wanted. */
const DIM_AFTER_MS = 7000;
/** The ring on the always-on face: the accent at the same weight as the
 *  digits, over a track dark enough to read as unlit. */
const AOD_RING = 'rgba(23,211,208,0.38)';
const AOD_TRACK = 'rgba(255,255,255,0.05)';

/** How far down the timer itself goes. Not zero — the whole point is that it
 *  stays readable from across a desk without lighting the room. */
const DIM_OPACITY = 0.35;

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
  onStartAmbience,
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
  onDimChange,
  sessionSound = null,
  onChangeSessionSound,
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
  onStartAmbience?: (ambience: Ambience) => void;
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
  /** The always-on face is up. The tab bar lives above this screen, so only
   *  the parent can get it out of the way — a lit tab bar across the bottom
   *  of an otherwise black page defeats the point of the black page. */
  onDimChange?: (dimmed: boolean) => void;
  /** The clip under the running session, or null for silence. */
  sessionSound?: SoundKey | null;
  onChangeSessionSound?: (key: SoundKey | null) => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAppSelectModal, setShowAppSelectModal] = useState(false);
  const [showPickPrompt, setShowPickPrompt] = useState(false);
  // Mid-session the timer is the point; the controls around it are not. Tapping
  // anywhere reveals them and they fade back out, so a locked screen stays calm
  // without hiding the way out.
  const [chromeVisible, setChromeVisible] = useState(true);
  /**
   * Untouched for a while, so the screen steps back.
   *
   * A locked session is meant to be put down, not watched. Full-brightness
   * white digits burning an OLED panel for three hours is both a battery
   * complaint waiting to happen and the opposite of what the session is for,
   * so the UI fades to a dim clock and — deliberately — nothing here holds a
   * wake lock. The phone sleeps on its own schedule, and the countdown
   * carries on where it costs nothing: the ongoing chronometer notification,
   * which the system ticks down itself and which Samsung's always-on display
   * renders without the app running at all.
   */
  const [dimmed, setDimmed] = useState(false);
  useEffect(() => onDimChange?.(dimmed), [dimmed, onDimChange]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** A finger is down somewhere on the locked screen. The always-on face must
   *  not take over mid-gesture: it replaces the tree under the touch, which
   *  cancels the press without ever delivering a release. */
  const [touching, setTouching] = useState(false);
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

  /** Wakes the screen back up and restarts the countdown to dim. */
  const rouse = useCallback(() => {
    setDimmed(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setDimmed(true);
      setChromeVisible(false);
    }, DIM_AFTER_MS);
  }, []);

  // Only while locked. Dimming the setup screen mid-decision would be hostile,
  // and the sheets that open over the session (bailout, locked apps) are real
  // interaction — the timer restarts whenever one of them is up.
  useEffect(() => {
    if (!running || showLockedApps || showEssentials || unlockTarget || showCancelConfirm || touching) {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = null;
      setDimmed(false);
      return;
    }
    rouse();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = null;
    };
  }, [running, showLockedApps, showEssentials, unlockTarget, showCancelConfirm, touching, rouse]);

  /**
   * Back does not leave a running session.
   *
   * Home is already handled: the launcher is off the lockdown allowlist, so
   * pressing it lands on the shield. Back was the hole left over — it walks
   * out of the activity entirely, and Android then shows the launcher without
   * ever firing a window change this app could answer. Swallowing it while a
   * session runs is what makes the two exits agree.
   *
   * The sheets get first refusal, so back still closes whatever is open on
   * top before it stops meaning anything at all.
   */
  useEffect(() => {
    if (!running) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (unlockTarget) {
        setUnlockTarget(null);
        return true;
      }
      if (showLockedApps) {
        setShowLockedApps(false);
        return true;
      }
      if (showEssentials) {
        setShowEssentials(false);
        return true;
      }
      if (showCancelConfirm) {
        setShowCancelConfirm(false);
        return true;
      }
      // Nothing open: the session is the screen, and there is nowhere back to.
      rouse();
      return true;
    });
    return () => sub.remove();
  }, [running, unlockTarget, showLockedApps, showEssentials, showCancelConfirm, rouse]);

  /**
   * No wake lock. Deliberately.
   *
   * An earlier pass held the screen on to imitate an always-on display. That
   * is not what the apps this copies actually do: they show the dim face and
   * then let the phone sleep on its own timeout, and the face is what you land
   * on again when you unlock. Real AOD belongs to the OEM and no app draws on
   * it, so holding the panel awake bought an imitation nobody asked for at the
   * only real battery cost in the feature.
   *
   * The countdown keeps running regardless: it is a deadline, not a ticking
   * counter, and the ongoing chronometer notification is what shows on the
   * lock screen while the app is asleep.
   */

  // ─────────────────────────────────────────────────────────────
  // Locked full-screen mode — running can't be paused or backed out
  // of for free. The only exit is Bailout, which is confirmed explicitly.
  // ─────────────────────────────────────────────────────────────
  if (running) {
    /**
     * The always-on face.
     *
     * A real black page over everything, not the whole UI turned translucent.
     * Fading the live screen still leaves every card, ring and button faintly
     * lit across the whole panel, which on OLED is the expensive part and
     * reads as a dimmed app rather than a clock. This draws nothing but the
     * time, so almost every pixel is genuinely off.
     */
    if (dimmed) {
      return (
        <>
        {/* Nothing but the time. The signal and battery icons are the phone
            talking, and this page exists to be the only thing on the panel —
            they also sit in the one strip that stays lit on an otherwise
            black screen. */}
        <StatusBar hidden animated />
        <Pressable
          style={styles.aod}
          onPress={() => {
            rouse();
            setChromeVisible(true);
          }}
          accessibilityLabel="Wake the timer"
        >
          {/* The ring comes along. It is the one part of the timer that says
              how much is left without being read, which is exactly what a
              glance from across a room needs — and at this opacity a thin arc
              costs almost nothing on an OLED panel. */}
          <Ring
            progress={progress}
            size={240}
            thickness={3}
            /* Dimmed to match the digits, and the track dropped to near-black
               rather than the usual hairline: on this page an unlit track is
               a full circle of lit pixels for no information. */
            color={AOD_RING}
            track={AOD_TRACK}
          >
            <Text style={styles.aodTime}>
              {lcdLeft}
              <Text style={styles.aodColon}>:</Text>
              {lcdRight}
            </Text>
            <Text style={styles.aodLabel}>{label.toUpperCase()}</Text>
          </Ring>
        </Pressable>
        </>
      );
    }

    return (
      <Screen edges={['top', 'bottom']}>
        {/* Full screen for the length of the session — the status bar is one
            more thing to look at, and glancing at it is how a session ends
            early. It comes straight back when the timer does. */}
        <StatusBar hidden animated />
        <Pressable
          style={styles.lockedRoot}
          // Touch start/end rather than press: a hold that never completes
          // still has to count as "the user is here", and onPress alone fires
          // only at the end of a successful tap.
          onTouchStart={() => setTouching(true)}
          onTouchEnd={() => {
            setTouching(false);
            rouse();
          }}
          onTouchCancel={() => {
            setTouching(false);
            rouse();
          }}
          onPress={() => {
            rouse();
            setChromeVisible((v) => !v);
          }}
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
            {/* The one ordinary way out of a locked session.
                During a session every app is shielded except the dialer, so
                this is the door that makes that survivable: it opens the
                dialer and nothing else. It does not lift the block, spend a
                Bailout or touch the daily emergency allowance — placing a call
                is not an emergency, and charging for one would push people
                toward the red button for something routine. */}
            <Pill
              label="Call"
              icon="phone"
              onPress={() => {
                Linking.openURL('tel:').catch(() => {
                  // No dialer (a tablet, mostly) — the essentials sheet at
                  // least explains what is still reachable.
                  setShowEssentials(true);
                });
              }}
            />
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

            {/* Sound rides with the chrome. It is a control, and the point of
                hiding the chrome is to leave nothing but the time — a card
                that stayed up would be the one bright thing on an otherwise
                bare screen. The audio itself keeps playing either way. */}
            {onChangeSessionSound && (
              <View
                style={[styles.soundSlot, !chromeVisible && styles.chromeHidden]}
                pointerEvents={chromeVisible ? 'auto' : 'none'}
              >
                <SessionSoundCard soundKey={sessionSound} onChange={onChangeSessionSound} />
              </View>
            )}

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
              {/* The same hold gesture, component and proportions as the
                  delete-account confirm — one commitment control across the
                  app rather than a bespoke one per screen. */}
              <HoldButton
                label="Hold to end this session"
                holdLabel="Keep holding to end…"
                holdMs={3000}
                onComplete={() => setShowCancelConfirm(true)}
                accessibilityLabel="End session"
                style={styles.exitHold}
              />
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
            lead="How long can you"
            emphasis="be somewhere else?"
            style={styles.voice}
          />
        </Animated.View>

        {/* The dial, the 15-minute stepper and the slide-to-start that used
            to fill this screen are gone. A length picker asks "how long can
            you stand it?" — the wrong question, and the one every app in this
            category opens with. A room asks what you are doing instead, and
            brings its own length. The manual dial still exists on Home for
            anyone who just wants a number. */}
        {onStartAmbience && (
          <Animated.View
            entering={FadeIn.duration(motion.transition)}
            style={styles.roomShelf}
          >
            <AmbienceShelf onStart={onStartAmbience} />
          </Animated.View>
        )}

        {/* Under the rooms: what any of them will hold back. */}
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

        {/* The Bailouts card and the "Open a blocked app" door used to sit
            here. This screen is the focus module now — somewhere to choose
            how long to be away and what to look at while you are — and a
            shortcut into the thing you are trying not to do belongs on Home,
            where it already is, not under the rooms. Bailouts live on Home and
            in Settings; they are also quoted at the only moment they cost
            anything, which is the sheet that leaves a room. */}

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
              ? "This session was started in hard mode. A Bailout won't end it — this one runs to the end."
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
  /* The shelf spans the full width, so it cancels the content gutter and
   * re-applies it inside the rail — a horizontal list that stops short of
   * the edge reads as clipped rather than as scrollable. */
  roomShelf: { marginTop: space.sm },
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
  soundSlot: { alignSelf: 'stretch', paddingHorizontal: space.gutter, marginTop: space.base },
  /* True black, not a themed near-black: on OLED #000 switches the pixel off
     entirely, which is the whole reason this is affordable to leave running. */
  aod: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aodTime: {
    color: '#ffffff',
    opacity: DIM_OPACITY,
    /* Sized to sit inside the 240pt ring rather than to fill the screen —
       at 72 the four digits ran under the arc on both sides. */
    fontSize: 52,
    fontWeight: '200',
    letterSpacing: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  aodColon: { opacity: 0.55 },
  aodLabel: {
    color: '#ffffff',
    opacity: DIM_OPACITY * 0.5,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 14,
  },
  // Bottom-centre slot for the end-session control. Absolute so it stays put
  // regardless of how tall the ring and its caption end up on a given device.
  cornerLeft: { position: 'absolute', top: space.sm, left: space.gutter, zIndex: 5 },
  cornerBottom: {
    position: 'absolute',
    bottom: space.xxxl,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Gutters, now that this holds a full-width pill rather than a 44pt
    // circle that could sit flush against the edges.
    paddingHorizontal: space.gutter,
    zIndex: 5,
  },
  // Matches DeleteAccountScreen's `confirmHold` — same control, same width.
  exitHold: { width: '100%' },
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
