import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Rect, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';

const { width } = Dimensions.get('window');

/** Package name → friendly label, falling back to the last path segment so
 *  a custom-added package still reads as something rather than raw
 *  reverse-DNS. */
function appLabel(packageName: string): string {
  const known = DEFAULT_BLOCKED_APPS.find((a) => a.packageName === packageName);
  if (known) return known.name;
  const parts = packageName.split('.');
  const tail = parts.length > 1 ? parts[parts.length - 1] : packageName;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

function toMinutes(hhmm: string): number | null {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Live "5h 25m left" / "Starts in 10h" instead of the old hardcoded text.
 *  Handles windows that wrap past midnight (e.g. 22:00 → 07:00). */
function scheduleStatus(start: string, end: string, now = new Date()): { active: boolean; label: string } {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return { active: false, label: 'Not set' };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const wraps = s > e;
  const active = wraps ? nowMin >= s || nowMin < e : nowMin >= s && nowMin < e;

  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  if (active) {
    const until = e > nowMin ? e - nowMin : 24 * 60 - nowMin + e;
    return { active: true, label: `${fmt(until)} left` };
  }
  const untilStart = s > nowMin ? s - nowMin : 24 * 60 - nowMin + s;
  return { active: false, label: `Starts in ${fmt(untilStart)}` };
}

// Branded App Icon (simulated vector icon with lock overlay option)
function AppIcon({ name, size = 54, hasLock = true }: { name: string; size?: number; hasLock?: boolean }) {
  const renderInner = () => {
    switch (name) {
      case 'Facebook':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#1877F2', width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.brandText, { fontSize: size * 0.52, fontWeight: '800', marginTop: size * 0.08 }]}>f</Text>
          </View>
        );
      case 'Flipkart':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#FFD54F', width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.brandText, { color: '#1976D2', fontSize: size * 0.5, fontWeight: '900', fontStyle: 'italic' }]}>F</Text>
          </View>
        );
      case 'Instagram':
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
              borderWidth: 2,
              borderColor: 'white',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <View style={{
                width: size * 0.16,
                height: size * 0.16,
                borderRadius: size * 0.08,
                borderWidth: 2,
                borderColor: 'white'
              }} />
            </View>
          </View>
        );
      case 'LinkedIn':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#0A66C2', width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.brandText, { fontSize: size * 0.38, fontWeight: '800' }]}>in</Text>
          </View>
        );
      case 'Reddit':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#FF4500', width: size, height: size, borderRadius: size / 2 }]}>
            <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 20 20" fill="white">
              <Circle cx="10" cy="11" r="6" />
              <Circle cx="3" cy="11" r="1.5" />
              <Circle cx="17" cy="11" r="1.5" />
              <Path d="M 10 5 L 12 2" stroke="white" strokeWidth="1" />
              <Circle cx="12" cy="2" r="1" />
              <Circle cx="8" cy="11" r="0.75" fill="#FF4500" />
              <Circle cx="12" cy="11" r="0.75" fill="#FF4500" />
              <Path d="M 8 13.5 Q 10 15 12 13.5" stroke="white" strokeWidth="0.8" fill="none" />
            </Svg>
          </View>
        );
      case 'Gmail':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#F5F5F5', width: size, height: size, borderRadius: size / 2 }]}>
            <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
              <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="#E0E0E0" />
              <Path d="M22 6v12c0 1.1-.9 2-2 2h-3V8l-7 5-7-5v12H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2z" fill="#B0BEC5" />
              <Path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        );
      case 'Maps':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#E8F5E9', width: size, height: size, borderRadius: size / 2 }]}>
            <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#34A853" />
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 2.2 1 4.5 2.5 6.5L12 22l4.5-6.5C18 13.5 19 11.2 19 9c0-3.87-3.13-7-7-7z" fill="#4285F4" />
              <Path d="M12 6c-1.66 0-3 1.34-3 3 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.66-1.34-3-3-3z" fill="#EA4335" />
              <Circle cx="12" cy="9" r="2" fill="white" />
            </Svg>
          </View>
        );
      case 'Messages':
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#1A73E8', width: size, height: size, borderRadius: size / 2 }]}>
            <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="white" />
              <Path d="M8 7h8M8 11h5" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </View>
        );
      default:
        // Unknown app: initial on a neutral tile beats a meaningless "?".
        return (
          <View style={[styles.brandIcon, { backgroundColor: '#3A3A3C', width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.brandText, { fontSize: size * 0.4, fontWeight: '800' }]}>
              {(name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {renderInner()}
      {hasLock && (
        <View style={styles.lockOverlay}>
          <Svg width={size * 0.38} height={size * 0.38} viewBox="0 0 24 24" fill="white">
            <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </Svg>
        </View>
      )}
    </View>
  );
}

// Blocked App Tile component with neon glow border
function BlockedAppTile({ name, onUnblock }: { name: string; onUnblock: () => void }) {
  return (
    <View style={styles.blockedAppContainer}>
      <Pressable onPress={onUnblock} style={styles.glowOuterCircle}>
        <AppIcon name={name} size={50} hasLock={true} />
      </Pressable>
      <Text style={styles.appNameText} numberOfLines={1}>{name}</Text>
      <Pressable onPress={onUnblock}>
        <Text style={styles.unblockText}>Unblock</Text>
      </Pressable>
    </View>
  );
}

// Rules graphic (Calendar arrow Shield)
function RulesGraphic({ active }: { active: boolean }) {
  const color = active ? '#7CF5B0' : 'rgba(255,255,255,0.3)';
  return (
    <Svg width={72} height={26} viewBox="0 0 72 26" fill="none">
      {/* Calendar */}
      <Rect x="1" y="4" width="16" height="16" rx="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M5 2.5v3M12 2.5v3M1 9h16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="5" cy="13" r="0.8" fill={color} />
      <Circle cx="12" cy="13" r="0.8" fill={color} />
      <Circle cx="5" cy="17" r="0.8" fill={color} />
      <Circle cx="12" cy="17" r="0.8" fill={color} />

      {/* Right Arrow */}
      <Path d="M26 12h10M32 9l3 3-3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Shield */}
      <Path
        d="M52 4c5 0 8-1.5 8-1.5s0 7 0 9c0 5-3.5 8-8 9.5-4.5-1.5-8-4.5-8-9.5 0-2 0-9 0-9s3 1.5 8 1.5z"
        stroke={color}
        strokeWidth="1.8"
        fill={active ? 'rgba(124,245,176,0.14)' : 'none'}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Rules Card
function RuleCard({ name, status, active, appsCount }: { name: string; status: string; active: boolean; appsCount: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={[styles.ruleCard, active && styles.ruleCardActive]}>
      {active && (
        <LinearGradient
          colors={['rgba(124,245,176,0.06)', 'rgba(0,0,0,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.ruleCardTop}>
        <RulesGraphic active={active} />
      </View>
      <View style={[styles.statusPill, active ? styles.statusPillActive : styles.statusPillInactive]}>
        <Text style={[styles.statusText, active ? styles.statusTextActive : styles.statusTextInactive]}>
          {status}
        </Text>
      </View>
      <View>
        <Text style={styles.ruleNameText} numberOfLines={2}>{name}</Text>
        <Text style={styles.ruleSubtitleText}>{appsCount}</Text>
      </View>
    </Animated.View>
  );
}

// Folder Card (2x2 preview)
function FolderCard({
  name,
  subtitle,
  type,
  onPress,
}: {
  name: string;
  subtitle: string;
  type: 'distracting' | 'always' | 'never';
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.folderContainer} onPress={onPress}>
      <View style={styles.folderTile}>
        {type === 'distracting' && (
          <View style={styles.folderGrid}>
            <AppIcon name="Facebook" size={28} hasLock={false} />
            <AppIcon name="Flipkart" size={28} hasLock={false} />
            <AppIcon name="Instagram" size={28} hasLock={false} />
            <View style={styles.plusMoreTile}>
              <Text style={styles.plusMoreText}>+2</Text>
            </View>
          </View>
        )}
        {type === 'always' && (
          <View style={styles.folderGrid}>
            <AppIcon name="Gmail" size={28} hasLock={false} />
            <AppIcon name="Maps" size={28} hasLock={false} />
            <AppIcon name="Messages" size={28} hasLock={false} />
            <View style={styles.plusMoreTile}>
              <Text style={styles.plusMoreText}>+2</Text>
            </View>
          </View>
        )}
        {type === 'never' && (
          <View style={styles.neverAllowedCenter}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.8}>
              <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <Circle cx="12" cy="12" r="3" />
            </Svg>
            <View style={styles.neverLockBadge}>
              <Text style={{ fontSize: 9, color: 'white' }}>🔒</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.folderTitleText}>{name}</Text>
      <Text style={styles.folderSubtitleText}>{subtitle}</Text>
    </Pressable>
  );
}

// Padlock SVG Icon
function PadlockIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5}>
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

export default function MyAppsScreen({
  blockedPackages = [],
  onUnblockPackage,
  onOpenBlockedApps,
  onOpenSchedules,
  onOpenEssentials,
  onOpenBlocks,
  schedules = [],
}: {
  blockedPackages?: string[];
  onUnblockPackage?: (packageName: string) => void;
  onOpenBlockedApps?: () => void;
  onOpenSchedules?: () => void;
  onOpenEssentials?: () => void;
  onOpenBlocks?: () => void;
  schedules?: { id: string; name: string; start: string; end: string; days: string }[];
}) {
  const blockedApps = blockedPackages.map((pkg) => ({ packageName: pkg, name: appLabel(pkg) }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Apps Header title */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Apps</Text>
        </View>

        {/* Block apps Card */}
        <Pressable onPress={onOpenBlocks} style={styles.blockAppsCard}>
          <View style={styles.blockAppsIconContainer}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7CF5B0" strokeWidth={2.5}>
              <Rect x="3" y="11" width="18" height="11" rx="2" />
              <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockAppsTitle}>Block apps</Text>
            <Text style={styles.blockAppsSubtitle}>Set daily app limits, block shorts, and restrict websites.</Text>
          </View>
          <Text style={styles.blockAppsChevron}>›</Text>
        </Pressable>

        {/* Blocked Apps section */}
        <View style={styles.sectionRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PadlockIcon />
            <Text style={styles.sectionTitle}>Blocked apps</Text>
          </View>
          <Pressable style={styles.circleArrowBtn} hitSlop={8} onPress={onOpenBlockedApps}>
            <Text style={styles.arrowGlyph}>➔</Text>
          </Pressable>
        </View>

        {blockedApps.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.blockedScroll}
          >
            {blockedApps.map((app) => (
              <BlockedAppTile
                key={app.packageName}
                name={app.name}
                onUnblock={() => onUnblockPackage?.(app.packageName)}
              />
            ))}
          </ScrollView>
        ) : (
          <Pressable style={styles.emptyBlockedView} onPress={onOpenBlockedApps}>
            <Text style={styles.emptyBlockedText}>
              Nothing is blocked yet. Tap to choose which apps should trigger the shield.
            </Text>
          </Pressable>
        )}

        {/* Rules section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Rules</Text>
          <Pressable style={styles.circleArrowBtn} hitSlop={8} onPress={onOpenSchedules}>
            <Text style={styles.arrowGlyph}>➔</Text>
          </Pressable>
        </View>

        {schedules.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rulesScroll}
          >
            {schedules.map((rule) => {
              const status = scheduleStatus(rule.start, rule.end);
              return (
                <Pressable key={rule.id} onPress={onOpenSchedules}>
                  <RuleCard
                    name={rule.name}
                    status={status.label}
                    active={status.active}
                    appsCount={`${blockedApps.length} app${blockedApps.length === 1 ? '' : 's'} blocked`}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Pressable style={styles.emptyBlockedView} onPress={onOpenSchedules}>
            <Text style={styles.emptyBlockedText}>
              No recurring rules yet. Tap to add a window like Work Time or Sleep.
            </Text>
          </Pressable>
        )}

        {/* Apps folders section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Apps</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foldersScroll}
        >
          <FolderCard
            name="Distracting"
            subtitle={`${blockedApps.length} item${blockedApps.length === 1 ? '' : 's'}`}
            type="distracting"
            onPress={onOpenBlockedApps}
          />
          <FolderCard
            name="Always allowed"
            subtitle="Essentials"
            type="always"
            onPress={onOpenEssentials}
          />
          <FolderCard name="Never allowed" subtitle="Hidden" type="never" onPress={onOpenBlockedApps} />
        </ScrollView>
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
    paddingTop: 12,
    paddingBottom: 130,
  },
  titleRow: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  circleArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlyph: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: -1,
  },
  blockedScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 16,
  },
  emptyBlockedView: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  emptyBlockedText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  blockedAppContainer: {
    alignItems: 'center',
    width: 76,
  },
  glowOuterCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.2,
    borderColor: '#c6f850', // neon yellow-green border
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c6f850',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 8,
  },
  appNameText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    width: '100%',
  },
  unblockText: {
    color: '#7CF5B0',
    fontSize: 12,
    fontWeight: '600',
  },
  rulesScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },
  ruleCard: {
    width: 155,
    height: 180,
    borderRadius: 24,
    backgroundColor: '#0c0d0e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  ruleCardActive: {
    borderColor: 'rgba(124, 245, 176, 0.22)',
    backgroundColor: '#0a0d0a',
  },
  ruleCardTop: {
    alignItems: 'flex-start',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusPillActive: {
    backgroundColor: 'rgba(124, 245, 176, 0.12)',
  },
  statusPillInactive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#7CF5B0',
  },
  statusTextInactive: {
    color: 'rgba(255,255,255,0.5)',
  },
  ruleNameText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  ruleSubtitleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  foldersScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },
  folderContainer: {
    width: 150,
  },
  folderTile: {
    width: 150,
    height: 150,
    borderRadius: 24,
    backgroundColor: '#0c0d0e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  folderGrid: {
    width: 72,
    height: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusMoreTile: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusMoreText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  neverAllowedCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  neverLockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#0c0d0e',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderTitleText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  folderSubtitleText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#ffffff',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockAppsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: '#0c0d0e',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 245, 176, 0.22)',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#7CF5B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  blockAppsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 245, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockAppsTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  blockAppsSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
  blockAppsChevron: {
    color: '#7CF5B0',
    fontSize: 26,
    fontWeight: '300',
    marginLeft: 6,
  },
});
