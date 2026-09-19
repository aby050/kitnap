import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Keeps a focused field above the keyboard.
 *
 * This used to do nothing on Android, on the grounds that `adjustResize` in
 * the manifest already shrank the window. That stopped being true: the app is
 * edge-to-edge (`edgeToEdgeEnabled=true`), and an edge-to-edge window is NOT
 * resized when the keyboard opens — the IME simply draws over the bottom of
 * the layout. The manifest flag is still there and still ignored, so text
 * inputs low on a screen (the onboarding name and illness questions, most
 * visibly) ended up underneath the keyboard with no way to scroll to them.
 *
 * So `padding` on both platforms now. It does not double up, precisely
 * because nothing else is adjusting anything any more.
 *
 * `KeyboardAware` is for screens with no scroll view of their own; screens
 * that already scroll should wrap their existing ScrollView in
 * `KeyboardAvoider` and spread `keyboardScrollProps` onto it instead.
 */

/** Taps reach buttons on the first tap while the keyboard is open, and
 *  dragging the list dismisses it — the two defaults RN gets wrong. */
export const keyboardScrollProps = {
  keyboardShouldPersistTaps: 'handled',
  keyboardDismissMode: Platform.OS === 'ios' ? ('interactive' as const) : ('on-drag' as const),
} as const;

export function KeyboardAvoider({
  children,
  style,
  offset = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra points to lift by, for a header sitting above the avoided area. */
  offset?: number;
}) {
  const insets = useSafeAreaInsets();
  // The keyboard height Android reports is measured from the true bottom of
  // the screen, which under edge-to-edge is behind the navigation bar. A
  // SafeAreaView has already reserved that strip, so padding by the full
  // reported height lifts the content one nav-bar too far.
  const androidInset = Platform.OS === 'android' ? insets.bottom : 0;
  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior="padding"
      keyboardVerticalOffset={offset - androidInset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export default function KeyboardAware({
  children,
  style,
  contentContainerStyle,
  offset = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  offset?: number;
}) {
  return (
    <KeyboardAvoider style={style} offset={offset}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.grow, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...keyboardScrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
});
