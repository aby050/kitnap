import React, { useEffect, useRef } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { curves } from '../design/motion';
import { tapMedium } from '../ui/haptics';
import { brandMark } from '../ui/brandMark';

const { width } = Dimensions.get('window');

/** The splash's own palette — deliberately deeper than the app's ground so the
 *  bloom has somewhere to come up from. */
const NEAR_BLACK = '#08050A';
const BLUE_DEEP = '#081B33';
const BLUE = '#476BEB'; // brand mint — name kept to avoid churn

/**
 * Beats, in ms. Longer than a normal splash on purpose: this screen is shown
 * once, on first install only (`App.tsx` sends returning users straight to the
 * app), so it is the one place the brand gets to introduce itself rather than
 * get out of the way. Tapping skips the whole thing.
 */
const BLOOM_IN = { at: 350, dur: 800 };
const MARK_IN = { at: 850, dur: 900 };
/** The mark has landed and the light catches it — the one punctuated moment. */
const IGNITE = { at: 1620, dur: 620 };
const WORD_IN = { at: 2040, dur: 520 };
/** Just after the last ring dissipates (1780 + 1100), so nothing is cut off. */
const HAND_OFF = 2900;

/** Letters animate individually so the wordmark assembles rather than fades.
 *  Per-letter transforms only — animating `letterSpacing` would relayout the
 *  text on every frame. */
const WORDMARK = ['B', 'Y', 'R', 'E'];
const LETTER_STAGGER = 70;

/**
 * Brand splash.
 *
 * Five beats: light wakes behind the centre, the mark settles into it, the
 * light catches the mark (flash + rings + a haptic, all on the same frame), the
 * wordmark assembles beneath, then it hands over. Nothing here animates a
 * layout property, so it behaves the same on device and in the web preview.
 */
export default function SplashFlow({ onDone }: { onDone: () => void }) {
  const bloom = useSharedValue(0);
  const flare = useSharedValue(0);
  const mark = useSharedValue(0);
  const flash = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const word = useSharedValue(0);
  const done = useSharedValue(0);
  /** Ambient breath under everything, so the screen is never fully still. */
  const breath = useSharedValue(0);

  // Tapping to skip unmounts mid-sequence; a pending haptic would otherwise
  // fire on the next screen.
  const igniteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `onDone` is an inline arrow in `App.tsx`, so it is a new function on every
  // render. Held in a ref and kept out of the effect's deps: with it in there,
  // any re-render of the parent restarts every `withDelay` below from zero, and
  // a splash that keeps being re-scheduled never reaches its later beats.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const finish = () => onDoneRef.current();

    bloom.value = withDelay(
      BLOOM_IN.at,
      withTiming(1, { duration: BLOOM_IN.dur, easing: curves.standard }),
    );

    mark.value = withDelay(
      MARK_IN.at,
      withTiming(1, { duration: MARK_IN.dur, easing: curves.emphasized }),
    );

    // Ignition: a flash inside the mark's own silhouette, two rings leaving it,
    // and the bloom swelling once. All start together — that shared frame is
    // what makes it read as one event instead of three effects.
    flash.value = withDelay(
      IGNITE.at,
      withSequence(
        withTiming(1, { duration: 140, easing: curves.standard }),
        withTiming(0, { duration: IGNITE.dur - 140, easing: curves.standard }),
      ),
    );
    flare.value = withDelay(
      IGNITE.at,
      withSequence(
        withTiming(1, { duration: 220, easing: curves.standard }),
        withTiming(0, { duration: 700, easing: curves.standard }),
      ),
    );
    ring1.value = withDelay(IGNITE.at, withTiming(1, { duration: 1000, easing: curves.standard }));
    ring2.value = withDelay(
      IGNITE.at + 160,
      withTiming(1, { duration: 1100, easing: curves.standard }),
    );

    word.value = withDelay(
      WORD_IN.at,
      withTiming(1, { duration: WORD_IN.dur, easing: curves.standard }),
    );

    breath.value = withRepeat(withTiming(1, { duration: 3200, easing: curves.cycle }), -1, true);

    done.value = withDelay(
      HAND_OFF,
      withTiming(1, { duration: 1 }, (finished) => {
        if (finished) runOnJS(finish)();
      }),
    );

    igniteTimer.current = setTimeout(tapMedium, IGNITE.at);
    return () => {
      if (igniteTimer.current) clearTimeout(igniteTimer.current);
    };
    // Shared values are stable identities; `onDone` is read through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value * (0.5 + breath.value * 0.08) + flare.value * 0.3,
    transform: [{ scale: 0.55 + bloom.value * 0.45 + flare.value * 0.12 }],
  }));

  // Scales *down* into place rather than up — it reads as settling rather than
  // popping, which is the difference between calm and cheerful. The small rise
  // on top of that makes it feel lifted into position rather than dropped, and
  // the ignition adds one brief kick so the mark reacts to its own flash.
  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [
      { translateY: (1 - mark.value) * 14 },
      {
        scale:
          1.16 -
          mark.value * 0.16 +
          breath.value * 0.008 * mark.value +
          flash.value * 0.035,
      },
    ],
  }));

  /** The white core behind the mark on the ignition frame. Grows a little as it
   *  fades, so the light reads as leaving rather than switching off. */
  const coreStyle = useAnimatedStyle(() => ({
    opacity: flash.value * 0.5,
    transform: [{ scale: 0.55 + flash.value * 0.55 }],
  }));

  // Rings fade in over the first sixth of their travel and out across the
  // rest, so they appear to leave the mark rather than pop into existence
  // around it. Written out twice instead of via a helper — `useAnimatedStyle`
  // has to be called at the top level of the component.
  const ring1Style = useAnimatedStyle(() => ({
    opacity: (1 - ring1.value) * 0.5 * Math.min(1, ring1.value * 6),
    transform: [{ scale: 0.7 + ring1.value * 1.5 }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: (1 - ring2.value) * 0.38 * Math.min(1, ring2.value * 6),
    transform: [{ scale: 0.7 + ring2.value * 2.2 }],
  }));

  return (
    <Pressable style={styles.root} onPress={onDone} accessibilityLabel="Skip">
      <LinearGradient
        colors={[BLUE_DEEP, NEAR_BLACK, NEAR_BLACK]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Light coming up from *behind* the mark, so it reads as a halo rather
          than a spotlight: the gradient peaks just outside the logo and leaves
          a dark pocket at the centre. A centre-peaked glow (GlowField's shape)
          puts its brightest point exactly where the mark sits and the mark —
          which is azure on azure — loses all contrast and vanishes. */}
      <Animated.View style={[styles.centreLayer, bloomStyle]} pointerEvents="none">
        <Halo size={width * 1.5} />
      </Animated.View>

      {/* Rings leaving the mark at the moment the light catches it, and the
          white core flash behind it. Backlighting rather than tinting the mark
          itself: `tintColor` on an Image resolves to an SVG filter on React
          Native Web that floods black, so a "white flash" drawn that way turns
          the logo into a dark silhouette. Light from behind reads the same and
          renders identically on every platform. */}
      <View style={styles.centreLayer} pointerEvents="none">
        <Animated.View style={coreStyle}>
          <Core size={CORE} />
        </Animated.View>
        <Animated.View style={[styles.ring, ring1Style]} />
        <Animated.View style={[styles.ring, ring2Style]} />
      </View>

      <View style={styles.center}>
        <Animated.View style={markStyle}>
          <Image
            source={brandMark}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Byre"
          />
        </Animated.View>

        <View style={styles.wordmark}>
          {WORDMARK.map((letter, i) => (
            <Letter key={letter} char={letter} progress={word} index={i} />
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The azure halo. Stops are chosen so the brightest band sits just outside the
 * logo's edge: a dark pocket at the centre, a bright rim, then a long fade.
 * Rendered once and only scaled/faded by its parent, so the SVG is never
 * re-rasterised mid-animation.
 */
function Halo({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id="splashHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={BLUE} stopOpacity={0.02} />
          <Stop offset="26%" stopColor={BLUE} stopOpacity={0.05} />
          <Stop offset="44%" stopColor={BLUE} stopOpacity={0.26} />
          <Stop offset="68%" stopColor={BLUE} stopOpacity={0.09} />
          <Stop offset="100%" stopColor={BLUE} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} fill="url(#splashHalo)" />
    </Svg>
  );
}

/** The white core that lights up behind the mark on the ignition frame. */
function Core({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id="splashCore" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
          <Stop offset="38%" stopColor={BLUE} stopOpacity={0.5} />
          <Stop offset="100%" stopColor={BLUE} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} fill="url(#splashCore)" />
    </Svg>
  );
}

/** One wordmark letter. Rises and fades on its own beat; the group reads as
 *  assembling left to right. */
function Letter({
  char,
  progress,
  index,
}: {
  char: string;
  progress: { value: number };
  index: number;
}) {
  const style = useAnimatedStyle(() => {
    // Re-slice the shared 0–1 into a window per letter, so one clock drives
    // all four rather than four delayed timers.
    const offset = (index * LETTER_STAGGER) / WORD_IN.dur;
    const t = Math.max(0, Math.min(1, (progress.value - offset) / (1 - offset)));
    return { opacity: t, transform: [{ translateY: (1 - t) * 10 }] };
  });
  return <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>;
}

const LOGO = 104;
const RING = 150;
const CORE = 260;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEAR_BLACK, alignItems: 'center', justifyContent: 'center' },
  // zIndex, not just source order: the light layers are absolutely positioned,
  // and on React Native Web a positioned sibling paints above an in-flow one
  // regardless of order, which would bury the mark under its own backlight.
  center: { alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  centreLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 1,
    borderColor: BLUE,
  },
  logo: { width: LOGO, height: LOGO },
  wordmark: { flexDirection: 'row', marginTop: 26 },
  letter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    // Positive tracking is reserved for eyebrow labels elsewhere in the app;
    // a four-letter wordmark is the other place it belongs.
    letterSpacing: 7,
    opacity: 0.92,
  },
});
