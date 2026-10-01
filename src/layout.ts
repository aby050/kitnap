import { Dimensions, Platform } from 'react-native';

/**
 * Phonewise is laid out for a phone held in one hand. On iPad the whole app
 * renders in a centred column of this width (App.tsx), with the background
 * still filling the screen, so every screen keeps its phone proportions
 * instead of stretching across 13 inches.
 *
 * Anything that sizes itself from the window must read CONTENT_W / CONTENT_H
 * from here rather than Dimensions, or it will lay out for the full iPad width
 * while being drawn inside the column.
 */
export const CONTENT_MAX_W = 560;

const window = Dimensions.get('window');

export const IS_TABLET = Platform.OS === 'ios' && Platform.isPad;

export const CONTENT_W = Math.min(window.width, CONTENT_MAX_W);
export const CONTENT_H = window.height;
