import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import SplashFlow from './src/onboarding/SplashFlow';
import MascotSplash from './src/onboarding/MascotSplash';
import IntroStories from './src/onboarding/IntroStories';
import UsageRevealScreen from './src/onboarding/UsageRevealScreen';
import OnboardingFlow from './src/onboarding/OnboardingFlow';
import PermissionBoardingPassScreen from './src/onboarding/PermissionBoardingPassScreen';
import GoalScreen from './src/onboarding/GoalScreen';
import EducationScreen from './src/onboarding/EducationScreen';
import OnboardingMark from './src/onboarding/OnboardingMark';
import TrialTimelineScreen from './src/onboarding/TrialTimelineScreen';
import PlanCompareScreen from './src/onboarding/PlanCompareScreen';
import PurchaseSuccessScreen, { PurchaseResult } from './src/onboarding/PurchaseSuccessScreen';
import FutureSelfScreen from './src/onboarding/FutureSelfScreen';
import PaywallScreen from './src/onboarding/PaywallScreen';
import AppPickerScreen from './src/onboarding/AppPickerScreen';
import IOSAppPickerScreen from './src/onboarding/IOSAppPickerScreen';
import ProposedRulesScreen from './src/onboarding/ProposedRulesScreen';
import ReferralScreen from './src/onboarding/ReferralScreen';
import WelcomeScreen from './src/onboarding/WelcomeScreen';
import MainApp from './src/main/MainApp';
import PersistentBackground from './src/components/PersistentBackground';
import { IntensityKey, ThemeKey } from './src/data/themes';
import { EMPTY_GOAL, GoalData } from './src/data/goal';
import { clearState, DEFAULT_STATE, loadState, PersistedState, saveState } from './src/data/store';
import { HARD_BLOCKS, QUESTION_CHUNKS, REST_PERMISSIONS } from './src/onboarding/questions';
import { setAdultContentFilter } from './src/data/iosScreenTime';
import { recommendIntensity, suggestTheme } from './src/data/evaluation';
import { estimateDailyHours, recommendSetup, scheduleFromSlipWindow } from './src/data/setupPlan';
import { hydrateAmbienceCache, prefetchAmbience } from './src/data/ambiencePrefetch';
import {
  MonitoringLevel,
  setBlockedPackages,
  setAlternativeApp,
  updateWidget,
  setMonitoringLevel,
  setPausedPackages,
  setPauseSeconds,
} from './modules/device-permissions';
import { addDays, dateKey, sumRange } from './src/data/progress';
import { effectiveBlockedPackages } from './src/data/scheduleEnforcer';
import { usePurchases } from './src/data/usePurchases';
import { purchasedBailoutCount } from './src/data/purchases';

const INTENSITY_TO_MONITORING_LEVEL: Record<IntensityKey, MonitoringLevel> = {
  steady: 'balanced',
  strict: 'strict',
};
import { colors } from './src/theme';

/** phonewise://shield?package=com.instagram.android — fired by the native
 *  Accessibility Service when a blocked app comes to the foreground. */
function parseShieldDeepLink(url: string | null): string | null {
  if (!url || !url.startsWith('phonewise://shield')) return null;
  try {
    const query = url.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    return params.get('package');
  } catch {
    return null;
  }
}

type Stage =
  | 'loading'
  | 'splash'
  | 'education'
  | 'onboarding'
  | 'usageReveal'
  | 'momentum'
  | 'post'
  | 'trust'
  | 'goal'
  | 'theme'
  | 'groundRules'
  | 'appPicker'
  | 'iosAppPicker'
  | 'intensity'
  | 'proposedRules'
  | 'futureSelf'
  | 'benefits'
  | 'paywall'
  | 'trial'
  | 'compare'
  | 'purchased'
  | 'referral'
  | 'welcome'
  | 'app';

type Answer = { value: string; label: string };

import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';

export default function App() {
  // Every weight the type scale names has to be loaded here: with a bundled
  // family React Native will not synthesise a missing weight, it silently
  // falls back to the system font for that style only — which shows up as one
  // stray San Francisco label in an otherwise Poppins screen.
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    KaushanScript_400Regular,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const [stage, setStage] = useState<Stage>('loading');
  // The mascot intro plays once per launch, over whatever loads underneath.
  const [showMascot, setShowMascot] = useState(true);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [themeKey, setThemeKey] = useState<ThemeKey>('quiet');
  const [goal, setGoal] = useState<GoalData>(EMPTY_GOAL);
  const [intensityKey, setIntensityKey] = useState<IntensityKey>('steady');
  const [futureSelfMessage, setFutureSelfMessage] = useState('');
  const [measuredHours, setMeasuredHours] = useState<number | null>(null);
  const [hoursFromUsage, setHoursFromUsage] = useState(false);
  const [suggestedPackages, setSuggestedPackages] = useState<string[]>([]);

  const [persisted, setPersisted] = useState<PersistedState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  // Configured once here so entitlement state is the same everywhere.
  const purchases = usePurchases();
  const [pendingShieldPackage, setPendingShieldPackage] = useState<string | null>(null);
  // Set when Apple's shield "Let me in" button reopens Kitnap via the
  // device-activity:// scheme — routes straight to the unlock challenge
  // instead of Home, which is what tapping that button is supposed to mean.
  const [pendingIOSUnlock, setPendingIOSUnlock] = useState(false);
  // Which run of questions we are on, and whether its permission ask is showing.
  const [chunk, setChunk] = useState(0);
  const [askingPermission, setAskingPermission] = useState(false);
  /** 0 = usage access, then the reveal; 1 = the remaining permissions. */
  const [permPhase, setPermPhase] = useState<0 | 1>(0);
  const [history, setHistory] = useState<{ id: string; prompt: string; label: string }[]>([]);

  /* Room loops: read what is already on disk, then quietly pull the rest.
   *
   *  Hydration runs before the first render so a returning user plays from
   *  the local copy immediately. The sweep starts here rather than on the
   *  rooms screen because by the time someone opens a room it is already too
   *  late — the download has to happen while they are reading questions. It
   *  is fire-and-forget: nothing awaits it and every failure is swallowed. */
  useEffect(() => {
    hydrateAmbienceCache();
    prefetchAmbience();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `html, body, #root { height: 100%; width: 100%; margin: 0; background: #000; }`;
      document.head.appendChild(style);
    }
  }, []);

  // Nothing renders until this resolves — a returning user should land
  // directly in their world, never back at the splash screen.
  useEffect(() => {
    loadState().then((s) => {
      setPersisted(s);
      if (s.onboardingComplete) {
        setThemeKey(s.themeKey);
        setIntensityKey(s.intensityKey);
        setFutureSelfMessage(s.futureSelfMessage);
        setGoal(s.goal);
        setStage('app');
      } else {
        setStage('splash');
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveState(persisted);
  }, [loaded, persisted]);

  const grantBailouts = React.useCallback((quantity: number) => {
    setPersisted((prev) => ({ ...prev, emergencyTokens: (prev.emergencyTokens ?? 0) + quantity }));
  }, []);

  // A reinstall wipes the local balance while the store still remembers every
  // consumable ever bought. Take the higher of the two rather than
  // overwriting — the store can't know how many were already spent, so
  // trusting it outright would hand back bailouts the user already used.
  useEffect(() => {
    if (!loaded || !purchases.info) return;
    const owned = purchasedBailoutCount(purchases.info);
    setPersisted((prev) =>
      owned > (prev.emergencyTokens ?? 0) ? { ...prev, emergencyTokens: owned } : prev,
    );
  }, [loaded, purchases.info]);

  // Feed the home-screen widget what only the app knows. Screen time the
  // widget reads for itself; streak, goal and reclaimed time come from here.
  useEffect(() => {
    if (!loaded || Platform.OS !== 'android') return;
    const today = dateKey();
    const week = sumRange(persisted.progress, addDays(today, -6), today);
    updateWidget(
      persisted.progress.currentStreak,
      persisted.dailyGoalMinutes ?? 0,
      week.savedMinutes,
    );
  }, [loaded, persisted.progress, persisted.dailyGoalMinutes]);

  // Keep the native Accessibility Service's blocked-package list in sync.
  // The base list is always enforced — schedules are lockdown windows that
  // close the escape hatches, not windows that decide *whether* to block — so
  // this only needs to re-run when the list itself changes, plus on foreground
  // in case the service was restarted while Kitnap was away.
  useEffect(() => {
    if (!loaded) return;
    const sync = () => {
      setBlockedPackages(effectiveBlockedPackages(persisted.blockedPackages));
      // The pause list rides along on the same sync. It is read by the same
      // service on the same event, and letting the two drift apart would mean
      // an app could be both blocked and paused — which the service resolves
      // in favour of blocked, but which should never arise in the first place.
      setPausedPackages(
        persisted.pausedPackages.filter((p) => !persisted.blockedPackages.includes(p)),
      );
      setPauseSeconds(persisted.pauseSeconds);
      setAlternativeApp(persisted.alternativeApp ?? '');
    };
    sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [loaded, persisted.blockedPackages, persisted.pausedPackages, persisted.pauseSeconds, persisted.alternativeApp]);

  // Battery/responsiveness follows the same intensity dial the user already
  // sets for unlock friction — no separate setting to expose, and it stays
  // in sync automatically if intensity changes via the 7-day check-in.
  useEffect(() => {
    if (loaded) setMonitoringLevel(INTENSITY_TO_MONITORING_LEVEL[persisted.intensityKey]);
  }, [loaded, persisted.intensityKey]);

  // Catches the deep link the Accessibility Service fires when a blocked
  // app opens, whether Kitnap was already running or cold-started by it.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const pkg = parseShieldDeepLink(url);
      if (pkg) setPendingShieldPackage(pkg);
      // iOS's shield has no per-app payload to carry (Family Controls tokens
      // are opaque) — the scheme firing at all is the entire signal.
      if (url?.startsWith('phonewise://unlock') || url?.startsWith('device-activity://')) {
        setPendingIOSUnlock(true);
      }
    };
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));

    // iOS only: Apple's shield button cannot open Kitnap — no extension can
    // launch its container — so the ShieldAction extension posts a banner
    // carrying `phonewise://unlock` instead, and this is what makes tapping it
    // land on the Gate rather than on whatever screen Kitnap was last showing.
    // Without this the notification opens the app and abandons the user.
    let disposeNotifications: (() => void) | undefined;
    if (Platform.OS === 'ios') {
      import('expo-notifications')
        .then((Notifications) => {
          const onResponse = (res: { notification: { request: { content: { data?: unknown } } } }) => {
            const data = res.notification.request.content.data as { url?: string } | undefined;
            if (data?.url) handleUrl(data.url);
          };
          // A tap that cold-started Kitnap has already been delivered by the
          // time this listener attaches, so ask for it explicitly.
          Notifications.getLastNotificationResponseAsync().then((res) => {
            if (res) onResponse(res);
          });
          const nSub = Notifications.addNotificationResponseReceivedListener(onResponse);
          disposeNotifications = () => nSub.remove();
        })
        .catch(() => {
          // Notifications unavailable — the shield banner simply opens Kitnap
          // on its last screen, which is the old behaviour.
        });
    }

    return () => {
      sub.remove();
      disposeNotifications?.();
    };
  }, []);

  const patch = (partial: Partial<PersistedState>) => setPersisted((s) => ({ ...s, ...partial }));

  // The single completion path out of onboarding: persist everything MainApp
  // reads, then hand over. Shared by the Welcome step and the dev skip so the
  // two can't drift into leaving different state behind.
  const completeOnboarding = () => {
    // What they asked to have gone completely, as HARD_BLOCKS keys rather
    // than the labels the question rendered — copy can change, the keys and
    // the behaviour hanging off them cannot.
    const picked = (answers.hardBlock?.value ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const hardBlocks = HARD_BLOCKS.filter((h) => picked.includes(h.label)).map((h) => h.key);

    // Adult content is the one category iOS can enforce itself, through
    // Apple's own web filter — every browser, no app list to keep up to date,
    // and no challenge to pass. Applied here rather than on first block
    // because the user asked for it to be *gone*, not gated.
    if (hardBlocks.includes('adult')) setAdultContentFilter(true, 'onboarding');

    patch({
      onboardingComplete: true,
      themeKey,
      intensityKey,
      futureSelfMessage,
      goal,
      onboardingAnswers: answers,
      hardBlocks,
      // A photo taken during setup IS the first weekly photo. It used to live
      // only on the goal (where the shield reads it), so Progress photos
      // opened on "No photos yet" the day after the user took one, and the
      // week-1-vs-latest comparison had nothing to compare against.
      ...(goal.photoUri
        ? { progressPhotos: [{ date: new Date().toISOString(), uri: goal.photoUri }] }
        : null),
    });
    setStage('app');
  };

  // Nothing here has a server copy (see AccountScreen/DeleteAccountScreen),
  // so "delete account" is a real local wipe: clear the store, reset every
  // piece of onboarding state this component holds, and land back at
  // splash — genuinely a clean install, not a soft sign-out.
  const handleDeleteAccount = async () => {
    await clearState();
    setPersisted(DEFAULT_STATE);
    setAnswers({});
    setThemeKey('quiet');
    setIntensityKey('steady');
    setFutureSelfMessage('');
    setGoal(EMPTY_GOAL);
    setMeasuredHours(null);
    setHoursFromUsage(false);
    setSuggestedPackages([]);
    setPendingShieldPackage(null);
    setStage('splash');
  };

  const name = answers.name?.value ?? '';
  const { hours: inferredHours, fromUsage } = estimateDailyHours(answers, measuredHours);
  const dailyHours = inferredHours;
  const setup = recommendSetup(answers, dailyHours, hoursFromUsage || fromUsage, suggestedPackages);
  const intensityRecommendation = recommendIntensity(answers, dailyHours, hoursFromUsage || fromUsage);
  const suggestedTheme = suggestTheme(answers.interests?.value);

  // Hold on the painted background rather than flashing unstyled system-font
  // text for a frame while the faces decode.
  if (!fontsLoaded) {
    return (
      <View style={styles.root}>
        <PersistentBackground />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <PersistentBackground />
          <StatusBar style="dark" />

          {stage === 'splash' && <IntroStories onDone={() => setStage('onboarding')} />}

          {(stage === 'education' || stage === 'onboarding') && (
            <OnboardingMark large={stage === 'education'} hidden={stage === 'onboarding'} />
          )}

          {stage === 'education' && (
            <EducationScreen onContinue={() => setStage('onboarding')} />
          )}

          {/* Questions first, then the permission asks they justify. */}
          {stage === 'onboarding' && !askingPermission && (
            <OnboardingFlow
              key={`chunk-${chunk}`}
              questions={QUESTION_CHUNKS[chunk].questions}
              progressFrom={QUESTION_CHUNKS.slice(0, chunk).reduce((n, c) => n + c.questions.length, 0)}
              progressTotal={QUESTION_CHUNKS.reduce((n, c) => n + c.questions.length, 0)}
              initialAnswers={answers}
              initialHistory={history}
              onComplete={(a, h) => {
                setAnswers(a);
                if (h) setHistory(h);
                // The slip window becomes a real schedule rather than a
                // stored string, editable in Settings from then on.
                const seeded = scheduleFromSlipWindow(a);
                if (seeded) {
                  patch({
                    schedules: [
                      seeded,
                      ...persisted.schedules.filter((s) => s.id !== seeded.id),
                    ],
                  });
                }
                setAskingPermission(true);
              }}
              onAccountSignedIn={(account) => patch({ account })}
            />
          )}

          {stage === 'onboarding' && askingPermission && (
            <PermissionBoardingPassScreen
              key={`perm-${permPhase}`}
              only={permPhase === 0 ? QUESTION_CHUNKS[chunk].permissions : REST_PERMISSIONS}
              onContinue={() => {
                setAskingPermission(false);
                if (permPhase === 0) setStage('usageReveal');
                else setStage('goal');
              }}
            />
          )}

          {stage === 'usageReveal' && (
            <UsageRevealScreen
              onContinue={() => {
                setPermPhase(1);
                setAskingPermission(true);
                setStage('onboarding');
              }}
            />
          )}


          {stage === 'goal' && (
            <GoalScreen
              onContinue={(g) => {
                setGoal(g);
                setStage(Platform.OS === 'ios' ? 'iosAppPicker' : 'appPicker');
              }}
            />
          )}

          {stage === 'appPicker' && (
            <AppPickerScreen
              pastel
              suggestedPackages={suggestedPackages.length > 0 ? suggestedPackages : setup.suggestedPackages}
              onContinue={(selected) => {
                if (Platform.OS === 'android') {
                  const packages = selected.filter((id) => id.includes('.'));
                  patch({ blockedPackages: packages.length > 0 ? packages : setup.suggestedPackages });
                }
                setStage('paywall');
              }}
            />
          )}

          {stage === 'iosAppPicker' && (
            <IOSAppPickerScreen
              hint="Block the apps that usually steal your hours. Kitnap never sees the names you pick."
              onContinue={() => setStage('paywall')}
            />
          )}

          {/* The value-prop paywall comes before the plan picker: it makes the
              case, the picker takes the money.
              The exit-intent "Too Expensive? Here is 50% OFF" screen that used
              to sit behind "Not now" is gone: a last-chance discount fired at
              someone who just declined is the single most copied screen in
              this category, and it was one of the things making Kitnap's funnel
              read as a reskin under guideline 4.3(a). */}
          {stage === 'paywall' && (
            <PaywallScreen
              name={name}
              hoursBack={Math.max(1, Math.round(dailyHours))}
              personalLine={goal.line || undefined}
              onContinue={() => setStage('trial')}
              onDecline={() => setStage('compare')}
            />
          )}

          {/* The decline route. Was "Too Expensive? Here is 50% OFF" — a
              last-chance discount fired the moment someone said no, which is
              both the most copied screen in this category and an implicit
              admission that the price just quoted was never the real price.
              Same offer, honest framing: what the free plan actually keeps,
              what Pro adds, and the annual price beside it with the saving
              computed from the store rather than written down. */}
          {stage === 'compare' && (
            <PlanCompareScreen
              offering={purchases.discountOffering ?? purchases.offering}
              fullPriceOffering={purchases.offering}
              onPurchased={grantBailouts}
              onStart={(result) => {
                setPurchaseResult(result ?? null);
                setStage(result ? 'purchased' : 'welcome');
              }}
              onClose={() => setStage('trial')}
            />
          )}

          {stage === 'trial' && (
            <TrialTimelineScreen
              onStart={(result) => {
                // No result means no live product — there is nothing to
                // confirm, so skip the confirmation rather than show an empty
                // one claiming a purchase that never happened.
                setPurchaseResult(result ?? null);
                setStage(result ? 'purchased' : 'welcome');
              }}
              offering={purchases.offering}
              onPurchased={grantBailouts}
            />
          )}

          {stage === 'purchased' && purchaseResult && (
            <PurchaseSuccessScreen result={purchaseResult} onContinue={() => setStage('welcome')} />
          )}

          {stage === 'welcome' && <WelcomeScreen onDone={completeOnboarding} />}

          {stage === 'app' && (
            <MainApp
              themeKey={themeKey}
              intensityKey={intensityKey}
              futureSelfMessage={futureSelfMessage}
              goal={goal}
              persisted={persisted}
              onPatch={patch}
              pendingShieldPackage={pendingShieldPackage}
              onShieldConsumed={() => setPendingShieldPackage(null)}
              pendingIOSUnlock={pendingIOSUnlock}
              onIOSUnlockConsumed={() => setPendingIOSUnlock(false)}
              onDeleteAccount={handleDeleteAccount}
              /* The plan offering, so Settings can sell. Without it the
                 only purchase surface in the whole app was the onboarding
                 funnel — decline once and there was no way back to it. */
              offering={purchases.offering}
              onPurchasedPlan={grantBailouts}
              bailoutProducts={purchases.bailoutProducts}
              isPro={purchases.pro}
              customerInfo={purchases.info}
            />
          )}

          {showMascot && <MascotSplash onDone={() => setShowMascot(false)} />}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
