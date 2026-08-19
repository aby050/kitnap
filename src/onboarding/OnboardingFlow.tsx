import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OpalOrb from '../components/OpalOrb';
import QuestionBlock from './QuestionBlock';
import HistoryItem from './HistoryItem';
import { QUESTIONS, resolvePrompt } from './questions';
import { colors } from '../theme';

type Answer = { value: string; label: string };
type HistoryEntry = { id: string; prompt: string; label: string };

export default function OnboardingFlow({ onComplete }: { onComplete: (answers: Record<string, Answer>) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const scrollRef = useRef<ScrollView>(null);

  const rawQuestion = QUESTIONS[stepIndex];
  const question = { ...rawQuestion, prompt: resolvePrompt(rawQuestion.prompt, answers) };

  const handleAnswer = (value: string, label: string) => {
    const nextAnswers = { ...answers, [question.id]: { value, label } };
    setAnswers(nextAnswers);

    if (label) {
      setHistory((prev) => [...prev, { id: question.id, prompt: question.prompt, label }]);
    }

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} hitSlop={10}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.mascotWrap}>
          <OpalOrb size={52} awake />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${((stepIndex + 1) / QUESTIONS.length) * 100}%` }]} />
        </View>
      </View>

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
    height: 60,
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
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginLeft: 'auto',
    maxWidth: 110,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
  historyArea: {
    maxHeight: '26%',
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
    paddingBottom: 40,
  },
});
