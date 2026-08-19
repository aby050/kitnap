import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

type Guardian = { enabled: boolean; name: string; contact: string } | null;

/** Premium — shared groves and Guardian both live here, because both are
 *  about the same thing: your progress mattering to someone besides you. */
export default function TogetherScreen({
  guardian,
  hoursReclaimed,
  onOpenGuardian,
  onInvite,
}: {
  guardian: Guardian;
  hoursReclaimed: number;
  onOpenGuardian: () => void;
  onInvite: () => void;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Together</Text>
        <Text style={styles.lede}>Nothing here changes your world — it's just who gets to see it grow.</Text>

        <Animated.View entering={FadeInDown.duration(400)}>
          <Pressable onPress={onOpenGuardian} style={styles.guardianCard}>
            <LinearGradient
              colors={guardian?.enabled ? ['rgba(124,245,176,0.16)', 'rgba(124,245,176,0.02)'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.guardianGlyph}>🤝</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.guardianTitle}>Guardian</Text>
              <Text style={styles.guardianSub}>
                {guardian?.enabled && guardian.name
                  ? `${guardian.name} holds the code to loosen your rules`
                  : 'Not set up — a friend can hold the code to your rules'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.sectionTitle}>Shared Grove</Text>
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.emptyCard}>
          <Text style={styles.emptyGlyph}>🌳</Text>
          <Text style={styles.emptyTitle}>No one's here yet</Text>
          <Text style={styles.emptyBody}>
            Invite someone to grow a grove together — you'll each see the other's landmarks rise, never the
            details of how they got there.
          </Text>
          <View style={{ height: 16 }} />
          <GradientButton label="⇪  Invite someone" onPress={onInvite} />
        </Animated.View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Your progress, if you invite someone</Text>
          <Text style={styles.statValue}>{hoursReclaimed.toFixed(1)}h reclaimed</Text>
          <Text style={styles.statSub}>This is all a grove-mate would ever see. No app names, no gate answers.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 110 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800' },
  lede: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  guardianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
  },
  guardianGlyph: { fontSize: 26 },
  guardianTitle: { color: colors.text, fontSize: 16.5, fontWeight: '700' },
  guardianSub: { color: colors.textDim, fontSize: 13, marginTop: 4, lineHeight: 18 },
  chevron: { color: colors.textFaint, fontSize: 20 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 28, marginBottom: 14 },
  emptyCard: { alignItems: 'center', padding: 26, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.045)' },
  emptyGlyph: { fontSize: 34, opacity: 0.5 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptyBody: { color: colors.textDim, fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  statCard: { marginTop: 22, padding: 18, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)' },
  statLabel: { color: colors.textFaint, fontSize: 12, letterSpacing: 0.6, fontWeight: '700' },
  statValue: { color: colors.accent, fontSize: 24, fontWeight: '800', marginTop: 8 },
  statSub: { color: colors.textDim, fontSize: 12.5, marginTop: 8, lineHeight: 18 },
});
