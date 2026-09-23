import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ph.gabayanmobile.app',
  appName: 'gabayan-pwa',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 800, // Drop down from 3000ms to 800ms
      launchAutoHide: true,
      backgroundColor: '#ffffffff',
    },
  },
}

export default config
