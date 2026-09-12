import { registerRootComponent } from 'expo';

import App from './App';
import { installCrashLogger } from './src/data/crashLog';

// Before anything else renders: a JS fatal in a Release build aborts the
// process and the iOS crash report keeps only the abort, never the JavaScript
// message. This writes that message to disk so it survives the crash.
installCrashLogger();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
