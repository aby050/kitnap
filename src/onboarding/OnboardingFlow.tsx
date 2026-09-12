import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider, keyboardScrollProps } from '../components/KeyboardAware';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import QuestionBlock from './QuestionBlock';
import HistoryItem from './HistoryItem';
import LoginScreen from '../main/LoginScreen';
import { OnboardingMarkSlot } from './OnboardingMark';
import { Question, QUESTIONS, resolvePrompt, stripEmphasis } from './questions';
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
  const scrollRef = useRef<ScrollView>(null);

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

  const handleAnswer = (value: string, label: string) => {
    const nextAnswers = { ...answers, [question.id]: { value, label } };
    setAnswers(nextAnswers);

    const nextHistory = label
      ? [...history, { id: question.id, prompt: stripEmphasis(question.prompt), label }]
      : history;
    if (label) setHistory(nextHistory);

    // Login/signup disabled for now — "Yes, sign in" just continues like any
    // other answer instead of opening LoginScreen.
    // if (question.id === 'returning' && value === 'Yes, sign in') {
    //   setShowLogin(true);
    // }

    requestAnimationFrame(() => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    });

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
      <OnboardingMarkSlot />

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
      </View>

      <KeyboardAvoider>
        <View style={styles.historyWrap}>
          <ScrollView
            ref={scrollRef}
            style={styles.historyArea}
            contentContainerStyle={styles.historyContent}
            showsVerticalScrollIndicator={false}
            {...keyboardScrollProps}
          >
            {history.map((h) => (
              <HistoryItem key={h.id} prompt={h.prompt} label={h.label} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.currentArea}>
          <QuestionBlock key={question.id} question={question} onAnswer={handleAnswer} />
        </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  progressWrap: { paddingHorizontal: 28, marginTop: 4 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    width: '100%',
    backgroundColor: 'rgba(76,158,255,0.85)',
    transformOrigin: 'left center',
  },
  // Fixed pixel height + explicit clipping — a percentage maxHeight here
  // silently fails to clip on React Native Web (it needs every ancestor up
  // the tree to have a definite, non-auto height to resolve against), which
  // let old answered questions bleed straight through into the current one.
  //
  // The height is definite rather than a maxHeight for a second reason: the
  // band has to reserve its full size even when empty, or a short history
  // shrink-wraps the ScrollView and the `flex-end` below has no spare room to
  // push against. Reserving it also stops the current question sliding down
  // the screen as the first few answers land.
  historyWrap: {
    marginTop: 8,
    height: 130,
    overflow: 'hidden',
  },
  historyArea: {
    height: 130,
  },
  // Bottom-anchored: the newest answer sits at the foot of the band, right
  // above the current question, and older ones stack upward out of the top.
  historyContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 4,
  },
  currentArea: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 40,
  },
  loginArea: {
    flex: 1,
    justifyContent: 'center',
  },
});
