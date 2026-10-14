import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ByreOrb from '../components/ByreOrb';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';

export default function GroundRulesScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(700)}>
          <ByreOrb size={190} awake />
        </Animated.View>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.heading}>
            now the <Text style={{ color: palette.accent }}>ground rules.</Text>
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(450).duration(500)} style={styles.sub}>
            Three quick choices: what to block, how hard it should be to get back in, and a note to your future self.
          </Animated.Text>
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 44 },
  heading: {
    color: palette.text,
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -1.2,
    maxWidth: 320,
  },
  sub: { color: 'rgba(255,255,255,0.78)', fontSize: 15.5, lineHeight: 22, textAlign: 'center', maxWidth: 300 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
