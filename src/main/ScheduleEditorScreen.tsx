import LineArt from '../onboarding/LineArt';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { FREE_SCHEDULE_LIMIT } from '../data/store';
import { Schedule } from '../data/store';
import {
  SCHEDULE_PRESETS,
  SchedulePreset,
  matchesSlipWindow,
  toSchedule,
} from '../data/schedulePresets';
import { fieldStyle, palette, space } from '../design/tokens';
import Icon from '../ui/Icon';
import ProGateDialog from '../components/ProGateDialog';

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
  isPro = false,
  onUpgrade,
  slipWindow = null,
}: {
  schedules: Schedule[];
  onChange: (next: Schedule[]) => void;
  onBack: () => void;
  /** The free plan keeps one schedule. PlanCompareScreen has been telling
   *  users "Schedules — free: 1, Pro: Unlimited" since the paywall was
   *  written; nothing enforced it, so the promise was the only thing that was
   *  true. This is the code catching up to the copy, not a new restriction. */
  isPro?: boolean;
  onUpgrade?: () => void;
  /** The onboarding answer to "when does the phone usually win?" — used only
   *  to mark which suggestion is the one they already told us about. */
  slipWindow?: string | null;
}) {
  /** Suggestions not already in the list. Matched by id, so a preset the user
   *  added and then renamed does not come back offering itself again. */
  const available = SCHEDULE_PRESETS.filter((p) => !schedules.some((s) => s.id === p.id));

  const addPreset = (preset: SchedulePreset) => {
    // Free plan keeps one schedule — the same gate the manual add respects.
    if (!isPro && schedules.length >= 1) {
      onUpgrade?.();
      return;
    }
    onChange([...schedules, toSchedule(preset)]);
  };

  const [showProGate, setShowProGate] = useState(false);
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
    // Editing what you already have is never blocked — only adding a second.
    if (!exists && !isPro && schedules.length >= FREE_SCHEDULE_LIMIT) {
      setEditing(null);
      // Styled like the rest of the app rather than a platform alert — see
      // ProGateDialog.
      setShowProGate(true);
      return;
    }
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

        {/* Suggested windows.
            Writing a schedule from scratch means naming it, picking two times
            and a day pattern before anything happens — five decisions to
            express one thought ("stop me doomscrolling at midnight"). These
            are that thought, one tap each. Only the ones not already added
            appear, so the list empties as it is used rather than nagging.

            The recommended flag is not a guess: onboarding asked when the
            phone usually wins, and this is the preset covering that answer. */}
        <LineArt name="clock" height={140} />
        {available.length > 0 && (
          <>
            <Text style={styles.presetHead}>Suggested</Text>
            {available.map((preset, i) => {
              const recommended = matchesSlipWindow(preset, slipWindow);
              return (
                <Animated.View
                  key={preset.id}
                  entering={FadeInDown.delay(i * 60).duration(340)}
                >
                  <Pressable
                    onPress={() => addPreset(preset)}
                    style={[styles.presetRow, recommended && styles.presetRowOn]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.presetTitleRow}>
                        <Text style={styles.name}>{preset.name}</Text>
                        {recommended && (
                          <View style={styles.presetBadge}>
                            <Text style={styles.presetBadgeText}>FOR YOU</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.presetBlurb}>{preset.blurb}</Text>
                      <Text style={styles.meta}>
                        {preset.start} – {preset.end} · {preset.days}
                      </Text>
                    </View>
                    <View style={styles.presetAdd}>
                      <Icon name="plus" size={16} color={palette.accent} strokeWidth={2.4} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
            {schedules.length > 0 && <Text style={styles.presetHead}>Yours</Text>}
          </>
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

      <ProGateDialog
        visible={showProGate}
        title="One schedule on the free plan"
        body="Phonewise Pro adds as many recurring windows as you want. Your existing schedule keeps working either way."
        icon="calendar"
        onDismiss={() => setShowProGate(false)}
        onSeePlans={() => {
          setShowProGate(false);
          onUpgrade?.();
        }}
      />
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
    backgroundColor: 'rgba(46,49,54,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: palette.text, fontSize: 19 },
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  addLink: { color: palette.accent, fontSize: 16, fontWeight: '700' },
  presetHead: {
    color: palette.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 6,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(46,49,54,0.035)',
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: 20,
    padding: 17,
    marginBottom: 10,
  },
  presetRowOn: { borderColor: palette.accentBorder, backgroundColor: palette.accentSoft },
  presetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  presetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  presetBadgeText: { color: palette.accent, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
  presetBlurb: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 5 },
  presetAdd: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  scroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 110 },
  empty: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,49,54,0.05)',
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
    backgroundColor: 'rgba(46,49,54,0.08)',
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
    borderColor: 'rgba(46,49,54,0.15)',
  },
  dayChipActive: { backgroundColor: 'rgba(71,107,235,0.15)', borderColor: palette.accent },
  dayChipText: { color: palette.textSecondary, fontSize: 13.5, fontWeight: '600' },
  dayChipTextActive: { color: palette.accent },
});
