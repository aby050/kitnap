import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { FREE_EMERGENCY_TOKENS } from '../data/store';
import { purchaseSubscription, restorePurchases } from '../data/purchases';
import { PurchaseResult } from './PurchaseSuccessScreen';

const TERMS_URL = 'https://byre.app/terms';
const PRIVACY_URL = 'https://byre.app/privacy';

/** The annual package out of the discount offering. */
function annualOf(offering?: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) return null;
  return (
    offering.annual ??
    offering.availablePackages.find((p) => p.identifier === '$rc_annual') ??
    offering.availablePackages[0] ??
    null
  );
}

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

export default function DiscountPaywallScreen({
  onStart,
  onClose,
  offering,
  fullPriceOffering,
  onPurchased,
}: {
  /** Called after a successful purchase or restore. */
  onStart: (result?: PurchaseResult) => void;
  onClose: () => void;
  /** The `discount` offering. Without it this screen can't sell anything —
   *  App.tsx skips the stage entirely rather than render a dead offer. */
  offering?: PurchasesOffering | null;
  /** The regular offering, used only for the struck-through comparison price
   *  so the saving is real rather than an invented "was" figure. */
  fullPriceOffering?: PurchasesOffering | null;
  onPurchased?: (bailouts: number) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pkg = annualOf(offering);
  const fullPkg = annualOf(fullPriceOffering);
  // No hardcoded fallback: a price we cannot read from the store is a price
  // we do not print. The old '₹579.00' default rendered rupees to every
  // storefront on earth whenever RevenueCat failed to answer.
  const price = pkg?.product.priceString ?? null;
  const wasPrice = fullPkg?.product.priceString ?? null;
  const intro = pkg?.product.introPrice;
  const trialDays = intro && intro.price === 0 ? intro.periodNumberOfUnits : null;

  const buy = async () => {
    if (!pkg) {
      // Same reasoning as the plan picker: never advance silently. State the
      // outcome rather than dropping the user on the home screen unbriefed.
      onStart({
        planName: 'Free plan',
        bailouts: FREE_EMERGENCY_TOKENS,
        isTrial: false,
        free: true,
      });
      return;
    }
    setBusy(true);
    const res = await purchaseSubscription(pkg);
    setBusy(false);
    if (res.status === 'success') {
      onPurchased?.(10);
      onStart({
        planName: 'Yearly',
        bailouts: 10,
        isTrial: !!trialDays,
        renewsAt: res.info.latestExpirationDate,
      });
    } else if (res.status === 'error') {
      Alert.alert("That didn't go through", res.message);
    }
  };

  const restore = async () => {
    setBusy(true);
    const res = await restorePurchases();
    setBusy(false);
    if (res.status === 'success') {
      onStart({
        planName: 'Yearly',
        bailouts: 10,
        isTrial: false,
        renewsAt: res.info.latestExpirationDate,
        restored: true,
      });
    } else if (res.status === 'error') {
      Alert.alert('Nothing to restore', res.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
        <Icon name="close" size={18} color={palette.text} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.bolt}>
          <Icon name="bolt" size={40} color={palette.accent} strokeWidth={1.8} />
        </Animated.View>

        {/* Apple 3.1.2(c): "50% OFF" used to be the largest, brightest text
            on the screen (27px/800 in accent) while the billed amount sat at
            21px — the discount outranking the price is exactly what the
            guideline prohibits. The saving is now stated plainly and the
            billed amount is the hero below. */}
        <Animated.Text entering={FadeInDown.duration(450)} style={styles.heading}>
          Before you go —{'\n'}here's half off
        </Animated.Text>

        <View style={{ height: 34 }} />

        <Feature icon={<Icon name="shield" size={19} color={palette.text} />} title="A friend holds the code." desc="Loosening Strict mode takes a code only they have — you send it yourself." />
        <Feature icon={<Icon name="calendar" size={19} color={palette.text} />} title="10 emergency tokens." desc="For the moments a challenge genuinely can't wait." />
        <Feature icon={<Icon name="user" size={19} color={palette.text} />} title="Strict mode, verified." desc="Push-ups and squats confirmed on camera, not on trust." />

        <View style={{ height: 22 }} />

        <View>
          <View style={styles.offerBadgeWrap}>
            <LinearGradient
              colors={['#dcf87a', '#9df5c0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.offerBadge}
            >
              <Text style={styles.offerBadgeText}>50% OFF</Text>
            </LinearGradient>
          </View>
          <View style={styles.planCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>Yearly</Text>
              {trialDays ? <Text style={styles.planSub}>{trialDays}-day free trial</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {wasPrice ? <Text style={styles.planStrike}>{wasPrice}</Text> : null}
              {price ? (
                <Text style={styles.planPrice}>
                  {price}
                  <Text style={styles.planPer}>/yr</Text>
                </Text>
              ) : (
                <Text style={styles.planSub}>Unavailable</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.terms}>
          {price
            ? `${trialDays ? `${trialDays} days free, then ` : ''}${price} a year, renewing automatically until you cancel. Turn off auto-renew at least 24 hours before the period ends in your Apple Account settings.`
            : 'Pricing is unavailable right now — the free plan still works.'}
        </Text>
      </ScrollView>

      <View style={styles.ctaWrap}>
        {/* 3.1.2(c) — the largest control on the screen states the billed
            amount. It previously read "Start My Free Trial" with no price
            anywhere on it whenever an intro offer existed. */}
        <GradientButton
          label={busy ? 'One moment…' : price ? `Subscribe — ${price}/yr` : 'Continue'}
          onPress={busy ? () => {} : buy}
        />
        {!!trialDays && !busy && (
          <Text style={styles.trialSub}>{trialDays} days free first</Text>
        )}
        {busy && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}
        <Text style={styles.expiry}>Offer expires when you leave this screen</Text>
        <View style={styles.legalRow}>
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms
          </Text>
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy
          </Text>
          <Text style={styles.legalLink} onPress={busy ? undefined : restore}>
            Restore
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  closeBtn: { position: 'absolute', top: 54, left: 22, zIndex: 10 },
  closeIcon: { color: palette.text, fontSize: 24, fontWeight: '300' },
  scroll: { paddingHorizontal: 24, paddingTop: 46, paddingBottom: 10 },
  bolt: { marginBottom: 22, alignItems: 'center' },
  heading: { color: palette.text, fontSize: 27, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  headingAccent: { color: '#c9f57a' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  featureIcon: { fontSize: 19, width: 36 },
  featureIconWrap: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  featureTitle: { color: palette.text, fontWeight: '700' },
  featureDesc: { color: 'rgba(255,255,255,0.8)' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  stars: { color: '#FFC94A', fontSize: 15, letterSpacing: 2 },
  reviewText: { color: palette.textSecondary, fontSize: 13.5 },
  offerBadgeWrap: { alignItems: 'center', zIndex: 5, marginBottom: -14 },
  offerBadge: { borderRadius: 16, paddingVertical: 7, paddingHorizontal: 18 },
  offerBadgeText: { color: '#0b2a14', fontSize: 11.5, fontWeight: '700' },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#7dd8ff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  planTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  planSub: { color: palette.textSecondary, fontSize: 13.5, marginTop: 3 },
  planStrike: { color: palette.textTertiary, fontSize: 13, textDecorationLine: 'line-through' },
  // 3.1.2(c) — the most conspicuous pricing element in the flow.
  planPrice: { color: palette.text, fontSize: 30, fontWeight: '900', marginTop: 2 },
  planPer: { color: palette.textSecondary, fontSize: 14, fontWeight: '600' },
  terms: { color: palette.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 14 },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 12 },
  expiry: { color: palette.textTertiary, fontSize: 12.5, textAlign: 'center', marginTop: 12 },
  trialSub: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: 10 },
  legalLink: { color: palette.textSecondary, fontSize: 13.5 },
});
