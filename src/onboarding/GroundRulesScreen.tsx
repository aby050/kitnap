import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

export default function GroundRulesScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(700)}>
          <OpalOrb size={190} awake />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.heading}>
          Great, now let's set some ground Rules.
        </Animated.Text>
      </View>
      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 60 },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    maxWidth: 300,
  },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
