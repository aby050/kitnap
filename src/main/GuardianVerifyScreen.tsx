import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientButton } from '../components/ui';
import { fieldStyle, palette, space } from '../design/tokens';
import Icon from '../ui/Icon';
import { verifyGuardianCode } from '../data/guardianCode';
import { Guardian } from './GuardianScreen';

/** The enforcement side of Guardian. Reached only when someone is loosening
 *  Strict mode with a guardian enabled — asks for the code, checks it against
 *  the stored hash on-device, and only calls onVerified() on a match. There is
 *  no backend to phone home to; the hash comparison is the whole of it. */
export default function GuardianVerifyScreen({
  guardian,
  onVerified,
  onCancel,
}: {
  guardian: Guardian;
  onVerified: () => void;
  onCancel: () => void;
}) {
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
        <Text style={styles.title}>Enter their code</Text>
        <Text style={styles.subtitle}>
          Weakening Strict mode needs the code you sent {guardian.name || 'your guardian'}. Ask them for
          it — nothing changes until it matches.
        </Text>

        <TextInput
          value={code}
          onChangeText={(t) => {
            setCode(t);
            setWrong(false);
          }}
          placeholder="6-digit code"
          placeholderTextColor={palette.textTertiary}
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, wrong && styles.inputWrong]}
        />
        {wrong && <Text style={styles.wrongText}>That code doesn't match. Try again.</Text>}

        <View style={{ height: 20 }} />
        <GradientButton label={checking ? 'Checking…' : 'Confirm'} onPress={checking ? () => {} : submit} />
        {checking && <ActivityIndicator color={palette.text} style={{ marginTop: 10 }} />}

        <Pressable onPress={onCancel} hitSlop={10} style={styles.cancelWrap}>
          <Text style={styles.cancelText}>Never mind, keep Strict mode as is</Text>
        </Pressable>
      </View>
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
  headerTitle: { flex: 1, color: palette.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30 },
  heroGlyph: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(76,158,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76,158,255,0.2)',
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
