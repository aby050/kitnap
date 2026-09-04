import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { PurchasesPackage } from 'react-native-purchases';
import { purchaseSubscription, restorePurchases } from '../data/purchases';
import { PurchaseResult } from './PurchaseSuccessScreen';

const STEPS: { icon: IconName; title: string; body: string; done: boolean }[] = [
  {
    icon: 'check',
    title: 'Start your first block',
    body: "You're on your way to turning intention into a daily habit.",
    done: true,
  },
  {
    icon: 'unlock',
    title: 'Today: take back your focus',
    body: 'Start your 7-day free trial and unlock Strict mode, schedules and Autofocus.',
    done: false,
  },
  {
    icon: 'bell',
    title: 'Day 5: we remind you',
    body: "We'll notify you two days before the trial ends. No surprise charge, ever.",
    done: false,
  },
  {
    icon: 'rocket',
    title: 'Day 7: keep it going',
    body: 'Only if you want to. Cancel in two taps and nothing you built is lost.',
    done: false,
  },
];

/** Bailouts are the one thing that differs by plan in a way people actually
 *  feel, so each plan states its own count rather than burying it in a
 *  features list. Yearly's ten is the reason to pick yearly. */
type Plan = {
  key: string;
  name: string;
  note: string;
  price: string;
  per: string;
  bailouts: number;
  badge?: string;
  pkg?: PurchasesPackage;
};

/** Shown only until the store answers, and on the rare launch where it never
 *  does. Real prices come from RevenueCat so they are localised and correct
 *  in every storefront — hardcoded ₹ figures are wrong for most of the world. */
const FALLBACK_PLANS: Plan[] = [
  {
    key: 'trial',
    name: '7-day free trial',
    note: 'Then ₹499/yr. Cancel anytime.',
    price: 'Free',
    per: '',
    bailouts: 1,
    badge: 'Start here',
  },
  { key: 'monthly', name: 'Monthly', note: 'Billed every month', price: '₹99', per: '/mo', bailouts: 2 },
  { key: 'yearly', name: 'Yearly', note: 'Only ₹41.58/mo — save 58%', price: '₹499', per: '/yr', bailouts: 10 },
];

/** How many bailouts each plan grants. Keyed by RevenueCat package
 *  identifier so the dashboard can reprice without touching this. */
const PLAN_BAILOUTS: Record<string, number> = { $rc_monthly: 2, $rc_annual: 10 };

/** Turns a RevenueCat offering into the rows this screen renders. A package
 *  with a free trial introductory offer becomes the "trial" row — the trial
 *  is an attribute of the product, not a separate SKU. */
function toPlans(pkgs: PurchasesPackage[]): Plan[] {
  const rows: Plan[] = [];
  for (const pkg of pkgs) {
    const p = pkg.product;
    const annual = pkg.identifier === '$rc_annual';
    const intro = p.introPrice;
    const bailouts = PLAN_BAILOUTS[pkg.identifier] ?? 2;
    if (intro && intro.price === 0) {
      rows.unshift({
        key: `trial:${pkg.identifier}`,
        name: `${intro.periodNumberOfUnits}-${intro.periodUnit.toLowerCase()} free trial`,
        note: `Then ${p.priceString}${annual ? '/yr' : '/mo'}. Cancel anytime.`,
        price: 'Free',
        per: '',
        bailouts: 1,
        badge: 'Start here',
        pkg,
      });
    }
    rows.push({
      key: pkg.identifier,
      name: annual ? 'Yearly' : 'Monthly',
      note: annual ? 'Billed once a year — best value' : 'Billed every month',
      price: p.priceString,
      per: annual ? '/yr' : '/mo',
      bailouts,
      pkg,
    });
  }
  return rows;
}

/** Deliberately no weekly plan, and the reminder promise is stated on the
 *  paywall itself — surprise charges are the single fastest route to a 1★. */
export default function TrialTimelineScreen({
  onStart,
  offering,
  onPurchased,
}: {
  /** Advances the funnel. Called after a successful purchase, and also on
   *  restore — a returning subscriber must never be walled in here. The
   *  result is passed on so the confirmation screen can state what was
   *  actually bought; it is absent when the store had no live product and we
   *  are simply letting the user through. */
  onStart: (result?: PurchaseResult) => void;
  offering?: { availablePackages: PurchasesPackage[] } | null;
  onPurchased?: (bailouts: number) => void;
}) {
  const PLANS = useMemo(() => {
    const live = offering?.availablePackages?.length ? toPlans(offering.availablePackages) : [];
    return live.length ? live : FALLBACK_PLANS;
  }, [offering]);

  const [plan, setPlan] = useState(PLANS[0].key);
  const [busy, setBusy] = useState(false);
  const selected = PLANS.find((p) => p.key === plan) ?? PLANS[0];

  const buy = async () => {
    // No live product — don't strand the user behind a dead button.
    if (!selected.pkg) {
      onStart();
      return;
    }
    setBusy(true);
    const res = await purchaseSubscription(selected.pkg);
    setBusy(false);
    if (res.status === 'success') {
      onPurchased?.(selected.bailouts);
      onStart({
        planName: selected.name,
        bailouts: selected.bailouts,
        isTrial: selected.key === 'trial' || !!selected.name.toLowerCase().includes('trial'),
        renewsAt: res.info?.latestExpirationDate ?? null,
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
        planName: 'Your plan',
        bailouts: 0,
        isTrial: false,
        renewsAt: res.info?.latestExpirationDate ?? null,
        restored: true,
      });
    } else if (res.status === 'error') Alert.alert('Nothing to restore', res.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Here's exactly what happens next
        </Animated.Text>

        <View style={styles.timeline}>
          {STEPS.map((s, i) => (
            <Animated.View key={s.title} entering={FadeInDown.delay(i * 90).duration(400)} style={styles.step}>
              <View style={styles.rail}>
                <View style={[styles.node, s.done && styles.nodeDone]}>
                  <Icon name={s.icon} size={16} color={s.done ? '#062' : palette.text} strokeWidth={2.5} />
                </View>
                {i < STEPS.length - 1 && <View style={[styles.line, s.done && styles.lineDone]} />}
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepText}>{s.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const active = p.key === plan;
            return (
              <Pressable key={p.key} onPress={() => setPlan(p.key)} style={[styles.plan, active && styles.planActive]}>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active ? <Icon name="check" size={13} color="#062" strokeWidth={2.8} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={styles.planNote}>{p.note}</Text>
                  <View style={styles.bailoutRow}>
                    <BailoutGlyph size={13} />
                    <Text style={styles.bailoutText}>
                      {p.bailouts} bailout{p.bailouts === 1 ? '' : 's'} included
                    </Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>
                  {p.price}
                  <Text style={styles.planPer}>{p.per}</Text>
                </Text>
                {p.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton
          label={
            busy
              ? 'One moment…'
              : selected.price === 'Free'
                ? 'Start my free days'
                : `Continue — ${selected.price}${selected.per}`
          }
          onPress={busy ? () => {} : buy}
        />
        {busy && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}
        <Text style={styles.legal}>
          {selected.price === 'Free'
            ? 'No payment due now. Cancel anytime — we remind you first.'
            : 'Cancel anytime. Bailouts refill with each renewal.'}
        </Text>
        <Pressable onPress={busy ? undefined : restore} hitSlop={10}>
          <Text style={styles.restore}>Restore purchases</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  restore: { color: palette.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 150 },
  heading: { color: palette.text, fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 31, marginBottom: 22 },
  timeline: {},
  step: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 40 },
  node: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: palette.accent },
  line: { width: 2.5, flex: 1, backgroundColor: palette.hairline, minHeight: 22 },
  lineDone: { backgroundColor: palette.accent },
  stepBody: { flex: 1, paddingBottom: 18 },
  stepTitle: { color: palette.text, fontSize: 16.5, fontWeight: '700' },
  stepText: { color: palette.textSecondary, fontSize: 14, lineHeight: 20.5, marginTop: 5 },
  plans: { gap: 10, marginTop: 6 },
  plan: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  planActive: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  planName: { color: palette.text, fontSize: 16.5, fontWeight: '700' },
  planNote: { color: palette.textSecondary, fontSize: 12.5, marginTop: 2 },
  bailoutRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  bailoutText: { color: palette.accent, fontSize: 12.5, fontWeight: '700' },
  planPrice: { color: palette.text, fontSize: 17, fontWeight: '800' },
  planPer: { color: palette.textSecondary, fontSize: 13, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { color: '#062', fontSize: 11.5, fontWeight: '800' },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 12 },
  legal: { color: palette.textTertiary, fontSize: 12.5, textAlign: 'center', marginTop: 12 },
});
