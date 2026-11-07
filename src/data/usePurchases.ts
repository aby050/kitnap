import { useCallback, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesStoreProduct } from 'react-native-purchases';
import {
  getBailoutProducts,
  getDiscountOffering,
  getSubscriptionOffering,
  hasPro,
  initPurchases,
  isConfigured,
} from './purchases';
import { getSecretPro, subscribeSecretPro } from './secretPro';

/**
 * Pretend the subscription is active, for development only.
 *
 * Flip to `true` to exercise every Pro-gated path — guardian, unlimited
 * schedules, the "what you've got" state of the subscription screen —
 * without a live purchase. Useful while the store side is still being set
 * up, and the only way to see those screens at all if offerings will not
 * load.
 *
 * Double-gated on `__DEV__` below, so leaving it `true` cannot reach a
 * release build. Unlike the old TEST_TOP_UP button this has no UI: a switch
 * a user could find is a switch that eventually ships.
 */
const DEV_FORCE_PRO = false;

export type PurchasesState = {
  ready: boolean;
  pro: boolean;
  info: CustomerInfo | null;
  offering: PurchasesOffering | null;
  /** Null when no `discount` offering is configured — callers must skip the
   *  retention screen rather than render an unsellable offer. */
  discountOffering: PurchasesOffering | null;
  bailoutProducts: PurchasesStoreProduct[];
  refresh: () => Promise<void>;
};

/** Configures RevenueCat once and keeps entitlement state live. Mounted at
 *  the App root so every screen reads the same subscription truth — the
 *  listener fires on renewals, expiries and restores without a refetch. */
export function usePurchases(): PurchasesState {
  const [secretPro, setSecretProState] = useState(getSecretPro());
  useEffect(() => subscribeSecretPro(setSecretProState), []);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [discountOffering, setDiscountOffering] = useState<PurchasesOffering | null>(null);
  const [bailoutProducts, setBailoutProducts] = useState<PurchasesStoreProduct[]>([]);

  const load = useCallback(async () => {
    if (!isConfigured()) return;
    // The store is often not connected yet on a cold start, so the first answer
    // can be empty. One failed read used to leave every pack disabled until the
    // app was killed; retry a few times with a growing pause instead.
    for (let attempt = 0; attempt < 4; attempt++) {
      const [current, discount, products] = await Promise.all([
        getSubscriptionOffering(),
        getDiscountOffering(),
        getBailoutProducts(),
      ]);
      setOffering(current);
      setDiscountOffering(discount);
      setBailoutProducts(products);
      if (products.length > 0 && current) return;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initPurchases();
      if (cancelled) return;
      if (isConfigured()) {
        Purchases.addCustomerInfoUpdateListener(setInfo);
        try {
          setInfo(await Purchases.getCustomerInfo());
        } catch {
          // Offline on first launch — the listener catches up later.
        }
        await load();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return {
    ready,
    pro: (__DEV__ && DEV_FORCE_PRO) || secretPro || hasPro(info),
    info,
    offering,
    discountOffering,
    bailoutProducts,
    refresh: load,
  };
}
