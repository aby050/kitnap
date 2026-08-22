import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { AppLimit } from '../data/store';
import Icon from '../ui/Icon';

// Default distraction apps we can choose to add limits to
const AVAILABLE_APPS = [
  { name: 'Instagram', packageName: 'com.instagram.android' },
  { name: 'Facebook', packageName: 'com.facebook.katana' },
  { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { name: 'X (Twitter)', packageName: 'com.twitter.android' },
  { name: 'YouTube', packageName: 'com.google.android.youtube' },
  { name: 'Snapchat', packageName: 'com.snapchat.android' },
  { name: 'Reddit', packageName: 'com.reddit.frontpage' },
];

const SHORTS_APPS = [
  { name: 'YouTube Shorts', iconType: 'yt_shorts' },
  { name: 'IG Reels', iconType: 'ig_reels' },
  { name: 'Snapchat Spotlight', iconType: 'snap_spotlight' },
  { name: 'Facebook Reels', iconType: 'fb_reels' },
];

function AppIcon({ type, size = 38 }: { type: string; size?: number }) {
  switch (type) {
    case 'Facebook':
    case 'com.facebook.katana':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#1877F2', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.52, fontWeight: '800', marginTop: size * 0.08 }]}>f</Text>
        </View>
      );
    case 'Instagram':
    case 'com.instagram.android':
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
    case 'TikTok':
    case 'com.zhiliaoapp.musically':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#000000', width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: '#333' }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.45, fontWeight: '800', color: '#00f2fe' }]}>d</Text>
        </View>
      );
    case 'YouTube':
    case 'com.google.android.youtube':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#FF0000', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.35, fontWeight: '800' }]}>▶</Text>
        </View>
      );
    case 'Snapchat':
    case 'com.snapchat.android':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#FFFC00', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.45, color: '#000' }]}>👻</Text>
        </View>
      );
    case 'Reddit':
    case 'com.reddit.frontpage':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#FF4500', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.4 }]}>👽</Text>
        </View>
      );
    case 'X (Twitter)':
    case 'com.twitter.android':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#000000', width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: '#222' }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.4, fontWeight: '800' }]}>𝕏</Text>
        </View>
      );
    case 'yt_shorts':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#FF0000', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
            <Path d="M17.771 9.697l-1.985-1.166 1.996-1.171c2.158-1.266 2.871-4.04 1.591-6.176-1.279-2.136-4.082-2.842-6.241-1.575l-10.793 6.337c-1.611.946-2.527 2.766-2.316 4.6.21 1.833 1.513 3.376 3.284 3.864l2.254.622-2.265 1.33c-2.158 1.267-2.871 4.041-1.591 6.177 1.28 2.135 4.083 2.841 6.241 1.574l10.792-6.337c1.611-.947 2.527-2.767 2.317-4.601-.211-1.833-1.514-3.376-3.285-3.864zM10 14.5v-5l4.5 2.5-4.5 2.5z"/>
          </Svg>
        </View>
      );
    case 'ig_reels':
      return (
        <View style={[styles.brandIcon, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
          <LinearGradient
            colors={['#C13584', '#E1306C', '#F77737']}
            style={StyleSheet.absoluteFill}
          />
          <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white" style={{ alignSelf: 'center', marginTop: size * 0.1 }}>
            <Rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="white" strokeWidth="2" />
            <Path d="M2 8h20M2 16h20M8 2v20M16 2v20" stroke="white" strokeWidth="1.5" />
            <Path d="M10 10l5 2.5-5 2.5v-5z" fill="white" />
          </Svg>
        </View>
      );
    case 'snap_spotlight':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#FFFC00', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={{ fontSize: size * 0.45 }}>👻</Text>
        </View>
      );
    case 'fb_reels':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#1877F2', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
            <Path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
          </Svg>
        </View>
      );
    case 'websites':
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#2C2C2E', width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10M2 12h20" />
          </Svg>
        </View>
      );
    default:
      return (
        <View style={[styles.brandIcon, { backgroundColor: '#3A3A3C', width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.brandText, { fontSize: size * 0.4, fontWeight: '800' }]}>
            {(type || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      );
  }
}

// Convert minutes to pretty label (e.g. 80 -> "1h 20m Limit")
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m Limit`;
  return m === 0 ? `${h}h Limit` : `${h}h ${m}m Limit`;
}

interface BlocksScreenProps {
  appLimits: AppLimit[];
  onSaveLimits: (limits: AppLimit[]) => void;
  onBack: () => void;
}

export default function BlocksScreen({
  appLimits = [],
  onSaveLimits,
  onBack,
}: BlocksScreenProps) {
  const [selectedApp, setSelectedApp] = useState<{ name: string; packageName: string } | null>(null);
  const [showAddList, setShowAddList] = useState(false);

  const openAppConfig = (appName: string, packageName: string) => {
    setSelectedApp({ name: appName, packageName });
  };

  const handleSaveLimit = (limit: AppLimit) => {
    const exists = appLimits.some((l) => l.packageName === limit.packageName);
    let nextLimits: AppLimit[];
    if (exists) {
      nextLimits = appLimits.map((l) =>
        l.packageName === limit.packageName ? limit : l
      );
    } else {
      nextLimits = [...appLimits, limit];
    }
    onSaveLimits(nextLimits);
    setSelectedApp(null);
  };

  const handleDeleteLimit = (packageName: string) => {
    const nextLimits = appLimits.filter((l) => l.packageName !== packageName);
    onSaveLimits(nextLimits);
    setSelectedApp(null);
  };

  // Get active limit for a package
  const getLimitFor = (packageName: string) => {
    return appLimits.find((l) => l.packageName === packageName);
  };

  // Suggestions to display if they are not already active
  const suggestions = [
    { name: 'Facebook', packageName: 'com.facebook.katana' },
    { name: 'Instagram', packageName: 'com.instagram.android' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Blocks</Text>
        </View>
        {/* Help button removed until there's a real support destination to send it to. */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* App Limits Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>App Limits</Text>
          <Pressable onPress={() => setShowAddList(true)} style={styles.addAppTextBtn}>
            <Text style={styles.addAppText}>+ Add App</Text>
          </Pressable>
        </View>

        {/* Dynamic App Limits List */}
        <View style={styles.listContainer}>
          {/* Active Limits */}
          {appLimits.map((limit) => (
            <Pressable
              key={limit.packageName}
              style={[styles.appRow, styles.appRowActive]}
              onPress={() => openAppConfig(limit.appName, limit.packageName)}
            >
              <AppIcon type={limit.packageName} />
              <View style={styles.appRowMiddle}>
                <Text style={styles.appName}>{limit.appName}</Text>
                <Text style={styles.appLimitText}>{formatMinutes(limit.limitMinutes)}</Text>
              </View>
              <Pressable
                onPress={() => openAppConfig(limit.appName, limit.packageName)}
                style={styles.actionBtnActive}
              >
                <Text style={styles.actionTextActive}>Edit</Text>
              </Pressable>
            </Pressable>
          ))}

          {/* Suggested limits if not already active */}
          {suggestions.map((sug) => {
            const isActive = getLimitFor(sug.packageName);
            if (isActive) return null;
            return (
              <Pressable
                key={sug.packageName}
                style={[styles.appRow, styles.appRowMock]}
                onPress={() => openAppConfig(sug.name, sug.packageName)}
              >
                <AppIcon type={sug.packageName} />
                <View style={styles.appRowMiddle}>
                  <Text style={styles.appName}>{sug.name}</Text>
                  <Text style={styles.appLimitTextMock}>No limit set</Text>
                </View>
                <Pressable
                  onPress={() => openAppConfig(sug.name, sug.packageName)}
                  style={styles.actionBtnAdd}
                >
                  <Text style={styles.actionTextAdd}>+ Add</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Block Shorts Section */}
        <View style={[styles.sectionRow, { marginTop: 32 }]}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.sectionTitle}>Block Shorts</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
        </View>

        <View style={styles.listContainer}>
          {SHORTS_APPS.map((app) => (
            <View key={app.name} style={styles.solidCardRow}>
              <AppIcon type={app.iconType} />
              <Text style={styles.solidCardName}>{app.name}</Text>
              {/* Pro feature, not built yet — honest "coming soon" rather
                  than a button that silently does nothing when tapped. */}
              <View style={[styles.actionBtnAdd, styles.actionBtnDisabled]}>
                <Text style={styles.actionTextDisabled}>Soon</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Other Blocks Section */}
        <View style={[styles.sectionRow, { marginTop: 32 }]}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.sectionTitle}>Other blocks</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.solidCardRow}>
            <AppIcon type="websites" />
            <Text style={styles.solidCardName}>Block Websites</Text>
            <View style={[styles.actionBtnAdd, styles.actionBtnDisabled]}>
              <Text style={styles.actionTextDisabled}>Soon</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Select App to Add Modal */}
      {showAddList && (
        <Modal transparent animationType="fade" visible={showAddList} onRequestClose={() => setShowAddList(false)}>
          <Pressable style={styles.dropdownOverlay} onPress={() => setShowAddList(false)}>
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Choose an App</Text>
              {AVAILABLE_APPS.map((app) => {
                const limitExists = getLimitFor(app.packageName);
                return (
                  <Pressable
                    key={app.packageName}
                    style={[styles.dropdownItem, limitExists && styles.dropdownItemDisabled]}
                    onPress={() => {
                      if (!limitExists) {
                        setShowAddList(false);
                        openAppConfig(app.name, app.packageName);
                      }
                    }}
                  >
                    <AppIcon type={app.packageName} size={28} />
                    <Text style={[styles.dropdownText, limitExists && { color: 'rgba(255,255,255,0.25)' }]}>
                      {app.name} {limitExists ? '(Limit exists)' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Config Sheet Modal */}
      {selectedApp && (
        <AppLimitModal
          app={selectedApp}
          currentLimit={getLimitFor(selectedApp.packageName)}
          onClose={() => setSelectedApp(null)}
          onSave={handleSaveLimit}
          onDelete={handleDeleteLimit}
        />
      )}
    </SafeAreaView>
  );
}

interface AppLimitModalProps {
  app: { name: string; packageName: string };
  currentLimit?: AppLimit;
  onClose: () => void;
  onSave: (limit: AppLimit) => void;
  onDelete: (packageName: string) => void;
}

function AppLimitModal({
  app,
  currentLimit,
  onClose,
  onSave,
  onDelete,
}: AppLimitModalProps) {
  const [minutes, setMinutes] = useState(currentLimit ? currentLimit.limitMinutes : 60);
  const [emergencyUses, setEmergencyUses] = useState(currentLimit ? currentLimit.emergencyUses : 2);
  const [showReminders, setShowReminders] = useState(currentLimit ? currentLimit.showReminders : true);
  const [strictMode, setStrictMode] = useState(currentLimit ? currentLimit.strictMode : false);
  const [showLimitPicker, setShowLimitPicker] = useState(false);

  const presets = [
    { label: '15m', val: 15 },
    { label: '30m', val: 30 },
    { label: '1h', val: 60 },
    { label: '1h 30m', val: 90 },
    { label: '2h', val: 120 },
    { label: '3h', val: 180 },
  ];

  const handleAdd = () => {
    onSave({
      packageName: app.packageName,
      appName: app.name,
      limitMinutes: minutes,
      emergencyUses,
      showReminders,
      strictMode,
    });
  };

  const getLimitLabel = () => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  return (
    <Modal transparent animationType="slide" visible={true} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          {/* Top handle pill */}
          <View style={styles.sheetHandle} />

          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <AppIcon type={app.packageName} size={30} />
              <Text style={styles.sheetTitle}>{app.name} limit</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Icon name="close" size={14} color={colors.textDim} />
            </Pressable>
          </View>

          {/* Scrollable sheet options */}
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* Limit Selector Row */}
            <Pressable onPress={() => setShowLimitPicker(!showLimitPicker)} style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Limit</Text>
              <Text style={styles.sheetValue}>{getLimitLabel()}  ›</Text>
            </Pressable>

            {/* Presets dropdown inline */}
            {showLimitPicker && (
              <View style={styles.presetWrap}>
                {presets.map((p) => (
                  <Pressable
                    key={p.val}
                    style={[styles.presetBtn, minutes === p.val && styles.presetBtnActive]}
                    onPress={() => {
                      setMinutes(p.val);
                      setShowLimitPicker(false);
                    }}
                  >
                    <Text style={[styles.presetText, minutes === p.val && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Emergency usage counter */}
            <View style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>No. of emergency use</Text>
              <View style={styles.counterContainer}>
                <Pressable
                  onPress={() => setEmergencyUses(Math.max(0, emergencyUses - 1))}
                  style={styles.counterBtn}
                  hitSlop={8}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={styles.counterVal}>{emergencyUses}</Text>
                <Pressable
                  onPress={() => setEmergencyUses(emergencyUses + 1)}
                  style={styles.counterBtn}
                  hitSlop={8}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Show reminders */}
            <Pressable onPress={() => setShowReminders(!showReminders)} style={styles.sheetRow}>
              <Text style={styles.sheetLabel}>Show reminders before limit</Text>
              <Text style={styles.sheetValue}>{showReminders ? 'Yes' : 'No'}  ›</Text>
            </Pressable>

            {/* Strict Mode */}
            <View style={styles.strictRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.strictLabel}>Strict mode</Text>
                  <View style={styles.proBadge}>
                    <Text style={styles.proText}>PRO</Text>
                  </View>
                </View>
                <Text style={styles.strictSub}>
                  You cannot use the app once the limit is reached
                </Text>
              </View>
              <Switch
                value={strictMode}
                onValueChange={setStrictMode}
                trackColor={{ true: colors.accent, false: '#2C2C2E' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Delete button if limit already exists */}
            {currentLimit && (
              <Pressable
                onPress={() => onDelete(app.packageName)}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>Delete Limit</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Add / Save Button */}
          <View style={styles.addBtnContainer}>
            <Pressable onPress={handleAdd} style={styles.addBtn}>
              <Text style={styles.addBtnText}>{currentLimit ? 'Save' : 'Add'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backGlyph: {
    color: '#ffffff',
    fontSize: 22,
    marginTop: -3,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 5,
  },
  helpIcon: {
    fontSize: 12.5,
  },
  helpText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  addAppTextBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addAppText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  // Dashed style for mock apps
  appRowMock: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'transparent',
  },
  appRowActive: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  appRowMiddle: {
    flex: 1,
  },
  appName: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
  },
  appLimitText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  appLimitTextMock: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  actionBtnAdd: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  actionTextAdd: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionTextDisabled: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnActive: {
    backgroundColor: 'rgba(124, 245, 176, 0.12)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  actionTextActive: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    backgroundColor: '#FFE082',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    alignSelf: 'center',
  },
  proText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Solid card layout for Block Shorts / Websites
  solidCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  solidCardName: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
    flex: 1,
  },

  // AppIcon helpers
  brandIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#ffffff',
  },

  // Select App Dropdown list
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  dropdownItemDisabled: {
    opacity: 0.45,
  },
  dropdownText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal / Bottom Sheet Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginVertical: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetLabel: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '600',
  },
  sheetValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  presetBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(124, 245, 176, 0.12)',
    borderColor: 'rgba(124, 245, 176, 0.3)',
  },
  presetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13.5,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.accent,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  counterBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  counterVal: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
    paddingHorizontal: 14,
  },
  strictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  strictLabel: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '600',
  },
  strictSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  addBtnContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  addBtn: {
    backgroundColor: '#ffffff',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '700',
  },
});
