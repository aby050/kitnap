import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, space } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

/**
 * What you actually see while the Gate is running.
 *
 * Only families the Gate can draw. It listed five for a long time — intent
 * check-ins, cost reminders, typed prompts, your own history, physical holds —
 * and three of them had no renderer at all, so switching them on or off
 * changed nothing. A toggle that does nothing is worse than a missing one.
 *
 * A family earns a row here when GateScreen has a branch for its `kind`. The
 * three that are gone (A, B, D) are still written in gateQuestions.ts and come
 * back the day they can be shown.
 */
const CONTENT_TYPES: { id: string; name: string; desc: string; icon: IconName }[] = [
  { id: 'C', name: 'Self-confrontation', desc: 'Short typed prompts. The one that works hardest.', icon: 'edit' },
  { id: 'F', name: 'Pause and answer', desc: 'A breath, a sum, or a question. Deliberately dull.', icon: 'breathe' },
];

export default function WaitingRoomScreen({
  onBack,
  initial,
  onSave,
}: {
  onBack: () => void;
  initial?: Record<string, boolean>;
  /** Persists the choice. Without this the toggles were local state that the
   *  back button discarded — a settings screen that looked like it worked and
   *  did nothing at all. */
  onSave?: (families: Record<string, boolean>) => void;
}) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    initial ?? { C: true, F: true },
  );

  const toggle = (id: string) => {
    const activeCount = Object.values(enabled).filter(Boolean).length;
    if (enabled[id] && activeCount <= 1) return; // at least one family must stay on
    setEnabled((p) => {
      const next = { ...p, [id]: !p[id] };
      onSave?.(next);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Waiting Room</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lede}>
          Choose what can appear at the Gate. Turning families off makes each unlock more predictable —
          predictable is easier to get used to, so we don't recommend turning off more than one or two.
        </Text>

        {CONTENT_TYPES.map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(i * 55).duration(340)}>
            <Pressable onPress={() => toggle(c.id)} style={[styles.row, !enabled[c.id] && styles.rowOff]}>
              <View style={styles.glyph}>
                <Icon name={c.icon} size={22} color={palette.text} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.desc}>{c.desc}</Text>
              </View>
              <View style={[styles.check, enabled[c.id] && styles.checkOn]}>
                {enabled[c.id] ? <Icon name="check" size={14} color="#04140c" strokeWidth={3} /> : null}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            At least one family always stays on — a Gate with nothing in it isn't a Gate.
          </Text>
        </View>
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
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  lede: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  rowOff: { opacity: 0.5 },
  glyph: { width: 28, alignItems: 'center' },
  name: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  desc: { color: palette.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.8,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: palette.accent, borderColor: palette.accent },
  checkTick: { color: '#062', fontSize: 13, fontWeight: '900' },
  note: { marginTop: 12, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)' },
  noteText: { color: palette.textTertiary, fontSize: 13, lineHeight: 19 },
});
