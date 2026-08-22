import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>
        <Text style={styles.featureTitle}>{title} </Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </Text>
    </View>
  );
}

export default function DiscountPaywallScreen({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeIn.duration(500)} style={styles.bolt}>
          ⚡
        </Animated.Text>

        <Animated.Text entering={FadeInDown.duration(450)} style={styles.heading}>
          Too Expensive?{'\n'}Here is <Text style={styles.headingAccent}>50% OFF</Text>
        </Animated.Text>

        <View style={{ height: 34 }} />

        <Feature icon="🛡" title="Focus, uninterrupted." desc="Finally do your best work yet." />
        <Feature icon="🗓" title="Own your time." desc="And fill your days with more intention." />
        <Feature icon="👥" title="Be fully present." desc="Because life isn't happening on your screen." />

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
              <Text style={styles.planSub}>7-day free trial</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.planStrike}>₹1,149.00</Text>
              <Text style={styles.planPrice}>₹579.00/yr</Text>
            </View>
          </View>
        </View>

        <Text style={styles.terms}>7 days free, then ₹579.00/year · Cancel anytime</Text>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Start My Free Trial" onPress={onStart} />
        <Text style={styles.expiry}>Offer expires when you leave this screen</Text>
        <View style={styles.legalRow}>
          <Text style={styles.legalLink}>Terms</Text>
          <Text style={styles.legalLink}>Privacy</Text>
          <Text style={styles.legalLink}>Restore</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  closeBtn: { position: 'absolute', top: 54, left: 22, zIndex: 10 },
  closeIcon: { color: colors.text, fontSize: 24, fontWeight: '300' },
  scroll: { paddingHorizontal: 24, paddingTop: 46, paddingBottom: 10 },
  bolt: { fontSize: 44, textAlign: 'center', marginBottom: 22 },
  heading: { color: colors.text, fontSize: 27, fontWeight: '800', textAlign: 'center', lineHeight: 36 },
  headingAccent: { color: '#c9f57a' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  featureIcon: { fontSize: 19, width: 36 },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  featureTitle: { color: colors.text, fontWeight: '700' },
  featureDesc: { color: 'rgba(255,255,255,0.8)' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  stars: { color: '#FFC94A', fontSize: 15, letterSpacing: 2 },
  reviewText: { color: colors.textDim, fontSize: 13.5 },
  offerBadgeWrap: { alignItems: 'center', zIndex: 5, marginBottom: -14 },
  offerBadge: { borderRadius: 16, paddingVertical: 7, paddingHorizontal: 18 },
  offerBadgeText: { color: '#0b2a14', fontSize: 14, fontWeight: '800' },
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
  planTitle: { color: colors.text, fontSize: 21, fontWeight: '800' },
  planSub: { color: colors.textDim, fontSize: 13.5, marginTop: 3 },
  planStrike: { color: colors.textFaint, fontSize: 13, textDecorationLine: 'line-through' },
  planPrice: { color: colors.text, fontSize: 21, fontWeight: '800', marginTop: 2 },
  terms: { color: colors.textDim, fontSize: 12.5, textAlign: 'center', marginTop: 14 },
  ctaWrap: { paddingHorizontal: 24, paddingBottom: 12 },
  expiry: { color: colors.textFaint, fontSize: 12.5, textAlign: 'center', marginTop: 12 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: 10 },
  legalLink: { color: colors.textDim, fontSize: 13.5 },
});
