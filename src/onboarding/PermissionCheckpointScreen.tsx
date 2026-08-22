import React, { useCallback, useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

export type PermissionItem = {
  key: string;
  title: string;
  desc: string;
  granted: boolean;
  onRequest: () => void;
};

function ContinueButton({ label = 'Continue', onPress }: { label?: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, { width: '100%', maxWidth: 300 }]}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 220 }))}
        onPress={onPress}
        style={styles.continueBtn}
      >
        <Text style={styles.continueText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * A small, focused permission ask dropped mid-onboarding — 1-2 items, not a
 * wall of four at once. `checkAll` is polled on mount and again whenever the
 * app regains focus (the only way to know if the user granted something in
 * Settings, since none of these fire a JS event).
 */
export default function PermissionCheckpointScreen({
  heading,
  items,
  checkAll,
  onContinue,
}: {
  heading: string;
  items: PermissionItem[];
  /** Re-reads real OS permission state for every item in `items`. */
  checkAll: () => void;
  onContinue: () => void;
}) {
  const refresh = useCallback(() => {
    checkAll();
  }, [checkAll]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Animated.View entering={FadeInUp.duration(400)} style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.heading}>{heading}</Text>
          <View style={{ height: 26 }} />

          {items.map((item) => (
            <View key={item.key} style={styles.permRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.permTitle}>{item.title}</Text>
                <Text style={styles.permDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={item.granted}
                onValueChange={() => {
                  if (!item.granted) item.onRequest();
                }}
                trackColor={{ true: colors.accent, false: 'rgba(255,255,255,0.2)' }}
                thumbColor="#fff"
              />
            </View>
          ))}

          <View style={{ height: 24 }} />
          <ContinueButton onPress={onContinue} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    maxWidth: 320,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
  },
  permTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  permDesc: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  continueBtn: { width: '100%', paddingVertical: 16, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center' },
  continueText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
