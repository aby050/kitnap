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
  bailoutBalance = 0,
  onDone,
  onMinimize,
}: {
  minutes: number;
  emergency?: boolean;
  /** Shared with the Dynamic-Island-style pill so the countdown survives leaving this screen. */
  expiresAt: number;
  bailoutBalance?: number;
  onDone: () => void;
  onMinimize?: () => void;
}) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
  const [confirmEarly, setConfirmEarly] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const total = emergency ? 15 * 60 : Math.max(1, minutes * 60);
  const progress = Math.max(0, Math.min(1, remaining / total));
  const canBailout = emergency || bailoutBalance > 0;
  const noun = bailoutBalance === 1 ? 'Bailout' : 'Bailouts';

  return (
    <Screen edges={['top', 'bottom']} bloom>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.glyphTile}>
          <Icon name={emergency ? 'key' : 'hourglass'} size={30} color={palette.accent} strokeWidth={1.7} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(120).duration(400)} style={styles.headline}>
          {emergency ? 'Everything is open for 15 minutes.' : `${minutes} minutes.`}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(220).duration(400)} style={styles.sub}>
          {emergency
            ? 'No questions. Nothing logged against you. Go handle it.'
            : 'The world will remember, and it recovers.'}
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
            <Button label="Continue in app" iconRight="chevronDown" variant="primary" onPress={onMinimize} />
            <Text style={styles.hint}>
              Keep using Byre. We'll notify you when this unlock ends and apps lock again.
            </Text>
          </>
        )}
        <Button
          label={emergency ? 'Done early' : canBailout ? 'Done early · uses 1 Bailout' : 'No Bailouts left'}
          variant="ghost"
          disabled={!canBailout}
          onPress={() => (emergency ? onDone() : setConfirmEarly(true))}
        />
      </View>

      <Modal visible={confirmEarly} transparent animationType="fade" onRequestClose={() => setConfirmEarly(false)}>
        <View style={styles.confirmOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmEarly(false)} />
          <Animated.View entering={FadeIn.duration(200)} style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>End this unlock early?</Text>
            <Text style={styles.confirmBody}>
              Apps lock again now. That uses <Text style={styles.confirmAccent}>1 Bailout</Text>.
              {'\n'}You have {bailoutBalance} {noun}.
            </Text>
            <Button
              label="Use 1 Bailout and lock now"
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
