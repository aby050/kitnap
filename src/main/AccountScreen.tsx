import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

/** Deliberately local-only, per the product's own privacy promise — "your
 *  data never leaves this device" is a claim we can only make truthfully by
 *  not having a backend. This screen still gives the Opal-style account
 *  surface: a display name and an honest explanation of why sign-in is a
 *  "coming soon," not a missing feature. */
export default function AccountScreen({
  name,
  onSaveName,
  onBack,
}: {
  name: string;
  onSaveName: (n: string) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(name);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarGlyph}>{(draft || '?').charAt(0).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Your name"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          onBlur={() => onSaveName(draft.trim())}
        />

        <View style={{ height: 20 }} />
        <GradientButton
          label="Save"
          onPress={() => {
            onSaveName(draft.trim());
            onBack();
          }}
        />

        <View style={styles.syncCard}>
          <Text style={styles.syncGlyph}>🔒</Text>
          <Text style={styles.syncTitle}>Cloud sync — coming soon</Text>
          <Text style={styles.syncBody}>
            Right now nothing about you leaves this device — no account, no server, no way for us to see your
            data even if we wanted to. When cross-device sync ships, it'll be opt-in and end-to-end encrypted,
            never a requirement to use the app.
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
  avatarWrap: { alignItems: 'center', marginTop: 10, marginBottom: 26 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(124,245,176,0.14)',
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { color: colors.accent, fontSize: 34, fontWeight: '800' },
  label: { color: colors.textFaint, fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 10 },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 16,
  },
  syncCard: { marginTop: 30, padding: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)' },
  syncGlyph: { fontSize: 22, marginBottom: 8 },
  syncTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  syncBody: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, marginTop: 8 },
});
