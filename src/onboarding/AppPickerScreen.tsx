import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getInstalledApps } from 'device-permissions';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui';
import { palette, radius } from '../design/tokens';
import Icon from '../ui/Icon';
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

function AppIconSvg({ id, label, icon }: { id: string; label: string; icon?: string }) {
  // The phone's real launcher icon always wins.
  if (icon) {
    return <Image source={{ uri: icon }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />;
  }
  const CAT: Record<string, keyof typeof Ionicons.glyphMap> = {
    all: 'apps', social: 'chatbubbles', games: 'game-controller', entertainment: 'film', productivity: 'briefcase', other: 'ellipsis-horizontal',
  };
  if (CAT[id]) return <Ionicons name={CAT[id]} size={19} color="#FFFFFF" />;
  const brand = BRAND[id] ?? BRAND[label.toLowerCase()];
  if (brand) return <Ionicons name={brand} size={20} color="#FFFFFF" />;
  return <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>{label.slice(0, 1).toUpperCase()}</Text>;
}

export default function AppPickerScreen({
  onContinue,
  suggestedPackages = [],
}: {
  onContinue: (selected: string[]) => void;
  suggestedPackages?: string[];
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['social']); // start with social expanded
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
            installed.forEach(app => categoriesWithApps.add(app.category));

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
            setSelected(preselect);
            return;
          }
        } catch (e) {
          console.warn('Failed to fetch installed apps', e);
        }
      }
      
      setEntries(defaults);
      const fallback = suggestedPackages.length > 0 ? suggestedPackages : [];
      setSelected(fallback.filter((id) => defaults.some((e) => e.id === id)));
    };
    load();
  }, [suggestedPackages]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoider>
        <View style={styles.centerStack}>
        <View style={styles.hintRow}>
          <Text style={styles.hint}>Use </Text>
          <Text style={[styles.hint, styles.hintIconHighlight]}>Search</Text>
          <Text style={styles.hint}> or tap </Text>
          <Icon name="chevronRight" size={16} color="#ffffff" strokeWidth={2.2} />
          <Text style={styles.hint}> to select apps to block</Text>
        </View>
        <Text style={styles.recommendHint}>
          {selectedAppCount > 0
            ? 'Pre-selected from what you actually use — tap to change.'
            : 'Pick the apps that steal the most of your day.'}
        </Text>

        {/* Main card list */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.listCard}>
          <ScrollView showsVerticalScrollIndicator={false} {...keyboardScrollProps}>
            {visible.map((e, i) => {
              const isSelected = selected.includes(e.id);
              const expanded = expandedCategories.includes(e.id);
              return (
                <View
                  key={e.id}
                  style={[styles.row, i > 0 && styles.rowBorder, e.group && styles.rowNested]}
                >
                  {/* Left touchable checkbox */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggle(e.id)}
                    style={styles.radioContainer}
                  >
                    <View style={[styles.radio, isSelected && styles.radioOn]}>
                      {isSelected ? <Icon name="check" size={12} color="#0a1a10" /> : null}
                    </View>
                  </TouchableOpacity>
                
                  {/* Right touchable row content */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRowPress(e)}
                    style={styles.rowRightContent}
                  >
                    <View style={[styles.appIcon, { backgroundColor: e.tint }]}>
                      <AppIconSvg id={e.id} label={e.name} icon={e.icon} />
                    </View>
                  
                    <Text style={styles.appName}>{e.name}</Text>
                  
                    {e.expandable ? (
                      <Icon
                        name={expanded ? 'chevronDown' : 'chevronRight'}
                        size={18}
                        color="rgba(255,255,255,0.4)"
                        strokeWidth={2}
                      />
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Search input field inside the card container at bottom */}
          <View style={styles.searchWrap}>
            <Icon name="search" size={14} color="rgba(255,255,255,0.4)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.searchInput}
            />
            <Icon name="mic" size={14} color="rgba(255,255,255,0.4)" />
          </View>
        </Animated.View>

        {/* "3 apps selected" is a receipt, not an answer — these are the apps
            themselves, so a wrong tick is caught here rather than later. */}
        {selectedAppCount > 0 ? (
          <View style={styles.selectedStrip}>
            {selectedEntries.slice(0, SELECTED_STRIP_MAX).map((e) => (
              <View key={e.id} style={[styles.selectedChip, { backgroundColor: e.tint }]}>
                <AppIconSvg id={e.id} label={e.name} icon={e.icon} />
              </View>
            ))}
            {selectedAppCount > SELECTED_STRIP_MAX ? (
              <View style={[styles.selectedChip, styles.selectedChipMore]}>
                <Text style={styles.selectedChipMoreText}>
                  +{selectedAppCount - SELECTED_STRIP_MAX}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.countLabel}>{selectedAppCount} {selectedAppCount === 1 ? 'app' : 'apps'} selected</Text>

        <View style={styles.ctaWrap}>
          <GradientButton label="Continue" onPress={() => onContinue(selected)} />
        </View>
        </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

/** Icons in the strip before it collapses to a "+N" tile. */
const SELECTED_STRIP_MAX = 7;

const styles = StyleSheet.create({
  selectedStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
  },
  selectedChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedChipMore: { backgroundColor: 'rgba(255,255,255,0.10)' },
  selectedChipMoreText: { color: 'rgba(255,255,255,0.72)', fontSize: 12.5, fontWeight: '700' },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
  },
  centerStack: {
    flex: 1,
    justifyContent: 'center',
  },
  hintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  recommendHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  hintIconHighlight: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listCard: {
    height: 340,
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 4,
  },
  radioContainer: {
    paddingVertical: 12,
    paddingRight: 10,
  },
  rowRightContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  rowNested: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingLeft: 40, // Indent nested apps under category
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  radioTick: {
    color: '#0a1a10',
    fontSize: 12,
    fontWeight: '900',
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 22,
    fontWeight: '300',
  },
  chevronDown: {
    fontSize: 16,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  micIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  countLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  ctaWrap: {
    paddingBottom: 14,
    paddingTop: 14,
  },
});
