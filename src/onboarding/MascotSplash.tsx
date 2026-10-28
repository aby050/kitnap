import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { fonts } from '../design/tokens';

/** The launch intro is the designer's own animation, played once as-is. */
const SPLASH = require('../../assets/splash.gif');
/** The GIF's own background, so its edges disappear into the screen. */
const GIF_BG = '#F9F9F9';
/** One full loop of the GIF (94 frames at 40 ms). */
const LOOP_MS = 3760;
/** Extra beat so the line can be read before the app takes over. */
const READ_MS = 900;

export default function MascotSplash({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();

  useEffect(() => {
    const t = setTimeout(onDone, LOOP_MS + READ_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View exiting={FadeOut.duration(350)} style={styles.root} pointerEvents="none">
      <Image source={SPLASH} style={{ width, height: width * 0.75 }} contentFit="contain" autoplay />
      {/* Lands once the cat has spotted the mouse: the scroll is the cat,
          your time is the mouse. */}
      <Animated.View entering={FadeInDown.delay(1600).duration(600)} style={styles.copy}>
        <Text style={styles.line}>
          Your feed plays cat and mouse.{'\n'}
          <Text style={styles.accent}>Don't let your time get caught.</Text>
        </Text>
      </Animated.View>
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
  copy: { position: 'absolute', bottom: '20%', left: 16, right: 16 },
  line: { color: '#2E3136', fontFamily: fonts.bold, fontSize: 18, lineHeight: 27, textAlign: 'center' },
  accent: { color: '#E8821A' },
});
