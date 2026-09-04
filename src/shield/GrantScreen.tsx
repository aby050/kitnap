import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Ring, Screen } from '../design/primitives';
import Icon from '../ui/Icon';
import { palette, radius, space, type } from '../design/tokens';

/** No guilt screens, no "are you sure you want to give up", no shattering streak.
 *  Shame produces uninstalls, not behaviour change. */
export default function GrantScreen({
  minutes,
  emergency,
  expiresAt,
  onDone,
  onMinimize,
}: {
  minutes: number;
  emergency?: boolean;
  /** Shared with the Dynamic-Island-style pill so the countdown survives leaving this screen. */
  expiresAt: number;
  onDone: () => void;
  onMinimize?: () => void;
}) {
  const secondsLeft = () => Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
  const [remaining, setRemaining] = useState(secondsLeft);
  const [confirmEarly, setConfirmEarly] = useState(false);

  useEffect(() => {
    setRemaining(secondsLeft());
    const id = setInterval(() => setRemaining(secondsLeft()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const total = Math.max(1, minutes * 60);
  const progress = Math.max(0, Math.min(1, remaining / total));

  return (
    <Screen edges={['top', 'bottom']} bloom>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.glyphTile}>
          <Icon name={emergency ? 'key' : 'hourglass'} size={30} color={palette.accent} strokeWidth={1.7} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(120).duration(400)} style={styles.headline}>
          {emergency ? `Everything is open for ${minutes} minutes.` : `${minutes} minutes.`}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(220).duration(400)} style={styles.sub}>
          {emergency
            ? 'No questions. Nothing logged against you. Go handle it.'
            : 'Already counting down. Go — apps lock again when it hits zero.'}
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.ringWrap}>
          <Ring progress={progress} size={176} thickness={4}>
            <Text style={styles.timerText}>
              {mm}
              <Text style={styles.colon}>:</Text>
              {ss}
            </Text>
            <Text style={[type.overline, styles.remainingCap]}>remaining</Text>
          </Ring>
        </Animated.View>
      </View>

      <View style={styles.ctaWrap}>
        {onMinimize && (
          <>
            <Button label="Got it" iconRight="chevronDown" variant="primary" onPress={onMinimize} />
            <Text style={styles.hint}>
              Your {minutes} minutes are running now, here as much as anywhere. We'll
              notify you when they're up.
            </Text>
          </>
        )}
        <Button
          label="I'm done — lock now"
          variant="ghost"
          onPress={() => (emergency ? onDone() : setConfirmEarly(true))}
        />
      </View>

      <Modal visible={confirmEarly} transparent animationType="fade" onRequestClose={() => setConfirmEarly(false)}>
        <View style={styles.confirmOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmEarly(false)} />
          <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>End this unlock early?</Text>
            <Text style={styles.confirmBody}>
              Apps lock again straight away, and you keep the rest of your time.
            </Text>
            <Button
              label="Lock now"
              variant="danger"
              onPress={() => {
                setConfirmEarly(false);
                onDone();
              }}
            />
            <Button label="Keep the unlock" variant="ghost" onPress={() => setConfirmEarly(false)} />
          </Animated.View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl, gap: space.lg },
  glyphTile: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  headline: { ...type.title1, textAlign: 'center', maxWidth: 320 },
  sub: { ...type.callout, textAlign: 'center', lineHeight: 23, maxWidth: 300 },
  ringWrap: { marginTop: space.sm },
  timerText: { ...type.hero, fontSize: 40, letterSpacing: -1, color: palette.text },
  colon: { color: palette.textTertiary },
  remainingCap: { color: palette.textTertiary, marginTop: space.xs },
  ctaWrap: { paddingHorizontal: space.gutter, paddingBottom: space.lg, gap: space.sm },
  hint: { ...type.caption, color: palette.textTertiary, textAlign: 'center', lineHeight: 18, paddingHorizontal: space.md },
  confirmOverlay: {
    flex: 1,
    backgroundColor: palette.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  confirmBox: {
    width: '100%',
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.xl,
    gap: space.md,
  },
  confirmTitle: { ...type.title2, textAlign: 'center' },
  confirmBody: { ...type.body, color: palette.textSecondary, textAlign: 'center', lineHeight: 22 },
  confirmAccent: { color: palette.warn, fontWeight: '700' },
});
