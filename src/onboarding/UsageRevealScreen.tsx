import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { checkUsageAccessPermission, queryDailyUsage } from '../data/androidUsage';
import { installedLabel, useInstalledApps } from '../data/installedApps';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { CardPanel, INK, INK_DIM, InkButton, PastelCard, PILL, TINTS } from './PastelCard';
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
    <PastelCard tint={TINTS.pink}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.head}>
        <Text style={styles.eyebrow}>YOUR LAST 7 DAYS</Text>
        <Text style={styles.title}>Where your time goes</Text>
        <Text style={styles.sub}>
          About <Text style={styles.strong}>{fmt(perDay)}</Text> a day on your phone. These apps take the most.
        </Text>
      </Animated.View>

      <CardPanel style={styles.panel}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {rows.map((r, i) => (
          <Animated.View key={r.packageName} entering={FadeInDown.delay(120 + i * 80).duration(380)} style={styles.row}>
            <AppGlyph name={r.label} packageName={r.packageName} size={40} />
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
      </ScrollView>

      <InkButton label="Choose what to block" onPress={onContinue} />
      </CardPanel>
    </PastelCard>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  eyebrow: { color: INK_DIM, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4, backgroundColor: 'rgba(27,27,31,0.07)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  title: { color: INK, fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, marginTop: 14, textAlign: 'left' },
  sub: { color: INK_DIM, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 8, textAlign: 'left' },
  strong: { color: INK, fontFamily: fonts.semibold },
  panel: { flex: 1 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: PILL, borderWidth: 1.5, borderColor: INK },
  mid: { flex: 1, gap: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { color: INK, fontFamily: fonts.semibold, fontSize: 16, flex: 1 },
  time: { color: INK_DIM, fontFamily: fonts.medium, fontSize: 13 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(27,27,31,0.1)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#E8821A' },
});
