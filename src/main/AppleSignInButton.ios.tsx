import React, { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Account } from '../data/store';

/** iOS-only build of the Apple button — Metro resolves this file instead of
 *  the fallback whenever the target platform is "ios", because
 *  expo-apple-authentication itself declares platforms:["apple"] and cannot
 *  be referenced from a web or Android bundle at all, guard or no guard. */
export default function AppleSignInButton({
  onSignedIn,
  onError,
}: {
  onSignedIn: (account: Account) => void;
  onError: (message: string) => void;
}) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  const handlePress = async () => {
    if (!available) {
      onError('Apple Sign In needs a real iOS device build — not available here.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : '';
      onSignedIn({ method: 'apple', identifier: credential.email ?? credential.user, name });
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') onError('Apple Sign In was cancelled or failed.');
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={999}
      style={{ width: '100%', height: 56 }}
      onPress={handlePress}
    />
  );
}
