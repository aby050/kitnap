import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { launchApp } from 'device-permissions';
import { useInstalledApps } from '../data/installedApps';
import { palette, radius, type } from '../design/tokens';
import AppGlyph from '../ui/AppGlyph';
import { tapLight } from '../ui/haptics';

/**
 * Apps that are not blocked, one tap from the timer.
 *
 * During a session the home screen is shielded, which also cut off the maps,
 * banking and messaging apps the user never meant to hold back. Listing them
 * here lets them open directly instead of going through the launcher.
 */
export default function OpenAppsStrip({ blockedPackages }: { blockedPackages: string[] }) {
  const installed = useInstalledApps();
  const apps = useMemo(() => {
    const blocked = new Set(blockedPackages);
    return (installed ?? [])
      .filter((a) => !blocked.has(a.packageName) && a.packageName !== 'com.abhay.byre')
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [installed, blockedPackages]);

  if (Platform.OS !== 'android' || apps.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Open now</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {apps.map((a) => (
          <Pressable
            key={a.packageName}
            style={({ pressed }) => [styles.item, pressed && styles.itemOn]}
            onPress={() => {
              tapLight();
              launchApp(a.packageName);
            }}
            accessibilityLabel={`Open ${a.label}`}
          >
            <AppGlyph name={a.label} packageName={a.packageName} size={44} />
            <Text style={styles.name} numberOfLines={1}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', marginTop: 24 },
  label: { ...type.overline, color: palette.textTertiary, textAlign: 'center', marginBottom: 10 },
  row: { paddingHorizontal: 20, gap: 8 },
  item: { width: 68, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md },
  itemOn: { backgroundColor: palette.glass },
  name: { ...type.sub, color: palette.textSecondary, marginTop: 6, fontSize: 11, lineHeight: 14 },
});
