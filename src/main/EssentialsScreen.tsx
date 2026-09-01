import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ESSENTIALS } from '../data/gateQuestions';
import { Card, Divider, Editorial, Pill, Row, Screen, ScreenHeader } from '../design/primitives';
import Icon from '../ui/Icon';
import { motion, palette, radius, space, type } from '../design/tokens';

/** Ships default-on with banking and OTP apps whitelisted — a blocked OTP is a
 *  failed payment and a one-star review. */
export default function EssentialsScreen({ onBack }: { onBack: () => void }) {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(ESSENTIALS.map((e) => [e.name, true])),
  );

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="Essentials" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Editorial lead="Some things" emphasis="never get in the way." style={styles.voice} />
        <Text style={[type.callout, styles.intro]}>
          These are never blocked, never counted, and never ask you a question. Emergency calls work during
          every block at every intensity — that part is enforced by the OS, not by us.
        </Text>

        <Card padded={false} style={styles.list}>
          {ESSENTIALS.map((e, i) => (
            <Animated.View key={e.name} entering={FadeInDown.delay(i * 36).duration(motion.transition)}>
              {i > 0 && <Divider inset={54} />}
              <Row
                icon={e.mark}
                iconColor={e.locked ? palette.accent : palette.textSecondary}
                title={e.name}
                subtitle={e.note || undefined}
                right={
                  e.locked ? (
                    <Pill label="Always" icon="lock" tone="accent" />
                  ) : (
                    <Switch
                      value={on[e.name]}
                      onValueChange={(v) => setOn((p) => ({ ...p, [e.name]: v }))}
                      trackColor={{ true: palette.accent, false: palette.border }}
                      thumbColor={palette.text}
                    />
                  )
                }
              />
            </Animated.View>
          ))}
        </Card>

        <Card tone="accent" style={styles.breakGlass}>
          <View style={styles.breakGlassHead}>
            <Icon name="key" size={18} color={palette.accent} strokeWidth={1.8} />
            <Text style={[type.title3, { color: palette.accent }]}>Break-glass</Text>
          </View>
          <Text style={[type.callout, styles.breakGlassBody]}>
            Every block screen has an Emergency button in the corner. One tap unblocks everything for 15
            minutes. Zero questions, no delay, no payment — at every intensity, forever.
          </Text>
          <Text style={[type.sub, styles.breakGlassMeta]}>Used 0 times this week.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.gutter, paddingBottom: space.tabClearance },
  voice: { marginTop: space.sm },
  intro: { marginTop: space.md, marginBottom: space.xl },
  list: { paddingHorizontal: space.base },
  breakGlass: { marginTop: space.xl },
  breakGlassHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  breakGlassBody: { marginTop: space.sm },
  breakGlassMeta: { marginTop: space.md },
});
