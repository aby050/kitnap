import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ambience, mediaFor } from '../data/ambiences';
import { getVideoLayer } from '../components/videoLayer';
import { tapLight } from '../ui/haptics';
import Icon from '../ui/Icon';
import { Editorial } from '../design/primitives';
import HoldButton from '../components/HoldButton';
import CancelConfirm from '../components/CancelConfirm';
import BlockedListSheet from '../components/BlockedListSheet';
import { getSelectionCounts } from '../data/iosScreenTime';
import { getTheme } from '../data/themes';
import { pickShieldMessage, shieldMessageSeed } from '../data/shieldMessages';

const KEEP_AWAKE_TAG = 'byre-ambience';

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function AmbienceSessionScreen({
  ambience,
  endsAt,
  onClose,
  onEnd,
  onBailout,
  tokenBalance = 0,
  onOpenTokenInfo,
}: {
  ambience: Ambience;
  /** Epoch ms the underlying block ends. The room counts down to it rather
   *  than running its own clock, so closing and reopening never drifts. */
  endsAt: number;
  /** Leave the room, block untouched. */
  onClose: () => void;
  /** The countdown reached zero on its own. */
  onEnd?: () => void;
  /** Spend a Bailout to end the block and leave. The only way out of a room
   *  before its time: the hold reveals the price, never skips it. */
  onBailout?: () => void;
  tokenBalance?: number;
  onOpenTokenInfo?: () => void;
}) {
  /* Measured, not <SafeAreaView>. Inside a `Modal` the component renders
   * outside the view the provider measures, so its top edge resolves to 0 and
   * the close and sound buttons land under the clock and the battery. Reading
   * the inset and padding by hand is the only version that clears them. */
  const insets = useSafeAreaInsets();
  const media = mediaFor(ambience.key);
  const [remaining, setRemaining] = useState(() => (endsAt - Date.now()) / 1000);
  const [muted, setMuted] = useState(false);
  const [firstFrame, setFirstFrame] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const ended = useRef(false);

  /* The room's own voice, out of the same pool the block screen draws from
   * and set in the same Editorial pair — filtered to the theme this room
   * speaks in, so Wind down gets the night lines and Deep thinking gets the
   * work ones. It walks the pool on its own five-second clock rather than on
   * the countdown's, which ticks twice a second and would strobe. */
  /* Rotation on its own five-second clock, not the countdown's — that one
   * ticks twice a second and would strobe.
   *
   * Deliberately a shared-value cross-fade over ONE view rather than a keyed
   * pair with entering/exiting: Reanimated's layout animations do not run
   * reliably on views inside a React Native `Modal`, and when the exiting copy
   * never finishes it stays parked at full opacity on top of its replacement —
   * which reads as a message that never changes at all. Swapping the text at
   * the trough of an opacity curve has no mount or unmount in it, so there is
   * nothing to get stuck. */
  const [msgTick, setMsgTick] = useState(0);
  const msgOpacity = useSharedValue(1);

  /* `runOnJS(setMsgTick)((t) => t + 1)` is what this said first, and it
   * crashed the room: runOnJS cannot carry a function across the UI-thread
   * boundary, so React never saw a real updater, the tick went to NaN and the
   * message lookup came back undefined. Hop to a plain no-argument callback
   * instead and do the increment on this side. */
  const advanceMessage = useCallback(() => setMsgTick((t) => t + 1), []);

  useEffect(() => {
    const id = setInterval(() => {
      msgOpacity.value = withTiming(0, { duration: 420 }, (done) => {
        if (done) runOnJS(advanceMessage)();
      });
    }, 5000);
    return () => clearInterval(id);
  }, [advanceMessage, msgOpacity]);

  // Fades back up once the new line is on screen, never on the first render.
  useEffect(() => {
    if (msgTick === 0) return;
    msgOpacity.value = withTiming(1, { duration: 520 });
  }, [msgTick, msgOpacity]);

  const msgStyle = useAnimatedStyle(() => ({ opacity: msgOpacity.value }));

  const message = useMemo(
    () =>
      pickShieldMessage(
        getTheme(ambience.theme).key,
        shieldMessageSeed(new Date().getDate(), msgTick),
      ),
    [ambience.theme, msgTick],
  );

  const blockedCount = useMemo(() => {
    const c = getSelectionCounts();
    return (c?.apps ?? 0) + (c?.categories ?? 0);
  }, []);

  const VideoLayer = getVideoLayer();
  const hasVideo = !!media.video && !!VideoLayer;

  /* ── Ambient track ───────────────────────────────────────────────────── */
  const audio = useAudioPlayer(
    media.audio == null ? null : typeof media.audio === 'number' ? media.audio : media.audio.uri,
  );

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
        {hasVideo && VideoLayer && media.video ? (
          <VideoLayer source={media.video} onFirstFrame={() => setFirstFrame(true)} />
        ) : null}

        {/* Legibility scrim for the controls at both ends. */}
        <LinearGradient
          /* Deeper and starting higher than a normal legibility scrim: the
             message is set in the shield's accent pair, and accent on a bright
             blue sky is close to unreadable without something under it. The
             gradient does that work so the type can keep the app's voice. */
          colors={[
            'rgba(0,0,0,0.45)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.38)',
            'rgba(0,0,0,0.84)',
          ]}
          locations={[0, 0.26, 0.56, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View
          style={[
            styles.safe,
            { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.topRow}>
            {/* Was a chevron that closed the room — which only ever landed the
             *  user back on the locked timer, so it read as an exit and
             *  delivered a dead end. The useful thing to know in here is what
             *  is actually being held back, so that is what the corner shows. */}
            <Pressable
              onPress={() => {
                tapLight();
                setShowBlocked(true);
              }}
              style={styles.blockedPill}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`${blockedCount} blocked. Tap to see the list.`}
            >
              <Icon name="lock" size={13} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.blockedText}>
                {blockedCount > 0 ? `${blockedCount} blocked` : 'Blocking on'}
              </Text>
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
            {/* Above the countdown, because the number is the fact and this
                is the reason. A fixed-height slot with the text absolutely
                placed inside it: these lines run from one to three rows, and
                in flow the countdown would hop every five seconds. */}
            <View style={styles.messageSlot}>
              <Animated.View style={[styles.messageFill, msgStyle]}>
                <Editorial
                  lead={message.lead}
                  emphasis={message.emphasis}
                  align="center"
                  voice
                  style={styles.message}
                />
              </Animated.View>
            </View>
            <Text style={styles.clock}>{clock(remaining)}</Text>
            <Text style={styles.name}>{ambience.title}</Text>
            <Text style={styles.intent}>{ambience.intent}</Text>
          </Animated.View>

          {/* There is nothing to pause in a room with no footage, and pausing
           *  the picture never stopped the block anyway — so the centre is
           *  the way out instead. A bare cross that has to be held for three
           *  seconds: the same gesture as ending a session on the timer and
           *  loosening a rule in Settings, and it lands on the same sheet, at
           *  the same price. */}
          <View style={styles.exitWrap}>
            <HoldButton
          onVideo
              label="Hold to unlock"
              holdLabel="Keep holding to unlock…"
              holdMs={3000}
              onComplete={() => setConfirming(true)}
              accessibilityLabel="Leave and end this session"
              style={styles.exitHold}
            />
          </View>

          <Text style={styles.footnote}>
            Your apps stay locked until this ends. Hold the button to leave early.
          </Text>
        </View>

        {/* The same sheet, and the same price, as ending a session on the
            timer. A room that could be left for free would make the Bailout
            meaningless everywhere else. */}
        <BlockedListSheet
          visible={showBlocked}
          onClose={() => setShowBlocked(false)}
          running
        />

        <CancelConfirm
          visible={confirming}
          title="Leave this room?"
          remainingLabel={clock(remaining)}
          remainingUnits={remaining >= 3600 ? 'hours · minutes' : 'minutes · seconds'}
          tokenBalance={tokenBalance}
          onClose={() => setConfirming(false)}
          onSpend={() => {
            if (tokenBalance <= 0) return;
            setConfirming(false);
            onBailout?.();
          }}
          onOpenTokenInfo={
            onOpenTokenInfo
              ? () => {
                  setConfirming(false);
                  onOpenTokenInfo();
                }
              : undefined
          }
        />
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
  blockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  blockedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  spacer: { flex: 1 },
  readout: { alignItems: 'center' },
  /* Three rows of type.editorial (33pt leading) plus breathing room, so the
   * longest line in the pool fits without resizing the slot. */
  messageSlot: { height: 116, alignSelf: 'stretch', justifyContent: 'flex-end', marginBottom: 14 },
  messageFill: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  message: {
    maxWidth: 330,
    // The shield sits on its own dark gradient; a room sits on whatever the
    // footage is doing, so the type carries its own shadow.
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 14,
  },
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
  exitWrap: { alignItems: 'center', marginTop: 34, paddingHorizontal: 20, alignSelf: 'stretch' },
  // Matches DeleteAccountScreen's `confirmHold` — same control, same width.
  exitHold: { width: '100%' },
  footnote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
});
