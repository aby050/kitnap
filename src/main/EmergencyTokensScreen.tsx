import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, palette, radius, space } from '../design/tokens';
import Icon from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { PurchasesStoreProduct } from 'react-native-purchases';
import { BAILOUT_PRODUCTS, purchaseBailouts } from '../data/purchases';

/** Copy per product id. Prices are never hardcoded — they come from the
 *  store so they're right in every currency and stay right after a reprice. */
const PACK_COPY: Record<string, { label: string; desc: string; qty: number }> = {
  bailout_key: { label: 'Single', desc: 'One way out, when you need it.', qty: 1 },
  bailout_key3: { label: 'Three', desc: 'Covers a bad week.', qty: 3 },
  bailout_key10: { label: 'Ten', desc: 'Stop thinking about it.', qty: 10 },
};

/** Keys drawn on a card, capped so ten doesn't become a wall of glyphs. */
const MAX_GLYPHS = 5;

/** Cheapest first, so the screen never opens on the biggest ask. */
const PACK_ORDER = Object.keys(PACK_COPY);

/** A row of key glyphs standing in for the quantity, so the size of the pack
 *  is felt before it is read. Ten keys would be noise, so anything past the
 *  cap draws the cap plus a count. */
function KeyRow({ qty, dim }: { qty: number; dim?: boolean }) {
  const shown = Math.min(qty, MAX_GLYPHS);
  return (
    <View style={styles.keyRow}>
      {Array.from({ length: shown }, (_, i) => (
        <BailoutGlyph key={i} size={18} color={dim ? palette.textTertiary : palette.accent} />
      ))}
      {qty > MAX_GLYPHS && <Text style={styles.keyMore}>+{qty - MAX_GLYPHS}</Text>}
    </View>
  );
}

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

  /* Per-key price, computed from the store's own numbers rather than written
   * down here — a hardcoded "save 33%" becomes a lie the moment anything is
   * repriced, and this app doesn't print numbers it hasn't measured. */
  const unitPrices = sorted.map((p) => {
    const qty = PACK_COPY[p.identifier]?.qty ?? 1;
    return p.price > 0 && qty > 0 ? p.price / qty : Infinity;
  });
  const bestUnit = Math.min(...unitPrices, Infinity);

  const renderPack = (product: PurchasesStoreProduct, index: number) => {
    const copy = PACK_COPY[product.identifier];
    const qty = copy?.qty ?? 1;
    const pending = buying === product.identifier;
    const unit = unitPrices[index];
    // Only the genuinely cheapest per key gets the badge, and only when there
    // is something to compare it against.
    const isBest = sorted.length > 1 && unit === bestUnit && Number.isFinite(unit);
    const eachLabel =
      product.price > 0 && qty > 1
        ? `${(product.price / qty).toFixed(2)} ${product.currencyCode} each`
        : null;

    return (
      <Pressable
        key={product.identifier}
        onPress={buying ? undefined : () => buy(product)}
        style={({ pressed }) => [
          styles.pack,
          isBest && styles.packBest,
          pressed && !buying && styles.packPressed,
        ]}
      >
        {isBest && (
          <View style={styles.bestPill}>
            <Text style={styles.bestPillText}>BEST VALUE</Text>
          </View>
        )}

        <KeyRow qty={qty} />

        <View style={styles.packHead}>
          <Text style={styles.packQty}>{qty}</Text>
          <Text style={styles.packLabel}>{qty === 1 ? 'Bailout' : 'Bailouts'}</Text>
        </View>
        <Text style={styles.packDesc}>{copy?.desc ?? product.description}</Text>

        <View style={styles.packFooter}>
          {eachLabel && <Text style={styles.packEach}>{eachLabel}</Text>}
          <View style={styles.buyWrap}>
            {pending ? (
              <View style={styles.buyBtnPlain}>
                <ActivityIndicator size="small" color="#08120F" />
              </View>
            ) : (
              <LinearGradient
                colors={isBest ? gradients.accent : ['#1C1C22', '#141419']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buyBtn}
              >
                <Text style={[styles.buyText, isBest && styles.buyTextBest]}>
                  {product.priceString}
                </Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </Pressable>
    );
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
          {/* A lit disc behind the key so the balance reads as the subject of
              the screen rather than a stat above a list. */}
          <View style={styles.heroGlow}>
            <BailoutGlyph size={58} />
          </View>
          <Text style={styles.balanceValue}>{tokenBalance}</Text>
          <Text style={styles.balanceLabel}>{tokenBalance === 1 ? 'Bailout' : 'Bailouts'} available</Text>
          {/* The TESTING top-up button that used to sit here is gone. It set the
              balance to 99 — paid consumables handed out free — and shipping a
              gated-but-present giveaway inside a binary under IAP review is not
              a risk worth the convenience. `onTestTopUp` stays on the props so
              a dev build can pass one in. */}
        </Animated.View>

        {/* The store first. The explanation used to sit above it, so anyone
            arriving to actually buy something scrolled past three essays to
            find the packs. */}
        <Text style={styles.sectionLabel}>GET MORE</Text>
        {sorted.length === 0 ? (
          <>
            {PACK_ORDER.map((id) => (
              <View key={id} style={[styles.pack, styles.packDisabled]}>
                <KeyRow qty={PACK_COPY[id].qty} dim />
                <View style={styles.packHead}>
                  <Text style={[styles.packQty, styles.packQtyDim]}>{PACK_COPY[id].qty}</Text>
                  <Text style={styles.packLabel}>
                    {PACK_COPY[id].qty === 1 ? 'Bailout' : 'Bailouts'}
                  </Text>
                </View>
                <Text style={styles.packDesc}>{PACK_COPY[id].desc}</Text>
                <View style={styles.packFooter}>
                  <View style={styles.buyWrap}>
                    <View style={styles.buyBtnPlain}>
                      <Text style={styles.buyText}>Soon</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            <Text style={styles.purchaseNote}>
              Bailout packs aren't reachable right now — check your connection and try again. Your
              free Bailouts work either way.
            </Text>
          </>
        ) : (
          sorted.map(renderPack)
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What a Bailout does</Text>
          <Text style={styles.cardBody}>
            Once a focus timer is locked it can't be stopped for free — that's the whole point. A
            Bailout ends the session immediately, no questions asked.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Two are free, forever</Text>
          <Text style={styles.cardBody}>
            Not a trial and not a hook. We're not going to charge you at the exact moment you're
            already struggling. Never buy another and the app still works as intended.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>They never expire</Text>
          <Text style={styles.cardBody}>
            Unused Bailouts carry over indefinitely, and are only ever spent when you choose to
            leave a locked timer early — never automatically, never without confirming.
          </Text>
        </View>

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
  heroGlow: {
    width: 108,
    height: 108,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
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
  sectionLabel: { color: palette.textTertiary, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  keyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  keyMore: { color: palette.textTertiary, fontSize: 12.5, fontWeight: '700', marginLeft: 2 },

  pack: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
  // The cheapest-per-key card carries the accent edge. Nothing else on the
  // screen does, so it reads as the recommendation without a word of pressure.
  packBest: { borderColor: palette.accentBorder, backgroundColor: palette.accentSoft },
  packPressed: { opacity: 0.85 },
  packDisabled: { opacity: 0.55 },

  bestPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: palette.savings,
  },
  bestPillText: { color: palette.onSavings, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.7 },

  packHead: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  packQty: { color: palette.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  packQtyDim: { color: palette.textSecondary },
  packLabel: { color: palette.textSecondary, fontSize: 15, fontWeight: '600' },
  packDesc: { color: palette.textTertiary, fontSize: 13, marginTop: 4, lineHeight: 18 },

  packFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  packEach: { color: palette.textQuaternary, fontSize: 11.5, fontWeight: '600' },
  buyWrap: { marginLeft: 'auto' },
  buyBtn: {
    minWidth: 96,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnPlain: {
    minWidth: 96,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.glass,
  },
  buyText: { color: palette.text, fontSize: 14.5, fontWeight: '800' },
  buyTextBest: { color: palette.onLight },
  purchaseNote: { color: palette.textTertiary, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 8 },
});
