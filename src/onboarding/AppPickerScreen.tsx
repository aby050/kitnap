import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getInstalledApps } from 'device-permissions';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

type Entry = { id: string; name: string; tint: string; group?: string; expandable?: boolean };

const DEFAULT_ENTRIES: Entry[] = [
  { id: 'all', name: 'All Apps & Categories', tint: '#2f3640' },
  { id: 'social', name: 'Social', tint: '#e0245e', expandable: true },
  { id: 'instagram', name: 'Instagram', tint: '#e1306c', group: 'social' },
  { id: 'facebook', name: 'Facebook', tint: '#1877f2', group: 'social' },
  { id: 'tiktok', name: 'TikTok', tint: '#010101', group: 'social' },
  { id: 'snapchat', name: 'Snapchat', tint: '#fffc00', group: 'social' },
  { id: 'telegram', name: 'Telegram', tint: '#0088cc', group: 'social' },
  { id: 'whatsapp', name: 'WhatsApp', tint: '#25d366', group: 'social' },
  { id: 'games', name: 'Games', tint: '#f39c12', expandable: true },
  { id: 'roblox', name: 'Roblox', tint: '#ff3b30', group: 'games' },
  { id: 'subwaysurfers', name: 'Subway Surfers', tint: '#ff9500', group: 'games' },
  { id: 'candycrush', name: 'Candy Crush', tint: '#ff2d55', group: 'games' },
  { id: 'amongus', name: 'Among Us', tint: '#af52de', group: 'games' },
  { id: 'entertainment', name: 'Entertainment', tint: '#8e44ad', expandable: true },
  { id: 'youtube', name: 'YouTube', tint: '#ff0000', group: 'entertainment' },
  { id: 'netflix', name: 'Netflix', tint: '#e50914', group: 'entertainment' },
  { id: 'spotify', name: 'Spotify', tint: '#1db954', group: 'entertainment' },
  { id: 'twitch', name: 'Twitch', tint: '#9146ff', group: 'entertainment' },
  { id: 'productivity', name: 'Productivity', tint: '#3498db', expandable: true },
  { id: 'slack', name: 'Slack', tint: '#4a154b', group: 'productivity' },
  { id: 'zoom', name: 'Zoom', tint: '#2d8cff', group: 'productivity' },
  { id: 'notion', name: 'Notion', tint: '#000000', group: 'productivity' },
  { id: 'gmail', name: 'Gmail', tint: '#ea4335', group: 'productivity' },
];

function AppIconSvg({ id, label }: { id: string; label: string }) {
  switch (id) {
    case 'all':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" rx="2" fill="#FF453A" />
          <Rect x="14" y="3" width="7" height="7" rx="2" fill="#30D158" />
          <Rect x="3" y="14" width="7" height="7" rx="2" fill="#0A84FF" />
          <Rect x="14" y="14" width="7" height="7" rx="2" fill="#FFD60A" />
        </Svg>
      );
    case 'social':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#ffffff" />
        </Svg>
      );
    case 'facetime':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="#ffffff" />
        </Svg>
      );
    case 'messages':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#ffffff" />
        </Svg>
      );
    case 'telegram':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-.97.53-1.35.52-.42-.01-1.22-.24-1.82-.44-.73-.24-1.31-.37-1.26-.78.03-.22.33-.44.9-.67 3.52-1.53 5.87-2.54 7.05-3.03 3.35-1.39 4.05-1.63 4.5-1.64.1 0 .32.02.46.14.12.1.15.24.17.34 0 .07.01.21 0 .28z" fill="#ffffff" />
        </Svg>
      );
    case 'whatsapp':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.817 9.817 0 0 0 12.04 2zm0 18.08c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.12 8.12 0 0 1-1.24-4.3c0-4.51 3.67-8.18 8.18-8.18 2.19 0 4.24.85 5.79 2.4 1.55 1.55 2.4 3.61 2.4 5.79 0 4.52-3.67 8.18-8.15 8.18zm4.5-6.17c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-1.07-.53-1.84-.96-2.54-2.17-.19-.32-.19-.57-.06-.7l.38-.38c.13-.13.17-.22.25-.38.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.5-.43-.43-.59-.43h-.5c-.17 0-.45.06-.69.32-.24.25-.92.9-1.02 1.81-.1 1.09.7 2.15.8 2.29.1.14 1.63 2.5 3.95 3.5.55.24.98.38 1.32.49.56.18 1.07.15 1.48.09.45-.06 1.47-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.29z" fill="#ffffff" />
        </Svg>
      );
    case 'instagram':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.2}>
          <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <Circle cx="12" cy="12" r="4.5" />
          <Circle cx="18" cy="6" r="1.2" fill="#ffffff" />
        </Svg>
      );
    case 'facebook':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" fill="#ffffff" />
        </Svg>
      );
    case 'tiktok':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12.5 2v10.5a3.5 3.5 0 1 1-3.5-3.5h.5V5a7.5 7.5 0 1 0 7.5 7.5V6a4.5 4.5 0 0 1-4.5-4.01z" fill="#ffffff" />
        </Svg>
      );
    case 'snapchat':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2a5 5 0 0 0-5 5c0 3 2.5 4 2.5 5.5s-1.5 1-2.5 1.5S5.5 16 5.5 17s2 1.5 6.5 1.5 6.5-.5 6.5-1.5-1.5-1.5-1.5-2.5-1.5-1-2.5-1.5.5-1.5.5-3a5 5 0 0 0-5-5z" fill="#ffffff" />
        </Svg>
      );
    case 'games':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M21.58 2.42a1 1 0 0 0-1-.24c-.3.08-5.32 1.4-8.8 4.88-3.08 3.08-4.22 7.37-4.66 9.47L3 17.58V21h3.42l1.05-4.12c2.1-.44 6.39-1.58 9.47-4.66 3.48-3.48 4.8-8.5 4.88-8.8a1 1 0 0 0-.24-1zM11 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="#ffffff" />
        </Svg>
      );
    case 'roblox':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="4" width="16" height="16" rx="2" fill="#ffffff" />
          <Rect x="9" y="9" width="6" height="6" fill="#000000" />
        </Svg>
      );
    case 'subwaysurfers':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.2}>
          <Circle cx="12" cy="12" r="8" />
          <Path d="M12 7v10M7 12h10" />
        </Svg>
      );
    case 'candycrush':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm1 6a2 2 0 1 0-2 2v4a2 2 0 1 0 2 0V8z" fill="#ffffff" />
        </Svg>
      );
    case 'amongus':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2C9 2 7 4 7 7v10c0 3 2 5 5 5s5-2 5-5V7c0-3-2-5-5-5zm-3 7h6v2H9V9z" fill="#ffffff" />
        </Svg>
      );
    case 'entertainment':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M8 5v14l11-7z" fill="#ffffff" />
        </Svg>
      );
    case 'youtube':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M23 12s0-5.5-1-7.5c-.5-1.5-1.5-2.5-3-3C17 1 12 1 12 1S7 1 5 1.5c-1.5.5-2.5 1.5-3 3C1 6.5 1 12 1 12s0 5.5 1 7.5c.5 1.5 1.5 2.5 3 3 2 .5 7 .5 7 .5s5 0 7-.5c1.5-.5 2.5-1.5 3-3 .8-2 .8-7.5.8-7.5zM9.5 8.5l7 3.5-7 3.5v-7z" fill="#ffffff" />
        </Svg>
      );
    case 'netflix':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M4 2v20h4V9.5l8 12.5h4V2h-4v12.5L8 2H4z" fill="#ffffff" />
        </Svg>
      );
    case 'spotify':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-1.007-.336.08-.663-.135-.742-.47-.078-.337.136-.664.47-.743 3.86-.88 7.15-.51 9.818 1.13.292.18.384.564.207.86zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.185-.412.124-.843-.11-.967-.52-.124-.413.11-.844.52-.968 3.67-1.11 8.243-.57 11.337 1.33.368.226.488.706.26 1.074zm.106-2.833C14.385 8.878 8.55 8.685 5.168 9.712c-.52.158-1.07-.14-1.228-.66-.158-.522.14-1.07.662-1.228 3.882-1.18 10.315-.96 14.388 1.458.468.277.622.884.344 1.353-.278.47-.885.623-1.353.345z" fill="#ffffff" />
        </Svg>
      );
    case 'productivity':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#ffffff" />
        </Svg>
      );
    case 'slack':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 1 1 2 2H6v-2zm0-5a2 2 0 1 1-2-2v2h2V7zm0 1a2 2 0 1 1 2-2v2H6V8zm6 4a2 2 0 1 1 2-2h-2v2zm-1 0a2 2 0 1 1-2-2h2v2zm0 5a2 2 0 1 1 2 2h-2v-2zm0-1a2 2 0 1 1-2 2h2v-2z" fill="#ffffff" />
        </Svg>
      );
    case 'notion':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M4 3h16v18H4V3zm4 3v12h2.5V8.5L14 18h2.5V6H14v9.5L10.5 6H8z" fill="#ffffff" />
        </Svg>
      );
    case 'gmail':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#ffffff" />
        </Svg>
      );
    case 'other':
      return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}>
          <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
        </Svg>
      );
    default:
      const letter = label ? label.charAt(0).toUpperCase() : '?';
      return (
        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>{letter}</Text>
        </View>
      );
  }
}

export default function AppPickerScreen({ onContinue }: { onContinue: (selected: string[]) => void }) {
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
                  group: cat
                });
              });
            });
            
            setEntries(newList);
            return;
          }
        } catch (e) {
          console.warn('Failed to fetch installed apps', e);
        }
      }
      
      setEntries(defaults);
    };
    load();
  }, []);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Title Header */}
      <Text style={styles.hint}>
        Use <Text style={styles.hintIconHighlight}>🔍</Text> Search or tap <Text style={styles.hintIconHighlight}>›</Text> to select apps/websites
      </Text>

      {/* Main card list */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.listCard}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                    {isSelected ? (
                      <Text style={styles.radioTick}>✓</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                
                {/* Right touchable row content */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleRowPress(e)}
                  style={styles.rowRightContent}
                >
                  <View style={[styles.appIcon, { backgroundColor: e.tint }]}>
                    <AppIconSvg id={e.id} label={e.name} />
                  </View>
                  
                  <Text style={styles.appName}>{e.name}</Text>
                  
                  {e.expandable ? (
                    <Text style={[styles.chevron, expanded && styles.chevronDown]}>
                      {expanded ? '▾' : '›'}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* Search input field inside the card container at bottom */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.searchInput}
          />
          <Text style={styles.micIcon}>🎙</Text>
        </View>
      </Animated.View>

      <Text style={styles.countLabel}>{selected.length} Apps Selected</Text>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={() => onContinue(selected)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 18,
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 26,
    marginBottom: 26,
    lineHeight: 22,
  },
  hintIconHighlight: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listCard: {
    flex: 1,
    backgroundColor: '#141517', // premium card dark color
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '62%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: '#7CF5B0', // brand green checkbox highlight
    borderColor: '#7CF5B0',
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
