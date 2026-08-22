import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProgressPhoto, nextPhotoDue } from '../data/progressPhotos';
import { formatPrettyDate } from '../data/progress';
import { colors } from '../theme';

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Progress photos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.privacy}>
          Stored only on this device. Nothing here is uploaded — if you uninstall the app, these go with it.
        </Text>

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

        <Pressable disabled={!due || busy} onPress={capture} style={[styles.captureBtn, (!due || busy) && styles.captureBtnDisabled]}>
          <Text style={styles.captureText}>
            {busy ? 'Opening camera…' : due ? (photos.length === 0 ? 'Take your first photo' : "Take this week's photo") : 'Come back next week'}
          </Text>
        </Pressable>
        {!due && (
          <Text style={styles.hint}>One check-in per week keeps this meaningful instead of a chore.</Text>
        )}

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 100, gap: 16 },
  privacy: { color: colors.textFaint, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
  compareRow: { flexDirection: 'row', gap: 12 },
  compareCol: { flex: 1, alignItems: 'center', gap: 8 },
  comparePhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)' },
  compareLabel: { color: colors.textDim, fontSize: 12.5, fontWeight: '600' },
  captureBtn: {
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(124,245,176,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  captureBtnDisabled: { opacity: 0.4, borderColor: 'rgba(255,255,255,0.15)' },
  captureText: { color: colors.accent, fontSize: 15.5, fontWeight: '700' },
  hint: { color: colors.textFaint, fontSize: 12.5, textAlign: 'center', marginTop: -8 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { width: '31%', gap: 4 },
  gridPhoto: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  gridDate: { color: colors.textFaint, fontSize: 10.5, textAlign: 'center' },
});
