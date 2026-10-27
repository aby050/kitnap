import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { getVideoLayer } from '../components/videoLayer';
import { fonts } from '../design/tokens';

const CLIP = require('../../assets/intro/meadow.mp4');

/** The last beat of setup, in the same full-bleed style as the intro. */
export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const Video = getVideoLayer();
  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(600)} style={StyleSheet.absoluteFill}>
        {Video ? <Video source={{ uri: Asset.fromModule(CLIP).uri }} contentFit="fill" /> : <View style={styles.fallback} />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,48,32,0.45)' }]} />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Text style={styles.eyebrow}>YOU ARE READY</Text>
        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeInDown.delay(300).duration(520)}>
          <Text style={styles.title}>Lock the apps. Go find the sun.</Text>
          <Text style={styles.body}>
            Pick a length and press Start. The apps you chose stay shut until it ends, and the world is waiting outside.
          </Text>
        </Animated.View>
        <Pressable style={styles.cta} onPress={onDone} accessibilityLabel="Continue">
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1712' },
  fallback: { flex: 1, backgroundColor: '#12301F' },
  safe: { flex: 1, paddingHorizontal: 20 },
  eyebrow: { marginTop: 22, color: '#fff', fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2 },
  title: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.7, marginBottom: 10 },
  body: { color: 'rgba(255,255,255,0.86)', fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, marginBottom: 24 },
  cta: { height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ctaText: { color: '#0E2A1C', fontFamily: fonts.semibold, fontSize: 15 },
});
