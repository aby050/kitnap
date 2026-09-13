import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ambience, mediaFor } from '../data/ambiences';
import { tapLight } from '../ui/haptics';
import Icon from '../ui/Icon';

const KEEP_AWAKE_TAG = 'byre-ambience';

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * The immersive half of a focus room: the loop, the countdown, and nothing
 * else to touch.
 *
 * ── Foreground only, deliberately ─────────────────────────────────────────
 * Neither the loop nor the track survives backgrounding, and that is the
 * point. Byre was rejected under guideline 2.5.4 for declaring the `audio`
 * background mode without a feature that needed it; this feature still does
 * not need it, because a focus room is something you look at rather than
 * something you listen to with the screen off. Everything here is pinned to
 * that: expo-video's plugin is configured `supportsBackgroundPlayback: false`,
 * expo-audio's `enableBackgroundPlayback` is false, `shouldPlayInBackground`
 * is false below, and no lock-screen controls are bound. The screen is held
 * awake instead, which is the honest way to keep a visible timer visible.
 */
export default function AmbienceSessionScreen({
  ambience,
  endsAt,
  onClose,
  onEnd,
}: {
  ambience: Ambience;
  /** Epoch ms the underlying block ends. The room counts down to it rather
   *  than running its own clock, so closing and reopening never drifts. */
  endsAt: number;
  onClose: () => void;
  onEnd?: () => void;
}) {
  const media = mediaFor(ambience.key);
  const [remaining, setRemaining] = useState(() => (endsAt - Date.now()) / 1000);
  const [muted, setMuted] = useState(false);
  const [firstFrame, setFirstFrame] = useState(false);
  const ended = useRef(false);

  /* ── Video ───────────────────────────────────────────────────────────── */
  const video = useVideoPlayer(media.video ?? null, (p) => {
    p.loop = true;
    p.muted = true; // sound lives in the separate track, never in the clip
    if (media.video) p.play();
  });

  /* ── Ambient track ───────────────────────────────────────────────────── */
  const audio = useAudioPlayer(media.audio ?? null);

  useEffect(() => {
    if (!media.audio) return;
    let cancelled = false;
    (async () => {
      await setAudioModeAsync({
        // The room is something the user deliberately started and is looking
        // at, so the ringer switch should not silence it.
        playsInSilentMode: true,
        // Never. See the note above.
        shouldPlayInBackground: false,
        // Whatever they already had playing keeps playing — an ambience track
        // that kills someone's music is a track they turn off for good.
        interruptionMode: 'mixWithOthers',
      });
      if (cancelled) return;
      audio.loop = true;
      audio.volume = 0.55;
      audio.play();
    })();
    return () => {
      cancelled = true;
      try {
        audio.pause();
      } catch {
        /* already released */
      }
    };
  }, [audio, media.audio]);

  useEffect(() => {
    audio.muted = muted;
  }, [audio, muted]);

  /* ── Countdown ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const tick = () => {
      const left = (endsAt - Date.now()) / 1000;
      setRemaining(left);
      if (left <= 0 && !ended.current) {
        ended.current = true;
        onEnd?.();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt, onEnd]);

  /* ── Keep the screen up while the room is open ───────────────────────── */
  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      try {
        deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch {
        /* never activated */
      }
    };
  }, []);

  const playing = video.playing;

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* The wash is always painted. Footage, when there is any, sits on
         *  top of it — so a room with no media is a designed screen and the
         *  first frame of one that has media never flashes black. */}
        <LinearGradient
          colors={ambience.wash}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {media.still && !firstFrame ? (
          <Animated.View exiting={FadeOut.duration(420)} style={StyleSheet.absoluteFill}>
            <Image source={media.still} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Animated.View>
        ) : null}
        {media.video ? (
          <VideoView
            player={video}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            // Picture-in-picture is what pulls `audio` into UIBackgroundModes
            // on iOS. Never turn it on here.
            allowsPictureInPicture={false}
            onFirstFrameRender={() => setFirstFrame(true)}
            {...(Platform.OS === 'android' ? { useExoShutter: false } : null)}
          />
        ) : null}

        {/* Legibility scrim for the controls at both ends. */}
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          locations={[0, 0.32, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topRow}>
            <Pressable
              onPress={() => {
                tapLight();
                onClose();
              }}
              style={styles.circle}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Leave the room"
            >
              <Icon name="close" size={18} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>

            <Pressable
              onPress={() => {
                tapLight();
                setMuted((m) => !m);
              }}
              style={[styles.circle, !media.audio && styles.circleDisabled]}
              hitSlop={10}
              disabled={!media.audio}
              accessibilityRole="button"
              accessibilityLabel={muted ? 'Turn sound on' : 'Turn sound off'}
            >
              <Icon
                name={muted || !media.audio ? 'volumeOff' : 'volume'}
                size={18}
                color="#FFFFFF"
                strokeWidth={1.9}
              />
            </Pressable>
          </View>

          <View style={styles.spacer} />

          <Animated.View entering={FadeIn.duration(500)} style={styles.readout}>
            <Text style={styles.clock}>{clock(remaining)}</Text>
            <Text style={styles.name}>{ambience.title}</Text>
            <Text style={styles.intent}>{ambience.intent}</Text>
          </Animated.View>

          {/* Pause stops the LOOP, not the block. Said out loud underneath,
           *  because a pause button on a screen-time app that quietly
           *  suspended the block would be the app lying to the user. */}
          <Pressable
            onPress={() => {
              tapLight();
              if (!media.video) return;
              playing ? video.pause() : video.play();
            }}
            style={[styles.playBtn, !media.video && styles.circleDisabled]}
            disabled={!media.video}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause the loop' : 'Play the loop'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={26} color="#FFFFFF" strokeWidth={2} />
          </Pressable>

          <Text style={styles.footnote}>
            Your apps stay locked whether this is open or not.
          </Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1, paddingHorizontal: 22 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDisabled: { opacity: 0.35 },
  spacer: { flex: 1 },
  readout: { alignItems: 'center' },
  clock: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1.5,
    // Poppins has no tabular set, so the seconds jitter as digits change.
    fontVariant: ['tabular-nums'],
  },
  name: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginTop: 2 },
  intent: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13.5,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 280,
  },
  playBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 34,
  },
  footnote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
});
