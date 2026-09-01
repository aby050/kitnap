import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

const BENEFITS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'target', title: 'Set up in minutes', desc: 'Pick a theme and your apps — no complicated rules to learn.' },
  { icon: 'clock', title: 'Get 2+ hours back daily', desc: 'Less scrolling. More time for the things that matter.' },
  { icon: 'trendUp', title: 'Get more done', desc: 'Fewer interruptions means deeper, uninterrupted focus blocks.' },
  { icon: 'moon', title: 'Sleep better', desc: 'Stop late-night scrolling with a bedtime schedule that actually works.' },
];

export default function BenefitsScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Here's how this can help you in the next week
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.wave}>
          <Svg width={320} height={40} viewBox="0 0 320 40">
            <Path
              d="M0 20 Q 20 4, 40 20 T 80 20 T 120 20 T 160 20 T 200 20 T 240 20 T 280 20 T 320 20"
              stroke={palette.accent}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <View style={styles.list}>
          {BENEFITS.map((b, i) => (
            <Animated.View key={b.title} entering={FadeInDown.delay(280 + i * 90).duration(420)} style={styles.row}>
              <View style={styles.iconTile}>
                <Icon name={b.icon} size={22} color={palette.accent} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{b.title}</Text>
                <Text style={styles.desc}>{b.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 40 },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  wave: { alignItems: 'center', marginTop: 26, marginBottom: 10 },
  list: { marginTop: 20, gap: 22 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.text, fontSize: 17, fontWeight: '700' },
  desc: { color: palette.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
