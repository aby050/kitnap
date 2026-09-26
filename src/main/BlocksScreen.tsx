import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppGlyph from '../ui/AppGlyph';
import { InstalledApp, useInstalledApps } from '../data/installedApps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { control, palette, radius } from '../design/tokens';
import { AppLimit } from '../data/store';
import Icon from '../ui/Icon';
import Toggle from '../design/Toggle';

/**
 * Packages worth offering first, when they are actually installed.
 *
 * This list is a ranking, not the menu. The menu used to BE this list, which
 * meant the picker offered seven apps whether or not the phone had them and
 * could not offer anything it did had — someone limiting a game, a shopping
 * app or a news reader had no way to say so. Now the picker shows what is
 * installed, and these simply sort to the top.
 */
const SUGGESTED_FIRST = [
  'com.instagram.android',
  'com.facebook.katana',
  'com.zhiliaoapp.musically',
  'com.twitter.android',
  'com.google.android.youtube',
  'com.snapchat.android',
  'com.reddit.frontpage',
];


/**
 * App icons come from the launcher, via the shared installed-apps cache.
 *
 * What was here was a switch statement that hand-drew Facebook, Instagram,
 * TikTok, X, Reddit and a few others as coloured circles and letters. It could
 * only ever depict the brands someone had hardcoded, it looked nothing like
 * the icons on the user's own home screen, and redistributing an approximated
 * trademark is a problem nobody needed. AppGlyph resolves the real icon and
 * falls back to a neutral monogram tile.
 */

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
  /** Apps already shut all day. A daily limit cannot apply to these. */
  blockedPackages?: string[];
  /** Take an app off the blocklist so a limit can apply to it instead. */
  onUnblock?: (packageName: string) => void;
}

export default function BlocksScreen({
  appLimits = [],
  onSaveLimits,
  onBack,
  blockedPackages = [],
  onUnblock,
}: BlocksScreenProps) {
  const [selectedApp, setSelectedApp] = useState<{ name: string; packageName: string } | null>(null);
  const [showAddList, setShowAddList] = useState(false);
  const installed = useInstalledApps();
  const [query, setQuery] = useState('');

  /* Familiar names first, then everything else alphabetically — so the apps
   * most people came here to limit are reachable without typing, and the rest
   * are still reachable at all. */
  const blockedSet = useMemo(() => new Set(blockedPackages), [blockedPackages]);

  /** Blocked apps that the user might have expected to limit instead. */
  const blockedShown = useMemo(
    () =>
      blockedPackages
        .map((pkg) => (installed ?? []).find((a) => a.packageName === pkg))
        .filter((a): a is InstalledApp => !!a)
        .slice(0, 6),
    [blockedPackages, installed],
  );

  const pickerApps = useMemo(() => {
    const apps = installed ?? [];
    const q = query.trim().toLowerCase();
    /* Apps that already have a limit are not offered again. Listing them
     * greyed out was clutter that grew with every limit set, and "Add app"
     * showing Instagram when Instagram is already in the list above is just
     * the screen contradicting itself — editing an existing limit is what the
     * row above is for. */
    const limited = new Set(appLimits.map((l) => l.packageName));
    /* Neither already-limited apps nor already-blocked ones. Offering a daily
     * limit for an app that is shut all day is offering a setting that cannot
     * do anything — which is exactly what made this screen confusing. */
    const available = apps.filter(
      (a) => !limited.has(a.packageName) && !blockedSet.has(a.packageName),
    );
    const matched = q ? available.filter((a) => a.label.toLowerCase().includes(q)) : available;
    return [...matched].sort((a, b) => {
      const ra = SUGGESTED_FIRST.indexOf(a.packageName);
      const rb = SUGGESTED_FIRST.indexOf(b.packageName);
      if (ra !== rb) return (ra < 0 ? 999 : ra) - (rb < 0 ? 999 : rb);
      return a.label.localeCompare(b.label);
    });
  }, [installed, query, appLimits, blockedSet]);

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

  /* Suggested rows are now drawn from what is installed rather than named in
   * source: offering a limit for Facebook on a phone without Facebook was an
   * empty row that could never do anything. */
  const suggestions = useMemo(
    () =>
      SUGGESTED_FIRST.map((pkg) => (installed ?? []).find((a) => a.packageName === pkg))
        .filter(
          (a): a is InstalledApp =>
            !!a &&
            !appLimits.some((l) => l.packageName === a.packageName) &&
            !blockedSet.has(a.packageName),
        )
        .slice(0, 3)
        .map((a) => ({ name: a.label, packageName: a.packageName })),
    [installed, appLimits, blockedSet],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Icon name="chevronLeft" size={20} color={palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Blocks</Text>
        </View>
        {/* Help button removed until there's a real support destination to send it to. */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* App Limits Section.
            The sentence is not decoration. "Limit" was doing a lot of unspoken
            work on this screen: blocked and limited are different states — one
            is shut all day, the other is open until you have had your ration —
            and nothing said so, which made an "Add" button next to an app you
            had already blocked read as a bug. */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Daily limits</Text>
          <Pressable onPress={() => setShowAddList(true)} style={styles.addAppTextBtn}>
            <Text style={styles.addAppText}>+ Add App</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionBlurb}>
          A limit lets you use an app normally until you have spent your minutes for the day. After
          that it shuts until tomorrow.
        </Text>

        {/* Dynamic App Limits List */}
        <View style={styles.listContainer}>
          {/* Active Limits */}
          {appLimits.map((limit) => (
            <Pressable
              key={limit.packageName}
              style={[styles.appRow, styles.appRowActive]}
              onPress={() => openAppConfig(limit.appName, limit.packageName)}
            >
              <AppGlyph name={limit.appName} packageName={limit.packageName} size={38} />
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

          {/* Suggested limits if not already active. Android only: these are
              real package names it can act on, whereas on iOS they would be
              seven names of apps we can neither see nor limit. */}
          {(Platform.OS === 'android' ? suggestions : []).map((sug) => {
            const isActive = getLimitFor(sug.packageName);
            if (isActive) return null;
            return (
              <Pressable
                key={sug.packageName}
                style={[styles.appRow, styles.appRowMock]}
                onPress={() => openAppConfig(sug.name, sug.packageName)}
              >
                <AppGlyph name={sug.name} packageName={sug.packageName} size={38} />
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

        {blockedShown.length > 0 && (
          <>
            <View style={[styles.sectionRow, { marginTop: 30 }]}>
              <Text style={styles.sectionTitle}>Blocked all day</Text>
            </View>
            <Text style={styles.sectionBlurb}>
              These are shut whenever you reach for them, so a daily limit would have nothing to
              count. Unblock one to put it on a limit instead.
            </Text>

            <View style={styles.listContainer}>
              {blockedShown.map((app) => (
                <View key={app.packageName} style={[styles.appRow, styles.appRowActive]}>
                  <AppGlyph name={app.label} packageName={app.packageName} size={38} />
                  <View style={styles.appRowMiddle}>
                    <Text style={styles.appName}>{app.label}</Text>
                    <Text style={styles.appLimitTextMock}>Blocked all day</Text>
                  </View>
                  {onUnblock && (
                    <Pressable onPress={() => onUnblock(app.packageName)} style={styles.actionBtnAdd}>
                      <Text style={styles.actionTextAdd}>Unblock</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Select App to Add Modal */}
      {showAddList && (
        <Modal transparent animationType="fade" visible={showAddList} onRequestClose={() => setShowAddList(false)}>
          <Pressable style={styles.dropdownOverlay} onPress={() => setShowAddList(false)}>
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Choose an App</Text>

              {/* Searchable, because a phone has hundreds of apps and a list
                  the user has to scroll to the bottom of is a list they give
                  up on. Stopping the tap from closing the sheet: the overlay
                  behind dismisses on press, and a tap in the field is a press. */}
              <Pressable onPress={() => {}}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search apps"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.dropdownSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </Pressable>

              {installed === null ? (
                <View style={styles.dropdownEmpty}>
                  <ActivityIndicator color={palette.accent} />
                </View>
              ) : pickerApps.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>
                    {Platform.OS === 'android'
                      ? query
                        ? `Nothing matching "${query}".`
                        : 'No apps found. Phonewise needs usage access to read what is installed.'
                      : 'iOS does not let apps see what else is installed. Use the Screen Time picker instead.'}
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.dropdownScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {pickerApps.map((app) => (
                    <Pressable
                      key={app.packageName}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowAddList(false);
                        setQuery('');
                        openAppConfig(app.label, app.packageName);
                      }}
                    >
                      <AppGlyph name={app.label} packageName={app.packageName} size={28} />
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {app.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
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
              <AppGlyph name={app.name} packageName={app.packageName} size={30} />
              <Text style={styles.sheetTitle}>{app.name} limit</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Icon name="close" size={14} color={palette.textSecondary} />
            </Pressable>
          </View>

          {/* Scrollable sheet options */}
          <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* Limit Selector Row */}
            {/* "Limit / 1h" said nothing about what happens at 1h, or over
                what period. Naming the period in the label is most of the
                explanation, and costs a word. */}
            <Pressable onPress={() => setShowLimitPicker(!showLimitPicker)} style={styles.sheetRow}>
              <View style={styles.sheetLabelWrap}>
                <Text style={styles.sheetLabel}>Minutes per day</Text>
                <Text style={styles.sheetHint}>Then it shuts until tomorrow</Text>
              </View>
              <Text style={styles.sheetValue}>{getLimitLabel()}</Text>
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
              <View style={styles.sheetLabelWrap}>
                <Text style={styles.sheetLabel}>Emergency opens</Text>
                <Text style={styles.sheetHint}>Times you can get in after the limit</Text>
              </View>
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
              <View style={styles.sheetLabelWrap}>
                <Text style={styles.sheetLabel}>Warn me near the limit</Text>
                <Text style={styles.sheetHint}>A nudge before it runs out</Text>
              </View>
              <Text style={styles.sheetValue}>{showReminders ? 'Yes' : 'No'}</Text>
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
              <Toggle
                value={strictMode}
                onValueChange={setStrictMode}
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
    color: palette.accent,
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
    color: palette.accent,
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
    backgroundColor: 'rgba(111, 227, 169, 0.12)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  actionTextActive: {
    color: palette.accent,
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
  sheetLabelWrap: { flex: 1, paddingRight: 12, gap: 2 },
  sheetHint: { color: 'rgba(255,255,255,0.42)', fontSize: 12 },
  sectionBlurb: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18.5,
    paddingHorizontal: 4,
    marginTop: -4,
    marginBottom: 14,
  },
  dropdownSearch: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: palette.text,
    fontSize: 15,
    marginBottom: 8,
  },
  /* Capped so the sheet cannot grow past the screen once the list is a few
     hundred apps long. */
  dropdownScroll: { maxHeight: 360 },
  dropdownEmpty: { paddingVertical: 28, alignItems: 'center', paddingHorizontal: 12 },
  dropdownEmptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
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
    backgroundColor: 'rgba(111, 227, 169, 0.12)',
    borderColor: 'rgba(111, 227, 169, 0.3)',
  },
  presetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13.5,
    fontWeight: '600',
  },
  presetTextActive: {
    color: palette.accent,
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
    height: control.lg,
    borderRadius: radius.pill,
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
