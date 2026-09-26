import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { fonts, palette, radius, space } from '../design/tokens';
import Icon from '../ui/Icon';
import { FREE_EMERGENCY_TOKENS } from '../data/store';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  PLAN_BAILOUTS,
  PRIVACY_POLICY_URL,
  TERMS_URL,
  planBailoutLabel,
  purchaseSubscription,
} from '../data/purchases';
import { PurchaseResult } from './PurchaseSuccessScreen';

/** The annual package out of an offering. */
function annualOf(offering?: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) return null;
  return (
    offering.annual ??
    offering.availablePackages.find((p) => p.identifier === '$rc_annual') ??
    offering.availablePackages[0] ??
    null
  );
}

/** What each plan actually gives you. Every row is a real, shipped capability
 *  — nothing aspirational, and the free column is genuinely usable. */
const ROWS: { label: string; free: string; pro: string }[] = [
  { label: 'Blocking', free: 'Everything', pro: 'Everything' },
  { label: 'Emergency access', free: 'Free, always', pro: 'Free, always' },
  { label: 'Unlock by moving', free: 'Yes', pro: 'Yes' },
  { label: 'Bailouts', free: `${FREE_EMERGENCY_TOKENS}, forever`, pro: planBailoutLabel('$rc_annual') },
  { label: 'Guardian code', free: '—', pro: 'Yes' },
  { label: 'Schedules', free: '1', pro: 'Unlimited' },
];

/**
 * Shown when someone declines the plan picker.
 *
 * This replaces a screen headed "Too Expensive? Here is 50% OFF" — a
 * last-chance discount fired at the exact moment of a decline. That pattern
 * converts, but it is also one of the most copied screens in this category
 * and it reads as a panic offer: the price you were just quoted was
 * apparently never the real price.
 *
 * Same offer, honest framing. It states plainly that Phonewise works free forever,
 * shows exactly what the free plan keeps and gives up, and puts the annual
 * price beside it with the saving computed from the store's own numbers. A
 * user who takes the free plan here is not a lost sale — they are a user who
 * still has a working blocker, which is the whole premise of the product.
 */
export default function PlanCompareScreen({
  onStart,
  onClose,
  offering,
  fullPriceOffering,
  onPurchased,
}: {
  onStart: (result?: PurchaseResult) => void;
  onClose: () => void;
  offering?: PurchasesOffering | null;
  /** The regular offering, for a struck-through comparison that is real. */
  fullPriceOffering?: PurchasesOffering | null;
  onPurchased?: (bailouts: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const pkg = annualOf(offering);
  const fullPkg = annualOf(fullPriceOffering);
  const price = pkg?.product.priceString ?? null;
  const wasPrice = fullPkg?.product.priceString ?? null;

  /* Computed from the store's own numbers, never written down: a hardcoded
   * "save 50%" becomes a lie the moment anything is repriced. */
  const savedPct =
    pkg && fullPkg && fullPkg.product.price > 0 && pkg.product.price < fullPkg.product.price
      ? Math.round((1 - pkg.product.price / fullPkg.product.price) * 100)
      : null;

  const buy = async () => {
    if (!pkg) {
      onStart({ planName: 'Free plan', bailouts: FREE_EMERGENCY_TOKENS, isTrial: false, free: true });
      return;
    }
    setBusy(true);
    const res = await purchaseSubscription(pkg);
    setBusy(false);
    if (res.status === 'success') {
      onPurchased?.(10);
      onStart({
        planName: 'Yearly',
        bailouts: PLAN_BAILOUTS.$rc_annual,
        isTrial: false,
        renewsAt: res.info.latestExpirationDate,
      });
    } else if (res.status === 'error') {
      Alert.alert("That didn't go through", res.message);
    }
  };

  return (
    <SafeAreaView style={st.root} edges={['top', 'bottom']}>
      <Pressable onPress={onClose} style={st.close} hitSlop={12}>
        <Icon name="close" size={18} color={palette.text} />
      </Pressable>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(420)}>
          <Text style={st.title}>phonewise works</Text>
          <Text style={[st.title, st.titleAccent]}>free, forever.</Text>
          <Text style={st.sub}>
            Not a crippled trial. The blocking, the movement unlocks and emergency access are all
            in the free plan. Here's the whole difference.
          </Text>
        </Animated.View>

        <View style={st.table}>
          <View style={st.headRow}>
            <View style={{ flex: 1 }} />
            <Text style={st.headFree}>Free</Text>
            <Text style={st.headPro}>Pro</Text>
          </View>
          {ROWS.map((r, i) => (
            <View key={r.label} style={[st.row, i < ROWS.length - 1 && st.rowDivider]}>
              <Text style={st.rowLabel}>{r.label}</Text>
              <Text style={st.cellFree}>{r.free}</Text>
              <Text style={st.cellPro}>{r.pro}</Text>
            </View>
          ))}
        </View>

        {price && (
          <View style={st.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.priceLabel}>Pro, billed yearly</Text>
              {savedPct !== null && wasPrice && (
                <Text style={st.priceWas}>
                  was <Text style={st.strike}>{wasPrice}</Text> · save {savedPct}%
                </Text>
              )}
            </View>
            <Text style={st.price}>{price}</Text>
          </View>
        )}
      </ScrollView>

      <View style={st.cta}>
        <GradientButton
          label={busy ? 'One moment…' : price ? `Get Pro — ${price}/yr` : 'Continue'}
          onPress={busy ? () => {} : buy}
        />
        {busy && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}

        <Pressable
          onPress={busy ? undefined : () => onStart({
            planName: 'Free plan',
            bailouts: FREE_EMERGENCY_TOKENS,
            isTrial: false,
            free: true,
          })}
          hitSlop={10}
          style={st.freeBtn}
        >
          <Text style={st.freeText}>Continue with the free plan</Text>
        </Pressable>

        <Text style={st.legal}>
          Pro renews yearly at the price shown unless you turn off auto-renew at least 24 hours
          before the period ends. Manage or cancel any time in your Apple Account settings.
        </Text>
        <View style={st.legalRow}>
          <Text style={st.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms of Use
          </Text>
          <Text style={st.legalDot}>·</Text>
          <Text style={st.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  close: { position: 'absolute', top: 54, left: 22, zIndex: 10 },
  scroll: { paddingHorizontal: space.xl, paddingTop: 64, paddingBottom: space.base },
  title: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.7,
    textTransform: 'lowercase',
  },
  titleAccent: { color: palette.accent },
  sub: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, marginTop: space.md, maxWidth: 330 },

  table: {
    marginTop: space.xl,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: space.base,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  headFree: { width: 86, textAlign: 'right', color: palette.textTertiary, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8 },
  headPro: { width: 86, textAlign: 'right', color: palette.accent, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.hairline },
  rowLabel: { flex: 1, color: palette.text, fontSize: 14.5, fontWeight: '500' },
  cellFree: { width: 86, textAlign: 'right', color: palette.textSecondary, fontSize: 13.5 },
  cellPro: { width: 86, textAlign: 'right', color: palette.text, fontFamily: fonts.semibold, fontSize: 13.5, fontWeight: '600' },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg, paddingHorizontal: space.xs },
  priceLabel: { color: palette.text, fontSize: 14.5, fontWeight: '600' },
  priceWas: { color: palette.textTertiary, fontSize: 12, marginTop: 2 },
  strike: { textDecorationLine: 'line-through' },
  price: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.9,
  },

  cta: { paddingHorizontal: space.xl, paddingBottom: space.md },
  freeBtn: { alignSelf: 'center', paddingVertical: space.md },
  freeText: { color: palette.textSecondary, fontSize: 14, fontWeight: '700' },
  legal: { color: palette.textTertiary, fontSize: 11.5, lineHeight: 16, textAlign: 'center' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 },
  legalLink: { color: palette.textTertiary, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  legalDot: { color: palette.textQuaternary, fontSize: 12 },
});
