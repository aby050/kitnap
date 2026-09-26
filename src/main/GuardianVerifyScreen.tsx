import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../components/ui';
import { fieldStyle, palette, space } from '../design/tokens';
import Icon from '../ui/Icon';
import { verifyGuardianCode } from '../data/guardianCode';
import BailoutGlyph from '../components/BailoutGlyph';
import { Guardian } from './GuardianScreen';

/** The enforcement side of Guardian: asks for the code, checks it against the
 *  stored hash on-device, and only calls onVerified() on a match. There is no
 *  backend to phone home to; the hash comparison is the whole of it.
 *
 *  It guards five different doors now, not just the intensity dial, and it has
 *  to name the one the user is actually standing at. Saying "weakening Strict
 *  mode needs the code" while someone is deleting their account is how a
 *  feature ends up feeling arbitrary — the user can't tell what the code is
 *  for, so it reads as a random gate rather than a promise they made. */

/** What the user is trying to do. Drives every line of copy on this screen. */
/** What it costs to remove the lock without the code.
 *
 *  Three, not one. A single key is what a bad evening costs — it has to stay
 *  affordable there, and if the same price also deleted the guardian then the
 *  entire commitment system would have a one-key ceiling. Three is a real
 *  decision: enough that nobody spends it on impulse, cheap enough that
 *  somebody whose guardian has genuinely gone quiet is never trapped. */
export const GUARDIAN_RELEASE_COST = 3;

export type GuardedIntent =
  | 'intensity'
  | 'blockedApps'
  | 'schedules'
  | 'settings'
  | 'deleteAccount';

const INTENT_COPY: Record<GuardedIntent, { title: string; what: string; cancel: string }> = {
  intensity: {
    title: 'Make blocking easier?',
    what: 'lowering how hard it is to unlock',
    cancel: 'Never mind, leave it as it is',
  },
  blockedApps: {
    title: 'Unblock an app?',
    what: 'taking an app off your blocked list',
    cancel: 'Never mind, keep it blocked',
  },
  schedules: {
    title: 'Remove a schedule?',
    what: 'deleting one of your blocking schedules',
    cancel: 'Never mind, keep the schedule',
  },
  settings: {
    title: 'Change a protected setting?',
    what: 'changing a setting your guardian protects',
    cancel: 'Never mind, leave it as it is',
  },
  deleteAccount: {
    title: 'Delete everything?',
    what: 'erasing Phonewise and everything in it',
    cancel: 'Never mind, keep my account',
  },
};
export default function GuardianVerifyScreen({
  guardian,
  intent = 'intensity',
  bailouts = 0,
  onVerified,
  onSpendBailout,
  onBuyBailouts,
  onCancel,
}: {
  guardian: Guardian;
  /** Which door this is. Defaults to the dial, the original caller. */
  intent?: GuardedIntent;
  /** Keys in hand. Drives whether the paid exit is offered or sold. */
  bailouts?: number;
  onVerified: () => void;
  /** Spends one key and runs the guarded action. Absent means this door has
   *  no paid exit — deleting the account, where a key would be a bizarre
   *  thing to charge for. */
  /** Spends `GUARDIAN_RELEASE_COST` keys and removes Guardian entirely, then
   *  runs the action that was blocked. The emergency exit. */
  onSpendBailout?: () => void;
  onBuyBailouts?: () => void;
  onCancel: () => void;
}) {
  const copy = INTENT_COPY[intent];
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);

  const submit = async () => {
    if (code.trim().length === 0 || checking) return;
    setChecking(true);
    setWrong(false);
    const ok = await verifyGuardianCode(code, guardian.codeSalt, guardian.codeHash);
    setChecking(false);
    if (ok) onVerified();
    else {
      setWrong(true);
      setCode('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.circleBtn} hitSlop={10}>
          <Icon name="close" size={18} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Ask {guardian.name || 'your guardian'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.heroGlyph}>
          <Icon name="shield" size={30} color={palette.accent} strokeWidth={1.7} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>
          You asked {guardian.name || 'your guardian'} to hold the key to this. {'\n'}
          Ask them for the code — {copy.what} doesn't happen until it matches.
        </Text>
        {!!guardian.contact && (
          <Text style={styles.contact}>
            You sent it to {guardian.contact}
          </Text>
        )}

        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t);
            setWrong(false);
          }}
          placeholder="8-character code"
          placeholderTextColor={palette.textTertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          style={[styles.input, wrong && styles.inputWrong]}
        />
        {wrong && <Text style={styles.wrongText}>That code doesn't match. Try again.</Text>}

        <View style={{ height: 20 }} />
        <GradientButton label={checking ? 'Checking…' : 'Confirm'} onPress={checking ? () => {} : submit} />
        {checking && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}

        {/* The paid exit.
            Someone whose guardian has stopped replying is not a cheat, they
            are stuck — and a lock with no honest way out gets defeated by
            deleting the app instead, which protects nothing. A key is the
            honest way out: instant, and it costs something the user would
            rather spend on a bad evening. */}
        {!!onSpendBailout && (
          <View style={styles.altWrap}>
            <Text style={styles.altLead}>Lost the code, or can't reach {guardian.name || 'them'}?</Text>
            {bailouts >= GUARDIAN_RELEASE_COST ? (
              <Pressable onPress={onSpendBailout} hitSlop={8} style={styles.altBtn}>
                <BailoutGlyph size={15} />
                <Text style={styles.altBtnText}>
                  Remove Guardian for {GUARDIAN_RELEASE_COST} bailouts
                </Text>
              </Pressable>
            ) : (
              !!onBuyBailouts && (
                <Pressable onPress={onBuyBailouts} hitSlop={8} style={styles.altBtn}>
                  <BailoutGlyph size={15} />
                  <Text style={styles.altBtnText}>
                    Needs {GUARDIAN_RELEASE_COST} bailouts — you have {bailouts}
                  </Text>
                </Pressable>
              )
            )}
            <Text style={styles.altFoot}>This ends Guardian for good. Your apps stay blocked.</Text>
          </View>
        )}

        <Pressable onPress={onCancel} hitSlop={10} style={styles.cancelWrap}>
          <Text style={styles.cancelText}>{copy.cancel}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  altWrap: { marginTop: 26, alignItems: 'center', gap: 10 },
  altLead: { color: palette.textTertiary, fontSize: 13.5 },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.surface,
  },
  altBtnText: { color: palette.text, fontSize: 14.5, fontWeight: '700' },
  altFoot: { color: palette.textTertiary, fontSize: 12, textAlign: 'center' },
  contact: {
    color: palette.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: space.md },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: palette.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30 },
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
  title: { color: palette.text, fontSize: 21, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  subtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 26,
  },
  input: {
    width: '100%',
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 6,
    ...fieldStyle,
  },
  inputWrong: { borderColor: '#E5484D' },
  wrongText: { color: '#E5484D', fontSize: 13, marginTop: 8 },
  cancelWrap: { marginTop: 18, paddingVertical: 10 },
  cancelText: { color: palette.textTertiary, fontSize: 13.5, fontWeight: '600' },
});
