import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ProgressState, dateKey, formatDuration, getDay, totals } from '../data/progress';
import { colors } from '../theme';

type DayType = 'none' | 'low' | 'avg' | 'high' | 'challenge' | 'goal';

function classify(log: ReturnType<typeof getDay>, avgSaved: number): DayType {
  const active = log.focusMinutes > 0 || log.savedMinutes > 0 || log.lockSessions > 0 || log.distractionsBlocked > 0;
  if (!active) return 'none';
  if (log.hardUnlocks > 0) return 'challenge';
  if (avgSaved > 0 && log.savedMinutes >= avgSaved * 1.3) return 'low';
  if (avgSaved > 0 && log.savedMinutes <= avgSaved * 0.5) return 'high';
  return 'avg';
}

const TYPE_COLOR: Record<DayType, string> = {
  none: 'rgba(255,255,255,0.05)',
  low: 'rgba(124,245,176,0.55)',
  avg: 'rgba(255,213,79,0.45)',
  high: 'rgba(255,107,107,0.45)',
  challenge: 'rgba(76,111,255,0.6)',
  goal: 'rgba(124,245,176,0.55)',
};

const LEGEND: { type: DayType; label: string }[] = [
  { type: 'low', label: 'Low distraction' },
  { type: 'avg', label: 'Average day' },
  { type: 'high', label: 'High distraction' },
  { type: 'challenge', label: 'Hard unlock completed' },
];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function CalendarScreen({ progress, onBack }: { progress: ProgressState; onBack: () => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const avgSaved = useMemo(() => {
    const t = totals(progress);
    const days = Object.keys(progress.days).length || 1;
    return t.savedMinutes / days;
  }, [progress]);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { key: string | null; day: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ key: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: dateKey(new Date(year, month, d)), day: d });
    }
    return cells;
  }, [year, month]);

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
    setSelected(null);
  };

  const selectedLog = selected ? getDay(progress, selected) : null;
  const selectedType = selected ? classify(selectedLog!, avgSaved) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => goMonth(-1)} style={styles.monthBtn} hitSlop={10}>
            <Text style={styles.monthBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
          <Pressable onPress={() => goMonth(1)} style={styles.monthBtn} hitSlop={10}>
            <Text style={styles.monthBtnText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
            <Text key={`${w}${i}`} style={styles.weekdayLabel}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((cell, i) => {
            if (!cell.day) return <View key={i} style={styles.cell} />;
            const log = getDay(progress, cell.key!);
            const type = classify(log, avgSaved);
            const isSelected = selected === cell.key;
            const isToday = cell.key === dateKey(now);
            return (
              <Pressable key={i} onPress={() => setSelected(cell.key)} style={styles.cell}>
                <View
                  style={[
                    styles.dayDot,
                    { backgroundColor: TYPE_COLOR[type] },
                    isSelected && styles.dayDotSelected,
                    isToday && styles.dayDotToday,
                  ]}
                >
                  <Text style={styles.dayNum}>{cell.day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legendWrap}>
          {LEGEND.map((l) => (
            <View key={l.type} style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: TYPE_COLOR[l.type] }]} />
              <Text style={styles.legendLabel}>{l.label}</Text>
            </View>
          ))}
        </View>

        {selected && selectedLog && (
          <Animated.View entering={FadeIn.duration(280)} style={styles.detailCard}>
            <Text style={styles.detailDate}>{new Date(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            {selectedType === 'none' ? (
              <Text style={styles.detailEmpty}>No activity logged this day.</Text>
            ) : (
              <>
                <Text style={styles.detailRow}>Focus: {formatDuration(selectedLog.focusMinutes)}</Text>
                <Text style={styles.detailRow}>Time saved: {formatDuration(selectedLog.savedMinutes)}</Text>
                <Text style={styles.detailRow}>Distractions blocked: {selectedLog.distractionsBlocked}</Text>
                <Text style={styles.detailRow}>Lock sessions: {selectedLog.lockSessions}</Text>
                <Text style={styles.detailRow}>Hard unlocks: {selectedLog.hardUnlocks}</Text>
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 100 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  monthBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  monthBtnText: { color: colors.text, fontSize: 18 },
  monthLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', marginTop: 18 },
  weekdayLabel: { flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: '78%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayDotSelected: { borderWidth: 2, borderColor: colors.accent },
  dayDotToday: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  dayNum: { color: colors.text, fontSize: 12.5, fontWeight: '700' },
  legendWrap: { marginTop: 22, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendSwatch: { width: 14, height: 14, borderRadius: 7 },
  legendLabel: { color: colors.textDim, fontSize: 13 },
  detailCard: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  detailDate: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  detailEmpty: { color: colors.textFaint, fontSize: 13.5 },
  detailRow: { color: colors.textDim, fontSize: 13.5 },
});
