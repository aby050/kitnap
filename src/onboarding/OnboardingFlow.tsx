import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import OpalOrb from '../components/OpalOrb';
import QuestionBlock from './QuestionBlock';
import HistoryItem from './HistoryItem';
import LoginScreen from '../main/LoginScreen';
import { Question, QUESTIONS, resolvePrompt } from './questions';
import { Account } from '../data/store';
import { colors } from '../theme';

type Answer = { value: string; label: string };
type HistoryEntry = { id: string; prompt: string; label: string };

export default function OnboardingFlow({
  questions = QUESTIONS,
  initialAnswers = {},
  initialHistory = [],
  onComplete,
  onAccountSignedIn,
}: {
  /** Defaults to the full question set — overridable if a caller ever needs
   *  to run a subset (answers/history carry forward via initialAnswers/
   *  initialHistory if so). */
  questions?: Question[];
  initialAnswers?: Record<string, Answer>;
  initialHistory?: HistoryEntry[];
  onComplete: (answers: Record<string, Answer>) => void;
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

  const handleAnswer = (value: string, label: string) => {
    const nextAnswers = { ...answers, [question.id]: { value, label } };
    setAnswers(nextAnswers);

    if (label) {
      setHistory((prev) => [...prev, { id: question.id, prompt: question.prompt, label }]);
    }

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
      setTimeout(() => onComplete(nextAnswers), 350);
    }
  };

  if (showLogin) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.mascotWrap}>
            <OpalOrb size={52} awake />
          </View>
        </View>
        <View style={styles.loginArea}>
          <LoginScreen
            onSignedIn={(account) => {
              onAccountSignedIn?.(account);
              setShowLogin(false);
            }}
            onSkip={() => setShowLogin(false)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Slides up + fades in to continue the motion of the orb from the
          last EducationScreen slide, which lifts off before this mounts. */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.mascotWrap}>
        <OpalOrb size={40} awake />
      </Animated.View>

      <View style={styles.historyWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.historyArea}
          contentContainerStyle={styles.historyContent}
          showsVerticalScrollIndicator={false}
        >
          {history.map((h) => (
            <HistoryItem key={h.id} prompt={h.prompt} label={h.label} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.currentArea}>
        <QuestionBlock key={question.id} question={question} onAnswer={handleAnswer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mascotWrap: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  // Fixed pixel height + explicit clipping — a percentage maxHeight here
  // silently fails to clip on React Native Web (it needs every ancestor up
  // the tree to have a definite, non-auto height to resolve against), which
  // let old answered questions bleed straight through into the current one.
  historyWrap: {
    maxHeight: 130,
    overflow: 'hidden',
  },
  historyArea: {
    maxHeight: 130,
  },
  historyContent: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 4,
  },
  currentArea: {
    flex: 1,
    alignItems: 'center',
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
