import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

const GEMS = [
  { name: 'First', sub: 'Owned by 98%', unlocked: true, progress: 1 },
  { name: 'Invested', sub: '1/3 days', unlocked: false, progress: 0.33 },
  { name: 'Steadfast', sub: '1/7 days', unlocked: false, progress: 0.14 },
  { name: 'Radiant', sub: '1/30 days', unlocked: false, progress: 0.03 },
];

const CHART_W = 330;
const CHART_H = 190;
const TREND = 'M 0 42 C 20 30, 34 34, 48 40 C 70 50, 86 44, 104 52 C 128 62, 150 84, 176 92 C 200 100, 214 96, 236 108 C 258 120, 274 132, 300 138 L 320 142';

function Stat({ glyph, value, label, tint }: { glyph: string; value: string; label: string; tint: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statGlyph}>{glyph}</Text>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: tint }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ onBack, onOpenSettings, onOpenMilestones }: {
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenMilestones: () => void;
}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Pressable onPress={onOpenSettings} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarGlyph}>👤</Text>
          </View>
          <Text style={styles.username}>NaturalGlass9842</Text>
        </Animated.View>

        <Pressable onPress={onOpenMilestones} style={styles.statsRow}>
          <Stat glyph="⏳" value="0" label="FOCUS HOURS" tint="#cfcfcf" />
          <Stat glyph="🔥" value="1" label="DAY STREAK" tint="#f5c542" />
          <Stat glyph="📊" value="35%" label="GLOBAL RANK" tint="#8fb8ff" />
        </Pressable>

        <Text style={styles.sectionTitle}>Gemstones</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gemRow}>
          {GEMS.map((gem) => (
            <View key={gem.name} style={styles.gemCol}>
              {gem.unlocked ? (
                <OpalOrb size={72} awake />
              ) : (
                <View style={styles.rawGem} />
              )}
              <View style={styles.gemPedestal} />
              {!gem.unlocked && (
                <View style={styles.gemTrack}>
                  <View style={[styles.gemBar, { width: `${gem.progress * 100}%` }]} />
                </View>
              )}
              <Text style={styles.gemName}>{gem.name}</Text>
              <Text style={styles.gemSub}>{gem.sub}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryBlur}>——</Text>
            <Text style={styles.summaryLabel}>AVG SCREEN TIME</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>TIME SAVED</Text>
            <Text style={styles.summaryBlur}>——</Text>
          </View>
        </View>

        <Text style={styles.journeyText}>
          Your journey starts with your first full week. Check back <Text style={styles.journeyAccent}>in 7 days.</Text>
        </Text>

        <View style={styles.rangeRow}>
          {['Week', 'Month', 'All Time'].map((r, i) => (
            <View key={r} style={[styles.rangePill, i === 0 && styles.rangePillActive]}>
              <Text style={styles.rangeText}>{r}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartWrap}>
          <Svg width={CHART_W} height={CHART_H}>
            <Defs>
              <SvgGradient id="pfill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#ffffff" stopOpacity="0.09" />
                <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            {[20, 62, 104, 146].map((y) => (
              <Line key={y} x1="0" y1={y} x2={CHART_W - 34} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            ))}
            {[0, 74, 148, 222, 296].map((x) => (
              <Line key={x} x1={x} y1="0" x2={x} y2="148" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            <Path d={`${TREND} L 320 148 L 0 148 Z`} fill="url(#pfill)" />
            <Path d={TREND} stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeDasharray="7 6" fill="none" />
            {['6h', '4h', '2h', '0h'].map((t, i) => (
              <SvgText key={t} x={CHART_W - 26} y={26 + i * 42} fill="rgba(255,255,255,0.4)" fontSize="12">
                {t}
              </SvgText>
            ))}
          </Svg>
          <View style={styles.chartAxis}>
            {['Mon', 'Wed', 'Sat', 'Mon', 'Thu'].map((d, i) => (
              <Text key={i} style={styles.axisLabel}>
                {d}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.shareHeader}>
          <Text style={styles.sectionTitle}>Share Pass, Get Rewards</Text>
          <Text style={styles.shareCount}>👥 0</Text>
        </View>

        <LinearGradient
          colors={['#8fe8ff', '#d9f77e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.passCard}
        >
          <Text style={styles.passBrand}>◯ Focus</Text>
          <Text style={styles.passSub}>30-day Guest Pass</Text>
        </LinearGradient>

        <View style={{ height: 16 }} />
        <GradientButton label="View Rewards" variant="light" onPress={onOpenMilestones} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: colors.text, fontSize: 19 },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  avatarWrap: { alignItems: 'center', marginTop: 6 },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { fontSize: 34 },
  username: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 26 },
  statCol: { alignItems: 'center', gap: 4 },
  statGlyph: { fontSize: 30 },
  statValue: { fontSize: 27, fontWeight: '800' },
  statLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.5 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 30, marginBottom: 14 },
  gemRow: { gap: 26, paddingRight: 20 },
  gemCol: { alignItems: 'center', width: 96 },
  rawGem: { width: 52, height: 68, borderRadius: 12, backgroundColor: '#3d3d3d', transform: [{ rotate: '6deg' }] },
  gemPedestal: { width: 44, height: 7, borderRadius: 4, backgroundColor: '#0d0d0d', marginTop: 2 },
  gemTrack: {
    width: 54,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
    overflow: 'hidden',
  },
  gemBar: { height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' },
  gemName: { color: colors.text, fontSize: 15.5, fontWeight: '700', marginTop: 10 },
  gemSub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 34 },
  summaryBlur: { color: 'rgba(255,255,255,0.18)', fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: colors.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
  journeyText: { color: colors.textDim, fontSize: 16, lineHeight: 23, marginTop: 20 },
  journeyAccent: { color: colors.accent, fontWeight: '600' },
  rangeRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  rangePill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  rangePillActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  rangeText: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
  chartWrap: { marginTop: 24 },
  chartAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 30, marginTop: 2 },
  axisLabel: { color: colors.textDim, fontSize: 12.5 },
  shareHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shareCount: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 16 },
  passCard: { borderRadius: 22, paddingVertical: 46, alignItems: 'center' },
  passBrand: { color: '#fff', fontSize: 34, fontWeight: '800' },
  passSub: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600', marginTop: 6 },
});
