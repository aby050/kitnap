import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { THEMES, ThemeKey } from '../data/themes';
import { palette } from '../design/tokens';

const { width } = Dimensions.get('window');

// High-fidelity Svg illustrations representing premium misty nature backdrops (removing emoji icons)
function ThemeCardArtwork({ themeKey }: { themeKey: ThemeKey }) {
  const getArt = () => {
    switch (themeKey) {
      case 'deepWork':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Deep Work: Misty Pine Forest */}
            <Path d="M -10 200 L 25 130 L 60 200 Z" fill="#143029" opacity={0.35} />
            <Path d="M 110 200 L 135 140 L 160 200 Z" fill="#143029" opacity={0.3} />
            <Path d="M 35 200 L 75 110 L 115 200 Z" fill="#0d241e" opacity={0.65} />
            <Path d="M 65 200 L 100 130 L 135 200 Z" fill="#081814" opacity={0.5} />
          </Svg>
        );
      case 'health':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Health & Sleep: Twilight Hills & Crescent Moon */}
            <Path d="M -20 180 Q 40 140, 100 180 T 220 170 T 300 200 L 300 210 L -20 210 Z" fill="#080a14" opacity={0.9} />
            <Path d="M -20 195 Q 60 160, 130 195 T 300 190 L 300 210 L -20 210 Z" fill="#030407" />
            <Path d="M 125 45 A 14 14 0 1 0 143 63 A 12 12 0 1 1 125 45" fill="#FFE082" />
            <Circle cx="35" cy="40" r="1" fill="white" opacity={0.6} />
            <Circle cx="60" cy="25" r="0.8" fill="white" opacity={0.4} />
            <Circle cx="80" cy="80" r="1.3" fill="white" opacity={0.5} />
          </Svg>
        );
      case 'presence':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Presence: Sapa Valley rolling hills and a single tree */}
            <Path d="M -20 155 Q 50 120, 110 165 T 220 140 L 220 210 L -20 210 Z" fill="#4e802b" opacity={0.7} />
            <Path d="M -20 175 Q 60 135, 130 180 T 220 165 L 220 210 L -20 210 Z" fill="#2d5718" />
            {/* Single tree center left (x=70) */}
            <Path d="M 70 140 L 70 156" stroke="#163009" strokeWidth="2.2" />
            <Circle cx="70" cy="128" r="11" fill="#1b5e20" />
            <Circle cx="64" cy="131" r="8" fill="#0f3c13" />
            <Circle cx="76" cy="131" r="8" fill="#388e3c" />
          </Svg>
        );
      case 'craft':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Craft: Blossoming grass blowing in the wind */}
            {/* Stem 1 */}
            <Path d="M 30 205 Q 40 130, 68 55" stroke="#00796b" strokeWidth="1.5" fill="none" />
            <Path d="M 68 55 Q 62 60, 66 65 Z" fill="#00796b" />
            <Path d="M 62 70 Q 56 75, 60 80 Z" fill="#00796b" />
            <Path d="M 57 85 Q 51 90, 55 95 Z" fill="#00796b" />
            <Path d="M 52 100 Q 46 105, 50 110 Z" fill="#00796b" />

            {/* Stem 2 */}
            <Path d="M 70 205 Q 82 110, 108 35" stroke="#004d40" strokeWidth="1.8" fill="none" />
            <Path d="M 108 35 Q 102 40, 106 45 Z" fill="#004d40" />
            <Path d="M 102 50 Q 96 55, 100 60 Z" fill="#004d40" />
            <Path d="M 96 65 Q 90 70, 94 75 Z" fill="#004d40" />
            <Path d="M 90 80 Q 84 85, 88 90 Z" fill="#004d40" />
          </Svg>
        );
      case 'learning':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Learning: Sunrise over misty mountains */}
            <Path d="M -10 200 L 50 120 L 110 200 L 170 110 L 220 200 Z" fill="#8d6e63" opacity={0.5} />
            <Path d="M -10 200 L 75 140 L 140 200 L 205 130 L 220 200 Z" fill="#5d4037" opacity={0.75} />
            {/* Rising sun rays */}
            <Circle cx="140" cy="200" r="24" fill="#fff9c4" opacity={0.5} />
            <Line x1="140" y1="200" x2="95" y2="135" stroke="#fff9c4" strokeWidth="2.2" opacity={0.35} />
            <Line x1="140" y1="200" x2="185" y2="135" stroke="#fff9c4" strokeWidth="2.2" opacity={0.35} />
            <Line x1="140" y1="200" x2="140" y2="115" stroke="#fff9c4" strokeWidth="2.2" opacity={0.35} />
          </Svg>
        );
      case 'quiet':
        return (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Quiet: Calm mist ocean waves & foggy sun */}
            <Circle cx="120" cy="95" r="20" fill="#ffffff" opacity={0.7} />
            <Path d="M 0 155 Q 40 153, 80 155 T 160 155 T 220 155" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
            <Path d="M 0 170 Q 40 168, 80 170 T 160 170 T 220 170" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" opacity={0.7} />
          </Svg>
        );
      default:
        return null;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {getArt()}
    </View>
  );
}

export default function ThemePickerScreen({
  onContinue,
  suggested,
}: {
  onContinue: (key: ThemeKey) => void;
  suggested?: ThemeKey;
}) {
  const [selected, setSelected] = useState<ThemeKey>(suggested ?? 'quiet');
  const theme = THEMES.find((t) => t.key === selected)!;

  // Custom light pastel nature palettes matching the mockup cards (misty greens, creams, soft golds)
  // Health & Sleep remains twilight dark night palette to match sleep theme
  const getThemePalette = (key: ThemeKey): [string, string] => {
    switch (key) {
      case 'deepWork':
        return ['#d1e2db', '#a4beb5']; // misty teal green
      case 'health':
        return ['#1c2035', '#0a0c18']; // twilight dark blue
      case 'presence':
        return ['#e4efe0', '#c8e2c4']; // rolling hills light green
      case 'craft':
        return ['#fff9e6', '#c9ece7']; // Blossoming Grass cream-teal
      case 'learning':
        return ['#fff2df', '#ffdfb0']; // sunrise gold-peach
      case 'quiet':
        return ['#eaeaea', '#cfdbdb']; // calm mist white-grey
      default:
        return ['#ffffff', '#ffffff'];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
        What are you protecting?
      </Animated.Text>
      <Text style={styles.sub}>This changes what the block screen says to you.</Text>
      {suggested && (
        <Text style={styles.suggestedNote}>Suggested from what you said you'd rather be doing</Text>
      )}

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {THEMES.map((t, i) => {
          const active = t.key === selected;
          const palette = getThemePalette(t.key);
          const isDarkText = t.key !== 'health'; // Twilight is dark, others are light misty nature cards!
          
          const titleColor = isDarkText ? '#0f2d24' : '#ffffff';
          const descColor = isDarkText ? 'rgba(15,45,36,0.65)' : 'rgba(255,255,255,0.7)';

          return (
            <Animated.View key={t.key} entering={FadeIn.delay(i * 50).duration(320)} style={styles.cell}>
              <Pressable onPress={() => setSelected(t.key)} style={[styles.card, active && styles.cardActive]}>
                {/* Background color gradient */}
                <LinearGradient colors={palette} style={StyleSheet.absoluteFill} />
                
                {/* Visual Svg nature backdrop */}
                <ThemeCardArtwork themeKey={t.key} />
                
                {/* Soft bottom shading overlay */}
                <LinearGradient 
                  colors={['transparent', isDarkText ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.4)']} 
                  start={{ x: 0.5, y: 0.4 }} 
                  end={{ x: 0.5, y: 1 }} 
                  style={StyleSheet.absoluteFill} 
                />

                {/* Content: Title & Description only (no emoji icons) */}
                <View style={styles.textContainer}>
                  <Text style={[styles.cardName, { color: titleColor }]}>{t.name}</Text>
                  <Text style={[styles.cardFor, { color: descColor }]} numberOfLines={2}>
                    {t.forWho}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Animated.View key={selected} entering={FadeIn.duration(300)} style={styles.preview}>
        <Text style={styles.previewLabel}>YOUR BLOCK SCREEN WILL SAY</Text>
        <Text style={styles.previewLine}>“{theme.lines[0]}”</Text>
      </Animated.View>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={() => onContinue(selected)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', marginTop: 24, paddingHorizontal: 28 },
  sub: { color: palette.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 8, paddingHorizontal: 34, lineHeight: 21 },
  suggestedNote: { color: palette.accent, fontSize: 12.5, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 20 },
  cell: { width: '50%', padding: 6 },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
    height: 200, // highly vertical, not square!
    justifyContent: 'flex-end',
    borderWidth: 2.2,
    borderColor: 'transparent',
  },
  cardActive: { 
    borderColor: palette.accent, // active accent border outline
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 5,
  },
  textContainer: {
    zIndex: 3,
  },
  cardName: { fontSize: 18, fontWeight: '800' },
  cardFor: { fontSize: 12.5, marginTop: 4, lineHeight: 16.5, fontWeight: '600' },
  preview: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  previewLabel: { color: palette.textTertiary, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  previewLine: { color: palette.accent, fontSize: 17, fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 24 },
  ctaWrap: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 },
});
