import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
  LOG_LEVEL,
  PRODUCT_CATEGORY,
} from 'react-native-purchases';

/** RevenueCat public SDK keys. These are safe to ship — they are the
 *  publishable half of the pair, and RevenueCat validates every receipt
 *  server-side regardless of what the client claims. */
const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '',
};

/** The single entitlement that gates the guardian code and schedules beyond
 *  the first. Strict mode and the screen-time read are free and always have
 *  been; "Autofocus" never existed at all, and this comment naming all three
 *  is how it ended up being sold on the subscription screen.
 *  Must match the identifier created in the RevenueCat dashboard exactly. */
export const ENTITLEMENT_ID = 'byre_pro';

/** Legal pages, linked from the purchase screen.
 *
 *  App Review guideline 3.1.2 requires an auto-renewable subscription to show,
 *  in the binary and next to the purchase: the title, the length, the price,
 *  a link to the privacy policy and a link to the terms. Missing links is one
 *  of the most common rejections there is, and it is entirely avoidable. */
export const PRIVACY_POLICY_URL = 'https://phonewise.rvastudio.in/privacy';
export const TERMS_URL = 'https://phonewise.rvastudio.in/terms';

/** The retention offer shown only when someone declines the main paywall.
 *  A separate RevenueCat offering rather than a discounted price on the same
 *  product, so the discount can be repriced or pulled from the dashboard
 *  without shipping a build. */
export const DISCOUNT_OFFERING_ID = 'discount';

/** Bailout consumables. These deliberately carry NO entitlement in
 *  RevenueCat — a consumable that maps to an entitlement would read as
 *  "permanently unlocked" rather than a balance we decrement ourselves.
 *  We read them out of nonSubscriptionTransactions instead. */
export const BAILOUT_PRODUCTS: Record<string, number> = {
  // These must match the product IDs in App Store Connect exactly. They are
  // `bailout_key` (not `bailout_key1`) and `bailout_key10` (not `_key5`) —
  // a mismatch here doesn't error, it just means the product is never found
  // and the pack silently never appears.
  // iOS (Phonewise). Product ids are unique across an Apple account for
  // ever, so the Byre ids below could not be reused on the new app.
  phonewise_bailout_key: 1,
  phonewise_bailout_key3: 3,
  phonewise_bailout_key10: 10,
  // Google Play, where the listing (and so its product ids) is unchanged.
  bailout_key: 1,
  bailout_key3: 3,
  bailout_key10: 10,
};

export const BAILOUT_PRODUCT_IDS = Object.keys(BAILOUT_PRODUCTS);

let configured = false;

/** Safe to call more than once; only the first call reaches the SDK. */
export async function initPurchases(appUserId?: string): Promise<void> {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
  if (!apiKey) {
    if (__DEV__) console.warn('[purchases] no RevenueCat key set — billing disabled');
    return;
  }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey, appUserID: appUserId ?? null });
  configured = true;
}

export function isConfigured(): boolean {
  return configured;
}

/** Called after Apple sign-in so purchases follow the account across devices. */
export async function identify(appUserId: string): Promise<void> {
  if (!configured) return;
  await Purchases.logIn(appUserId);
}

export async function logOutPurchases(): Promise<void> {
  if (!configured) return;
  await Purchases.logOut();
}

export function hasPro(info: CustomerInfo | null | undefined): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

/** Subscription packages from the `default` offering. Returns null when the
 *  offering is empty — usually a product-id typo, a missing paid-apps
 *  agreement, or products without localization/price in App Store Connect. */
export async function getSubscriptionOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

/** The 50%-off annual offer behind "Not now". Null when the offering hasn't
 *  been configured in RevenueCat — the caller then skips the screen rather
 *  than showing a discount it cannot actually sell. */
export async function getDiscountOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[DISCOUNT_OFFERING_ID] ?? null;
  } catch {
    return null;
  }
}

/** Consumables are fetched by product id — they don't belong in an offering,
 *  since the paywall picks a plan and the bailout screen sells a quantity. */
export async function getBailoutProducts(): Promise<PurchasesStoreProduct[]> {
  if (!configured) return [];
  try {
    return await Purchases.getProducts(BAILOUT_PRODUCT_IDS, PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  } catch {
    return [];
  }
}

export type PurchaseOutcome =
  | { status: 'success'; info: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export async function purchaseSubscription(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: 'success', info: customerInfo };
  } catch (e: any) {
    if (e?.userCancelled) return { status: 'cancelled' };
    return { status: 'error', message: e?.message ?? 'Purchase failed.' };
  }
}

/** Buys a bailout pack and reports how many the pack is worth so the caller
 *  can add them to the local balance. The balance itself stays ours — it is
 *  spent one at a time and RevenueCat has no concept of a decrementing count. */
export async function purchaseBailouts(
  product: PurchasesStoreProduct,
): Promise<PurchaseOutcome & { quantity?: number }> {
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    return {
      status: 'success',
      info: customerInfo,
      quantity: BAILOUT_PRODUCTS[product.identifier] ?? 1,
    };
  } catch (e: any) {
    if (e?.userCancelled) return { status: 'cancelled' };
    return { status: 'error', message: e?.message ?? 'Purchase failed.' };
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!configured) return { status: 'error', message: 'Billing unavailable.' };
  try {
    const info = await Purchases.restorePurchases();
    return { status: 'success', info };
  } catch (e: any) {
    return { status: 'error', message: e?.message ?? 'Restore failed.' };
  }
}

/** Total bailouts ever bought on this account, derived from the store's own
 *  record of consumable transactions. Used only to reconcile a reinstall —
 *  it can't know how many were already spent, so callers take the max of
 *  this and the locally persisted balance rather than overwriting it. */
export function purchasedBailoutCount(info: CustomerInfo | null | undefined): number {
  if (!info) return 0;
  return info.nonSubscriptionTransactions.reduce(
    (sum, t) => sum + (BAILOUT_PRODUCTS[t.productIdentifier] ?? 0),
    0,
  );
}

/**
 * How many bailouts each plan includes, and the single place that decides it.
 *
 * These numbers lived in four files — TrialTimelineScreen's PLAN_BAILOUTS, a
 * hardcoded `bailouts: 10` in PlanCompareScreen, its comparison table, and a
 * feature bullet on SubscriptionScreen — and they had drifted into a ladder
 * that punished the bigger commitment: monthly granted 2 a month (24 a year)
 * while yearly granted 10 a year. The plan costing more per year gave less
 * than half as many keys, which anyone doing the arithmetic would catch.
 *
 * The ladder now goes one way. Free is 1, once, forever. Monthly grants 2 a
 * month; yearly grants 26 a year — two a month plus two spare — so the longer
 * commitment is the better rate, which is the axis it is sold on.
 */
export const PLAN_BAILOUTS: Record<string, number> = {
  $rc_monthly: 2,
  $rc_annual: 26,
};

/**
 * What a free trial grants up front.
 *
 * Deliberately not the full yearly allowance. A trial can be cancelled before
 * it bills, so granting the whole year's keys on day one hands them to anyone
 * who wants them free — and bailouts are the one thing in the app that has to
 * stay scarce to mean anything. Two is enough to actually use the feature
 * during the trial and decide whether it is worth paying for, which is what a
 * trial is for. The year's 26 arrive when the first payment does, so a trial
 * that converts is worth 2 + 26.
 *
 * It used to be 1, shown on a row directly beside "10" — which made the trial
 * look like the worse deal for the very same product.
 */
export const TRIAL_BAILOUTS = 2;

/** Plain-English allowance for the plan cards and the comparison table, so the
 *  copy can never disagree with what the code actually grants. */
export const planBailoutLabel = (packageId: string): string => {
  const n = PLAN_BAILOUTS[packageId];
  if (!n) return '';
  return packageId === '$rc_annual' ? `${n} a year` : `${n} a month`;
};
