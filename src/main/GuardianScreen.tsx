import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { fieldStyle, palette, space } from '../design/tokens';
import Icon from '../ui/Icon';
import Toggle from '../design/Toggle';

/** Any user can disable this app in Settings in two taps — no third-party app
 *  on iOS can prevent that. Guardian is one of our two real defences (with the
 *  delayed-settings-change), because it's behavioural, not technical: loosening
 *  a rule means messaging a real human who holds the code, not fighting the OS. */
type Guardian = { enabled: boolean; name: string; contact: string };

export default function GuardianScreen({
  initial,
  hoursReclaimed = 0,
  onBack,
  onSave,
}: {
  initial?: Guardian | null;
  /** Drives the "this is all they'd see" preview. */
  hoursReclaimed?: number;
  onBack: () => void;
  onSave: (g: Guardian) => void;
}) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [name, setName] = useState(initial?.name ?? '');
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [saved, setSaved] = useState(!!initial?.name);

  const canSave = name.trim().length > 0 && contact.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Guardian</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        {...keyboardScrollProps}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <View style={styles.heroGlyph}>
            <Icon name="shield" size={34} color={palette.accent} strokeWidth={1.7} />
          </View>
          <Text style={styles.heroTitle}>A friend holds the code</Text>
          <Text style={styles.heroBody}>
            We can't stop you disabling this in Settings — nobody can, on iOS. So instead, weakening Strict
            mode or shortening your intensity delay requires a code that only your guardian has.
          </Text>
        </Animated.View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Enable Guardian</Text>
            <Text style={styles.toggleSub}>Requires premium</Text>
          </View>
          <Toggle
            value={enabled}
            onValueChange={(v) => {
              setEnabled(v);
              onSave({ enabled: v, name, contact });
            }}
          />
        </View>

        {enabled && (
          <Animated.View entering={FadeInDown.duration(360)}>
            <Text style={styles.sectionLabel}>Who is it?</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setSaved(false);
              }}
              placeholder="Their name"
              placeholderTextColor={palette.textTertiary}
              style={styles.input}
            />
            <View style={{ height: 10 }} />
            <TextInput
              value={contact}
              onChangeText={(t) => {
                setContact(t);
                setSaved(false);
              }}
              placeholder="Their phone or email"
              placeholderTextColor={palette.textTertiary}
              style={styles.input}
            />

            <View style={{ height: 20 }} />
            <GradientButton
              label={saved ? 'Saved' : 'Save guardian'}
              onPress={() => {
                if (!canSave) return;
                setSaved(true);
                onSave({ enabled, name: name.trim(), contact: contact.trim() });
              }}
            />

            {saved && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>{name} can now unlock changes</Text>
                <Text style={styles.confirmBody}>
                  When you try to weaken Strict mode or shorten your delay, we'll text {name} a one-time code.
                  Nothing changes until they send it back to you.
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>What they would see</Text>
          <Text style={styles.previewValue}>{hoursReclaimed.toFixed(1)}h reclaimed</Text>
          <Text style={styles.previewSub}>
            That is the whole of it. No app names, no gate answers, nothing you typed.
          </Text>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            This never applies to Emergency access — break-glass stays free, instant and unlimited for you,
            always. Guardian only guards the rules you set for yourself on purpose.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  previewCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
  },
  previewLabel: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  previewValue: { color: palette.text, fontSize: 26, fontWeight: '800', marginTop: 8 },
  previewSub: { color: palette.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
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
  hero: { alignItems: 'center', paddingTop: 14, paddingBottom: 26 },
  heroGlyph: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(111,227,169,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(111,227,169,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: palette.text, fontSize: 22, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  heroBody: { color: palette.textSecondary, fontSize: 14.5, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  toggleTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  toggleSub: { color: palette.textSecondary, fontSize: 13, marginTop: 3 },
  sectionLabel: { color: palette.textTertiary, fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 10 },
  input: {
    width: '100%',
    ...fieldStyle,
  },
  confirmCard: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: 'rgba(111,227,169,0.09)' },
  confirmTitle: { color: palette.accent, fontSize: 15, fontWeight: '700' },
  confirmBody: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 20, marginTop: 7 },
  note: { marginTop: 26, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)' },
  noteText: { color: palette.textTertiary, fontSize: 13, lineHeight: 19 },
});
