import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAware from '../components/KeyboardAware';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ImageManipulator, FlipType, SaveFormat } from 'expo-image-manipulator';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { CardPanel, INK, INK_DIM, INK_FAINT, InkButton, PastelCard, PILL, TINTS } from './PastelCard';
import { GoalData } from '../data/goal';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';
import { tapLight } from '../ui/haptics';

/** Deadlines are stored as "YYYY-MM-DD" strings; the native picker speaks
 *  Date, so these two convert between them. Built from local parts, never
 *  `toISOString()`, which would shift the day across a timezone. */
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
    ? new Date(y, m - 1, d)
    : new Date();
};

const prettyYmd = (s: string) =>
  fromYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

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
  // Android's date picker is a one-shot dialog that dismisses itself; iOS's
  // is inline and needs its own Done. Same shape as ScheduleEditorScreen.
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const onPickDate = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setDatePickerOpen(false);
    if (event.type === 'dismissed' || !date) return;
    setDeadlineDate(toYmd(date));
  };

  /** The front camera previews mirrored, and the file comes back that way
   *  too — so the photo that lands on the shield has their face reversed,
   *  which reads as a stranger. Flip it back once, here, rather than
   *  transforming it at every render site (`ShieldScreen` shows it too).
   *  A failure returns the original: a mirrored photo beats no photo. */
  const unmirror = async (uri: string) => {
    try {
      const ref = await ImageManipulator.manipulate(uri)
        .flip(FlipType.Horizontal)
        .renderAsync();
      const out = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
      return out.uri;
    } catch {
      return uri;
    }
  };

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
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(await unmirror(result.assets[0].uri));
    }
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
    <PastelCard tint={TINTS.mint}>
      <KeyboardAware contentContainerStyle={styles.scrollBody}>
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
                  <Icon name="camera" size={34} color={INK_DIM} strokeWidth={1.6} />
                  <Text style={styles.shotHint}>Tap to take it</Text>
                </View>
              )}
            </Pressable>

            {photoUri ? (
              <Pressable onPress={takePhoto} style={styles.retake} hitSlop={8}>
                <Icon name="refresh" size={14} color={INK} strokeWidth={2} />
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
              color={INK_DIM}
              strokeWidth={2}
            />
          </Pressable>

          {showDetails ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.details}>
              <TextInput
                value={line}
                onChangeText={setLine}
                placeholder="e.g. my evenings back"
                placeholderTextColor={INK_DIM}
                style={styles.input}
                maxLength={80}
              />
              <View style={styles.deadlineRow}>
                <TextInput
                  value={deadlineName}
                  onChangeText={setDeadlineName}
                  placeholder="Exam, launch, trip…"
                  placeholderTextColor={INK_DIM}
                  style={[styles.input, styles.deadlineInput]}
                />
                <Pressable
                  onPress={() => {
                    tapLight();
                    setDatePickerOpen((v) => !v);
                  }}
                  style={[styles.input, styles.deadlineInput, styles.dateField]}
                  accessibilityRole="button"
                  accessibilityLabel={deadlineDate ? `Deadline ${prettyYmd(deadlineDate)}` : 'Pick a deadline date'}
                >
                  <Text style={deadlineDate ? styles.dateValue : styles.datePlaceholder}>
                    {deadlineDate ? prettyYmd(deadlineDate) : 'Pick a date'}
                  </Text>
                </Pressable>
              </View>

              {datePickerOpen && (
                <>
                  <DateTimePicker
                    value={deadlineDate ? fromYmd(deadlineDate) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={onPickDate}
                    themeVariant="light"
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable onPress={() => setDatePickerOpen(false)} style={styles.pickerDone}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </Pressable>
                  )}
                </>
              )}
              {deadlineName.trim() && deadlineDate.trim() ? (
                <Text style={styles.deadlinePreview}>
                  The shield will say things like “{deadlineName.trim()} in 12 days.”
                </Text>
              ) : null}
            </Animated.View>
          ) : null}
        </View>

        <CardPanel>
          <InkButton
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
        </CardPanel>
      </KeyboardAware>
    </PastelCard>
  );
}

const SHOT = 214;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 24, gap: 16 },
  heading: { color: INK, fontSize: 32, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  sub: { color: INK_DIM, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  shotWrap: { alignItems: 'center', gap: 12, marginTop: 6 },
  shot: {
    width: SHOT,
    height: SHOT,
    borderRadius: SHOT / 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(27,27,31,0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shotImg: { width: '100%', height: '100%' },
  shotEmpty: { alignItems: 'center', gap: 10 },
  shotHint: { color: INK_DIM, fontSize: 13.5, fontWeight: '600' },
  retake: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  retakeText: { color: INK, fontSize: 13.5, fontWeight: '700' },
  denied: {
    color: INK_DIM,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 300,
  },
  libraryLink: { color: INK_DIM, fontSize: 13.5, fontWeight: '600' },
  detailsToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  detailsToggleText: { color: INK_DIM, fontSize: 13, fontWeight: '600' },
  details: { width: '100%', maxWidth: 320, gap: 10 },
  input: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    color: INK,
    fontSize: 16,
  },
  scrollBody: { flexGrow: 1, justifyContent: 'center' },
  dateField: { justifyContent: 'center' },
  dateValue: { color: INK, fontSize: 14.5 },
  datePlaceholder: { color: INK_DIM, fontSize: 14.5 },
  pickerDone: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 6 },
  pickerDoneText: { color: INK, fontSize: 15, fontWeight: '700' },
  deadlineRow: { flexDirection: 'row', gap: 8 },
  deadlineInput: { flex: 1, fontSize: 14.5, paddingVertical: 13 },
  deadlinePreview: { color: INK, fontSize: 13, lineHeight: 19 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14 },
});
