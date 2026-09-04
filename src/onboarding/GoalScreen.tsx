import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoider } from '../components/KeyboardAware';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { GoalData } from '../data/goal';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';
import { tapLight } from '../ui/haptics';

/**
 * The progress photo.
 *
 * Generic quotes are the fallback; the real content is theirs. A face taken
 * *today* is the strongest version of that — it dates the decision, and it is
 * what comes back at them on the shield later. So the camera is the screen,
 * not a side option: we ask them to take one now rather than to go find one.
 * The line and the deadline are still here, folded away underneath, because
 * the shield reads them — but nothing on this screen is required.
 */
export default function GoalScreen({ onContinue }: { onContinue: (goal: GoalData) => void }) {
  const [line, setLine] = useState('');
  const [deadlineName, setDeadlineName] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [denied, setDenied] = useState(false);

  /** The camera, first. A denial isn't a dead end — the library link below
   *  stays, and the whole screen is skippable. */
  const takePhoto = async () => {
    tapLight();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setDenied(true);
      return;
    }
    setDenied(false);
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) setPhotoUri(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    tapLight();
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) setPhotoUri(result.assets[0].uri);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoider>
        <View style={styles.body}>
          <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
            Take your progress photo
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(120).duration(420)} style={styles.sub}>
            Day one, as you are right now. It becomes the face on your block screen — the person
            you were when you decided.
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(240).duration(420)} style={styles.shotWrap}>
            <Pressable onPress={takePhoto} style={styles.shot} accessibilityRole="button">
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.shotImg} />
              ) : (
                <View style={styles.shotEmpty}>
                  <Icon name="camera" size={34} color={palette.textSecondary} strokeWidth={1.6} />
                  <Text style={styles.shotHint}>Tap to take it</Text>
                </View>
              )}
            </Pressable>

            {photoUri ? (
              <Pressable onPress={takePhoto} style={styles.retake} hitSlop={8}>
                <Icon name="refresh" size={14} color={palette.accent} strokeWidth={2} />
                <Text style={styles.retakeText}>Retake</Text>
              </Pressable>
            ) : null}
          </Animated.View>

          {denied ? (
            <Text style={styles.denied}>
              Camera access is off. Turn it on in Settings, or pick a photo you already have.
            </Text>
          ) : null}

          <Pressable onPress={pickFromLibrary} hitSlop={8}>
            <Text style={styles.libraryLink}>Choose from library instead</Text>
          </Pressable>

          {/* Folded away by default: the photo is the ask, these are extras the
              shield can use if they want to give them. */}
          <Pressable onPress={() => setShowDetails((v) => !v)} style={styles.detailsToggle} hitSlop={8}>
            <Text style={styles.detailsToggleText}>
              {showDetails ? 'Hide the extras' : 'Add a line or a deadline'}
            </Text>
            <Icon
              name={showDetails ? 'chevronUp' : 'chevronDown'}
              size={15}
              color={palette.textTertiary}
              strokeWidth={2}
            />
          </Pressable>

          {showDetails ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.details}>
              <TextInput
                value={line}
                onChangeText={setLine}
                placeholder="e.g. my evenings back"
                placeholderTextColor={palette.textTertiary}
                style={styles.input}
                maxLength={80}
              />
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
          ) : null}
        </View>

        <View style={styles.ctaWrap}>
          <GradientButton
            label={photoUri ? 'Continue' : 'Skip for now'}
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
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const SHOT = 214;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 16 },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  sub: { color: palette.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  shotWrap: { alignItems: 'center', gap: 12, marginTop: 6 },
  shot: {
    width: SHOT,
    height: SHOT,
    borderRadius: SHOT / 2,
    backgroundColor: palette.glass,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shotImg: { width: '100%', height: '100%' },
  shotEmpty: { alignItems: 'center', gap: 10 },
  shotHint: { color: palette.textTertiary, fontSize: 13.5, fontWeight: '600' },
  retake: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  retakeText: { color: palette.accent, fontSize: 13.5, fontWeight: '700' },
  denied: {
    color: palette.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 300,
  },
  libraryLink: { color: palette.textSecondary, fontSize: 13.5, fontWeight: '600' },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  detailsToggleText: { color: palette.textTertiary, fontSize: 13, fontWeight: '600' },
  details: { width: '100%', maxWidth: 320, gap: 10 },
  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: palette.glass,
    color: palette.text,
    fontSize: 16,
  },
  deadlineRow: { flexDirection: 'row', gap: 8 },
  deadlineInput: { flex: 1, fontSize: 14.5, paddingVertical: 13 },
  deadlinePreview: { color: palette.accent, fontSize: 13, lineHeight: 19 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
