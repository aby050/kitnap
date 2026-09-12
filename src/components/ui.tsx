import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Icon from '../ui/Icon';
import { Button } from '../design/primitives';
import { palette, radius, space } from '../design/tokens';

/**
 * Legacy shared components. New screens should assemble from `design/primitives`
 * instead — these are kept token-aligned so the onboarding flow that still
 * imports them reads as the same product as the rest of the app.
 */

/** The signature pill CTA. Delegates to `Button` so height, width, radius and
 *  type stay in one place. `light` is the default primary (white); `aurora` is
 *  azure, reserved for starting a session; `ghost` is the outlined workhorse. */
export function GradientButton({
  label,
  onPress,
  variant = 'light',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'aurora' | 'light' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const mapped = variant === 'aurora' ? 'accent' : variant === 'ghost' ? 'outline' : 'primary';
  return <Button label={label} onPress={onPress} variant={mapped} disabled={disabled} style={style} />;
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
