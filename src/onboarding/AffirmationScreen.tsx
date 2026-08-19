import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

/** A short positive beat between question blocks. Keeps the flow from feeling
 *  like a form, and it's the only place we're allowed to be warm. */
export default function AffirmationScreen({
  headline,
  body,
  autoAdvanceMs,
  onContinue,
}: {
  headline: string;
  body: string;
  autoAdvanceMs?: number;
  onContinue: () => void;
}) {
  useEffect(() => {
    if (!autoAdvanceMs) return;
    const t = setTimeout(onContinue, autoAdvanceMs);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(700)}>
          <OpalOrb size={150} awake />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(200).duration(450)} style={styles.headline}>
          {headline}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(340).duration(450)} style={styles.sub}>
          {body}
        </Animated.Text>
      </View>

      {!autoAdvanceMs && (
        <View style={styles.ctaWrap}>
          <GradientButton label="Continue" onPress={onContinue} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 20 },
  headline: { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 18 },
  sub: { color: colors.textDim, fontSize: 16.5, textAlign: 'center', lineHeight: 25, maxWidth: 320 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
