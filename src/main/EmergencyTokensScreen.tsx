import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';

function ParachuteGlyph({ size = 64, color = colors.accent }: { size?: number; color?: string }) {
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
  { id: 'single', label: '1 token', desc: 'One extra emergency exit.', price: '₹49' },
  { id: 'pair', label: '3 tokens', desc: 'Best for most people.', price: '₹99' },
  { id: 'pack10', label: '10 tokens', desc: 'Rarely need to top up again.', price: '₹249' },
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
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Emergency tokens</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <ParachuteGlyph size={72} />
          <Text style={styles.balanceValue}>{tokenBalance}</Text>
          <Text style={styles.balanceLabel}>token{tokenBalance === 1 ? '' : 's'} available</Text>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What is this?</Text>
          <Text style={styles.cardBody}>
            Once a focus session is locked, it can't be stopped for free — that's the whole point. An
            emergency token is the one way out early: spend one, and the session ends immediately, no
            questions asked.
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
          <Text style={styles.cardTitle}>Tokens don't expire or reset</Text>
          <Text style={styles.cardBody}>
            Unused tokens carry over indefinitely. They're only ever spent when you actively choose to end
            a locked session early — never automatically, never without confirming first.
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
          In-app purchases for extra tokens aren't live yet — this is the store screen ready for when they
          are. Your 2 free tokens work today.
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  hero: { alignItems: 'center', gap: 4, marginBottom: 26 },
  balanceValue: { color: colors.text, fontSize: 40, fontWeight: '800', marginTop: 12 },
  balanceLabel: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700', marginBottom: 6 },
  cardBody: { color: colors.textDim, fontSize: 13.5, lineHeight: 20 },
  sectionLabel: { color: colors.textFaint, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  packLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  packDesc: { color: colors.textDim, fontSize: 12.5, marginTop: 2 },
  packBuyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  packBuyText: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, fontWeight: '700' },
  purchaseNote: { color: colors.textFaint, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 8 },
});
