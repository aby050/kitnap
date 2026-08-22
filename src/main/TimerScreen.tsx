import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, ScrollView, Switch, Platform } from 'react-native';
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Icon from '../ui/Icon';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';

const { width } = Dimensions.get('window');

// ── Design tokens ──
const ORANGE = '#E8642C';
const ORANGE_DIM = 'rgba(232, 100, 44, 0.08)';
const CARD_BG = '#1c1c1e';
const SELECTED_BG = '#F5EDE4';
const SELECTED_TEXT = '#1a1a1a';

// ── Quick-select presets ──
const PRESETS = [
  { minutes: 15, label: '15', sub: 'Minutes' },
  { minutes: 45, label: '45', sub: 'Minutes' },
  { minutes: 180, label: '3', sub: 'Hours', tall: true },
  { minutes: 720, label: '12:00', sub: 'Custom', locked: true },
] as const;

// ── Vertical slider constants ──
const SLIDER_MIN = 5;
const SLIDER_MAX = 720;
const SLIDER_STEP = 15;
const TICK_COUNT = 12;

// ── Slide-to-start constants ──
const SLIDE_BTN = 54;
const SLIDE_TRACK_H = 62;
const SLIDE_PAD = 4;

export default function TimerScreen({
  initialMinutes = 30,
  autoStart = false,
  label = 'Timer',
  motivationLine,
  onFocusComplete,
  onOpenEssentials,
  onOpenShield,
  tokenBalance = 0,
  onSpendTokenToCancel,
  blockedPackages = [],
  onUpdateBlockedPackages,
}: {
  initialMinutes?: number;
  autoStart?: boolean;
  label?: string;
  onOpenEssentials?: () => void;
  onOpenShield?: () => void;
  motivationLine?: string;
  onFocusComplete?: (minutes: number) => void;
  tokenBalance?: number;
  onSpendTokenToCancel?: () => void;
  blockedPackages?: string[];
  onUpdateBlockedPackages?: (packages: string[]) => void;
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAppSelectModal, setShowAppSelectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Track category toggle states
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

  // When modal opens, sync selection state
  useEffect(() => {
    if (showAppSelectModal) {
      syncModalStateFromProps();
    }
  }, [showAppSelectModal, syncModalStateFromProps]);

  // ── State ──
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(autoStart ? initialMinutes * 60 : 0);
  const [running, setRunning] = useState(autoStart);
  const prevRemaining = useRef(remaining);

  // ── Countdown tick ──
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

  // ── Completion callback ──
  useEffect(() => {
    if (prevRemaining.current > 0 && remaining === 0) {
      const isRest = /rest/i.test(label);
      if (!isRest) onFocusComplete?.(selectedMinutes);
    }
    prevRemaining.current = remaining;
  }, [remaining, selectedMinutes, label, onFocusComplete]);

  // ── LCD display values ──
  const totalSec = running || remaining > 0 ? remaining : selectedMinutes * 60;
  const dispH = Math.floor(totalSec / 3600);
  const dispM = Math.floor((totalSec % 3600) / 60);
  const dispS = totalSec % 60;
  const showHours = selectedMinutes >= 60 || dispH > 0;
  const lcdLeft = showHours
    ? String(dispH).padStart(2, '0')
    : String(dispM).padStart(2, '0');
  const lcdRight = showHours
    ? String(dispM).padStart(2, '0')
    : String(dispS).padStart(2, '0');

  // ── Preset selection ──
  const selectPreset = (minutes: number) => {
    if (running) return;
    setSelectedMinutes(minutes);
    setRemaining(0);
  };

  // ── Vertical slider position ──
  const sliderFraction = Math.min(
    1,
    Math.max(0, (selectedMinutes - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)),
  );
  const activeTickIndex = Math.round(sliderFraction * (TICK_COUNT - 1));

  const handleSliderStep = (dir: number) => {
    if (running) return;
    const next = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, selectedMinutes + dir * SLIDER_STEP));
    setSelectedMinutes(next);
    setRemaining(0);
  };

  // ── Slide-to-start gesture ──
  const maxSlideX = width - 40 - SLIDE_BTN - SLIDE_PAD * 2;
  const slideX = useSharedValue(0);

  const triggerStart = useCallback(() => {
    if (remaining > 0 && !running) {
      setRunning(true);
    } else {
      setRemaining(selectedMinutes * 60);
      setRunning(true);
    }
  }, [remaining, running, selectedMinutes]);

  // Reset the slider thumb once the timer starts
  useEffect(() => {
    if (running) {
      const t = setTimeout(() => {
        slideX.value = withSpring(0, { damping: 15 });
      }, 400);
      return () => clearTimeout(t);
    }
  }, [running, slideX]);

  const handleSlideComplete = () => {
    setShowAppSelectModal(true);
  };

  const handleCancelStart = () => {
    setShowAppSelectModal(false);
    slideX.value = withSpring(0, { damping: 15 });
  };

  const handleConfirmAndStart = () => {
    const nextPackages: string[] = [];

    // 1. YouTube
    if (ytBlocked) {
      nextPackages.push('com.google.android.youtube');
    }

    // 2. Distracting category
    Object.keys(distractingAppsState).forEach((pkg) => {
      if (distractingAppsState[pkg]) {
        nextPackages.push(pkg);
      }
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

  const slideAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // ── Locked full-screen mode ──
  // Once the timer is running it can't be paused or backed out of for free —
  // that's the entire deterrent. The only way out is the cross button, which
  // costs 1 token and is confirmed explicitly, never a silent tap-to-cancel.
  if (running) {
    return (
      <SafeAreaView style={styles.lockedContainer} edges={['top', 'bottom']}>
        <TouchableOpacity
          style={styles.lockedCornerBtnLeft}
          activeOpacity={0.7}
          onPress={() => setShowCancelConfirm(true)}
          hitSlop={10}
        >
          <Icon name="close" size={15} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.lockedCornerRight}>
          {onOpenShield && (
            <TouchableOpacity style={styles.lockedShieldBtn} activeOpacity={0.7} onPress={onOpenShield} hitSlop={10}>
              <Icon name="shield" size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
          {onOpenEssentials && (
            <TouchableOpacity style={styles.lockedEmergencyBtn} activeOpacity={0.7} onPress={onOpenEssentials} hitSlop={10}>
              <Text style={styles.lockedEmergencyText}>Emergency</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.lockedBody}>
          <Text style={styles.lockedLabel}>{label}</Text>
          <Text style={styles.lockedDigits}>
            {lcdLeft}
            <Text style={styles.lcdColon}>:</Text>
            {lcdRight}
          </Text>
          {motivationLine ? <Text style={styles.lockedMotivation}>{motivationLine}</Text> : null}
        </View>

        <Modal visible={showCancelConfirm} transparent animationType="fade" onRequestClose={() => setShowCancelConfirm(false)}>
          <View style={styles.confirmOverlay}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>End this session early?</Text>
              <Text style={styles.confirmBody}>
                Once started this can't be stopped for free. Ending now costs{' '}
                <Text style={styles.confirmAccent}>1 token</Text>.{'\n'}You have {tokenBalance} token
                {tokenBalance === 1 ? '' : 's'}.
              </Text>
              <TouchableOpacity
                style={[styles.confirmSpendBtn, tokenBalance <= 0 && styles.confirmSpendBtnDisabled]}
                disabled={tokenBalance <= 0}
                activeOpacity={0.85}
                onPress={() => {
                  setShowCancelConfirm(false);
                  setRunning(false);
                  setRemaining(0);
                  onSpendTokenToCancel?.();
                }}
              >
                <Text style={styles.confirmSpendText}>
                  {tokenBalance <= 0 ? 'No tokens left' : 'Spend 1 token and end now'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmKeepBtn} activeOpacity={0.8} onPress={() => setShowCancelConfirm(false)}>
                <Text style={styles.confirmKeepText}>Keep going</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* ── Title ── */}
        <Text style={styles.title}>{label}</Text>
        {motivationLine ? <Text style={styles.motivation}>{motivationLine}</Text> : null}

        {/* ── LCD Card, with a minimal +/- to set duration ── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.lcdCard}>
          <Text style={styles.lcdGhost}>88:88</Text>
          <Text style={styles.lcdDigits}>
            {lcdLeft}
            <Text style={styles.lcdColon}>:</Text>
            {lcdRight}
          </Text>
          <View style={styles.durationStepRow}>
            <TouchableOpacity style={styles.chevronBtn} activeOpacity={0.7} onPress={() => handleSliderStep(-1)}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5}>
                <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chevronBtn} activeOpacity={0.7} onPress={() => handleSliderStep(1)}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5}>
                <Path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Spacer pushes the slide bar to the bottom */}
        <View style={{ flex: 1 }} />

        {/* ── Slide to Start ── */}
        <View style={styles.slideTrack}>
          <GestureDetector gesture={slideGesture}>
            <Animated.View style={[styles.slideBtn, slideAnimStyle]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill={ORANGE}>
                <Path d="M8 5v14l11-7z" />
              </Svg>
            </Animated.View>
          </GestureDetector>
          <Text style={styles.slideLabel}>SLIDE TO START</Text>
        </View>

        {/* ── Essentials & emergency access (moved here from Home) ── */}
        {onOpenEssentials && (
          <TouchableOpacity
            style={styles.essentialsRow}
            activeOpacity={0.8}
            onPress={onOpenEssentials}
          >
            <View style={styles.sosBadge}>
              <Text style={styles.sosBadgeText}>SOS</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.essentialsTitle}>Essentials &amp; emergency access</Text>
              <Text style={styles.essentialsSub}>Never blocked. Never charged.</Text>
            </View>
            <Text style={styles.essentialsChevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Select Apps to Block Modal */}
      {showAppSelectModal && (() => {
        const distractingAppsList = DEFAULT_BLOCKED_APPS.filter(app => app.packageName !== 'com.google.android.youtube');
        const filteredDistractingApps = distractingAppsList.filter(app =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const isAnyDistractingChecked = distractingAppsList.some(app => distractingAppsState[app.packageName]);

        const handleToggleDistractingMaster = (val: boolean) => {
          const nextState: Record<string, boolean> = {};
          distractingAppsList.forEach(app => {
            nextState[app.packageName] = val;
          });
          setDistractingAppsState(nextState);
        };

        return (
          <Modal
            visible={showAppSelectModal}
            transparent
            animationType="slide"
            onRequestClose={handleCancelStart}
          >
            <View style={styles.modalOverlay}>
              <SafeAreaView style={styles.modalSheet} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Apps to Block</Text>
                  <TouchableOpacity onPress={handleCancelStart} style={styles.modalCloseBtn} hitSlop={10}>
                    <Icon name="close" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBarContainer}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} style={styles.searchIcon}>
                    <Circle cx="11" cy="11" r="8" />
                    <Path d="M21 21l-4.3-4.3" />
                  </Svg>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search apps"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                  />
                </View>

                <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  {/* Group 1: YouTube */}
                  {('youtube'.includes(searchQuery.toLowerCase()) || searchQuery === '') && (
                    <View style={styles.modalGroupCard}>
                      {/* YouTube Master */}
                      <View style={styles.groupHeaderRow}>
                        <SelectAppIcon type="com.google.android.youtube" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.groupHeaderTitle}>YouTube and YouTube (R)</Text>
                          <Text style={styles.groupHeaderSubtitle}>Blocked completely</Text>
                        </View>
                        <Switch
                          value={ytBlocked}
                          onValueChange={setYtBlocked}
                          trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                          thumbColor="#ffffff"
                        />
                      </View>

                      {/* YouTube Suboptions */}
                      <View style={styles.groupSubOptions}>
                        <View style={styles.subOptionRow}>
                          <SelectAppIcon type="yt_shorts" size={24} />
                          <Text style={styles.subOptionLabel}>Block Shorts</Text>
                          <Switch
                            value={ytShorts}
                            onValueChange={setYtShorts}
                            trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                        <View style={styles.subOptionRow}>
                          <SelectAppIcon type="homepage" size={24} />
                          <Text style={styles.subOptionLabel}>Block homepage</Text>
                          <Switch
                            value={ytHomepage}
                            onValueChange={setYtHomepage}
                            trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                        <View style={styles.subOptionRow}>
                          <SelectAppIcon type="channels" size={24} />
                          <Text style={styles.subOptionLabel}>Block distracting channels</Text>
                          <Switch
                            value={ytChannels}
                            onValueChange={setYtChannels}
                            trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Group 2: Browser Apps */}
                  {('browser chrome internet'.includes(searchQuery.toLowerCase()) || searchQuery === '') && (
                    <View style={styles.modalGroupCard}>
                      {/* Browser Master */}
                      <View style={styles.groupHeaderRow}>
                        <SelectAppIcon type="chrome" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.groupHeaderTitle}>Browser apps</Text>
                          <Text style={styles.groupHeaderSubtitle}>Blocked completely</Text>
                        </View>
                        <Switch
                          value={browserBlocked}
                          onValueChange={setBrowserBlocked}
                          trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                          thumbColor="#ffffff"
                        />
                      </View>

                      {/* Browser Suboptions */}
                      <View style={styles.groupSubOptions}>
                        <View style={styles.subOptionRow}>
                          <SelectAppIcon type="incognito" size={24} />
                          <Text style={styles.subOptionLabel}>Block adult content</Text>
                          <Switch
                            value={browserAdult}
                            onValueChange={setBrowserAdult}
                            trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                        <View style={styles.subOptionRow}>
                          <SelectAppIcon type="globe" size={24} />
                          <Text style={styles.subOptionLabel}>Block distracting sites</Text>
                          <Switch
                            value={browserDistracting}
                            onValueChange={setBrowserDistracting}
                            trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Group 3: Distracting Apps list */}
                  {filteredDistractingApps.length > 0 && (
                    <View style={styles.modalGroupCard}>
                      {/* Category Header */}
                      <View style={styles.categoryHeaderRow}>
                        <TouchableOpacity
                          onPress={() => setDistractingCollapsed(!distractingCollapsed)}
                          style={styles.collapseToggle}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.collapseArrow}>
                            {distractingCollapsed ? '›' : 'v'}
                          </Text>
                          <Text style={styles.categoryTitle}>Distracting</Text>
                        </TouchableOpacity>

                        <Switch
                          value={isAnyDistractingChecked}
                          onValueChange={handleToggleDistractingMaster}
                          trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                          thumbColor="#ffffff"
                        />
                      </View>

                      {/* Apps List (collapsible) */}
                      {!distractingCollapsed && (
                        <View style={styles.categoryAppsList}>
                          {filteredDistractingApps.map((app) => (
                            <View key={app.packageName} style={styles.appOptionRow}>
                              <SelectAppIcon type={app.packageName} size={30} />
                              <Text style={styles.appOptionLabel}>{app.name}</Text>
                              <Switch
                                value={!!distractingAppsState[app.packageName]}
                                onValueChange={(val) => {
                                  setDistractingAppsState((prev) => ({
                                    ...prev,
                                    [app.packageName]: val,
                                  }));
                                }}
                                trackColor={{ true: '#7CF5B0', false: '#2C2C2E' }}
                                thumbColor="#ffffff"
                              />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                {/* Sticky Bottom Start Button */}
                <View style={styles.modalCtaContainer}>
                  <TouchableOpacity onPress={handleConfirmAndStart} style={styles.modalStartBtn} activeOpacity={0.95}>
                    <Text style={styles.modalStartBtnText}>Start Timer</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        );
      })()}
    </SafeAreaView>
  );
}

function SelectAppIcon({ type, size = 32 }: { type: string; size?: number }) {
  switch (type) {
    case 'com.facebook.katana':
    case 'Facebook':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#1877F2', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ color: '#fff', fontSize: size * 0.55, fontWeight: '800', marginTop: size * 0.05 }}>f</Text>
        </View>
      );
    case 'com.instagram.android':
    case 'Instagram':
      return (
        <View style={[styles.selBrandIcon, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
          <LinearGradient
            colors={['#C13584', '#E1306C', '#F77737']}
            style={StyleSheet.absoluteFill}
          />
          <View style={{
            width: size * 0.44,
            height: size * 0.44,
            borderRadius: size * 0.12,
            borderWidth: 1.2,
            borderColor: 'white',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <View style={{
              width: size * 0.16,
              height: size * 0.16,
              borderRadius: size * 0.08,
              borderWidth: 1.2,
              borderColor: 'white'
            }} />
          </View>
        </View>
      );
    case 'com.reddit.frontpage':
    case 'Reddit':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#FF4500', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ color: '#fff', fontSize: size * 0.45 }}>👽</Text>
        </View>
      );
    case 'com.google.android.youtube':
    case 'YouTube':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#FF0000', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ color: '#fff', fontSize: size * 0.35, fontWeight: '800' }}>▶</Text>
        </View>
      );
    case 'com.snapchat.android':
    case 'Snapchat':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#FFFC00', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ fontSize: size * 0.45 }}>👻</Text>
        </View>
      );
    case 'com.twitter.android':
    case 'X':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#000000', width: size, height: size, borderRadius: size / 2, borderWidth: 0.8, borderColor: '#222' }]}>
          <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '800' }}>𝕏</Text>
        </View>
      );
    case 'com.zhiliaoapp.musically':
    case 'TikTok':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#000000', width: size, height: size, borderRadius: size / 2, borderWidth: 0.8, borderColor: '#222' }]}>
          <Text style={{ color: '#00f2fe', fontSize: size * 0.45, fontWeight: '800' }}>d</Text>
        </View>
      );
    case 'yt_shorts':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#1C1C1E', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
            <Path d="M17.771 9.697l-1.985-1.166 1.996-1.171c2.158-1.266 2.871-4.04 1.591-6.176-1.279-2.136-4.082-2.842-6.241-1.575l-10.793 6.337c-1.611.946-2.527 2.766-2.316 4.6.21 1.833 1.513 3.376 3.284 3.864l2.254.622-2.265 1.33c-2.158 1.267-2.871 4.041-1.591 6.177 1.28 2.135 4.083 2.841 6.241 1.574l10.792-6.337c1.611-.947 2.527-2.767 2.317-4.601-.211-1.833-1.514-3.376-3.285-3.864zM10 14.5v-5l4.5 2.5-4.5 2.5z"/>
          </Svg>
        </View>
      );
    case 'homepage':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#1C1C1E', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Path d="M9 22V12h6v10" />
          </Svg>
        </View>
      );
    case 'channels':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#1C1C1E', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
            <Path d="M2 17h20M2 12h20M2 7h20" />
          </Svg>
        </View>
      );
    case 'chrome':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#F5F5F5', width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', height: '100%' }}>
            <View style={{ width: '50%', height: '50%', backgroundColor: '#EA4335' }} />
            <View style={{ width: '50%', height: '50%', backgroundColor: '#34A853' }} />
            <View style={{ width: '50%', height: '50%', backgroundColor: '#4285F4' }} />
            <View style={{ width: '50%', height: '50%', backgroundColor: '#FBBC05' }} />
          </View>
        </View>
      );
    case 'incognito':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#1C1C1E', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: size * 0.45 }}>🕵️</Text>
        </View>
      );
    case 'globe':
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#1C1C1E', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10M2 12h20" />
          </Svg>
        </View>
      );
    default:
      return (
        <View style={[styles.selBrandIcon, { backgroundColor: '#3A3A3C', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '800' }}>
            {(type || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      );
  }
}

/* ──────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    // Clears the absolutely-positioned bottom tab bar so the essentials row
    // at the end of this screen isn't hidden underneath it.
    paddingBottom: 110,
  },

  /* Title */
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  motivation: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13.5,
    marginBottom: 8,
  },

  /* ── LCD Card ── */
  lcdCard: {
    width: '100%',
    height: 150,
    borderRadius: 28,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  lcdGhost: {
    position: 'absolute',
    color: ORANGE_DIM,
    fontSize: 80,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 8,
  },
  lcdDigits: {
    color: ORANGE,
    fontSize: 80,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 8,
  },
  lcdColon: {
    color: ORANGE,
  },
  durationStepRow: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },

  /* ── Controls row ── */
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  /* ── Preset grid ── */
  presetsGrid: {
    flex: 1,
    gap: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetTile: {
    flex: 1,
    minHeight: 82,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    padding: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  presetTileSel: {
    backgroundColor: SELECTED_BG,
  },
  presetTileTall: {
    minHeight: 130,
  },
  lockIcon: {
    position: 'absolute',
    top: 12,
    left: 14,
    fontSize: 13,
  },
  presetVal: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
  },
  presetValSel: {
    color: SELECTED_TEXT,
  },
  presetValBig: {
    fontSize: 46,
  },
  presetSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  presetSubSel: {
    color: 'rgba(0,0,0,0.45)',
  },

  /* ── Vertical slider ── */
  sliderCol: {
    width: 56,
    alignItems: 'center',
    gap: 10,
  },
  sliderTrack: {
    width: 50,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: CARD_BG,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTick: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sliderTickActive: {
    backgroundColor: ORANGE,
    height: 4,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderBtns: {
    gap: 6,
  },
  chevronBtn: {
    width: 44,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Slide to start ── */
  slideTrack: {
    width: '100%',
    height: SLIDE_TRACK_H,
    borderRadius: SLIDE_TRACK_H / 2,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SLIDE_PAD,
    position: 'relative',
    marginBottom: 8,
  },
  slideBtn: {
    width: SLIDE_BTN,
    height: SLIDE_BTN,
    borderRadius: SLIDE_BTN / 2,
    backgroundColor: SELECTED_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  essentialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 14,
  },
  sosBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF3B5F', // Pinkish red matching the screenshot
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  essentialsTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  essentialsSub: { color: 'rgba(255,255,255,0.45)', fontSize: 13.5, marginTop: 3 },
  essentialsChevron: { color: 'rgba(255,255,255,0.35)', fontSize: 20 },
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

  /* ── Locked full-screen mode ── */
  lockedContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  lockedCornerBtnLeft: {
    position: 'absolute',
    top: 14,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  lockedCornerIcon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  lockedCornerRight: {
    position: 'absolute',
    top: 14,
    right: 20,
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 5,
  },
  lockedShieldBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedShieldIcon: {
    fontSize: 16,
  },
  lockedEmergencyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,59,95,0.14)',
  },
  lockedEmergencyText: {
    color: '#FF6B87',
    fontSize: 12.5,
    fontWeight: '700',
  },
  lockedBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 30,
  },
  lockedLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    fontWeight: '600',
  },
  lockedDigits: {
    color: ORANGE,
    fontSize: 64,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 6,
  },
  lockedMotivation: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },

  /* ── Cancel-for-token confirm ── */
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#141517',
    borderRadius: 26,
    padding: 24,
    gap: 14,
  },
  confirmTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  confirmAccent: {
    color: ORANGE,
    fontWeight: '700',
  },
  confirmSpendBtn: {
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: ORANGE,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmSpendBtnDisabled: {
    opacity: 0.35,
  },
  confirmSpendText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmKeepBtn: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmKeepText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '600',
  },

  /* ── App Select Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0c0d0e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  modalScrollBody: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  modalGroupCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
  },
  groupHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  groupHeaderSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12.5,
    marginTop: 2,
  },
  groupSubOptions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
    gap: 10,
  },
  subOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  subOptionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14.5,
    fontWeight: '600',
    flex: 1,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  collapseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    paddingVertical: 4,
  },
  collapseArrow: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: 'bold',
    width: 14,
  },
  categoryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  categoryAppsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
    gap: 12,
  },
  appOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  appOptionLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  modalCtaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0c0d0e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  modalStartBtn: {
    backgroundColor: '#ffffff',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalStartBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  selBrandIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
