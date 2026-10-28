import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MediaSource } from '../data/ambienceMedia';

/**
 * The looping clip, kept in its own module on purpose.
 *
 * `expo-video` resolves its native module at import time, so importing it
 * anywhere in the main tree takes the whole app down with "Cannot find native
 * module 'ExpoVideo'" on any binary built before the package was added — a
 * dev build, a stale simulator install, or a teammate who has not rebuilt yet.
 * Isolating it here lets the caller `require()` this file inside a try/catch
 * and fall back to the room's gradient wash, which is the same thing a room
 * with no footage yet already does.
 *
 * Keep this file free of anything else: every import added here becomes part
 * of that failure surface.
 */
export default function AmbienceVideoLayer({
  source,
  onFirstFrame,
  contentFit = 'cover',
}: {
  source: MediaSource;
  onFirstFrame?: () => void;
  /** 'contain' shows the whole frame, uncropped, with the ground behind any bars. */
  contentFit?: 'cover' | 'contain' | 'fill';
}) {
  // expo-video takes a require id as-is and a remote clip as a bare URL
  // string, so a streamed loop needs unwrapping from the {uri} the rest of
  // the app passes around.
  const player = useVideoPlayer(typeof source === 'number' ? source : source.uri, (p) => {
    p.loop = true;
    // Sound is the separate ambient track, never the clip's own audio.
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      // width/height as well as absoluteFill: on web a <video> is a replaced
      // element, so inset:0 alone leaves it at its intrinsic 720x1280 and the
      // container just crops it.
      style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      contentFit={contentFit}
      nativeControls={false}
      // Picture-in-picture is what drags `audio` into UIBackgroundModes on
      // iOS. Kitnap was rejected under 2.5.4 for exactly that key. Never enable.
      allowsPictureInPicture={false}
      onFirstFrameRender={() => {
        // On web the play() in the setup callback can fire before the element
        // has data and is dropped, leaving the clip frozen on frame one.
        player.play();
        onFirstFrame?.();
      }}
      {...(Platform.OS === 'android' ? { useExoShutter: false } : null)}
    />
  );
}
