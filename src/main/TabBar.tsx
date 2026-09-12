import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AnimatedIcon from '../ui/AnimatedIcon';
import { IconName } from '../ui/Icon';
import { curves } from '../design/motion';
import { motion, palette } from '../design/tokens';
import { tapLight } from '../ui/haptics';

/**
 * The app's bottom tab bar.
 *
 * The selection indicator is a single pill that *slides* between slots on a
 * spring, the same behaviour as `SegmentedControl` in the design primitives —
 * one moving object reads as navigation, two hard style swaps read as two
 * unrelated buttons turning on and off. The icon lifts and pops as it takes
 * over, the label cross-fades, and the whole item scales under the finger.
 *
 * Everything is `opacity`/`transform` only, so nothing relayouts mid-press.
 */

const PILL_W = 60;
const PILL_H = 32;

export type TabDef<K extends string> = { key: K; label: string; mark: IconName };

export default function TabBar<K extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: TabDef<K>[];
  active: K;
  onSelect: (key: K) => void;
}) {
  const [row, setRow] = React.useState(0);
  const index = Math.max(0, tabs.findIndex((t) => t.key === active));
  const pos = useSharedValue(index);

  React.useEffect(() => {
    pos.value = withSpring(index, motion.snap);
  }, [index, pos]);

  const slot = row / Math.max(1, tabs.length);

  const pill = useAnimatedStyle(() => ({
    opacity: row === 0 ? 0 : 1,
    transform: [{ translateX: slot * pos.value + (slot - PILL_W) / 2 }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setRow(e.nativeEvent.layout.width);

  return (
    <View style={styles.wrap}>
      <View style={styles.bar} onLayout={onLayout}>
        {/* One indicator for the whole bar, positioned absolutely so it can
            travel without the items knowing about it. */}
        <Animated.View style={[styles.pill, pill]} pointerEvents="none" />

        {tabs.map((t) => (
          <TabItem
            key={t.key}
            def={t}
            active={t.key === active}
            onPress={() => {
              tapLight();
              onSelect(t.key);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TabItem<K extends string>({
  def,
  active,
  onPress,
}: {
  def: TabDef<K>;
  active: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(0);

  const item = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.06 }],
  }));

  const down = () => {
    press.value = withTiming(1, { duration: motion.instant, easing: curves.standard });
  };
  const up = () => {
    press.value = withSpring(0, motion.snap);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={down}
      onPressOut={up}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={def.label}
    >
      <Animated.View style={[styles.itemInner, item]}>
        <View style={styles.iconSlot}>
          <AnimatedIcon
            name={def.mark}
            size={21}
            color={palette.textTertiary}
            activeColor={palette.accent}
            active={active}
            lift={1.5}
            // Changes from undefined → the key when this tab takes over, which
            // is the one moment worth a pop. Going inactive is silent.
            pop={active ? def.key : undefined}
          />
        </View>
        <TabLabel label={def.label} active={active} />
      </Animated.View>
    </Pressable>
  );
}

/** Two stacked copies cross-faded, rather than a colour/weight swap. Swapping
 *  `fontWeight` reflows the text box and makes the label jump a pixel. */
function TabLabel({ label, active }: { label: string; active: boolean }) {
  const on = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    on.value = withTiming(active ? 1 : 0, { duration: motion.enter, easing: curves.standard });
  }, [active, on]);

  const dim = useAnimatedStyle(() => ({ opacity: 1 - on.value }));
  const lit = useAnimatedStyle(() => ({ opacity: on.value }));

  return (
    <View>
      <Animated.Text style={[styles.label, dim]}>{label}</Animated.Text>
      <Animated.Text style={[styles.label, styles.labelActive, StyleSheet.absoluteFill, lit]}>
        {label}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 14, 11, 0.94)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 28,
    paddingTop: 10,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    backgroundColor: palette.accentSoft,
    borderWidth: 1,
    borderColor: palette.accentBorder,
  },
  item: { flex: 1 },
  itemInner: { alignItems: 'center', justifyContent: 'center' },
  iconSlot: { height: PILL_H, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  label: {
    color: palette.textTertiary,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  labelActive: { color: palette.accent },
});
