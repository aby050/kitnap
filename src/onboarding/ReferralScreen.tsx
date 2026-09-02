import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

/**
 * Viral-growth screen at the tail of onboarding, after the discount
 * retention offer and before Welcome. Purely a referral/invite funnel — not
 * connected to the app-lock or token mechanics at all. Inviting real-world
 * friends unlocks free Pro time at fixed thresholds (20/50/100 friends);
 * "Skip" is always available and carries no penalty. Currently the tier
 * progress bars are hardcoded to 0% — wiring real invite counts needs a
 * referral-tracking backend call this screen doesn't make yet.
 */
const TIERS = [
  {
    count: '20 FRIENDS',
    title: '2 Years of Pro',
    desc: 'Get in touch and we will add two years of Pro.',
    progress: 0,
    gem: true,
  },
  {
    count: '50 FRIENDS',
    title: 'Lifetime of Pro',
    desc: 'Get in touch and Pro is yours for good.',
    progress: 0,
    gem: true,
  },
  {
    count: '100 FRIENDS',
    title: 'Life-Changing Gear',
    desc: 'Get in touch and we will send you something we made.',
    progress: 0,
    gem: false,
  },
];

export default function ReferralScreen({ onShare, onSkip }: { onShare: () => void; onSkip: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(450)} style={styles.heading}>
          Add your Friends
        </Animated.Text>
        <Text style={styles.sub}>
          Invite 20 friends and get <Icon name="bolt" size={14} color={palette.accent} strokeWidth={2.2} />{' '}
          <Text style={styles.subAccent}>PRO</Text> for free for 2 years
        </Text>

        <View style={{ height: 26 }} />

        {TIERS.map((tier, i) => (
          <View key={tier.title}>
            <Animated.View entering={FadeInDown.delay(120 * i).duration(400)} style={styles.tierCard}>
              {tier.gem ? (
                <LinearGradient
                  colors={['#8fe8ff', '#d9f77e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tierBadge}
                >
                  <View style={styles.tierGem} />
                </LinearGradient>
              ) : (
                <View style={[styles.tierBadge, styles.tierBadgeDark]}>
                  <Icon name="gift" size={30} color={palette.textSecondary} strokeWidth={1.6} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.tierCount}>{tier.count}</Text>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierDesc}>{tier.desc}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${tier.progress}%` }]} />
                </View>
              </View>
            </Animated.View>
            {i < TIERS.length - 1 && (
              <View style={styles.tierArrowWrap}>
                <Icon name="chevronDown" size={18} color={palette.textTertiary} strokeWidth={2} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Share Invite" onPress={onShare} />
        <Pressable onPress={onSkip} style={styles.skipBtn} hitSlop={10}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 10 },
  heading: { color: palette.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { color: palette.textSecondary, fontSize: 15.5, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  subAccent: { color: palette.accent, fontWeight: '700' },
  tierCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 22,
    padding: 14,
  },
  tierBadge: { width: 78, height: 78, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tierBadgeDark: { backgroundColor: 'rgba(255,255,255,0.07)' },
  tierGem: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 3.5,
    borderColor: '#fff',
    transform: [{ rotate: '12deg' }],
  },
  tierCount: { color: palette.accent, fontSize: 12.5, fontWeight: '800', letterSpacing: 0.5 },
  tierTitle: { color: palette.text, fontSize: 18, fontWeight: '700', marginTop: 3 },
  tierDesc: { color: palette.textSecondary, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', backgroundColor: palette.accent, borderRadius: 3 },
  tierArrowWrap: { alignItems: 'center', marginVertical: 7 },
  ctaWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { color: palette.text, fontSize: 16, fontWeight: '600' },
});
