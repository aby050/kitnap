import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ambience, BANDS, inBand, mediaFor } from '../data/ambiences';
import { motion, radius, space, type } from '../design/tokens';
import { tapLight } from '../ui/haptics';
import Icon from '../ui/Icon';

const CARD_H = 208;

function label(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function AmbienceCard({ item, onStart }: { item: Ambience; onStart: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { still } = mediaFor(item.key);

  return (
    <Animated.View style={[styles.wrap, anim]}>
      <Pressable
        onPress={() => {
          tapLight();
          onStart();
        }}
        onPressIn={() => {
          scale.value = withTiming(0.975, { duration: motion.instant });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, motion.spring);
        }}
        style={styles.press}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${label(item.minutes)}. ${item.intent}`}
      >
        {/* The wash is the base layer, not a placeholder that gets swapped
         *  out: the still sits on top of it when there is one, so a room
         *  without footage is a designed card rather than an empty one. */}
        <LinearGradient
          colors={item.wash}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {still ? <Image source={still} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}

        {/* Scrim. Without it the title sits on whatever the footage happens to
         *  be doing that frame, which is unreadable on bright stills. */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.78)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.markTile}>
          <Icon name={item.mark} size={16} color="#FFFFFF" strokeWidth={1.8} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Icon name="clock" size={12} color="rgba(255,255,255,0.82)" strokeWidth={1.9} />
            <Text style={styles.meta}>{label(item.minutes)}</Text>
          </View>
          <View style={styles.startPill}>
            <Icon name="play" size={11} color="#0B0D10" strokeWidth={2.2} />
            <Text style={styles.startText}>Start</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * The whole focus module: every room, banded by how long it runs.
 *
 * Banded by length rather than by mood, because the first thing a person
 * knows is how much time they have — mood only narrows it afterwards. It is a
 * grid rather than the two horizontal carousels this category ships, which
 * hide most of what they offer one swipe off-screen.
 */
export function AmbienceShelf({ onStart }: { onStart: (a: Ambience) => void }) {
  return (
    <View>
      {BANDS.map((band) => {
        const rooms = inBand(band.key);
        if (rooms.length === 0) return null;
        return (
          <View key={band.key} style={styles.band}>
            <Text style={type.overline}>{band.title}</Text>
            <Text style={[type.sub, styles.bandSub]}>{band.sub}</Text>
            <View style={styles.grid}>
              {rooms.map((a) => (
                <View key={a.key} style={styles.cell}>
                  <AmbienceCard item={a} onStart={() => onStart(a)} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { marginTop: space.xl },
  bandSub: { marginTop: space.xxs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.md, marginHorizontal: -5 },
  cell: { width: '50%', paddingHorizontal: 5, paddingBottom: 10 },
  wrap: { height: CARD_H },
  press: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'flex-end' },
  markTile: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 13 },
  title: { color: '#FFFFFF', fontSize: 16.5, fontWeight: '800', letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meta: { color: 'rgba(255,255,255,0.82)', fontSize: 12.5, fontWeight: '600' },
  startPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 11,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: '#F6F8FA',
  },
  startText: { color: '#0B0D10', fontSize: 13, fontWeight: '700' },
});
