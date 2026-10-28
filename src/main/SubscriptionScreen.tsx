import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../ui/Icon';
import BailoutGlyph from '../components/BailoutGlyph';
import { CustomerInfo } from 'react-native-purchases';
import { restorePurchases, ENTITLEMENT_ID, PLAN_BAILOUTS } from '../data/purchases';
import { FREE_EMERGENCY_TOKENS } from '../data/store';
import { palette, space, radius } from '../design/tokens';

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
        {/* The two hero gradients were hardcoded — a blue ramp for Pro and a
            green one for free — so on the mint scheme the Pro card was blue
            and on the blue scheme the free card was green. Both now derive
            from the active accent, which is the same sweep the rest of the
            app sits on. */}
        <LinearGradient
          colors={
            isPro
              ? ['#05070B', '#0C1220', palette.accentPressed, palette.accent]
              : ['#08090B', '#101216', '#1A1D22']
          }
          locations={isPro ? [0, 0.38, 0.78, 1] : [0, 0.5, 1]}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, isPro && styles.heroBadgeOn]}>
              <Icon
                name={isPro ? 'checkCircle' : 'lock'}
                size={13}
                color={isPro ? '#FFFFFF' : palette.textSecondary}
                strokeWidth={2}
              />
              <Text style={[styles.heroBadgeText, isPro && styles.heroBadgeTextOn]}>
                {isPro ? (isTrial ? 'TRIAL' : 'ACTIVE') : 'FREE'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroLabel}>{isPro ? (isTrial ? 'Free trial' : 'Kitnap Pro') : 'Free plan'}</Text>
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
            {/* "until then" needs a `then`. Without a renewal date — a
                restored purchase still syncing, or a lifetime entitlement —
                the sentence pointed at nothing. */}
            {isPro
              ? willRenew
                ? 'Cancel any time — everything you built stays.'
                : renews
                  ? "You'll keep everything until then, then drop to the free plan."
                  : 'Everything below is yours while this is active.'
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
          Kitnap can't cancel a subscription for you — only the store can. "Manage or cancel" takes you
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
/**
 * What a plan adds — and only what it actually adds.
 *
 * This list sold five things. "Autofocus — Kitnap starts a block when it sees
 * you drifting" does not exist anywhere in this codebase and never has; it
 * was a feature invented on a paywall. "Strict mode" and "Screen time
 * insights" are both free and always have been. Selling a feature that does
 * not exist is a straight 2.3.1 rejection and worse than the guideline
 * problem this app was already fighting.
 *
 * What is left is the split PlanCompareScreen has been promising users all
 * along: more bailouts, the guardian code, and more than one schedule.
 */
const PERKS: { icon: React.ComponentProps<typeof Icon>['name']; title: string; desc: string }[] = [
  {
    icon: 'key',
    title: `${PLAN_BAILOUTS.$rc_annual} bailouts a year`,
    desc: `Topped up every renewal. Monthly gets ${PLAN_BAILOUTS.$rc_monthly} a month; the free plan keeps its ${FREE_EMERGENCY_TOKENS} forever.`,
  },
  { icon: 'shield', title: 'Guardian code', desc: 'Someone you trust holds the key to loosening your blocks.' },
  { icon: 'calendar', title: 'Unlimited schedules', desc: 'Recurring windows that block on their own. Free plan gets one.' },
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
  hero: { borderRadius: 26, padding: 20, paddingTop: 16, overflow: 'hidden', minHeight: 168 },
  heroBadgeRow: { flexDirection: 'row', marginBottom: 14 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(46,49,54,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(46,49,54,0.16)',
  },
  heroBadgeOn: {
    backgroundColor: 'rgba(46,49,54,0.18)',
    borderColor: 'rgba(46,49,54,0.4)',
  },
  heroBadgeText: {
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  heroBadgeTextOn: { color: '#2E3136' },
  heroLabel: {
    color: 'rgba(46,49,54,0.7)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroValue: { color: '#2E3136', fontSize: 22, fontWeight: '800', marginTop: 7 },
  heroSub: { color: 'rgba(46,49,54,0.72)', fontSize: 13.5, lineHeight: 20, marginTop: 8 },
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
