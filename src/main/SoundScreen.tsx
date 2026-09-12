import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SOUNDS, SoundDef } from '../data/sounds';
import {
  RemoteSoundClip,
  cachedSoundUri,
  downloadSound,
  fetchSoundManifest,
} from '../data/remoteSounds';
import { Card, Editorial, Screen, ScreenHeader, SectionHeader } from '../design/primitives';
import Icon from '../ui/Icon';
import AnimatedIcon from '../ui/AnimatedIcon';
import { motion, palette, radius, space, type } from '../design/tokens';
import { tapLight } from '../ui/haptics';

/** One player per sound so switching tracks doesn't tear down and rebuild a
 *  native player mid-loop — only the active one is ever actually playing. */
function SoundTile({ def, activeKey, onSetActive }: { def: SoundDef; activeKey: string | null; onSetActive: (key: string | null) => void }) {
  const player = useAudioPlayer(def.source);
  const status = useAudioPlayerStatus(player);
  const isActive = activeKey === def.key;

  const toggle = () => {
    tapLight();
    if (isActive) {
      player.pause();
      onSetActive(null);
    } else {
      player.loop = true;
      player.seekTo(0);
      player.play();
      onSetActive(def.key);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(motion.transition)}>
      <Card tone={isActive ? 'accent' : 'neutral'}>
        <Pressable onPress={toggle} style={styles.tileRow}>
          <View style={[styles.iconTile, isActive && styles.iconTileActive]}>
            <AnimatedIcon
              name={def.mark}
              size={22}
              color={palette.textSecondary}
              activeColor={palette.accent}
              active={isActive}
              strokeWidth={1.6}
            />
          </View>
          <View style={styles.shrink}>
            <Text style={type.bodyStrong}>{def.name}</Text>
            <Text style={[type.sub, styles.desc]}>{def.description}</Text>
          </View>
          <View style={[styles.playBtn, isActive && styles.playBtnActive]}>
            <AnimatedIcon
              name={isActive && status.playing ? 'pause' : 'play'}
              size={16}
              color={isActive ? palette.accent : palette.text}
              pop={isActive && status.playing}
            />
          </View>
        </Pressable>
        {isActive && (
          <View style={styles.volumeRow}>
            <Icon name="volumeOff" size={15} color={palette.textTertiary} />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={player.volume}
              onValueChange={(v) => (player.volume = v)}
              minimumTrackTintColor={palette.accent}
              maximumTrackTintColor={palette.border}
              thumbTintColor={palette.accent}
            />
            <Icon name="volume" size={15} color={palette.textTertiary} />
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

/** Plays from an already-downloaded local file — only mounted once a clip
 *  is cached, so useAudioPlayer always gets a stable, non-remote source. */
function RemoteSoundPlayerTile({
  clip,
  localUri,
  activeKey,
  onSetActive,
}: {
  clip: RemoteSoundClip;
  localUri: string;
  activeKey: string | null;
  onSetActive: (key: string | null) => void;
}) {
  const player = useAudioPlayer(localUri);
  const status = useAudioPlayerStatus(player);
  const isActive = activeKey === clip.id;

  const toggle = () => {
    tapLight();
    if (isActive) {
      player.pause();
      onSetActive(null);
    } else {
      player.loop = true;
      player.seekTo(0);
      player.play();
      onSetActive(clip.id);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(motion.transition)}>
      <Card tone={isActive ? 'accent' : 'neutral'}>
        <Pressable onPress={toggle} style={styles.tileRow}>
          <View style={[styles.iconTile, isActive && styles.iconTileActive]}>
            <AnimatedIcon
              name="headphones"
              size={22}
              color={palette.textSecondary}
              activeColor={palette.accent}
              active={isActive}
              strokeWidth={1.6}
            />
          </View>
          <View style={styles.shrink}>
            <Text style={type.bodyStrong}>{clip.name}</Text>
            <Text style={[type.sub, styles.desc]}>{clip.description}</Text>
          </View>
          <View style={[styles.playBtn, isActive && styles.playBtnActive]}>
            <AnimatedIcon
              name={isActive && status.playing ? 'pause' : 'play'}
              size={16}
              color={isActive ? palette.accent : palette.text}
              pop={isActive && status.playing}
            />
          </View>
        </Pressable>
        {isActive && (
          <View style={styles.volumeRow}>
            <Icon name="volumeOff" size={15} color={palette.textTertiary} />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={player.volume}
              onValueChange={(v) => (player.volume = v)}
              minimumTrackTintColor={palette.accent}
              maximumTrackTintColor={palette.border}
              thumbTintColor={palette.accent}
            />
            <Icon name="volume" size={15} color={palette.textTertiary} />
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

/** Shows a download step first (backend clips aren't bundled — they're
 *  fetched once, cached to disk, and played from the local copy after). */
function RemoteSoundTile({
  clip,
  activeKey,
  onSetActive,
}: {
  clip: RemoteSoundClip;
  activeKey: string | null;
  onSetActive: (key: string | null) => void;
}) {
  const [localUri, setLocalUri] = useState<string | null>(() => cachedSoundUri(clip));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  if (localUri) {
    return <RemoteSoundPlayerTile clip={clip} localUri={localUri} activeKey={activeKey} onSetActive={onSetActive} />;
  }

  const download = async () => {
    tapLight();
    setDownloading(true);
    setError(false);
    try {
      const uri = await downloadSound(clip);
      setLocalUri(uri);
    } catch {
      setError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(motion.transition)}>
      <Card>
        <Pressable onPress={download} disabled={downloading} style={styles.tileRow}>
          <View style={styles.iconTile}>
            <Icon name="headphones" size={22} color={palette.textSecondary} strokeWidth={1.6} />
          </View>
          <View style={styles.shrink}>
            <Text style={type.bodyStrong}>{clip.name}</Text>
            <Text style={[type.sub, styles.desc, error && { color: palette.danger }]}>
              {error ? 'Download failed — tap to retry' : clip.description}
            </Text>
          </View>
          <View style={styles.playBtn}>
            {downloading ? (
              <ActivityIndicator size="small" color={palette.accent} />
            ) : (
              <Icon name={error ? 'refresh' : 'download'} size={16} color={palette.text} />
            )}
          </View>
        </Pressable>
      </Card>
    </Animated.View>
  );
}

export default function SoundScreen({ onBack }: { onBack: () => void }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [remoteClips, setRemoteClips] = useState<RemoteSoundClip[]>([]);
  const [loadingManifest, setLoadingManifest] = useState(true);

  useEffect(() => {
    fetchSoundManifest().then((clips) => {
      setRemoteClips(clips);
      setLoadingManifest(false);
    });
  }, []);

  const showBuiltIn = remoteClips.length === 0 && !loadingManifest;

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Sound & meditation" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Editorial lead="A little sound," emphasis="a little quiet." style={styles.voice} />
        <Text style={[type.callout, styles.lede]}>
          Ambient loops to sit under a focus session, or a breathing pacer for a moment away from the screen.
          Only one plays at a time. Download a clip once and it plays from your device after that.
        </Text>

        {loadingManifest && (
          <View style={styles.centerRow}>
            <ActivityIndicator color={palette.accent} />
          </View>
        )}

        {!loadingManifest && remoteClips.length > 0 && (
          <View style={styles.list}>
            {remoteClips.map((clip) => (
              <RemoteSoundTile key={clip.id} clip={clip} activeKey={activeKey} onSetActive={setActiveKey} />
            ))}
          </View>
        )}

        {showBuiltIn && (
          <>
            <SectionHeader title="Built-in · offline" />
            <View style={styles.list}>
              {SOUNDS.map((def) => (
                <SoundTile key={def.key} def={def} activeKey={activeKey} onSetActive={setActiveKey} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shrink: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: space.gutter, paddingBottom: space.tabClearance },
  voice: { marginTop: space.sm },
  lede: { marginTop: space.md, marginBottom: space.lg },
  list: { gap: space.md },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileActive: { borderColor: palette.accentBorder, backgroundColor: palette.accentSoft },
  desc: { marginTop: space.xxs },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: { borderColor: palette.accentBorder, backgroundColor: palette.accentSoft },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.base },
  slider: { flex: 1, height: 32 },
  centerRow: { alignItems: 'center', paddingVertical: space.lg },
});
