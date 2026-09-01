import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { GoalData } from '../data/goal';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

/** Generic quotes are the fallback. The real content is theirs — their line,
 *  their photo, their deadline. No competitor can clone this because it isn't
 *  content, it's them. */
export default function GoalScreen({ onContinue }: { onContinue: (goal: GoalData) => void }) {
  const [line, setLine] = useState('');
  const [deadlineName, setDeadlineName] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const canContinue = line.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          What do you want back?
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(120).duration(420)} style={styles.sub}>
          This resurfaces on your block screen, in your own words. One line is plenty.
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(260).duration(400)} style={{ width: '100%', maxWidth: 320 }}>
          <TextInput
            value={line}
            onChangeText={setLine}
            placeholder="e.g. my evenings back"
            placeholderTextColor={palette.textTertiary}
            style={styles.input}
            maxLength={80}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(380).duration(400)} style={styles.photoRow}>
          <Pressable onPress={pickPhoto} style={styles.photoPicker}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImg} />
            ) : (
              <Icon name="plus" size={22} color={palette.textSecondary} />
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>A photo, if you want one</Text>
            <Text style={styles.photoSub}>The goal, the person, the place. Becomes your shield icon.</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(480).duration(400)} style={styles.deadlineBlock}>
          <Text style={styles.deadlineLabel}>Optional — a deadline</Text>
          <View style={styles.deadlineRow}>
            <TextInput
              value={deadlineName}
              onChangeText={setDeadlineName}
              placeholder="Exam, launch, trip…"
              placeholderTextColor={palette.textTertiary}
              style={[styles.input, styles.deadlineInput]}
            />
            <TextInput
              value={deadlineDate}
              onChangeText={setDeadlineDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.textTertiary}
              style={[styles.input, styles.deadlineInput]}
            />
          </View>
          {deadlineName.trim() && deadlineDate.trim() ? (
            <Text style={styles.deadlinePreview}>
              The shield will say things like “{deadlineName.trim()} in 12 days.”
            </Text>
          ) : null}
        </Animated.View>
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton
          label={canContinue ? 'Continue' : 'Skip for now'}
          onPress={() =>
            onContinue({
              line: line.trim(),
              deadlineName: deadlineName.trim(),
              deadlineDate: deadlineDate.trim() || null,
              photoUri,
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 20 },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  sub: { color: palette.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: palette.glass,
    color: palette.text,
    fontSize: 16,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', maxWidth: 320 },
  photoPicker: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: palette.glass,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoTitle: { color: palette.text, fontSize: 15, fontWeight: '600' },
  photoSub: { color: palette.textTertiary, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  deadlineBlock: { width: '100%', maxWidth: 320, gap: 10 },
  deadlineLabel: { color: palette.textTertiary, fontSize: 12, letterSpacing: 1, fontWeight: '700' },
  deadlineRow: { flexDirection: 'row', gap: 8 },
  deadlineInput: { flex: 1, fontSize: 14.5, paddingVertical: 13 },
  deadlinePreview: { color: palette.accent, fontSize: 13, lineHeight: 19 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
