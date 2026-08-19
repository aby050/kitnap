import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

const SIZE = 260;
const R = 112;
const CIRC = 2 * Math.PI * R;
const PRESETS = [15, 25, 45, 60];

export default function TimerScreen({
  initialMinutes = 25,
  autoStart = false,
  label = 'Focus Timer',
}: {
  initialMinutes?: number;
  autoStart?: boolean;
  label?: string;
}) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const total = minutes * 60;
  const pct = total > 0 ? remaining / total : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const pick = (m: number) => {
    setMinutes(m);
    setRemaining(m * 60);
    setRunning(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{label}</Text>

      <Animated.View entering={FadeIn.duration(400)} style={styles.dialWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#d9f77e" />
              <Stop offset="1" stopColor="#7dd8ff" />
            </SvgGradient>
          </Defs>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.09)" strokeWidth="12" fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="url(#ring)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.dialCenter}>
          <Text style={styles.time}>
            {mm}:{ss}
          </Text>
          <Text style={styles.timeSub}>{running ? 'Focusing…' : 'Ready'}</Text>
        </View>
      </Animated.View>

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Pressable key={p} onPress={() => pick(p)} style={[styles.preset, p === minutes && styles.presetActive]}>
            <Text style={[styles.presetText, p === minutes && styles.presetTextActive]}>{p}m</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton
          label={running ? 'Pause' : remaining === 0 ? 'Restart' : 'Start Focus'}
          onPress={() => {
            if (remaining === 0) pick(minutes);
            else setRunning((r) => !r);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 18 },
  dialWrap: { marginTop: 50, alignItems: 'center', justifyContent: 'center' },
  dialCenter: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  time: { color: colors.text, fontSize: 52, fontWeight: '800', letterSpacing: 1 },
  timeSub: { color: colors.textDim, fontSize: 15, marginTop: 6 },
  presetRow: { flexDirection: 'row', gap: 12, marginTop: 46 },
  preset: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  presetActive: { backgroundColor: 'rgba(124,245,176,0.15)', borderColor: colors.accent },
  presetText: { color: colors.text, fontSize: 15.5, fontWeight: '600' },
  presetTextActive: { color: colors.accent },
  ctaWrap: { position: 'absolute', left: 22, right: 22, bottom: 110 },
});
