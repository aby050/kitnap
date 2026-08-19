import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

const STEPS = [
  {
    glyph: '✓',
    title: 'Begin your focus journey',
    body: "You're on your way to turning intention into a daily habit.",
    done: true,
  },
  {
    glyph: '🔓',
    title: 'Today: take back your focus',
    body: 'Start your 7-day free trial and unlock Strict mode, schedules and Guardian.',
    done: false,
  },
  {
    glyph: '🔔',
    title: 'Day 5: we remind you',
    body: "We'll email you two days before the trial ends. No surprise charge, ever.",
    done: false,
  },
  {
    glyph: '🚀',
    title: 'Day 7: keep it going',
    body: 'Only if you want to. Cancel in two taps and nothing you built is lost.',
    done: false,
  },
];

const PLANS = [
  { key: 'monthly', name: 'Monthly', note: 'no trial', price: '₹99.00', per: '/mo' },
  { key: 'yearly', name: 'Yearly', note: 'Only ₹41.58/mo', price: '₹499.00', per: '/yr', badge: '7 days free' },
  { key: 'lifetime', name: 'Lifetime', note: 'pay once, keep forever', price: '₹999.00', per: '' },
];

/** Deliberately no weekly plan, and the reminder promise is stated on the
 *  paywall itself — surprise charges are the single fastest route to a 1★. */
export default function TrialTimelineScreen({ onStart }: { onStart: () => void }) {
  const [plan, setPlan] = useState('yearly');

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
                  <Text style={styles.nodeGlyph}>{s.glyph}</Text>
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
                  {active ? <Text style={styles.radioTick}>✓</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{p.name}</Text>
                  <Text style={styles.planNote}>{p.note}</Text>
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
        <GradientButton label={plan === 'yearly' ? 'Start free trial' : 'Continue'} onPress={onStart} />
        <Text style={styles.legal}>Cancel anytime. We remind you before the trial ends.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 10 },
  heading: { color: colors.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33, marginBottom: 28 },
  timeline: {},
  step: { flexDirection: 'row', gap: 14 },
  rail: { alignItems: 'center', width: 40 },
  node: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: colors.accent },
  nodeGlyph: { fontSize: 16 },
  line: { width: 2.5, flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', minHeight: 22 },
  lineDone: { backgroundColor: colors.accent },
  stepBody: { flex: 1, paddingBottom: 24 },
  stepTitle: { color: colors.text, fontSize: 16.5, fontWeight: '700' },
  stepText: { color: colors.textDim, fontSize: 14, lineHeight: 20.5, marginTop: 5 },
  plans: { gap: 10, marginTop: 6 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  planActive: { borderColor: colors.accent, backgroundColor: 'rgba(124,245,176,0.08)' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  radioTick: { color: '#062', fontSize: 12, fontWeight: '900' },
  planName: { color: colors.text, fontSize: 16.5, fontWeight: '700' },
  planNote: { color: colors.textDim, fontSize: 12.5, marginTop: 2 },
  planPrice: { color: colors.text, fontSize: 17, fontWeight: '800' },
  planPer: { color: colors.textDim, fontSize: 13, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { color: '#062', fontSize: 11.5, fontWeight: '800' },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 12 },
  legal: { color: colors.textFaint, fontSize: 12.5, textAlign: 'center', marginTop: 12 },
});
