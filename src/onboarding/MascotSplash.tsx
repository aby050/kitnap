import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeOut } from 'react-native-reanimated';

/** The launch intro is the designer's own animation, played once as-is. */
const SPLASH = require('../../assets/splash.gif');
/** The GIF's own background, so its edges disappear into the screen. */
const GIF_BG = '#F9F9F9';
/** One full loop of the GIF (94 frames at 40 ms). */
const LOOP_MS = 3760;

export default function MascotSplash({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();

  useEffect(() => {
    const t = setTimeout(onDone, LOOP_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View exiting={FadeOut.duration(350)} style={styles.root} pointerEvents="none">
      <Image source={SPLASH} style={{ width, height: width * 0.75 }} contentFit="contain" autoplay />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GIF_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
