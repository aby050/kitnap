import { Linking, Platform } from 'react-native';

/**
 * The apps almost everyone starts by blocking.
 *
 * Apple's FamilyActivityPicker cannot be seeded: the selection it returns is
 * an opaque token set, and there is no API to build one from bundle
 * identifiers. So this is guidance, not preselection — we can tell someone
 * what to tick, we cannot tick it for them.
 *
 * What we *can* do honestly is only suggest apps that are actually on the
 * phone. `canOpenURL` answers that per scheme, but only for schemes declared
 * in LSApplicationQueriesSchemes (iOS caps that list at 50), which is why the
 * list here is short and deliberate rather than exhaustive.
 */
export type CommonApp = {
  name: string;
  scheme: string;
  /** Android package name — used purely as the key into `BrandGlyph`, which
   *  is where the real marks live. Nothing on iOS ever resolves a package;
   *  it is the icon lookup id and nothing more. */
  glyphId: string;
};

export const COMMON_BLOCKED: CommonApp[] = [
  { name: 'Instagram', scheme: 'instagram://', glyphId: 'com.instagram.android' },
  { name: 'YouTube', scheme: 'youtube://', glyphId: 'com.google.android.youtube' },
  { name: 'TikTok', scheme: 'snssdk1128://', glyphId: 'com.zhiliaoapp.musically' },
  { name: 'Facebook', scheme: 'fb://', glyphId: 'com.facebook.katana' },
  { name: 'Snapchat', scheme: 'snapchat://', glyphId: 'com.snapchat.android' },
  { name: 'X', scheme: 'twitter://', glyphId: 'com.twitter.android' },
  { name: 'Reddit', scheme: 'reddit://', glyphId: 'com.reddit.frontpage' },
  { name: 'WhatsApp', scheme: 'whatsapp://', glyphId: 'com.whatsapp' },
];

/** Those of the above that are actually installed. Returns everything on
 *  platforms where the check doesn't apply, and never throws — a failed probe
 *  should drop one suggestion, not break the screen it sits on. */
export async function installedCommonApps(): Promise<CommonApp[]> {
  if (Platform.OS !== 'ios') return COMMON_BLOCKED;
  const checks = await Promise.all(
    COMMON_BLOCKED.map(async (app) => {
      try {
        return (await Linking.canOpenURL(app.scheme)) ? app : null;
      } catch {
        return null;
      }
    }),
  );
  return checks.filter((a): a is CommonApp => a !== null);
}
