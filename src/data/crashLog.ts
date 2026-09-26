import { File, Paths } from 'expo-file-system';

/**
 * Records the last fatal JavaScript error to disk.
 *
 * ## Why this exists
 *
 * A JS exception in a Release build goes to `RCTFatal`, which aborts the
 * process. iOS writes a crash report, but that report only ever shows the
 * abort itself — `RCTExceptionsManager reportFatal` at the top of an Objective-C
 * stack — and never the JavaScript message or stack that caused it. Debugging
 * from it is guesswork.
 *
 * The alternative, attaching a console with `devicectl process launch
 * --console`, works but requires the crash to happen inside that session: kill
 * the app, background it, or lose the tunnel, and the evidence is gone.
 *
 * So the app writes the error down itself. The file survives the crash and can
 * be pulled afterwards with:
 *
 *   xcrun devicectl device copy from --domain-type appDataContainer \
 *     --domain-identifier com.abhay.phonewise --source Documents --destination ./out
 *
 * ## Constraints this has to respect
 *
 * The handler runs while the app is already dying, so it must be synchronous
 * (a promise never resolves — the process is gone), must not throw, and must
 * not depend on anything that might itself be broken. Hence a plain file write
 * wrapped in try/catch, and no logging, formatting or state beyond it.
 */

const LOG_NAME = 'byre-lasterror.txt';

/** Kept out of `models/` and the rest — a flat, obvious name to pull. */
function logFile(): File {
  return new File(Paths.document, LOG_NAME);
}

/** Write the error down. Never throws: a failure here must not become the
 *  thing that crashes the app during a crash. */
export function recordFatal(error: unknown, isFatal?: boolean): void {
  try {
    const err = error as { message?: string; stack?: string; name?: string } | undefined;
    const body = [
      `time: ${new Date().toISOString()}`,
      `fatal: ${isFatal ? 'yes' : 'no'}`,
      `name: ${err?.name ?? typeof error}`,
      `message: ${err?.message ?? String(error)}`,
      'stack:',
      err?.stack ?? '(none)',
      '',
      '────────────────────────────────────────',
      '',
    ].join('\n');

    // Overwrites rather than appends: reading the existing contents back is
    // async in this SDK, and nothing async completes inside a fatal handler —
    // the process is already going away. The latest error is the one we want.
    logFile().write(body);
  } catch {
    // Nothing sensible to do — we are already inside a fatal path.
  }
}

/**
 * Chains onto React Native's global handler rather than replacing it, so the
 * app still reports and terminates exactly as it did before. This only adds a
 * record on the way past; it deliberately does not swallow the error, because
 * an app that silently continues after a fatal is in an unknown state.
 */
export function installCrashLogger(): void {
  try {
    const utils = (globalThis as { ErrorUtils?: {
      getGlobalHandler: () => (e: unknown, f?: boolean) => void;
      setGlobalHandler: (h: (e: unknown, f?: boolean) => void) => void;
    } }).ErrorUtils;
    if (!utils) return;

    const previous = utils.getGlobalHandler();
    utils.setGlobalHandler((error, fatal) => {
      recordFatal(error, fatal);
      previous?.(error, fatal);
    });
  } catch {
    // A device without ErrorUtils just gets the old behaviour.
  }
}
