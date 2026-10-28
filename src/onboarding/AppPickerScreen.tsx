import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getInstalledApps } from 'device-permissions';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui';
import LineArt from './LineArt';
import { CardPanel, INK, INK_DIM, InkButton, PastelCard, PILL, TINTS } from './PastelCard';
import { palette, radius, fonts } from '../design/tokens';
import Icon from '../ui/Icon';
import CategoryGlyph from './CategoryGlyph';
import { checkUsageAccessPermission, queryDailyUsage } from '../data/androidUsage';
import { DEFAULT_BLOCKED_PACKAGES } from '../data/blockedApps';

type Entry = {
  id: string;
  name: string;
  tint: string;
  group?: string;
  expandable?: boolean;
  /** The app's real launcher icon as a PNG data URI, straight from the
   *  package manager. Android hands these over; iOS never does, and the
   *  curated list below has no icons either, so both fall back to the drawn
   *  marks and then to a monogram. */
  icon?: string;
};

/** Shown only when the device's real app list can't be read. Categories only:
 *  inventing app rows with drawn brand marks showed apps the user may not even
 *  have installed, with icons that were not theirs. */
const DEFAULT_ENTRIES: Entry[] = [
  { id: 'all', name: 'All Apps & Categories', tint: '#2f3640' },
  { id: 'social', name: 'Social', tint: '#e0245e' },
  { id: 'games', name: 'Games', tint: '#f39c12' },
  { id: 'entertainment', name: 'Entertainment', tint: '#8e44ad' },
  { id: 'productivity', name: 'Productivity', tint: '#3498db' },
];

/** Brand glyphs from Ionicons (open source). Only used when the
 *  phone's own launcher icon is unavailable. */
const BRAND: Record<string, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  twitter: 'logo-twitter',
  x: 'logo-twitter',
  whatsapp: 'logo-whatsapp',
  telegram: 'paper-plane',
  youtube: 'logo-youtube',
  spotify: 'musical-notes',
  snapchat: 'logo-snapchat',
  reddit: 'logo-reddit',
  twitch: 'logo-twitch',
  slack: 'logo-slack',
  gmail: 'mail',
  linkedin: 'logo-linkedin',
  discord: 'logo-discord',
  tiktok: 'logo-tiktok',
  netflix: 'tv',
  pinterest: 'logo-pinterest',
  zoom: 'videocam',
  notion: 'document-text',
};

const BROWSER_OR_TOOL = /chrome|firefox|brave|opera|edge|browser|duckduckgo|vivaldi|settings|camera|gallery|contacts|dialer|phone|clock|calculator|files|play\.store|vending/i;
/** The system's own category flag is unreliable (browsers sometimes arrive as
 *  social); anything that is clearly a browser or a utility is not a "Social"
 *  app and goes under Other. */
function fixCategory(pkg: string, category: string): string {
  return category === 'social' && BROWSER_OR_TOOL.test(pkg) ? 'other' : category;
}

function AppIconSvg({ id, label, icon }: { id: string; label: string; icon?: string }) {
  // The phone's real launcher icon always wins.
  if (icon) {
    return <Image source={{ uri: icon }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />;
  }
  const CAT: Record<string, keyof typeof Ionicons.glyphMap> = {
    all: 'apps', social: 'chatbubbles', games: 'game-controller', entertainment: 'film', productivity: 'briefcase', other: 'ellipsis-horizontal',
  };
  if (CAT[id]) return <CategoryGlyph name={id} size={22} color={palette.accent} />;
  const brand = BRAND[id] ?? BRAND[label.toLowerCase()];
  if (brand) return <Ionicons name={brand} size={20} color="#FFFFFF" />;
  return <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>{label.slice(0, 1).toUpperCase()}</Text>;
}

export default function AppPickerScreen({
  onContinue,
  suggestedPackages = [],
  initialSelected,
  onBack,
  title = 'What should we block?',
  confirmLabel,
  pastel,
}: {
  /** Onboarding look: pastel card with a white panel. The in-app editor keeps the dark one. */
  pastel?: boolean;
  onContinue: (selected: string[]) => void;
  suggestedPackages?: string[];
  /** Editing an existing list: start from it instead of guessing from usage. */
  initialSelected?: string[];
  /** Shown as a back button when editing. */
  onBack?: () => void;
  title?: string;
  /** Overrides the "Block N apps" button label, e.g. "Save". */
  confirmLabel?: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['social', 'games', 'entertainment', 'productivity', 'other']);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const defaults = [...DEFAULT_ENTRIES];
      
      if (Platform.OS === 'android') {
        try {
          const installed = await getInstalledApps();
          if (installed && installed.length > 0) {
            const categoryTints: Record<string, string> = {
              social: '#e0245e',
              games: '#f39c12',
              entertainment: '#8e44ad',
              productivity: '#3498db',
              other: '#7f8c8d'
            };
            
            const categoryLabels: Record<string, string> = {
              social: 'Social',
              games: 'Games',
              entertainment: 'Entertainment',
              productivity: 'Productivity',
              other: 'Other'
            };

            const newList: Entry[] = [
              { id: 'all', name: 'All Apps & Categories', tint: '#2f3640' }
            ];

            const categoriesWithApps = new Set<string>();
            installed.forEach(app => { app.category = fixCategory(app.packageName, app.category); categoriesWithApps.add(app.category); });

            const sortedCategories = ['social', 'games', 'entertainment', 'productivity', 'other'].filter(c => categoriesWithApps.has(c));
            
            sortedCategories.forEach(cat => {
              newList.push({
                id: cat,
                name: categoryLabels[cat] || cat.toUpperCase(),
                tint: categoryTints[cat] || '#7f8c8d',
                expandable: true
              });
              
              const appsInCat = installed.filter(app => app.category === cat);
              appsInCat.forEach(app => {
                newList.push({
                  id: app.packageName,
                  name: app.label,
                  tint: categoryTints[cat] || '#7f8c8d',
                  group: cat,
                  icon: app.icon || undefined
                });
              });
            });
            
            setEntries(newList);
            const installedIds = new Set(newList.map((e) => e.id));
            let preselect = suggestedPackages.filter((p) => installedIds.has(p));
            try {
              const hasUsage = await checkUsageAccessPermission();
              if (hasUsage) {
                const end = Date.now();
                const daily = await queryDailyUsage(end - 7 * 86400000, end);
                const ranked = [...daily]
                  .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)
                  .map((d) => d.packageName)
                  .filter((p) => installedIds.has(p) && (DEFAULT_BLOCKED_PACKAGES.includes(p) || newList.find((e) => e.id === p)?.group === 'social' || newList.find((e) => e.id === p)?.group === 'entertainment'));
                if (ranked.length > 0) preselect = ranked.slice(0, 6);
              }
            } catch {
              /* keep suggested */
            }
            if (preselect.length === 0) {
              preselect = DEFAULT_BLOCKED_PACKAGES.filter((p) => installedIds.has(p)).slice(0, 4);
            }
            setSelected(initialSelected ?? preselect);
            return;
          }
        } catch (e) {
          console.warn('Failed to fetch installed apps', e);
        }
      }
      
      if (Platform.OS === 'web') {
        // Browser preview only: there is no package manager here, so show sample
        // rows to review the layout. Never reached on a device.
        const sample = (cat: string, tint: string, names: string[]): Entry[] =>
          names.map((n) => ({ id: n.toLowerCase().replace(/\W/g, ''), name: n, tint, group: cat }));
        defaults.length = 0;
        defaults.push(
          { id: 'all', name: 'All Apps & Categories', tint: '#2f3640' },
          { id: 'social', name: 'Social', tint: '#e0245e', expandable: true },
          ...sample('social', '#e0245e', ['Instagram', 'Facebook', 'WhatsApp', 'Snapchat', 'Telegram', 'Reddit', 'X', 'Pinterest']),
          { id: 'games', name: 'Games', tint: '#f39c12', expandable: true },
          ...sample('games', '#f39c12', ['Roblox', 'Subway Surfers', 'Candy Crush', 'Among Us']),
          { id: 'entertainment', name: 'Entertainment', tint: '#8e44ad', expandable: true },
          ...sample('entertainment', '#8e44ad', ['YouTube', 'Netflix', 'Spotify', 'Twitch', 'TikTok']),
        );
      }
      setEntries(defaults);
      const fallback = suggestedPackages.length > 0 ? suggestedPackages : [];
      setSelected(initialSelected ?? fallback.filter((id) => defaults.some((e) => e.id === id)));
    };
    load();
  // Keyed on the contents, not the arrays: a default `[]` is a new array every
  // render, which re-ran this load on each tap and reset the selection and the
  // open/closed state.
  }, [suggestedPackages.join(','), (initialSelected ?? []).join(',')]);

  // Open every category that already holds a pre-selected app, so what is
  // ticked is visible without hunting for it.
  useEffect(() => {
    const open = new Set<string>(['social', 'games', 'entertainment', 'productivity', 'other']);
    selected.forEach((id) => {
      const g = entries.find((e) => e.id === id)?.group;
      if (g) open.add(g);
    });
    setExpandedCategories((prev) => Array.from(new Set([...prev, ...open])));
  }, [entries, selected.length === 0]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      let nextList = [...prev];
      const isCurrentlySelected = prev.includes(id);

      if (id === 'all') {
        if (isCurrentlySelected) {
          return [];
        } else {
          return entries.map(e => e.id);
        }
      }

      const entry = entries.find(e => e.id === id);
      if (entry?.expandable) {
        const appsUnderCategory = entries.filter(e => e.group === id).map(e => e.id);
        if (isCurrentlySelected) {
          nextList = nextList.filter(x => x !== id && !appsUnderCategory.includes(x));
        } else {
          nextList = Array.from(new Set([...nextList, id, ...appsUnderCategory]));
        }
      } else {
        if (isCurrentlySelected) {
          nextList = nextList.filter(x => x !== id);
          if (entry?.group) {
            nextList = nextList.filter(x => x !== entry.group);
          }
          nextList = nextList.filter(x => x !== 'all');
        } else {
          nextList.push(id);
          if (entry?.group) {
            const groupApps = entries.filter(e => e.group === entry.group).map(e => e.id);
            const allGroupAppsSelected = groupApps.every(x => nextList.includes(x));
            if (allGroupAppsSelected) {
              nextList.push(entry.group);
            }
          }
          const nonAllEntries = entries.filter(e => e.id !== 'all').map(e => e.id);
          const allSelected = nonAllEntries.every(x => nextList.includes(x));
          if (allSelected) {
            nextList.push('all');
          }
        }
      }
      return nextList;
    });
  };

  const handleRowPress = (e: Entry) => {
    if (e.expandable) {
      setExpandedCategories(prev =>
        prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id]
      );
    } else {
      toggle(e.id);
    }
  };

  const isExpanded = (group?: string) => {
    if (!group) return true;
    return expandedCategories.includes(group);
  };

  const isRowVisible = (e: Entry) => {
    if (query.trim().length > 0) {
      return e.name.toLowerCase().includes(query.trim().toLowerCase());
    }
    return isExpanded(e.group);
  };

  const visible = entries.filter(isRowVisible);
  // The real rows behind the selection, not just how many — the strip above
  // the CTA is drawn from these so what's ticked is visible without scrolling
  // the list back up to look for checkmarks.
  const selectedEntries = selected
    .map((id) => entries.find((x) => x.id === id))
    .filter((e): e is NonNullable<typeof e> => !!e && !e.expandable && e.id !== 'all');
  const selectedAppCount = selectedEntries.length;

  const CAT_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; tint: string }> = {
    social: { icon: 'chatbubbles', tint: '#E0245E' },
    games: { icon: 'game-controller', tint: '#F39C12' },
    entertainment: { icon: 'play-circle', tint: '#8E44AD' },
    productivity: { icon: 'briefcase', tint: '#3498DB' },
    other: { icon: 'apps', tint: '#7F8C8D' },
  };
  const categories = entries.filter((e) => e.expandable || (!e.group && e.id !== 'all'));
  const appsIn = (cat: string) => entries.filter((e) => e.group === cat);
  const q = query.trim().toLowerCase();
  const searchHits = q ? entries.filter((e) => !e.expandable && e.id !== 'all' && e.name.toLowerCase().includes(q)) : [];
  const hasApps = entries.some((e) => !!e.group);

  const P = pastel ? pastelStyles : ({} as Partial<typeof pastelStyles>);
  const fg = pastel ? INK : '#FFFFFF';
  const dim = pastel ? INK_DIM : 'rgba(255,255,255,0.5)';
  const AppTile = ({ e }: { e: Entry }) => {
    const on = selected.includes(e.id);
    return (
      <Pressable onPress={() => toggle(e.id)} style={styles.tile} accessibilityRole="button" accessibilityState={{ selected: on }}>
        <View style={[styles.tileIcon, on && styles.tileIconOn, on && P.tileIconOn]}>
          <View style={[styles.tileImg, !e.icon && { backgroundColor: pastel ? '#2A2A30' : 'rgba(255,255,255,0.09)' }]}>
            <AppIconSvg id={e.id} label={e.name} icon={e.icon} />
          </View>
          {on && (
            <View style={[styles.tileCheck, P.tileCheck]}>
              <Ionicons name="checkmark" size={13} color={pastel ? '#FFFFFF' : '#06232B'} />
            </View>
          )}
        </View>
        <Text style={[styles.tileName, P.tileName, on && { color: fg }]} numberOfLines={2}>
          {e.name}
        </Text>
      </Pressable>
    );
  };

  function wrapScreen(body: React.ReactNode) {
    return pastel ? (
      <PastelCard tint={TINTS.lavender}>{body}</PastelCard>
    ) : (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>{body}</SafeAreaView>
    );
  }
  function wrapPanel(body: React.ReactNode) {
    return pastel ? <CardPanel style={pastelStyles.panel}>{body}</CardPanel> : body;
  }

  return (
    wrapScreen(
      <KeyboardAvoider>
        <View style={[styles.centerStack, P.centerStack]}>
          {onBack && (
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10} accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
          )}
          <View style={P.head}>
          {pastel && <LineArt name="apps" height={120} />}
          <Text style={[styles.title, P.title]}>{title}</Text>
          <Text style={[styles.recommendHint, P.recommendHint]}>
            {initialSelected
              ? 'Tap to add or remove apps.'
              : selectedAppCount > 0
                ? 'Pre-selected from what you use. Tap to change.'
                : 'Pick the apps that steal your day.'}
          </Text>
          </View>

          {wrapPanel(<>
          <View style={[styles.searchBar, P.searchBar]}>
            <Ionicons name="search" size={16} color={dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your apps"
              placeholderTextColor={dim}
              style={[styles.searchInput, P.searchInput]}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={dim} />
              </Pressable>
            ) : null}
          </View>

          {hasApps && !q && (
            <View style={styles.bulkRow}>
              <Text style={[styles.bulkCount, P.bulkCount]}>
                {selectedAppCount} of {entries.filter((e) => !!e.group).length} selected
              </Text>
              <Pressable onPress={() => toggle('all')} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.bulkBtn, P.bulkBtn]}>
                  {selected.includes('all') || selectedAppCount === entries.filter((e) => !!e.group).length
                    ? 'Clear all'
                    : 'Select all'}
                </Text>
              </Pressable>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false} {...keyboardScrollProps}>
            {q ? (
              <View style={styles.grid}>
                {searchHits.map((e) => (
                  <AppTile key={e.id} e={e} />
                ))}
                {searchHits.length === 0 && <Text style={[styles.empty, P.empty]}>No app matches “{query}”.</Text>}
              </View>
            ) : (
              categories.map((cat) => {
                const meta = CAT_META[cat.id] ?? CAT_META.other;
                const apps = appsIn(cat.id);
                const open = expandedCategories.includes(cat.id);
                const chosen = apps.filter((a) => selected.includes(a.id)).length;
                const all = apps.length > 0 && chosen === apps.length;
                return (
                  <View key={cat.id} style={[styles.section, P.section]}>
                    {/* Siblings, not nested: a pill inside the header's Pressable
                        also fired the header's open/close. */}
                    <View style={styles.sectionHead}>
                      <Pressable
                        onPress={() => (apps.length ? handleRowPress(cat) : toggle(cat.id))}
                        style={styles.sectionTap}
                        accessibilityRole="button"
                        accessibilityLabel={`${cat.name}, ${open ? 'collapse' : 'expand'}`}
                      >
                        <View style={[styles.catIcon, P.catIcon]}>
                          <CategoryGlyph name={cat.id} size={24} color={pastel ? INK : palette.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.catName, P.catName]}>{cat.name}</Text>
                          <Text style={[styles.catCount, P.catCount]}>
                            {apps.length ? `${chosen} of ${apps.length} selected` : selected.includes(cat.id) ? 'Selected' : 'Tap to block all'}
                          </Text>
                        </View>
                      </Pressable>
                      {apps.length > 0 && (
                        <Pressable onPress={() => toggle(cat.id)} style={[styles.allPill, P.allPill, all && styles.allPillOn, all && P.allPillOn]} hitSlop={6}>
                          <Text style={[styles.allPillText, P.allPillText, all && { color: pastel ? '#FFFFFF' : '#06232B' }]}>{all ? 'All' : 'Select all'}</Text>
                        </Pressable>
                      )}
                      {apps.length > 0 && (
                        <Pressable onPress={() => handleRowPress(cat)} hitSlop={10} accessibilityLabel={open ? 'Collapse' : 'Expand'}>
                          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={dim} />
                        </Pressable>
                      )}
                    </View>
                    {open && apps.length > 0 && (
                      <View style={styles.grid}>
                        {apps.map((a) => (
                          <AppTile key={a.id} e={a} />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
            {!hasApps && !q && (
              <Text style={[styles.empty, P.empty]}>We couldn’t read your installed apps, so you can block whole categories for now.</Text>
            )}
          </ScrollView>

          <View style={[styles.ctaWrap, P.ctaWrap]}>
            {(() => {
              const label = confirmLabel ?? (selectedAppCount > 0 ? `Block ${selectedAppCount} ${selectedAppCount === 1 ? 'app' : 'apps'}` : 'Continue');
              return pastel ? (
                <InkButton label={label} onPress={() => onContinue(selected)} />
              ) : (
                <GradientButton label={label} onPress={() => onContinue(selected)} />
              );
            })()}
          </View>
          </>)}
        </View>
      </KeyboardAvoider>
    )
  );
}

const styles = StyleSheet.create({
  sectionTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 10 },
  bulkCount: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  bulkBtn: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  backBtn: { alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 8 },
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  centerStack: { flex: 1, paddingTop: 14 },
  title: { color: '#FFFFFF', fontSize: 26, fontFamily: fonts.bold, fontWeight: '700', letterSpacing: -0.5 },
  recommendHint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, height: 46 },
  section: {
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  catName: { color: '#FFFFFF', fontSize: 17, fontFamily: fonts.semibold, fontWeight: '700' },
  catCount: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, marginTop: 2 },
  allPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  allPillOn: { backgroundColor: palette.accent },
  allPillText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 10 },
  tile: { width: '25%', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  tileIcon: { width: 60, height: 60, borderRadius: 16, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  tileIconOn: { borderColor: palette.accent },
  tileImg: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, textAlign: 'center', marginTop: 6, lineHeight: 14 },
  empty: { color: 'rgba(255,255,255,0.65)', fontSize: 13.5, textAlign: 'center', padding: 16 },
  ctaWrap: { paddingTop: 8, paddingBottom: 12 },
});

/** Overrides for the onboarding (pastel) look. */
const pastelStyles = StyleSheet.create({
  centerStack: { paddingTop: 0 },
  head: { alignItems: 'stretch', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14 },
  title: { color: INK, textAlign: 'left', marginTop: 8 },
  recommendHint: { color: INK_DIM, textAlign: 'left', marginBottom: 0, marginTop: 6 },
  panel: { flex: 1, gap: 0, paddingTop: 0, paddingBottom: 12 },
  searchBar: { backgroundColor: PILL, borderWidth: 1.5, borderColor: INK, borderRadius: 24 },
  searchInput: { color: INK },
  bulkCount: { color: INK_DIM },
  bulkBtn: { color: INK, textDecorationLine: 'underline' },
  section: { backgroundColor: '#FFFFFF', borderColor: INK, borderWidth: 1.5 },
  catIcon: { backgroundColor: '#F1EFEB', borderColor: 'rgba(27,27,31,0.08)' },
  catName: { color: INK },
  catCount: { color: INK_DIM },
  allPill: { backgroundColor: '#F1EFEB' },
  allPillOn: { backgroundColor: INK },
  allPillText: { color: INK },
  tileIconOn: { borderColor: INK },
  tileCheck: { backgroundColor: INK },
  tileName: { color: INK_DIM },
  empty: { color: INK_DIM },
  ctaWrap: { paddingBottom: 0 },
});
