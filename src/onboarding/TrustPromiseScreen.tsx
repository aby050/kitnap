import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui';
import { fonts, palette } from '../design/tokens';

const ANDROID = Platform.OS === 'android';

/** Short on purpose: a title and one line. Anything longer was being skimmed. */
const PROMISES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'exit-outline', title: 'Leave any time', body: 'Turn it off in Settings.' },
  { icon: 'megaphone-outline', title: 'No ads. Ever.', body: 'Free plan included.' },
  {
    icon: 'lock-closed-outline',
    title: ANDROID ? 'Accessibility, one job' : 'No VPN, no spying',
    body: ANDROID ? 'Only sees which app opened.' : 'Apple’s Screen Time only.',
  },
  { icon: 'phone-portrait-outline', title: 'Data stays on your phone', body: 'No account, no cloud.' },
  { icon: 'medkit-outline', title: 'Emergency exit is free', body: 'One tap, always.' },
];

function ShieldHero() {
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
      <View style={styles.heroGlow}>
        <Ionicons name="shield-checkmark" size={42} color={palette.accent} />
      </View>
    </Animated.View>
  );
}

export default function TrustPromiseScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ShieldHero />
        <Animated.Text entering={FadeInDown.delay(100).duration(420)} style={styles.heading}>
          Five promises
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(160).duration(420)} style={styles.lede}>
          What Phonewise will never do to you.
        </Animated.Text>

        <View style={styles.list}>
          {PROMISES.map((p, i) => (
            <Animated.View key={p.title} entering={FadeInDown.delay(220 + 70 * i).duration(380)} style={styles.row}>
              <View style={styles.glyphBox}>
                <Ionicons name={p.icon} size={22} color={palette.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{p.title}</Text>
                <Text style={styles.body}>{p.body}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={palette.accent} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="I’m in" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  hero: { alignItems: 'center', marginBottom: 10 },
  heroGlow: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.accentSoft, borderWidth: 1, borderColor: palette.accentBorder, alignItems: 'center', justifyContent: 'center' },
  heading: {
    color: palette.text,
    fontFamily: fonts.bold,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  lede: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginTop: 2, marginBottom: 14 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
  },
  glyphBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.text, fontSize: 15.5, fontFamily: fonts.semibold, fontWeight: '700' },
  body: { color: 'rgba(255,255,255,0.74)', fontSize: 13, lineHeight: 18, marginTop: 2 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
});
