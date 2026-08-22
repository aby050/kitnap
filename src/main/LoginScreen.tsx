import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import AppleSignInButton from './AppleSignInButton';
import { Account } from '../data/store';
import { colors } from '../theme';

/** Google requires a real OAuth client ID from Google Cloud Console before it
 *  can complete a real sign-in — there's nothing to fake here without lying
 *  about a network round-trip that never happened. Swap this in when you have
 *  one; until then the button is honest about needing setup instead of
 *  pretending to succeed. */
const GOOGLE_CLIENT_ID_CONFIGURED = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({
  onSignedIn,
  onSkip,
}: {
  onSignedIn: (account: Account) => void;
  onSkip?: () => void;
}) {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleGoogle = () => {
    setError('');
    if (!GOOGLE_CLIENT_ID_CONFIGURED) {
      setError('Google Sign In needs an OAuth client ID configured first — see LoginScreen.tsx.');
      return;
    }
  };

  const submitEmail = () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("That doesn't look like a valid email.");
      return;
    }
    setError('');
    onSignedIn({ method: 'email', identifier: trimmed, name: '' });
  };

  return (
    <View style={styles.wrap}>
      <Animated.Text entering={FadeInDown.duration(400)} style={styles.heading}>
        Sign in to save your setup
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={styles.sub}>
        Your progress already lives on this device — signing in just gives you a way to identify yourself if
        you ever move to a new one.
      </Animated.Text>

      {!showEmail ? (
        <Animated.View entering={FadeIn.delay(180).duration(400)} style={styles.buttons}>
          <AppleSignInButton onSignedIn={onSignedIn} onError={setError} />

          <Pressable style={[styles.providerBtn, styles.googleBtn]} onPress={handleGoogle}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Pressable style={[styles.providerBtn, styles.emailBtn]} onPress={() => setShowEmail(true)}>
            <Text style={styles.emailGlyph}>✉</Text>
            <Text style={styles.emailBtnText}>Continue with Email</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(300)} style={styles.emailForm}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoFocus
          />
          <View style={{ height: 12 }} />
          <GradientButton label="Continue" onPress={submitEmail} />
          <Pressable onPress={() => setShowEmail(false)} style={styles.backLink} hitSlop={10}>
            <Text style={styles.backLinkText}>‹ Other ways to sign in</Text>
          </Pressable>
        </Animated.View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {onSkip && (
        <Pressable onPress={onSkip} style={styles.skip} hitSlop={10}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 26, paddingTop: 10 },
  heading: { color: colors.text, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.textDim, fontSize: 13.5, textAlign: 'center', lineHeight: 19, marginTop: 10, maxWidth: 300 },
  buttons: { width: '100%', maxWidth: 320, gap: 12, marginTop: 26 },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 26,
  },
  googleBtn: { backgroundColor: '#fff' },
  googleG: { fontSize: 17, fontWeight: '900', color: '#4285F4' },
  googleText: { color: '#1f1f1f', fontSize: 15.5, fontWeight: '700' },
  emailBtn: { backgroundColor: colors.pillBg, borderWidth: 1, borderColor: colors.cardBorder },
  emailGlyph: { fontSize: 16, color: colors.text },
  emailBtnText: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  emailForm: { width: '100%', maxWidth: 320, marginTop: 26 },
  input: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 16,
  },
  backLink: { alignItems: 'center', paddingVertical: 14 },
  backLinkText: { color: colors.textDim, fontSize: 13.5, fontWeight: '600' },
  error: { color: '#ff8f6b', fontSize: 13, textAlign: 'center', marginTop: 14, maxWidth: 300 },
  skip: { marginTop: 22, paddingVertical: 8 },
  skipText: { color: colors.textFaint, fontSize: 13.5, fontWeight: '600' },
});
