import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProgressPhoto, nextPhotoDue } from '../data/progressPhotos';
import { formatPrettyDate } from '../data/progress';
import { palette, space, radius, gradients } from '../design/tokens';
import Icon from '../ui/Icon';

/** Privacy is the whole point of this screen existing at all — photos never
 *  leave the device, so the explanation up front matters more than the UI. */
export default function ProgressPhotosScreen({
  photos,
  firstOpenDate,
  onAddPhoto,
  onBack,
}: {
  photos: ProgressPhoto[];
  firstOpenDate: string;
  onAddPhoto: (photo: ProgressPhoto) => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const due = nextPhotoDue(photos, firstOpenDate);
  const first = photos[0] ?? null;
  const latest = photos.length > 1 ? photos[photos.length - 1] : null;

  const capture = async () => {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        onAddPhoto({ date: new Date().toISOString(), uri: result.assets[0].uri });
      }
    } finally {
      setBusy(false);
    }
  };

  const enabled = due && !busy;

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#050C16', '#000000', '#000000']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
            <Icon name="chevronLeft" size={20} color={palette.text} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Progress photos</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.privacyCard}>
            <Icon name="lock" size={16} color={palette.accent} strokeWidth={1.8} />
            <Text style={styles.privacy}>
              Stored only on this device. Nothing here is uploaded — if you uninstall the app, these go with it.
            </Text>
          </View>

          {first && latest && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.compareRow}>
              <View style={styles.compareCol}>
                <Image source={{ uri: first.uri }} style={styles.comparePhoto} />
                <Text style={styles.compareLabel}>Week 1 · {formatPrettyDate(first.date)}</Text>
              </View>
              <View style={styles.compareCol}>
                <Image source={{ uri: latest.uri }} style={styles.comparePhoto} />
                <Text style={styles.compareLabel}>Latest · {formatPrettyDate(latest.date)}</Text>
              </View>
            </Animated.View>
          )}

          {photos.length === 0 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyCard}>
              <View style={styles.emptyGlyph}>
                <Icon name="camera" size={30} color={palette.accent} strokeWidth={1.6} />
              </View>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyBody}>
                A weekly self-portrait is a quiet way to see change that a number can't show. Start whenever you're ready.
              </Text>
            </Animated.View>
          )}

          <Pressable disabled={!enabled} onPress={capture} style={styles.captureBtn}>
            {enabled ? (
              <LinearGradient colors={gradients.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.captureDisabledFill]} />
            )}
            <Icon name="camera" size={19} color={enabled ? '#04140c' : palette.textTertiary} strokeWidth={2} />
            <Text style={[styles.captureText, !enabled && styles.captureTextDisabled]}>
              {busy ? 'Opening camera…' : due ? (photos.length === 0 ? 'Take your first photo' : "Take this week's photo") : 'Come back next week'}
            </Text>
          </Pressable>
          {!due && <Text style={styles.hint}>One check-in per week keeps this meaningful instead of a chore.</Text>}

          {photos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>All photos ({photos.length})</Text>
              <View style={styles.grid}>
                {[...photos].reverse().map((p) => (
                  <View key={p.date} style={styles.gridCell}>
                    <Image source={{ uri: p.uri }} style={styles.gridPhoto} />
                    <Text style={styles.gridDate}>{formatPrettyDate(p.date)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.base },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: space.md },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.glass, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: palette.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  scroll: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: 110, gap: space.base },

  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.base,
    padding: space.md,
    borderRadius: radius.base,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  privacy: { flex: 1, color: palette.textSecondary, fontSize: 12.5, lineHeight: 18 },

  compareRow: { flexDirection: 'row', gap: space.md },
  compareCol: { flex: 1, alignItems: 'center', gap: space.sm },
  comparePhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, backgroundColor: palette.surfaceHigh },
  compareLabel: { color: palette.textSecondary, fontSize: 12.5, fontWeight: '700' },

  emptyCard: {
    alignItems: 'center',
    padding: space.xl,
    borderRadius: radius.xxl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: space.sm,
  },
  emptyGlyph: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: palette.accentSoft,
    borderWidth: 1, borderColor: palette.accentBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.xs,
  },
  emptyTitle: { color: palette.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  emptyBody: { color: palette.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },

  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  captureDisabledFill: { backgroundColor: palette.surfaceHigh },
  captureText: { color: '#04140c', fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  captureTextDisabled: { color: palette.textTertiary },
  hint: { color: palette.textTertiary, fontSize: 12.5, textAlign: 'center', marginTop: -space.sm },

  sectionTitle: { color: palette.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginTop: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  gridCell: { width: '31%', gap: 4 },
  gridPhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: palette.surfaceHigh },
  gridDate: { color: palette.textTertiary, fontSize: 10.5, textAlign: 'center' },
});
