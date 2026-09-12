import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { Schedule } from '../data/store';
import { fieldStyle, palette, space } from '../design/tokens';
import Icon from '../ui/Icon';

/** "09:00" <-> a Date carrying that time (today's date, ignored). The picker
 *  needs a real Date; the rest of the app only ever stores "HH:MM" strings. */
function hhmmToDate(hhmm: string): Date {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}
function dateToHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function formatHhmm(hhmm: string): string {
  if (!hhmm) return '';
  const d = hhmmToDate(hhmm);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Rules were display-only before this — this is where you actually add or
 *  edit a recurring block window. Schedules are persisted by the caller, so
 *  edits survive a restart instead of resetting to a seed list. */
export default function ScheduleEditorScreen({
  schedules,
  onChange,
  onBack,
}: {
  schedules: Schedule[];
  onChange: (next: Schedule[]) => void;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [draftDays, setDraftDays] = useState('Every day');
  // Which field's native picker is open — Android's is a one-shot dialog
  // (opens and closes itself on pick), iOS's is inline and needs its own
  // dismiss, so both fields share this rather than each owning a boolean.
  const [openPicker, setOpenPicker] = useState<'start' | 'end' | null>(null);

  const onPickTime = (which: 'start' | 'end') => (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpenPicker(null);
    if (event.type === 'dismissed' || !date) return;
    if (which === 'start') setDraftStart(dateToHhmm(date));
    else setDraftEnd(dateToHhmm(date));
  };

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
    const exists = schedules.some((s) => s.id === next.id);
    onChange(exists ? schedules.map((s) => (s.id === next.id ? next : s)) : [...schedules, next]);
    setEditing(null);
  };

  const remove = (id: string) => {
    onChange(schedules.filter((s) => s.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  if (editing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setEditing(null)} style={styles.circleBtn} hitSlop={10}>
            <Icon name="chevronLeft" size={20} color={palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{schedules.some((s) => s.id === editing.id) ? 'Edit rule' : 'New rule'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoider>
          <View style={styles.form}>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Name — Work Time, Sleep, Family Time…"
              placeholderTextColor={palette.textTertiary}
              style={styles.input}
            />
            <View style={styles.timeRow}>
              <Pressable
                onPress={() => setOpenPicker('start')}
                style={[styles.input, styles.timeInput, styles.timeField]}
              >
                <Text style={draftStart ? styles.timeValue : styles.timePlaceholder}>
                  {draftStart ? formatHhmm(draftStart) : 'Start'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setOpenPicker('end')}
                style={[styles.input, styles.timeInput, styles.timeField]}
              >
                <Text style={draftEnd ? styles.timeValue : styles.timePlaceholder}>
                  {draftEnd ? formatHhmm(draftEnd) : 'End'}
                </Text>
              </Pressable>
            </View>

            {/* Android's picker is a self-contained dialog; iOS's is inline
                and needs its own "Done" since the spinner doesn't dismiss
                itself. */}
            {openPicker && (
              <>
                <DateTimePicker
                  value={hhmmToDate(openPicker === 'start' ? draftStart || '09:00' : draftEnd || '17:00')}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onPickTime(openPicker)}
                  themeVariant="dark"
                />
                {Platform.OS === 'ios' && (
                  <Pressable onPress={() => setOpenPicker(null)} style={styles.pickerDone}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </Pressable>
                )}
              </>
            )}
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
        </KeyboardAvoider>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Schedules</Text>
        <Pressable onPress={startNew} hitSlop={10}>
          <Text style={styles.addLink}>Add</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        {...keyboardScrollProps}
      >
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
              <Icon name="close" size={12} color={palette.textSecondary} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: space.md },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: palette.text, fontSize: 19 },
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  addLink: { color: palette.accent, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 110 },
  empty: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 17,
    marginBottom: 10,
  },
  name: { color: palette.text, fontSize: 16, fontWeight: '700' },
  meta: { color: palette.textSecondary, fontSize: 13.5, marginTop: 4 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: { color: palette.textSecondary, fontSize: 13 },
  form: { paddingHorizontal: 18, paddingTop: 20, gap: 12 },
  input: {
    ...fieldStyle,
  },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeInput: { flex: 1 },
  timeField: { justifyContent: 'center' },
  timeValue: { color: palette.text, fontSize: 16, fontWeight: '600' },
  timePlaceholder: { color: palette.textTertiary, fontSize: 16 },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pickerDoneText: { color: palette.accent, fontSize: 15, fontWeight: '700' },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dayChipActive: { backgroundColor: 'rgba(76,158,255,0.15)', borderColor: palette.accent },
  dayChipText: { color: palette.textSecondary, fontSize: 13.5, fontWeight: '600' },
  dayChipTextActive: { color: palette.accent },
});
