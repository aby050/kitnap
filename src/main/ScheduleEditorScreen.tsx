import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

type Schedule = { id: string; name: string; start: string; end: string; days: string };

const SEED: Schedule[] = [
  { id: 'work', name: 'Work Time', start: '09:00', end: '17:00', days: 'Mon–Fri' },
  { id: 'sleep', name: 'Sleep Mode', start: '22:00', end: '07:00', days: 'Every day' },
];

/** Rules were display-only before this — this is where you actually add or
 *  edit a recurring block window. */
export default function ScheduleEditorScreen({ onBack }: { onBack: () => void }) {
  const [schedules, setSchedules] = useState<Schedule[]>(SEED);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [draftDays, setDraftDays] = useState('Every day');

  const startNew = () => {
    setEditing({ id: `s${Date.now()}`, name: '', start: '', end: '', days: 'Every day' });
    setDraftName('');
    setDraftStart('');
    setDraftEnd('');
    setDraftDays('Every day');
  };

  const startEdit = (s: Schedule) => {
    setEditing(s);
    setDraftName(s.name);
    setDraftStart(s.start);
    setDraftEnd(s.end);
    setDraftDays(s.days);
  };

  const save = () => {
    if (!editing || !draftName.trim() || !draftStart.trim() || !draftEnd.trim()) return;
    const next: Schedule = { ...editing, name: draftName.trim(), start: draftStart.trim(), end: draftEnd.trim(), days: draftDays };
    setSchedules((prev) => {
      const exists = prev.some((s) => s.id === next.id);
      return exists ? prev.map((s) => (s.id === next.id ? next : s)) : [...prev, next];
    });
    setEditing(null);
  };

  const remove = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  if (editing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setEditing(null)} style={styles.circleBtn} hitSlop={10}>
            <Text style={styles.headerGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{schedules.some((s) => s.id === editing.id) ? 'Edit rule' : 'New rule'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Name — Work Time, Sleep, Family Time…"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
          <View style={styles.timeRow}>
            <TextInput
              value={draftStart}
              onChangeText={setDraftStart}
              placeholder="Start — 09:00"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.timeInput]}
            />
            <TextInput
              value={draftEnd}
              onChangeText={setDraftEnd}
              placeholder="End — 17:00"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.timeInput]}
            />
          </View>
          <View style={styles.daysRow}>
            {['Every day', 'Mon–Fri', 'Weekends'].map((d) => (
              <Pressable
                key={d}
                onPress={() => setDraftDays(d)}
                style={[styles.dayChip, draftDays === d && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipText, draftDays === d && styles.dayChipTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 10 }} />
          <GradientButton label="Save rule" onPress={save} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Schedules</Text>
        <Pressable onPress={startNew} hitSlop={10}>
          <Text style={styles.addLink}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {schedules.length === 0 && (
          <Text style={styles.empty}>No recurring blocks yet. Add one for the hours that matter most.</Text>
        )}
        {schedules.map((s, i) => (
          <Animated.View key={s.id} entering={FadeInDown.delay(i * 60).duration(340)} style={styles.row}>
            <Pressable onPress={() => startEdit(s)} style={{ flex: 1 }}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.meta}>
                {s.start} – {s.end} · {s.days}
              </Text>
            </Pressable>
            <Pressable onPress={() => remove(s.id)} style={styles.removeBtn} hitSlop={8}>
              <Text style={styles.removeIcon}>✕</Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
  addLink: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 110 },
  empty: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 17,
    marginBottom: 10,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: 13.5, marginTop: 4 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: { color: colors.textDim, fontSize: 13 },
  form: { paddingHorizontal: 18, paddingTop: 20, gap: 12 },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 15.5,
  },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeInput: { flex: 1 },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dayChipActive: { backgroundColor: 'rgba(124,245,176,0.15)', borderColor: colors.accent },
  dayChipText: { color: colors.textDim, fontSize: 13.5, fontWeight: '600' },
  dayChipTextActive: { color: colors.accent },
});
