import React, { useMemo, useState } from 'react';
import { Linking, ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { fonts, palette } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { PurchasesPackage } from 'react-native-purchases';
import {
  PRIVACY_POLICY_URL,
  TERMS_URL,
  purchaseSubscription,
  restorePurchases,
} from '../data/purchases';
import { FREE_EMERGENCY_TOKENS } from '../data/store';
import { PurchaseResult } from './PurchaseSuccessScreen';

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
  /** True for a row whose product carries a free-trial intro offer. The
   *  billed amount (`price`/`per`) must still be what's rendered large and
   *  bold — Apple 3.1.2(c) requires the billed amount to be the most
   *  conspicuous pricing element, with the trial itself subordinate to it. */
  isTrial?: boolean;
  /** Human trial length, e.g. "7 days". Held as its own field because the row
   *  name is the billing term now — parsing the length back out of display
   *  copy broke the moment that copy changed. */
  trialLabel?: string;
  /** Trial length in days, for the real calendar dates below. */
  trialDays?: number;
};

/** "Sat 20 Sep" — short, unambiguous, no year on a date days away. */
function prettyDate(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * What actually happens, on real dates.
 *
 * This replaces a four-step illustrated rail reading "Today / Day 5: we
 * remind you / Day 7: keep it going" — the same graphic, often the same
 * wording, ships across this category and was part of why Byre's funnel read
 * as a reskin.
 *
 * Real dates are the smarter version of the same promise: "we'll remind you
 * on Thu 18 Sep" is checkable and "Day 5" is not, and a charge date someone
 * can put in their calendar is the single best defence against the surprise
 * -charge refund and the one-star review that follows it.
 */
function TrialTerms({ days, price }: { days: number; price: string }) {
  const remindOn = prettyDate(addDays(Math.max(1, days - 2)));
  const chargeOn = prettyDate(addDays(days));
  return (
    <View style={styles.terms}>
      <Text style={styles.termsLine}>
        <Text style={styles.termsStrong}>Free until {chargeOn}.</Text> Nothing is charged today.
      </Text>
      <Text style={styles.termsLine}>
        We'll remind you on <Text style={styles.termsStrong}>{remindOn}</Text>, two days before it ends.
      </Text>
      <Text style={styles.termsLine}>
        Then {price}. Cancel in two taps — nothing you set up is lost.
      </Text>
    </View>
  );
}

/** What the plan actually buys, named one by one.
 *
 *  The paywall used to open straight onto two priced rows. Asking someone to
 *  pick a billing term before anything has told them what they are billing
 *  for is the single most common reason a paywall reads as a shakedown — and
 *  under 4.3(a) an unexplained price list is exactly what an interchangeable
 *  reskin looks like. Every line below is a screen that exists in this build;
 *  nothing here is aspirational, and the free column is stated honestly
 *  underneath rather than hidden.
 */
const INCLUDED: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'shield',
    title: 'Blocking that holds',
    desc: 'Apps and categories stay shut. Loosening a rule waits a day, on purpose.',
  },
  {
    icon: 'activity',
    title: 'Unlock by moving',
    desc: 'The camera counts real reps. A quiz or a breathing pause if you would rather.',
  },
  {
    icon: 'calendar',
    title: 'Schedules that run themselves',
    desc: 'Recurring windows that start without you remembering to start them.',
  },
  {
    icon: 'key',
    title: 'Guardian code',
    desc: 'Someone you trust holds the key to your settings, so you cannot quietly undo it.',
  },
  {
    icon: 'chart',
    title: 'Your real numbers',
    desc: 'Pickups, hours and streaks by day, week and month — from iOS itself, not a guess.',
  },
];

/** Shown only until the store answers, and on the rare launch where it never
 *  does. These rows carry **no price at all** — deliberately. The previous
 *  version hardcoded ₹499/₹99, which is the wrong currency and the wrong
 *  number for every storefront outside India, and is what an App Review
 *  device on a US account would have been shown when RevenueCat failed to
 *  answer. A price we cannot read from the store is a price we do not print:
 *  the rows degrade to "unavailable" and the purchase falls through to the
 *  free plan, which `buy()` already handles when `pkg` is absent. */
const FALLBACK_PLANS: Plan[] = [
  { key: 'monthly', name: 'Monthly', note: 'Billed every month', price: '', per: '', bailouts: 2 },
  { key: 'yearly', name: 'Yearly', note: 'Billed once a year', price: '', per: '', bailouts: 10 },
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
      const unit = intro.periodUnit.toLowerCase();
      const plural = intro.periodNumberOfUnits === 1 ? unit : `${unit}s`;
      // Apple 3.1.2(c): the row is titled by what it *bills*, not by the
      // trial. Naming it "7-day free trial" made the free period the row's
      // identity and pushed the billed amount into a secondary position.
      // The trial survives as subordinate note copy underneath.
      rows.unshift({
        key: `trial:${pkg.identifier}`,
        name: annual ? 'Yearly' : 'Monthly',
        note: `${intro.periodNumberOfUnits} ${plural} free first, then billed ${p.priceString}${annual ? ' a year' : ' a month'}. Cancel anytime.`,
        price: p.priceString,
        per: annual ? '/yr' : '/mo',
        bailouts: 1,
        badge: 'Start here',
        pkg,
        isTrial: true,
        trialLabel: `${intro.periodNumberOfUnits} ${plural}`,
        trialDays: unit.startsWith('week')
          ? intro.periodNumberOfUnits * 7
          : unit.startsWith('month')
            ? intro.periodNumberOfUnits * 30
            : intro.periodNumberOfUnits,
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
    // No live product — the store has nothing to sell right now (offerings
    // failed to load, or the products aren't live yet). This used to call
    // `onStart()` with no result, which skipped the confirmation entirely and
    // dropped the user on the home screen: they had tapped Start, been
    // charged nothing, and been told nothing. Confirm the free plan instead,
    // so the outcome is always stated.
    if (!selected.pkg) {
      onStart({
        planName: 'Free plan',
        bailouts: FREE_EMERGENCY_TOKENS,
        isTrial: false,
        free: true,
      });
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
        isTrial: !!selected.isTrial,
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
        {/* The four-step "Day 5: we remind you / Day 7: keep it going"
            timeline that used to open this screen is gone. It is the most
            recognisable beat in the category's paywall — the same graphic,
            often the same wording, ships in most of the apps Byre was judged
            against under 4.3(a). The renewal terms it was illustrating are
            stated in full beneath the CTA, where guideline 3.1.2 expects
            them anyway. */}
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Everything Byre does, kept on
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(60).duration(420)} style={styles.subheading}>
          Here is what a plan covers, before you pick how to pay for it.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.included}>
          {INCLUDED.map((f, i) => (
            <View
              key={f.title}
              style={[styles.incRow, i < INCLUDED.length - 1 && styles.incDivider]}
            >
              <View style={styles.incIcon}>
                <Icon name={f.icon} size={17} color={palette.text} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.incTitle}>{f.title}</Text>
                <Text style={styles.incDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* The free plan is a real state, so say so here rather than only on
            the decline screen. A paywall that admits what you keep for
            nothing is the one people trust. */}
        <Text style={styles.freeNote}>
          Byre keeps working free forever — blocking, movement unlocks and emergency access are
          never behind a plan. A plan adds the rest, and tops up your bailouts.
        </Text>

        {selected.isTrial && selected.trialDays ? (
          <TrialTerms days={selected.trialDays} price={`${selected.price}${selected.per}`} />
        ) : null}

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
                {p.price ? (
                  <Text style={styles.planPrice}>
                    {p.price}
                    <Text style={styles.planPer}>{p.per}</Text>
                  </Text>
                ) : (
                  <Text style={styles.planPer}>Unavailable</Text>
                )}
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
        {/* Apple 3.1.2(c): the billed amount is the most conspicuous pricing
            element in the flow. This button is the largest thing on the
            screen, so it states the amount that will actually be charged —
            on the trial plan too, where the label used to read "Start my
            free days" and omit the price entirely. The free period is
            stated below, subordinate in size and colour. */}
        <GradientButton
          label={
            busy
              ? 'One moment…'
              : selected.price
                ? `Subscribe — ${selected.price}${selected.per}`
                : 'Continue'
          }
          onPress={busy ? () => {} : buy}
        />
        {selected.isTrial && !busy && (
          <Text style={styles.trialSub}>{selected.trialLabel} free first</Text>
        )}
        {busy && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}
        {/* Guideline 3.1.2 disclosure. The plan's title, length and price are
            on the row above; this states the renewal terms, and the two links
            below are required to be in the binary next to the purchase. */}
        <Text style={styles.legal}>
          {selected.isTrial
            ? `Free for ${selected.trialLabel}, then it renews at ${selected.price}${selected.per} unless you turn off auto-renew at least 24 hours before the trial ends. Manage or cancel any time in your Apple Account settings.`
            : `Renews automatically ${selected.per === '/yr' ? 'each year' : 'each month'} at the price shown unless you turn off auto-renew at least 24 hours before the period ends. Manage or cancel any time in your Apple Account settings.`}
        </Text>
        {/* A way past the paywall.
            Without this, a purchase that fails — no network, a declined card,
            a store outage, a sandbox hiccup — leaves the user on this screen
            with no route into the app they just installed. That is an App
            Review completeness risk (2.1) as well as a bad first run. The
            free plan is a real state the app already supports. */}
        <Pressable
          onPress={busy ? undefined : () => onStart({
            planName: 'Free plan',
            bailouts: FREE_EMERGENCY_TOKENS,
            isTrial: false,
            free: true,
          })}
          hitSlop={10}
          style={styles.freeWrap}
        >
          <Text style={styles.freeLink}>Continue with the free plan</Text>
        </Pressable>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={busy ? undefined : restore} hitSlop={8}>
            <Text style={styles.legalLink}>Restore</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  freeWrap: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  freeLink: { color: palette.textSecondary, fontSize: 14, fontWeight: '700' },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  legalLink: {
    color: palette.textTertiary,
    fontSize: 12.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalDot: { color: palette.textQuaternary, fontSize: 12.5 },
  container: { flex: 1, backgroundColor: 'transparent' },
  restore: { color: palette.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 150 },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 32, marginBottom: 22 },
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
  subheading: {
    color: palette.textSecondary,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 20.5,
    marginTop: -14,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  included: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
  },
  incRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, paddingVertical: 14 },
  incDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.hairline },
  /* White glyph on a neutral disc. An accent-tinted icon here reads as a
   * decoration; white reads as a spec sheet, which is what this is. */
  incIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.onColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incTitle: { color: palette.text, fontSize: 15, fontWeight: '700' },
  incDesc: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 17.5, marginTop: 2 },
  freeNote: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 6,
  },
  plans: { gap: 10, marginTop: 18 },
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
  planName: { color: palette.text, fontSize: 15, fontWeight: '600' },
  planNote: { color: palette.textSecondary, fontSize: 12.5, marginTop: 2 },
  bailoutRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  // Was accent-coloured. Accent body text on a dark surface reads as a
  // dead link, not as emphasis — the glyph beside it already carries colour.
  bailoutText: { color: palette.text, fontSize: 12.5, fontWeight: '700' },
  // 3.1.2(c) — the billed amount outranks every other text in the row.
  planPrice: { color: palette.text, fontSize: 22, fontWeight: '900' },
  planPer: { color: palette.textSecondary, fontSize: 13, fontWeight: '500' },
  // Amber savings chip, matching the reference's "Save 40%".
  badge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: palette.savings,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { color: palette.onSavings, fontSize: 11.5, fontWeight: '800' },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 12 },
  legal: { color: palette.textTertiary, fontSize: 12.5, textAlign: 'center', marginTop: 12 },
  terms: { marginTop: 18, marginBottom: 22, gap: 8 },
  termsLine: { color: palette.textSecondary, fontSize: 14, lineHeight: 20 },
  termsStrong: { color: palette.text, fontFamily: fonts.semibold, fontWeight: '600' },
  // Subordinate to the billed amount on the button above, per 3.1.2(c).
  trialSub: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});
