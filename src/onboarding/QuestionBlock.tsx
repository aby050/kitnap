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
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui';
import { Field } from '../design/primitives';
import { fonts, palette, space } from '../design/tokens';

type Props = {
  question: Question;
  onAnswer: (value: string, label: string) => void;
};

/**
 * Headline size, stepped down as the prompt gets longer.
 *
 * The prompts vary from "your name?" to "what would you rather be spending
 * that time on? pick as many as you like." — a four-fold range. At one fixed
 * size the long ones run to four lines of 32pt and push the answers off the
 * screen, while the short ones look undersized. Leading tracks the size so
 * the sub-1.0 ratio that makes the stack read as one block is preserved at
 * every step.
 */
function promptSize(prompt: string) {
  const n = prompt.replace(/\*\*/g, '').length;
  if (n > 80) return { fontSize: 21, lineHeight: 28, letterSpacing: -0.3 };
  if (n > 48) return { fontSize: 23, lineHeight: 30, letterSpacing: -0.4 };
  return { fontSize: 26, lineHeight: 33, letterSpacing: -0.5 };
}

/** Display-only icons. Answer values stay the plain labels, so nothing that
 *  reads them back (rules, schedule, block-screen voice) is affected. */
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Focus better': 'locate-outline', 'Sleep better': 'moon-outline', 'Be more present': 'sparkles-outline',
  'Improve mental health': 'heart-outline', Other: 'ellipsis-horizontal-circle-outline',
  'Drawing / painting': 'color-palette-outline', Reading: 'book-outline', Exercise: 'barbell-outline',
  Meditation: 'leaf-outline', Study: 'school-outline', 'Work / a project': 'briefcase-outline',
  'Family / relationships': 'people-outline', Music: 'musical-notes-outline', Cooking: 'restaurant-outline',
  'Learning a skill': 'bulb-outline',
  'First thing in the morning': 'sunny-outline', 'Through the working day': 'time-outline',
  'The evening': 'partly-sunny-outline', 'Late at night, in bed': 'moon-outline',
  'Adult sites': 'eye-off-outline', 'Betting and gambling': 'dice-outline', 'Short-form video': 'play-circle-outline',
  'News and doomscroll': 'newspaper-outline',
  'Push-ups': 'fitness-outline', Squats: 'walk-outline', 'Jumping jacks': 'flash-outline', 'I’d rather not move': 'hand-left-outline',
  'At a desk': 'desktop-outline', 'In bed': 'bed-outline', 'On the sofa': 'tv-outline', 'Out and about': 'navigate-outline',
};

/** One line under the question: why it is being asked. Makes the flow feel
 *  like a conversation rather than a form. */
const EYEBROWS: Record<string, string> = {
  matters: 'YOUR WHY', interests: 'YOUR TIME', slipWindow: 'YOUR WEAK SPOT', hardBlock: 'OFF LIMITS',
  name: 'YOU', healthLimit: 'YOUR BODY', movement: 'YOUR KEY', repBaseline: 'YOUR BASELINE',
  whereBlocked: 'YOUR SPOT', controlScale: 'YOUR STARTING LINE',
};

const HINTS: Record<string, string> = {
  matters: 'This sets the voice of your block screen.',
  interests: 'We’ll show these back to you when the urge hits.',
  slipWindow: 'Your first schedule is built around this.',
  hardBlock: 'Optional. Nobody is judging this list.',
  healthLimit: 'Some unlock challenges involve light movement. Optional.',
  name: 'Just so the app can talk to you like a person.',
  movement: 'You can change this any time in Settings.',
  whereBlocked: 'So we never ask for a move you can’t do there.',
  repBaseline: 'Be honest — the first challenge starts here.',
  controlScale: 'No wrong answer. This is your starting line.',
};

function OptionButton({ label, selected, onPress, tile }: { label: string; selected: boolean; onPress: () => void; tile?: boolean }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.95, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
        onPress={onPress}
        style={[styles.optionBtn, tile && styles.optionTile, selected && styles.optionBtnSelected]}
      >
        {ICONS[label] ? (
          <View style={tile ? styles.tileEmoji : styles.rowEmoji}>
            <Ionicons name={ICONS[label]} size={tile ? 28 : 22} color={selected ? palette.onLight : '#FFFFFF'} />
          </View>
        ) : null}
        <Text
          numberOfLines={tile ? 2 : undefined}
          style={[styles.optionText, tile && { fontSize: 14.5, textAlign: 'center' }, selected && styles.optionTextSelected, !tile && { flex: 1 }]}
        >
          {label}
        </Text>
        {!tile && (
          <View style={[styles.optionDot, selected && styles.optionDotOn]}>
            {selected && <Text style={styles.optionTick}>✓</Text>}
          </View>
        )}
        {tile && selected && (
          <View style={styles.tileTick}>
            <Text style={styles.optionTick}>✓</Text>
          </View>
        )}
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
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Cumulative reveal time per character. Shaped rather than fixed: a beat
   *  after sentence ends, less after commas, jitter elsewhere. */
  const schedule = React.useMemo(() => {
    const out: number[] = [];
    let t = 0;
    for (let i = 0; i < plain.length; i++) {
      const ch = plain[i];
      const next = plain[i + 1] ?? '';
      if (/[.!?]/.test(ch)) t += speed * 4;
      else if (/[,;:—]/.test(ch)) t += speed * 2.4;
      else if (ch === ' ' && /[A-Z]/.test(next)) t += speed * 1.4;
      else t += speed * (0.8 + Math.random() * 0.4);
      out.push(t);
    }
    return out;
  }, [plain, speed]);

  useEffect(() => {
    setShown(0);
    finished.current = false;
  }, [text]);

  // Driven by elapsed time, not one timeout per character. A timeout per
  // character costs a render per character, and on a mid-range Android phone
  // that stretched a one-second line to four or five — twenty questions of
  // that is minutes of waiting before the app has done anything. Now a slow
  // frame just reveals several characters at once.
  useEffect(() => {
    if (done) {
      if (!finished.current) {
        finished.current = true;
        Haptics.selectionAsync().catch(() => {});
        onComplete?.();
      }
      return;
    }
    const start = Date.now() - (shown > 0 ? schedule[shown - 1] : 0);
    timer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      let n = 0;
      while (n < schedule.length && schedule[n] <= elapsed) n++;
      setShown((cur) => (n > cur ? n : cur));
    }, 32);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, schedule, onComplete]);

  /** Tap anywhere on the line to finish it at once. */
  const skip = useCallback(() => setShown(plain.length), [plain.length]);

  // Independent of typing, so the caret never stutters mid-word.
  useEffect(() => {
    const id = setInterval(() => setCaretOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);

  // Reveal across the runs so emphasis appears as the words are typed, not
  // only once the line finishes.
  let budget = shown;
  return (
    <Text style={style} onPress={done ? undefined : skip} suppressHighlighting>
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
      }, 600); // a beat to read it once typing is done
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
      {EYEBROWS[question.id] ? (
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>{EYEBROWS[question.id]}</Text>
        </View>
      ) : null}
      <TypewriterText
        text={question.prompt}
        onComplete={handleTypewriterComplete}
        style={[styles.prompt, promptSize(question.prompt)]}
      />

      {isTypingComplete && HINTS[question.id] && (
        <Animated.Text entering={FadeIn.duration(400)} style={styles.hint}>
          {HINTS[question.id]}
        </Animated.Text>
      )}

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
          <View style={[styles.optionsWrap, question.options.length > 5 && styles.tileGrid]}>
            {question.options.map((opt, i) => (
              <Animated.View
                key={opt}
                entering={FadeInDown.delay(i * 40).duration(300)}
                style={question.options.length > 5 ? styles.tileCell : undefined}
              >
              <OptionButton
                tile={question.options.length > 5}
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
            const pips = question.max - question.min + 1;
            return (
              <View style={styles.sliderCard}>
                {pips <= 12 && (
                  <View style={styles.pipRow}>
                    {Array.from({ length: pips }).map((_, i) => (
                      <View
                        key={i}
                        style={[styles.pip, i + question.min <= rounded && styles.pipOn, i + question.min === rounded && styles.pipCurrent]}
                      />
                    ))}
                  </View>
                )}
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
              </View>
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
    // More air between the headline and the answers than between the answers
    // themselves, so the question reads as a question and the rows read as
    // one group rather than five separate things.
    gap: 26,
    paddingHorizontal: 8,
  },
  /* The prompt is the screen, not a caption above a widget.
   *
   * It was a centred 21pt medium line capped at 300pt wide, with the answers
   * as small wrapped chips underneath — the standard onboarding-quiz layout
   * that most apps in this category ship, Opal included. Set as a left-aligned
   * editorial headline instead, on the same type as the education slides, so
   * the whole flow reads as one voice rather than a funnel bolted onto an app. */
  prompt: {
    color: palette.text,
    fontFamily: fonts.bold,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'left',
    alignSelf: 'stretch',
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.accentBorder,
    marginBottom: 14,
  },
  eyebrowText: { color: palette.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  promptEmphasis: { color: palette.accent },
  fullWidth: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  /* Answers are full-width rows stacked down the screen, not chips wrapped
   * into a centred cloud. One target per line means no hunting and no
   * ambiguous tap zones, and the stack lands in the lower half where the
   * ground has saturated — which is why they use the on-colour fills rather
   * than the dark surface ones, which vanish against it. */
  optionsWrap: {
    flexDirection: 'column',
    alignSelf: 'stretch',
    gap: 9,
  },
  sliderCard: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
    marginBottom: 12,
  },
  pipRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  pip: { width: 18, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  pipOn: { backgroundColor: palette.accent },
  pipCurrent: { backgroundColor: '#FFFFFF', width: 26 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: -4, marginBottom: 14 },
  rowEmoji: { marginRight: 14 },
  tileEmoji: { marginBottom: 10 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginHorizontal: -4 },
  tileCell: { width: '50%', padding: 4 },
  optionTile: { flexDirection: 'column', paddingVertical: 18, paddingHorizontal: 10, justifyContent: 'center', height: 112 },
  tileTick: {
    position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: palette.onLight, alignItems: 'center', justifyContent: 'center',
  },
  optionDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  optionDotOn: { backgroundColor: palette.onLight, borderColor: palette.onLight },
  optionTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', marginTop: -1 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
    backgroundColor: palette.onColor,
  },
  /* Selection reads as the answer being *taken*: the row flips to the same
   * white-with-indigo-label pairing the primary button uses, so choosing an
   * answer and confirming an action look like the same gesture. */
  optionBtnSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  optionText: {
    color: palette.onColorText,
    fontFamily: fonts.medium,
    fontSize: 17,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: palette.onLight,
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  skipBtn: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  skipText: {
    color: palette.onColorTextDim,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  /* The answer to a slider question *is* the number, so it is set as the
   * hero of the screen rather than as a caption above the track — at 52pt it
   * was smaller than some of the prompts it was answering. */
  ageValue: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 88,
    // Poppins ExtraBold's ascenders overshoot the cap height, and React
    // Native clips a Text to its lineHeight box — at 92 the tops of the
    // digits were being shaved. 1.2x clears the overshoot.
    lineHeight: 106,
    fontWeight: '800',
    textAlign: 'left',
    letterSpacing: -3.5,
  },
  /* Named levels are words, not digits, so they cannot go as large as the
   * numeric readout without wrapping — but they are the same answer in the
   * same position and are sized to match as closely as the words allow. */
  levelName: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -1,
    minHeight: 68,
  },
  levelMeta: {
    color: palette.onColorTextDim,
    fontSize: 14,
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
    // Was a hardcoded amber that belonged to no palette in the app and read
    // as a warning next to the prompt. Amber now means "savings" and nothing
    // else; a caret is just the accent.
    color: palette.accent,
    fontWeight: 'bold',
    fontSize: 22,
    textShadowColor: 'rgba(71,107,235,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
