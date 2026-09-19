import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockedSelection from '../components/BlockedSelection';
import { keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { INTENSITIES, IntensityKey, getIntensity } from '../data/themes';
import { palette, space } from '../design/tokens';
import Icon from '../ui/Icon';

/** Real, editable blocked-apps list — replaces the old mock AppPickerScreen
 *  /MyAppsScreen, which had no actual Android package identifiers wired to
 *  anything. This is what ByreAccessibilityService actually checks against
 *  on Android. There's no installed-app enumeration here (that needs another
 *  native call this doesn't have yet), so adding beyond the curated default
 *  list means typing the exact package name — labeled honestly below. */
export default function BlockedAppsScreen({
  blockedPackages,
  onChange,
  appModes,
  onChangeModes,
  defaultMode,
  pausedPackages = [],
  onChangePaused,
  pauseSeconds = 6,
  onChangePauseSeconds,
  onBack,
}: {
  blockedPackages: string[];
  onChange: (packages: string[]) => void;
  /** Per-app strictness. Anything absent follows `defaultMode`. */
  appModes?: Record<string, IntensityKey>;
  onChangeModes?: (next: Record<string, IntensityKey>) => void;
  defaultMode?: IntensityKey;
  /** Android only: apps that get a countdown instead of a block. */
  pausedPackages?: string[];
  onChangePaused?: (packages: string[]) => void;
  pauseSeconds?: number;
  onChangePauseSeconds?: (seconds: number) => void;
  onBack: () => void;
}) {
  const modeFor = (pkg: string): IntensityKey => appModes?.[pkg] ?? defaultMode ?? 'steady';
  const cycleMode = (pkg: string) => {
    const order: IntensityKey[] = INTENSITIES.map((i) => i.key);
    const next = order[(order.indexOf(modeFor(pkg)) + 1) % order.length];
    onChangeModes?.({ ...(appModes ?? {}), [pkg]: next });
  };
  const [customInput, setCustomInput] = useState('');
  const customPackages = blockedPackages.filter((p) => !DEFAULT_BLOCKED_APPS.some((a) => a.packageName === p));

  const toggle = (packageName: string) => {
    if (blockedPackages.includes(packageName)) {
      onChange(blockedPackages.filter((p) => p !== packageName));
    } else {
      onChange([...blockedPackages, packageName]);
    }
  };

  /** An app is blocked or paused, never both — the native service resolves a
   *  conflict in favour of blocked, but the UI should never create one. */
  const togglePause = (packageName: string) => {
    if (!onChangePaused) return;
    if (pausedPackages.includes(packageName)) {
      onChangePaused(pausedPackages.filter((p) => p !== packageName));
      return;
    }
    if (blockedPackages.includes(packageName)) onChange(blockedPackages.filter((p) => p !== packageName));
    onChangePaused([...pausedPackages, packageName]);
  };

  const addCustom = () => {
    const pkg = customInput.trim();
    if (!pkg || blockedPackages.includes(pkg)) return;
    onChange([...blockedPackages, pkg]);
    setCustomInput('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Blocked apps</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* iOS gets a different screen entirely: the package-name list below is
          Android's mechanism, and on iOS it is neither real nor editable. */}
      {Platform.OS === 'ios' ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Blocked right now</Text>
          <BlockedSelection />
        </ScrollView>
      ) : (
      <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          {...keyboardScrollProps}
        >
        {Platform.OS !== 'android' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              This list only applies on Android. On iOS, apps are chosen through Apple's own picker during setup —
              see Screen Time access in onboarding.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Common distractions</Text>
        <View style={styles.group}>
          {DEFAULT_BLOCKED_APPS.map((app, i) => (
            <View key={app.packageName} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => blockedPackages.includes(app.packageName) && cycleMode(app.packageName)}
              >
                <Text style={styles.rowTitle}>{app.name}</Text>
                <Text style={styles.rowSub}>
                  {blockedPackages.includes(app.packageName)
                    ? `${getIntensity(modeFor(app.packageName)).name} · tap to change`
                    : app.packageName}
                </Text>
              </Pressable>
              <Switch
                value={blockedPackages.includes(app.packageName)}
                onValueChange={() => toggle(app.packageName)}
                trackColor={{ true: palette.accent, false: 'rgba(255,255,255,0.2)' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* The setting between "blocked" and "fine".
            Most of what people open compulsively is not something they have
            decided to stop opening — it is a reach with no thought in it. A
            challenge there is too much friction and gets the whole app turned
            off; nothing at all is too little. A countdown with a way out is
            the honest middle, and it is Android-only because iOS gives no way
            to interpose on an app launch at all. */}
        {!!onChangePaused && (
          <>
            <Text style={styles.sectionLabel}>Slow it down</Text>
            <Text style={styles.pauseIntro}>
              These still open — after {pauseSeconds} seconds of nothing, and a way back out. For
              the ones you open without deciding to.
            </Text>
            <View style={styles.group}>
              {DEFAULT_BLOCKED_APPS.map((app, i) => (
                <View key={`pause-${app.packageName}`} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{app.name}</Text>
                    <Text style={styles.rowSub}>
                      {blockedPackages.includes(app.packageName)
                        ? 'Blocked — turn this on to pause instead'
                        : pausedPackages.includes(app.packageName)
                          ? `Pauses for ${pauseSeconds}s`
                          : 'Opens normally'}
                    </Text>
                  </View>
                  <Switch
                    value={pausedPackages.includes(app.packageName)}
                    onValueChange={() => togglePause(app.packageName)}
                    trackColor={{ true: palette.accent, false: 'rgba(255,255,255,0.2)' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>

            {!!onChangePauseSeconds && (
              <View style={styles.pauseRow}>
                <Text style={styles.rowTitle}>How long</Text>
                <View style={styles.stepper}>
                  {[4, 6, 10, 15].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => onChangePauseSeconds(n)}
                      style={[styles.step, pauseSeconds === n && styles.stepOn]}
                    >
                      <Text style={[styles.stepText, pauseSeconds === n && styles.stepTextOn]}>{n}s</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {customPackages.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Custom</Text>
            <View style={styles.group}>
              {customPackages.map((pkg, i) => (
                <View key={pkg} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <Text style={[styles.rowTitle, { flex: 1 }]}>{pkg}</Text>
                  <Pressable onPress={() => onChange(blockedPackages.filter((p) => p !== pkg))} style={styles.removeBtn} hitSlop={8}>
                    <Icon name="close" size={12} color={palette.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Add by package name</Text>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.addRow}>
          <TextInput
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="e.g. com.pinterest"
            placeholderTextColor={palette.textTertiary}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={addCustom} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </Animated.View>
        <Text style={styles.hint}>
          Find an app's package name in its Play Store URL — the part after id= (e.g. play.google.com/store/apps/details?id=com.pinterest).
        </Text>
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerGlyph: { color: palette.text, fontSize: 19 },
  headerTitle: { color: palette.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: space.tabClearance },
  notice: { backgroundColor: 'rgba(255,213,79,0.08)', borderRadius: 16, padding: 14, marginBottom: 8 },
  noticeText: { color: 'rgba(255,213,79,0.9)', fontSize: 12.5, lineHeight: 18 },
  sectionLabel: { color: palette.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  pauseIntro: { color: palette.textSecondary, fontSize: 13, lineHeight: 19, marginTop: -4, marginBottom: 12 },
  pauseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  stepper: { flexDirection: 'row', gap: 6 },
  step: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stepOn: { borderColor: palette.accentBorder, backgroundColor: palette.accentSoft },
  stepText: { color: palette.textSecondary, fontSize: 13.5, fontWeight: '600' },
  stepTextOn: { color: palette.accent, fontWeight: '700' },
  group: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  rowTitle: { color: palette.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: palette.textTertiary, fontSize: 11.5, marginTop: 2 },
  removeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { color: palette.textSecondary, fontSize: 12 },
  addRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 16, backgroundColor: palette.glass, color: palette.text, fontSize: 14 },
  addBtn: { paddingHorizontal: 20, borderRadius: 16, backgroundColor: 'rgba(71,107,235,0.15)', borderWidth: 1, borderColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  hint: { color: palette.textTertiary, fontSize: 11.5, lineHeight: 16, marginTop: 8 },
});
