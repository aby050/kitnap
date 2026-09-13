import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../design/tokens';
import { mediaFor } from '../data/ambiences';
import { getVideoLayer } from './videoLayer';

/** One of the two loops that ship inside the binary, never one of the eight
 *  that stream. Onboarding is the one place that must work on a plane, on a
 *  first launch, before anything has been cached. Dusk reads best behind the
 *  brand's blue rise; the meadow fights it. */
const BACKDROP_ROOM = 'winddown';

/**
 * Rendered once at the app root and never unmounted while onboarding runs,
 * so every step (splash, questions, permissions, stats, paywall) sits on
 * the exact same environment instead of each screen re-painting its own bg.
 *
 * Two independent drifts at different speeds give the background a subtle
 * parallax feel — the primary bloom breathes slowly, a secondary side-glow
 * wanders on a longer cycle so the two never sync up and the bg never looks
 * like it's looping.
 */
export default function PersistentBackground() {
  const drift = useSharedValue(0);
  const drift2 = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Offset start so the two glows are never in phase.
    drift2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 17000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 17000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + drift.value * 0.2,
    transform: [
      { translateY: -20 + drift.value * 28 },
      { translateX: -10 + drift.value * 10 },
      { scale: 1 + drift.value * 0.08 },
    ],
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: 0.12 + drift2.value * 0.14,
    transform: [
      { translateX: -60 + drift2.value * 120 },
      { translateY: 40 + drift2.value * -30 },
      { scale: 0.9 + drift2.value * 0.2 },
    ],
  }));

  const VideoLayer = getVideoLayer();
  const backdrop = mediaFor(BACKDROP_ROOM);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#000000', '#000000']} style={StyleSheet.absoluteFill} />

      {/* The loop, blurred and held well back.
       *
       *  The poster sits under it so the first frame is never black, and
       *  everything above this is unchanged: the two drifting glows and the
       *  brand rise still own the screen, this only gives them something
       *  moving to sit on. If expo-video is missing from the binary, or the
       *  room has no footage, the whole stack is skipped and onboarding looks
       *  exactly as it did before. */}
      {VideoLayer && backdrop.video ? (
        <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
          <VideoLayer source={backdrop.video} />
        </View>
      ) : null}
      {/* Blur first, then dark: blurring a already-darkened image just makes
       *  grey. `intensity` is capped low because a heavy blur on a moving
       *  clip costs a lot of GPU for pixels nobody is looking at. */}
      {VideoLayer && backdrop.video && (
        <>
          <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.backdropScrim} />
          {/* The top third goes back to true black. That band carries the
              mark and the first line of every screen, and it is the part
              that read as "dull" once footage lifted it off black — so the
              loop is masked out of it entirely and only shows through the
              middle, where there is nothing else to look at. */}
          <LinearGradient
            colors={['#000000', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
            locations={[0, 0.22, 0.46]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}

      {/* Primary top bloom — breathes up and down */}
      <Animated.View style={[styles.topGlow, glowStyle]}>
        <LinearGradient
          colors={['rgba(20,60,44,0.95)', 'rgba(10,30,22,0.3)', 'rgba(0,0,0,0)']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Secondary wandering side-glow — adds depth without symmetry */}
      <Animated.View style={[styles.sideGlow, glow2Style]}>
        <LinearGradient
          colors={['rgba(71,107,235,0.07)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Brand rise — the same saturated ombre the rest of the app sits on
          (gradients.ground), layered here as `groundRise` so onboarding keeps
          its own animated black underneath instead of double-painting it.
          This replaced a flat black bottom vignette, which fought the rise. */}
      <LinearGradient
        colors={[...gradients.groundRise]}
        locations={[...gradients.groundRiseLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Scrim over the rise — the saturated bottom is bright enough that
          white body copy scrolling across it needs the contrast held back. */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.28)']}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* Far enough back that type stays the brightest thing on screen — the
   * backdrop is texture, not an image the user is meant to look at. */
  /* Motion, not a picture. The loop is only ever a texture under a black
   * screen — if it tints the background it has gone too far. */
  backdrop: { opacity: 0.78 },
  backdropScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  topGlow: {
    position: 'absolute',
    top: -160,
    left: -100,
    right: -100,
    height: 480,
  },
  sideGlow: {
    position: 'absolute',
    top: '20%',
    left: -120,
    right: -120,
    height: 300,
  },
});
