import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplashFlow from './src/onboarding/SplashFlow';
import OnboardingFlow from './src/onboarding/OnboardingFlow';
import PermissionBoardingPassScreen from './src/onboarding/PermissionBoardingPassScreen';
import PostOnboardingFlow from './src/onboarding/PostOnboardingFlow';
import TrustPromiseScreen from './src/onboarding/TrustPromiseScreen';
import GoalScreen from './src/onboarding/GoalScreen';
import EducationScreen from './src/onboarding/EducationScreen';
import OnboardingMark from './src/onboarding/OnboardingMark';
import AffirmationScreen from './src/onboarding/AffirmationScreen';
import BenefitsScreen from './src/onboarding/BenefitsScreen';
import TrialTimelineScreen from './src/onboarding/TrialTimelineScreen';
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
import { clearState, DEFAULT_STATE, loadState, PersistedState, saveState } from './src/data/store';
import { QUESTION_CHUNKS } from './src/onboarding/questions';
import { recommendIntensity, suggestTheme } from './src/data/evaluation';
import { estimateDailyHours, recommendSetup } from './src/data/setupPlan';
import { MonitoringLevel, setBlockedPackages, setMonitoringLevel } from './modules/device-permissions';

const INTENSITY_TO_MONITORING_LEVEL: Record<IntensityKey, MonitoringLevel> = {
  steady: 'balanced',
  strict: 'strict',
};
import { colors } from './src/theme';

/** byre://shield?package=com.instagram.android — fired by the native
 *  Accessibility Service when a blocked app comes to the foreground. */
function parseShieldDeepLink(url: string | null): string | null {
  if (!url || !url.startsWith('byre://shield')) return null;
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
  | 'benefits'
  | 'paywall'
  | 'trial'
  | 'discount'
  | 'referral'
  | 'welcome'
  | 'app';

type Answer = { value: string; label: string };

export default function App() {
  const [stage, setStage] = useState<Stage>('loading');
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
  const [pendingShieldPackage, setPendingShieldPackage] = useState<string | null>(null);
  // Which run of questions we are on, and whether its permission ask is showing.
  const [chunk, setChunk] = useState(0);
  const [askingPermission, setAskingPermission] = useState(false);
  const [history, setHistory] = useState<{ id: string; prompt: string; label: string }[]>([]);

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
  // app opens, whether Byre was already running or cold-started by it.
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

  // The single completion path out of onboarding: persist everything MainApp
  // reads, then hand over. Shared by the Welcome step and the dev skip so the
  // two can't drift into leaving different state behind.
  const completeOnboarding = () => {
    patch({
      onboardingComplete: true,
      themeKey,
      intensityKey,
      futureSelfMessage,
      goal,
      onboardingAnswers: answers,
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <PersistentBackground />
          <StatusBar style="light" />

          {stage === 'splash' && <SplashFlow onDone={() => setStage('education')} />}

          {(stage === 'education' || stage === 'onboarding') && <OnboardingMark />}

          {stage === 'education' && (
            <EducationScreen onContinue={() => setStage('onboarding')} />
          )}

          {/* All permissions asked upfront, boarding-pass style, before any
              onboarding question — matches the reference flow instead of
              interleaving asks mid-questionnaire. Real usage data is
              available for the rest of onboarding and for
              PostOnboardingFlow's projections from this point on. */}
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
                setAskingPermission(true);
              }}
              onAccountSignedIn={(account) => patch({ account })}
            />
          )}

          {stage === 'onboarding' && askingPermission && (
            <PermissionBoardingPassScreen
              only={QUESTION_CHUNKS[chunk].permissions}
              onContinue={() => {
                setAskingPermission(false);
                if (chunk < QUESTION_CHUNKS.length - 1) setChunk((c) => c + 1);
                else setStage('momentum');
              }}
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
              answers={answers}
              onFinish={({ dailyHours: h, fromUsage: u, suggestedPackages: pkgs }) => {
                setMeasuredHours(h);
                setHoursFromUsage(u);
                setSuggestedPackages(pkgs);
                if (pkgs.length > 0) patch({ blockedPackages: pkgs });
                setStage('trust');
              }}
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

          {stage === 'groundRules' && (
            <GroundRulesScreen
              onContinue={() => setStage(Platform.OS === 'ios' ? 'iosAppPicker' : 'appPicker')}
            />
          )}

          {stage === 'appPicker' && (
            <AppPickerScreen
              suggestedPackages={suggestedPackages.length > 0 ? suggestedPackages : setup.suggestedPackages}
              onContinue={(selected) => {
                if (Platform.OS === 'android') {
                  const packages = selected.filter((id) => id.includes('.'));
                  patch({ blockedPackages: packages.length > 0 ? packages : setup.suggestedPackages });
                }
                setStage('intensity');
              }}
            />
          )}

          {stage === 'iosAppPicker' && (
            <IOSAppPickerScreen
              hint={
                hoursFromUsage
                  ? 'Start with the apps that already eat most of your day. Byre never sees the names you pick.'
                  : 'Block the apps that usually steal the hours you described. Byre never sees the names you pick.'
              }
              onContinue={() => setStage('intensity')}
            />
          )}

          {stage === 'intensity' && (
            <IntensityScreen
              recommended={intensityRecommendation.key}
              recommendedReasons={intensityRecommendation.reasons}
              onContinue={(k) => {
                setIntensityKey(k);
                setStage('futureSelf');
              }}
            />
          )}

          {stage === 'futureSelf' && (
            <FutureSelfScreen
              onContinue={(m) => {
                setFutureSelfMessage(m);
                setStage('benefits');
              }}
            />
          )}

          {/* World Seed (landmarks chrome) is skipped — world is deprioritized.
              Paywall, trial/discount, and referral stay hidden from the funnel.
              Straight from Benefits to Welcome. */}
          {stage === 'benefits' && <BenefitsScreen onContinue={() => setStage('welcome')} />}

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
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {/* Dev-only shortcut past the funnel while working on the main app.
              __DEV__-gated deliberately: in a release build this would let a
              user skip the permission asks and the app picker and land in a
              main screen with nothing actually guarded. Top-left because the
              Expo dev-tools bubble parks itself over the right-hand corners. */}
          {__DEV__ && stage !== 'loading' && stage !== 'app' && (
            <Pressable onPress={completeOnboarding} style={styles.devSkip} hitSlop={10}>
              <Text style={styles.devSkipLabel}>Skip →</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  devSkip: {
    position: 'absolute',
    top: 58,
    left: 16,
    zIndex: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.20)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  devSkipLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
});
