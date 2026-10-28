import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import LineArt from './LineArt';
import { fonts } from '../design/tokens';
import { CardPanel, HIGHLIGHT, INK, INK_DIM, InkButton, PastelCard, TINTS } from './PastelCard';
import Icon from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';

export type PurchaseResult = {
  planName: string;
  bailouts: number;
  isTrial: boolean;
  /** RevenueCat's latestExpirationDate — the trial's free-until date, or the
   *  next renewal. Absent when the store didn't return one. */
  renewsAt?: string | null;
  /** True when this came from Restore Purchases rather than a fresh buy. */
  restored?: boolean;
  /** No plan was bought — either the store had nothing to sell or the user
   *  chose to carry on free. Confirming that is still confirmation: the old
   *  behaviour dropped them on the home screen with no idea what had just
   *  happened or what they were on. */
  free?: boolean;
};

const formatDate = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * The confirmation nobody should have to guess at.
 *
 * Dropping straight back into the app after paying leaves people wondering
 * whether it went through, so the moment gets its own screen stating the
 * three things they'd otherwise open Settings to check: what they're on, how
 * many bailouts they just got, and the exact date anything gets charged.
 */
export default function PurchaseSuccessScreen({
  result,
  onContinue,
}: {
  result: PurchaseResult;
  onContinue: () => void;
}) {
  const { planName, bailouts, isTrial, restored, free } = result;
  const date = formatDate(result.renewsAt);

  const title = free
    ? "You're on\nthe free plan."
    : restored
      ? 'Restored.\nYou were already in.'
      : isTrial
        ? "You're in.\nSeven days on us."
        : "You're in.\nWelcome to Kitnap.";

  // Every branch has to survive a missing date — the store does not always
  // return one, and "Free until null" is worse than saying nothing.
  const sub = free
    ? `Everything that blocks apps is on, with ${bailouts} bailout${bailouts === 1 ? '' : 's'} to spend. You can pick a plan any time in Settings.`
    : isTrial
    ? date
      ? `Free until ${date}. Cancel any time before then and you're never charged.`
      : "Free for seven days. Cancel any time before it ends and you're never charged."
    : date
      ? `${planName} active. Renews ${date}.`
      : `${planName} active.`;

  return (
    <PastelCard tint={TINTS.cream}>
      <View style={paper.body}>
        <Animated.View entering={FadeIn.duration(420)}>
          <LineArt name={free ? 'kite' : 'gift'} height={230} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(420)}>
          <Text style={paper.title}>
            {title.split('\n')[0]}{' '}
            <Text style={{ color: HIGHLIGHT }}>{title.split('\n')[1] ?? ''}</Text>
          </Text>
          <Text style={paper.sub}>{sub}</Text>
          {bailouts > 0 && !free && (
            <View style={paper.pill}>
              <BailoutGlyph size={15} />
              <Text style={paper.pillText}>
                {bailouts} bailout{bailouts === 1 ? '' : 's'} added
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
      <CardPanel>
        <InkButton label="Start blocking" onPress={onContinue} />
        <Text style={paper.footnote}>
          {free
            ? 'Nothing was charged.'
            : isTrial
              ? "We'll remind you two days before it ends."
              : 'Bailouts refill with each renewal.'}
        </Text>
      </CardPanel>
    </PastelCard>
  );
}

const paper = StyleSheet.create({
  body: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 12 },
  title: { color: INK, fontFamily: fonts.bold, fontSize: 34, lineHeight: 40, marginTop: 12 },
  sub: { color: INK_DIM, fontFamily: fonts.regular, fontSize: 16.5, lineHeight: 24, marginTop: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 16,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: INK,
  },
  pillText: { color: INK, fontFamily: fonts.semibold, fontSize: 14 },
  footnote: { color: INK_DIM, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  // The card's azure edge glows against the near-black page; the shadow is
  // what stops it reading as a sticker pasted onto the background.
  cardShadow: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
  },
  card: { borderRadius: 28, padding: 24, overflow: 'hidden' },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#EAFFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  title: { color: '#FFFFFF', fontSize: 27, fontWeight: '800', lineHeight: 34 },
  sub: { color: 'rgba(255,255,255,0.82)', fontSize: 14.5, lineHeight: 21, marginTop: 10 },
  bailoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bailoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  footnote: { color: palette.textTertiary, fontSize: 13, textAlign: 'center', marginTop: 22 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
