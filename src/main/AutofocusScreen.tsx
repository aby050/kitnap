import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme';

const SENSITIVITY = [
  { key: 'low', name: 'Low', desc: 'Only step in on your worst days.' },
  { key: 'normal', name: 'Normal', desc: 'Balanced — the default for most people.' },
  { key: 'high', name: 'High', desc: 'Notice patterns early, even small ones.' },
];

/** Configures when the app decides to intervene beyond the ladder itself —
 *  e.g. a quiet nudge on the World screen after a rough stretch, never a push
 *  notification. We are silent when things go well; this is where "silent
 *  when things go badly, too loudly" gets tuned back down if it's too much. */
export default function AutofocusScreen({ onBack }: { onBack: () => void }) {
  const [sensitivity, setSensitivity] = useState('normal');
  const [nudgeOnStreak, setNudgeOnStreak] = useState(true);
  const [nudgeOnLateNight, setNudgeOnLateNight] = useState(true);
  const [weeklyOnly, setWeeklyOnly] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Autofocus</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lede}>
          When your unlocks trend up for a few days, we can say something about it — always on your World
          screen, never as a push notification.
        </Text>

        <Text style={styles.sectionTitle}>Sensitivity</Text>
        <View style={styles.segment}>
          {SENSITIVITY.map((s) => {
            const active = s.key === sensitivity;
            return (
              <Pressable key={s.key} onPress={() => setSensitivity(s.key)} style={[styles.segItem, active && styles.segItemActive]}>
                <Text style={[styles.segText, active && styles.segTextActive]}>{s.name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.segDesc}>{SENSITIVITY.find((s) => s.key === sensitivity)?.desc}</Text>

        <Text style={styles.sectionTitle}>Nudges</Text>
        <View style={styles.card}>
          <ToggleRow
            title="After a rough streak"
            desc="Three or more heavy-unlock days in a row."
            value={nudgeOnStreak}
            onChange={setNudgeOnStreak}
          />
          <ToggleRow
            title="Late-night unlocks"
            desc="A pattern of requests after 11pm."
            value={nudgeOnLateNight}
            onChange={setNudgeOnLateNight}
          />
          <ToggleRow
            title="Weekly report only"
            desc="Turn off in-the-moment nudges entirely; save it all for Reflection."
            value={weeklyOnly}
            onChange={setWeeklyOnly}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
  last,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, !last && styles.toggleRowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { flex: 1, color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  lede: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 22, marginBottom: 14 },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22, padding: 5 },
  segItem: { flex: 1, paddingVertical: 11, borderRadius: 18, alignItems: 'center' },
  segItemActive: { backgroundColor: 'rgba(124,245,176,0.18)' },
  segText: { color: colors.textDim, fontSize: 14.5, fontWeight: '600' },
  segTextActive: { color: colors.accent, fontWeight: '800' },
  segDesc: { color: colors.textFaint, fontSize: 13, marginTop: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.045)', borderRadius: 22, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  toggleTitle: { color: colors.text, fontSize: 15.5, fontWeight: '600' },
  toggleDesc: { color: colors.textDim, fontSize: 12.5, marginTop: 4, lineHeight: 17 },
});
