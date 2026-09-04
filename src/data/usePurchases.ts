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
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [discountOffering, setDiscountOffering] = useState<PurchasesOffering | null>(null);
  const [bailoutProducts, setBailoutProducts] = useState<PurchasesStoreProduct[]>([]);

  const load = useCallback(async () => {
    if (!isConfigured()) return;
    const [current, discount, products] = await Promise.all([
      getSubscriptionOffering(),
      getDiscountOffering(),
      getBailoutProducts(),
    ]);
    setOffering(current);
    setDiscountOffering(discount);
    setBailoutProducts(products);
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

  return { ready, pro: hasPro(info), info, offering, discountOffering, bailoutProducts, refresh: load };
}
