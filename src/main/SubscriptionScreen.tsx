import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerInfo } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { restorePurchases, ENTITLEMENT_ID } from '../data/purchases';
import { palette, space } from '../design/tokens';

/** Apple and Google both refuse to let an app cancel its own subscription —
 *  the only sanctioned route is the store's own management page, and an app
 *  that hides it fails review. */
const MANAGE_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: '',
}) as string;

const formatDate = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Everything about the subscription, read straight from RevenueCat.
 *
 * Nothing here is stored locally on purpose: the entitlement is the store's
 * to decide, and a cached copy is how an app ends up insisting someone is
 * subscribed a month after they cancelled.
 */
export default function SubscriptionScreen({
  info,
  isPro,
  bailouts,
  onBack,
  onUpgrade,
  onBuyBailouts,
}: {
  info: CustomerInfo | null;
  isPro: boolean;
  bailouts: number;
  onBack: () => void;
  onUpgrade?: () => void;
  onBuyBailouts?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
  const renews = formatDate(entitlement?.expirationDate ?? info?.latestExpirationDate);
  const willRenew = entitlement?.willRenew ?? false;
  const isTrial = entitlement?.periodType === 'TRIAL';

  const restore = async () => {
    setBusy(true);
    const res = await restorePurchases();
    setBusy(false);
    if (res.status === 'success') Alert.alert('Restored', 'Your purchases are back on this device.');
    else if (res.status === 'error') Alert.alert('Nothing to restore', res.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Icon name="chevronLeft" size={20} color={palette.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* The status was a label and one grey line, which on the free plan
            left the whole screen reading as an error state. It carries the
            same aurora card the rest of the app uses, and on the free plan it
            does the job a status card can't: say what Pro is for. */}
        <LinearGradient
          colors={isPro ? ['#080D14', '#0F1A26', '#153458', '#1C5FB8'] : ['#101314', '#171B1A', '#1F2A26']}
          locations={[0, 0.4, 0.76, 1]}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>{isPro ? (isTrial ? 'Free trial' : 'Byre Pro') : 'Free plan'}</Text>
          <Text style={styles.heroValue}>
            {isPro
              ? renews
                ? willRenew
                  ? `Renews ${renews}`
                  : `Ends ${renews}`
                : 'Active'
              : 'Blocking, unlimited'}
          </Text>
          <Text style={styles.heroSub}>
            {isPro
              ? willRenew
                ? 'Cancel any time — everything you built stays.'
                : "You'll keep everything until then, then drop to the free plan."
              : 'Everything below is what a plan adds on top.'}
          </Text>
        </LinearGradient>

        <Text style={styles.section}>{isPro ? "What you've got" : "What a plan adds"}</Text>
        <View style={styles.rows}>
          {PERKS.map((perk, i) => (
            <View key={perk.title} style={[styles.perk, i < PERKS.length - 1 && styles.rowDivider]}>
              <View style={styles.rowIcon}>
                <Icon
                  name={isPro ? 'check' : perk.icon}
                  size={17}
                  color={isPro ? palette.accent : palette.textSecondary}
                  strokeWidth={isPro ? 2.6 : 2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{perk.title}</Text>
                <Text style={styles.rowSub}>{perk.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Bailouts</Text>
        <View style={styles.bailoutCard}>
          <BailoutGlyph size={18} />
          <Text style={styles.bailoutCount}>
            {bailouts} bailout{bailouts === 1 ? '' : 's'} left
          </Text>
          {onBuyBailouts && (
            <Pressable onPress={onBuyBailouts} hitSlop={8}>
              <Text style={styles.link}>Get more</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.section}>Manage</Text>
        <View style={styles.rows}>
          {!isPro && onUpgrade && (
            <Row icon="rocket" title="See plans" subtitle="Trial, monthly or yearly" onPress={onUpgrade} />
          )}
          {isPro && (
            <Row
              icon="settings"
              title="Manage or cancel"
              subtitle={Platform.OS === 'ios' ? 'Opens the App Store' : 'Opens Google Play'}
              onPress={() => {
                if (MANAGE_URL) Linking.openURL(MANAGE_URL);
              }}
            />
          )}
          <Row
            icon="refresh"
            title="Restore purchases"
            subtitle="Moved to a new phone? Tap here."
            onPress={restore}
            busy={busy}
            last
          />
        </View>

        <Text style={styles.note}>
          Byre can't cancel a subscription for you — only the store can. "Manage or cancel" takes you
          straight there, and anything you've already built stays put either way.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  busy,
  last,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
  busy?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} color={palette.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {busy ? (
        <ActivityIndicator color={palette.accent} />
      ) : (
        <Icon name="chevronRight" size={18} color={palette.textTertiary} />
      )}
    </Pressable>
  );
}

/** Stated once, here, rather than as a vague "unlock everything" — a plan
 *  screen that can't name what it sells is why people cancel. */
const PERKS: { icon: React.ComponentProps<typeof Icon>['name']; title: string; desc: string }[] = [
  { icon: 'shield', title: 'Strict mode', desc: 'The physical challenge, not just a quiz.' },
  { icon: 'calendar', title: 'Schedules', desc: 'Recurring windows that block on their own.' },
  { icon: 'target', title: 'Autofocus', desc: 'Byre starts a block when it sees you drifting.' },
  { icon: 'chart', title: 'Screen time insights', desc: 'Your real numbers, day, week and month.' },
  { icon: 'key', title: 'Bailouts every renewal', desc: 'Topped up automatically, never expire.' },
];

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
    borderRadius: 999,
    backgroundColor: palette.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: palette.text, fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: space.base, paddingBottom: 40 },
  hero: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 7 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 13.5, lineHeight: 20, marginTop: 8 },
  section: {
    color: palette.textTertiary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  perk: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  bailoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  bailoutCount: { color: palette.text, fontSize: 15.5, fontWeight: '700', flex: 1 },
  link: { color: palette.accent, fontSize: 14, fontWeight: '700' },
  rows: {
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: palette.hairline },
  rowIcon: { width: 30, alignItems: 'flex-start' },
  rowTitle: { color: palette.text, fontSize: 15.5, fontWeight: '600' },
  rowSub: { color: palette.textSecondary, fontSize: 12.5, marginTop: 2 },
  note: { color: palette.textTertiary, fontSize: 12.5, lineHeight: 19, marginTop: 18, paddingHorizontal: 4 },
});
