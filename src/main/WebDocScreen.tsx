import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { palette, space } from '../design/tokens';
import Icon from '../ui/Icon';

/**
 * Terms and Privacy, rendered inside the app.
 *
 * These used to be `Linking.openURL` — a tap that threw the user out into
 * Safari mid-purchase, which is a bad moment to leave an app and a worse one
 * to come back to. They stay hosted rather than bundled so the wording can be
 * corrected without shipping a build, which is the whole point of legal copy
 * living on a server.
 *
 * The failure case is the one that matters: a webview with no connection is a
 * white rectangle, and legal text a user cannot reach is a review problem as
 * well as a trust one. So a failed load says so and offers the browser.
 */
export default function WebDocScreen({
  title,
  url,
  onBack,
}: {
  title: string;
  url: string;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        {failed ? (
          <View style={styles.fallback}>
            <Icon name="globe" size={28} color={palette.textTertiary} strokeWidth={1.6} />
            <Text style={styles.fallbackTitle}>Couldn’t load {title}</Text>
            <Text style={styles.fallbackBody}>
              You’ll need a connection to read this. It’s also on the web if you’d rather open it
              there.
            </Text>
            <Pressable onPress={() => Linking.openURL(url)} hitSlop={10}>
              <Text style={styles.fallbackLink}>Open in browser</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <WebView
              source={{ uri: url }}
              style={styles.web}
              // The page is light; without this the white flashes over the
              // app's black while it loads.
              containerStyle={styles.webContainer}
              // Same reason as the styles above: without this the native view
              // itself is white underneath whatever the page draws.
              backgroundColor={palette.surface}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              onHttpError={({ nativeEvent }) => {
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setFailed(true);
                }
              }}
            />
            {loading && (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator color={palette.accent} />
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.base,
    paddingVertical: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: palette.text, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  // The hosted pages are dark. A white webview background flashes on every
  // load before the page paints, which looks like a bug on a black app.
  body: { flex: 1, backgroundColor: palette.surface },
  web: { flex: 1, backgroundColor: palette.surface },
  webContainer: { backgroundColor: palette.surface },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 36,
    backgroundColor: palette.surface,
  },
  fallbackTitle: { color: palette.text, fontSize: 17, fontWeight: '700', marginTop: 4 },
  fallbackBody: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  fallbackLink: {
    color: palette.accent,
    fontSize: 14.5,
    fontWeight: '700',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
});
