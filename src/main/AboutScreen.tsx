import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import KitnapMark from '../ui/KitnapMark';
import { fonts, palette, space } from '../design/tokens';
import Icon, { IconName } from '../ui/Icon';

const SUPPORT_EMAIL = 'moksha.rva@gmail.com';
const SITE_URL = 'https://phonewise.rvastudio.in';

/**
 * About and contact, written into the app rather than fetched.
 *
 * Terms and Privacy are hosted so the wording can be corrected without a
 * release; these two have no such need and every reason to work offline —
 * "how do I reach a human" is exactly the question someone asks when
 * something is broken, which is often when the network is the thing that is
 * broken.
 */
function LinkRow({
  mark,
  title,
  sub,
  onPress,
  last,
}: {
  mark: IconName;
  title: string;
  sub: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, !last && styles.rowDivider]}>
      <Icon name={mark} size={19} color={palette.text} strokeWidth={1.8} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Icon name="chevronRight" size={17} color={palette.textQuaternary} />
    </Pressable>
  );
}

export default function AboutScreen({ onBack }: { onBack: () => void }) {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build =
    Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.brand}>
          <KitnapMark size={96} />
          <Text style={styles.name}>Kitnap</Text>
          <Text style={styles.version}>
            Version {version}
            {build ? ` (${build})` : ''}
          </Text>
        </View>

        <Text style={styles.blurb}>
          Most blockers let you out the moment you push. Kitnap asks for something instead — a few
          real press-ups, counted on camera, or a code only a friend has. The block is the resting
          state, not a mode you have to remember to switch on.
        </Text>

        <Text style={styles.eyebrow}>GET IN TOUCH</Text>
        <View style={styles.group}>
          <LinkRow
            mark="message"
            title="Email us"
            sub={SUPPORT_EMAIL}
            onPress={() =>
              Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `Kitnap ${version}${build ? ` (${build})` : ''}`,
                )}`,
              )
            }
          />
          <LinkRow
            mark="globe"
            title="phonewise.rvastudio.in"
            sub="Help, updates and the full story"
            onPress={() => Linking.openURL(SITE_URL)}
            last
          />
        </View>

        <Text style={styles.footer}>Made by RVA Studio.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.base,
    paddingVertical: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: palette.text, fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingBottom: space.tabClearance },
  brand: { alignItems: 'center', paddingTop: space.lg, gap: 8 },
  name: {
    color: palette.text,
    fontFamily: fonts.extrabold,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 6,
  },
  version: { color: palette.textTertiary, fontSize: 13 },
  blurb: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: space.xl,
    paddingHorizontal: 4,
  },
  eyebrow: {
    color: palette.textTertiary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginTop: space.xxl,
    marginBottom: space.sm,
    marginLeft: 2,
  },
  group: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.hairline,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.hairline },
  rowText: { flex: 1 },
  rowTitle: { color: palette.text, fontSize: 16, fontWeight: '600' },
  rowSub: { color: palette.textTertiary, fontSize: 13, marginTop: 2 },
  footer: {
    color: palette.textQuaternary,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: space.xxxl,
  },
});
