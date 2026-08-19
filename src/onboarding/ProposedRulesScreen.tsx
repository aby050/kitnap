import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { colors } from '../theme';

const { width } = Dimensions.get('window');
const CARD_W = Math.min(width * 0.66, 260);
const GAP = 16;

const RULES = [
  { time: '9:00 AM – 5:00 PM', name: 'Work Time', action: 'Block', emoji: '📖', tint: ['#2b3a44', '#101820'] },
  { time: '10:00 PM – 7:00 AM', name: 'Sleep Mode', action: 'Block', emoji: '🌙', tint: ['#232946', '#0d1020'] },
  { time: 'Sat – Sun', name: 'Weekend Zen', action: 'Block', emoji: '🌿', tint: ['#1e3a2f', '#0a1712'] },
  { time: '7:00 PM – 9:00 PM', name: 'Family Time', action: 'Block', emoji: '🏡', tint: ['#3a2b2b', '#180f0f'] },
  { time: 'Every 90 min', name: 'Mindful Break', action: 'Pause', emoji: '☕', tint: ['#3a3520', '#161206'] },
];

export default function ProposedRulesScreen({ name, onContinue }: { name: string; onContinue: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.Text entering={FadeInDown.duration(450)} style={styles.heading}>
        {name ? `${name}, here` : 'Here'} are the rules I propose for you
      </Animated.Text>
      <Text style={styles.sub}>You can edit this later.</Text>

      <View style={styles.carouselWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP)))}
        >
          {RULES.map((rule, i) => (
            <View key={rule.name} style={[styles.card, i === index && styles.cardActive]}>
              <LinearGradient colors={rule.tint as any} style={StyleSheet.absoluteFill} />
              <View style={styles.cardTop}>
                <Text style={styles.cardCalendar}>🗓</Text>
                <Text style={styles.cardArrow}>→</Text>
                <Text style={styles.cardShield}>🛡</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardTime}>{rule.time}</Text>
                <Text style={styles.cardName}>{rule.name}</Text>
                <Text style={styles.cardAction}>
                  {rule.action} {rule.emoji}
                </Text>
              </View>
              {i === index && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkGlyph}>✓</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.dots}>
        {RULES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.socialProof}>
        <Text style={styles.socialIcon}>👥 </Text>Works for 97% of users like you
      </Text>

      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: 28,
    marginTop: 28,
  },
  sub: { color: colors.textDim, fontSize: 16, textAlign: 'center', marginTop: 10 },
  carouselWrap: { flex: 1, justifyContent: 'center' },
  carouselContent: { paddingHorizontal: (width - CARD_W) / 2, gap: GAP },
  card: {
    width: CARD_W,
    height: CARD_W * 1.12,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 18,
    opacity: 0.55,
  },
  cardActive: { opacity: 1, borderWidth: 2.5, borderColor: '#fff' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCalendar: { fontSize: 22 },
  cardArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 17 },
  cardShield: { fontSize: 22 },
  cardBottom: {},
  cardTime: { color: 'rgba(255,255,255,0.85)', fontSize: 13.5, marginBottom: 4 },
  cardName: { color: colors.text, fontSize: 20, fontWeight: '800' },
  cardAction: { color: colors.textDim, fontSize: 15, marginTop: 3 },
  checkBadge: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { color: '#000', fontSize: 20, fontWeight: '900' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: '#fff' },
  socialProof: { color: colors.accent, fontSize: 15.5, textAlign: 'center', fontWeight: '600' },
  socialIcon: { fontSize: 14 },
  ctaWrap: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 14 },
});
