import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import LoginScreen from './LoginScreen';
import { Account } from '../data/store';
import { colors } from '../theme';

const METHOD_LABEL: Record<Account['method'], string> = {
  apple: 'Apple',
  google: 'Google',
  email: 'Email',
};
const METHOD_GLYPH: Record<Account['method'], string> = {
  apple: '',
  google: 'G',
  email: '✉',
};

/** Identity (who you are) and data (your progress) are two different
 *  promises. Signing in only ever attaches an identity locally — it does not
 *  quietly turn on a server or cloud sync, which is why the copy below still
 *  says nothing leaves the device. */
export default function AccountScreen({
  name,
  onSaveName,
  account,
  onSignIn,
  onSignOut,
  onBack,
}: {
  name: string;
  onSaveName: (n: string) => void;
  account: Account | null;
  onSignIn: (account: Account) => void;
  onSignOut: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(name || account?.name || '');

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
            <Text style={styles.avatarGlyph}>{(draft || account?.identifier || '?').charAt(0).toUpperCase()}</Text>
          </View>
        </Animated.View>

        {account ? (
          <>
            <View style={styles.signedInRow}>
              <Text style={styles.methodGlyph}>{METHOD_GLYPH[account.method]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.signedInIdentifier}>{account.identifier}</Text>
                <Text style={styles.signedInMethod}>Signed in with {METHOD_LABEL[account.method]}</Text>
              </View>
            </View>

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

            <Pressable onPress={onSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <LoginScreen onSignedIn={onSignIn} />
        )}

        <View style={styles.syncCard}>
          <Text style={styles.syncGlyph}>🔒</Text>
          <Text style={styles.syncTitle}>Cloud sync — coming soon</Text>
          <Text style={styles.syncBody}>
            Signing in only saves an identity on this device — your progress still lives here, not on a
            server. Cross-device sync is still coming, and will be opt-in and end-to-end encrypted when it
            ships.
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
  avatarWrap: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
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
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
  },
  methodGlyph: { fontSize: 20, width: 26, textAlign: 'center', color: colors.text },
  signedInIdentifier: { color: colors.text, fontSize: 15, fontWeight: '700' },
  signedInMethod: { color: colors.textDim, fontSize: 12.5, marginTop: 3 },
  label: { color: colors.textFaint, fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 10 },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 16,
  },
  signOutBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 6 },
  signOutText: { color: '#ff8f6b', fontSize: 14.5, fontWeight: '600' },
  syncCard: { marginTop: 30, padding: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)' },
  syncGlyph: { fontSize: 22, marginBottom: 8 },
  syncTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  syncBody: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, marginTop: 8 },
});
