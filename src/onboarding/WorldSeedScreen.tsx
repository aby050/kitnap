import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import WorldRing from '../world/WorldRing';
import { GradientButton } from '../components/ui';
import { ThemeKey } from '../data/themes';
import { colors } from '../theme';

/** Step 9. The world is 20 seconds old but it's already theirs — that's the
 *  sunk cost the paywall on the next screen is monetising, not the guilt. */
export default function WorldSeedScreen({
  themeKey,
  onContinue,
}: {
  themeKey: ThemeKey;
  onContinue: () => void;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(900)}>
          <WorldRing themeKey={themeKey} hoursReclaimed={0} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(500).duration(500)} style={styles.headline}>
          This is day one.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(700).duration(500)} style={styles.sub}>
          Bare, for now. Every hour you don't give away raises something on it — and nothing you build here
          ever comes back down.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(950).duration(500)} style={styles.ghostHint}>
          The faint shape is your first landmark. It needs one hour.
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 14 },
  headline: { color: colors.text, fontSize: 27, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  sub: { color: colors.textDim, fontSize: 15.5, textAlign: 'center', lineHeight: 23, maxWidth: 320 },
  ghostHint: { color: colors.accent, fontSize: 14, textAlign: 'center', marginTop: 6 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
