import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

/** Any user can disable this app in Settings in two taps — no third-party app
 *  on iOS can prevent that. Guardian is one of our two real defences (with the
 *  delayed-settings-change), because it's behavioural, not technical: loosening
 *  a rule means messaging a real human who holds the code, not fighting the OS. */
type Guardian = { enabled: boolean; name: string; contact: string };

export default function GuardianScreen({
  initial,
  onBack,
  onSave,
}: {
  initial?: Guardian | null;
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
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Guardian</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
          <Text style={styles.heroGlyph}>🤝</Text>
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
          <Switch
            value={enabled}
            onValueChange={(v) => {
              setEnabled(v);
              onSave({ enabled: v, name, contact });
            }}
            trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
            thumbColor="#fff"
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
              placeholderTextColor={colors.textFaint}
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
              placeholderTextColor={colors.textFaint}
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
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  hero: { alignItems: 'center', paddingTop: 14, paddingBottom: 26 },
  heroGlyph: { fontSize: 40 },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  heroBody: { color: colors.textDim, fontSize: 14.5, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  toggleTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  toggleSub: { color: colors.textDim, fontSize: 13, marginTop: 3 },
  sectionLabel: { color: colors.textFaint, fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 10 },
  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 15.5,
  },
  confirmCard: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: 'rgba(124,245,176,0.09)' },
  confirmTitle: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  confirmBody: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 20, marginTop: 7 },
  note: { marginTop: 26, padding: 16, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)' },
  noteText: { color: colors.textFaint, fontSize: 13, lineHeight: 19 },
});
