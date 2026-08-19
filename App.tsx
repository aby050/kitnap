import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
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
import ProposedRulesScreen from './src/onboarding/ProposedRulesScreen';
import ReferralScreen from './src/onboarding/ReferralScreen';
import WelcomeScreen from './src/onboarding/WelcomeScreen';
import MainApp from './src/main/MainApp';
import PersistentBackground from './src/components/PersistentBackground';
import { IntensityKey, ThemeKey } from './src/data/themes';
import { EMPTY_GOAL, GoalData } from './src/data/goal';
import { DEFAULT_STATE, loadState, PersistedState, saveState } from './src/data/store';
import { colors } from './src/theme';

type Stage =
  | 'loading'
  | 'splash'
  | 'eduDesigned'
  | 'eduWillpower'
  | 'onboarding'
  | 'momentum'
  | 'eduSpiral'
  | 'post'
  | 'trust'
  | 'goal'
  | 'theme'
  | 'groundRules'
  | 'appPicker'
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

  const patch = (partial: Partial<PersistedState>) => setPersisted((s) => ({ ...s, ...partial }));

  const name = answers.name?.value ?? '';
  const screentimeHours = SCREENTIME_HOURS[answers.screentime?.value ?? ''] ?? 4;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <PersistentBackground />
          <StatusBar style="light" />

          {stage === 'splash' && <SplashFlow onDone={() => setStage('eduDesigned')} />}

          {stage === 'eduDesigned' && (
            <EducationScreen slide="designed" onContinue={() => setStage('eduWillpower')} />
          )}

          {stage === 'eduWillpower' && (
            <EducationScreen slide="willpower" onContinue={() => setStage('onboarding')} />
          )}

          {stage === 'onboarding' && (
            <OnboardingFlow
              onComplete={(a) => {
                setAnswers(a);
                setStage('momentum');
              }}
            />
          )}

          {stage === 'momentum' && (
            <AffirmationScreen
              headline="Momentum unlocked."
              body="That's the first step to reclaiming your time. Now let's look at what it's actually costing you."
              onContinue={() => setStage('eduSpiral')}
            />
          )}

          {stage === 'eduSpiral' && <EducationScreen slide="spiral" onContinue={() => setStage('post')} />}

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
              onContinue={(k) => {
                setThemeKey(k);
                setStage('groundRules');
              }}
            />
          )}

          {stage === 'groundRules' && <GroundRulesScreen onContinue={() => setStage('appPicker')} />}

          {stage === 'appPicker' && <AppPickerScreen onContinue={() => setStage('intensity')} />}

          {stage === 'intensity' && (
            <IntensityScreen
              onContinue={(k) => {
                setIntensityKey(k);
                setStage('proposedRules');
              }}
            />
          )}

          {stage === 'proposedRules' && (
            <ProposedRulesScreen name={name} onContinue={() => setStage('futureSelf')} />
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

          {stage === 'benefits' && <BenefitsScreen onContinue={() => setStage('paywall')} />}

          {stage === 'paywall' && <PaywallScreen onContinue={() => setStage('trial')} />}

          {stage === 'trial' && <TrialTimelineScreen onStart={() => setStage('discount')} />}

          {stage === 'discount' && (
            <DiscountPaywallScreen
              onStart={() => setStage('referral')}
              onClose={() => setStage('referral')}
            />
          )}

          {stage === 'referral' && (
            <ReferralScreen onShare={() => setStage('welcome')} onSkip={() => setStage('welcome')} />
          )}

          {stage === 'welcome' && (
            <WelcomeScreen
              onDone={() => {
                patch({
                  onboardingComplete: true,
                  themeKey,
                  intensityKey,
                  futureSelfMessage,
                  goal,
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
