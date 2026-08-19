import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

type Entry = { id: string; name: string; icon: string; tint: string; group?: string; expandable?: boolean };

const ENTRIES: Entry[] = [
  { id: 'all', name: 'All Apps & Categories', icon: '📚', tint: '#2f3640' },
  { id: 'social', name: 'Social', icon: '💬', tint: '#e0245e', expandable: true },
  { id: 'facetime', name: 'FaceTime', icon: '📹', tint: '#2ecc71', group: 'social' },
  { id: 'messages', name: 'Messages', icon: '💬', tint: '#2ecc71', group: 'social' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', tint: '#ffffff', group: 'social' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📞', tint: '#25D366', group: 'social' },
  { id: 'games', name: 'Games', icon: '🚀', tint: '#2f3640', expandable: true },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', tint: '#8e44ad', expandable: true },
  { id: 'productivity', name: 'Productivity', icon: '📈', tint: '#3498db', expandable: true },
];

export default function AppPickerScreen({ onContinue }: { onContinue: (selected: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const visible = ENTRIES.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.hint}>
        Use <Text style={styles.hintIcon}>🔍</Text> Search or tap <Text style={styles.hintIcon}>›</Text> to select
        apps/websites
      </Text>

      <Animated.View entering={FadeIn.duration(400)} style={styles.listCard}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {visible.map((e, i) => {
            const isSelected = selected.includes(e.id);
            return (
              <Pressable
                key={e.id}
                onPress={() => toggle(e.id)}
                style={[styles.row, i > 0 && styles.rowBorder, e.group && styles.rowNested]}
              >
                <View style={[styles.radio, isSelected && styles.radioOn]}>
                  {isSelected ? <Text style={styles.radioTick}>✓</Text> : null}
                </View>
                <View style={[styles.appIcon, { backgroundColor: e.tint }]}>
                  <Text style={styles.appIconGlyph}>{e.icon}</Text>
                </View>
                <Text style={styles.appName}>{e.name}</Text>
                {e.expandable ? <Text style={styles.chevron}>›</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
          />
          <Text style={styles.searchIcon}>🎙</Text>
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
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  hint: { color: colors.textDim, fontSize: 15.5, textAlign: 'center', marginTop: 30, marginBottom: 26, lineHeight: 22 },
  hintIcon: { color: colors.text },
  listCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '62%',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
  rowNested: { backgroundColor: 'rgba(255,255,255,0.03)' },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  radioTick: { color: '#062', fontSize: 13, fontWeight: '900' },
  appIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  appIconGlyph: { fontSize: 16 },
  appName: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '500' },
  chevron: { color: colors.textFaint, fontSize: 20 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, color: colors.text, fontSize: 15.5 },
  countLabel: { color: colors.textDim, fontSize: 15, textAlign: 'center', marginTop: 22 },
  ctaWrap: { paddingBottom: 14, paddingTop: 14 },
});
