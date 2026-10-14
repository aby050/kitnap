import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientButton } from '../components/ui';
import { palette } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

/** Every promise here maps to a top-frequency 1★/2★ complaint against the
 *  incumbents. Saying it out loud in onboarding inoculates us against the
 *  exact reviews that damage them most. */
const PROMISES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'door',
    title: 'You can turn this off in Settings, any time',
    body: "We're not going to pretend otherwise. This works because you want it to — so we make wanting it easier.",
  },
  {
    icon: 'phoneOff',
    title: 'No ads. Not on the free tier, not ever',
    body: 'An app that sells your attention back to advertisers cannot also be the thing protecting it.',
  },
  {
    icon: 'lock',
    title: Platform.OS === 'android' ? 'Accessibility is used for one thing only' : 'No VPN, no device-admin, no accessibility spying',
    body:
      Platform.OS === 'android'
        ? 'To notice which app just opened, so the block screen can appear. It never reads your screen, your typing or your messages.'
        : "We use Apple's sanctioned Screen Time API only. Nothing runs in the background eating your data plan.",
  },
  {
    icon: 'bars',
    title: 'Your data never leaves this device',
    body: 'No account. No cloud. We literally cannot see which apps you picked — Apple gives us opaque tokens, not names.',
  },
  {
    icon: 'alert',
    title: 'Emergency access is free and instant, forever',
    body: 'One tap, zero questions, no payment. We will never charge you at your moment of weakness.',
  },
  {
    icon: 'trash',
    title: 'One tap to uninstall',
    body: 'No hostage-taking, no hidden deactivation flow. If you want to leave, leave.',
  },
  {
    icon: 'message',
    title: 'Nothing preachy on your block screen',
    body: 'No scripture, no politics. You choose the voice, and you can write it yourself.',
  },
  {
    icon: 'card',
    title: 'What you get free stays free',
    body: "We will never move a feature you already use behind a paywall in an update.",
  },
];

export default function TrustPromiseScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Before we start, here's what we{'\n'}promise not to do.
        </Animated.Text>

        {PROMISES.map((p, i) => (
          <Animated.View key={p.title} entering={FadeInDown.delay(60 * i).duration(380)} style={styles.row}>
            <View style={styles.glyphBox}>
              <Icon name={p.icon} size={19} color={palette.accent} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.body}>{p.body}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.ctaWrap}>
        <GradientButton label="Got it" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10 },
  heading: { color: palette.text, fontSize: 25, fontWeight: '800', textAlign: 'center', lineHeight: 33, marginBottom: 28 },
  row: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  glyphBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.text, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { color: palette.textSecondary, fontSize: 14, lineHeight: 20.5, marginTop: 5 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
});
