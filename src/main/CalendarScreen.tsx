import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ProgressState, dateKey, formatDuration, getDay, sumRange, totals } from '../data/progress';
import { palette, space, radius } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

type DayType = 'none' | 'low' | 'avg' | 'high' | 'challenge' | 'goal';

function classify(log: ReturnType<typeof getDay>, avgSaved: number): DayType {
  const active = log.focusMinutes > 0 || log.savedMinutes > 0 || log.lockSessions > 0 || log.distractionsBlocked > 0;
  if (!active) return 'none';
  if (log.hardUnlocks > 0) return 'challenge';
  if (avgSaved > 0 && log.savedMinutes >= avgSaved * 1.3) return 'low';
  if (avgSaved > 0 && log.savedMinutes <= avgSaved * 0.5) return 'high';
  return 'avg';
}

// Aligned to the app's intensity ramp: mint (best) → lime → amber → coral.
const TYPE_COLOR: Record<DayType, string> = {
  none: palette.surfaceHigh,
  low: palette.accent,
  avg: '#B9D97A',
  high: palette.warn,
  challenge: palette.danger,
  goal: palette.accent,
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

  const monthStats = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return sumRange(progress, dateKey(new Date(year, month, 1)), dateKey(new Date(year, month, daysInMonth)));
  }, [progress, year, month]);

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
    <View style={styles.root}>
      <LinearGradient colors={['#04140D', '#000000', '#000000']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.monthRow}>
              <Pressable onPress={() => goMonth(-1)} style={styles.monthBtn} hitSlop={10}>
                <Icon name="chevronLeft" size={18} color={palette.textSecondary} strokeWidth={2} />
              </Pressable>
              <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
              <Pressable onPress={() => goMonth(1)} style={styles.monthBtn} hitSlop={10}>
                <Icon name="chevronRight" size={18} color={palette.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Month summary */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValue}>{formatDuration(monthStats.focusMinutes)}</Text>
                <Text style={styles.summaryLabel}>Focused</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValue}>{formatDuration(monthStats.savedMinutes)}</Text>
                <Text style={styles.summaryLabel}>Saved</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryValue}>{monthStats.daysWithFocus}</Text>
                <Text style={styles.summaryLabel}>Active days</Text>
              </View>
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
                const filled = type !== 'none';
                return (
                  <Pressable key={i} onPress={() => setSelected(cell.key)} style={styles.cell}>
                    <View
                      style={[
                        styles.dayDot,
                        { backgroundColor: TYPE_COLOR[type] },
                        isToday && styles.dayDotToday,
                        isSelected && styles.dayDotSelected,
                      ]}
                    >
                      <Text style={[styles.dayNum, filled ? styles.dayNumOn : styles.dayNumOff]}>{cell.day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
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
              <Text style={styles.detailDate}>
                {new Date(selected).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              {selectedType === 'none' ? (
                <Text style={styles.detailEmpty}>No activity logged this day.</Text>
              ) : (
                <View style={styles.metricList}>
                  <Metric icon="target" label="Focus" value={formatDuration(selectedLog.focusMinutes)} />
                  <Metric icon="hourglass" label="Time saved" value={formatDuration(selectedLog.savedMinutes)} />
                  <Metric icon="shield" label="Distractions blocked" value={`${selectedLog.distractionsBlocked}`} />
                  <Metric icon="lock" label="Lock sessions" value={`${selectedLog.lockSessions}`} />
                  <Metric icon="key" label="Hard unlocks" value={`${selectedLog.hardUnlocks}`} />
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricGlyph}>
        <Icon name={icon} size={16} color={palette.accent} strokeWidth={1.8} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: space.sm },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.glass, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: 110 },

  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.lg,
    marginTop: space.base,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: palette.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryValue: { color: palette.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  summaryLabel: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginTop: 3, textTransform: 'uppercase' },
  summaryDivider: { width: 1, height: 30, backgroundColor: palette.hairline },

  weekdayRow: { flexDirection: 'row', marginTop: space.lg },
  weekdayLabel: { flex: 1, textAlign: 'center', color: palette.textQuaternary, fontSize: 12, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.xs },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: '80%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayDotSelected: { borderWidth: 2, borderColor: palette.text },
  dayDotToday: { borderWidth: 1.5, borderColor: palette.accentBorder },
  dayNum: { fontSize: 12.5, fontWeight: '800' },
  dayNumOn: { color: '#04140c' },
  dayNumOff: { color: palette.textTertiary },

  legendWrap: {
    marginTop: space.lg,
    padding: space.base,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.hairline,
    gap: space.sm,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  legendLabel: { color: palette.textSecondary, fontSize: 13.5 },

  detailCard: {
    marginTop: space.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.lg,
  },
  detailDate: { color: palette.text, fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3, marginBottom: space.md },
  detailEmpty: { color: palette.textTertiary, fontSize: 13.5 },
  metricList: { gap: space.md },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  metricGlyph: { width: 30, height: 30, borderRadius: 10, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { flex: 1, color: palette.textSecondary, fontSize: 14 },
  metricValue: { color: palette.text, fontSize: 14.5, fontWeight: '800' },
});
