import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { fieldStyle, palette, space } from '../design/tokens';
import Icon from '../ui/Icon';
import Toggle from '../design/Toggle';
import { generateGuardianCode, hashGuardianCode, newSalt } from '../data/guardianCode';

/** Any user can disable this app in Settings in two taps — no third-party app
 *  on iOS can prevent that. Guardian is one of our two real defences (with the
 *  delayed-settings-change in intensityChange.ts), because it's behavioural,
 *  not technical: loosening a rule means asking a real human for a code, not
 *  fighting the OS.
 *
 *  There is no backend, so there is no way for Byre to deliver the code
 *  itself. Instead the code is generated on-device and the user sends it to
 *  their guardian themselves, through the OS share sheet — their own
 *  messaging apps, not a service Byre runs. Only a salted hash is ever
 *  persisted; the plaintext code exists only for the moment it's shown and
 *  shared. */
export type Guardian = { enabled: boolean; name: string; contact: string; codeHash: string; codeSalt: string };

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
  onSave: (g: Guardian | null) => void;
}) {
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [name, setName] = useState(initial?.name ?? '');
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [hasCode, setHasCode] = useState(!!initial?.codeHash);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canGenerate = name.trim().length > 0;

  const generate = async () => {
    if (!canGenerate || busy) return;
    setBusy(true);
    const code = await generateGuardianCode();
    setBusy(false);
    setPendingCode(code);
  };

  const shareAndSave = async () => {
    if (!pendingCode) return;
    const trimmedName = name.trim();
    try {
      await Share.share({
        message: `I've set you as my Guardian in Byre. If I ask you to unlock Strict mode, this is the code: ${pendingCode}\n\nOnly give it to me if you think I should really have it.`,
      });
    } catch {
      // Share sheet dismissed or failed — the code is still valid and can be
      // read out or retyped, so saving proceeds either way.
    }
    const salt = await newSalt();
    const codeHash = await hashGuardianCode(pendingCode, salt);
    setPendingCode(null);
    setHasCode(true);
    onSave({ enabled: true, name: trimmedName, contact: contact.trim(), codeHash, codeSalt: salt });
  };

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
            mode requires a code that only your guardian has. You send it to them yourself; Byre never sees
            it and never delivers it.
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
              if (!v) {
                onSave(null);
                setHasCode(false);
                setPendingCode(null);
              }
            }}
          />
        </View>

        {enabled && (
          <Animated.View entering={FadeInDown.duration(360)}>
            <Text style={styles.sectionLabel}>Who is it?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Their name"
              placeholderTextColor={palette.textTertiary}
              style={styles.input}
            />
            <View style={{ height: 10 }} />
            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder="Their phone or email (optional, just for your reference)"
              placeholderTextColor={palette.textTertiary}
              style={styles.input}
            />

            <View style={{ height: 20 }} />

            {pendingCode ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.codeCard}>
                <Text style={styles.codeLabel}>Their code</Text>
                <Text style={styles.codeValue}>{pendingCode}</Text>
                <Text style={styles.codeHint}>
                  Send this to {name.trim() || 'them'} now. Once you save, Byre only keeps a scrambled copy
                  — if you lose this code you'll need to set a new guardian.
                </Text>
                <View style={{ height: 14 }} />
                <GradientButton label={`Share with ${name.trim() || 'them'}`} onPress={shareAndSave} />
              </Animated.View>
            ) : (
              <GradientButton
                label={busy ? 'One moment…' : hasCode ? 'Generate a new code' : 'Generate their code'}
                onPress={busy ? () => {} : generate}
              />
            )}
            {busy && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}

            {hasCode && !pendingCode && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>{name.trim()} can unlock changes</Text>
                <Text style={styles.confirmBody}>
                  When you try to weaken Strict mode, you'll be asked for the code you sent them. Nothing
                  changes until it's entered correctly.
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
    backgroundColor: 'rgba(71,107,235,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(71,107,235,0.2)',
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
  codeCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(71,107,235,0.09)',
    alignItems: 'center',
  },
  codeLabel: { color: palette.textTertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  codeValue: { color: palette.text, fontSize: 34, fontWeight: '800', letterSpacing: 6, marginTop: 8 },
  codeHint: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  confirmCard: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: 'rgba(71,107,235,0.09)' },
  confirmTitle: { color: palette.accent, fontSize: 15, fontWeight: '700' },
  confirmBody: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 20, marginTop: 7 },
  note: { marginTop: 26, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)' },
  noteText: { color: palette.textTertiary, fontSize: 13, lineHeight: 19 },
});
