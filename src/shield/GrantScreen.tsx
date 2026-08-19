import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';

/** No guilt screens, no "are you sure you want to give up", no shattering streak.
 *  Shame produces uninstalls, not behaviour change. */
export default function GrantScreen({
  minutes,
  emergency,
  expiresAt,
  onDone,
  onMinimize,
}: {
  minutes: number;
  emergency?: boolean;
  /** Shared with the Dynamic-Island-style pill so the countdown survives leaving this screen. */
  expiresAt: number;
  onDone: () => void;
  onMinimize?: () => void;
}) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeIn.duration(400)} style={styles.glyph}>
          {emergency ? '🆘' : '⏳'}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(120).duration(400)} style={styles.headline}>
          {emergency ? 'Everything is open for 15 minutes.' : `${minutes} minutes.`}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(220).duration(400)} style={styles.sub}>
          {emergency
            ? 'No questions. Nothing logged against you. Go handle it.'
            : 'The world will remember, and it recovers.'}
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.timerPill}>
          <Text style={styles.timerText}>
            {mm}:{ss}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.ctaWrap}>
        {onMinimize && (
          <Pressable onPress={onMinimize} style={styles.minimizeCta}>
            <Text style={styles.minimizeText}>Continue in app ↓</Text>
          </Pressable>
        )}
        <Pressable onPress={onDone} style={styles.cta}>
          <Text style={styles.ctaText}>Done early</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 },
  glyph: { fontSize: 46 },
  headline: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center', lineHeight: 34 },
  sub: { color: colors.textDim, fontSize: 16, textAlign: 'center', lineHeight: 23, maxWidth: 300 },
  timerPill: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  timerText: { color: colors.accent, fontSize: 30, fontWeight: '800', letterSpacing: 1 },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 18, gap: 10 },
  cta: { paddingVertical: 16, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  ctaText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  minimizeCta: { paddingVertical: 16, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center' },
  minimizeText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
