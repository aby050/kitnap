import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

type Props = {
  name: string;
  screentimeHours: number;
  onFinish: () => void;
};

const ANALYZING_LINES = ['Analyzing your answers…', 'Understanding your habits…', 'Creating your setup…'];

const DISTRACTION_APPS = [
  { name: 'Facebook', usage: '1h 6m today', color: '#1877F2', letter: 'f' },
  { name: 'Instagram', usage: '18m today', color: '#E1306C', letter: '◎' },
  { name: 'Reddit', usage: '2m today', color: '#FF4500', letter: 'r' },
  { name: 'YouTube', usage: 'Not used today', color: '#FF0000', letter: '▶' },
  { name: 'X', usage: 'Not used today', color: '#000000', letter: '𝕏' },
];

function ContinueButton({ label = 'Continue', onPress }: { label?: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { width: '100%', maxWidth: 300 }]}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
        onPress={onPress}
        style={styles.continueBtn}
      >
        <Text style={styles.continueText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function PostOnboardingFlow({ name, screentimeHours, onFinish }: Props) {
  const [step, setStep] = useState(0);
  const [analyzingLine, setAnalyzingLine] = useState(0);
  const [displayOverApps, setDisplayOverApps] = useState(true);
  const [screenTimeAccess, setScreenTimeAccess] = useState(false);
  const [removedApps, setRemovedApps] = useState<string[]>([]);
  const [notifSub, setNotifSub] = useState(0);

  const badDays = Math.round((screentimeHours * 365) / 24);
  const projectedYears = Math.max(1, Math.round((50 * screentimeHours) / 16));
  const reclaimedYears = Math.max(1, Math.round(projectedYears * 0.3));

  useEffect(() => {
    if (step !== 0) return;
    if (analyzingLine < ANALYZING_LINES.length - 1) {
      const t = setTimeout(() => setAnalyzingLine((v) => v + 1), 750);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(1), 900);
    return () => clearTimeout(t);
  }, [step, analyzingLine]);

  const next = () => setStep((s) => s + 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        {step === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerBlock}>
            <Text style={styles.heading}>{ANALYZING_LINES[analyzingLine]}</Text>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.centerBlock}>
            <Text style={styles.heading}>
              I can help with that{name ? `, ${name}` : ''}.{'\n\n'}
              <Text style={styles.headingBold}>But to change your habits, I'm going to need your permission.</Text>
            </Text>

            <View style={{ height: 30 }} />

            <PermissionRow
              title="Display over other apps"
              desc="So the app can gently help you pause before opening distracting apps."
              value={displayOverApps}
              onChange={setDisplayOverApps}
            />
            <PermissionRow
              title="Screen time"
              desc="Lets the app show you your daily screen time and progress."
              value={screenTimeAccess}
              onChange={setScreenTimeAccess}
            />

            <View style={{ height: 24 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.centerBlock}>
            <Text style={styles.smallHeading}>The bad news is that you'll spend{' '}
              <Text style={styles.accentInline}>{badDays} days</Text> on your phone this year.
            </Text>
            <Text style={styles.smallHeading}>Meaning that you're on track to spend</Text>
            <BigNumber value={`${projectedYears} years`} />
            <Text style={styles.smallHeading}>of your life looking down at your phone.</Text>
            <View style={{ height: 20 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.centerBlock}>
            <Text style={styles.smallHeading}>The good news is that this app can help you get back</Text>
            <BigNumber value={`${reclaimedYears} years`} />
            <Text style={styles.smallHeading}>of your life.</Text>
            <View style={{ height: 20 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 4 && (
          <Animated.View entering={FadeInUp.duration(400)} exiting={FadeOutUp.duration(200)} style={styles.appSelectBlock}>
            <Text style={[styles.heading, { marginBottom: 20 }]}>These apps seem to be your biggest distractions</Text>
            <View style={styles.appList}>
              {DISTRACTION_APPS.filter((a) => !removedApps.includes(a.name)).map((app, i) => (
                <View key={app.name} style={[styles.appRow, i > 0 && styles.appRowBorder]}>
                  <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                    <Text style={styles.appIconLetter}>{app.letter}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <Text style={styles.appUsage}>{app.usage}</Text>
                  </View>
                  <Pressable
                    onPress={() => setRemovedApps((prev) => [...prev, app.name])}
                    style={styles.removeBtn}
                    hitSlop={8}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={{ height: 16 }} />
            <Text style={styles.appsSelectedLabel}>
              {DISTRACTION_APPS.length - removedApps.length} apps selected
            </Text>
            <View style={{ height: 16 }} />
            <ContinueButton onPress={next} />
          </Animated.View>
        )}

        {step === 5 && (
          <Pressable style={styles.centerBlock} onPress={() => (notifSub < 1 ? setNotifSub(1) : next())}>
            <Animated.View key={notifSub} entering={FadeIn.duration(350)}>
              <Text style={styles.eyebrow}>How it works</Text>
              {notifSub === 0 ? (
                <Text style={styles.heading}>Without noticing, you open a distracting app.</Text>
              ) : (
                <Text style={styles.heading}>The app steps in — gently.</Text>
              )}
              <View style={{ height: 30 }} />
              <View style={styles.phoneMock}>
                {notifSub === 1 && (
                  <View style={styles.notifCard}>
                    <Text style={styles.notifTitle}>Time to go outside · now</Text>
                    <Text style={styles.notifBody}>You've already spent a while on distracting apps today.</Text>
                  </View>
                )}
              </View>
            </Animated.View>
            <Text style={styles.tapHint}>TAP TO CONTINUE</Text>
          </Pressable>
        )}

        {step === 6 && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.centerBlock}>
            <Text style={styles.heading}>
              {name ? `${name},\n` : ''}
              this app will get you back <Text style={styles.accentInline}>{reclaimedYears} years</Text> of your life
            </Text>
            <View style={{ height: 26 }} />
            <SummaryRow icon="🛡" title="30% less screen time" desc="Reduce your screen time to help you focus." />
            <SummaryRow icon="🌙" title="30% deeper sleep" desc="Fall asleep faster with less screen time before bed." />
            <SummaryRow icon="📅" title={`${reclaimedYears * 10} days back this year`} desc="Develop your focus plan to save real time." />
            <View style={{ height: 20 }} />
            <ContinueButton label="🤛 Let's Do It" onPress={onFinish} />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

function BigNumber({ value }: { value: string }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [value]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.Text style={[styles.bigNumber, style]} key={value}>
      {value}
    </Animated.Text>
  );
}

function PermissionRow({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.permRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function SummaryRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  centerBlock: { alignItems: 'center', width: '100%' },
  appSelectBlock: { alignItems: 'center', width: '100%' },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 30, maxWidth: 320 },
  headingBold: { fontWeight: '700', color: colors.text },
  smallHeading: { color: colors.textDim, fontSize: 17, fontWeight: '600', textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 6 },
  accentInline: { color: colors.accent, fontWeight: '700' },
  bigNumber: {
    color: colors.accent,
    fontSize: 46,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 14,
    textShadowColor: 'rgba(124,245,176,0.5)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  eyebrow: { color: colors.textDim, fontSize: 12, letterSpacing: 2, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase' },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
  },
  permTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  permDesc: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  appList: { width: '100%', maxWidth: 340, backgroundColor: colors.cardBg, borderRadius: 22, overflow: 'hidden' },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  appRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  appIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  appIconLetter: { color: '#fff', fontWeight: '800', fontSize: 15 },
  appName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  appUsage: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  removeBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  removeIcon: { color: colors.textDim, fontSize: 12 },
  appsSelectedLabel: { color: colors.textDim, fontSize: 13 },
  phoneMock: {
    width: 220,
    height: 260,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    padding: 14,
  },
  notifCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
  },
  notifTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  notifBody: { color: colors.textDim, fontSize: 11.5, lineHeight: 16 },
  tapHint: { color: colors.textDim, fontSize: 12, letterSpacing: 2, marginTop: 40 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', maxWidth: 320, marginBottom: 16 },
  summaryIcon: { fontSize: 20 },
  summaryTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  summaryDesc: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  continueBtn: { width: '100%', paddingVertical: 16, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center' },
  continueText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
