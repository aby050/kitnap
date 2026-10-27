import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { getVideoLayer } from './videoLayer';

const CLIPS = [
  require('../../assets/intro/meadow.mp4'),
  require('../../assets/intro/canopy.mp4'),
  require('../../assets/intro/slide3.mp4'),
  require('../../assets/intro/dusk.mp4'),
];

/**
 * A looping nature clip behind the running timer. One clip per session, picked
 * when the screen mounts, with a dark wash so the digits stay readable. Renders
 * nothing where the video layer is unavailable, leaving the ground gradient.
 */
export default function SessionBackdrop() {
  const [clip] = useState(() => CLIPS[Math.floor(Math.random() * CLIPS.length)]);
  const Video = getVideoLayer();
  if (!Video) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Video source={{ uri: Asset.fromModule(clip).uri }} contentFit="fill" />
      <View style={[StyleSheet.absoluteFill, styles.wash]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wash: { backgroundColor: 'rgba(4,16,10,0.5)' },
});
