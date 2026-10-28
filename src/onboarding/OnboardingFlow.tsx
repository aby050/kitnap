import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../design/tokens';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import QuestionBlock from './QuestionBlock';
import LoginScreen from '../main/LoginScreen';
import { fonts } from '../design/tokens';
import { OnboardingMarkSlot } from './OnboardingMark';
import {
  Question,
  QUESTIONS,
  RETURNING_EXISTING,
  resolvePrompt,
  stripEmphasis,
} from './questions';
import { Account } from '../data/store';

type Answer = { value: string; label: string };
type HistoryEntry = { id: string; prompt: string; label: string };

export default function OnboardingFlow({
  questions = QUESTIONS,
  progressFrom = 0,
  progressTotal,
  initialAnswers = {},
  initialHistory = [],
  onComplete,
  onAccountSignedIn,
}: {
  /** Defaults to the full question set — overridable if a caller ever needs
   *  to run a subset (answers/history carry forward via initialAnswers/
   *  initialHistory if so). */
  questions?: Question[];
  /** Where this run sits in the whole of onboarding, so the bar keeps climbing
   *  across runs instead of resetting to zero after every permission ask. An
   *  unbounded stack of questions is what makes a setup flow feel endless. */
  progressFrom?: number;
  progressTotal?: number;
  initialAnswers?: Record<string, Answer>;
  initialHistory?: HistoryEntry[];
  /** History comes back too, so a caller running the questions in several runs
   *  can carry the answered stack into the next one instead of it resetting. */
  onComplete: (answers: Record<string, Answer>, history?: HistoryEntry[]) => void;
  onAccountSignedIn?: (account: Account) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [answers, setAnswers] = useState<Record<string, Answer>>(initialAnswers);
  // "Yes, sign in" interrupts the question stack with a real sign-in step;
  // "I'm new here" just continues — nothing to authenticate yet.
  const [showLogin, setShowLogin] = useState(false);

  const rawQuestion = questions[stepIndex];
  const question = { ...rawQuestion, prompt: resolvePrompt(rawQuestion.prompt, answers) };
  const progressDenom = Math.max(1, progressTotal ?? questions.length);
  const progressTarget = (progressFrom + stepIndex) / progressDenom;
  const progressFill = useSharedValue(progressTarget);

  useEffect(() => {
    progressFill.value = withTiming(progressTarget, {
      duration: 560,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [progressTarget, progressFill]);

  const progressFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressFill.value }],
  }));

  /* Whether the question fits without scrolling.
   *
   * Centring has to be conditional, measured rather than declared: with
   * `flexGrow: 1` + `justifyContent: 'center'` a content box TALLER than the
   * viewport is laid out from a negative offset, so the top of a long
   * question renders above the scroll view and over the header. Short
   * questions — most of them — centre; only the ten-option ones flow from the
   * top and scroll. A small tolerance absorbs sub-pixel rounding, which would
   * otherwise flip the two modes back and forth on a question that fits
   * exactly.
   */
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [stepIndex]);
  const [viewportH, setViewportH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const fits = viewportH > 0 && contentH > 0 && contentH <= viewportH + 1;

  const handleAnswer = (value: string, label: string) => {
    const nextAnswers = { ...answers, [question.id]: { value, label } };
    setAnswers(nextAnswers);

    const nextHistory = label
      ? [...history, { id: question.id, prompt: stripEmphasis(question.prompt), label }]
      : history;
    if (label) setHistory(nextHistory);

    // A returning user goes straight to sign in rather than through a setup
    // they have already completed. `return` before advancing the step, or the
    // flow moves to the next question underneath the login screen and they
    // land mid-funnel on skip.
    //
    // Dormant while ASK_RETURNING is off: the question is not in QUESTIONS,
    // so this never fires. Kept whole, alongside the login screen below, so
    // turning accounts back on is one boolean rather than a rebuild.
    if (question.id === 'returning' && value === RETURNING_EXISTING) {
      setShowLogin(true);
      return;
    }

    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setTimeout(() => onComplete(nextAnswers, nextHistory), 350);
    }
  };

  if (showLogin) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <OnboardingMarkSlot />
        <KeyboardAvoider style={styles.loginArea}>
          <LoginScreen
            onSignedIn={(account) => {
              onAccountSignedIn?.(account);
              setShowLogin(false);
            }}
            onSkip={() => setShowLogin(false)}
          />
        </KeyboardAvoider>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.card, { backgroundColor: CARD_TINTS[stepIndex % CARD_TINTS.length] }]}>
      <Text style={styles.brand}>Phonewise</Text>
      <View style={styles.progressWrap}>
        <View style={styles.segments}>
          {Array.from({ length: progressDenom }).map((_, i) => (
            <View
              key={i}
              style={[styles.segment, i < progressFrom + stepIndex && styles.segmentDone, i === progressFrom + stepIndex && styles.segmentNow]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {`${Math.min(progressFrom + stepIndex + 1, progressDenom)}/${progressDenom}`}
        </Text>
      </View>

      <KeyboardAvoider>
        {/* Scrollable, not a fixed flex box. A question with a long option
            list (the "pick as many as you like" ones run to ten rows) plus a
            multi-line headline is taller than the area, and React Native does
            not clip overflow by default — the block drew itself straight over
            the mark and the progress bar above it. */}
        <ScrollView
          ref={scrollRef}
          style={styles.currentArea}
          contentContainerStyle={[
            styles.currentContent,
            // Centre by padding, not justifyContent: a block taller than the
            // viewport then just scrolls from a sane top instead of spilling
            // above the scroll view.
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
        >
          {/* Measured here, not via onContentSizeChange: once the content is
              centred, the content container stays exactly viewport-tall even
              when the answers overflow it, so "fits" never flipped back and a
              long multi-select list pushed its own question off the top. The
              block's own height is the honest number (plus the 44+48 padding). */}
          <View style={{ flexGrow: 1 }} onLayout={(e) => setContentH(e.nativeEvent.layout.height + 92)}>
            <QuestionBlock key={question.id} question={question} onAnswer={handleAnswer} />
          </View>
        </ScrollView>
      </KeyboardAvoider>
      </View>
    </SafeAreaView>
  );
}

/** One pastel per question, so each step reads as a fresh card. */
const CARD_TINTS = ['#DDF5FA', '#E4E2FA', '#D8F5DA', '#FAF5D8', '#FCE1E1', '#DCE6FB'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: { flex: 1, margin: 10, borderRadius: 34, overflow: 'hidden' },
  brand: { textAlign: 'center', color: '#1B1B1F', fontFamily: fonts.bold, fontSize: 14, fontWeight: '700', marginTop: 18 },
  progressWrap: { paddingHorizontal: 24, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  segments: { flex: 1, flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(27,27,31,0.15)' },
  segmentDone: { backgroundColor: '#1B1B1F' },
  segmentNow: { backgroundColor: '#1B1B1F' },
  stepLabel: {
    color: 'rgba(27,27,31,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    backgroundColor: palette.accent,
    transformOrigin: 'left center',
  },
  currentArea: {
    flex: 1,
    // Belt and braces: RN does not clip overflow by default, and this box
    // sits directly below a fixed-height history band it must never draw over.
    overflow: 'hidden',
  },
  currentContent: {
    flexGrow: 1,
    alignItems: 'stretch',
    // Top-aligned, NOT centred. `flexGrow: 1` with `justifyContent: 'center'`
    // centres correctly only while the content fits; once it is taller than
    // the viewport the content box is laid out from a negative offset, so the
    // top of the question rendered *above* the scroll view and straight over
    // the mark, the progress bar and the answer history. Flowing from the top
    // makes tall questions scroll normally, and short ones sit high — which is
    // where the headline belongs on this layout anyway.
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    // The question must never crowd the progress bar — they are different
    // kinds of information (where you are vs what is being asked) and with
    // only 12pt between them the headline read as a label on the bar.
    paddingTop: 0,
    paddingBottom: 0,
  },
  /* Applied only when the measurement above says the question fits. */
  currentContentCentered: { justifyContent: 'center' },
  loginArea: {
    flex: 1,
    justifyContent: 'center',
  },
});
