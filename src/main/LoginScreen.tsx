import React, { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AppleSignInButton from './AppleSignInButton';
import { Account } from '../data/store';
import { fonts, palette } from '../design/tokens';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../data/purchases';

/** Google requires a real OAuth client ID from Google Cloud Console before it
 *  can complete a real sign-in — there's nothing to fake here without lying
 *  about a network round-trip that never happened. Swap this in when you have
 *  one; until then the button is honest about needing setup instead of
 *  pretending to succeed. */
const GOOGLE_CLIENT_ID_CONFIGURED = false;

export default function LoginScreen({
  onSignedIn,
  onSkip,
}: {
  onSignedIn: (account: Account) => void;
  onSkip?: () => void;
}) {
  const [error, setError] = useState('');

  const handleGoogle = () => {
    setError('');
    if (!GOOGLE_CLIENT_ID_CONFIGURED) {
      setError('Google Sign In needs an OAuth client ID configured first — see LoginScreen.tsx.');
      return;
    }
  };

  /* One provider, chosen by platform: Apple on iOS, Google everywhere else.
   * Offering both on a single OS asks the user to remember which one they
   * used last — the platform account is the one they can't have forgotten. */
  const isIOS = Platform.OS === 'ios';

  return (
    <View style={styles.wrap}>
      {/* Set like the education headlines: heavy lowercase on sub-1.0 leading
          with one line carrying the accent, so a returning user lands on the
          same voice they left rather than on a generic auth form. */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={styles.heading}>welcome</Text>
        <Text style={[styles.heading, styles.headingAccent]}>back.</Text>
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={styles.sub}>
        Sign in with the same account and your setup comes with you.
      </Animated.Text>

      <Animated.View entering={FadeIn.delay(180).duration(400)} style={styles.buttons}>
        {isIOS ? (
          <AppleSignInButton onSignedIn={onSignedIn} onError={setError} />
        ) : (
          <Pressable style={[styles.providerBtn, styles.googleBtn]} onPress={handleGoogle}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>
        )}
      </Animated.View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {onSkip && (
        <Pressable onPress={onSkip} style={styles.skip} hitSlop={10}>
          <Text style={styles.skipText}>I’m new — set me up instead</Text>
        </Pressable>
      )}

      {/* Guideline 3.1.2 / 5.1.1 both expect these reachable at the point of
          sign-up, not buried in Settings. */}
      <Text style={styles.legal}>
        By signing in you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
          Terms of Use
        </Text>{' '}
        and{' '}
        <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch', paddingHorizontal: 28, paddingTop: 10 },
  heading: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 46,
    lineHeight: 48,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: -2,
    textTransform: 'lowercase',
  },
  headingAccent: { color: palette.accent },
  sub: {
    color: palette.onColorTextDim,
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: 'left',
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 320,
  },
  buttons: { width: '100%', gap: 12, marginTop: 34 },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 999,
  },
  googleBtn: { backgroundColor: '#FFFFFF' },
  googleG: { fontSize: 18, fontWeight: '900', color: '#4285F4' },
  googleText: { color: '#1f1f1f', fontFamily: fonts.semibold, fontSize: 16, fontWeight: '600' },
  error: { color: palette.danger, fontSize: 13, textAlign: 'center', marginTop: 14, maxWidth: 300 },
  skip: { marginTop: 22, paddingVertical: 8, alignSelf: 'center' },
  skipText: { color: palette.onColorTextDim, fontSize: 14, fontWeight: '600' },
  legalLink: { color: palette.text, textDecorationLine: 'underline' },
  legal: {
    color: palette.onColorTextDim,
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.8,
  },
});
