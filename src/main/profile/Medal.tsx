import React from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { AchievementDef } from '../../data/progress';

/**
 * An award badge.
 *
 * Real artwork, one file per award. `require` needs a static literal, so this
 * map is written out rather than derived from the id — the trade is that a new
 * award needs a line here, and the compiler will not remind you.
 *
 * The number is painted into each image. That means the art and the rule that
 * unlocks it are only kept in step by hand: change a threshold in
 * `ACHIEVEMENTS` and the badge will keep showing the old number until the file
 * is redrawn.
 */
const BADGE_ART: Record<string, ImageSourcePropType> = {
  // Streak
  'streak-3': require('../../../assets/badges/spark_starter.png'),
  'streak-7': require('../../../assets/badges/the_comeback.png'),
  'streak-14': require('../../../assets/badges/fortnight_flame.png'),
  'streak-30': require('../../../assets/badges/quiet_month.png'),
  'streak-60': require('../../../assets/badges/unbreakable.png'),
  'streak-100': require('../../../assets/badges/century_club.png'),
  // Focus
  'focus-first': require('../../../assets/badges/first_light.png'),
  'focus-10h': require('../../../assets/badges/deep_current.png'),
  'focus-50h': require('../../../assets/badges/iron_hours.png'),
  'focus-100h': require('../../../assets/badges/quiet_century.png'),
  'focus-500h': require('../../../assets/badges/time_architect.png'),
  // Saved
  'saved-1h': require('../../../assets/badges/minute_thief.png'),
  'saved-10h': require('../../../assets/badges/time_thief_hunter.png'),
  'saved-50h': require('../../../assets/badges/hours_reclaimed.png'),
  'saved-100h': require('../../../assets/badges/daylight_keeper.png'),
  // Behaviour
  'hard-1': require('../../../assets/badges/soft_exit.png'),
  'hard-10': require('../../../assets/badges/iron_focus.png'),
  'blocked-100': require('../../../assets/badges/shield_wall.png'),
  'week-1': require('../../../assets/badges/first_week.png'),
  'month-1': require('../../../assets/badges/first_month.png'),
};

export default function Medal({
  def,
  id,
  size = 64,
  locked = false,
}: {
  /** Preferred: identifies which artwork to show. */
  def?: AchievementDef;
  /** Falls back to this when no def is passed. */
  id?: string;
  size?: number;
  locked?: boolean;
  /** Kept so existing call sites compile; the artwork now carries the tier. */
  medal?: AchievementDef['medal'];
}) {
  const art = BADGE_ART[def?.id ?? id ?? ''];

  if (!art) {
    // An award with no artwork yet gets a quiet placeholder rather than a gap,
    // so a missing file is visible in review instead of silently absent.
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.24,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
        }}
      />
    );
  }

  // `contain` guarantees the whole image fits inside the box, and the box sets
  // no background, border or overflow — so nothing in this component can crop
  // the artwork. The small inset keeps the badge off the container's edge so a
  // parent with its own clipping can't shave the rim either.
  const inner = Math.round(size * 0.94);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={art}
        style={{ width: inner, height: inner, opacity: locked ? 0.22 : 1 }}
        resizeMode="contain"
        accessibilityLabel={def?.name}
      />
    </View>
  );
}
