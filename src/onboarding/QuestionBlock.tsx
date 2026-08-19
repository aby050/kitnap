import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Question } from './questions';
import { colors } from '../theme';

type Props = {
  question: Question;
  onAnswer: (value: string, label: string) => void;
};

function OptionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.95, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
        onPress={onPress}
        style={[styles.optionBtn, selected && styles.optionBtnSelected]}
      >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ContinueButton({ label = 'Continue', disabled, onPress }: { label?: string; disabled?: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { width: '100%', maxWidth: 300 }]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => !disabled && (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
        onPress={onPress}
        style={[styles.continueBtn, disabled && styles.continueBtnDisabled]}
      >
        <Text style={styles.continueText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Renders only the CURRENT question, centered. Once answered the parent
 * swaps it out of the tree entirely (moved into history), so this never
 * needs to render an "answered" state itself. */
export default function QuestionBlock({ question, onAnswer }: Props) {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [sliderVal, setSliderVal] = useState(question.kind === 'slider' ? question.default : 0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (question.kind === 'static') {
      const t = setTimeout(() => onAnswer('true', ''), 850);
      return () => clearTimeout(t);
    }
    if (question.kind === 'review') {
      progress.value = withTiming(1, { duration: 1500 });
      const t = setTimeout(() => onAnswer('done', ''), 1900);
      return () => clearTimeout(t);
    }
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      entering={FadeInUp.duration(420).springify().damping(16)}
      exiting={FadeOutUp.duration(220)}
      style={styles.block}
    >
      <Text style={styles.prompt}>{question.prompt}</Text>

      {question.kind === 'text' && (
        <View style={styles.fullWidth}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={question.placeholder}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoFocus
          />
          <View style={{ height: 14 }} />
          <ContinueButton
            disabled={text.trim().length === 0}
            onPress={() => onAnswer(text.trim(), `Hi, ${text.trim()}`)}
          />
        </View>
      )}

      {question.kind === 'choice' && (
        <View style={styles.optionsWrap}>
          {question.options.map((opt) => (
            <OptionButton
              key={opt}
              label={opt}
              selected={selected === opt}
              onPress={() => {
                setSelected(opt);
                setTimeout(() => onAnswer(opt, opt), 260);
              }}
            />
          ))}
        </View>
      )}

      {question.kind === 'slider' && (
        <View style={styles.fullWidth}>
          <Text style={styles.ageValue}>{Math.round(sliderVal)}</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={question.min}
            maximumValue={question.max}
            step={1}
            value={sliderVal}
            onValueChange={setSliderVal}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor="rgba(255,255,255,0.15)"
            thumbTintColor={colors.accent}
          />
          <View style={{ height: 6 }} />
          <ContinueButton onPress={() => onAnswer(String(Math.round(sliderVal)), String(Math.round(sliderVal)))} />
        </View>
      )}

      {question.kind === 'review' && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, barStyle]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  prompt: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 28,
  },
  fullWidth: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 16,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 320,
  },
  optionBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBg,
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(124,245,176,0.15)',
    borderColor: colors.accent,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.accent,
  },
  continueBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.35,
  },
  continueText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  ageValue: {
    color: colors.accent,
    fontSize: 34,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    maxWidth: 280,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
