import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Question } from './questions';
import { GradientButton } from '../components/ui';
import { Field } from '../design/primitives';
import { palette, space } from '../design/tokens';

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

/** Renders only the CURRENT question, centered. Once answered the parent
 * swaps it out of the tree entirely (moved into history), so this never
 * needs to render an "answered" state itself. */
// --- Typewriter ---
interface TypewriterTextProps {
  text: string;
  /** Base milliseconds per character. Real delay varies around this. */
  speed?: number;
  onComplete?: () => void;
  style?: any;
}

/**
 * Types a prompt out character by character.
 *
 * A fixed interval reads as a machine, so the delay is shaped instead: a beat
 * after sentence-enders, a shorter one after commas, a touch of jitter on the
 * rest, and no pause at all inside a word. The cursor blinks on a steady rhythm
 * of its own rather than being tied to the typing, which is what stops it
 * looking like a stutter.
 */
/** Splits `a **b** c` into runs, so the typed prompt can carry emphasis
 *  without the whole line shouting. */
function parseEmphasis(src: string): { text: string; emph: boolean }[] {
  return src
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { text: part.slice(2, -2), emph: true }
        : { text: part, emph: false },
    );
}

function TypewriterText({ text, speed = 11, onComplete, style }: TypewriterTextProps) {
  const runs = React.useMemo(() => parseEmphasis(text), [text]);
  const plain = React.useMemo(() => runs.map((r) => r.text).join(''), [runs]);
  const [shown, setShown] = useState(0);
  const [caretOn, setCaretOn] = useState(true);
  const done = shown >= plain.length;
  const finished = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const delayFor = useCallback(
    (ch: string, next: string) => {
      if (/[.!?]/.test(ch)) return speed * 4;
      if (/[,;:—]/.test(ch)) return speed * 2.4;
      if (ch === ' ' && /[A-Z]/.test(next || '')) return speed * 1.4;
      // Jitter keeps identical letters from marching in lockstep.
      return speed * (0.8 + Math.random() * 0.4);
    },
    [speed],
  );

  useEffect(() => {
    setShown(0);
    finished.current = false;
  }, [text]);

  useEffect(() => {
    if (done) {
      if (!finished.current) {
        finished.current = true;
        Haptics.selectionAsync().catch(() => {});
        onComplete?.();
      }
      return;
    }
    timer.current = setTimeout(
      () => setShown((n) => n + 1),
      delayFor(plain[shown] ?? '', plain[shown + 1] ?? ''),
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [shown, done, plain, delayFor, onComplete]);

  // Independent of typing, so the caret never stutters mid-word.
  useEffect(() => {
    const id = setInterval(() => setCaretOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);

  // Reveal across the runs so emphasis appears as the words are typed, not
  // only once the line finishes.
  let budget = shown;
  return (
    <Text style={style}>
      {runs.map((run, i) => {
        if (budget <= 0) return null;
        const slice = run.text.slice(0, budget);
        budget -= run.text.length;
        return (
          <Text key={i} style={run.emph ? styles.promptEmphasis : undefined}>
            {slice}
          </Text>
        );
      })}
      <Text style={[styles.cursor, { opacity: caretOn ? 1 : 0 }]}> ▌</Text>
    </Text>
  );
}

export default function QuestionBlock({ question, onAnswer }: Props) {
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [sliderVal, setSliderVal] = useState(
    question.kind === 'slider' ? question.default : 0,
  );
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
      entering={FadeIn.duration(400)}
      // No `exiting` animation here on purpose — react-native-reanimated's
      // exit animations absolutely-position the outgoing view to animate it
      // out while the new one enters, but that exit reliably fails to clean
      // up on React Native Web, leaving the old question's text permanently
      // stuck overlapping the new one. The parent already unmounts this via
      // a changing `key`, so it just disappears instantly, which is a fine
      // tradeoff for not showing broken overlap.
      style={styles.block}
    >
      <TypewriterText
        text={question.prompt}
        onComplete={handleTypewriterComplete}
        style={styles.prompt}
      />

      {isTypingComplete && question.kind === 'text' && (
        <Animated.View entering={FadeInDown.duration(350)} style={styles.fullWidth}>
          <Field
            value={text}
            onChangeText={setText}
            placeholder={question.placeholder}
            autoFocus
          />
          <View style={{ height: space.md }} />
          <GradientButton
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
        <Animated.View entering={FadeInDown.duration(350)} style={styles.fullWidth}>
          <View style={styles.optionsWrap}>
            {question.options.map((opt, i) => (
              <Animated.View key={opt} entering={FadeInDown.delay(i * 60).duration(320)}>
                <OptionButton
                  label={opt}
                  selected={selected === opt}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelected(opt);
                    setTimeout(() => onAnswer(opt, opt), 260);
                  }}
                />
              </Animated.View>
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
        <Animated.View entering={FadeInDown.duration(350)} style={styles.fullWidth}>
          <View style={styles.optionsWrap}>
            {question.options.map((opt, i) => (
              <Animated.View key={opt} entering={FadeInDown.delay(i * 60).duration(320)}>
              <OptionButton
                label={opt}
                selected={multiSelected.includes(opt)}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMultiSelected((prev) =>
                    prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
                  );
                }}
              />
              </Animated.View>
            ))}
          </View>
          <View style={{ height: space.md }} />
          <GradientButton
            label={multiSelected.length === 0 ? 'Skip' : 'Continue'}
            disabled={!question.optional && multiSelected.length === 0}
            onPress={() => onAnswer(multiSelected.join(','), multiSelected.join(', '))}
          />
        </Animated.View>
      )}

      {isTypingComplete && question.kind === 'slider' && (
        <Animated.View entering={FadeInDown.duration(350)} style={styles.fullWidth}>
          {(() => {
            const rounded = Math.round(sliderVal);
            const named = question.labels?.[rounded - question.min];
            // The top step of a `maxPlus` slider means "N or older", so it
            // reads "40+" rather than claiming an exact age.
            const atPlus = question.maxPlus && rounded >= question.max;
            const shown = atPlus ? `${question.max}+` : String(rounded);
            const maxLabel = question.maxPlus ? `${question.max}+` : String(question.max);
            return (
              <>
                <Text style={named ? styles.levelName : styles.ageValue}>{named ?? shown}</Text>
                {named ? (
                  <Text style={styles.levelMeta}>
                    Level {rounded} of {question.max}
                  </Text>
                ) : (
                  <Text style={styles.levelMeta}>
                    {question.min} – {maxLabel}
                  </Text>
                )}
              </>
            );
          })()}
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={question.min}
            maximumValue={question.max}
            step={1}
            value={sliderVal}
            onValueChange={setSliderVal}
            minimumTrackTintColor={palette.accent}
            maximumTrackTintColor="rgba(255,255,255,0.15)"
            thumbTintColor={palette.accent}
          />
          <View style={{ height: space.sm }} />
          <GradientButton
            label="Continue"
            onPress={() => {
              const rounded = Math.round(sliderVal);
              const named = question.labels?.[rounded - question.min];
              const atPlus = question.maxPlus && rounded >= question.max;
              // Value stays numeric so parseAge and the difficulty bands keep
              // working; only the label carries the "+".
              onAnswer(String(rounded), named ?? (atPlus ? `${question.max}+` : String(rounded)));
            }}
          />
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
    width: '100%',
    alignItems: 'stretch',
    gap: 16,
    paddingHorizontal: 8,
  },
  prompt: {
    color: palette.text,
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 300,
    lineHeight: 28,
  },
  promptEmphasis: { fontWeight: '800', color: palette.accent },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
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
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(76,158,255,0.15)',
    borderColor: palette.accent,
  },
  optionText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: palette.accent,
  },
  skipBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  skipText: {
    color: palette.textTertiary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  ageValue: {
    color: palette.accent,
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
  },
  levelName: {
    color: palette.accent,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  levelMeta: {
    color: palette.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
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
    backgroundColor: palette.accent,
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
