import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { THEMES, ThemeKey } from '../data/themes';
import { colors } from '../theme';

export default function ThemePickerScreen({ onContinue }: { onContinue: (key: ThemeKey) => void }) {
  const [selected, setSelected] = useState<ThemeKey>('quiet');
  const theme = THEMES.find((t) => t.key === selected)!;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
        What are you protecting?
      </Animated.Text>
      <Text style={styles.sub}>This changes what the block screen says to you.</Text>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {THEMES.map((t, i) => {
          const active = t.key === selected;
          return (
            <Animated.View key={t.key} entering={FadeIn.delay(i * 50).duration(320)} style={styles.cell}>
              <Pressable onPress={() => setSelected(t.key)} style={[styles.card, active && styles.cardActive]}>
                <LinearGradient colors={t.palette} style={StyleSheet.absoluteFill} />
                <Text style={styles.cardGlyph}>{t.glyph}</Text>
                <Text style={styles.cardName}>{t.name}</Text>
                <Text style={styles.cardFor} numberOfLines={2}>
                  {t.forWho}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Animated.View key={selected} entering={FadeIn.duration(300)} style={styles.preview}>
        <Text style={styles.previewLabel}>YOUR BLOCK SCREEN WILL SAY</Text>
        <Text style={styles.previewLine}>“{theme.lines[0]}”</Text>
      </Animated.View>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={() => onContinue(selected)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  heading: { color: colors.text, fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 24, paddingHorizontal: 28 },
  sub: { color: colors.textDim, fontSize: 15, textAlign: 'center', marginTop: 8, paddingHorizontal: 34, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 20 },
  cell: { width: '50%', padding: 6 },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 16,
    height: 128,
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: { borderColor: colors.accent },
  cardGlyph: { fontSize: 24, position: 'absolute', top: 14, left: 16 },
  cardName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  cardFor: { color: 'rgba(255,255,255,0.65)', fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  preview: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  previewLabel: { color: colors.textFaint, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  previewLine: { color: colors.accent, fontSize: 17, fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 24 },
  ctaWrap: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 },
});
