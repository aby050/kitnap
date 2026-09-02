import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Account } from '../data/store';

/** Fallback for every platform except iOS (web, Android). Never imports
 *  expo-apple-authentication — that package is iOS-only at the package
 *  level, so Metro can't resolve it into a non-iOS bundle at all. */
export default function AppleSignInButton({
  onError,
}: {
  onSignedIn: (account: Account) => void;
  onError: (message: string) => void;
}) {
  return (
    <Pressable
      style={styles.btn}
      onPress={() => onError('Apple Sign In needs a real iOS device build — not available here.')}
    >
      <Text style={styles.glyph}></Text>
      <Text style={styles.text}>Continue with Apple</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  glyph: { fontSize: 18, marginTop: -2 },
  text: { color: '#000', fontSize: 15.5, fontWeight: '700' },
});
