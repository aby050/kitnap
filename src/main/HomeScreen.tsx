import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path, Rect, Ellipse } from 'react-native-svg';
import { colors } from '../theme';
import { PresetSections } from '../components/PresetCard';
import Icon from '../ui/Icon';

const { width } = Dimensions.get('window');

// Local branded AppIcon component for screen time list
function AppIcon({ name, size = 36 }: { name: string; size?: number }) {
  if (name === 'Facebook') {
    return (
      <View style={[styles.brandIcon, { backgroundColor: '#1877F2', width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.brandText, { fontSize: size * 0.52, fontWeight: '800', marginTop: size * 0.08 }]}>f</Text>
      </View>
    );
  }
  if (name === 'Instagram') {
    return (
      <View style={[styles.brandIcon, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
        <LinearGradient
          colors={['#C13584', '#E1306C', '#F77737']}
          style={StyleSheet.absoluteFill}
        />
        <View style={{
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: size * 0.12,
          borderWidth: 1.5,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <View style={{
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size * 0.08,
            borderWidth: 1.5,
            borderColor: 'white'
          }} />
        </View>
      </View>
    );
  }
  return null;
}

// Custom Starry Cave Backdrop (reused from original, adjusted height)
function CaveBackdrop() {
  const H = 260;
  return (
    <View style={styles.caveBackground}>
      <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
        {/* Starry Sky Background */}
        <Rect width={width} height={H} fill="#000000" />
        
        {/* Stars */}
        <Circle cx={40} cy={30} r={1} fill="white" opacity={0.6} />
        <Circle cx={80} cy={70} r={1.3} fill="white" opacity={0.8} />
        <Circle cx={120} cy={40} r={0.8} fill="white" opacity={0.5} />
        <Circle cx={160} cy={80} r={1.1} fill="white" opacity={0.7} />
        <Circle cx={200} cy={35} r={1.3} fill="white" opacity={0.9} />
        <Circle cx={240} cy={65} r={1} fill="white" opacity={0.6} />
        <Circle cx={270} cy={25} r={1.2} fill="white" opacity={0.8} />
        <Circle cx={310} cy={75} r={0.8} fill="white" opacity={0.4} />
        <Circle cx={350} cy={45} r={1.3} fill="white" opacity={0.85} />
        <Circle cx={60} cy={110} r={0.7} fill="white" opacity={0.3} />
        <Circle cx={140} cy={120} r={1.1} fill="white" opacity={0.65} />
        <Circle cx={220} cy={100} r={1} fill="white" opacity={0.5} />
        <Circle cx={290} cy={115} r={1.3} fill="white" opacity={0.7} />

        {/* Left Cliff Path */}
        <Path
          d={`M 0 0 
              L 100 0 
              Q 85 40, 94 80 
              T 72 160 
              Q 80 200, 55 ${H} 
              L 0 ${H} Z`}
          fill="#141516"
          stroke="#1d1e1f"
          strokeWidth={1.5}
        />
        <Path
          d={`M 0 30 L 75 30 Q 65 70, 70 110 T 48 190 Q 56 220, 38 ${H}`}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={3}
        />

        {/* Right Cliff Path */}
        <Path
          d={`M ${width} 0 
              L ${width - 100} 0 
              Q ${width - 85} 40, ${width - 94} 80 
              T ${width - 72} 160 
              Q ${width - 80} 200, ${width - 55} ${H} 
              L ${width} ${H} Z`}
          fill="#141516"
          stroke="#1d1e1f"
          strokeWidth={1.5}
        />
        <Path
          d={`M ${width} 30 L ${width - 75} 30 Q ${width - 65} 70, ${width - 70} 110 T ${width - 48} 190 Q ${width - 56} 220, ${width - 38} ${H}`}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={3}
        />

        {/* Cavern Ceiling */}
        <Path
          d={`M 80 0 
              Q 150 30, 200 10 
              T ${width - 80} 0 
              L ${width} 0 
              L 0 0 Z`}
          fill="#171819"
        />
      </Svg>
    </View>
  );
}

export default function HomeScreen({
  onOpenProfile,
  onOpenApps,
  onTriggerShield,
  onOpenEssentials,
  onStartFocus,
  onStartRest,
  onStartPreset,
  onOpenSleepSchedule,
  unlockNumber,
  streakDays = 0,
  score = 0,
  scoreTrendUp = true,
  focusPresetMinutes = 25,
  restPresetMinutes = 90,
  sleepHours = 0,
  usage,
}: {
  onOpenProfile: () => void;
  onOpenApps: () => void;
  onTriggerShield: () => void;
  onOpenEssentials: () => void;
  onStartFocus?: () => void;
  onStartRest?: () => void;
  /** Start an arbitrary preset session (from the For you / Detox cards). */
  onStartPreset?: (minutes: number, label: string) => void;
  onOpenSleepSchedule?: () => void;
  unlockNumber: number;
  streakDays?: number;
  score?: number;
  scoreTrendUp?: boolean;
  focusPresetMinutes?: number;
  restPresetMinutes?: number;
  sleepHours?: number;
  /** Real per-app device usage. `available:false` off Android — we show an
   *  honest prompt there instead of inventing numbers. */
  usage?: {
    totalMinutes: number | null;
    apps: { packageName: string; label: string; minutes: number }[];
    available: boolean;
    granted: boolean;
  };
}) {
  // ---- Timer / Clock state ----
  const [durationDays, setDurationDays] = useState(12);
  const [durationHours, setDurationHours] = useState(12);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
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

  // Compute display digits — when idle show the configured duration; when
  // running show the live countdown.
  const totalSeconds = running || remaining > 0
    ? remaining
    : durationDays * 24 * 3600 + durationHours * 3600;
  const displayHours = Math.floor(totalSeconds / 3600);
  const displayMinutes = Math.floor((totalSeconds % 3600) / 60);
  const hh = String(displayHours % 100).padStart(2, '0');
  const mm = String(displayMinutes).padStart(2, '0');

  const handleAdjust = (dir: number) => {
    if (running) return; // don't adjust while running
    let totalH = durationDays * 24 + durationHours + dir;
    if (totalH < 1) totalH = 1;
    if (totalH > 30 * 24) totalH = 30 * 24; // cap at 30 days
    setDurationDays(Math.floor(totalH / 24));
    setDurationHours(totalH % 24);
  };

  const handleStart = () => {
    if (running) {
      setRunning(false);
    } else if (remaining > 0) {
      // Resume
      setRunning(true);
    } else {
      const totalSec = durationDays * 24 * 3600 + durationHours * 3600;
      setRemaining(totalSec);
      setRunning(true);
      onStartFocus?.();
    }
  };

  const triggerStart = useCallback(() => {
    if (remaining > 0 && !running) {
      setRunning(true);
    } else {
      const totalSec = durationDays * 24 * 3600 + durationHours * 3600;
      setRemaining(totalSec);
      setRunning(true);
      onStartFocus?.();
    }
  }, [remaining, running, durationDays, durationHours, onStartFocus]);

  const SLIDE_BTN = 54;
  const SLIDE_TRACK_H = 62;
  const SLIDE_PAD = 4;
  const maxSlideX = width - 40 - SLIDE_BTN - SLIDE_PAD * 2;
  const slideX = useSharedValue(0);

  useEffect(() => {
    if (running) {
      const t = setTimeout(() => {
        slideX.value = withSpring(0, { damping: 15 });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [running, slideX]);

  const slideGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      slideX.value = Math.max(0, Math.min(e.translationX, maxSlideX));
    })
    .onEnd(() => {
      'worklet';
      if (slideX.value > maxSlideX * 0.65) {
        slideX.value = withSpring(maxSlideX, { damping: 15 });
        runOnJS(triggerStart)();
      } else {
        slideX.value = withSpring(0, { damping: 15 });
      }
    });

  const slideAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // ---- Screen time card data ----
  const totalMinutes = usage?.totalMinutes ?? null;
  const topApps = (usage?.apps ?? []).slice(0, 2);
  const peakMinutes = Math.max(1, ...topApps.map((a) => a.minutes));
  const screenTimeLabel =
    totalMinutes === null
      ? '—'
      : totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
        : `${totalMinutes}m`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Brand Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerLogo}>Wend</Text>
          <View style={styles.headerRight}>
            <View style={styles.streakWrap}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="#FFA726">
                <Path d="M12 2S8.38 6.92 8.38 10.5C8.38 12.5 10 14.12 12 14.12s3.62-1.62 3.62-3.62c0-3.58-3.62-8.5-3.62-8.5zm0 18c-3.31 0-6-2.69-6-6h12c0 3.31-2.69 6-6 6z" />
              </Svg>
              <Text style={styles.streakText}>{streakDays}</Text>
            </View>
            <Pressable onPress={onOpenProfile} style={styles.profileBtn}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7CF5B0" strokeWidth={2.5}>
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {/* ──── Timer section with Cave Backdrop & LCD Clock ──── */}
        <View style={styles.timerTopSection}>
          <CaveBackdrop />
          <Animated.View entering={FadeIn.duration(400)} style={styles.lcdBezel}>
            <View style={styles.lcdScreen}>
              {/* Faint segment background (retro LCD ghost digits) */}
              <Text style={styles.lcdTimeBg}>88:88</Text>
              {/* Active countdown / duration digits */}
              <Text style={styles.lcdTimeActive}>{hh}:{mm}</Text>
            </View>
          </Animated.View>
        </View>

        {/* ──── Duration adjustment row ──── */}
        <View style={styles.adjustRow}>
          <TouchableOpacity
            style={styles.adjustBtnCircle}
            activeOpacity={0.8}
            onPress={() => handleAdjust(-1)}
          >
            <Text style={styles.adjustBtnSign}>−</Text>
          </TouchableOpacity>
          <View style={styles.adjustValueCapsule}>
            <Text style={styles.adjustValueText}>{durationDays}d {durationHours}h</Text>
          </View>
          <TouchableOpacity
            style={styles.adjustBtnCircle}
            activeOpacity={0.8}
            onPress={() => handleAdjust(1)}
          >
            <Text style={styles.adjustBtnSign}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ──── Start / Pause button ──── */}
        <View style={styles.ctaSection}>
          {running ? (
            <TouchableOpacity
              style={styles.pauseBar}
              activeOpacity={0.9}
              onPress={() => setRunning(false)}
            >
              <Text style={styles.pauseText}>⏸  Pause</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.slideTrack}>
              <GestureDetector gesture={slideGesture}>
                <Animated.View style={[styles.slideBtn, slideAnimStyle]}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="#000000">
                    <Path d="M8 5v14l11-7z" fill="#000000" />
                  </Svg>
                </Animated.View>
              </GestureDetector>
              <Text style={styles.slideLabel}>SLIDE TO START</Text>
            </View>
          )}

          {/* Blocked Apps badge */}
          <Pressable style={styles.blockedAppsBadge} onPress={onOpenApps}>
            <Icon name="lock" size={13} color="rgba(255,255,255,0.75)" />
            <Text style={styles.blockedAppsLabel}>Blocked Apps</Text>
            <View style={styles.miniIconsRow}>
              <View style={[styles.miniAppIcon, { backgroundColor: '#34C759' }]}>
                <View style={styles.miniToggle} />
              </View>
              <View style={[styles.miniAppIcon, { backgroundColor: '#FF0000', borderRadius: 4 }]}>
                <Svg width={10} height={8} viewBox="0 0 16 12" fill="white">
                  <Path d="M6.4 8.4L12 4.8V7.2L6.4 10.8V8.4ZM0 0H16V12H0V0Z" />
                </Svg>
              </View>
            </View>
            <Text style={styles.blockedAppsChevron}>›</Text>
          </Pressable>
        </View>

        {/* Screen Time Progress Card (Pressable to open My Apps) */}
        <Pressable onPress={onOpenApps} style={styles.screenTimeCard}>
          <View style={styles.cardHeaderTitleRow}>
            <Text style={styles.cardHeaderTitle}>Screen time</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={styles.cardHeaderTime}>{screenTimeLabel}</Text>
          <Text style={styles.cardHeaderSub}>Today</Text>

          <View style={styles.divider} />

          {topApps.length > 0 ? (
            topApps.map((app) => (
              <View key={app.packageName} style={styles.appProgressRow}>
                <AppIcon name={app.label} size={36} />
                <View style={styles.progressContainer}>
                  <Text style={styles.appNameText}>{app.label}</Text>
                  <View style={styles.barAndLabelRow}>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(4, Math.round((app.minutes / peakMinutes) * 100))}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabelText}>
                      {app.minutes >= 60 ? `${Math.floor(app.minutes / 60)}h ${app.minutes % 60}m` : `${app.minutes}m`}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.usageEmpty}>
              {!usage?.available
                ? 'Per-app screen time is Android-only — iOS never hands app usage to third-party apps.'
                : !usage?.granted
                  ? 'Turn on Usage Access to see real per-app screen time here.'
                  : 'No app usage recorded yet today.'}
            </Text>
          )}
        </Pressable>

        {/* Session shortcuts — moved here from the Timer tab so the most
            common action (start a session) is one tap from Home. */}
        <PresetSections onStartPreset={(minutes, label) => onStartPreset?.(minutes, label)} />

        {/* Bottom utility rows preserved */}
        <Pressable onPress={onTriggerShield} style={styles.shieldDemo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shieldDemoTitle}>Open a blocked app</Text>
            <Text style={styles.shieldDemoSub}>
              Next request is unlock #{unlockNumber} today
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Essentials & emergency access now lives at the bottom of the
            Timer tab — see TimerScreen. */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130,
  },

  /* ── Header ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  headerLogo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 5,
  },
  streakText: {
    color: '#FFA726',
    fontSize: 13,
    fontWeight: '700',
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#7CF5B0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Timer / Cave section ── */
  timerTopSection: {
    alignItems: 'center',
    height: 260,
    justifyContent: 'center',
    position: 'relative',
    width: width,
    marginLeft: -20,
    marginBottom: 10,
  },
  caveBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },

  /* ── Retro LCD bezel & screen ── */
  lcdBezel: {
    width: 260,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#1b1b1b',
    borderWidth: 6,
    borderColor: '#0e0e0e',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    // Slight 3D tilt like the design
    transform: [{ perspective: 800 }, { rotateX: '-4deg' }, { rotateZ: '-2deg' }],
  },
  lcdScreen: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#6c8d9c',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  lcdTimeBg: {
    position: 'absolute',
    color: 'rgba(10, 18, 21, 0.07)',
    fontSize: 52,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  lcdTimeActive: {
    color: '#091113',
    fontSize: 52,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },

  /* ── Duration adjustment row ── */
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  adjustBtnCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnSign: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  adjustValueCapsule: {
    minWidth: 150,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  adjustValueText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ── CTA section (Start + Blocked Apps) ── */
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: 24,
    marginBottom: 28,
    gap: 16,
  },
  slideTrack: {
    width: '100%',
    height: 62,
    borderRadius: 31,
    backgroundColor: '#161718',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'relative',
  },
  slideBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7CF5B0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  slideLabel: {
    position: 'absolute',
    right: 0,
    left: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
    zIndex: 1,
  },
  pauseBar: {
    width: '100%',
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(124, 245, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseText: {
    color: '#7CF5B0',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── Blocked Apps badge ── */
  blockedAppsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  blockedAppsLock: {
    fontSize: 13,
  },
  blockedAppsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  miniIconsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  miniAppIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniToggle: {
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  blockedAppsChevron: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 2,
  },

  /* ── Screen time card ── */
  screenTimeCard: {
    backgroundColor: '#0c0d0e',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    marginTop: 0,
    width: '100%',
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeaderTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  cardHeaderTime: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardHeaderSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 18,
  },
  appProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressContainer: {
    flex: 1,
  },
  appNameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  barAndLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#FF6B6B',
  },
  usageEmpty: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 6,
  },
  barLabelText: {
    color: '#FF6B6B',
    fontSize: 12.5,
    fontWeight: '700',
    width: 48,
    textAlign: 'right',
  },
  brandIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#ffffff',
  },

  /* ── Bottom utility rows ── */
  shieldDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,245,176,0.09)',
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
  shieldDemoTitle: { color: colors.accent, fontSize: 16.5, fontWeight: '700' },
  shieldDemoSub: { color: colors.textDim, fontSize: 13.5, marginTop: 3 },
  chevron: { color: colors.textFaint, fontSize: 19 },
  essentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 22,
    padding: 18,
    marginTop: 12,
  },
  essentialsGlyph: { fontSize: 19 },
  essentialsTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  essentialsSub: { color: colors.textDim, fontSize: 13.5, marginTop: 3 },
});
