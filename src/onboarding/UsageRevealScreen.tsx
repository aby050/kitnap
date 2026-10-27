import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { checkUsageAccessPermission, queryDailyUsage } from '../data/androidUsage';
import { installedLabel, useInstalledApps } from '../data/installedApps';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { Button } from '../design/primitives';
import { fonts, palette } from '../design/tokens';
import AppGlyph from '../ui/AppGlyph';

type Row = { packageName: string; label: string; minutes: number };

const DAYS = 7;
/** Apps that are tools the user needs, not habits: never offered as "most used". */
const SKIP = /launcher|systemui|settings|dialer|phone|contacts|inputmethod|keyboard|packageinstaller|permissioncontroller|camera|gallery|clock|calculator/i;

function labelFor(pkg: string): string {
  const real = installedLabel(pkg);
  if (real) return real;
  const known = DEFAULT_BLOCKED_APPS.find((a) => a.packageName === pkg);
  if (known) return known.name;
  const tail = pkg.split('.').pop() ?? pkg;
  return tail.charAt(0).toUpperCase() + tail.slice(1);
}

function fmt(m: number) {
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

/**
 * Shown right after Usage Access is granted: the apps this person actually
 * spends the most time in, from the phone's own numbers. It is the moment the
 * permission pays off, and the list it shows is the one the picker starts from.
 */
export default function UsageRevealScreen({ onContinue }: { onContinue: () => void }) {
  useInstalledApps();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [perDay, setPerDay] = useState(0);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // Preview only: no usage stats in a browser.
        const sample: Row[] = [
          ['com.instagram.android', 'Instagram', 96],
          ['com.google.android.youtube', 'YouTube', 74],
          ['com.whatsapp', 'WhatsApp', 52],
          ['com.snapchat.android', 'Snapchat', 31],
          ['com.facebook.katana', 'Facebook', 22],
        ].map(([packageName, label, minutes]) => ({ packageName: packageName as string, label: label as string, minutes: minutes as number }));
        setRows(sample);
        setPerDay(sample.reduce((n, r) => n + r.minutes, 0) + 64);
        return;
      }
      if (Platform.OS !== 'android') return onContinue();
      try {
        if (!(await checkUsageAccessPermission())) return onContinue();
        const end = Date.now();
        const usage = await queryDailyUsage(end - DAYS * 86400000, end);
        const apps = usage
          .filter((u) => u.totalTimeInForeground > 0 && !SKIP.test(u.packageName))
          .map((u) => ({
            packageName: u.packageName,
            label: labelFor(u.packageName),
            minutes: u.totalTimeInForeground / 60000 / DAYS,
          }))
          .sort((a, b) => b.minutes - a.minutes);
        if (apps.length === 0) return onContinue();
        setPerDay(apps.reduce((n, a) => n + a.minutes, 0));
        setRows(apps.slice(0, 5));
      } catch {
        onContinue();
      }
    })();
  }, []);

  if (!rows) return <View style={{ flex: 1 }} />;
  const peak = Math.max(1, ...rows.map((r) => r.minutes));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.head}>
        <Text style={styles.eyebrow}>YOUR LAST 7 DAYS</Text>
        <Text style={styles.title}>Where your time goes</Text>
        <Text style={styles.sub}>
          About <Text style={styles.strong}>{fmt(perDay)}</Text> a day on your phone. These apps take the most.
        </Text>
      </Animated.View>

      <View style={styles.list}>
        {rows.map((r, i) => (
          <Animated.View key={r.packageName} entering={FadeInDown.delay(120 + i * 80).duration(380)} style={styles.row}>
            <AppGlyph name={r.label} packageName={r.packageName} size={46} />
            <View style={styles.mid}>
              <View style={styles.line}>
                <Text style={styles.name} numberOfLines={1}>{r.label}</Text>
                <Text style={styles.time}>{fmt(r.minutes)} / day</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(6, (r.minutes / peak) * 100)}%` }]} />
              </View>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.cta}>
        <Button label="Choose what to block" variant="primary" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  head: { marginTop: 28 },
  eyebrow: { color: palette.accent, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4 },
  title: { color: '#fff', fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, marginTop: 8 },
  sub: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  strong: { color: '#fff', fontFamily: fonts.semibold },
  list: { flex: 1, marginTop: 24, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mid: { flex: 1, gap: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { color: '#fff', fontFamily: fonts.semibold, fontSize: 16, flex: 1 },
  time: { color: 'rgba(255,255,255,0.65)', fontFamily: fonts.medium, fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: palette.accent },
  cta: { paddingBottom: 16 },
});
