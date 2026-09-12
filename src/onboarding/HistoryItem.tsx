import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

export default function HistoryItem({ prompt, label }: { prompt: string; label: string }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} layout={LinearTransition.duration(280)} style={styles.wrap}>
      <Text style={styles.prompt} numberOfLines={1}>
        {prompt}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 18 },
  prompt: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500', maxWidth: 280, textAlign: 'center' },
  label: { color: 'rgba(76,158,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 2 },
});
