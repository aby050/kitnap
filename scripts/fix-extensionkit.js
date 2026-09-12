#!/usr/bin/env node
/**
 * Makes UsageReportExtension a real ExtensionKit extension.
 *
 * A DeviceActivityReport extension is ExtensionKit, not a classic
 * NSExtension. @kingstinct/expo-apple-targets has no target type for it, so
 * targets/UsageReport/expo-target.config.js borrows type "action" — which
 * emits a plain app-extension that lands in the bundle's PlugIns directory.
 * Two things then fail:
 *
 *   - `simctl install` refuses the app: "UsageReportExtension.appex is an
 *     ExtensionKit extension and must be embedded in the parent app bundle's
 *     Extensions directory, but is embedded in PlugIns."
 *   - App Store validation rejects the archive with a 409 for the same reason.
 *
 * This is a script rather than a config plugin because @bacons/apple-targets
 * writes project.pbxproj itself at the very end of prebuild — later than
 * withXcodeProject mods AND later than withDangerousMod, both of which were
 * tried and silently discarded. Nothing runs after prebuild, so that is where
 * the patch has to live.
 *
 * Run via `npm run prebuild:ios`, which chains it after expo prebuild.
 * Idempotent: a no-op when the project is already patched.
 */
const fs = require('fs');
const path = require('path');

const TARGET = 'UsageReportExtension';
const PBX = path.join(__dirname, '..', 'ios', 'Byre.xcodeproj', 'project.pbxproj');

if (!fs.existsSync(PBX)) {
  console.error(`fix-extensionkit: ${PBX} not found — run expo prebuild first.`);
  process.exit(1);
}

let s = fs.readFileSync(PBX, 'utf8');
if (s.includes('Embed ExtensionKit Extensions')) {
  console.log('fix-extensionkit: already patched, nothing to do.');
  process.exit(0);
}

const before = s;

// 1. The product is an ExtensionKit wrapper, not an app-extension one.
s = s.replace(
  new RegExp(`(/\\* ${TARGET}\\.appex \\*/ = \\{isa = PBXFileReference; explicitFileType = )"wrapper\\.app-extension"`),
  '$1"wrapper.extensionkit-extension"',
);

// 2. The target builds an ExtensionKit product.
s = s.replace(
  new RegExp(`(/\\* ${TARGET} \\*/ = \\{[\\s\\S]*?productType = )"com\\.apple\\.product-type\\.app-extension"`),
  '$1"com.apple.product-type.extensionkit-extension"',
);

// 3. Embedded in Extensions/, not PlugIns/. Lift the appex out of the shared
//    "Embed Foundation Extensions" phase (dstSubfolderSpec 13) into its own
//    ExtensionKit phase (16 + EXTENSIONS_FOLDER_PATH).
const embedLine = new RegExp(
  `^\\t*([0-9A-Za-z]+) /\\* ${TARGET}\\.appex in Embed Foundation Extensions \\*/,\\n`,
  'm',
);
const m = s.match(embedLine);
if (!m) {
  console.error('fix-extensionkit: could not find the embed entry — pbxproj layout changed.');
  process.exit(1);
}
const buildFileUuid = m[1];
s = s.replace(embedLine, '');

const phaseUuid = 'XXEXTKITPHASE00000000000000XX';
const phase = [
  `\t\t${phaseUuid} /* Embed ExtensionKit Extensions */ = {`,
  '\t\t\tisa = PBXCopyFilesBuildPhase;',
  '\t\t\tbuildActionMask = 2147483647;',
  '\t\t\tdstPath = "$(EXTENSIONS_FOLDER_PATH)";',
  '\t\t\tdstSubfolderSpec = 16;',
  '\t\t\tfiles = (',
  `\t\t\t\t${buildFileUuid} /* ${TARGET}.appex in Embed ExtensionKit Extensions */,`,
  '\t\t\t);',
  '\t\t\tname = "Embed ExtensionKit Extensions";',
  '\t\t\trunOnlyForDeploymentPostprocessing = 0;',
  '\t\t};',
  '',
].join('\n');

s = s.replace(/(\t\t[0-9A-Za-z]+ \/\* Embed Foundation Extensions \*\/ = \{)/, `${phase}$1`);
s = s.replace(
  new RegExp(`(${buildFileUuid} /\\* ${TARGET}\\.appex in )Embed Foundation Extensions( \\*/ = \\{isa = PBXBuildFile)`),
  '$1Embed ExtensionKit Extensions$2',
);
s = s.replace(
  /(\t\t\t\t[0-9A-Za-z]+ \/\* Embed Foundation Extensions \*\/,\n)/,
  `$1\t\t\t\t${phaseUuid} /* Embed ExtensionKit Extensions */,\n`,
);

if (s === before) {
  console.error('fix-extensionkit: nothing changed — patch did not apply.');
  process.exit(1);
}

fs.writeFileSync(PBX, s);
console.log('fix-extensionkit: UsageReportExtension is now an ExtensionKit extension.');
