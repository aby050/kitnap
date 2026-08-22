import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import QuestionBlock from '../onboarding/QuestionBlock';
import { CHECKIN_QUESTIONS, CheckIn, latestCheckIn } from '../data/checkin';
import { ProgressState, formatDuration, formatSignedMinutes, sumRange, weeklyWindows, dateKey } from '../data/progress';
import { recommendIntensity } from '../data/evaluation';
import { INTENSITIES, IntensityKey } from '../data/themes';
import { colors } from '../theme';

type Answer = { value: string; label: string };

const SCREENTIME_HOURS: Record<string, number> = {
  '< 1 hour': 0.5,
  '1–3 hours': 2,
  '3–4 hours': 3.5,
  '4–5 hours': 4.5,
  '5–7 hours': 6,
  '7+ hours': 8,
  "I don't know": 4,
};

// Trend is self-reported, not measured, so it only nudges the baseline
// estimate rather than replacing it outright.
const TREND_MULTIPLIER: Record<string, number> = {
  'Down a lot': 0.6,
  'Down a little': 0.85,
  'About the same': 1,
  Up: 1.2,
};

export default function CheckInScreen({
  onboardingAnswers,
  previousCheckIns,
  progress,
  currentIntensityKey,
  onComplete,
  onSkip,
  onAdoptIntensity,
}: {
  onboardingAnswers: Record<string, Answer>;
  previousCheckIns: CheckIn[];
  progress: ProgressState;
  currentIntensityKey: IntensityKey;
  onComplete: (checkIn: CheckIn) => void;
  onSkip: () => void;
  onAdoptIntensity: (key: IntensityKey) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showSummary, setShowSummary] = useState(false);

  const question = CHECKIN_QUESTIONS[stepIndex];

  const handleAnswer = (value: string, label: string) => {
    const next = { ...answers, [question.id]: { value, label } };
    setAnswers(next);
    if (stepIndex < CHECKIN_QUESTIONS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  if (showSummary) {
    const today = dateKey();
    const windows = weeklyWindows(today);
    const week = sumRange(progress, windows.thisStart, today);
    const lastWeek = sumRange(progress, windows.prevStart, windows.prevEnd);
    const savedDelta = week.savedMinutes - lastWeek.savedMinutes;
    const focusDelta = week.focusMinutes - lastWeek.focusMinutes;

    const baselineControl = Number(onboardingAnswers.controlScale?.value);
    const prior = latestCheckIn(previousCheckIns);
    const priorControl = prior ? Number(prior.answers.checkin_control?.value) : baselineControl;
    const nowControl = Number(answers.checkin_control?.value);
    const controlDelta = Number.isFinite(priorControl) && Number.isFinite(nowControl) ? nowControl - priorControl : 0;

    const baselineHours = SCREENTIME_HOURS[onboardingAnswers.screentime?.value ?? ''] ?? 4;
    const trendMultiplier = TREND_MULTIPLIER[answers.checkin_screentime?.value ?? ''] ?? 1;
    const estimatedHours = baselineHours * trendMultiplier;
    const mergedAnswers: Record<string, Answer> = {
      ...onboardingAnswers,
      controlScale: Number.isFinite(nowControl) ? { value: String(nowControl), label: String(nowControl) } : onboardingAnswers.controlScale,
    };
    const recommendation = recommendIntensity(mergedAnswers, estimatedHours);
    const recommendedName = INTENSITIES.find((i) => i.key === recommendation.key)?.name ?? recommendation.key;
    const showRecommendation = recommendation.key !== currentIntensityKey;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.Text entering={FadeInDown.duration(400)} style={styles.heading}>
            Your 7-day review
          </Animated.Text>
          <Text style={styles.sub}>Here's how this week actually went.</Text>

          <Animated.View entering={FadeIn.delay(150).duration(400)} style={styles.card}>
            <Text style={styles.rowLabel}>Time saved this week</Text>
            <Text style={styles.rowValue}>{formatDuration(week.savedMinutes)}</Text>
            <Text style={styles.rowHint}>{formatSignedMinutes(savedDelta)} vs last week</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(220).duration(400)} style={styles.card}>
            <Text style={styles.rowLabel}>Focus time this week</Text>
            <Text style={styles.rowValue}>{formatDuration(week.focusMinutes)}</Text>
            <Text style={styles.rowHint}>{formatSignedMinutes(focusDelta)} vs last week</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(290).duration(400)} style={styles.card}>
            <Text style={styles.rowLabel}>Felt control over your phone</Text>
            <Text style={styles.rowValue}>{Number.isFinite(nowControl) ? nowControl : '—'}/10</Text>
            <Text style={styles.rowHint}>
              {controlDelta > 0
                ? `Up ${controlDelta} from ${prior ? 'last check-in' : 'onboarding'}`
                : controlDelta < 0
                  ? `Down ${Math.abs(controlDelta)} — that's worth noticing`
                  : 'Holding steady'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(360).duration(400)} style={styles.card}>
            <Text style={styles.rowLabel}>Current streak</Text>
            <Text style={styles.rowValue}>{progress.currentStreak} day{progress.currentStreak === 1 ? '' : 's'}</Text>
          </Animated.View>

          {showRecommendation && (
            <Animated.View entering={FadeIn.delay(430).duration(400)} style={styles.recommendCard}>
              <Text style={styles.recommendTitle}>Based on this week, {recommendedName} might fit better</Text>
              {recommendation.reasons.map((r) => (
                <Text key={r} style={styles.recommendReason}>
                  · {r}
                </Text>
              ))}
              <Pressable
                style={styles.recommendBtn}
                onPress={() => onAdoptIntensity(recommendation.key)}
              >
                <Text style={styles.recommendBtnText}>Switch to {recommendedName}</Text>
              </Pressable>
              <Text style={styles.recommendSkip}>Or just keep going below — nothing changes unless you choose it.</Text>
            </Animated.View>
          )}
        </ScrollView>

        <View style={styles.ctaWrap}>
          <Pressable
            style={styles.cta}
            onPress={() => onComplete({ date: new Date().toISOString(), answers })}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WEEKLY CHECK-IN</Text>
        <Pressable onPress={onSkip} hitSlop={10}>
          <Text style={styles.skipLink}>Skip</Text>
        </Pressable>
      </View>
      <View style={styles.currentArea}>
        <QuestionBlock key={question.id} question={question} onAnswer={handleAnswer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, height: 50 },
  eyebrow: { color: colors.textFaint, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' },
  skipLink: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  currentArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20, gap: 14 },
  heading: { color: colors.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.textDim, fontSize: 14.5, textAlign: 'center', marginTop: 8, marginBottom: 10 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  rowLabel: { color: colors.textDim, fontSize: 13.5, fontWeight: '600' },
  rowValue: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 6 },
  rowHint: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
  recommendCard: {
    backgroundColor: 'rgba(124,245,176,0.06)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(124,245,176,0.18)',
    gap: 6,
  },
  recommendTitle: { color: colors.accent, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  recommendReason: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  recommendBtn: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 20,
    backgroundColor: 'rgba(124,245,176,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  recommendBtnText: { color: colors.accent, fontSize: 14.5, fontWeight: '700' },
  recommendSkip: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 8 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
  cta: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
  },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
