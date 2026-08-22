import React from 'react';
import { Platform, Text, TextStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Renders a real SF Symbol on iOS (Apple's own icon set, matching Human
 *  Interface Guidelines) and falls back to an emoji glyph everywhere else
 *  (Android/web), since SF Symbols is an iOS-only asset. */
export default function AppIcon({
  sf,
  fallback,
  size = 22,
  color = '#ffffff',
  style,
}: {
  /** SF Symbol name — browse the full set in Apple's free SF Symbols app. */
  sf: SFSymbol;
  /** Emoji shown on Android/web. */
  fallback: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={sf} tintColor={color} style={[{ width: size, height: size }, style]} />;
  }
  return <Text style={[{ fontSize: size, color }, style]}>{fallback}</Text>;
}
