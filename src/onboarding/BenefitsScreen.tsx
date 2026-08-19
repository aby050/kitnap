import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

const BENEFITS = [
  { icon: '🎯', title: 'Set up in minutes', desc: 'Pick a theme and your apps — no complicated rules to learn.' },
  { icon: '⏰', title: 'Get 2+ hours back daily', desc: 'Less scrolling. More time for the things that matter.' },
  { icon: '📈', title: 'Get more done', desc: 'Fewer interruptions means deeper, uninterrupted focus blocks.' },
  { icon: '🌙', title: 'Sleep better', desc: 'Stop late-night scrolling with a bedtime schedule that actually works.' },
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
              stroke={colors.accent}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <View style={styles.list}>
          {BENEFITS.map((b, i) => (
            <Animated.View key={b.title} entering={FadeInDown.delay(280 + i * 90).duration(420)} style={styles.row}>
              <Text style={styles.icon}>{b.icon}</Text>
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
  heading: { color: colors.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  wave: { alignItems: 'center', marginTop: 26, marginBottom: 10 },
  list: { marginTop: 20, gap: 22 },
  row: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  icon: { fontSize: 24, width: 34 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  desc: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 4 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
