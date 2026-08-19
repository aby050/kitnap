import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

/** Plays back at unlock #4 and above. A user's own voice at 11pm beats every
 *  motivational quote ever written, and no competitor can clone it. Doubles as
 *  the re-record screen from Settings — same component, different framing. */
export default function FutureSelfScreen({
  initialMessage = '',
  editing = false,
  onContinue,
  onBack,
}: {
  initialMessage?: string;
  editing?: boolean;
  onContinue: (message: string) => void;
  onBack?: () => void;
}) {
  const [text, setText] = useState(initialMessage);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {editing && (
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
            <Text style={styles.headerGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Message to future you</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(450)} style={styles.heading}>
          {editing
            ? 'Still true? Change it any time.'
            : "Right now you're motivated.\nIn three days you won't be."}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(200).duration(450)} style={styles.sub}>
          {editing
            ? "This is what plays back on your 4th unlock of the day, unskippable."
            : "Say something to that version of you. They'll see it at their weakest moment."}
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.inputWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="e.g. please just go to sleep, you'll hate yourself tomorrow"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoFocus={editing}
          />
        </Animated.View>

        <Text style={styles.hint}>Two lines is plenty. It only has to sound like you.</Text>
      </View>

      <View style={styles.ctaWrap}>
        <GradientButton
          label={editing ? 'Save' : text.trim() ? 'Save it' : 'Continue'}
          onPress={() => onContinue(text.trim())}
        />
        {!editing && (
          <Pressable onPress={() => onContinue('')} style={styles.skipBtn} hitSlop={10}>
            <Text style={styles.skipText}>Skip — I'll do it later</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { flex: 1, color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, gap: 18 },
  heading: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', lineHeight: 33 },
  sub: { color: colors.textDim, fontSize: 16, textAlign: 'center', lineHeight: 23 },
  inputWrap: { marginTop: 10 },
  input: {
    minHeight: 130,
    borderRadius: 22,
    backgroundColor: colors.pillBg,
    color: colors.text,
    fontSize: 16,
    padding: 18,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  hint: { color: colors.textFaint, fontSize: 13.5, textAlign: 'center' },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 12 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
});
