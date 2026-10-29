import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { checkUsageAccessPermission, queryDailyUsage } from '../data/androidUsage';
import { installedLabel, useInstalledApps } from '../data/installedApps';
import { DEFAULT_BLOCKED_APPS } from '../data/blockedApps';
import { INK, INK_DIM, InkButton, PastelCard, TINTS } from './PastelCard';
import { fonts } from '../design/tokens';
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
  const yearDays = (perDay * 365) / 60 / 24;

  return (
    <PastelCard tint={TINTS.cream}>
      <Animated.View entering={FadeIn.duration(500)} style={styles.head}>
        <Text style={styles.eyebrow}>YOUR LAST 7 DAYS</Text>
        <View style={styles.heroRow}>
          <CountUp to={Math.round(yearDays)} style={styles.heroNum} />
          <Text style={styles.heroUnit}>days</Text>
        </View>
        <Text style={styles.sub}>
          a year go to your phone. That's <Text style={styles.strong}>{fmt(perDay)}</Text> every single day.
        </Text>
      </Animated.View>

      <View style={styles.body}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.receiptWrap}>
            <View style={styles.receipt}>
              <Text style={styles.rHead}>KITNAP · TIME RECEIPT</Text>
              <Text style={styles.rDate}>Paid with your attention</Text>
              <View style={styles.dash} />
              {rows.map((r, i) => (
                <Animated.View key={r.packageName} entering={FadeIn.delay(500 + i * 140).duration(300)} style={styles.row}>
                  <AppGlyph name={r.label} packageName={r.packageName} size={30} />
                  <View style={styles.mid}>
                    <Text style={styles.name} numberOfLines={1}>{r.label}</Text>
                    <Text style={styles.time}>{fmt(r.minutes)} a day</Text>
                  </View>
                  <Text style={styles.cost}>{daysLabel((r.minutes * 365) / 60 / 24)}</Text>
                </Animated.View>
              ))}
              {/* The rest of the day's phone time, so the receipt adds up to its total. */}
              {perDay - rows.reduce((n, r) => n + r.minutes, 0) >= 1 && (
                <View style={styles.row}>
                  <View style={styles.otherDot}><Text style={styles.otherDots}>···</Text></View>
                  <View style={styles.mid}>
                    <Text style={styles.name}>Everything else</Text>
                    <Text style={styles.time}>{fmt(perDay - rows.reduce((n, r) => n + r.minutes, 0))} a day</Text>
                  </View>
                  <Text style={styles.cost}>{daysLabel(((perDay - rows.reduce((n, r) => n + r.minutes, 0)) * 365) / 60 / 24)}</Text>
                </View>
              )}
              <View style={styles.dash} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL / YEAR</Text>
                <Text style={styles.totalVal}>{daysLabel(yearDays)}</Text>
              </View>
              <Animated.View entering={FadeIn.delay(500 + rows.length * 140 + 200).duration(250)} style={styles.stamp}>
                <Text style={styles.stampText}>TOO{'\n'}MUCH</Text>
              </Animated.View>
            </View>
            <View style={styles.zigzag}>
              {Array.from({ length: 22 }).map((_, i) => <View key={i} style={styles.tooth} />)}
            </View>
          </Animated.View>
        </ScrollView>
        <InkButton label="Take some days back" onPress={onContinue} />
      </View>
    </PastelCard>
  );
}

function daysLabel(d: number) {
  return d >= 1 ? `${Math.round(d)} days` : `${Math.round(d * 24)} hrs`;
}

/** The headline number climbs to its value so the size of it lands. */
function CountUp({ to, style }: { to: number; style: any }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to]);
  return <Text style={style}>{n}</Text>;
}

const PAPER = '#FFFDF7';
const styles = StyleSheet.create({
  head: { alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 14 },
  eyebrow: { color: INK_DIM, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.4, backgroundColor: 'rgba(27,27,31,0.07)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  heroNum: { color: '#E8821A', fontFamily: fonts.bold, fontSize: 76, lineHeight: 84, letterSpacing: -3 },
  heroUnit: { color: INK, fontFamily: fonts.bold, fontSize: 30, letterSpacing: -0.6 },
  sub: { color: INK_DIM, fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, marginTop: 2, textAlign: 'left' },
  strong: { color: INK, fontFamily: fonts.semibold },
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  receiptWrap: { transform: [{ rotate: '-1.2deg' }], marginTop: 4, marginHorizontal: 4 },
  receipt: {
    backgroundColor: PAPER, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10,
    borderTopLeftRadius: 6, borderTopRightRadius: 6,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  rHead: { color: INK, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 2, textAlign: 'center' },
  rDate: { color: INK_DIM, fontSize: 12, textAlign: 'center', marginTop: 3 },
  dash: { borderBottomWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(27,27,31,0.25)', marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  mid: { flex: 1 },
  otherDot: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(27,27,31,0.08)', alignItems: 'center', justifyContent: 'center' },
  otherDots: { color: INK_DIM, fontFamily: fonts.bold, fontSize: 16, marginTop: -4 },
  name: { color: INK, fontFamily: fonts.semibold, fontSize: 15 },
  time: { color: INK_DIM, fontSize: 12, marginTop: 1 },
  cost: { color: INK, fontFamily: fonts.bold, fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { color: INK, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.5 },
  totalVal: { color: '#E8821A', fontFamily: fonts.bold, fontSize: 22 },
  stamp: {
    position: 'absolute', right: 14, top: 44, transform: [{ rotate: '14deg' }],
    borderWidth: 2.5, borderColor: 'rgba(214,69,65,0.7)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  stampText: { color: 'rgba(214,69,65,0.75)', fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.5, textAlign: 'center', lineHeight: 15 },
  zigzag: { flexDirection: 'row', overflow: 'hidden', height: 8 },
  tooth: {
    flex: 1, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: PAPER,
  },
});
