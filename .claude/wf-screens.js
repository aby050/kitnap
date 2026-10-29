export const meta = {
  name: 'byre-screen-rebuild',
  description: 'Rebuild Kitnap core-loop screens on the new design system in parallel',
  phases: [{ title: 'Rebuild', detail: 'one agent per screen file' }],
};

// Shared, precise API digest so every agent uses the real primitive props and
// never invents new ones. Ground truth still lives in the files; agents are
// told to open them, but this stops drift.
const API = `
=== DESIGN SYSTEM API (import from these exact paths) ===

// src/design/tokens.ts
import { palette, type, space, radius, control, motion, gradients, dataRamp, numeric, fonts } from '../design/tokens';
palette: base surface surfaceRaised surfaceHigh surfaceInverse text textSecondary textTertiary textQuaternary textInverse hairline border borderStrong accent accentPressed accentSoft accentBorder warn warnSoft warnBorder danger dangerSoft dangerBorder glass glassPressed scrim
type (TextStyle presets): display title1 title2 title3 body bodyStrong callout sub caption overline hero unit editorial editorialStrong quote
  - hero = huge LIGHT-weight numeral (78pt). unit = small dim label beside it. NEVER bake a unit into the hero string.
space: xxs2 xs4 sm8 md12 base16 lg20 xl24 xxl32 xxxl40 huge48 gutter20 tabClearance116
radius: sm8 md12 base16 lg20 xl24 xxl28 pill999
control: lg56 md46 sm36 touch44
gradients: ground bloom light accent scrimTop
dataRamp: 5-stop low->high color array for usage/intensity data (mint -> coral)

// src/design/primitives.tsx
import { Screen, Card, Divider, Button, IconButton, Pill, ScreenHeader, SectionHeader, Row, Stat, Editorial, Ring, Meter, SegmentedControl, EmptyState, GlowField } from '../design/primitives';
<Screen edges?=['top'] bloom?=false> ...  // near-black ground + faint mint bloom. Wrap every screen.
<Card tone?='neutral'|'accent'|'warn'|'danger' raised?=false padded?=true onPress?>
<Button label onPress variant?='outline' size?='lg'|'md'|'sm' icon?=IconName iconRight?=IconName disabled? loading? full?=true haptic?=true>
  variants: primary(white fill, 1 per screen) | accent(mint fill, ONLY for starting a session) | outline(workhorse) | ghost(dismiss/skip) | danger(cost/delete)
<IconButton name onPress accessibilityLabel size?=20 color? bordered?>
<Pill label icon?=IconName tone?='neutral'|'accent'|'warn'|'danger' selected? onPress?>
<ScreenHeader title? onBack? right? subtitle?>   // for pushed/overlay screens
<SectionHeader title hint? actionLabel? onAction?>  // title renders as uppercase overline
<Row title subtitle? icon?=IconName iconColor? value? right? onPress? chevron? destructive?>
<Stat value unit? label? color? align?='flex-start'|'center' compact?>  // THE signature figure. value+unit split.
<Editorial lead emphasis? align?='left'|'center' color?=accent>  // dim italic serif + accent roman serif. app's VOICE. 1 per screen.
<Ring progress(0-1) size?=200 thickness?=5 color? track?>{children centered}</Ring>
<Meter progress(0-1) color? height?=6>
<SegmentedControl options={[{value,label}]} value onChange>  // tab switcher
<EmptyState icon=IconName title body actionLabel? onAction?>  // honest "nothing yet" state

// src/ui/Icon.tsx  — professional 24px line icons. NO EMOJI ANYWHERE.
import Icon, { IconName } from '../ui/Icon';
<Icon name=IconName size?=20 color?='#FFFFFF' strokeWidth?=1.7 opacity? />
IconName union: check checkCircle close closeCircle chevronLeft chevronRight chevronDown chevronUp arrowRight arrowUpRight plus minus more search filter refresh edit trash share info help alert shield shieldOff lock unlock key eye eyeOff clock timer hourglass calendar moon sun sunrise play pause stop skip sliders settings bell bellOff volume volumeOff headphones mic chart bars trendUp trendDown pulse target flame award note quote home grid list phone folder user camera image globe message card pin wallet math brainQuiz breathe activity tower leaf book mist heart

// src/ui/AppGlyph.tsx — neutral monogram tile standing in for an app icon (NO fake brand logos).
import AppGlyph from '../ui/AppGlyph';
<AppGlyph name packageName? size?=46 />

=== HARD RULES ===
1. NO EMOJI and NO hand-drawn/cartoon shapes anywhere. Every glyph is <Icon/> or <AppGlyph/>.
2. Do NOT change the component's default-export name, its prop names, or its prop types. MainApp wires these exact signatures — changing them breaks the build. You may only change what renders and the StyleSheet.
3. Delete every locally-declared color/font/size constant. Pull everything from tokens. No hex codes in the StyleSheet except via tokens.
4. Counters/timers/big numbers: use type.hero + type.unit, and apply the numeric ({fontVariant:['tabular-nums']}) style so digits don't jitter.
5. Preserve all real business logic (schedule math, progress calcs, date handling, token-cost flows, honest empty states). Only the presentation changes.
6. NO fake/hardcoded content (e.g. fixed "Facebook/Instagram/+2" tiles). Render only real data; if empty, use <EmptyState/>.
7. Keep react-native-reanimated entrance animations (FadeIn/FadeInDown) — they're good; just make them consistent (durations from motion tokens where practical).
8. Do NOT run any preview/dev server. Do NOT run tsc (the orchestrator does one typecheck at the end).
9. Read src/design/tokens.ts, src/design/primitives.tsx and src/ui/Icon.tsx before writing, to confirm exact APIs.
`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['file', 'signaturePreserved', 'emojiRemoved', 'summary'],
  properties: {
    file: { type: 'string' },
    signaturePreserved: { type: 'boolean', description: 'true if the export name and all prop names/types are unchanged' },
    emojiRemoved: { type: 'integer', description: 'count of emoji/glyph/fake-logo instances removed' },
    fakeContentRemoved: { type: 'string', description: 'what hardcoded/fake content was removed, if any' },
    summary: { type: 'string', description: 'one paragraph on the rebuild' },
  },
};

const tasks = [
  {
    label: 'HomeScreen',
    file: 'src/main/HomeScreen.tsx',
    brief: `Full redesign of the Home tab. It currently contains the worst offenders:
- CaveBackdrop(): a cartoon SVG of two cliffs + 13 hand-placed star <Circle>s — DELETE entirely.
- A fake retro LCD (lcdBezel/lcdScreen colors, "88:88" ghost digits, rotateX(-4deg) perspective tilt) — DELETE.
- A local AppIcon faking Facebook (blue circle + "f") and Instagram (gradient circle) — replace with <AppGlyph/>.
- <Text>⏸  Pause</Text> — an emoji in chrome. Use <Icon name="pause"/>.
- Screen-time bars using #FF6B6B — recolor via dataRamp.
Rebuild as a calm dashboard: a hero <Stat> or <Ring> for today's focus/time-reclaimed as the centerpiece (use the 'usage' prop and score/streakDays — do NOT invent numbers; if a value is 0 show it honestly), a start-a-session card using a <Button variant="accent">, the duration stepper (keep its logic but restyle with Icon plus/minus steppers), and the preset sections. An <Editorial> line can be the greeting/voice at top. Keep every prop in the signature. Home's "start" must call onStartFocus (do not navigate to a second timer concept). If you use PresetSections from ../components/PresetCard, that's fine — it's being fixed separately.`,
  },
  {
    label: 'TimerScreen',
    file: 'src/main/TimerScreen.tsx',
    brief: `Full redesign of the focus timer. It currently declares its OWN conflicting tokens (ORANGE='#E8642C', ORANGE_DIM, CARD_BG='#1c1c1e', SELECTED_BG, SELECTED_TEXT) — DELETE all of them, use tokens (mint accent, not orange). It has a big fontFamily:'monospace' LCD countdown — replace with type.hero + type.unit (e.g. value="24:59" unit="min left", tabular-nums). SelectAppIcon() renders emoji 👽(Reddit) 👻(Snapchat) 🕵️(incognito) ▶(YouTube) 𝕏(X) letter-d(TikTok) — replace ALL with <AppGlyph name={appName}/>. Keep the locked full-screen running mode, the close-button-costs-1-token confirm flow (onSpendTokenToCancel/onOpenTokenInfo), the shield button (onOpenShield), the Emergency button, and the slide-to-start -> "Select Apps to Block" modal logic. Use <Ring progress> around the countdown for the running state. Keep the exact prop signature.`,
  },
  {
    label: 'MyAppsScreen',
    file: 'src/main/MyAppsScreen.tsx',
    brief: `Full redesign of the "My apps" tab. AppIcon() hand-draws Facebook/Flipkart/Instagram/LinkedIn/Reddit/Gmail/Maps/Messages logos in SVG — DELETE, use <AppGlyph name packageName/>. glowOuterCircle uses a stray neon borderColor '#c6f850' — remove. FolderCard renders HARDCODED Facebook/Flipkart/Instagram icons + a "+2" tile regardless of what's actually blocked — this is FAKE CONTENT, remove it; render only the real blockedPackages (mapped via the existing appLabel()). If blockedPackages is empty, show <EmptyState icon="shield" .../>. PRESERVE scheduleStatus() and its wrap-past-midnight logic exactly, and RuleCard/schedule rendering — just restyle with Card/Row/SectionHeader. Keep intensityKey strictness label. Keep the exact prop signature (blockedPackages, intensityKey, onUnblockPackage, onOpenBlockedApps, onOpenSchedules, onOpenEssentials, onOpenBlocks, schedules).`,
  },
  {
    label: 'ReflectionScreen',
    file: 'src/main/ReflectionScreen.tsx',
    brief: `Redesign the Reflect tab on the design system. Replace the hand-rolled segment control with <SegmentedControl> (3 tabs: This week / Patterns / Your words). Replace heatColor()'s ad-hoc hexes (#ff8f6b/#ffd36b/#b6f5a0) with values from dataRamp. Render the four week stats with <Stat compact> inside <Card>s (a 2-col grid reads well). The per-day bars: keep the real dailySeries/peak/bestDay logic, restyle bars with dataRamp + rounded caps. "Your words" entries: render the user's typed text with type.quote inside a Card, keep relativeDay() and the honest outcome line (recolor via tokens, no stray #ffb08f). PRESERVE all the progress calculations and the honest empty states (they're a core principle — "no fake numbers"). Keep the exact prop signature (progress, gateReflections).`,
  },
  {
    label: 'GateScreen',
    file: 'src/shield/GateScreen.tsx',
    brief: `Read the file first to learn its props and flow, then redesign on the design system. This is the friction step between Shield and Grant (math/quiz/breathing challenge, or typing a reason). Purge any emoji -> <Icon/>. Use Screen, ScreenHeader (or a quiet top bar), Card, Button, and type.editorial for any voice/prompt line. Keep ALL challenge logic, answer validation, the reflection text input, and the emergency/break-glass path intact. Keep the exact export signature and prop types unchanged.`,
  },
  {
    label: 'GrantScreen',
    file: 'src/shield/GrantScreen.tsx',
    brief: `Read the file first, then redesign on the design system. This is the "access granted for N minutes" confirmation after passing the gate. Purge any emoji -> <Icon/>. Use a calm confirmation layout: a <Stat> or <Ring> for the granted minutes, a clear primary <Button>, type.editorial for any voice line. Keep the countdown/grant-minutes logic and all callbacks intact. Keep the exact export signature and prop types unchanged.`,
  },
  {
    label: 'EssentialsScreen',
    file: 'src/main/EssentialsScreen.tsx',
    brief: `The data changed: ESSENTIALS items no longer have a 'glyph' string; each now has 'mark' (an IconName). Update the rendering to <Icon name={e.mark} .../> and restyle the whole screen on the design system (Screen, ScreenHeader with onBack, Card, Row). Locked items (e.locked) should show a lock affordance (Icon name="lock" or a Pill). Keep e.note as the row subtitle. Keep the exact export signature and prop types.`,
  },
  {
    label: 'SoundScreen',
    file: 'src/main/SoundScreen.tsx',
    brief: `The data changed: SoundDef no longer has 'glyph' or 'sf'; each SOUNDS item now has 'mark' (an IconName). Find the AppIcon usage that passed sf={def.sf} fallback={def.glyph} and replace it with <Icon name={def.mark} size={24} color={...}/>. Restyle the whole screen on the design system (Screen, ScreenHeader, Card/Row, Button). Keep ALL audio playback logic (expo-audio/av, play/pause/loop, selection) intact. Keep the exact export signature and prop types.`,
  },
];

phase('Rebuild');
log(`Rebuilding ${tasks.length} screens in parallel on the new design system`);

const results = await parallel(
  tasks.map((t) => () =>
    agent(
      `You are a senior React Native engineer rebuilding ONE screen of the Kitnap app (Expo SDK 57, RN 0.86, TypeScript) on a brand-new design system. Work professionally and precisely.

TARGET FILE (rewrite this file only): ${t.file}

${t.brief}

${API}

Deliverable: rewrite ${t.file} in place using Edit/Write so it compiles against the APIs above and obeys every HARD RULE. Then return the structured result. Do not touch any other file.`,
      { label: t.label, phase: 'Rebuild', agentType: 'general-purpose', schema: SCHEMA },
    ),
  ),
);

return results.filter(Boolean);
