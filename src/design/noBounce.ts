import { AnimationCallback, Easing, withTiming } from 'react-native-reanimated';

/**
 * Drop-in for Reanimated's `withSpring`, without the spring. The app moves
 * with calm ease-outs only: no overshoot, no bounce. The spring config is
 * accepted and ignored so call sites stay unchanged.
 */
export function withSpring(toValue: number, _config?: unknown, callback?: AnimationCallback) {
  'worklet';
  return withTiming(toValue, { duration: 280, easing: Easing.out(Easing.cubic) }, callback);
}
