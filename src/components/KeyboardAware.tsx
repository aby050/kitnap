import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

/**
 * Keeps a focused field above the keyboard.
 *
 * Android already handles this — the manifest sets `adjustResize`, so the
 * window shrinks and layout reflows on its own. iOS does nothing by default:
 * the keyboard slides over the screen and whatever you're typing in ends up
 * underneath it. Hence `behavior: 'padding'` on iOS and nothing on Android,
 * which would otherwise double up and squash the layout.
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
  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
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
