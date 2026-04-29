import process from 'node:process';
import type { MobilePlatform } from './config.js';
import { runSmoke } from './specs/smoke.js';

async function main() {
  const platform = process.argv[2] as MobilePlatform | undefined;
  const suite = process.argv[3] ?? 'smoke';

  if (platform !== 'android' && platform !== 'ios') {
    throw new Error('Usage: tsx src/run.ts <android|ios> [smoke]');
  }

  if (suite !== 'smoke') {
    throw new Error(`Unsupported suite "${suite}". Only "smoke" is implemented.`);
  }

  await runSmoke(platform);
  console.log(`[appium] ${platform} ${suite} suite passed`);
}

main().catch((error) => {
  console.error('[appium] test run failed');
  console.error(error);
  process.exitCode = 1;
});
