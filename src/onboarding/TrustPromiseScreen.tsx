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
    body:
      Platform.OS === 'android'
        ? 'No account. No cloud. The app name is checked on your phone and discarded straight after.'
        : 'No account. No cloud. We literally cannot see which apps you picked — Apple gives us opaque tokens, not names.',
  },
  {
    icon: 'alert',
    title: 'Emergency access is free and instant, forever',
    body: 'One tap, zero questions, no payment. We will never charge you at your moment of weakness.',
  },
];

export default function TrustPromiseScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(420)} style={styles.heading}>
          Five promises,{'\n'}before we start.
        </Animated.Text>

        {PROMISES.map((p, i) => (
          <Animated.View key={p.title} entering={FadeInDown.delay(60 * i).duration(380)} style={styles.row}>
            <Text style={styles.num}>{String(i + 1).padStart(2, '0')}</Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: palette.onColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.onColorBorder,
  },
  num: { position: 'absolute', top: 8, right: 14, color: 'rgba(255,255,255,0.28)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  glyphBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: palette.text, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20.5, marginTop: 5 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 14, paddingTop: 8 },
});
