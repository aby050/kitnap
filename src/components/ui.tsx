import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Icon from '../ui/Icon';
import { gradients, palette, radius, space, type } from '../design/tokens';

/**
 * Legacy shared components. New screens should assemble from `design/primitives`
 * instead — these are kept token-aligned so the onboarding flow that still
 * imports them reads as the same product as the rest of the app.
 */

/** The signature pill button. `aurora` is the mint primary CTA; `light` a white
 *  fill; `ghost` a quiet glass action. */
export function GradientButton({
  label,
  onPress,
  variant = 'aurora',
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'aurora' | 'light' | 'ghost';
  style?: ViewStyle;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const labelColor = variant === 'aurora' ? '#04140c' : variant === 'light' ? '#000000' : palette.text;

  return (
    <Animated.View style={[aStyle, style]}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 13, stiffness: 220 }))}
        onPress={onPress}
        style={styles.btnBase}
      >
        {variant === 'aurora' && (
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {variant === 'light' && <View style={styles.btnLightFill} />}
        {variant === 'ghost' && <View style={styles.btnGhostFill} />}
        <Text style={[styles.btnLabel, { color: labelColor }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

/** A settings-style row: optional icon, title, subtitle, right-side value / chevron. */
export function SettingRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  showChevron = true,
  last,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.settingRow, !last && styles.settingRowBorder]}>
      {icon ? <View style={styles.settingIconWrap}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {right}
      {showChevron && !right ? (
        <Icon name="chevronRight" size={18} color={palette.textQuaternary} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnLightFill: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.95)' },
  btnGhostFill: { ...StyleSheet.absoluteFill, backgroundColor: palette.glass },
  btnLabel: { fontSize: 16.5, fontWeight: '800', letterSpacing: -0.2 },
  card: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: space.base,
  },
  sectionTitle: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: space.md },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: space.base,
    gap: space.md,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: palette.hairline },
  settingIconWrap: { width: 26, alignItems: 'flex-start', justifyContent: 'center' },
  settingTitle: { color: palette.text, fontSize: 15.5, fontWeight: '600' },
  settingSubtitle: { color: palette.textSecondary, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  settingValue: { color: palette.textSecondary, fontSize: 14 },
});
