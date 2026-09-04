import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, space } from '../design/tokens';
import Icon from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { PurchasesStoreProduct } from 'react-native-purchases';
import { BAILOUT_PRODUCTS, purchaseBailouts } from '../data/purchases';

/** Copy per product id. Prices are never hardcoded — they come from the
 *  store so they're right in every currency and stay right after a reprice. */
const PACK_COPY: Record<string, { label: string; desc: string }> = {
  bailout_key1: { label: '1 Bailout', desc: 'One extra way out of a locked timer.' },
  bailout_key3: { label: '3 Bailouts', desc: 'Best for most people.' },
  bailout_key5: { label: '5 Bailouts', desc: 'Rarely need to top up again.' },
};

/** Cheapest first, so the screen never opens on the biggest ask. */
const PACK_ORDER = Object.keys(PACK_COPY);

export default function EmergencyTokensScreen({
  tokenBalance,
  onBack,
  onTestTopUp,
  products = [],
  onGrant,
}: {
  tokenBalance: number;
  onBack: () => void;
  /** Live consumables from RevenueCat. Empty until the store answers, or
   *  when billing is unavailable — the screen degrades to "Soon". */
  products?: PurchasesStoreProduct[];
  /** Adds the purchased quantity to the persisted balance. */
  onGrant?: (quantity: number) => void;
  /** TESTING ONLY — tops the balance up so the post-cap flows can be reached
   *  without real purchases, which aren't live yet. Remove this prop, its
   *  button, and TEST_TOP_UP in MainApp before any release build. */
  onTestTopUp?: () => void;
}) {
  const [buying, setBuying] = useState<string | null>(null);

  const sorted = [...products].sort(
    (a, b) => PACK_ORDER.indexOf(a.identifier) - PACK_ORDER.indexOf(b.identifier),
  );

  const buy = async (product: PurchasesStoreProduct) => {
    setBuying(product.identifier);
    const res = await purchaseBailouts(product);
    setBuying(null);
    if (res.status === 'success') {
      onGrant?.(res.quantity ?? BAILOUT_PRODUCTS[product.identifier] ?? 1);
    } else if (res.status === 'error') {
      Alert.alert("That didn't go through", res.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Bailouts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <BailoutGlyph size={64} />
          <Text style={styles.balanceValue}>{tokenBalance}</Text>
          <Text style={styles.balanceLabel}>{tokenBalance === 1 ? 'Bailout' : 'Bailouts'} available</Text>
          {/* TESTING ONLY — see onTestTopUp. Must not ship. */}
          {onTestTopUp && (
            <Pressable onPress={onTestTopUp} style={styles.testBtn} hitSlop={8}>
              <Text style={styles.testBtnText}>TESTING · set to 99</Text>
            </Pressable>
          )}
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What is this?</Text>
          <Text style={styles.cardBody}>
            Once a focus timer is locked, it can't be stopped for free — that's the whole point. A
            Bailout is the way out early: use one, and the session ends immediately, no questions asked.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Everyone starts with 2, free</Text>
          <Text style={styles.cardBody}>
            Not a trial, not a hook — genuinely free, forever. We're not going to charge you the moment
            you're already struggling to stick to a session. If you never buy another one, that's fine;
            the app still works exactly as intended.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bailouts don't expire or reset</Text>
          <Text style={styles.cardBody}>
            Unused Bailouts carry over indefinitely. They're only ever used when you actively choose to leave
            a locked timer early — never automatically, never without confirming first.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Get more</Text>
        {sorted.length === 0
          ? PACK_ORDER.map((id) => (
              <View key={id} style={styles.packRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packLabel}>{PACK_COPY[id].label}</Text>
                  <Text style={styles.packDesc}>{PACK_COPY[id].desc}</Text>
                </View>
                <View style={styles.packBuyBtn}>
                  <Text style={styles.packBuyText}>Soon</Text>
                </View>
              </View>
            ))
          : sorted.map((product) => {
              const copy = PACK_COPY[product.identifier];
              const pending = buying === product.identifier;
              return (
                <Pressable
                  key={product.identifier}
                  onPress={buying ? undefined : () => buy(product)}
                  style={styles.packRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.packLabel}>{copy?.label ?? product.title}</Text>
                    <Text style={styles.packDesc}>{copy?.desc ?? product.description}</Text>
                  </View>
                  <View style={styles.packBuyBtn}>
                    {pending ? (
                      <ActivityIndicator size="small" color={palette.text} />
                    ) : (
                      <Text style={styles.packBuyText}>{product.priceString}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
        {sorted.length === 0 && (
          <Text style={styles.purchaseNote}>
            Bailout packs aren't reachable right now — check your connection and try again. Your free
            Bailouts work either way.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: space.md },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: palette.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  hero: { alignItems: 'center', gap: 4, marginBottom: 26 },
  balanceValue: { color: palette.text, fontSize: 40, fontWeight: '800', marginTop: 12 },
  balanceLabel: { color: palette.textSecondary, fontSize: 14, fontWeight: '600' },
  testBtn: {
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,180,80,0.4)',
    backgroundColor: 'rgba(255,180,80,0.10)',
  },
  testBtnText: { color: '#FFB450', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: { color: palette.text, fontSize: 15.5, fontWeight: '700', marginBottom: 6 },
  cardBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 20 },
  sectionLabel: { color: palette.textTertiary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  packLabel: { color: palette.text, fontSize: 15, fontWeight: '700' },
  packDesc: { color: palette.textSecondary, fontSize: 12.5, marginTop: 2 },
  packBuyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: palette.glass,
  },
  packBuyText: { color: palette.textQuaternary, fontSize: 12.5, fontWeight: '700' },
  purchaseNote: { color: palette.textTertiary, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 8 },
});
