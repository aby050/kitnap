import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reloadAppAsync } from 'expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radius, space, type } from '../design/tokens';
import {
  APPEARANCES,
  Appearance,
  appearance as activeAppearance,
  persistAppearance,
} from '../design/appearance';
import Icon from '../ui/Icon';
import { tapLight } from '../ui/haptics';

/**
 * Colour-scheme picker.
 *
 * Choosing reloads the app. That is not laziness — every screen freezes its
 * colours into a StyleSheet at import time (1,052 references across 79
 * files), so a repaint is the only way to apply the change everywhere rather
 * than to whichever screens happen to remount. The screen says so plainly
 * before it happens instead of appearing to crash.
 */
export default function AppearanceScreen({ onBack }: { onBack: () => void }) {
  const [pending, setPending] = useState<Appearance | null>(null);

  const choose = (next: Appearance) => {
    if (next === activeAppearance || pending) return;
    tapLight();
    Alert.alert(
      'Restart Byre?',
      'Byre needs to reopen to repaint every screen. Nothing you have set up is lost — blocks stay on the whole time.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Restart',
          style: 'default',
          onPress: async () => {
            setPending(next);
            persistAppearance(next);
            try {
              await reloadAppAsync('Appearance changed');
            } catch {
              // Reload is best-effort. If the platform refuses, the choice is
              // already persisted and lands the next time Byre opens.
              setPending(null);
              Alert.alert(
                'Saved',
                'The new look will appear the next time you open Byre.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Appearance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Two colourways, same app. This changes accents and the background
          glow — not what Byre blocks or how hard it is to get out.
        </Text>

        {APPEARANCES.map((a, i) => {
          const active = a.key === activeAppearance;
          return (
            <Animated.View key={a.key} entering={FadeInDown.delay(i * 70).duration(360)}>
              <Pressable
                onPress={() => choose(a.key)}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.swatch, { backgroundColor: a.swatch }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a.name}</Text>
                  <Text style={styles.blurb}>{a.blurb}</Text>
                </View>
                {pending === a.key ? (
                  <Text style={styles.pending}>Restarting…</Text>
                ) : active ? (
                  <View style={styles.check}>
                    <Icon name="check" size={14} color={palette.onLight} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}

        <Text style={styles.note}>
          Byre restarts when you switch, so the new colours reach every screen
          at once. Your blocks stay active the whole time.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: space.md,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...type.title3, color: palette.text },
  scroll: { paddingHorizontal: space.gutter, paddingBottom: space.tabClearance },
  intro: { ...type.sub, color: palette.textSecondary, marginBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.base,
    padding: space.base,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    marginBottom: space.sm,
  },
  rowActive: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  rowPressed: { opacity: 0.85 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  name: { ...type.bodyStrong, color: palette.text },
  blurb: { ...type.caption, color: palette.textSecondary, marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: { ...type.caption, color: palette.textSecondary },
  note: { ...type.caption, color: palette.textTertiary, marginTop: space.base, lineHeight: 18 },
});
