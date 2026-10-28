import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SOUNDS, SoundKey, getSound } from '../data/sounds';
import Icon from '../ui/Icon';
import { tapLight } from '../ui/haptics';
import { palette, radius, space, type } from '../design/tokens';

const BAR_COUNT = 8;

/**
 * One level bar. Free-running rather than driven by real audio amplitude —
 * `expo-audio` exposes no metering, and a bar that lies about the waveform is
 * worse than one that plainly reads as "playing".
 */
function Bar({ index, active }: { index: number; active: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      t.value = withTiming(0, { duration: 180 });
      return;
    }
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: 900 + index * 70, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [active, index, t]);

  const style = useAnimatedStyle(() => ({
    height: 3 + t.value * 17,
  }));

  return <Animated.View style={[styles.bar, active ? styles.barOn : styles.barOff, style]} />;
}

/**
 * The clip playing under a locked session.
 *
 * Deliberately not the Room player. A Room is something the user sits and
 * looks at; this plays under a timer they have put the phone down for, so it
 * carries no artwork, no scrubber and no volume slider — a name, a way to
 * change it, and a way to stop.
 *
 * Playback follows the screen. It does not continue once the phone sleeps,
 * and that is a decision rather than an oversight: background audio needs a
 * declared foreground-service type on Android and a UIBackgroundModes entry on
 * iOS, and Kitnap was rejected under guideline 2.5.4 on 2026-09-09 for carrying
 * that entry with no feature behind it (see plugins/withNoBackgroundAudio.js).
 * Adding it back is a release decision, not something to slip in with a card.
 */
export default function SessionSoundCard({
  soundKey,
  onChange,
}: {
  /** null is silence — the default, and a real choice rather than volume 0. */
  soundKey: SoundKey | null;
  onChange: (key: SoundKey | null) => void;
}) {
  const active = soundKey !== null;
  const def = active ? getSound(soundKey) : null;
  const player = useAudioPlayer(def ? def.source : null);

  // Keep the latest player in a ref so the cleanup below always pauses the
  // one that is actually playing, not the one captured when the effect ran.
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    if (!def) {
      try {
        player.pause();
      } catch {
        /* nothing loaded */
      }
      return;
    }
    let cancelled = false;
    (async () => {
      await setAudioModeAsync({
        // The user started this on purpose and it plays under a lock they
        // chose; the ringer switch silencing it would read as a broken feature.
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        // Never take over someone's music. A focus track that kills a playlist
        // is a track people switch off and never switch back on.
        interruptionMode: 'mixWithOthers',
      });
      if (cancelled) return;
      player.loop = true;
      // Under the timer, not over it.
      player.volume = 0.5;
      player.play();
    })();
    return () => {
      cancelled = true;
      try {
        playerRef.current?.pause();
      } catch {
        /* already released */
      }
    };
  }, [player, def]);

  const step = (by: number) => {
    tapLight();
    if (!active) {
      onChange(SOUNDS[0].key);
      return;
    }
    const at = SOUNDS.findIndex((s) => s.key === soundKey);
    const next = (at + by + SOUNDS.length) % SOUNDS.length;
    onChange(SOUNDS[next].key);
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.name} numberOfLines={1}>
            {def ? def.name : 'Sound off'}
          </Text>
          <Text style={styles.kind} numberOfLines={1}>
            {def ? def.description : 'Silent session'}
          </Text>
        </View>

        <View style={styles.arrows}>
          <Pressable
            onPress={() => step(-1)}
            style={styles.arrow}
            hitSlop={8}
            accessibilityLabel="Previous sound"
          >
            <Icon name="chevronLeft" size={16} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={() => step(1)}
            style={styles.arrow}
            hitSlop={8}
            accessibilityLabel="Next sound"
          >
            <Icon name="chevronRight" size={16} color={palette.text} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <View style={styles.meterRow}>
        <View style={styles.meter}>
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <Bar key={i} index={i} active={active} />
          ))}
        </View>

        <Pressable
          onPress={() => {
            tapLight();
            onChange(active ? null : SOUNDS[0].key);
          }}
          hitSlop={8}
          accessibilityLabel={active ? 'Turn sound off' : 'Turn sound on'}
        >
          <Text style={styles.toggle}>{active ? 'Turn off' : 'Turn on'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  headText: { flex: 1, gap: 2 },
  name: { ...type.body, color: palette.text, fontWeight: '600' },
  kind: { ...type.caption, color: palette.textTertiary },
  arrows: { flexDirection: 'row', gap: 6 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
  },
  meterRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  meter: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20 },
  bar: { width: 3, borderRadius: 2 },
  barOn: { backgroundColor: palette.accent },
  barOff: { backgroundColor: palette.textTertiary },
  toggle: { ...type.caption, color: palette.textSecondary, fontWeight: '600' },
});
