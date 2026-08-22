import * as Haptics from 'expo-haptics';

/** Thin wrappers so call sites don't need to know expo-haptics' API shape,
 *  and so haptics failing (e.g. simulator, web) never throws. */
export const tapLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const tapMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const warning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
