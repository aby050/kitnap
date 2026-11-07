import AsyncStorage from '@react-native-async-storage/async-storage';

/** Hidden Pro unlock: tapping the Kitnap mark in Settings 11 times turns Pro
 *  on for this device. Stored locally; RevenueCat is not involved. */
const KEY = 'kitnap_secret_pro';
let value = false;
const listeners = new Set<(v: boolean) => void>();

AsyncStorage.getItem(KEY)
  .then((v) => {
    value = v === '1';
    listeners.forEach((l) => l(value));
  })
  .catch(() => {});

export const getSecretPro = () => value;

export function setSecretPro(v: boolean) {
  value = v;
  AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
  listeners.forEach((l) => l(v));
}

export function subscribeSecretPro(l: (v: boolean) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
