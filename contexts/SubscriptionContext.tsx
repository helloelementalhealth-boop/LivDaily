import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY_IOS = 'appl_placeholder';
const REVENUECAT_API_KEY_ANDROID = 'goog_placeholder';
const ENTITLEMENT_ID = 'pro';

interface SubscriptionContextValue {
  isPro: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: import('react-native-purchases').PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPro: false,
  isLoading: true,
  currentOffering: null,
  customerInfo: null,
  purchasePackage: async () => false,
  restorePurchases: async () => false,
  refreshCustomerInfo: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    console.log('[livdaily] initializing RevenueCat, platform:', Platform.OS);
    try {
      Purchases.configure({ apiKey });
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    } catch (e) {
      console.warn('[livdaily] RevenueCat configure error:', e);
    }

    const init = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        const entitled = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
        setIsPro(entitled);
        console.log('[livdaily] RevenueCat customer info loaded, isPro:', entitled);

        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setCurrentOffering(offerings.current);
          console.log('[livdaily] RevenueCat current offering:', offerings.current.identifier);
        }
      } catch (e) {
        console.warn('[livdaily] RevenueCat init error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('[livdaily] RevenueCat customer info updated');
      setCustomerInfo(info);
      setIsPro(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    });

    return () => {
      listener.remove();
    };
  }, []);

  const purchasePackage = useCallback(async (pkg: import('react-native-purchases').PurchasesPackage): Promise<boolean> => {
    console.log('[livdaily] purchase initiated:', pkg.identifier);
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      const entitled = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setCustomerInfo(info);
      setIsPro(entitled);
      console.log('[livdaily] purchase complete, isPro:', entitled);
      return entitled;
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean };
      if (!err.userCancelled) {
        console.warn('[livdaily] purchase error:', e);
      } else {
        console.log('[livdaily] purchase cancelled by user');
      }
      return false;
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    console.log('[livdaily] restore purchases initiated');
    try {
      const info = await Purchases.restorePurchases();
      const entitled = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setCustomerInfo(info);
      setIsPro(entitled);
      console.log('[livdaily] restore complete, isPro:', entitled);
      return entitled;
    } catch (e) {
      console.warn('[livdaily] restore error:', e);
      return false;
    }
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    console.log('[livdaily] refreshing customer info');
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPro(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
    } catch (e) {
      console.warn('[livdaily] refresh customer info error:', e);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ isPro, isLoading, currentOffering, customerInfo, purchasePackage, restorePurchases, refreshCustomerInfo }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
