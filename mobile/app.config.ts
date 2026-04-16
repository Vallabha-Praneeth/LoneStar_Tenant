import 'dotenv/config';
import type { ConfigContext, ExpoConfig } from '@expo/config';
import { Env } from './env';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: Env.name,
  slug: 'lonestar-tenant-mobile',
  scheme: Env.scheme,
  version: Env.version,
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  owner: Env.owner,
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow LoneStar Tenant Mobile to access your photo library for campaign proof uploads.',
        cameraPermission: 'Allow LoneStar Tenant Mobile to capture campaign proof photos.',
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: Env.bundleIdentifier,
  },
  android: {
    package: Env.packageName,
  },
  extra: {
    appEnv: Env.appEnv,
    eas: {
      projectId: Env.easProjectId,
    },
    supabase: {
      url: Env.supabaseUrl,
    },
  },
});
