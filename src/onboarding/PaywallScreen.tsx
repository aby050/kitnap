import { PLAN_BAILOUTS } from '../data/purchases';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/ui';
import { fonts, palette, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';


/**
 * One capability, as a row of the hero panel.
 *
 * These were three lines of running text with a bare glyph in a 34pt gutter —
 * the whole screen after the removed chart was a headline and a paragraph,
 * which is why it read as unfinished rather than as an offer.
 */
function Capability({
  mark,
  title,
  desc,
  last,
}: {
  mark: IconName;
  title: string;
  desc: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.capRow, !last && styles.capDivider]}>
      <View style={styles.capIcon}>
        <Icon name={mark} size={19} color={palette.text} strokeWidth={1.8} />
      </View>
      <View style={styles.capText}>
        <Text style={styles.capTitle}>{title}</Text>
        <Text style={styles.capDesc}>{desc}</Text>
      </View>
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

        {/* Where the fabricated efficacy chart used to be.
         *
         *  That chart drew two invented curves — "Regular Users" against "Our
         *  Members" — under an axis reading "Screen Time After 2 weeks", with
         *  no data behind either line. At the exact moment someone is asked
         *  to pay, that is an unsubstantiated efficacy claim: a 2.3.1 risk, a
         *  consumer-protection risk, and against this project's own rule
         *  about printing numbers it has not measured. It had to go.
         *
         *  What replaces it is not a claim about outcomes but a statement of
         *  what the money buys, given the weight the chart used to carry.
         *  Every line is a shipped capability. */}
        <Animated.View entering={FadeIn.delay(160).duration(450)} style={styles.hero}>
          <LinearGradient
            colors={[palette.accentSoft, 'rgba(255,255,255,0.02)']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.heroEyebrow}>WHAT A PLAN ADDS</Text>

          <Capability
            mark="key"
            title={`${PLAN_BAILOUTS.$rc_annual} bailouts a year`}
            desc="Topped up every renewal. One leaves a locked session early."
          />
          <Capability
            mark="shield"
            title="A friend holds the code"
            desc="Loosening Strict mode takes a code only they have, so you cannot quietly undo it at 11pm."
          />
          {/* Was "Strict mode, verified". Strict mode is free — the camera
              unlock is the product, not the upsell — so selling it here was
              charging for something the free plan already has. */}
          <Capability
            mark="calendar"
            title="Unlimited schedules"
            desc="Recurring windows that block on their own. The free plan gets one."
            last
          />
        </Animated.View>

        {/* Said here rather than only on the decline screen. A paywall that
            admits what you keep for nothing is the one people trust. */}
        <Animated.Text entering={FadeIn.delay(260).duration(420)} style={styles.freeNote}>
          Blocking, the movement unlocks and emergency access stay free forever.
          A plan adds the rest.
        </Animated.Text>
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
    fontFamily: fonts.extrabold,
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'left',
    lineHeight: 36,
    letterSpacing: -1.2,
    textTransform: 'lowercase',
    alignSelf: 'stretch',
  },
  headingAccent: { color: palette.accent },
  eyebrow: {
    color: palette.accent,
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  hero: {
    marginTop: 28,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.accentBorder,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroEyebrow: {
    color: palette.textTertiary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  capRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingVertical: 15 },
  capDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.hairline },
  capIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
  },
  capText: { flex: 1 },
  capTitle: { color: palette.text, fontFamily: fonts.semibold, fontSize: 15.5, fontWeight: '600' },
  capDesc: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  freeNote: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 8,
  },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
  declineLink: { color: palette.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 14, fontWeight: '600' },
});
