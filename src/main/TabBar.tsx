import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import AnimatedIcon from '../ui/AnimatedIcon';
import { IconName } from '../ui/Icon';
import { curves } from '../design/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion, palette } from '../design/tokens';
import Glass, { liquidGlassAvailable } from '../design/Glass';
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
 *
 * The bar itself is a *floating* glass pill rather than an edge-to-edge slab.
 * That is not decoration: Liquid Glass refracts what passes beneath it, so it
 * only reads as glass when content can actually travel under it on all four
 * sides. A full-width bar pinned to the bottom edge has nothing moving below
 * it and renders as a flat grey band.
 *
 * ⚠️ Because it floats over content rather than reserving space in the layout,
 * every scrolling screen must pad its content by `TAB_BAR_SPACE` or the last
 * row ends up underneath the bar.
 */

const PILL_W = 60;
const PILL_H = 32;

/** Outer inset of the floating bar from the screen edges. */
const SIDE_INSET = 16;
const BOTTOM_GAP = 10;

/** Height the bar occupies, for screens to pad their scroll content by.
 *  Add the bottom safe-area inset on top of this at the call site. */
export const TAB_BAR_SPACE = 78 + BOTTOM_GAP;

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

  /**
   * Press-and-drag across the bar.
   *
   * A tab bar you can only tap is a row of buttons that happens to be made of
   * glass. What makes the iOS 26 bar feel like a physical object is that you
   * can put a finger down and *push* the selection along it — the indicator
   * tracks the finger continuously instead of teleporting between slots, and
   * lets go where you do.
   *
   * `drag` is -1 when nobody is touching (the spring owns the pill) and a
   * pixel x otherwise (the finger owns it). One value, so the two modes can
   * never both drive the transform.
   */
  const drag = useSharedValue(-1);
  /** 0 resting, 1 under the finger — drives the stretch. */
  const held = useSharedValue(0);
  /** Last slot the finger crossed, so the haptic ticks once per tab, not per frame. */
  const lastSlot = useSharedValue(index);

  const slotAt = (x: number) => {
    'worklet';
    if (slot <= 0) return 0;
    return Math.min(tabs.length - 1, Math.max(0, Math.floor(x / slot)));
  };

  const commit = (i: number) => {
    const t = tabs[i];
    if (t && t.key !== active) onSelect(t.key);
  };

  const pan = Gesture.Pan()
    // Long press first, so an ordinary tap still belongs to the tab under it
    // and scrolling past the bar is never hijacked.
    .activateAfterLongPress(180)
    .onStart((e) => {
      held.value = withTiming(1, { duration: 140 });
      drag.value = e.x;
      lastSlot.value = slotAt(e.x);
      runOnJS(tapLight)();
    })
    .onUpdate((e) => {
      drag.value = Math.min(row, Math.max(0, e.x));
      const next = slotAt(drag.value);
      if (next !== lastSlot.value) {
        lastSlot.value = next;
        // A tick per tab crossed: the bar is telling the hand where the
        // detents are, which is what stops this feeling like a slider.
        runOnJS(tapLight)();
        runOnJS(commit)(next);
      }
    })
    .onFinalize(() => {
      const landed = slotAt(drag.value < 0 ? index * slot : drag.value);
      held.value = withTiming(0, { duration: 200 });
      drag.value = -1;
      pos.value = withSpring(landed, motion.snap);
      runOnJS(commit)(landed);
    });

  const pill = useAnimatedStyle(() => {
    const resting = slot * pos.value + (slot - PILL_W) / 2;
    const following = drag.value - PILL_W / 2;
    const x = drag.value < 0 ? resting : Math.min(row - PILL_W, Math.max(0, following));
    return {
      opacity: row === 0 ? 0 : 1,
      transform: [
        { translateX: x },
        // Stretches along the direction of travel while held — the one cue
        // that sells the indicator as something viscous rather than a rect.
        { scaleX: 1 + held.value * 0.14 },
        { scaleY: 1 - held.value * 0.05 },
      ],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => setRow(e.nativeEvent.layout.width);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + BOTTOM_GAP }]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={pan}>
      <Glass
        tone="regular"
        cornerRadius={34}
        // The whole bar reacts to touch as one pane on iOS 26 — the system
        // highlight follows the finger across the glass, which is the effect
        // that makes it feel liquid rather than merely blurred.
        interactive
        style={styles.bar}
        onLayout={onLayout}
      >
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
      </Glass>
      </GestureDetector>
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
            // White, not accent: the accent pill behind the active tab
            // already carries the selection colour, and tinted glyphs on
            // frosted glass lose contrast badly. Brightness does the work.
            color={palette.onColorTextDim}
            activeColor={palette.text}
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
  wrap: {
    position: 'absolute',
    left: SIDE_INSET,
    right: SIDE_INSET,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
    // Only the fallback tiers need a drawn edge; real Liquid Glass renders
    // its own specular rim and a manual border double-draws it.
    ...(liquidGlassAvailable
      ? null
      : {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.16)',
        }),
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 12,
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
    color: palette.onColorTextDim,
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  labelActive: { color: palette.text },
});
