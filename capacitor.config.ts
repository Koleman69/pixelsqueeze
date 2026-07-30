import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for PixelSqueeze iOS.
 *
 * We ship compiled web assets from `dist/` inside the app bundle — this is
 * NOT a remote-URL WebView wrapper. Update appId to match your Apple
 * Developer team's bundle identifier before archiving.
 */
const config: CapacitorConfig = {
  appId: 'com.pixelsqueeze.app',
  appName: 'PixelSqueeze',
  webDir: 'dist',
  // No `server.url` — we intentionally bundle local assets so the app works
  // offline and passes App Store review as a real native app, not a webview
  // for a website.
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    preferredContentMode: 'mobile',
    // Content inset auto so pages respect the safe area under the notch /
    // Dynamic Island. CSS `env(safe-area-inset-*)` handles the rest.
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#FAFAFA',
  },
  android: {
    // Play Store builds must be release AABs; local device runs use debug.
    backgroundColor: '#FAFAFA',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Keep the WebView from being treated as a plain browser wrapper.
    appendUserAgent: 'PixelSqueezeAndroid',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#FAFAFA',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FAFAFA',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
    App: {
      // Custom URL scheme + associated domain both handled at runtime via the
      // App plugin's `appUrlOpen` listener. See src/lib/native.ts.
    },
  },
};

export default config;
