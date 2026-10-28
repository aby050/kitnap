import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../design/tokens';

/** Ink and pastels for the onboarding card look, shared by every setup screen
 *  so the questions and the steps around them read as one flow. */
export const INK = '#2E3136';
export const PAPER = '#F1EFEB';
export const HIGHLIGHT = '#E8821A';
export const INK_DIM = '#5E636B';
export const INK_FAINT = 'rgba(27,27,31,0.08)';
export const PILL = '#FFFFFF';
export const TINTS = {
  cyan: '#DDF5FA',
  lavender: '#E4E2FA',
  mint: '#D8F5DA',
  cream: '#FAF5D8',
  pink: '#FCE1E1',
  blue: '#DCE6FB',
} as const;

/** A full-screen warm paper page on the dark backdrop, with the brand
 *  name on top. Children lay out inside it; use `CardPanel` for the white
 *  lower section that holds the actions. */
export function PastelCard({ tint, children, header }: { tint: string; children: React.ReactNode; header?: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.card}>
        <Text style={styles.brand}>kitnap</Text>
        {header}
        {children}
      </View>
    </SafeAreaView>
  );
}

export function CardPanel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function InkButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      style={[styles.inkBtn, disabled && { opacity: 0.35 }]}
    >
      <Text style={styles.inkBtnText}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text style={styles.link}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAPER },
  card: { flex: 1, backgroundColor: PAPER },
  brand: { textAlign: 'center', color: INK, fontFamily: fonts.medium, fontSize: 18, fontWeight: '500', marginTop: 12, letterSpacing: -0.2 },
  panel: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18, gap: 14 },
  inkBtn: { height: 56, borderRadius: 28, backgroundColor: '#3A3D42', alignItems: 'center', justifyContent: 'center' },
  inkBtnText: { color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 17, fontWeight: '500' },
  link: { color: INK, fontSize: 15, fontWeight: '500', textAlign: 'center' },
});
