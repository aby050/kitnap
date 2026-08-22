import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, {
  FadeIn,
  FadeInDown,
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
// --- Typewriter Component ---
interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  style?: any;
}

function TypewriterText({ text, speed = 20, onComplete, style }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    
    const interval = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  // Blinking cursor
  useEffect(() => {
    let cursorInterval: any;
    if (!isTyping) {
      let count = 0;
      cursorInterval = setInterval(() => {
        setShowCursor((prev) => !prev);
        count++;
        if (count > 6) { // Blink 3 times, then hide
          clearInterval(cursorInterval);
          setShowCursor(false);
        }
      }, 500);
    } else {
      setShowCursor(true);
    }
    return () => {
      if (cursorInterval) clearInterval(cursorInterval);
    };
  }, [isTyping]);

  return (
    <Text style={style}>
      {displayedText}
      <Text style={[styles.cursor, { opacity: showCursor ? 1 : 0 }]}> ▌</Text>
    </Text>
  );
}

export default function QuestionBlock({ question, onAnswer }: Props) {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [sliderVal, setSliderVal] = useState(question.kind === 'slider' ? question.default : 0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (question.kind === 'review') {
      progress.value = withTiming(1, { duration: 1500 });
      const t = setTimeout(() => onAnswer('done', ''), 1900);
      return () => clearTimeout(t);
    }
  }, []);

  const handleTypewriterComplete = () => {
    setIsTypingComplete(true);
    if (question.kind === 'static') {
      setTimeout(() => {
        onAnswer('true', '');
      }, 1000); // 1.0s delay for reading after typing is done
    }
  };

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      entering={FadeInUp.duration(420).springify().damping(16)}
      exiting={FadeOutUp.duration(220)}
      style={styles.block}
    >
      <TypewriterText
        text={question.prompt}
        onComplete={handleTypewriterComplete}
        style={styles.prompt}
      />

      {isTypingComplete && question.kind === 'text' && (
        <Animated.View entering={FadeInDown.duration(350).springify().damping(15)} style={styles.fullWidth}>
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
            label={question.optional && text.trim().length === 0 ? 'Skip' : 'Continue'}
            disabled={!question.optional && text.trim().length === 0}
            onPress={() => {
              const t = text.trim();
              const label = question.id === 'name' ? `Hi, ${t}` : t;
              onAnswer(t, label);
            }}
          />
        </Animated.View>
      )}

      {isTypingComplete && question.kind === 'choice' && (
        <Animated.View entering={FadeInDown.duration(350).springify().damping(15)} style={styles.fullWidth}>
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
          {question.optional && (
            <Pressable style={styles.skipBtn} onPress={() => onAnswer('', '')} hitSlop={10}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {isTypingComplete && question.kind === 'multi' && (
        <Animated.View entering={FadeInDown.duration(350).springify().damping(15)} style={styles.fullWidth}>
          <View style={styles.optionsWrap}>
            {question.options.map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={multiSelected.includes(opt)}
                onPress={() => {
                  setMultiSelected((prev) =>
                    prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
                  );
                }}
              />
            ))}
          </View>
          <View style={{ height: 14 }} />
          <ContinueButton
            label={multiSelected.length === 0 ? 'Skip' : 'Continue'}
            disabled={!question.optional && multiSelected.length === 0}
            onPress={() => onAnswer(multiSelected.join(','), multiSelected.join(', '))}
          />
        </Animated.View>
      )}

      {isTypingComplete && question.kind === 'slider' && (
        <Animated.View entering={FadeInDown.duration(350).springify().damping(15)} style={styles.fullWidth}>
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
        </Animated.View>
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
  skipBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textFaint,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  cursor: {
    color: '#FFB800',
    fontWeight: 'bold',
    fontSize: 22,
    textShadowColor: 'rgba(255, 184, 0, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
