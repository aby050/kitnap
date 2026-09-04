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

/** The single entitlement that gates Strict mode, schedules and Autofocus.
 *  Must match the identifier created in the RevenueCat dashboard exactly. */
export const ENTITLEMENT_ID = 'pro';

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
  bailout_key1: 1,
  bailout_key3: 3,
  bailout_key5: 5,
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
