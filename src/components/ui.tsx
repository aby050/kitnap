import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

/** The signature pill button: dark glass body with a soft aurora glow bleeding up from the bottom. */
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

  return (
    <Animated.View style={[aStyle, style]}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 13, stiffness: 220 }))}
        onPress={onPress}
        style={styles.btnBase}
      >
        {variant === 'aurora' && (
          <>
            <View style={styles.btnDarkFill} />
            <LinearGradient
              colors={['rgba(200,255,160,0.0)', 'rgba(180,255,170,0.55)', 'rgba(140,220,255,0.55)']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1.4 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        {variant === 'light' && <View style={styles.btnLightFill} />}
        {variant === 'ghost' && <View style={styles.btnGhostFill} />}
        <Text style={[styles.btnLabel, variant === 'light' && { color: '#000' }]}>{label}</Text>
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
  icon?: string;
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
      {icon ? <Text style={styles.settingIcon}>{icon}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {right}
      {showChevron && !right ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnDarkFill: { ...StyleSheet.absoluteFill, backgroundColor: '#1a1a1a' },
  btnLightFill: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.95)' },
  btnGhostFill: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.09)' },
  btnLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 16,
  },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  settingIcon: { fontSize: 17, width: 26 },
  settingTitle: { color: colors.text, fontSize: 15.5, fontWeight: '600' },
  settingSubtitle: { color: colors.textDim, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  settingValue: { color: colors.textDim, fontSize: 14 },
  chevron: { color: colors.textFaint, fontSize: 20 },
});
