import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GateQuestion } from '../data/gateQuestions';
import { colors } from '../theme';
import BreathingExercise from './BreathingExercise';

/**
 * Hard unlock — Level 3. Requires the front camera up and visible reps
 * counted with a tap per rep, not just a held button, so it can't be cleared
 * from a pocket.
 *
 * IMPORTANT SCOPE NOTE: this does NOT do real pose-estimation / automatic
 * movement counting — that needs an on-device ML model (e.g. a vision-camera
 * frame processor running a pose net), which is a separate, substantial
 * native-ML integration and is not implemented here. What this gives you is
 * the full framework — camera permission, live front-camera preview, rep
 * tracking, camera-off = challenge invalid — ready to have real rep
 * detection dropped into `onFrame` later without changing the surrounding
 * unlock flow. Treat it as an honest placeholder, not a finished anti-bypass
 * system.
 */
export default function ActivityChallenge({
  q,
  onDone,
}: {
  q: Extract<GateQuestion, { kind: 'activity' }>;
  onDone: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [reps, setReps] = useState(0);
  const [fellBackToBreathing, setFellBackToBreathing] = useState(false);

  if (fellBackToBreathing) {
    return (
      <BreathingExercise q={{ family: 'F', kind: 'breathe', prompt: 'Two slow breaths before you go in.', cycles: 2 }} onDone={onDone} />
    );
  }

  if (!permission) {
    return (
      <View style={styles.qBody}>
        <Text style={styles.prompt}>Checking camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.qBody}>
        <Text style={styles.prompt}>{q.prompt}</Text>
        <Text style={styles.hint}>
          We need the camera up so this can't be skipped from a pocket. Nothing is recorded or leaves your phone.
        </Text>
        <Pressable onPress={requestPermission} style={styles.cta}>
          <Text style={styles.ctaText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={() => setFellBackToBreathing(true)} hitSlop={10}>
          <Text style={styles.skip}>Prefer not to — do a breathing round instead</Text>
        </Pressable>
      </View>
    );
  }

  const done = reps >= q.reps;

  return (
    <View style={styles.qBody}>
      <Text style={styles.prompt}>{q.prompt}</Text>
      <View style={styles.cameraWrap}>
        <CameraView style={StyleSheet.absoluteFill} facing="front" />
        <View style={styles.repBadge}>
          <Text style={styles.repBadgeText}>
            {reps}/{q.reps}
          </Text>
        </View>
      </View>
      <Text style={styles.hint}>Tap once per {q.activity.replace(/s$/, '')}. Camera stays up the whole time.</Text>
      <Pressable
        disabled={done}
        onPress={() => setReps((r) => Math.min(q.reps, r + 1))}
        style={[styles.repBtn, done && styles.repBtnDisabled]}
      >
        <Text style={styles.repBtnText}>{done ? 'Done' : `Count a rep`}</Text>
      </Pressable>
      <Pressable disabled={!done} onPress={onDone} style={[styles.cta, !done && styles.ctaDisabled]}>
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  qBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 18 },
  prompt: { color: colors.text, fontSize: 23, fontWeight: '700', textAlign: 'center', lineHeight: 31, maxWidth: 320 },
  hint: { color: colors.textFaint, fontSize: 13, textAlign: 'center', maxWidth: 300 },
  cameraWrap: {
    width: 220,
    height: 290,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  repBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  repBadgeText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  repBtn: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(124,245,176,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  repBtnDisabled: { opacity: 0.4 },
  repBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  cta: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.3 },
  ctaText: { color: '#000', fontSize: 16, fontWeight: '700' },
  skip: { color: colors.textFaint, fontSize: 13, textDecorationLine: 'underline' },
});
