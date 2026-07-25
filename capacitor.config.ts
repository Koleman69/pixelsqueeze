import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pixelsqueeze.app',
  appName: 'PixelSqueeze',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    preferredContentMode: 'mobile',
    scrollIsBouncyEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;