import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import WorldRing from '../world/WorldRing';
import { GradientButton } from '../components/ui';
import { ThemeKey } from '../data/themes';
import { palette } from '../design/tokens';

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
          We're not a fancy app. No feeds, no filters, no noise — less to look at means less to distract you.
          What's running underneath is the part that actually works: the same pattern of use that got you here
          quietly builds the case for change, hour by hour.
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(950).duration(500)} style={styles.ghostHint}>
          Every hour you don't give away raises something here — and it never comes back down.
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
  headline: { color: palette.text, fontSize: 27, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  sub: { color: palette.textSecondary, fontSize: 15.5, textAlign: 'center', lineHeight: 23, maxWidth: 320 },
  ghostHint: { color: palette.accent, fontSize: 14, textAlign: 'center', marginTop: 6 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
