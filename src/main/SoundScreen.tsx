import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SOUNDS, SoundDef } from '../data/sounds';
import {
  RemoteSoundClip,
  cachedSoundUri,
  downloadSound,
  fetchSoundManifest,
  isSoundCached,
} from '../data/remoteSounds';
import { colors } from '../theme';
import AppIcon from '../ui/AppIcon';
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
    <Animated.View entering={FadeInDown.duration(340)} style={[styles.tile, isActive && styles.tileActive]}>
      <Pressable onPress={toggle} style={styles.tileRow}>
        <AppIcon sf={def.sf as any} fallback={def.glyph} size={28} color={colors.text} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{def.name}</Text>
          <Text style={styles.desc}>{def.description}</Text>
        </View>
        <View style={[styles.playBtn, isActive && styles.playBtnActive]}>
          <Text style={styles.playGlyph}>{isActive && status.playing ? '❚❚' : '▶'}</Text>
        </View>
      </Pressable>
      {isActive && (
        <View style={styles.volumeRow}>
          <Text style={styles.volumeGlyph}>🔈</Text>
          <Slider
            style={{ flex: 1, height: 32 }}
            minimumValue={0}
            maximumValue={1}
            value={player.volume}
            onValueChange={(v) => (player.volume = v)}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor="rgba(255,255,255,0.15)"
            thumbTintColor={colors.accent}
          />
          <Text style={styles.volumeGlyph}>🔊</Text>
        </View>
      )}
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
    <Animated.View entering={FadeInDown.duration(340)} style={[styles.tile, isActive && styles.tileActive]}>
      <Pressable onPress={toggle} style={styles.tileRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{clip.name}</Text>
          <Text style={styles.desc}>{clip.description}</Text>
        </View>
        <View style={[styles.playBtn, isActive && styles.playBtnActive]}>
          <Text style={styles.playGlyph}>{isActive && status.playing ? '❚❚' : '▶'}</Text>
        </View>
      </Pressable>
      {isActive && (
        <View style={styles.volumeRow}>
          <Text style={styles.volumeGlyph}>🔈</Text>
          <Slider
            style={{ flex: 1, height: 32 }}
            minimumValue={0}
            maximumValue={1}
            value={player.volume}
            onValueChange={(v) => (player.volume = v)}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor="rgba(255,255,255,0.15)"
            thumbTintColor={colors.accent}
          />
          <Text style={styles.volumeGlyph}>🔊</Text>
        </View>
      )}
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
    <Animated.View entering={FadeInDown.duration(340)} style={styles.tile}>
      <Pressable onPress={download} disabled={downloading} style={styles.tileRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{clip.name}</Text>
          <Text style={styles.desc}>{error ? 'Download failed — tap to retry' : clip.description}</Text>
        </View>
        <View style={styles.playBtn}>
          {downloading ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={styles.playGlyph}>⇩</Text>}
        </View>
      </Pressable>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Sound &amp; meditation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.lede}>
          Ambient loops to sit under a focus session, or a breathing pacer for a moment away from the screen.
          Only one plays at a time. Tap ⇩ to download a clip once — it plays from your device after that.
        </Text>

        {loadingManifest && (
          <View style={styles.centerRow}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {!loadingManifest && remoteClips.length === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.notice}>
            <Text style={styles.noticeText}>No clips published yet — check back once they're uploaded.</Text>
          </Animated.View>
        )}

        {remoteClips.map((clip) => (
          <RemoteSoundTile key={clip.id} clip={clip} activeKey={activeKey} onSetActive={setActiveKey} />
        ))}

        {remoteClips.length === 0 && !loadingManifest && (
          <>
            <Text style={styles.sectionLabel}>Built-in (offline)</Text>
            {SOUNDS.map((def) => (
              <SoundTile key={def.key} def={def} activeKey={activeKey} onSetActive={setActiveKey} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 100, gap: 12 },
  lede: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: 6 },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tileActive: { borderColor: 'rgba(124,245,176,0.35)', backgroundColor: 'rgba(124,245,176,0.05)' },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  glyph: { fontSize: 28 },
  name: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  desc: { color: colors.textFaint, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: 'rgba(124,245,176,0.18)' },
  playGlyph: { color: colors.accent, fontSize: 14 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  volumeGlyph: { fontSize: 13 },
  centerRow: { alignItems: 'center', paddingVertical: 20 },
  notice: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 18,
  },
  noticeText: { color: colors.textDim, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  sectionLabel: { color: colors.textFaint, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 8, marginBottom: -2 },
});
