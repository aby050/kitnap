import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OpalOrb from '../components/OpalOrb';
import QuestionBlock from './QuestionBlock';
import HistoryItem from './HistoryItem';
import LoginScreen from '../main/LoginScreen';
import { QUESTIONS, resolvePrompt } from './questions';
import { Account } from '../data/store';
import { colors } from '../theme';

type Answer = { value: string; label: string };
type HistoryEntry = { id: string; prompt: string; label: string };

export default function OnboardingFlow({
  onComplete,
  onAccountSignedIn,
}: {
  onComplete: (answers: Record<string, Answer>) => void;
  onAccountSignedIn?: (account: Account) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  // "Yes, sign in" interrupts the question stack with a real sign-in step;
  // "I'm new here" just continues — nothing to authenticate yet.
  const [showLogin, setShowLogin] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const rawQuestion = QUESTIONS[stepIndex];
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

    if (stepIndex < QUESTIONS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setTimeout(() => onComplete(nextAnswers), 350);
    }
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    setHistory((prev) => prev.filter((h) => h.id !== QUESTIONS[stepIndex - 1].id));
    setStepIndex(stepIndex - 1);
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
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} hitSlop={10}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      </View>
      <View style={styles.mascotWrap}>
        <OpalOrb size={40} awake />
      </View>

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
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 22,
    marginTop: -2,
  },
  mascotWrap: {
    alignItems: 'center',
    marginTop: 4,
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
