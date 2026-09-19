import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import LoginScreen from './LoginScreen';
import { Account } from '../data/store';
import { Field } from '../design/primitives';
import { palette, space } from '../design/tokens';
import Icon from '../ui/Icon';

const METHOD_LABEL: Record<Account['method'], string> = {
  apple: 'Apple',
  google: 'Google',
  email: 'Email',
};
const METHOD_GLYPH: Record<Account['method'], string> = {
  apple: '',
  google: 'G',
  email: '@',
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
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        {...keyboardScrollProps}
      >
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
            <Field
              value={draft}
              onChangeText={setDraft}
              placeholder="Your name"
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
          <View style={{ marginBottom: 8 }}>
            <Icon name="lock" size={20} color={palette.text} strokeWidth={1.8} />
          </View>
          {/* A statement of what the app does today, not a promise about a
              feature. It used to be headed "coming soon", which is a roadmap
              the user cannot hold anyone to. */}
          <Text style={styles.syncTitle}>Everything stays on this phone</Text>
          <Text style={styles.syncBody}>
            Signing in saves an identity on this device and nothing else. Your progress, blocked apps and
            history are stored here, never on a server — which also means they are gone if you uninstall.
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
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, color: palette.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 18, paddingBottom: 110 },
  avatarWrap: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(71,107,235,0.14)',
    borderWidth: 1.5,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { color: palette.accent, fontSize: 34, fontWeight: '800' },
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
  },
  methodGlyph: { fontSize: 20, width: 26, textAlign: 'center', color: palette.text },
  signedInIdentifier: { color: palette.text, fontSize: 15, fontWeight: '700' },
  signedInMethod: { color: palette.textSecondary, fontSize: 12.5, marginTop: 3 },
  label: { color: palette.textTertiary, fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 10 },
  signOutBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 6 },
  signOutText: { color: palette.danger, fontSize: 14.5, fontWeight: '600' },
  syncCard: { marginTop: 30, padding: 18, borderRadius: 22, backgroundColor: palette.surface },
  syncGlyph: { fontSize: 22, marginBottom: 8 },
  syncTitle: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  syncBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 20, marginTop: 8 },
});
