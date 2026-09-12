import { ThemeKey } from './themes';

/**
 * What the Shield says, and why it is never the same twice.
 *
 * The shield is the one screen a user meets every single day, often several
 * times a day. A fixed sentence stops being read after about a week — the eye
 * learns its shape and skips it, and the interrupt degrades into a button you
 * tap through. So the line rotates: a different one every time the shield
 * raises, drawn from a pool wide enough that a repeat is rare.
 *
 * Voice rules, same as everywhere else in the app:
 * - Never scold. The user opened the app; that is human, not a failure.
 * - Never invent a number. Nothing here claims a statistic, a streak, or a
 *   measurement — the app says only what it actually knows.
 * - Point outward. The strongest thing the screen can do is name something
 *   real that is happening off the phone: weather, light, a body, unfinished
 *   work, people in the next room.
 *
 * All lines are written for this app.
 */

export type ShieldMessage = {
  /** The setup, set in serif on the shield. */
  lead: string;
  /** The part that carries the weight — set in the serif emphasis pair.
   *  Omit for lines that work better as a single unbroken sentence. */
  emphasis?: string;
  /** Themes this suits. Omitted means it fits every theme. */
  themes?: ThemeKey[];
};

/**
 * The pool. Untagged lines are the backbone — they fit whoever the user is —
 * and the tagged ones sharpen toward the theme they picked at setup.
 */
export const SHIELD_MESSAGES: ShieldMessage[] = [
  // — Outside, weather, light ------------------------------------------------
  { lead: 'There is weather happening', emphasis: 'and you are missing it.' },
  { lead: 'The light outside is doing something', emphasis: 'it will not do again today.' },
  { lead: 'Go and look at the sky.', },
  { lead: 'Nothing in here', emphasis: 'has ever smelled like rain.' },
  { lead: 'The trees have been busy all week.', emphasis: 'You have not looked once.' },
  { lead: 'Somewhere close by there is moving water,', emphasis: 'and it is better than this.' },
  { lead: 'Step outside for the length of one song.', },
  { lead: 'The season is changing without you.', },

  // — The body ---------------------------------------------------------------
  { lead: 'Your eyes have been open on a screen', emphasis: 'for longer than they wanted.' },
  { lead: 'Stand up first.', emphasis: 'Then decide.', themes: ['health'] },
  { lead: 'Drink some water.', emphasis: 'Then decide.', themes: ['health'] },
  { lead: 'Your shoulders are somewhere near your ears.', themes: ['health'] },
  { lead: 'Take one slow breath', emphasis: 'before you take the next hour.' },
  { lead: 'Walk to the end of the road and back.', themes: ['health'] },

  // — Growth, the long game --------------------------------------------------
  { lead: 'Nothing worth having', emphasis: 'grew in a feed.' },
  { lead: 'Things that grow', emphasis: 'grow quietly, and slowly, and off-screen.' },
  { lead: 'A year from now this hour', emphasis: 'will have been one of two things.' },
  { lead: 'You are the only person', emphasis: 'who can spend this hour.' },
  { lead: 'Small and boring and daily', emphasis: 'is how anything is ever built.' },
  { lead: 'The version of you that you want', emphasis: 'is built out of afternoons like this one.' },
  { lead: 'Nobody is coming to give you the time back.', },

  // — The work ---------------------------------------------------------------
  { lead: 'The hard part of the work', emphasis: 'is the part you are standing in right now.', themes: ['deepWork', 'craft'] },
  { lead: 'You were in the middle of something', emphasis: 'that actually mattered.', themes: ['deepWork'] },
  { lead: 'Fifteen more minutes on it', emphasis: 'and you would have had it.', themes: ['deepWork', 'craft'] },
  { lead: 'Finish the thing', emphasis: 'you keep almost finishing.', themes: ['deepWork', 'craft'] },
  { lead: 'The work is not blocked.', emphasis: 'You are just not in it.', themes: ['deepWork'] },
  { lead: 'Make something today', emphasis: 'instead of watching people make things.', themes: ['craft'] },
  { lead: 'One page. One rep. One line.', emphasis: 'Then come back if you still want to.', themes: ['craft', 'learning'] },
  { lead: 'You wanted to be good at something.', emphasis: 'This is the boring middle of that.', themes: ['learning', 'craft'] },
  { lead: 'Read four pages of the thing you keep meaning to read.', themes: ['learning'] },

  // — People, presence -------------------------------------------------------
  { lead: 'There are people in your life', emphasis: 'who would take a phone call right now.', themes: ['presence'] },
  { lead: 'Whoever is in the next room', emphasis: 'is real, and here, and temporary.', themes: ['presence'] },
  { lead: 'Nobody in there', emphasis: 'will remember you were around.', themes: ['presence'] },
  { lead: 'Look up.', emphasis: 'Someone is probably talking to you.', themes: ['presence'] },
  { lead: 'Message one person you actually miss.', themes: ['presence'] },

  // — Rest, night ------------------------------------------------------------
  { lead: 'This is the hour', emphasis: 'that decides what tomorrow feels like.', themes: ['quiet', 'health'] },
  { lead: 'Tired is not the same as bored,', emphasis: 'and this fixes neither.', themes: ['quiet', 'health'] },
  { lead: 'Put it down and let the day end.', themes: ['quiet'] },
  { lead: 'Boredom is not an emergency.', emphasis: 'Sit in it for a minute.', themes: ['quiet'] },
  { lead: 'Quiet is not empty.', themes: ['quiet'] },

  // — Straight talk ----------------------------------------------------------
  { lead: 'You already know', emphasis: 'what is on the other side of this.' },
  { lead: 'It will be the same in an hour.', emphasis: 'You will not.' },
  { lead: 'You did not come here for anything.', emphasis: 'You came here out of habit.' },
  { lead: 'Ask what you were about to look for.', emphasis: 'If there is no answer, there is your answer.' },
  { lead: 'This is the moment you set this up for.', },
];

/**
 * Picks the line for one raising of the shield.
 *
 * Deterministic on purpose: the same shield re-rendering (a rotation, a state
 * change, a re-mount while the user reads it) must not swap the sentence out
 * mid-read. `seed` is what moves it on, not the render.
 *
 * The pool is filtered to the active theme first — a Deep Work user gets the
 * work lines, a Quiet user gets the night ones — with the untagged backbone
 * always in play so the voice never narrows to five sentences.
 */
export function pickShieldMessage(themeKey: ThemeKey | undefined, seed: number): ShieldMessage {
  const pool = SHIELD_MESSAGES.filter((m) => !m.themes || (themeKey && m.themes.includes(themeKey)));
  const list = pool.length > 0 ? pool : SHIELD_MESSAGES;
  // A stride coprime with most pool sizes walks the list instead of stepping
  // through it in order, so consecutive unlocks don't read as a list being
  // recited — while still never repeating until the pool is exhausted.
  const stride = 7;
  const index = Math.abs(Math.round(seed) * stride) % list.length;
  return list[index];
}

/**
 * The counter the rotation runs on.
 *
 * `unlockNumber` alone resets at midnight, so unlock 1 would say the same
 * thing every morning — the exact staleness this exists to avoid. Folding the
 * day in keeps it moving across days as well as within one.
 */
export function shieldMessageSeed(dayNumber: number, unlockNumber: number): number {
  return dayNumber * 97 + unlockNumber;
}
