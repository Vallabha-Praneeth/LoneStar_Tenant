const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';

const APP_VARIANTS = {
  development: {
    name: 'LoneStar Tenant Mobile',
    scheme: 'lonestar-tenant',
    bundleIdentifier: 'com.lonestar.tenantmobile',
    packageName: 'com.lonestar.tenantmobile',
  },
  preview: {
    name: 'LoneStar Tenant Preview',
    scheme: 'lonestar-tenant-preview',
    bundleIdentifier: 'com.lonestar.tenantmobile.preview',
    packageName: 'com.lonestar.tenantmobile.preview',
  },
  production: {
    name: 'LoneStar Tenant Mobile',
    scheme: 'lonestar-tenant',
    bundleIdentifier: 'com.lonestar.tenantmobile',
    packageName: 'com.lonestar.tenantmobile',
  },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const packageJson = require('./package.json');

if (!Object.prototype.hasOwnProperty.call(APP_VARIANTS, appEnv)) {
  throw new Error(
    `Unsupported EXPO_PUBLIC_APP_ENV: "${appEnv}". Expected one of: ${Object.keys(APP_VARIANTS).join(', ')}`
  );
}
const variant = APP_VARIANTS[appEnv];

const Env = {
  appEnv,
  owner: process.env.EXPO_OWNER ?? undefined,
  easProjectId: process.env.EAS_PROJECT_ID ?? undefined,
  version: packageJson.version,
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  ...variant,
};

module.exports = { Env };
