import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashFlow from './src/onboarding/SplashFlow';
import OnboardingFlow from './src/onboarding/OnboardingFlow';
import PostOnboardingFlow from './src/onboarding/PostOnboardingFlow';
import TrustPromiseScreen from './src/onboarding/TrustPromiseScreen';
import GoalScreen from './src/onboarding/GoalScreen';
import EducationScreen from './src/onboarding/EducationScreen';
import AffirmationScreen from './src/onboarding/AffirmationScreen';
import BenefitsScreen from './src/onboarding/BenefitsScreen';
import TrialTimelineScreen from './src/onboarding/TrialTimelineScreen';
import WorldSeedScreen from './src/onboarding/WorldSeedScreen';
import ThemePickerScreen from './src/onboarding/ThemePickerScreen';
import IntensityScreen from './src/onboarding/IntensityScreen';
import FutureSelfScreen from './src/onboarding/FutureSelfScreen';
import PaywallScreen from './src/onboarding/PaywallScreen';
import GroundRulesScreen from './src/onboarding/GroundRulesScreen';
import DiscountPaywallScreen from './src/onboarding/DiscountPaywallScreen';
import AppPickerScreen from './src/onboarding/AppPickerScreen';
import IOSAppPickerScreen from './src/onboarding/IOSAppPickerScreen';
import ProposedRulesScreen from './src/onboarding/ProposedRulesScreen';
import ReferralScreen from './src/onboarding/ReferralScreen';
import WelcomeScreen from './src/onboarding/WelcomeScreen';
import MainApp from './src/main/MainApp';
import PersistentBackground from './src/components/PersistentBackground';
import { IntensityKey, ThemeKey } from './src/data/themes';
import { EMPTY_GOAL, GoalData } from './src/data/goal';
import { DEFAULT_STATE, loadState, PersistedState, saveState } from './src/data/store';
import { recommendIntensity, suggestTheme } from './src/data/evaluation';
import { MonitoringLevel, setBlockedPackages, setMonitoringLevel } from './modules/device-permissions';

const INTENSITY_TO_MONITORING_LEVEL: Record<IntensityKey, MonitoringLevel> = {
  gentle: 'gentle',
  steady: 'balanced',
  strict: 'strict',
};
import { colors } from './src/theme';

/** wend://shield?package=com.instagram.android — fired by the native
 *  Accessibility Service when a blocked app comes to the foreground. */
function parseShieldDeepLink(url: string | null): string | null {
  if (!url || !url.startsWith('wend://shield')) return null;
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
  | 'worldSeed'
  | 'benefits'
  | 'paywall'
  | 'trial'
  | 'discount'
  | 'referral'
  | 'welcome'
  | 'app';

type Answer = { value: string; label: string };

const SCREENTIME_HOURS: Record<string, number> = {
  '< 1 hour': 0.5,
  '1–3 hours': 2,
  '3–4 hours': 3.5,
  '4–5 hours': 4.5,
  '5–7 hours': 6,
  '7+ hours': 8,
  "I don't know": 4,
};

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [themeKey, setThemeKey] = useState<ThemeKey>('quiet');
  const [goal, setGoal] = useState<GoalData>(EMPTY_GOAL);
  const [intensityKey, setIntensityKey] = useState<IntensityKey>('steady');
  const [futureSelfMessage, setFutureSelfMessage] = useState('');

  const [persisted, setPersisted] = useState<PersistedState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [pendingShieldPackage, setPendingShieldPackage] = useState<string | null>(null);

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

  // Keep the native Accessibility Service's blocked-package list in sync —
  // it can't read PersistedState directly, so this is the one bridge point.
  useEffect(() => {
    if (loaded) setBlockedPackages(persisted.blockedPackages);
  }, [loaded, persisted.blockedPackages]);

  // Battery/responsiveness follows the same intensity dial the user already
  // sets for unlock friction — no separate setting to expose, and it stays
  // in sync automatically if intensity changes via the 7-day check-in.
  useEffect(() => {
    if (loaded) setMonitoringLevel(INTENSITY_TO_MONITORING_LEVEL[persisted.intensityKey]);
  }, [loaded, persisted.intensityKey]);

  // Catches the deep link the Accessibility Service fires when a blocked
  // app opens, whether Wend was already running or cold-started by it.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      const pkg = parseShieldDeepLink(url);
      if (pkg) setPendingShieldPackage(pkg);
    };
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
    return () => sub.remove();
  }, []);

  const patch = (partial: Partial<PersistedState>) => setPersisted((s) => ({ ...s, ...partial }));

  const name = answers.name?.value ?? '';
  const screentimeHours = SCREENTIME_HOURS[answers.screentime?.value ?? ''] ?? 4;

  // Built from their own onboarding answers so the paywall reflects what
  // they actually said, not generic copy — this is what conversion research
  // on quiz-funnel apps consistently points to as the highest-leverage lever.
  const aspiration = answers.aspiration?.value?.trim();
  const cost = answers.costText?.value?.trim();
  const loseTime = answers.loseTime?.label;
  const paywallPersonalLine = aspiration
    ? `You said: "${aspiration}"`
    : cost
      ? `You told us you miss: ${cost}`
      : loseTime
        ? `Built around where you lose time most — ${loseTime.toLowerCase()}`
        : undefined;
  const paywallHoursBack = Math.max(2, Math.round(screentimeHours * 0.3));

  const intensityRecommendation = recommendIntensity(answers, screentimeHours);
  const suggestedTheme = suggestTheme(answers.interests?.value);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <PersistentBackground />
          <StatusBar style="light" />

          {stage === 'splash' && <SplashFlow onDone={() => setStage('education')} />}

          {stage === 'education' && (
            <EducationScreen onContinue={() => setStage('onboarding')} />
          )}

          {stage === 'onboarding' && (
            <OnboardingFlow
              onComplete={(a) => {
                setAnswers(a);
                setStage('momentum');
              }}
              onAccountSignedIn={(account) => patch({ account })}
            />
          )}

          {stage === 'momentum' && (
            <AffirmationScreen
              headline="Momentum unlocked."
              body="That's the first step to reclaiming your time. Now let's look at what it's actually costing you."
              onContinue={() => setStage('post')}
            />
          )}

          {stage === 'post' && (
            <PostOnboardingFlow
              name={name}
              screentimeHours={screentimeHours}
              onFinish={() => setStage('trust')}
            />
          )}

          {stage === 'trust' && <TrustPromiseScreen onContinue={() => setStage('goal')} />}

          {stage === 'goal' && (
            <GoalScreen
              onContinue={(g) => {
                setGoal(g);
                setStage('theme');
              }}
            />
          )}

          {stage === 'theme' && (
            <ThemePickerScreen
              suggested={suggestedTheme}
              onContinue={(k) => {
                setThemeKey(k);
                setStage('groundRules');
              }}
            />
          )}

          {stage === 'groundRules' && <GroundRulesScreen onContinue={() => setStage('appPicker')} />}

          {stage === 'appPicker' && (
            <AppPickerScreen
              onContinue={(selected) => {
                // The picker's `selected` list mixes real Android package
                // names with cosmetic category/"all" ids used only for its
                // own bulk-select bookkeeping (and, on the iOS fallback
                // path, non-package placeholder ids) — only ids that look
                // like a real package name (contain a dot) are ever
                // persisted as something the Accessibility Service blocks.
                if (Platform.OS === 'android') {
                  const packages = selected.filter((id) => id.includes('.'));
                  patch({ blockedPackages: packages });
                }
                setStage(Platform.OS === 'ios' ? 'iosAppPicker' : 'intensity');
              }}
            />
          )}

          {stage === 'iosAppPicker' && <IOSAppPickerScreen onContinue={() => setStage('intensity')} />}

          {stage === 'intensity' && (
            <IntensityScreen
              recommended={intensityRecommendation.key}
              recommendedReasons={intensityRecommendation.reasons}
              onContinue={(k) => {
                setIntensityKey(k);
                // ProposedRulesScreen removed from the funnel — straight to Future Self.
                setStage('futureSelf');
              }}
            />
          )}

          {stage === 'futureSelf' && (
            <FutureSelfScreen
              onContinue={(m) => {
                setFutureSelfMessage(m);
                setStage('worldSeed');
              }}
            />
          )}

          {stage === 'worldSeed' && (
            <WorldSeedScreen themeKey={themeKey} onContinue={() => setStage('benefits')} />
          )}

          {/* Paywall (and its trial/discount retention offshoots) and the
              friend-referral screen are hidden from the funnel for now —
              straight from Benefits to Welcome. */}
          {stage === 'benefits' && <BenefitsScreen onContinue={() => setStage('welcome')} />}

          {stage === 'welcome' && (
            <WelcomeScreen
              onDone={() => {
                patch({
                  onboardingComplete: true,
                  themeKey,
                  intensityKey,
                  futureSelfMessage,
                  goal,
                  onboardingAnswers: answers,
                });
                setStage('app');
              }}
            />
          )}

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
            />
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
