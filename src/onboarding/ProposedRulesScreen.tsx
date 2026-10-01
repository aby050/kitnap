import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View, Pressable, Modal, TouchableOpacity } from 'react-native';
import { CONTENT_H, CONTENT_W } from '../layout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Line, Rect } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon from '../ui/Icon';

const width = CONTENT_W;
const height = CONTENT_H;

/**
 * Onboarding step, shown right after Intensity, before Future-Self.
 *
 * Generates a default *recurring schedule* — not the per-app unlock
 * difficulty — as a starting point the user can review and edit before it
 * ever takes effect: pre-canned blocking windows (work hours, sleep,
 * weekends, family dinner, a mindful break every 90 min). Tapping a card
 * opens a detail modal explaining what it does; the checkbox toggles it
 * on/off before Continue. All five are enabled by default and nothing here
 * is destructive — declining a rule just leaves that window unguarded.
 * The actual schedule editor for later changes lives in
 * `ScheduleEditorScreen`; this is only the first-run proposal.
 */
type Rule = {
  id: string;
  time: string;
  name: string;
  action: string;
  tint: readonly [string, string, ...string[]];
  description: string;
  textColor: string;
};

const RULES: Rule[] = [
  {
    id: 'work',
    time: '9:00 AM – 5:00 PM',
    name: 'Work Time',
    action: 'Block',
    tint: ['#fff4d4', '#e2c67e'], // cream-yellow gradient
    description: "Holds back social, games and video during your working hours, so the day doesn't disappear into your phone.",
    textColor: '#2e250f',
  },
  {
    id: 'sleep',
    time: '10:00 PM – 7:00 AM',
    name: 'Sleep Mode',
    action: 'Block',
    tint: ['#e4ccff', '#a484e5'], // light purple gradient
    description: 'Puts the feeds away before bed, so the last hour of your day is yours.',
    textColor: '#2c144d',
  },
  {
    id: 'weekend',
    time: 'Sat – Sun',
    name: 'Weekend Zen',
    action: 'Block',
    tint: ['#d1e2db', '#8ab2a2'], // soft green gradient
    description: 'Provides screen detox over the weekends, letting you fully disconnect from notifications and enjoy real-world presence with family.',
    textColor: '#13281e',
  },
  {
    id: 'family',
    time: '7:00 PM – 9:00 PM',
    name: 'Family Time',
    action: 'Block',
    tint: ['#ffdad6', '#dd9992'], // warm coral-red gradient
    description: 'Protects dinner and evening hours to encourage conversations and presence with the people physically in the room with you.',
    textColor: '#3a130f',
  },
  {
    id: 'break',
    time: 'Every 90 min',
    name: 'Mindful Break',
    action: 'Pause',
    tint: ['#e1d3c1', '#b09d84'], // warm sand-brown gradient
    description: 'Triggers a short 5-minute breathing pause after continuous phone use to interrupt doomscrolling impulses and keep screen habits deliberate.',
    textColor: '#2c2214',
  },
];

// High-fidelity Svg Icons replacing the emojis
function RuleIconSvg({ id, color }: { id: string; color: string }) {
  switch (id) {
    case 'work':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
          <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth="2" />
          <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'sleep':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
      );
    case 'weekend':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3a9 9 0 0 0-9 9c0 5 9 9 9 9s9-4 9-9a9 9 0 0 0-9-9z" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M12 3v18" stroke={color} strokeWidth="1.5" />
        </Svg>
      );
    case 'family':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'break':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M6 1v3M10 1v3M14 1v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function ProposedRulesScreen({ name, onContinue }: { name: string; onContinue: () => void }) {
  const [activeRule, setActiveRule] = useState<Rule | null>(null);
  
  // Track selected rules in state (all selected by default)
  const [selectedRules, setSelectedRules] = useState<string[]>(['work', 'sleep', 'weekend', 'family', 'break']);

  const toggleSelect = (id: string) => {
    setSelectedRules((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Title Header */}
      <Animated.Text entering={FadeInDown.duration(450)} style={styles.heading}>
        {name ? `${name}, here` : 'Here'} are the rules I propose for you
      </Animated.Text>
      <Text style={styles.sub}>You can edit this later.</Text>

      {/* Overlapping vertical cards stack */}
      <View style={styles.stackContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {RULES.map((rule, i) => {
            const isFirst = i === 0;
            const isSelected = selectedRules.includes(rule.id);
            return (
              <Animated.View 
                key={rule.name} 
                entering={FadeInDown.delay(i * 100).duration(400)}
                style={[
                  styles.cardWrapper,
                  !isFirst && { marginTop: -42 }, // overlapping offset leaves a lot of space visible
                  { zIndex: i + 1 }
                ]}
              >
                <Pressable 
                  onPress={() => setActiveRule(rule)} 
                  style={styles.card}
                >
                  <LinearGradient 
                    colors={rule.tint} 
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 0.9, y: 0.9 }}
                    style={[StyleSheet.absoluteFill, !isSelected && styles.cardDeselected]} 
                  />
                  {/* Decorative background leaf paths inside card */}
                  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} opacity={0.06}>
                    <Circle cx="280" cy="-20" r="100" stroke="white" strokeWidth="2.5" fill="none" />
                    <Circle cx="300" cy="-20" r="125" stroke="white" strokeWidth="1.5" fill="none" />
                  </Svg>

                  <View style={styles.cardContent}>
                    <View style={styles.cardInfoCol}>
                      {/* Title & Professional SVG Icon */}
                      <View style={styles.cardTitleRow}>
                        <RuleIconSvg id={rule.id} color={rule.textColor} />
                        <Text style={[styles.cardTitle, { color: rule.textColor }]}>
                          {rule.name}
                        </Text>
                      </View>
                      
                      {/* Fully visible details (time, action type) */}
                      <View style={styles.cardMetaRow}>
                        <Icon name="clock" size={13} color={rule.textColor} strokeWidth={2} />
                        <Text style={[styles.cardTime, { color: rule.textColor }]}>{rule.time}</Text>
                      </View>
                      <View style={styles.cardMetaRow}>
                        <Icon name="shield" size={13} color={rule.textColor} strokeWidth={2} />
                        <Text style={[styles.cardAction, { color: rule.textColor }]}>
                          Action: {rule.action}
                        </Text>
                      </View>
                    </View>

                    {/* Circular Selection Checkbox on the right */}
                    <TouchableOpacity
                      style={[
                        styles.selectCheckbox, 
                        { borderColor: rule.textColor },
                        isSelected && { backgroundColor: rule.textColor }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleSelect(rule.id)}
                    >
                      {isSelected && (
                        <Icon name="check" size={13} color={rule.tint[0]} strokeWidth={2.8} />
                      )}
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Continue CTA Button */}
      <View style={styles.ctaWrap}>
        <GradientButton label="Continue" onPress={onContinue} />
      </View>

      {/* Rule details information popup modal */}
      <Modal
        visible={activeRule !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveRule(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setActiveRule(null)}
        >
          <Animated.View entering={FadeIn.duration(200)} style={styles.modalBox}>
            {activeRule && (
              <>
                {/* Shield/Calendar SVG header inside popup */}
                <View style={styles.modalGraphics}>
                  <Svg width={100} height={40} viewBox="0 0 100 40" fill="none">
                    <Rect x="5" y="10" width="20" height="20" rx="4" stroke={palette.accent} strokeWidth="2" fill="none" />
                    <Line x1="10" y1="7" x2="10" y2="12" stroke={palette.accent} strokeWidth="2.2" strokeLinecap="round" />
                    <Line x1="20" y1="7" x2="20" y2="12" stroke={palette.accent} strokeWidth="2.2" strokeLinecap="round" />
                    
                    <Path d="M 36 20 L 54 20" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="3 3" />
                    <Path d="M 50 16 L 55 20 L 50 24" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />

                    <Path d="M74 30s6-3 6-8V15l-6-2-6 2v5c0 5 6 8 6 8z" stroke={palette.accent} strokeWidth="2" fill="none" />
                  </Svg>
                </View>

                <Text style={styles.modalTitle}>{activeRule.name}</Text>
                <View style={styles.modalTimeRow}>
                  <Icon name="clock" size={15} color={palette.textTertiary} strokeWidth={2} />
                  <Text style={styles.modalTime}>{activeRule.time}</Text>
                </View>

                <View style={styles.modalBadgeRow}>
                  <View style={styles.modalActionBadge}>
                    <Text style={styles.modalActionText}>Action: {activeRule.action}</Text>
                  </View>
                  <View style={styles.modalActiveStatus}>
                    <View style={styles.activeDot} />
                    <Text style={styles.modalActiveText}>Active</Text>
                  </View>
                </View>

                <Text style={styles.modalDescription}>
                  {activeRule.description}
                </Text>

                <TouchableOpacity 
                  style={styles.modalBtn}
                  activeOpacity={0.8}
                  onPress={() => setActiveRule(null)}
                >
                  <Text style={styles.modalBtnText}>Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  heading: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 33,
    paddingHorizontal: 28,
    marginTop: 24,
    letterSpacing: -0.5,
  },
  sub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15.5,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  stackContainer: {
    flex: 1,
    marginTop: 22,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    width: width * 0.92,
  },
  cardWrapper: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    width: '100%',
    height: 130, // bigger and longer cards stack size!
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  cardDeselected: {
    opacity: 0.35, // dim cards when deselected
  },
  cardContent: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardTime: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
  },
  cardAction: {
    fontSize: 12.5,
    fontWeight: '700',
    opacity: 0.7,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  selectCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  socialProof: {
    color: palette.accent,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  socialIcon: {
    fontSize: 14,
  },
  ctaWrap: {
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: width * 0.85,
    backgroundColor: '#141517',
    borderRadius: 28,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(111, 227, 169, 0.2)',
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalGraphics: {
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modalTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  modalActionBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  modalActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalActiveStatus: {
    backgroundColor: 'rgba(111, 227, 169, 0.08)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: palette.accent,
  },
  modalActiveText: {
    color: palette.accent,
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  modalBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
