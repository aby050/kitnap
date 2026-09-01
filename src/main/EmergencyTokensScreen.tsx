import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

function ParachuteGlyph({ size = 64, color = palette.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 11a10 10 0 0 1 20 0c-2.5-1.3-5-2-10-2s-7.5.7-10 2z"
        fill={color}
      />
      <Path d="M4 11l3 9M9 11l1.5 9M15 11L13.5 20M20 11l-3 9" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M10.5 20h3l-1.5 2z" fill={color} />
    </Svg>
  );
}

const PACKS = [
  { id: 'single', label: '1 Bailout', desc: 'One extra way out of a locked timer.', price: '₹49' },
  { id: 'pair', label: '3 Bailouts', desc: 'Best for most people.', price: '₹99' },
  { id: 'pack10', label: '10 Bailouts', desc: 'Rarely need to top up again.', price: '₹249' },
];

export default function EmergencyTokensScreen({
  tokenBalance,
  onBack,
}: {
  tokenBalance: number;
  onBack: () => void;
}) {
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
          <ParachuteGlyph size={72} />
          <Text style={styles.balanceValue}>{tokenBalance}</Text>
          <Text style={styles.balanceLabel}>{tokenBalance === 1 ? 'Bailout' : 'Bailouts'} available</Text>
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
        {PACKS.map((pack) => (
          <View key={pack.id} style={styles.packRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.packLabel}>{pack.label}</Text>
              <Text style={styles.packDesc}>{pack.desc}</Text>
            </View>
            <View style={styles.packBuyBtn}>
              <Text style={styles.packBuyText}>{pack.price} · Soon</Text>
            </View>
          </View>
        ))}
        <Text style={styles.purchaseNote}>
          In-app purchases for extra Bailouts aren't live yet — this is the store screen ready for when they
          are. Your 2 free Bailouts work today.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
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
