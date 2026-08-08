import { CapacitorConfig } from '@capacitor/cli'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const config: CapacitorConfig = {
  appId: 'shri.madhusudan.bapuji',
  appName: 'Shri Madhusudhan Bapuji',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 1000
    }
  }
}

export default config
