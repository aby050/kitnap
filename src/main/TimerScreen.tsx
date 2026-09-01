import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Button, Card, Divider, Editorial, IconButton, Pill, Ring, Screen } from '../design/primitives';
import Icon, { IconName } from '../ui/Icon';
import AppGlyph from '../ui/AppGlyph';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { motion, palette, radius, space, type } from '../design/tokens';

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

const SWITCH_TRACK = { true: palette.accent, false: palette.surfaceHigh };

export default function TimerScreen({
  initialMinutes = 30,
  autoStart = false,
  hardMode = false,
  label = 'Timer',
  motivationLine,
  onFocusComplete,
  onOpenEssentials,
  onOpenShield,
  tokenBalance = 0,
  onSpendTokenToCancel,
  onOpenTokenInfo,
  blockedPackages = [],
  onUpdateBlockedPackages,
}: {
  initialMinutes?: number;
  autoStart?: boolean;
  /** Hard mode: the session cannot be ended with a Bailout. Emergency access stays. */
  hardMode?: boolean;
  label?: string;
  onOpenEssentials?: () => void;
  onOpenShield?: () => void;
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
  const [remaining, setRemaining] = useState(autoStart ? initialMinutes * 60 : 0);
  const [running, setRunning] = useState(autoStart);
  const prevRemaining = useRef(remaining);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

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
    setRemaining(0);
  };

  // ── Slide-to-start gesture ──
  const maxSlideX = width - space.gutter * 2 - SLIDE_BTN - SLIDE_PAD * 2;
  const slideX = useSharedValue(0);

  const triggerStart = useCallback(() => {
    if (remaining > 0 && !running) {
      setRunning(true);
    } else {
      setRemaining(selectedMinutes * 60);
      setRunning(true);
    }
  }, [remaining, running, selectedMinutes]);

  useEffect(() => {
    if (running) {
      const t = setTimeout(() => {
        slideX.value = withSpring(0, { damping: 15 });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [running, slideX]);

  const handleSlideComplete = () => setShowAppSelectModal(true);

  const handleCancelStart = () => {
    setShowAppSelectModal(false);
    slideX.value = withSpring(0, { damping: 15 });
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

  const slideGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      slideX.value = Math.max(0, Math.min(e.translationX, maxSlideX));
    })
    .onEnd(() => {
      'worklet';
      if (slideX.value > maxSlideX * 0.65) {
        slideX.value = withSpring(maxSlideX, { damping: 15 });
        runOnJS(handleSlideComplete)();
      } else {
        slideX.value = withSpring(0, { damping: 15 });
      }
    });

  const slideAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  // ─────────────────────────────────────────────────────────────
  // Locked full-screen mode — running can't be paused or backed out
  // of for free. The only exit is Bailout, which is confirmed explicitly.
  // ─────────────────────────────────────────────────────────────
  if (running) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.lockedRoot}>
        {hardMode ? (
          <View style={styles.cornerLeft} />
        ) : (
          <View style={styles.cornerLeft}>
            <Pill
              label="Bailout"
              icon="key"
              tone="warn"
              onPress={() => setShowCancelConfirm(true)}
            />
          </View>
        )}

          <View style={styles.cornerRight}>
            {onOpenShield && (
              <IconButton name="shield" onPress={onOpenShield} bordered accessibilityLabel="Shield" />
            )}
            {onOpenEssentials && (
              <Pill label="Emergency" icon="key" tone="danger" onPress={onOpenEssentials} />
            )}
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
          </View>
        </View>

        <CancelConfirm
          visible={showCancelConfirm}
          tokenBalance={tokenBalance}
          onClose={() => setShowCancelConfirm(false)}
          onSpend={() => {
            setShowCancelConfirm(false);
            setRunning(false);
            setRemaining(0);
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
      <View style={styles.content}>
        <Text style={styles.title}>{label}</Text>
        <Editorial
          lead={motivationLine ? '' : 'Set the length,'}
          emphasis={motivationLine || 'then commit to it.'}
          style={styles.voice}
        />

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
        <View style={styles.slideTrack}>
          <Text style={styles.slideLabel}>Slide to start</Text>
          <GestureDetector gesture={slideGesture}>
            <Animated.View style={[styles.slideThumb, slideAnimStyle]}>
              <Icon name="chevronRight" size={22} color={palette.textInverse} strokeWidth={2.2} />
            </Animated.View>
          </GestureDetector>
        </View>

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
      </View>

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
              <View style={styles.modalOverlay}>
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

                  <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                    {/* YouTube */}
                    {('youtube'.includes(q) || q === '') && (
                      <View style={styles.groupCard}>
                        <View style={styles.groupHeadRow}>
                          <AppGlyph name="YouTube" packageName="com.google.android.youtube" size={40} />
                          <View style={styles.groupHeadText}>
                            <Text style={type.bodyStrong}>YouTube</Text>
                            <Text style={[type.sub, styles.accessSub]}>Blocked completely</Text>
                          </View>
                          <Switch value={ytBlocked} onValueChange={setYtBlocked} trackColor={SWITCH_TRACK} thumbColor={palette.text} />
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
                              <Switch value={o.value} onValueChange={o.set} trackColor={SWITCH_TRACK} thumbColor={palette.text} />
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
                          <Switch value={browserBlocked} onValueChange={setBrowserBlocked} trackColor={SWITCH_TRACK} thumbColor={palette.text} />
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
                              <Switch value={o.value} onValueChange={o.set} trackColor={SWITCH_TRACK} thumbColor={palette.text} />
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
                          <Switch
                            value={isAnyDistractingChecked}
                            onValueChange={handleToggleDistractingMaster}
                            trackColor={SWITCH_TRACK}
                            thumbColor={palette.text}
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
                                  <Switch
                                    value={!!distractingAppsState[app.packageName]}
                                    onValueChange={(val) =>
                                      setDistractingAppsState((prev) => ({ ...prev, [app.packageName]: val }))
                                    }
                                    trackColor={SWITCH_TRACK}
                                    thumbColor={palette.text}
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
              </View>
            </Modal>
          );
        })()}
    </Screen>
  );
}

/** End-session-early confirm. A Bailout is the only way out of a locked timer. */
function CancelConfirm({
  visible,
  tokenBalance,
  onClose,
  onSpend,
  onOpenTokenInfo,
}: {
  visible: boolean;
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
          <Text style={styles.confirmTitle}>Leave this timer?</Text>
          <Text style={styles.confirmBody}>
            A locked session doesn't stop for free. Walking out now uses{' '}
            <Text style={styles.confirmAccent}>1 Bailout</Text>.{'\n'}You have {tokenBalance} {noun}.
          </Text>
          <Button
            label={tokenBalance <= 0 ? 'No Bailouts left' : 'Use 1 Bailout and exit'}
            variant="danger"
            disabled={tokenBalance <= 0}
            onPress={onSpend}
          />
          <Button label="Keep going" variant="ghost" onPress={onClose} />
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

const styles = StyleSheet.create({
  shrink: { flex: 1, minWidth: 0 },
  content: { flex: 1, paddingHorizontal: space.gutter, paddingBottom: space.tabClearance },

  title: { ...type.title1, marginTop: space.sm },
  voice: { marginTop: space.xxs },

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
    zIndex: 2,
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
  cornerLeft: { position: 'absolute', top: space.sm, left: space.gutter, zIndex: 5 },
  cornerRight: { position: 'absolute', top: space.sm, right: space.gutter, zIndex: 5, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  lockedBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xxl },
  lockedLabel: { color: palette.textTertiary },
  lockedMotivation: { color: palette.textSecondary, textAlign: 'center', maxWidth: 300 },

  // ── Cancel confirm ──
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
  modalScrollBody: { paddingHorizontal: space.gutter, paddingBottom: space.huge, gap: space.base },
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
