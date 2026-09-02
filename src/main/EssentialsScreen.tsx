import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ESSENTIALS, EssentialKey } from '../data/gateQuestions';
import { Card, Divider, Editorial, Row, Screen, ScreenHeader } from '../design/primitives';
import Icon from '../ui/Icon';
import { motion, palette, radius, space, type } from '../design/tokens';
import Toggle from '../design/Toggle';

/** Ships default-on with banking and OTP apps whitelisted — a blocked OTP is a
 *  failed payment and a one-star review. */
export default function EssentialsScreen({
  enabled,
  onChange,
  onBack,
}: {
  enabled: Record<EssentialKey, boolean>;
  onChange: (next: Record<EssentialKey, boolean>) => void;
  onBack: () => void;
}) {

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
            <Animated.View key={e.key} entering={FadeInDown.delay(i * 36).duration(motion.transition)}>
              {i > 0 && <Divider inset={54} />}
              <Row
                icon={e.mark}
                iconColor={enabled[e.key] ? palette.accent : palette.textSecondary}
                title={e.name}
                subtitle={e.note || undefined}
                right={
                  <Toggle
                    value={enabled[e.key]}
                    onValueChange={(v) => onChange({ ...enabled, [e.key]: v })}
                    accessibilityLabel={e.name}
                  />
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
            Every block screen has an Emergency button in the corner. It shows whichever of these you have
            switched on — nothing else — so the way out stays short. Emergency calls work during every block
            at every intensity; that part is enforced by the OS, not by us.
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
