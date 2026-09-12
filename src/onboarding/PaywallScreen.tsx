import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';


/** Flat-ish grey curve (regular users) and a descending aurora curve (members). */

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>{icon}</View>
      <Text style={styles.featureText}>
        <Text style={styles.featureTitle}>{title} </Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </Text>
    </View>
  );
}

export default function PaywallScreen({
  onContinue,
  onDecline,
  name,
  personalLine,
  hoursBack = 2,
}: {
  onContinue: () => void;
  /** "Not now" — the discount retention offer (DiscountPaywallScreen) is
   *  only ever shown from here, never unconditionally in the funnel. */
  onDecline?: () => void;
  name?: string;
  /** A line built from the user's own onboarding answers — this is what
   *  makes the paywall feel built for them instead of generic. */
  personalLine?: string;
  hoursBack?: number;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {personalLine ? (
          <Animated.Text entering={FadeInDown.duration(400)} style={styles.eyebrow}>
            {personalLine}
          </Animated.Text>
        ) : null}
        <Animated.Text entering={FadeInDown.delay(80).duration(450)} style={styles.heading}>
          {name ? `${name}, this is` : 'This is'} the part{'\n'}
          <Text style={styles.headingAccent}>that makes it work</Text>
        </Animated.Text>

        {/* The fabricated efficacy chart that used to sit here has been
            removed. It drew two invented curves — "Regular Users" against
            "Our Members" — under an axis reading "Screen Time After 2 weeks",
            with no data behind either line. Shown at the exact moment someone
            is asked to pay, that is an unsubstantiated efficacy claim: an App
            Review risk under 2.3.1, a consumer-protection risk, and a direct
            contradiction of this project's own rule against printing numbers
            it has not measured. Nothing replaces it, because there is nothing
            true to put in its place yet. */}

        <View style={{ height: 26 }} />

        <Feature icon={<Icon name="shield" size={19} color={palette.text} />} title="A friend holds the code." desc="Loosening Strict mode takes a code only they have — you send it yourself." />
        <Feature icon={<Icon name="calendar" size={19} color={palette.text} />} title="10 emergency tokens." desc="For the moments a challenge genuinely can't wait." />
        <Feature icon={<Icon name="user" size={19} color={palette.text} />} title="Strict mode, verified." desc="Push-ups and squats confirmed on camera, not on trust." />

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
        {onDecline && (
          <Text style={styles.declineLink} onPress={onDecline}>
            Not now
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 10 },
  heading: {
    color: palette.text,
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 33,
  },
  headingAccent: { color: palette.accent },
  eyebrow: {
    color: palette.accent,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  featureIcon: { fontSize: 19, width: 34 },
  featureIconWrap: { width: 34, alignItems: 'flex-start', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  featureTitle: { color: palette.text, fontWeight: '700' },
  featureDesc: { color: 'rgba(255,255,255,0.8)' },
  stars: { color: '#FFC94A', fontSize: 17, letterSpacing: 3, textAlign: 'center' },
  reviews: { color: palette.text, fontSize: 14.5, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
  declineLink: { color: palette.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 14, fontWeight: '600' },
});
