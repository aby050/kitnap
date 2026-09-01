import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { THEMES, ThemeKey } from '../data/themes';
import Icon from '../ui/Icon';
import { palette } from '../design/tokens';

/** What the shield actually shows. Themes stay swappable independent of
 *  onboarding — changing your mind later shouldn't mean redoing setup. */
export default function BlockScreensScreen({
  themeKey,
  onSelectTheme,
  onBack,
}: {
  themeKey: ThemeKey;
  onSelectTheme: (k: ThemeKey) => void;
  onBack: () => void;
}) {
  const [showDeadline, setShowDeadline] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [showUnlockCount, setShowUnlockCount] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Block Screens</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Voice</Text>
        <View style={styles.themeGrid}>
          {THEMES.map((t, i) => {
            const active = t.key === themeKey;
            return (
              <Animated.View key={t.key} entering={FadeInDown.delay(i * 45).duration(320)} style={styles.themeCell}>
                <Pressable onPress={() => onSelectTheme(t.key)} style={[styles.themeCard, active && styles.themeCardActive]}>
                  <LinearGradient colors={t.palette} style={StyleSheet.absoluteFill} />
                  <View style={styles.themeGlyph}>
                    <Icon name={t.mark} size={22} color="#FFFFFF" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.themeName}>{t.name}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>What appears on it</Text>
        <View style={styles.card}>
          <ToggleRow
            title="Your deadline countdown"
            desc="“Exam in 12 days.” Only shows if you've set one."
            value={showDeadline}
            onChange={setShowDeadline}
          />
          <ToggleRow
            title="Your photo"
            desc="Replaces the theme icon with the one you chose."
            value={showPhoto}
            onChange={setShowPhoto}
          />
          <ToggleRow
            title="Today's unlock count"
            desc="“Unlock #3 today.” Some people find the number itself the deterrent."
            value={showUnlockCount}
            onChange={setShowUnlockCount}
            last
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Emergency always appears, regardless of these settings — it's never something you can turn off for
            yourself in a weak moment, only in a clear one.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
  last,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, !last && styles.toggleRowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: palette.accent, false: 'rgba(255,255,255,0.2)' }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: palette.text, fontSize: 19 },
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  sectionTitle: { color: palette.text, fontSize: 19, fontWeight: '800', marginTop: 18, marginBottom: 14 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  themeCell: { width: '50%', padding: 5 },
  themeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 14,
    height: 100,
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardActive: { borderColor: palette.accent },
  themeGlyph: { position: 'absolute', top: 12, left: 14 },
  themeName: { color: '#fff', fontSize: 15, fontWeight: '800' },
  card: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  toggleTitle: { color: palette.text, fontSize: 15.5, fontWeight: '600' },
  toggleDesc: { color: palette.textSecondary, fontSize: 12.5, marginTop: 4, lineHeight: 17 },
  note: { marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)' },
  noteText: { color: palette.textTertiary, fontSize: 13, lineHeight: 19 },
});
